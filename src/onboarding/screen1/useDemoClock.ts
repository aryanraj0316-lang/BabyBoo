/**
 * The demo's one master clock. A single shared value on the UI thread, moved
 * forward by the frame callback; everything in the scene is derived from it
 * through `sceneAt`, so no part of the demo keeps its own timer.
 *
 * - Holds at 0 (the first frame of Beat 1) until `ready`.
 * - Pauses while the app is in the background and resumes where it was.
 * - Reduced motion: parks on the composed still, with living motion off.
 * - `paused` lets the dev scrubber stop it and set `elapsed` by hand.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { runOnJS, useAnimatedReaction, useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { sceneAt } from './timeline';
import { demo } from './tokens';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduced(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

export function useDemoClock(ready: boolean, reducedMotion: boolean) {
  const elapsed = useSharedValue(0);
  const paused = useSharedValue(false);
  const still = useSharedValue(reducedMotion);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [firstLoopComplete, setFirstLoopComplete] = useState(false);

  useAnimatedReaction(
    () => elapsed.value >= demo.loop,
    (complete, previous) => {
      if (complete && !previous) runOnJS(setFirstLoopComplete)(true);
    },
  );

  useEffect(() => {
    still.set(reducedMotion);
  }, [reducedMotion, still]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  const frame = useFrameCallback((info) => {
    'worklet';
    if (paused.value) return;
    const dt = info.timeSincePreviousFrame ?? 0;
    // A long gap (app was suspended, a dropped run of frames) must not jump the story.
    elapsed.set(elapsed.get() + Math.min(dt, 100) / 1000);
  }, false);

  useEffect(() => {
    // Keep foreground viewing time under reduced motion too; the scene below
    // stays parked, while the first-loop CTA can become available normally.
    frame.setActive(ready && appActive);
  }, [frame, ready, appActive]);

  const state = useDerivedValue(() => {
    if (still.value) return sceneAt(demo.stillTime, 0, 0);
    const t = elapsed.value % demo.loop;
    return sceneAt(t, elapsed.value, 1);
  });

  return { state, elapsed, paused, firstLoopComplete };
}
