/**
 * The decorative scene for onboarding screen 1, in one full-screen Skia
 * canvas behind the text: page gradient, scene halo, one shared floor shadow,
 * the phone and Buddy. Hidden from screen readers.
 *
 * Phase 2: static first frame of Beat 1 (reels playing, battery 23%).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurMask, Canvas, Circle, Image, LinearGradient, Oval, RadialGradient, Rect, useImage, vec } from '@shopify/react-native-skia';
import { BUDDY_IMAGES } from '../buddyImages.generated';
import type { SceneLayout } from '../layout';
import { contactShadow as CS, halo as H, palette, statusBar as SB } from '../tokens';
import { tint, withAlpha } from './colour';
import { PhoneMockup } from './PhoneMockup';
import { PhoneStatusBar } from './PhoneStatusBar';
import { ReelClip } from './ReelClip';

interface Props {
  width: number;
  height: number;
  layout: SceneLayout | null;
}

export function Scene({ width, height, layout }: Props) {
  const buddyImage = useImage(BUDDY_IMAGES.watch_34_left);

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
            {/* Scene halo: very large, very soft; follows the phone's light (cool in Beat 1). */}
            <Circle cx={layout.halo.cx} cy={layout.halo.cy} r={layout.halo.r}>
              <RadialGradient
                c={vec(layout.halo.cx, layout.halo.cy)}
                r={layout.halo.r}
                colors={[
                  withAlpha(palette.halo.cool, H.opacity),
                  withAlpha(palette.halo.cool, H.opacity * 0.55),
                  withAlpha(palette.halo.cool, H.opacity * 0.18),
                  withAlpha(palette.halo.cool, 0),
                ]}
                positions={[0, 0.35, 0.7, 1]}
              />
            </Circle>

            {/* One soft floor shadow under the phone and Buddy. */}
            <Oval
              x={layout.floorShadow.x}
              y={layout.floorShadow.y}
              width={layout.floorShadow.width}
              height={layout.floorShadow.height}
              color={tint(palette.shadowTint, CS.opacity)}
            >
              <BlurMask blur={CS.blurOfBuddy * layout.buddyHeight} style="normal" />
            </Oval>

            <PhoneMockup layout={layout}>
              <ReelClip rect={layout.screen} index={0} />
              <PhoneStatusBar screen={layout.screen} level={SB.battery.level} levelColor={palette.battery.green} />
            </PhoneMockup>

            {buddyImage && (
              <Image
                image={buddyImage}
                x={layout.buddyCanvas.x}
                y={layout.buddyCanvas.y}
                width={layout.buddyCanvas.width}
                height={layout.buddyCanvas.height}
                fit="fill"
              />
            )}
          </>
        )}
      </Canvas>
    </View>
  );
}
