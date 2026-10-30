import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { FlingScreen } from './src/fling'
import { KeepDetentScreen } from './src/keep-detent'
import { LayoutScreen } from './src/layout'

const SCREENS = [
  {
    key: 'fling-two',
    title: '#995 Fling between two detents',
    platforms: 'Android',
    Screen: ({ onBack }: { onBack: () => void }) => (
      <FlingScreen
        variant="two"
        onBack={onBack}
      />
    ),
  },
  {
    key: 'fling-three',
    title: '#995 Fling between three detents',
    platforms: 'Android',
    Screen: ({ onBack }: { onBack: () => void }) => (
      <FlingScreen
        variant="three"
        onBack={onBack}
      />
    ),
  },
  {
    key: 'layout',
    title: '#997 Layout on every frame',
    platforms: 'Android',
    Screen: LayoutScreen,
  },
  {
    key: 'keep-detent',
    title: '#998 Changing detents',
    platforms: 'iOS and Android',
    Screen: KeepDetentScreen,
  },
] as const

type ScreenKey = (typeof SCREENS)[number]['key']

export function App() {
  const [open, setOpen] = useState<ScreenKey | null>(null)
  const screen = SCREENS.find((each) => each.key === open)

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {screen ? (
        <screen.Screen onBack={() => setOpen(null)} />
      ) : (
        <View style={styles.home}>
          <Text style={styles.title}>TrueSheet 4.0.0 repros</Text>
          {SCREENS.map((each) => (
            <Pressable
              key={each.key}
              style={styles.link}
              onPress={() => setOpen(each.key)}
            >
              <Text style={styles.linkTitle}>{each.title}</Text>
              <Text style={styles.linkPlatforms}>{each.platforms}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  home: {
    paddingTop: 80,
    paddingHorizontal: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  link: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#eef2f7',
  },
  linkTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  linkPlatforms: {
    marginTop: 2,
    color: '#555',
  },
})
