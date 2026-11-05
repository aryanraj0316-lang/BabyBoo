/** One localized still bubble, synchronized to the shared phone story. */
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { SceneLayout } from '../layout';
import type { SceneState } from '../timeline';
import { DIALOGUE_IDS, type BuddyDialogue } from '../dialogue';
import { speechBubble as B, type } from '../tokens';

export function BuddySpeechBubble({ layout, screenWidth, screenHeight, state, dialogue }: {
  layout: SceneLayout; screenWidth: number; screenHeight: number;
  state: SharedValue<SceneState>; dialogue: BuddyDialogue;
}) {
  const [id, setId] = useState(-1);
  // JS updates only on a dialogue turn; opacity stays on the shared UI clock.
  useAnimatedReaction(
    () => state.value.dialogueId,
    (next, previous) => { if (next !== previous) runOnJS(setId)(next); },
  );
  const opacity = useAnimatedStyle(() => ({ opacity: state.value.dialogueOpacity }));
  const key = DIALOGUE_IDS[id];
  if (!key) return null;
  const left = layout.phone.x + layout.phone.width + B.phoneGap;
  const width = Math.min(B.maxWidth, screenWidth - B.edgeInset - left);
  return <Animated.View pointerEvents="none" style={[
    styles.bubble,
    { left, width, bottom: screenHeight - layout.buddyCanvas.y + B.headGap },
    opacity,
  ]}>
    <View style={styles.tail} />
    <Text style={styles.text} maxFontSizeMultiplier={type.maxFontScale}>{dialogue[key]}</Text>
  </Animated.View>;
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
