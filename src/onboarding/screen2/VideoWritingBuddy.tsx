import React, { useEffect, useState } from 'react';
import { AppState, Image as NativeImage, View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Image, useAnimatedImage, type SkImage } from '@shopify/react-native-skia';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { useReducedMotion } from '../screen1/useDemoClock';

/** Plays existing video pixels once; holds on pauses/end instead of erasing the ink in a loop. */
export function VideoWritingBuddy({ writing, label, style }: {
  writing: boolean; label: string; style: StyleProp<ViewStyle>;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [failed, setFailed] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const reduced = useReducedMotion();
  const animation = useAnimatedImage(require('../../../assets/onboarding/screen2/buddy/buddy-writing-video.webp'), () => setFailed(true));
  const current = useSharedValue<SkImage | null>(null);
  const frame = useSharedValue(0);
  const last = useSharedValue(-1);
  const playing = useSharedValue(false);
  useEffect(() => { playing.set(writing && foreground && !reduced); }, [writing, foreground, reduced, playing]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => sub.remove();
  }, []);
  useFrameCallback(({ timestamp }) => {
    'worklet';
    if (!animation) return;
    if (!current.value) current.value = animation.getCurrentFrame();
    if (!playing.value || frame.value >= animation.getFrameCount() - 1) { last.value = -1; return; }
    if (last.value < 0) { last.value = timestamp; return; }
    const duration = animation.currentFrameDuration();
    if (timestamp - last.value < duration) return;
    animation.decodeNextFrame();
    const next = animation.getCurrentFrame();
    if (next) { const previous = current.value; current.value = next; previous?.dispose(); }
    frame.value += 1;
    last.value += duration;
  });
  return <View style={style} accessible accessibilityLabel={label}
    onLayout={event => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
    {(!animation || failed || reduced) && <NativeImage source={require('../../../assets/onboarding/screen2/buddy/buddy-writing-start.webp')}
      resizeMode="contain" style={{ width: '100%', height: '100%' }} />}
    {!failed && !reduced && animation && <Canvas pointerEvents="none" style={{ position: 'absolute', width: size.width, height: size.height }}>
      <Image image={current} x={0} y={0} width={size.width} height={size.height} fit="contain" />
    </Canvas>}
  </View>;
}
