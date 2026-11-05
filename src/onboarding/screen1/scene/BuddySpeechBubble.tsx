/** Checkpoint 1: one localized bubble at the existing shutdown/yawn reaction. */
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { runOnJS, useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import type { SceneLayout } from '../layout';
import { FRAME_IDS, type SceneState } from '../timeline';
import { speechBubble as B, type } from '../tokens';

const YAWN = FRAME_IDS.indexOf('yawn');

export function BuddySpeechBubble({ layout, screenWidth, screenHeight, state, text }: {
  layout: SceneLayout; screenWidth: number; screenHeight: number;
  state: SharedValue<SceneState>; text: string;
}) {
  const [visible, setVisible] = useState(false);
  // Reuse one existing reaction. No new timing event, timer or dialogue track.
  useAnimatedReaction(
    () => state.value.frameTo === YAWN,
    (next, previous) => { if (next !== previous) runOnJS(setVisible)(next); },
  );
  if (!visible) return null;
  const left = layout.phone.x + layout.phone.width + B.phoneGap;
  const width = Math.min(B.maxWidth, screenWidth - B.edgeInset - left);
  return <View pointerEvents="none" style={[
    styles.bubble,
    { left, width, bottom: screenHeight - layout.buddyCanvas.y + B.headGap },
  ]}>
    <View style={styles.tail} />
    <Text style={styles.text} maxFontSizeMultiplier={type.maxFontScale}>{text}</Text>
  </View>;
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute', borderRadius: B.radius, backgroundColor: B.surface,
    paddingHorizontal: B.paddingH, paddingVertical: B.paddingV,
    shadowColor: B.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  tail: {
    position: 'absolute', width: B.tail, height: B.tail, left: '38%',
    bottom: -B.tail / 2, backgroundColor: B.surface,
    transform: [{ rotate: '45deg' }],
  },
  text: {
    color: B.ink, fontSize: B.fontSize, lineHeight: B.lineHeight,
    fontWeight: '500', textAlign: 'center',
    fontFamily: Platform.select(type.subline.family),
  },
});
