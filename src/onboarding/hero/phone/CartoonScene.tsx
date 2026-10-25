/**
 * Procedural, generic cartoon for the phone screen: pastel hills, drifting
 * clouds, a sun and a soft ball bouncing with squash and stretch. No text,
 * logos or characters. Loops seamlessly with the hero timeline.
 */
import React, { useMemo } from 'react';
import { Circle, Group, LinearGradient, Path, Rect, Skia, vec, BlurMask } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { CARTOON_PALETTES } from '../heroConfig';
import { ballAt } from '../heroTimeline';
import type { HeroFrame, HeroShared } from '../heroFrame';
import type { Rect as R } from '../layout';

function hills(s: R, base: number, amp: number, waves: number, phase: number) {
  const p = Skia.PathBuilder.Make();
  p.moveTo(s.x - 2, s.y + s.h + 2);
  const n = 32;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const y = s.y + s.h * (base - amp * (0.5 + 0.5 * Math.sin(u * Math.PI * waves + phase)));
    p.lineTo(s.x + u * s.w, y);
  }
  p.lineTo(s.x + s.w + 2, s.y + s.h + 2);
  p.close();
  return p.detach();
}

function cloudPath(cx: number, cy: number, r: number) {
  const p = Skia.PathBuilder.Make();
  p.addCircle(cx, cy, r);
  p.addCircle(cx + r * 0.95, cy + r * 0.15, r * 0.8);
  p.addCircle(cx - r * 0.9, cy + r * 0.2, r * 0.7);
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(cx - r * 1.5, cy, r * 3.1, r * 0.75), r * 0.37, r * 0.37));
  return p.detach();
}

export function CartoonScene({ frame, shared, screen, palette }: {
  frame: SharedValue<HeroFrame>;
  shared: HeroShared;
  screen: R;
  palette: string;
}) {
  const pal = CARTOON_PALETTES[palette] || CARTOON_PALETTES.meadow;
  const back = useMemo(() => hills(screen, 0.66, 0.12, 2.2, 0.6), [screen.x, screen.y, screen.w, screen.h]);
  const front = useMemo(() => hills(screen, 0.8, 0.09, 1.4, 2.4), [screen.x, screen.y, screen.w, screen.h]);
  const cloud = useMemo(() => cloudPath(0, 0, screen.w * 0.07), [screen.w]);
  const cloud2 = useMemo(() => cloudPath(0, 0, screen.w * 0.05), [screen.w]);
  const c1 = useDerivedValue(() => {
    const ph = frame.value.phone.phase;
    const x = screen.x + (((ph * 1 + 0.15) % 1) * 1.4 - 0.2) * screen.w;
    return [{ translateX: x }, { translateY: screen.y + screen.h * 0.18 }];
  });
  const c2 = useDerivedValue(() => {
    const ph = frame.value.phone.phase;
    const x = screen.x + (((ph * 1 + 0.65) % 1) * 1.4 - 0.2) * screen.w;
    return [{ translateX: x }, { translateY: screen.y + screen.h * 0.3 }];
  });
  const ball = useDerivedValue(() => {
    const b = ballAt(frame.value.phone.phase);
    const r = screen.w * 0.055;
    const sy = b.squash;
    const sx = 1 / Math.max(sy, 0.6);
    const cx = screen.x + b.x * screen.w;
    const cy = screen.y + b.y * screen.h;
    return [{ translateX: cx }, { translateY: cy + r * (1 - sy) }, { scaleX: sx }, { scaleY: sy }];
  });
  const ballShadow = useDerivedValue(() => {
    const b = ballAt(frame.value.phone.phase);
    const h = (0.705 - b.y) / 0.22;
    return [{ translateX: screen.x + b.x * screen.w }, { translateY: screen.y + 0.705 * screen.h + screen.w * 0.06 }, { scaleX: 1 - 0.4 * h }];
  });
  const sunY = screen.y + screen.h * 0.13;
  const sunX = screen.x + screen.w * 0.76;
  const br = screen.w * 0.055;
  return (
    <Group>
      <Rect x={screen.x} y={screen.y} width={screen.w} height={screen.h}>
        <LinearGradient start={vec(0, screen.y)} end={vec(0, screen.y + screen.h * 0.7)} colors={[pal.sky[0], pal.sky[1]]} />
      </Rect>
      <Circle cx={sunX} cy={sunY} r={screen.w * 0.11} color={pal.sun} opacity={0.35}>
        <BlurMask blur={screen.w * 0.05} style="normal" />
      </Circle>
      <Circle cx={sunX} cy={sunY} r={screen.w * 0.075} color={pal.sun} />
      <Group transform={c1}>
        <Path path={cloud} color={pal.cloud} opacity={0.95} />
      </Group>
      <Group transform={c2}>
        <Path path={cloud2} color={pal.cloud} opacity={0.85} />
      </Group>
      <Path path={back} color={pal.hillBack} />
      <Path path={front} color={pal.hillFront} />
      <Group transform={ballShadow}>
        <Circle cx={0} cy={0} r={br * 0.9} color="#000" opacity={0.12} transform={[{ scaleY: 0.25 }]} />
      </Group>
      <Group transform={ball}>
        <Circle cx={0} cy={0} r={br} color={pal.ball} />
        <Circle cx={-br * 0.3} cy={-br * 0.35} r={br * 0.32} color="#fff" opacity={0.45} />
      </Group>
    </Group>
  );
}
