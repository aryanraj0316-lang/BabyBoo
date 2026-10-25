/**
 * Fallback hero: the static bear with a gentle breathing transform and a
 * simple three-frame phone crossfade (playing, dead, woken). Used when Skia
 * or the shader cannot initialize, and (static) while textures load.
 */
import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import { computeLayout } from './layout';
import { MASCOT_STATIC } from './mascot/mascotAssets.generated';
import { RIG } from './mascot/rig';

export function HeroFallback({ width, height, animated = true }: { width: number; height: number; animated?: boolean }) {
  const L = computeLayout(width, height);
  const breath = useSharedValue(0);
  const phase = useSharedValue(0);
  useEffect(() => {
    if (!animated) return;
    breath.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
    phase.value = withRepeat(withTiming(3, { duration: 9000, easing: Easing.linear }), -1, false);
    return () => {
      cancelAnimation(breath);
      cancelAnimation(phase);
    };
  }, [animated]);
  const sb = RIG.silhouetteBounds;
  const full = 1254 * L.buddy.scale;
  const bearStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -breath.value * 1.5 }, { scaleY: 1 + breath.value * 0.012 }],
  }));
  const useFrameOpacity = (k: number) =>
    useAnimatedStyle(() => {
      const p = phase.value;
      const d = Math.min(Math.abs(p - k), Math.abs(p - k - 3), Math.abs(p - k + 3));
      return { opacity: animated ? Math.max(0, Math.min(1, 1.6 - d * 1.6)) : k === 0 ? 1 : 0 };
    });
  const s0 = useFrameOpacity(0);
  const s1 = useFrameOpacity(1);
  const s2 = useFrameOpacity(2);
  const S = L.screen;
  return (
    <View style={{ width, height }} pointerEvents="none">
      <View style={[styles.phone, { left: L.phone.x, top: L.phone.y, width: L.phone.w, height: L.phone.h, borderRadius: L.phone.r }]}>
        <View style={{ position: 'absolute', left: S.x - L.phone.x, top: S.y - L.phone.y, width: S.w, height: S.h, borderRadius: S.r, overflow: 'hidden', backgroundColor: '#000' }}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#BFE6FF' }, s0]}>
            <View style={[styles.hill, { backgroundColor: '#7CCB97', height: S.h * 0.3 }]} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, s1]} />
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#E8F6FF' }, s2]}>
            <View style={[styles.hill, { backgroundColor: '#A8DDB5', height: S.h * 0.34 }]} />
          </Animated.View>
        </View>
      </View>
      <Animated.View style={[{ position: 'absolute', left: L.buddy.x - sb[0] * L.buddy.scale, top: L.buddy.y - sb[1] * L.buddy.scale, width: full, height: full }, bearStyle]}>
        <Image source={MASCOT_STATIC} style={{ width: full, height: full }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  phone: { position: 'absolute', backgroundColor: '#2B2A33' },
  hill: { position: 'absolute', left: -10, right: -10, bottom: 0, borderTopLeftRadius: 400, borderTopRightRadius: 400 },
});
