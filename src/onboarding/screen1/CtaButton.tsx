/** Full-width primary button: scales to 0.97 and darkens on press, light haptic. */
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { springConfig } from './motion';
import { cta as C, palette, spring, type } from './tokens';

interface Props {
  label: string;
  onPress: () => void;
}

const SNAPPY = springConfig(spring.snappy);

export function CtaButton({ label, onPress }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.wrap, animated]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(C.pressScale, SNAPPY);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SNAPPY);
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.label} maxFontSizeMultiplier={type.maxFontScale}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  button: {
    minHeight: C.height,
    paddingVertical: C.paddingV,
    borderRadius: C.radius,
    backgroundColor: palette.cta.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: palette.cta.fillPressed },
  label: {
    color: palette.cta.label,
    fontSize: type.cta.size,
    fontWeight: type.cta.weight,
  },
});
