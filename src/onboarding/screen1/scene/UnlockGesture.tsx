/**
 * Beat 3-4: the black lock layer with its home indicator pill, and the
 * touch-indicator dot that swipes it away (Android / Vivo tutorial style; no
 * hand or finger). The lock layer is "held" by the dot: both read the same
 * displacement from the clock, so they always move together exactly. The
 * trail runs from the swipe start to the dot's centre, always as long as the
 * distance travelled.
 */
import React from 'react';
import { Circle, Group, LinearGradient, RadialGradient, Rect, RoundedRect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { rgba } from '../anim';
import type { Rect as R } from '../layout';
import type { SceneState } from '../timeline';
import { dot as DOT, homePill as PILL, palette } from '../tokens';

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
  const cx = x + w / 2;
  const startY = pillY + PILL.height / 2 - DOT.aboveHomePill * D;

  // Lock layer.
  const lockTransform = useDerivedValue(() => [{ translateY: -state.value.lockOffset * H }]);
  const lockOpacity = useDerivedValue(() => state.value.lockOpacity * state.value.lockVisible);
  const pillOpacity = useDerivedValue(() => state.value.pillOpacity);

  // Dot and trail.
  const dotY = useDerivedValue(() => startY - state.value.dotTravel * H);
  const dotTransform = useDerivedValue(() => {
    const k = state.value.dotScale;
    return [{ translateX: cx }, { translateY: dotY.value }, { scale: k }];
  });
  const glowTransform = useDerivedValue(() => [{ scale: state.value.dotGlowScale }]);
  const coreOpacity = useDerivedValue(() => state.value.dotCore * state.value.dotVisible);
  const ringOpacity = useDerivedValue(() => state.value.dotRing * state.value.dotVisible);
  const glowOpacity = useDerivedValue(() => state.value.dotRing * state.value.dotVisible * DOT.glowOpacity);

  const trailH = useDerivedValue(() => Math.max(0, startY - dotY.value));
  const trailStart = useDerivedValue(() => vec(cx, dotY.value));
  const trailOpacity = useDerivedValue(() => state.value.trailOpacity * state.value.dotVisible);
  const trailColors = [rgba(DOT.trailColor, DOT.trailOpacity), rgba(DOT.trailColor, 0)];

  return (
    <Group>
      <Group transform={lockTransform} opacity={lockOpacity}>
        <Rect x={x} y={y} width={w} height={H} color={palette.phone.screenOff} />
        <RoundedRect x={pillX} y={pillY} width={pillW} height={PILL.height} r={PILL.height / 2} color={PILL.color} opacity={pillOpacity} />
      </Group>

      {/* Trail behind the dot: as wide as the white core, fading toward the start. */}
      <RoundedRect x={cx - core / 2} y={dotY} width={core} height={trailH} r={core / 2} opacity={trailOpacity}>
        <LinearGradient start={trailStart} end={vec(cx, startY)} colors={trailColors} />
      </RoundedRect>

      <Group transform={dotTransform}>
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
