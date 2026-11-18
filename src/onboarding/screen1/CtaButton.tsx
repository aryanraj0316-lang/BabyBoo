/** Full-width primary button: scales to 0.97 and darkens on press, light haptic. */
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { springConfig } from './motion';
import { cta as C, palette, spring, type } from './tokens';

interface Props {
  label: string;
  onPress: () => void;
  visible?: boolean;
}

const SNAPPY = springConfig(spring.snappy);

export function CtaButton({ label, onPress, visible = true }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.wrap, animated, !visible && styles.hidden]}
    >
      <Pressable
        disabled={!visible}
        onPress={onPress}
        onPressIn={() => {
          scale.set(withSpring(C.pressScale, SNAPPY));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }}
        onPressOut={() => {
          scale.set(withSpring(1, SNAPPY));
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.label} maxFontSizeMultiplier={type.maxFontScale}>
          {label}
        </Text>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.arrow}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M4 12h15M13 6l6 6-6 6" stroke={palette.cta.label} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    shadowColor: '#352246', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16, shadowRadius: 9, elevation: 4,
    borderRadius: C.radius,
  },
  hidden: { opacity: 0 }, // Keep the measured slot so nothing shifts on reveal.
  button: {
    minHeight: C.height,
    paddingVertical: C.paddingV,
    paddingHorizontal: 22,
    borderRadius: C.radius,
    backgroundColor: palette.cta.fill,
    borderWidth: 1,
    borderColor: '#8065BA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: { backgroundColor: palette.cta.fillPressed },
  label: {
    flexShrink: 1,
    letterSpacing: 0.15,
    fontFamily: Platform.select(type.cta.family),
    color: palette.cta.label,
    fontSize: type.cta.size,
    fontWeight: type.cta.weight,
  },
  arrow: { marginLeft: 16, width: 24, alignItems: 'center' },
});
