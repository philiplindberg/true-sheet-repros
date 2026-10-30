// Flicks the #997 sheet up and down with `adb shell input swipe` while tracing, then reports how long
// the app's main thread took over each frame it drew (`Choreographer#doFrame` with a `traversal`),
// how many of those frames mounted a layout update, and how many frames were dropped between them.
//
// Open the app's "#997 Layout on every frame" screen with the sheet at 0.45 first, then run:
//   bun scripts/measure.ts [rounds]
// Set ANDROID_SERIAL to pick a device. Coordinates are for a 1080 × 2400 screen (Pixel 8).

import { $ } from 'bun'

const PACKAGE = 'com.philiplindberg.truesheetrepros'
const ROUNDS = Number(process.argv[2] ?? 6)
const X = 540
// The strip at the top of the sheet: at 0.45, and at 1.
const LOW_Y = 1340
const HIGH_Y = 220
// A down flick as quick as the up one is let go of short of halfway while tracing slows the app, and
// settles back at the top (#995).
const UP_MS = 60
const DOWN_MS = 150
const SETTLE_MS = 1200
// One frame at 120 Hz.
const VSYNC_MS = 1000 / 120
// Drawn frames further apart than this are in different gestures, not a run of dropped frames.
const GESTURE_GAP_MS = 40
const CATEGORIES = ['gfx', 'view', 'input']

type Frame = {
  start: number
  duration: number
  layout: boolean
}

async function main() {
  const pid = (await $`adb shell pidof ${PACKAGE}`.text()).trim()
  if (!pid) throw new Error(`${PACKAGE} isn't running`)

  if ((await settledIndex()) !== 0) throw new Error('Start with the sheet at 0.45')
  await $`adb shell atrace --async_start -b 65536 -a ${PACKAGE} ${CATEGORIES}`.quiet()
  for (let round = 0; round < ROUNDS; round++) {
    await flick(LOW_Y, HIGH_Y, UP_MS, 1)
    await flick(HIGH_Y, LOW_Y, DOWN_MS, 0)
  }
  const trace = await $`adb shell atrace --async_stop -b 65536 -a ${PACKAGE} ${CATEGORIES}`.text()

  const frames = drawnFrames(trace, pid)
  if (frames.length === 0) throw new Error('No drawn frames on the main thread')
  const durations = frames.map((frame) => frame.duration).sort((a, b) => a - b)
  console.log(`${ROUNDS} rounds of a flick up and a flick down: ${frames.length} drawn frames, ${frames.filter((frame) => frame.layout).length} with a layout update`)
  console.log(`  main thread per frame: ${summary(durations)}`)
  console.log(`    with a layout update: ${summary(frames.filter((frame) => frame.layout).map((frame) => frame.duration).sort((a, b) => a - b))}`)
  console.log(`    without: ${summary(frames.filter((frame) => !frame.layout).map((frame) => frame.duration).sort((a, b) => a - b))}`)
  console.log(`  frames over ${VSYNC_MS.toFixed(1)} ms: ${durations.filter((ms) => ms > VSYNC_MS).length}`)
  console.log(`  dropped frames: ${dropped(frames)}`)
}

async function flick(fromY: number, toY: number, ms: number, index: number) {
  await $`adb shell input swipe ${X} ${fromY} ${X} ${toY} ${ms}`.quiet()
  await Bun.sleep(SETTLE_MS)
  const settled = await settledIndex()
  if (settled !== index) {
    await $`adb shell atrace --async_stop -b 65536 -a ${PACKAGE} ${CATEGORIES}`.quiet()
    throw new Error(`A flick to index ${index} settled at index ${settled}; the run is void`)
  }
}

// The detent index the app last logged the sheet settling at.
async function settledIndex() {
  const log = await $`adb logcat -d -s ReactNativeJS`.text()
  const matches = [...log.matchAll(/\[repro\] settled at index (\d+)/g)]
  const last = matches[matches.length - 1]
  return last ? Number(last[1]) : null
}

// Each `Choreographer#doFrame` on the main thread, whose thread ID is the process ID, that drew.
function drawnFrames(trace: string, pid: string) {
  const open: { name: string; start: number; children: string[] }[] = []
  const frames: Frame[] = []
  for (const line of trace.split('\n')) {
    const match = line.match(/-(\d+)\s+(?:\(\s*[\d-]+\)\s+)?\[\d+\]\s+\S+\s+([\d.]+): tracing_mark_write: ([BE])\|(\d+)\|?(.*)$/)
    if (!match) continue
    const [, tid, seconds, kind, , name] = match
    if (tid !== pid) continue
    const time = Number(seconds) * 1000
    if (kind === 'B') {
      for (const slice of open) slice.children.push(name)
      open.push({ name, start: time, children: [] })
      continue
    }
    const slice = open.pop()
    if (!slice?.name.startsWith('Choreographer#doFrame') || !slice.children.includes('traversal')) continue
    frames.push({
      start: slice.start,
      duration: time - slice.start,
      layout: slice.children.some((child) => child.includes('UPDATE_LAYOUT')),
    })
  }
  return frames
}

// Vsyncs skipped between drawn frames of one gesture.
function dropped(frames: Frame[]) {
  let count = 0
  for (let index = 1; index < frames.length; index++) {
    const gap = frames[index].start - frames[index - 1].start
    if (gap < GESTURE_GAP_MS) count += Math.max(0, Math.round(gap / VSYNC_MS) - 1)
  }
  return count
}

function summary(sorted: number[]) {
  if (sorted.length === 0) return 'none'
  return `${sorted.length} frames, median ${percentile(sorted, 0.5).toFixed(1)} ms, 90th percentile ${percentile(sorted, 0.9).toFixed(1)} ms, max ${sorted[sorted.length - 1].toFixed(1)} ms`
}

function percentile(sorted: number[], fraction: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]
}

await main()
