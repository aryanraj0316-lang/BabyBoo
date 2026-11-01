/**
 * Onboarding screen 1: the battery-down demo (phone + Buddy) on top, then the
 * headline, subline and Get Started button.
 *
 * Layout: the scene is sized from Buddy's height cap (see layout.ts) and
 * centred in the space between the language toggle and the text block, so on
 * large screens the extra room becomes air, never a bigger phone.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { computeScene } from './layout';
import { LanguageToggle } from './LanguageToggle';
import { CtaButton } from './CtaButton';
import { Scene } from './scene/Scene';
import { STRINGS, type Language } from './strings';
import { page, palette, textBlock as TB, type } from './tokens';

export interface OnboardingScreen1Props {
  onGetStarted: () => void;
}

export function OnboardingScreen1({ onGetStarted }: OnboardingScreen1Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [lang, setLang] = useState<Language>('en');
  const [region, setRegion] = useState<{ y: number; height: number } | null>(null);
  const t = STRINGS[lang];
  const script = lang === 'hi' ? 'devanagari' : 'latin';

  const onSceneLayout = (e: LayoutChangeEvent) => {
    const { y, height: h } = e.nativeEvent.layout;
    if (!region || Math.abs(region.y - y) > 0.5 || Math.abs(region.height - h) > 0.5) setRegion({ y, height: h });
  };

  const layout = useMemo(() => {
    if (!region) return null;
    return computeScene({
      x: 0,
      y: region.y + page.sceneTopGapMin,
      width,
      height: region.height - page.sceneTopGapMin - page.sceneTextGapMin,
    });
  }, [region, width]);

  return (
    <View style={styles.root}>
      <Scene width={width} height={height} layout={layout} />

      <View style={[styles.column, { paddingTop: insets.top, paddingBottom: insets.bottom + page.ctaBottomGap }]}>
        <View style={styles.topBar}>
          <LanguageToggle value={lang} onChange={setLang} />
        </View>

        {/* The scene is drawn behind; this view only reserves its space. */}
        <View style={styles.sceneRegion} onLayout={onSceneLayout} />

        <View style={styles.textBlock}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg.bottom },
  column: { flex: 1, paddingHorizontal: page.marginH },
  topBar: {
    height: page.topBarHeight,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sceneRegion: { flex: 1 },
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
