import { TrueSheet } from '@lodev09/react-native-true-sheet'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'

import { Button, Handle, leave, Screen } from './screen'

// How long the child stays up before a cycle dismisses it, and how long the parent rests before it comes up again.
const UP_MS = 250
const DOWN_MS = 700

// A sheet stacked over a sheet that stays presented under it, as a form over a list.
export function StackedScreen({ onBack }: { onBack: () => void }) {
  const parent = useRef<TrueSheet>(null)
  const child = useRef<TrueSheet>(null)
  const [grows, setGrows] = useState(false)
  const [open, setOpen] = useState(false)
  const [grown, setGrown] = useState(false)
  const [dismissals, setDismissals] = useState(0)
  // Cycles left to run, each presenting the child and dismissing it by code a moment after it's up.
  const cycles = useRef(0)
  useEffect(() => {
    if (open) void child.current?.present()
  }, [open])

  return (
    <Screen
      title="Stacked sheets: the parent goes missing"
      steps={[
        'Turn on "Child content grows once presented".',
        'Tap "Cycle 10 times".',
        'Expected: the parent sheet is there as soon as the child slides off it. Actual: it is missing for several frames each time, then pops back. With the switch off, it is there at once.',
      ]}
      onBack={() => void leave(parent, onBack)}
    >
      <View style={styles.option}>
        <Switch
          value={grows}
          onValueChange={setGrows}
        />
        <Text>Child content grows once presented</Text>
      </View>
      <Button
        label="Cycle 10 times"
        onPress={() => {
          cycles.current = 10
          setOpen(true)
        }}
      />
      <Text style={styles.count}>Dismissals: {dismissals}</Text>
      <TrueSheet
        ref={parent}
        detents={['auto', 1]}
        initialDetentIndex={0}
        dismissible={false}
        dimmed={false}
        draggable={false}
        grabber={false}
      >
        <Handle label="Parent" />
        <View style={styles.body}>
          <Text style={styles.text}>The parent sheet, presented all along.</Text>
          <Button
            label="Open the child sheet"
            onPress={() => setOpen(true)}
          />
        </View>
      </TrueSheet>
      <TrueSheet
        ref={child}
        detents={[1]}
        backgroundColor="#f2f2f7"
        onDidPresent={() => {
          if (grows) setGrown(true)
          if (cycles.current > 0) setTimeout(() => void child.current?.dismiss(), UP_MS)
        }}
        onDidDismiss={() => {
          setOpen(false)
          setGrown(false)
          setDismissals((count) => count + 1)
          if (cycles.current > 0 && --cycles.current > 0) setTimeout(() => setOpen(true), DOWN_MS)
        }}
      >
        {open && (
          <View>
            <Handle label="Child: swipe down" />
            {grown && <View style={styles.grown} />}
            {Array.from({ length: 12 }, (_, index) => (
              <Text
                key={index}
                style={styles.row}
              >
                Row {index + 1}
              </Text>
            ))}
          </View>
        )}
      </TrueSheet>
    </Screen>
  )
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  count: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    padding: 20,
    gap: 12,
  },
  text: {
    color: '#555',
  },
  grown: {
    height: 40,
  },
  row: {
    padding: 16,
    fontSize: 16,
  },
})
