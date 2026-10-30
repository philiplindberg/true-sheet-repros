import { TrueSheet, type SheetDetent } from '@lodev09/react-native-true-sheet'
import { useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Button, format, formatDetents, Handle, leave, Readout, Screen, useDetent } from './screen'

const WITHOUT_PEEK: SheetDetent[] = [0.45, 1]
const WITH_PEEK: SheetDetent[] = ['peek', 0.45, 1]

export function KeepDetentScreen({ onBack }: { onBack: () => void }) {
  const sheet = useRef<TrueSheet>(null)
  const [peek, setPeek] = useState(false)
  const detents = peek ? WITH_PEEK : WITHOUT_PEEK
  const { onSettle, readout } = useDetent(detents)

  return (
    <Screen
      title="#998 Changing detents moves the sheet"
      steps={[
        'The sheet rests at 0.45, index 0 of [0.45, 1].',
        "Add peek: the detents become ['peek', 0.45, 1]. Expected: it stays at 0.45, now index 1. Actual: it keeps index 0 and drops to 'peek'.",
        'Resize to 0.45, then remove peek. Expected: it stays at 0.45. Actual: it keeps index 1 and rises to 1.',
      ]}
      onBack={() => void leave(sheet, onBack)}
    >
      <View style={styles.buttons}>
        <Button
          label={peek ? 'Remove peek' : 'Add peek'}
          onPress={() => setPeek(!peek)}
        />
        <Button
          label="Resize to 0.45"
          onPress={() => void sheet.current?.resize(detents.indexOf(0.45))}
        />
      </View>
      <Readout>{readout}</Readout>
      <TrueSheet
        ref={sheet}
        detents={detents}
        initialDetentIndex={0}
        dismissible={false}
        dimmed={false}
        backgroundColor="#fff"
        onDidPresent={onSettle}
        onDetentChange={onSettle}
      >
        <Handle label={`Detents ${formatDetents(detents)}`} />
        <Text style={styles.body}>0.45 is at index {detents.indexOf(0.45)}; {format(detents[0])} at index 0.</Text>
      </TrueSheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  body: {
    padding: 20,
    color: '#555',
  },
})
