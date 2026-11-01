/**
 * Dev-only QA control for the demo's master clock: pause / play, jump to any
 * beat, step by 50 ms, and scrub along a bar covering one loop. The current
 * time is shown (and exposed to UI automation as the readout's label).
 *
 * Collapsed to a small button until tapped. Rendered only when __DEV__ is
 * true, so release builds never include it.
 */
import React, { useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { runOnJS, useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import { demo } from './tokens';

interface Props {
  elapsed: SharedValue<number>;
  paused: SharedValue<boolean>;
}

const BEATS = Object.values(demo.beats);
const BAR_WIDTH = 200;
const STEP = 0.05;

export function DebugScrubber({ elapsed, paused }: Props) {
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [open, setOpen] = useState(false);

  useAnimatedReaction(
    () => Math.round((elapsed.value % demo.loop) * 100) / 100,
    (t, prev) => {
      if (t !== prev) runOnJS(setTime)(t);
    },
  );

  const setT = (t: number) => {
    elapsed.set(Math.max(0, Math.min(demo.loop - 0.001, t)));
  };
  const pause = (p: boolean) => {
    paused.set(p);
    setIsPaused(p);
  };

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      pause(true);
      setT((e.nativeEvent.locationX / BAR_WIDTH) * demo.loop);
    },
    onPanResponderMove: (e) => setT((e.nativeEvent.locationX / BAR_WIDTH) * demo.loop),
  });

  if (!open) {
    // Collapsed by default: a small button, so layout and screenshots are unaffected.
    return (
      <Pressable accessibilityLabel="debug-open" onPress={() => setOpen(true)} style={styles.toggle}>
        <Text style={styles.label}>⏱</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.anchor}>
    <View style={styles.panel}>
      <View style={styles.row}>
        <Pressable accessibilityLabel="debug-close" onPress={() => setOpen(false)} style={styles.btn}>
          <Text style={styles.label}>×</Text>
        </Pressable>
        <Pressable accessibilityLabel={isPaused ? 'debug-play' : 'debug-pause'} onPress={() => pause(!isPaused)} style={styles.btn}>
          <Text style={styles.label}>{isPaused ? '▶' : '❚❚'}</Text>
        </Pressable>
        <Pressable accessibilityLabel="debug-back" onPress={() => { pause(true); setT(time - STEP); }} style={styles.btn}>
          <Text style={styles.label}>−</Text>
        </Pressable>
        <Pressable accessibilityLabel="debug-forward" onPress={() => { pause(true); setT(time + STEP); }} style={styles.btn}>
          <Text style={styles.label}>+</Text>
        </Pressable>
        {BEATS.map((b, i) => (
          <Pressable key={i} accessibilityLabel={`debug-beat-${i + 1}`} onPress={() => setT(b)} style={styles.btn}>
            <Text style={styles.label}>{i + 1}</Text>
          </Pressable>
        ))}
        <Text accessibilityLabel={`debug-time-${time.toFixed(2)}`} style={styles.readout}>{time.toFixed(2)}s</Text>
      </View>
      <View accessibilityLabel="debug-bar" style={styles.bar} {...responder.panHandlers}>
        <View style={[styles.fill, { width: (time / demo.loop) * BAR_WIDTH }]} />
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(20,20,28,0.55)', alignItems: 'center', justifyContent: 'center' },
  // Open, the panel floats over the screen instead of pushing the layout.
  anchor: { width: 28, height: 28, zIndex: 10 },
  panel: { position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(20,20,28,0.78)', borderRadius: 10, padding: 6, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btn: { minWidth: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  readout: { color: '#FFFFFF', fontSize: 11, marginLeft: 4, fontVariant: ['tabular-nums'] },
  bar: { width: BAR_WIDTH, height: 18, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#7B6BE0' },
});
