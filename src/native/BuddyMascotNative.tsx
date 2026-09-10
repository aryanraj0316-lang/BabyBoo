import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Easing } from 'react-native';

const mascotBodySource = require('../../assets/mascot_body.png');
const mascotHandSource = require('../../assets/mascot_hand.png');

export type MascotMood = 'waving' | 'cheerful' | 'encouraging' | 'sleepy' | 'celebrate';

interface BuddyMascotNativeProps {
  mood?: MascotMood;
  size?: number;
  speechText?: string;
  animated?: boolean;
  waveHand?: boolean;
  lookAround?: boolean;
  isSpeaking?: boolean;
  mouthAnim?: Animated.Value;
}

export const BuddyMascotNative: React.FC<BuddyMascotNativeProps> = ({
  mood = 'cheerful',
  size = 140,
  speechText,
  animated = false,
  waveHand = true,
  lookAround = true,
  isSpeaking = false,
  mouthAnim,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const pupilAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Body hovering animation (if enabled)
  useEffect(() => {
    if (!animated) {
      bounceAnim.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [animated, bounceAnim]);

  // Hand waving animation
  useEffect(() => {
    if (!waveHand) {
      waveAnim.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 480,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: -1,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0.75,
          duration: 440,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: -0.75,
          duration: 460,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1200), // friendly pause between wave gestures
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [waveHand, waveAnim]);

  // Truly randomized, lifelike eye glancing animation
  useEffect(() => {
    if (!lookAround) {
      pupilAnim.setValue({ x: 0, y: 0 });
      return;
    }

    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const performRandomGlance = () => {
      if (!isMounted) return;

      // ~35% chance to gaze center, ~65% chance to glance in a random direction
      const isCenter = Math.random() < 0.35;
      let targetX = 0;
      let targetY = 0;

      if (!isCenter) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.2 + Math.random() * 2.2; // radius between 1.2px and 3.4px
        targetX = Math.cos(angle) * radius;
        targetY = Math.sin(angle) * radius;
      }

      // Smooth glance movement duration: 200ms - 380ms
      const moveDuration = 200 + Math.random() * 180;
      // Pause duration before next glance: 700ms - 2800ms
      const pauseDuration = isCenter
        ? 1400 + Math.random() * 1500
        : 700 + Math.random() * 1400;

      Animated.timing(pupilAnim, {
        toValue: { x: targetX, y: targetY },
        duration: moveDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && isMounted) {
          timerId = setTimeout(performRandomGlance, pauseDuration);
        }
      });
    };

    performRandomGlance();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      pupilAnim.stopAnimation();
    };
  }, [lookAround, pupilAnim]);

  // Proportional Sizing
  const bodyWidth = size;
  const bodyHeight = size * (682 / 1024); // 0.666
  const handWidth = size * 0.41;
  const handHeight = handWidth * (972 / 1024); // ~0.389 * size

  // Hand alignment relative to body
  const handLeft = bodyWidth * 0.05;
  const handTop = bodyHeight * 0.27;
  const pivotX = handWidth * 0.72;
  const pivotY = handHeight * 0.85;

  const waveRotation = waveAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-14deg', '-10deg', '-6deg'],
  });

  // Pupil Highlight Size (Single Dot)
  const mainPupilSize = Math.max(5, bodyWidth * 0.034);

  // Eye Positions on Body Image
  const leftEyeX = bodyWidth * 0.416;
  const leftEyeY = bodyHeight * 0.419;
  const rightEyeX = bodyWidth * 0.646;
  const rightEyeY = bodyHeight * 0.463;

  return (
    <View style={styles.wrapper}>
      {speechText ? (
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{speechText}</Text>
          <View style={styles.speechArrow} />
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.mascotContainer,
          { width: bodyWidth, height: bodyHeight },
          animated ? { transform: [{ translateY: bounceAnim }] } : null,
        ]}
      >
        <View style={{ position: 'relative', width: bodyWidth, height: bodyHeight }}>
          {/* Waving Paw / Arm Layer (Behind face) */}
          <Animated.View
            style={[
              styles.armWrapper,
              {
                width: handWidth,
                height: handHeight,
                left: handLeft,
                top: handTop,
                zIndex: 1,
                elevation: 1,
                transform: [
                  { translateX: pivotX },
                  { translateY: pivotY },
                  { rotate: waveRotation },
                  { translateX: -pivotX },
                  { translateY: -pivotY },
                ],
              },
            ]}
          >
            <Image
              source={mascotHandSource}
              style={{ width: handWidth, height: handHeight }}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Mascot Head & Torso Body Layer (In front of hand) */}
          <View style={[styles.bodyWrapper, { width: bodyWidth, height: bodyHeight, zIndex: 5, elevation: 5 }]}>
            <Image
              source={mascotBodySource}
              style={{ width: bodyWidth, height: bodyHeight }}
              resizeMode="contain"
            />

            {/* Left Eye Pupil Shine (Single White Dot) */}
            <Animated.View
              style={[
                styles.pupilContainer,
                {
                  left: leftEyeX - mainPupilSize / 2,
                  top: leftEyeY - mainPupilSize / 2,
                  transform: [
                    { translateX: pupilAnim.x },
                    { translateY: pupilAnim.y },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.mainPupilShine,
                  {
                    width: mainPupilSize,
                    height: mainPupilSize,
                    borderRadius: mainPupilSize / 2,
                  },
                ]}
              />
            </Animated.View>

            {/* Right Eye Pupil Shine (Single White Dot) */}
            <Animated.View
              style={[
                styles.pupilContainer,
                {
                  left: rightEyeX - mainPupilSize / 2,
                  top: rightEyeY - mainPupilSize / 2,
                  transform: [
                    { translateX: pupilAnim.x },
                    { translateY: pupilAnim.y },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.mainPupilShine,
                  {
                    width: mainPupilSize,
                    height: mainPupilSize,
                    borderRadius: mainPupilSize / 2,
                  },
                ]}
              />
            </Animated.View>

            {/* Lip-Sync Animated Mouth (Syncs with Voice Audio) */}
            {isSpeaking && (
              <Animated.View
                style={[
                  styles.animatedMouthContainer,
                  {
                    left: bodyWidth * 0.52 - (size * 0.075) / 2,
                    top: bodyHeight * 0.56,
                    width: size * 0.075,
                    height: size * 0.04,
                    transform: [
                      {
                        scaleY: mouthAnim
                          ? mouthAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.3, 1.4],
                            })
                          : 1,
                      },
                      {
                        scaleX: mouthAnim
                          ? mouthAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1.1],
                            })
                          : 1,
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.innerMouthShape} />
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  mascotContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  armWrapper: {
    position: 'absolute',
    zIndex: 1,
    elevation: 1,
  },
  bodyWrapper: {
    position: 'relative',
    zIndex: 2,
    elevation: 2,
  },
  pupilContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  mainPupilShine: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  subPupilShine: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    maxWidth: 240,
    alignItems: 'center',
    zIndex: 20,
  },
  speechText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  speechArrow: {
    position: 'absolute',
    bottom: -6,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FEF3C7',
  },
  animatedMouthContainer: {
    position: 'absolute',
    zIndex: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerMouthShape: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7C2D12',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderWidth: 1,
    borderColor: '#451A03',
  },
});
