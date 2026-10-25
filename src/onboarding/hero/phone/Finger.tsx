/**
 * Stylized fingertip: a rounded capsule with soft shading and a subtle nail
 * highlight, entering ~20 degrees from vertical, with a thin contact shadow
 * and a pressure ring while touching the glass. Skin tone is a preset.
 */
import React from 'react';
import { BlurMask, Circle, Group, LinearGradient, Oval, RoundedRect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { SKIN_TONES } from '../heroConfig';
import type { HeroFrame, HeroShared } from '../heroFrame';

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
  const b = Math.min(255, Math.round((n & 255) * k));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function Finger({ frame, shared, skinTone, size }: {
  frame: SharedValue<HeroFrame>;
  shared: HeroShared;
  skinTone: string;
  size: number;
}) {
  const skin = SKIN_TONES[skinTone] || SKIN_TONES.peach;
  const L = shared.layout;
  const fw = useDerivedValue(() => L.value.screen.w * 0.14 * size);
  const tip = useDerivedValue(() => {
    const s = L.value.screen;
    const f = frame.value.finger;
    return { x: s.x + f.x * s.w, y: s.y + f.y * s.h };
  });
  const transform = useDerivedValue(() => {
    const lift = (1 - frame.value.finger.contact) * fw.value * 0.18;
    const tilt = shared.tilt.value;
    const k = shared.reduced.value ? 0 : 12 * shared.cfg.value.mascot.tiltParallax;
    return [
      { translateX: tip.value.x + tilt.x * k },
      { translateY: tip.value.y - lift + tilt.y * k },
      { rotate: (-20 * Math.PI) / 180 },
    ];
  });
  const shadowT = useDerivedValue(() => {
    const lift = (1 - frame.value.finger.contact) * fw.value * 0.5;
    return [{ translateX: tip.value.x + lift * 0.6 + fw.value * 0.08 }, { translateY: tip.value.y + lift * 0.3 + fw.value * 0.05 }];
  });
  const opacity = useDerivedValue(() => frame.value.finger.visible);
  const shadowOp = useDerivedValue(() => frame.value.finger.visible * (0.18 + 0.12 * frame.value.finger.contact));
  const ringR = useDerivedValue(() => fw.value * (0.45 + 0.25 * (1 - frame.value.finger.contact)));
  const ringOp = useDerivedValue(() => frame.value.finger.visible * frame.value.finger.contact * 0.45);
  const tipX = useDerivedValue(() => tip.value.x);
  const tipY = useDerivedValue(() => tip.value.y);
  // geometry in finger space: tip at (0,0), capsule extends down
  const w = useDerivedValue(() => fw.value);
  const h = useDerivedValue(() => fw.value * 3.4);
  const x0 = useDerivedValue(() => -fw.value / 2);
  const y0 = useDerivedValue(() => -fw.value * 0.08);
  const r = useDerivedValue(() => fw.value / 2);
  const nail = useDerivedValue(() => ({ x: -fw.value * 0.3, y: fw.value * 0.08, width: fw.value * 0.6, height: fw.value * 0.72 }));
  const nailX = useDerivedValue(() => nail.value.x);
  const nailY = useDerivedValue(() => nail.value.y);
  const nailW = useDerivedValue(() => nail.value.width);
  const nailH = useDerivedValue(() => nail.value.height);
  const nailR = useDerivedValue(() => fw.value * 0.28);
  const gs = useDerivedValue(() => vec(-fw.value / 2, 0));
  const ge = useDerivedValue(() => vec(fw.value / 2, 0));
  const shadowRect = useDerivedValue(() => ({ x: -fw.value * 0.5, y: -fw.value * 0.2, width: fw.value, height: fw.value * 0.5 }));
  return (
    <Group>
      <Circle cx={tipX} cy={tipY} r={ringR} color="#FFFFFF" style="stroke" strokeWidth={1.5} opacity={ringOp} />
      <Group transform={shadowT} opacity={shadowOp}>
        <Oval rect={shadowRect} color="#000000">
          <BlurMask blur={4} style="normal" />
        </Oval>
      </Group>
      <Group transform={transform} opacity={opacity}>
        <RoundedRect x={x0} y={y0} width={w} height={h} r={r}>
          <LinearGradient start={gs} end={ge} colors={[shade(skin, 0.86), skin, shade(skin, 1.06), shade(skin, 0.8)]} positions={[0, 0.35, 0.6, 1]} />
        </RoundedRect>
        <RoundedRect x={nailX} y={nailY} width={nailW} height={nailH} r={nailR} color={shade(skin, 1.12)} opacity={0.55} />
        <RoundedRect x={nailX} y={nailY} width={nailW} height={nailH} r={nailR} color="#FFFFFF" opacity={0.18} />
      </Group>
    </Group>
  );
}
