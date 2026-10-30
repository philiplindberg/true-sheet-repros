import type { DetentInfoEventPayload, SheetDetent, TrueSheet } from '@lodev09/react-native-true-sheet'
import { useState, type ReactNode, type RefObject } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type ScreenProps = {
  title: string
  steps: string[]
  onBack: () => void
  children: ReactNode
}

// The page behind the sheet: the issue's steps above where the sheet rests, so they stay readable.
export function Screen({ title, steps, onBack, children }: ScreenProps) {
  return (
    <View style={styles.screen}>
      <Pressable
        style={styles.back}
        onPress={onBack}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      {steps.map((step, index) => (
        <Text
          key={step}
          style={styles.step}
        >
          {index + 1}. {step}
        </Text>
      ))}
      {children}
    </View>
  )
}

type ButtonProps = {
  label: string
  onPress: () => void
}

export function Button({ label, onPress }: ButtonProps) {
  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

// Leaving a screen dismisses its sheet first: on iOS, a presented sheet stays up after it unmounts.
export async function leave(sheet: RefObject<TrueSheet | null>, onBack: () => void) {
  await sheet.current?.dismiss()
  onBack()
}

// The detent the sheet last reported settling at, logged as `[repro]` for logcat and the Xcode console.
export function useDetent(detents: SheetDetent[]) {
  const [settled, setSettled] = useState<DetentInfoEventPayload | null>(null)
  const onSettle = (event: { nativeEvent: DetentInfoEventPayload }) => {
    const { index } = event.nativeEvent
    console.log(`[repro] settled at index ${index} (${format(detents[index])})`)
    setSettled(event.nativeEvent)
  }
  const readout = settled
    ? `Settled at index ${settled.index}: ${format(detents[settled.index])}`
    : 'Not presented yet'
  return { onSettle, readout }
}

export function Readout({ children }: { children: string }) {
  return <Text style={styles.readout}>{children}</Text>
}

export function format(detent: SheetDetent | undefined) {
  if (detent === undefined) return 'none'
  return typeof detent === 'number' ? String(detent) : `'${detent}'`
}

export function formatDetents(detents: SheetDetent[]) {
  return `[${detents.map(format).join(', ')}]`
}

// A strip at the top of the sheet to drag by, clear of any scroll view.
export function Handle({ label }: { label: string }) {
  return (
    <View style={styles.handle}>
      <Text style={styles.handleText}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
    gap: 6,
    backgroundColor: '#fff',
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backText: {
    fontSize: 17,
    color: '#0a66d8',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  step: {
    fontSize: 14,
    color: '#333',
  },
  readout: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#b3261e',
  },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#0a66d8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  handle: {
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  handleText: {
    fontSize: 17,
    fontWeight: '600',
  },
})
