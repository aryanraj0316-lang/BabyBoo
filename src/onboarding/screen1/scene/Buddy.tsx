/**
 * Stationary Buddy artwork. Only the selected image changes, using the phone's
 * shared timeline; the normalized canvas and floor anchor stay fixed.
 */
import React from 'react';
import { BlurMask, Group, Image, Oval, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { BUDDY_BASELINE_PT, BUDDY_SEAT_X_PT } from '../buddyMetrics.generated';
import type { SceneLayout } from '../layout';
import type { SceneState } from '../timeline';
import { contactShadow as CS, palette } from '../tokens';
import { tint } from './colour';

interface Props {
  layout: SceneLayout;
  state: SharedValue<SceneState>;
  /** One image per FRAME_IDS entry, all loaded. */
  images: SkImage[];
}

function Frame({ i, image, layout, state }: { i: number; image: SkImage; layout: SceneLayout; state: SharedValue<SceneState> }) {
  // Paws, head angles and silhouettes differ between these poses. A clean
  // replacement avoids overlapping faces/limbs during an opacity crossfade.
  const opacity = useDerivedValue(() => state.value.frameTo === i ? 1 : 0);
  const c = layout.buddyCanvas;
  return <Image image={image} x={c.x} y={c.y} width={c.width} height={c.height} fit="contain" opacity={opacity} />;
}

export function Buddy({ layout, state, images }: Props) {
  const c = layout.buddyCanvas;
  const s = layout.buddyScale;
  const ax = c.x + BUDDY_SEAT_X_PT * s; // seat centre
  const ay = c.y + BUDDY_BASELINE_PT * s; // floor

  // Keep the existing floor shadow stationary with the artwork.
  const shadowW = c.width * CS.buddyWidthOfCanvas;
  const shadowH = CS.heightOfBuddy * layout.buddyHeight;
  return (
    <Group>
      <Oval x={ax - shadowW / 2} y={ay - shadowH / 2} width={shadowW} height={shadowH} color={tint(palette.shadowTint, CS.opacity)}>
        <BlurMask blur={CS.blurOfBuddy * layout.buddyHeight} style="normal" />
      </Oval>
      {images.map((image, i) => (
        <Frame key={i} i={i} image={image} layout={layout} state={state} />
      ))}
    </Group>
  );
}
