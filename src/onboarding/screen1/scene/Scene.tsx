/**
 * The decorative scene for onboarding screen 1, in one full-screen Skia
 * canvas behind the text: page gradient, scene halo, the shared floor shadow,
 * the phone and Buddy. Every animated value comes from the demo clock's
 * SceneState. Hidden from screen readers.
 *
 * Phone screen layers, bottom to top: home screen, feed (reels, toast, dim),
 * lock layer + touch dot. The glass sheen sits above them all (PhoneMockup).
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurMask, Canvas, Circle, LinearGradient, Oval, RadialGradient, Rect, useImage, vec, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { rgba } from '../anim';
import { BUDDY_IMAGES } from '../buddyImages.generated';
import type { SceneLayout } from '../layout';
import { FRAME_IDS, type SceneState } from '../timeline';
import { contactShadow as CS, halo as H, palette } from '../tokens';
import { tint } from './colour';
import { Buddy } from './Buddy';
import { Feed } from './Feed';
import { HomeScreen } from './HomeScreen';
import { PhoneMockup } from './PhoneMockup';
import { UnlockGesture } from './UnlockGesture';

interface Props {
  width: number;
  height: number;
  layout: SceneLayout | null;
  state: SharedValue<SceneState>;
  toastText: string;
  /** Called once every Buddy frame is decoded. */
  onReady: () => void;
}

/** Decode every Buddy frame up front (the id list is fixed, so the hook order never changes). */
function useBuddyImages(): SkImage[] | null {
  // oxlint-disable-next-line react-hooks/rules-of-hooks -- fixed-length list, same order every render
  const images = FRAME_IDS.map((id) => useImage(BUDDY_IMAGES[id]));
  return images.every(Boolean) ? (images as SkImage[]) : null;
}

export function Scene({ width, height, layout, state, toastText, onReady }: Props) {
  const images = useBuddyImages();
  const ready = images !== null;
  useEffect(() => {
    if (ready) onReady();
  }, [ready, onReady]);

  const haloColors = useDerivedValue(() => {
    const s = state.value;
    const a = H.opacity * s.haloFactor;
    return [rgba(s.haloColor, a), rgba(s.haloColor, a * 0.55), rgba(s.haloColor, a * 0.18), rgba(s.haloColor, 0)];
  });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Canvas style={{ width, height }}>
        {/* Page gradient: nothing else in the background except the halo. */}
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[palette.bg.top, palette.bg.bottom]} />
        </Rect>

        {layout && (
          <>
            {/* Scene halo: very large, very soft; its colour follows the phone. */}
            <Circle cx={layout.halo.cx} cy={layout.halo.cy} r={layout.halo.r}>
              <RadialGradient c={vec(layout.halo.cx, layout.halo.cy)} r={layout.halo.r} colors={haloColors} positions={[0, 0.35, 0.7, 1]} />
            </Circle>

            {/* The phone's part of the floor shadow; Buddy's part (which reacts to him) overlaps it. */}
            <Oval
              x={layout.floorShadow.x}
              y={layout.floorShadow.y}
              width={layout.phone.x + layout.phone.width - layout.floorShadow.x}
              height={layout.floorShadow.height}
              color={tint(palette.shadowTint, CS.opacity)}
            >
              <BlurMask blur={CS.blurOfBuddy * layout.buddyHeight} style="normal" />
            </Oval>

            <PhoneMockup layout={layout}>
              <HomeScreen screen={layout.screen} state={state} />
              <Feed screen={layout.screen} state={state} toastText={toastText} />
              <UnlockGesture screen={layout.screen} state={state} />
            </PhoneMockup>

            {images && <Buddy layout={layout} state={state} images={images} />}
          </>
        )}
      </Canvas>
    </View>
  );
}
