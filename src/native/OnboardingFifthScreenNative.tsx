import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Easing,
  ScrollView,
} from 'react-native';

const mascotBodySource = require('../../assets/mascot_body.png');
const mascotHandSource = require('../../assets/mascot_hand.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface OnboardingScreen5Data {
  childName: string;
  ageCategory: string;
  frequencyChipId: string; // 'once' | '2_to_3' | '4_to_5' | 'more_than_5'
  frequencyLabel: string;
  dailyFrequency: number;
  empathyPose: 'E1' | 'E2' | 'E3' | 'E4';
}

interface OnboardingFifthScreenNativeProps {
  childName?: string;
  ageCategory?: string;
  onBack?: () => void;
  onContinue: (data: OnboardingScreen5Data) => void;
  onSkip?: () => void;
  initialLanguage?: 'en' | 'hi';
}

type Language = 'en' | 'hi';
type EmpathyPose = 'E1' | 'E2' | 'E3' | 'E4';

interface FrequencyChipConfig {
  id: string;
  label: string;
  labelHi: string;
  dailyCount: number;
  pose: EmpathyPose;
  line1: string;
  line2: string;
  line1Hi: string;
  line2Hi: string;
  helperText?: string;
}

const FREQUENCY_CHIPS: FrequencyChipConfig[] = [
  {
    id: 'once',
    label: 'Once',
    labelHi: 'एक बार',
    dailyCount: 1,
    pose: 'E1',
    line1: 'One goodbye a day is easy to manage.',
    line2: 'I can make it smooth.',
    line1Hi: 'दिन में एक अलविदा संभालना आसान है।',
    line2Hi: 'मैं इसे बहुत सहज बना सकता हूँ।',
  },
  {
    id: '2_to_3',
    label: '2 to 3 times',
    labelHi: '2 से 3 बार',
    dailyCount: 2.5,
    pose: 'E2',
    line1: 'That’s a few goodbyes a day.',
    line2: 'I can handle each one.',
    line1Hi: 'यह दिन में कुछ अलविदा हैं।',
    line2Hi: 'मैं हर एक को संभाल सकता हूँ।',
  },
  {
    id: '4_to_5',
    label: '4 to 5 times',
    labelHi: '4 से 5 बार',
    dailyCount: 4.5,
    pose: 'E3',
    line1: 'That’s a lot of goodbyes to manage.',
    line2: 'I can take some of that weight.',
    line1Hi: 'इतने सारे अलविदा संभालना काफी भारी पड़ता है।',
    line2Hi: 'मैं आपका यह भार हल्का कर सकता हूँ।',
  },
  {
    id: 'more_than_5',
    label: 'More than 5 times',
    labelHi: '5 बार से ज़्यादा',
    dailyCount: 6,
    pose: 'E4',
    line1: 'That’s a busy day for you.',
    line2: 'Let’s make every goodbye easier.',
    line1Hi: 'आपके लिए यह बहुत व्यस्त दिन है।',
    line2Hi: 'आइए हर अलविदा को आसान बनाते हैं।',
  },
];

export const OnboardingFifthScreenNative: React.FC<OnboardingFifthScreenNativeProps> = ({
  childName = 'Leo',
  ageCategory = '2_4',
  onBack,
  onContinue,
  onSkip,
  initialLanguage = 'en',
}) => {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const cleanName = childName?.trim() || 'Leo';

  const questionEn = `How many times in a day does ${cleanName} get the phone?`;
  const questionHi = `${cleanName} दिन में कितनी बार फोन लेता है?`;

  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [activePose, setActivePose] = useState<EmpathyPose>('E1');

  // Sequential speech line state
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [line1Text, setLine1Text] = useState<string>(lang === 'hi' ? questionHi : questionEn);
  const [line2Text, setLine2Text] = useState<string>('');
  const [isLine2Mounted, setIsLine2Mounted] = useState<boolean>(false);

  // Animations
  const handWaveAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const empathyScale = useRef(new Animated.Value(1)).current;
  const empathyTilt = useRef(new Animated.Value(0)).current;

  // Typing Dots Animations
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Speech Lines Animations (Sentence 1 -> 1s delay -> Sentence 2)
  const line1Fade = useRef(new Animated.Value(0)).current;
  const line1Translate = useRef(new Animated.Value(6)).current;
  const line2Fade = useRef(new Animated.Value(0)).current;
  const line2Translate = useRef(new Animated.Value(6)).current;

  // Continue Button
  const continueFade = useRef(new Animated.Value(0)).current;
  const continueTranslate = useRef(new Animated.Value(16)).current;
  const [isContinueVisible, setIsContinueVisible] = useState<boolean>(false);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const line2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Idle mascot waving & gentle floating
  useEffect(() => {
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(handWaveAnim, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(handWaveAnim, { toValue: -1, duration: 460, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(handWaveAnim, { toValue: 0.8, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(handWaveAnim, { toValue: 0, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(1000),
      ])
    );
    waveLoop.start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -5, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoop.start();

    return () => {
      waveLoop.stop();
      floatLoop.stop();
    };
  }, [handWaveAnim, floatAnim]);

  // 2. Typing dots loop
  useEffect(() => {
    const createDotLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -6, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.delay(360),
        ])
      );
    };

    const loop1 = createDotLoop(dot1Anim, 0);
    const loop2 = createDotLoop(dot2Anim, 140);
    const loop3 = createDotLoop(dot3Anim, 280);

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  // 3. Initial Question entrance
  useEffect(() => {
    if (!selectedChipId) {
      setIsTyping(true);
      setIsLine2Mounted(false);
      line1Fade.setValue(0);
      line1Translate.setValue(6);
      line2Fade.setValue(0);

      const timer = setTimeout(() => {
        setIsTyping(false);
        setLine1Text(lang === 'hi' ? questionHi : questionEn);
        setLine2Text('');

        Animated.parallel([
          Animated.timing(line1Fade, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(line1Translate, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]).start();
      }, 350);

      return () => clearTimeout(timer);
    } else {
      const chip = FREQUENCY_CHIPS.find((c) => c.id === selectedChipId);
      if (chip) {
        setLine1Text(lang === 'hi' ? chip.line1Hi : chip.line1);
        setLine2Text(lang === 'hi' ? chip.line2Hi : chip.line2);
      }
    }
  }, [lang, questionEn, questionHi, selectedChipId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  // 4. Chip Selection & Sequential Text Fade-In
  const handleSelectChip = (chip: FrequencyChipConfig) => {
    setSelectedChipId(chip.id);
    setActivePose(chip.pose);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    // Reset line 2 state
    setIsLine2Mounted(false);
    line1Fade.setValue(0);
    line1Translate.setValue(6);
    line2Fade.setValue(0);
    line2Translate.setValue(6);

    const l1 = lang === 'hi' ? chip.line1Hi : chip.line1;
    const l2 = lang === 'hi' ? chip.line2Hi : chip.line2;

    // Show typing dots briefly
    setIsTyping(true);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setLine1Text(l1);
      setLine2Text(l2);

      // Sentence 1 fades in
      Animated.parallel([
        Animated.timing(line1Fade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(line1Translate, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        // Once sentence 1 is there, wait exactly 1 second, then sentence 2 appears
        line2TimerRef.current = setTimeout(() => {
          setIsLine2Mounted(true);
          Animated.parallel([
            Animated.timing(line2Fade, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.timing(line2Translate, { toValue: 0, duration: 380, useNativeDriver: true }),
          ]).start();

          // Reveal Continue button smoothly when line 2 appears
          if (!isContinueVisible) {
            setIsContinueVisible(true);
            Animated.parallel([
              Animated.timing(continueFade, { toValue: 1, duration: 350, useNativeDriver: true }),
              Animated.timing(continueTranslate, { toValue: 0, duration: 350, useNativeDriver: true }),
            ]).start();
          }
        }, 1000);
      });
    }, 220);

    // Buddy Pose Animation (E1 = happy/thumbs-up, E2 = smiling/nodding, E3 = sympathetic/heart, E4 = gentle/hug)
    if (chip.pose === 'E1') {
      // E1: Happy, small thumbs-up bounce
      Animated.sequence([
        Animated.timing(empathyScale, { toValue: 1.08, duration: 220, useNativeDriver: true }),
        Animated.timing(empathyScale, { toValue: 0.98, duration: 180, useNativeDriver: true }),
        Animated.timing(empathyScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (chip.pose === 'E2') {
      // E2: Smiling, rhythmic head nod
      Animated.sequence([
        Animated.timing(empathyTilt, { toValue: 3.5, duration: 180, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: -2.5, duration: 190, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: 2.5, duration: 180, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: 0, duration: 190, useNativeDriver: true }),
      ]).start();
    } else if (chip.pose === 'E3') {
      // E3: Sympathetic, hand on heart soft lean
      Animated.timing(empathyTilt, {
        toValue: -4,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else if (chip.pose === 'E4') {
      // E4: Gentle, offers a hug comforting scale & posture
      Animated.parallel([
        Animated.timing(empathyScale, { toValue: 1.05, duration: 250, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: 2.5, duration: 250, useNativeDriver: true }),
      ]).start();
    }

    // Settle back to calm posture after 2.5s
    settleTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(empathyScale, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2500);
  };

  const handleContinuePress = () => {
    const chosen = FREQUENCY_CHIPS.find((c) => c.id === selectedChipId) || FREQUENCY_CHIPS[0];
    onContinue({
      childName: cleanName,
      ageCategory,
      frequencyChipId: chosen.id,
      frequencyLabel: chosen.label,
      dailyFrequency: chosen.dailyCount,
      empathyPose: chosen.pose,
    });
  };

  const waveInterpolate = handWaveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-16deg', '22deg'],
  });

  const tiltInterpolate = empathyTilt.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER: BACK, LANGUAGE TOGGLE & DEV SKIP */}
      <View style={styles.topHeader}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>{lang === 'hi' ? 'पीछे' : 'Back'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Monochrome Language Pill */}
          <View style={styles.langPill}>
            <TouchableOpacity
              onPress={() => setLang('en')}
              activeOpacity={0.8}
              style={[styles.langOption, lang === 'en' && styles.langOptionActive]}
            >
              <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLang('hi')}
              activeOpacity={0.8}
              style={[styles.langOption, lang === 'hi' && styles.langOptionActive]}
            >
              <Text style={[styles.langText, lang === 'hi' && styles.langTextActive]}>हिन्दी</Text>
            </TouchableOpacity>
          </View>

          {/* Dev Skip Button */}
          {onSkip ? (
            <TouchableOpacity onPress={onSkip} activeOpacity={0.7} style={styles.devSkipButton}>
              <Text style={styles.devSkipText}>Skip</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. BUDDY MASCOT & DYNAMIC SPEECH BUBBLE */}
        <View style={styles.mascotSection}>
          <View style={styles.speechBubbleWrapper}>
            <View style={styles.speechBubble}>
              {isTyping ? (
                <View style={styles.typingContainer}>
                  <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1Anim }] }]} />
                  <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2Anim }] }]} />
                  <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3Anim }] }]} />
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  {/* Sentence 1: Fades in first */}
                  <Animated.View
                    style={{
                      opacity: line1Fade,
                      transform: [{ translateY: line1Translate }],
                    }}
                  >
                    <Text style={styles.speechText}>{line1Text}</Text>
                  </Animated.View>

                  {/* Sentence 2: Appears once Sentence 1 has been there for 1 second */}
                  {isLine2Mounted && line2Text ? (
                    <Animated.View
                      style={{
                        opacity: line2Fade,
                        transform: [{ translateY: line2Translate }],
                        marginTop: 4,
                      }}
                    >
                      <Text style={[styles.speechText, styles.speechTextLine2]}>
                        {line2Text}
                      </Text>
                    </Animated.View>
                  ) : null}
                </View>
              )}
            </View>
            <View style={styles.speechBubbleTail} />
          </View>

          {/* Animated Mascot Figure (With Empathy Poses) */}
          <Animated.View
            style={[
              styles.mascotFigure,
              {
                transform: [
                  { translateY: floatAnim },
                  { scale: empathyScale },
                  { rotate: tiltInterpolate },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.mascotHandWrapper,
                { transform: [{ rotate: waveInterpolate }] },
              ]}
            >
              <Image source={mascotHandSource} style={styles.mascotHandImg} resizeMode="contain" />
            </Animated.View>
            <Image source={mascotBodySource} style={styles.mascotBodyImg} resizeMode="contain" />
          </Animated.View>
        </View>

        {/* 3. FREQUENCY CHIPS LIST (Pure Typography, Zero Emojis) */}
        <View style={styles.chipsSection}>
          <Text style={styles.chipsHeading}>
            {lang === 'hi' ? 'दिन में कितनी बार फोन मिलता है?' : 'Phone handovers in a day:'}
          </Text>

          <View style={styles.chipsList}>
            {FREQUENCY_CHIPS.map((chip) => {
              const isSelected = selectedChipId === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  onPress={() => handleSelectChip(chip)}
                  activeOpacity={0.8}
                  style={[
                    styles.chipCard,
                    isSelected ? styles.chipCardSelected : styles.chipCardNormal,
                  ]}
                >
                  <View style={styles.chipLeftCol}>
                    <Text
                      style={[
                        styles.chipTitle,
                        isSelected ? styles.chipTitleSelected : styles.chipTitleNormal,
                      ]}
                    >
                      {lang === 'hi' ? chip.labelHi : chip.label}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.chipIndicator,
                      isSelected ? styles.chipIndicatorSelected : styles.chipIndicatorNormal,
                    ]}
                  >
                    {isSelected && <Text style={styles.chipCheckmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. CONTINUE ACTION BUTTON */}
        {isContinueVisible && (
          <Animated.View
            style={[
              styles.continueWrapper,
              {
                opacity: continueFade,
                transform: [{ translateY: continueTranslate }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleContinuePress}
              activeOpacity={0.88}
              style={styles.continueBtn}
            >
              <Text style={styles.continueBtnText}>
                {lang === 'hi' ? 'आगे बढ़ें' : 'Continue'}
              </Text>
              <Text style={styles.continueArrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F1EFEA',
  },
  backArrow: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2436',
    marginRight: 4,
  },
  backText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
  },
  langPill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  langOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langOptionActive: {
    backgroundColor: '#000000',
  },
  langText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  devSkipButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  devSkipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    alignItems: 'center',
  },
  mascotSection: {
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  speechBubbleWrapper: {
    alignItems: 'center',
    marginBottom: 6,
    maxWidth: 320,
    width: '100%',
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C6DF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  speechBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#DDD6FE',
    alignSelf: 'center',
  },
  speechText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 20,
  },
  speechTextLine2: {
    fontWeight: '800',
    color: '#4338CA',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 18,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#7C6DF8',
  },
  mascotFigure: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mascotHandWrapper: {
    position: 'absolute',
    top: 6,
    right: 12,
    zIndex: 2,
  },
  mascotHandImg: {
    width: 32,
    height: 32,
  },
  mascotBodyImg: {
    width: 98,
    height: 98,
  },
  chipsSection: {
    width: '100%',
    maxWidth: 360,
    marginTop: 8,
  },
  chipsHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsList: {
    gap: 9,
    width: '100%',
  },
  chipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  chipCardNormal: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  chipCardSelected: {
    backgroundColor: '#FAF5FF',
    borderColor: '#7C6DF8',
    shadowColor: '#7C6DF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  chipLeftCol: {
    flex: 1,
  },
  chipTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  chipTitleNormal: {
    color: '#1E293B',
  },
  chipTitleSelected: {
    color: '#6D28D9',
  },
  chipIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  chipIndicatorNormal: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  chipIndicatorSelected: {
    backgroundColor: '#7C6DF8',
  },
  chipCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  continueWrapper: {
    width: '100%',
    maxWidth: 360,
    marginTop: 18,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D997C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  continueArrow: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
