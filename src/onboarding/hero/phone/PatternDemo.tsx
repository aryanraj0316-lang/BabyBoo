/**
 * The unlock gesture's glowing trail: a thin lavender line following the
 * fingertip and fading out over ~0.9 s. Plain swipe strokes, never dots or a
 * grid. Paths are built once; animation trims them with start/end.
 */
import React, { useMemo } from 'react';
import { BlurMask, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { HeroFrame } from '../heroFrame';
import type { StrokeSamples } from '../gesture';
import type { Rect as R } from '../layout';

function strokePath(s: StrokeSamples, screen: R) {
  const p = Skia.PathBuilder.Make();
  for (let i = 0; i < s.pts.length; i += 2) {
    const x = screen.x + s.pts[i] * screen.w;
    const y = screen.y + s.pts[i + 1] * screen.h;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p.detach();
}

const PASSES = [0, 0.35, 0.65, 0.85];

function Trail({ path, frame, which, color, width }: {
  path: ReturnType<typeof strokePath>;
  frame: SharedValue<HeroFrame>;
  which: 0 | 1;
  color: string;
  width: number;
}) {
  const head = useDerivedValue(() => (which === 0 ? frame.value.finger.s1Head : frame.value.finger.s2Head));
  const tail = useDerivedValue(() => (which === 0 ? frame.value.finger.s1Tail : frame.value.finger.s2Tail));
  const visible = useDerivedValue(() => (head.value - tail.value > 0.001 ? 1 : 0));
  const glowStart = useDerivedValue(() => tail.value);
  return (
    <Group opacity={visible}>
      <Path path={path} start={glowStart} end={head} style="stroke" strokeWidth={width * 3.2} strokeCap="round" strokeJoin="round" color={color} opacity={0.22}>
        <BlurMask blur={width * 1.6} style="normal" />
      </Path>
      {PASSES.map((k, i) => (
        <TrailPass key={i} path={path} head={head} tail={tail} k={k} color={color} width={width} />
      ))}
    </Group>
  );
}

function TrailPass({ path, head, tail, k, color, width }: {
  path: ReturnType<typeof strokePath>;
  head: SharedValue<number>;
  tail: SharedValue<number>;
  k: number;
  color: string;
  width: number;
}) {
  const start = useDerivedValue(() => tail.value + (head.value - tail.value) * k);
  return <Path path={path} start={start} end={head} style="stroke" strokeWidth={width} strokeCap="round" strokeJoin="round" color={color} opacity={0.25 + k * 0.5} />;
}

export function PatternDemo({ frame, samples, screen, color }: {
  frame: SharedValue<HeroFrame>;
  samples: StrokeSamples[];
  screen: R;
  color: string;
}) {
  const paths = useMemo(() => samples.slice(0, 2).map((s) => strokePath(s, screen)), [samples, screen.x, screen.y, screen.w, screen.h]);
  const width = Math.max(2, screen.w * 0.016);
  // touch ripples: at the tap and as the swipe ends
  const r1 = useDerivedValue(() => frame.value.phone.ripple * screen.w * 0.12);
  const o1 = useDerivedValue(() => (frame.value.phone.ripple > 0 ? (1 - frame.value.phone.ripple) * 0.5 : 0));
  const r2 = useDerivedValue(() => frame.value.phone.ripple2 * screen.w * 0.1);
  const o2 = useDerivedValue(() => (frame.value.phone.ripple2 > 0 ? (1 - frame.value.phone.ripple2) * 0.35 : 0));
  const tapX = screen.x + 0.6 * screen.w;
  const tapY = screen.y + 0.62 * screen.h;
  const endX = useDerivedValue(() => screen.x + frame.value.phone.revealX * screen.w);
  const endY = useDerivedValue(() => screen.y + frame.value.phone.revealY * screen.h);
  return (
    <Group>
      <Circle cx={tapX} cy={tapY} r={r1} color="#FFFFFF" style="stroke" strokeWidth={1.5} opacity={o1} />
      <Circle cx={endX} cy={endY} r={r2} color={color} style="stroke" strokeWidth={1.5} opacity={o2} />
      {paths.map((p, i) => (
        <Trail key={i} path={p} frame={frame} which={i as 0 | 1} color={color} width={width} />
      ))}
    </Group>
  );
}
