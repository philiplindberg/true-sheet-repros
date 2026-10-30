# TrueSheet 4.0.0 repros

Minimal reproductions for three issues on [`@lodev09/react-native-true-sheet`](https://github.com/lodev09/react-native-true-sheet) 4.0.0, one screen each:

- [#995](https://github.com/lodev09/react-native-true-sheet/issues/995): [Android] a downward fling between detents settles back unless released past halfway.
- [#997](https://github.com/lodev09/react-native-true-sheet/issues/997): [Android] dragging or settling a sheet lays out its React content on every frame.
- [#998](https://github.com/lodev09/react-native-true-sheet/issues/998): changing detents keeps the detent index, not the detent, so the sheet jumps.

Expo SDK 58, React Native 0.88, new architecture, `@lodev09/react-native-true-sheet@4.0.0` with no patches. The app is Expo's blank TypeScript template plus TrueSheet; nothing else is added.

## Running

```bash
bun install
bun run android   # or: bun run ios
```

Both make a debug build and start Metro on port 8082. For the #997 measurement, use a release build instead, which needs no Metro:

```bash
bun run android:release
```

Each screen shows the detent the sheet last reported through `onDidPresent` and `onDetentChange`, and logs it as `[repro] settled at index …` (logcat tag `ReactNativeJS` on Android). Drag each sheet by the strip at its top, which is clear of any scroll view.

## #995: a downward fling settles back (Android)

Every sheet is `dismissible={false}` and `dimmed={false}`.

Screen "#995 Fling between two detents", `[0.45, 1]`:

1. Drag the sheet up to the top.
2. Fling it down quickly, a short way.

Expected: it settles at `0.45`, as it does on iOS. On Android it settles back at `1` unless it's released past halfway.

Screen "#995 Fling between three detents", `['peek', 0.45, 1]` (the sheet rests at `0.45`):

1. Fling it down quickly, a short way.

Expected: it settles at `'peek'`. On Android it settles back at `0.45`.

On a Pixel 8 (Android 17), each of these settled back three times out of three:

```bash
# Two detents, at the top: 380 px down in 50 ms
adb shell input swipe 540 220 540 600 50
# Three detents, at 0.45: 310 px down in 50 ms
adb shell input swipe 540 1340 540 1650 50
```

## #997: every frame lays out the content (Android)

Screen "#997 Layout on every frame": detents `[0.45, 1]`, a `FlatList` of 20 rows (each a thumbnail, two lines of text, three tags and a value) wired up through `scrollableRef`, and a "Show bottom bar" button that adds a bar below the list, laid out with flex.

While the sheet is dragged or settling, `handleSlide` calls `updateStateDimensionsForPosition(sheetView.top)` on every frame. Each new height is a Fabric state update, so the main thread lays out the content again and mounts `UPDATE_LAYOUT` for it in the same frame. The bottom bar shows what that buys: it stays at the visible bottom of the sheet throughout the move.

### Measuring it

[`scripts/measure.ts`](scripts/measure.ts) flicks the sheet up and down with `adb shell input swipe` while `atrace` records `gfx`, `view` and `input`. For each frame the app drew (a main-thread `Choreographer#doFrame` with a `traversal`), it reports the main thread's time, whether that frame mounted a layout update, and how many vsyncs were skipped between drawn frames of one gesture. After every flick it checks the sheet settled at the detent it was flung to, and voids the run if not.

1. `bun run android:release`, open "#997 Layout on every frame", and leave the sheet at `0.45`.
2. `bun scripts/measure.ts` (six rounds of a flick up and a flick down; coordinates are for a 1080 × 2400 screen).

To measure the change from the issue, edit `node_modules/@lodev09/react-native-true-sheet/android/src/main/java/com/lodev09/truesheet/TrueSheetViewController.kt` so `handleSlide` sizes the content to the tallest the sheet gets while it moves when there's no footer, then rebuild:

```kotlin
if (interactionState is InteractionState.Dragging || pendingDetentIndex >= 0) {
  if (containerView?.footerView == null) {
    setStateDimensions(getStateWidth(), realScreenHeight - topInset)
  } else {
    updateStateDimensionsForPosition(sheetView.top)
  }
}
```

### Results

Pixel 8, Android 17, 120 Hz, release build, bottom bar hidden. Three runs of 12 flicks each; ranges across the runs.

| | 4.0.0 | With the change |
|---|---|---|
| Drawn frames that lay out the content | 263–273 of 275–285 | 12 of 301–308 |
| Main thread per drawn frame, median | 3.4–3.9 ms | 1.3 ms |
| Main thread per drawn frame, 90th percentile | 5.0–5.7 ms | 2.6–2.9 ms |
| Drawn frames over 8.3 ms | 10–11 | 7–11 |
| Dropped frames | 51–55 | 25–33 |

With the bottom bar shown, 4.0.0 measured the same (median 3.3–3.4 ms, 50–57 dropped frames).

With the change, the 12 frames that still lay out are the one layout per gesture, at 10–17 ms each. That's why the count of frames over 8.3 ms doesn't fall, while the main thread's time per frame and the dropped frames roughly halve.

The change has a cost: content laid out against the sheet's height is laid out at the full height while the sheet moves. With "Show bottom bar" on and the change applied, the bar is below the bottom of the screen while the sheet is dragged, and comes back when it settles.

## #998: changing detents moves the sheet (iOS and Android)

Screen "#998 Changing detents". The sheet presents at `0.45`, index 0 of `[0.45, 1]`.

1. Tap "Add peek". The detents become `['peek', 0.45, 1]`. Expected: the sheet stays at `0.45`, now index 1. Actual: it keeps index 0 and drops to `'peek'`.
2. Tap "Resize to 0.45" (index 1), then "Remove peek". The detents are `[0.45, 1]` again. Expected: the sheet stays at `0.45`. Actual: it keeps index 1 and rises to `1`.

Seen on a Pixel 8 (Android 17) and the iPhone 18 Pro simulator (iOS 27). Neither move fires `onDetentChange`, so the readout and the log go on naming the old index.
