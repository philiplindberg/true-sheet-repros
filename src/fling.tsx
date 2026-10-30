import { TrueSheet, type SheetDetent } from '@lodev09/react-native-true-sheet'
import { useRef } from 'react'
import { StyleSheet, Text } from 'react-native'

import { formatDetents, Handle, leave, Readout, Screen, useDetent } from './screen'

const VARIANTS: Record<'two' | 'three', { detents: SheetDetent[]; start: number; steps: string[] }> = {
  two: {
    detents: [0.45, 1],
    start: 0,
    steps: [
      'Drag the sheet up to the top.',
      'Fling it down quickly, a short way, from the strip at its top.',
      'Expected: it settles at 0.45. Android: it settles back at 1 unless released past halfway.',
    ],
  },
  three: {
    detents: ['peek', 0.45, 1],
    start: 1,
    steps: [
      'The sheet rests at 0.45.',
      'Fling it down quickly, a short way, from the strip at its top.',
      "Expected: it settles at 'peek'. Android: it settles back at 0.45.",
    ],
  },
}

type FlingScreenProps = {
  variant: keyof typeof VARIANTS
  onBack: () => void
}

export function FlingScreen({ variant, onBack }: FlingScreenProps) {
  const sheet = useRef<TrueSheet>(null)
  const { detents, start, steps } = VARIANTS[variant]
  const { onSettle, readout } = useDetent(detents)

  return (
    <Screen
      title="#995 A downward fling settles back"
      steps={steps}
      onBack={() => void leave(sheet, onBack)}
    >
      <Readout>{readout}</Readout>
      <TrueSheet
        ref={sheet}
        detents={detents}
        initialDetentIndex={start}
        dismissible={false}
        dimmed={false}
        backgroundColor="#fff"
        onDidPresent={onSettle}
        onDetentChange={onSettle}
      >
        <Handle label={`Detents ${formatDetents(detents)}`} />
        <Text style={styles.body}>Fling from the strip above.</Text>
      </TrueSheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: {
    padding: 20,
    color: '#555',
  },
})
