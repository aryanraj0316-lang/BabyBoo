/**
 * Screen-off A gesture. The touch dot traces both legs, lifts, then draws the
 * crossbar. The phone stays dark until the completed gesture unlocks it.
 */
import React, { useMemo } from 'react';
import { Circle, Group, Path, RadialGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { progress, rgba, smoothstep } from '../anim';
import type { Rect as R } from '../layout';
import type { SceneState } from '../timeline';
import { dot as DOT, homePill as PILL, palette, unlock as U } from '../tokens';

interface Props {
  screen: R;
  state: SharedValue<SceneState>;
}

export function UnlockGesture({ screen, state }: Props) {
  const { x, y, width: w, height: H } = screen;

  // Home indicator pill.
  const pillW = PILL.widthOfScreen * w;
  const pillX = x + (w - pillW) / 2;
  const pillY = y + H - PILL.bottomOfScreen * H - PILL.height;

  // The dot.
  const D = Math.max(DOT.minDiameter, DOT.diameterOfScreen * w);
  const core = DOT.coreOfDiameter * D;
  const glowR = D / 2 + DOT.glowRadiusOfDiameter * D;
  const strokes = useMemo(() => U.aStrokes.map((points) => {
    const path = Skia.Path.Make();
    path.moveTo(x + points[0][0] * w, y + points[0][1] * H);
    for (let i = 1; i < points.length; i += 3) {
      path.cubicTo(x + points[i][0] * w, y + points[i][1] * H,
        x + points[i + 1][0] * w, y + points[i + 1][1] * H,
        x + points[i + 2][0] * w, y + points[i + 2][1] * H);
    }
    return path;
  }), [x, y, w, H]);
  const contours = useMemo(() => strokes.map((path) => Skia.ContourMeasureIter(path, false, 1).next()!), [strokes]);
  const lengths = useMemo(() => contours.map((contour) => contour.length()), [contours]);
  const mainEnd = useDerivedValue(() => smoothstep(progress(state.value.gestureProgress, 0, U.aSidesEnd)));
  const barEnd = useDerivedValue(() => smoothstep(progress(state.value.gestureProgress, U.aCrossbarStart, 1)));

  // Lock layer.
  const lockTransform = useDerivedValue(() => [{ translateY: -state.value.lockOffset * H }]);
  const lockOpacity = useDerivedValue(() => state.value.lockOpacity * state.value.lockVisible);
  const pillOpacity = useDerivedValue(() => state.value.pillOpacity);

  // Dot and trail.
  const dotPoint = useDerivedValue(() => {
    const bar = state.value.gestureProgress >= U.aSidesEnd;
    const i = bar ? 1 : 0;
    return contours[i].getPosTan(lengths[i] * (bar ? barEnd.value : mainEnd.value))[0];
  });
  const penOpacity = useDerivedValue(() => {
    const p = state.value.gestureProgress;
    return p > U.aSidesEnd && p < U.aCrossbarStart ? 0 : 1;
  });
  const dotTransform = useDerivedValue(() => {
    const k = state.value.dotScale;
    return [{ translateX: dotPoint.value.x }, { translateY: dotPoint.value.y }, { scale: k }];
  });
  const glowTransform = useDerivedValue(() => [{ scale: state.value.dotGlowScale }]);
  const coreOpacity = useDerivedValue(() => state.value.dotCore * state.value.dotVisible);
  const ringOpacity = useDerivedValue(() => state.value.dotRing * state.value.dotVisible);
  const glowOpacity = useDerivedValue(() => state.value.dotRing * state.value.dotVisible * DOT.glowOpacity);

  const trailOpacity = useDerivedValue(() => state.value.trailOpacity * state.value.dotVisible);

  return (
    <Group>
      <Group transform={lockTransform} opacity={lockOpacity}>
        <Rect x={x} y={y} width={w} height={H} color={palette.phone.screenOff} />
        <RoundedRect x={pillX} y={pillY} width={pillW} height={PILL.height} r={PILL.height / 2} color={PILL.color} opacity={pillOpacity} />
      </Group>

      <Path path={strokes[0]} end={mainEnd} color={palette.dot.core} style="stroke" strokeWidth={core * 0.45} strokeCap="round" strokeJoin="round" opacity={trailOpacity} />
      <Path path={strokes[1]} end={barEnd} color={palette.dot.core} style="stroke" strokeWidth={core * 0.39} strokeCap="round" strokeJoin="round" opacity={trailOpacity} />

      <Group transform={dotTransform} opacity={penOpacity}>
        <Group transform={glowTransform} opacity={glowOpacity}>
          <Circle cx={0} cy={0} r={glowR}>
            <RadialGradient c={vec(0, 0)} r={glowR} colors={[palette.dot.glow, rgba(DOT.trailColor, 0)]} positions={[D / 2 / glowR, 1]} />
          </Circle>
        </Group>
        <Circle cx={0} cy={0} r={D / 2} color={palette.dot.ring} opacity={ringOpacity} />
        <Circle cx={0} cy={0} r={core / 2} color={palette.dot.core} opacity={coreOpacity} />
      </Group>
    </Group>
  );
}
