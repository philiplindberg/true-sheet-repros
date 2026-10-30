import { TrueSheet, type SheetDetent } from '@lodev09/react-native-true-sheet'
import { useRef, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'

import { Button, formatDetents, Handle, leave, Readout, Screen, useDetent } from './screen'

const DETENTS: SheetDetent[] = [0.45, 1]
const ROWS = Array.from({ length: 20 }, (_, index) => index)
const COLORS = ['#f4a261', '#2a9d8f', '#e76f51', '#264653', '#e9c46a']

export function LayoutScreen({ onBack }: { onBack: () => void }) {
  const sheet = useRef<TrueSheet>(null)
  const scroll = useRef<FlatList<number>>(null)
  const [bottomBar, setBottomBar] = useState(false)
  const { onSettle, readout } = useDetent(DETENTS)

  return (
    <Screen
      title="#997 Every frame lays out the content"
      steps={[
        'Flick the sheet up and down quickly between its detents, from the strip at its top.',
        'Android: every frame of the drag and settle lays out the sheet content again (scripts/measure.ts counts them).',
        'The bottom bar, laid out with flex, is what a per-frame size keeps at the visible bottom.',
      ]}
      onBack={() => void leave(sheet, onBack)}
    >
      <Button
        label={bottomBar ? 'Hide bottom bar' : 'Show bottom bar'}
        onPress={() => setBottomBar(!bottomBar)}
      />
      <Readout>{readout}</Readout>
      <TrueSheet
        ref={sheet}
        detents={DETENTS}
        initialDetentIndex={0}
        dismissible={false}
        dimmed={false}
        backgroundColor="#fff"
        style={styles.sheet}
        scrollableRef={scroll}
        onDidPresent={onSettle}
        onDetentChange={onSettle}
      >
        <View style={styles.content}>
          <Handle label={`Detents ${formatDetents(DETENTS)}, ${ROWS.length} rows`} />
          <FlatList
            ref={scroll}
            style={styles.list}
            data={ROWS}
            keyExtractor={String}
            renderItem={({ item }) => <Row index={item} />}
          />
          {bottomBar && (
            <View style={styles.bottomBar}>
              <Text style={styles.bottomBarText}>Bottom bar</Text>
            </View>
          )}
        </View>
      </TrueSheet>
    </Screen>
  )
}

// A row shaped like a list app's: a thumbnail, two lines of text, a few tags, and a value.
function Row({ index }: { index: number }) {
  return (
    <View style={styles.row}>
      <View style={[styles.thumbnail, { backgroundColor: COLORS[index % COLORS.length] }]} />
      <View style={styles.middle}>
        <Text
          style={styles.rowTitle}
          numberOfLines={1}
        >
          Row {index + 1}
        </Text>
        <Text
          style={styles.rowSubtitle}
          numberOfLines={1}
        >
          A second line of text, long enough to be cut off at the edge
        </Text>
        <View style={styles.tags}>
          {['One', 'Two', 'Three'].map((tag) => (
            <View
              key={tag}
              style={styles.tag}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.value}>
        <Text style={styles.valueText}>{(index * 37) % 100}</Text>
        <Text style={styles.valueUnit}>km</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#eef2f7',
  },
  tagText: {
    fontSize: 11,
    color: '#345',
  },
  value: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  valueUnit: {
    fontSize: 11,
    color: '#666',
  },
  bottomBar: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a66d8',
  },
  bottomBarText: {
    color: '#fff',
    fontWeight: '600',
  },
})
