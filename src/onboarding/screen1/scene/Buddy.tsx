/**
 * Stationary Buddy artwork. Only the selected image changes, using the phone's
 * shared timeline; the normalized canvas and floor anchor stay fixed.
 */
import React, { useMemo } from 'react';
import { Atlas, BlurMask, Group, Image, Oval, Skia, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { BUDDY_BASELINE_PT, BUDDY_SEAT_X_PT } from '../buddyMetrics.generated';
import type { SceneLayout } from '../layout';
import type { SceneState } from '../timeline';
import { contactShadow as CS, palette } from '../tokens';
import { tint } from './colour';
import { buddyClipFrame } from '../buddyClipFrame';
import { CLIP_TILE } from '../buddyClips.generated';
import { GROUND_HEIGHT_PT, GROUND_TOP_PT } from '../buddyGroundAssets.generated';

interface Props {
  layout: SceneLayout;
  state: SharedValue<SceneState>;
  /** One image per FRAME_IDS entry, all loaded. */
  images: SkImage[];
  /** Decoded transparent video-frame atlases; absent on load failure. */
  clips?: SkImage[];
  ground?: { stills: SkImage[]; clips: SkImage[] };
}

function Frame({ i, image, layout, state, hasClips }: { i: number; image: SkImage; layout: SceneLayout; state: SharedValue<SceneState>; hasClips: boolean }) {
  // Paws, head angles and silhouettes differ between these poses. A clean
  // replacement avoids overlapping faces/limbs during an opacity crossfade.
  const opacity = useDerivedValue(() => {
    const s = state.value;
    if (hasClips && buddyClipFrame(s.environmentTime, s.environmentMotion) >= 0) return 0;
    return s.frameTo === i ? 1 : 0;
  });
  const c = layout.buddyCanvas;
  return <Image image={image} x={c.x} y={c.y} width={c.width} height={c.height} fit="contain" opacity={opacity} />;
}

function Clip({ layout, state, images }: { layout: SceneLayout; state: SharedValue<SceneState>; images: SkImage[] }) {
  const c = layout.buddyCanvas;
  const selected = useDerivedValue(() => buddyClipFrame(state.value.environmentTime, state.value.environmentMotion));
  const image = useDerivedValue(() => selected.value < 0 ? null : images[Math.floor(selected.value / CLIP_TILE.perAtlas)] ?? null);
  const sprites = useDerivedValue(() => {
    const slot = Math.max(0, selected.value) % CLIP_TILE.perAtlas;
    return [{ x: (slot % CLIP_TILE.columns) * CLIP_TILE.cellWidth + CLIP_TILE.padding,
      y: Math.floor(slot / CLIP_TILE.columns) * CLIP_TILE.cellHeight + CLIP_TILE.padding,
      width: CLIP_TILE.width, height: CLIP_TILE.height }];
  });
  const transforms = useMemo(() => [Skia.RSXform(c.width / CLIP_TILE.width, 0, c.x, c.y)], [c.x, c.y, c.width]);
  return <Atlas image={image} sprites={sprites} transforms={transforms} />;
}

export function Buddy({ layout, state, images, clips, ground }: Props) {
  const c = layout.buddyCanvas;
  const s = layout.buddyScale;
  const ax = c.x + BUDDY_SEAT_X_PT * s; // seat centre
  const ay = c.y + BUDDY_BASELINE_PT * s; // floor

  // Keep the existing floor shadow stationary with the artwork.
  const shadowW = c.width * CS.buddyWidthOfCanvas;
  const shadowH = CS.heightOfBuddy * layout.buddyHeight;
  const shadow = useDerivedValue(() => {
    if (!ground) return null;
    const s = state.value;
    const playing = clips && buddyClipFrame(s.environmentTime, s.environmentMotion) >= 0;
    return (playing ? ground.clips : ground.stills)[s.frameTo] ?? null;
  });
  return (
    <Group>
      {!ground && <Oval x={ax - shadowW / 2} y={ay - shadowH * 0.9} width={shadowW} height={shadowH} color={tint(palette.shadowTint, CS.buddyAmbientOpacity)}>
        <BlurMask blur={CS.buddyBlurOfHeight * layout.buddyHeight} style="normal" />
      </Oval>}
      {ground && <Image image={shadow} x={c.x} y={c.y + GROUND_TOP_PT * s} width={c.width} height={GROUND_HEIGHT_PT * s} fit="fill" />}
      {images.map((image, i) => (
        <Frame key={i} i={i} image={image} layout={layout} state={state} hasClips={!!clips} />
      ))}
      {clips && <Clip layout={layout} state={state} images={clips} />}
    </Group>
  );
}
