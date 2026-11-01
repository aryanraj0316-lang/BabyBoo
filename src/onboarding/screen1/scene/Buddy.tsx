/**
 * Buddy: frame swaps carry the expressions, the clock carries the life between
 * them (breathing, sway, pops, the celebration bounce), all anchored at his
 * seat on the floor. The phone's light is a gradient masked to his alpha
 * (srcATop), so it only ever colours Buddy, never the background.
 */
import React from 'react';
import { BlurMask, Group, Image, LinearGradient, Oval, Rect, vec, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { hexToRgb, rgba } from '../anim';
import { BUDDY_BASELINE_PT, BUDDY_SEAT_X_PT } from '../buddyMetrics.generated';
import type { SceneLayout } from '../layout';
import type { SceneState } from '../timeline';
import { buddyLight as BL, contactShadow as CS, palette } from '../tokens';
import { tint } from './colour';

interface Props {
  layout: SceneLayout;
  state: SharedValue<SceneState>;
  /** One image per FRAME_IDS entry, all loaded. */
  images: SkImage[];
}

const FAR_SHADOW = hexToRgb(BL.farShadow.color);

/**
 * Opacity of frame `i` during a crossfade from `from` to `to` (weight `mix`).
 * Frames are drawn in a fixed order, so the lower of the two stays opaque and
 * the upper one carries the fade. That way the pair never turns see-through.
 */
function frameOpacity(i: number, from: number, to: number, mix: number): number {
  'worklet';
  if (from === to) return i === to ? 1 : 0;
  const lower = Math.min(from, to);
  const upper = Math.max(from, to);
  if (i === lower) return 1;
  if (i === upper) return upper === to ? mix : 1 - mix;
  return 0;
}

function Frame({ i, image, layout, state }: { i: number; image: SkImage; layout: SceneLayout; state: SharedValue<SceneState> }) {
  const opacity = useDerivedValue(() => {
    const s = state.value;
    return frameOpacity(i, s.frameFrom, s.frameTo, s.frameMix);
  });
  const c = layout.buddyCanvas;
  return <Image image={image} x={c.x} y={c.y} width={c.width} height={c.height} fit="fill" opacity={opacity} />;
}

export function Buddy({ layout, state, images }: Props) {
  const c = layout.buddyCanvas;
  const s = layout.buddyScale;
  const ax = c.x + BUDDY_SEAT_X_PT * s; // seat centre
  const ay = c.y + BUDDY_BASELINE_PT * s; // floor

  const transform = useDerivedValue(() => {
    const st = state.value;
    return [
      { translateX: ax },
      { translateY: ay + st.buddyDy },
      { rotate: (st.buddyRotate * Math.PI) / 180 },
      { scaleX: st.buddyScaleX },
      { scaleY: st.buddyScaleY },
      { translateX: -ax },
      { translateY: -ay },
    ];
  });

  // Light from the phone side (left), the far side slightly in shadow.
  const lightColors = useDerivedValue(() => {
    const st = state.value;
    return [rgba(st.lightColor, st.lightIntensity), rgba(st.lightColor, 0), rgba(FAR_SHADOW, st.shadowIntensity)];
  });

  // Buddy's part of the floor shadow: shrinks and lightens as he rises.
  const shadowW = c.width * CS.buddyWidthOfCanvas;
  const shadowH = CS.heightOfBuddy * layout.buddyHeight;
  const shadowTransform = useDerivedValue(() => {
    const k = state.value.floorShadowScale;
    return [{ translateX: ax }, { translateY: ay }, { scale: k }];
  });
  const shadowOpacity = useDerivedValue(() => state.value.floorShadowOpacity);

  return (
    <Group>
      <Group transform={shadowTransform} opacity={shadowOpacity}>
        <Oval x={-shadowW / 2} y={-shadowH / 2} width={shadowW} height={shadowH} color={tint(palette.shadowTint, CS.opacity)}>
          <BlurMask blur={CS.blurOfBuddy * layout.buddyHeight} style="normal" />
        </Oval>
      </Group>

      <Group transform={transform} layer>
        {images.map((image, i) => (
          <Frame key={i} i={i} image={image} layout={layout} state={state} />
        ))}
        <Rect x={c.x} y={c.y} width={c.width} height={c.height} blendMode="srcATop">
          <LinearGradient start={vec(c.x, 0)} end={vec(c.x + c.width, 0)} colors={lightColors} positions={[0, BL.reach, 1]} />
        </Rect>
      </Group>
    </Group>
  );
}
