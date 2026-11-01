/**
 * Onboarding screen 1: the battery-down demo (phone + Buddy) on top, then the
 * headline, subline and Get Started button.
 *
 * Vertical layout, top to bottom:
 *   status bar (the app is edge-to-edge: the page gradient runs behind it;
 *   app/index.tsx drops its top safe-area padding for this screen)
 *   language toggle
 *   spare air (60% of the spare height)
 *   scene: phone top to floor, sized from Buddy's height cap (layout.ts)
 *   fixed gap (floor to headline)
 *   headline, subline, CTA
 *   spare air (40%), bottom safe area
 * The scene and text therefore always read as one group, and on large screens
 * the extra room becomes air, never a bigger phone.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { computeScene, fitBuddyHeight, sceneHeightFor } from './layout';
import { LanguageToggle } from './LanguageToggle';
import { CtaButton } from './CtaButton';
import { DebugScrubber } from './DebugScrubber';
import { useDemoClock, useReducedMotion } from './useDemoClock';
import { Scene } from './scene/Scene';
import { STRINGS, type Language } from './strings';
import { page, palette, textBlock as TB, type } from './tokens';

export interface OnboardingScreen1Props {
  onGetStarted: () => void;
}

interface Size { width: number; height: number }

const changed = (a: number | undefined, b: number) => a === undefined || Math.abs(a - b) > 0.5;

export function OnboardingScreen1({ onGetStarted }: OnboardingScreen1Props) {
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState<Language>('en');
  const [root, setRoot] = useState<Size | null>(null);
  const [textHeight, setTextHeight] = useState<number | null>(null);
  const [sceneY, setSceneY] = useState<number | null>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const onAssetsReady = useCallback(() => setAssetsReady(true), []);
  const reducedMotion = useReducedMotion();
  const t = STRINGS[lang];
  const script = lang === 'hi' ? 'devanagari' : 'latin';

  // Space left for the scene once everything else has its share.
  const sceneHeight = useMemo(() => {
    if (!root || textHeight === null) return 0;
    const fixed =
      insets.top + page.topBarHeight + page.minAirAbove +
      page.floorToHeadline + textHeight +
      page.ctaBottomGap + insets.bottom;
    const available = Math.max(0, root.height - fixed);
    return sceneHeightFor(fitBuddyHeight({ width: root.width, height: available }));
  }, [root, textHeight, insets.top, insets.bottom]);

  const layout = useMemo(() => {
    if (!root || sceneY === null || sceneHeight <= 0) return null;
    return computeScene({ x: 0, y: sceneY, width: root.width, height: sceneHeight });
  }, [root, sceneY, sceneHeight]);

  // The master clock holds on Beat 1's first frame until every frame is decoded and the scene is laid out.
  const clock = useDemoClock(assetsReady && layout !== null, reducedMotion);

  const onRootLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (changed(root?.width, width) || changed(root?.height, height)) setRoot({ width, height });
  };
  const onTextLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (changed(textHeight ?? undefined, h)) setTextHeight(h);
  };
  const onSceneLayout = (e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y;
    if (changed(sceneY ?? undefined, y)) setSceneY(y);
  };

  return (
    <View style={styles.root} onLayout={onRootLayout}>
      {root && (
        <Scene
          width={root.width}
          height={root.height}
          layout={layout}
          state={clock.state}
          toastText={t.batteryLow}
          onReady={onAssetsReady}
        />
      )}

      <View style={[styles.column, { paddingTop: insets.top, paddingBottom: insets.bottom + page.ctaBottomGap }]}>
        <View style={styles.topBar}>
          {__DEV__ ? <DebugScrubber elapsed={clock.elapsed} paused={clock.paused} /> : <View />}
          <LanguageToggle value={lang} onChange={setLang} />
        </View>

        <View style={[styles.airAbove, { minHeight: page.minAirAbove }]} />

        {/* The scene is drawn behind; this view reserves the phone's height (top to floor). */}
        <View style={{ height: sceneHeight }} onLayout={onSceneLayout} />

        <View style={{ height: page.floorToHeadline }} />

        <View style={styles.textBlock} onLayout={onTextLayout}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={type.maxFontScale}
            style={[
              styles.headline,
              { lineHeight: type.headline.size * type.headline.lineHeight[script] },
              script === 'devanagari' && styles.noTracking,
            ]}
          >
            {t.headline}
          </Text>
          <Text
            maxFontSizeMultiplier={type.maxFontScale}
            style={[styles.subline, { lineHeight: type.subline.size * type.subline.lineHeight[script] }]}
          >
            {t.subline}
          </Text>
          <CtaButton label={t.cta} onPress={onGetStarted} />
        </View>

        <View style={styles.airBelow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg.bottom },
  column: { flex: 1, paddingHorizontal: page.marginH },
  topBar: {
    zIndex: 10, // the dev scrubber panel floats over the scene
    height: page.topBarHeight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  airAbove: { flexGrow: page.spareAbove },
  airBelow: { flexGrow: page.spareBelow },
  textBlock: { alignItems: 'center' },
  headline: {
    fontSize: type.headline.size,
    fontWeight: type.headline.weight,
    letterSpacing: type.headline.letterSpacing,
    color: palette.ink.primary,
    textAlign: 'center',
    maxWidth: TB.maxWidth,
    marginBottom: TB.headlineToSubline,
  },
  noTracking: { letterSpacing: 0 },
  subline: {
    fontSize: type.subline.size,
    fontWeight: type.subline.weight,
    color: palette.ink.secondary,
    textAlign: 'center',
    maxWidth: TB.maxWidth,
    marginBottom: TB.sublineToCta,
  },
});
