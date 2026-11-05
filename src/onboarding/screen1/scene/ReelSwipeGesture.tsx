/** A single hand asset follows the existing reel swipe, never its own timer. */
import React from 'react';
import { Group, Image, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { Rect } from '../layout';
import type { SceneState } from '../timeline';
import { reelGesture as G } from '../tokens';

export function ReelSwipeGesture({ screen, state, image }: { screen: Rect; state: SharedValue<SceneState>; image: SkImage | null }) {
  const width = screen.width * G.widthOfScreen;
  const height = width / G.aspect;
  const transform = useDerivedValue(() => {
    const travel = state.value.reelGestureTravel;
    const bend = Math.sin(Math.PI * travel);
    return [
      { translateX: screen.x + screen.width * G.xOfScreen },
      { translateY: screen.y + screen.height * (G.startYOfScreen - G.travelOfScreen * travel) },
      { rotate: G.wristTilt * (0.5 - travel) },
      { skewX: -G.wristFlex * bend },
      { scaleY: 1 - G.wristFlex * bend },
      { translateX: -width * G.fingertipX },
      { translateY: -height * G.fingertipY },
    ];
  });
  const opacity = useDerivedValue(() => G.opacity * state.value.reelGestureOpacity * state.value.feedOpacity);
  return <Group transform={transform} opacity={opacity}>
    <Image image={image} x={0} y={0} width={width} height={height} fit="contain" />
  </Group>;
}
