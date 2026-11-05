/** Decorative twig sway only. The phone and Buddy are never transformed here. */
import React from 'react';
import { Group, Image, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { SceneState } from '../timeline';
import { demo, meadowBreeze as B } from '../tokens';

function Twig({ width, height, image, state, branch }: {
  width: number; height: number; image: SkImage | null; state: SharedValue<SceneState>;
  branch: (typeof B.branches)[number];
}) {
  const size = width * branch.width;
  const transform = useDerivedValue(() => {
    const s = state.value;
    const phase = 2 * Math.PI * s.environmentTime / demo.loop;
    const wind = B.radians * s.environmentMotion * (
      Math.sin(phase * B.cyclesPerLoop + branch.phase) + 0.25 * Math.sin(phase * B.secondaryCycles + branch.phase)
    );
    return [
      { translateX: width * branch.x }, { translateY: height * branch.y },
      { scaleX: branch.mirror ? -1 : 1 }, { rotate: branch.rotation + wind },
    ];
  });
  return <Group transform={transform}>
    <Image image={image} x={0} y={0} width={size} height={size} fit="contain" />
  </Group>;
}

export function MeadowBreeze({ width, height, image, state }: {
  width: number; height: number; image: SkImage | null; state: SharedValue<SceneState>;
}) {
  return <>{B.branches.map((branch, i) => <Twig key={i} width={width} height={height} image={image} state={state} branch={branch} />)}</>;
}
