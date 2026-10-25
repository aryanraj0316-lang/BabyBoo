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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';

const mascotBodySource = require('../../assets/mascot_body.png');
const mascotHandSource = require('../../assets/mascot_hand.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface OnboardingSecondChildData {
  name: string;
  ageCategory: string; // 'under_2' | '2_3' | '4_5' | '6_7' | '8_10'
  ageLabel: string;
}

interface OnboardingSecondScreenNativeProps {
  onBack?: () => void;
  onContinue: (childData: OnboardingSecondChildData) => void;
  onSkip?: () => void;
  initialLanguage?: 'en' | 'hi';
}

type Language = 'en' | 'hi';

const AGE_OPTIONS = [
  { id: 'under_1', label: 'Under 1', desc: 'Under 12 months' },
  { id: 'age_1', label: '1 year', desc: '12–23 months' },
  { id: '2_4', label: '2–4', desc: 'Toddler / Preschool' },
  { id: '5_7', label: '5–7', desc: 'Early Elementary' },
  { id: '8_10', label: '8–10', desc: 'Middle Childhood' },
];

export const OnboardingSecondScreenNative: React.FC<OnboardingSecondScreenNativeProps> = ({
  onBack,
  onContinue,
  onSkip,
  initialLanguage = 'en',
}) => {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [childName, setChildName] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string | null>(null);

  // Buddy Speech Bubble State
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [speechText, setSpeechText] = useState<string>('Hi I am Buddy. Tell me about your little one.');

  const inputRef = useRef<any>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNameRef = useRef<string>('');

  // -------------------------------------------------------------
  // ANIMATION VALUES
  // -------------------------------------------------------------
  const handWaveAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Typing Dots Animations
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Text Box Entrance (Immediate)
  const textBoxFade = useRef(new Animated.Value(1)).current;
  const textBoxTranslate = useRef(new Animated.Value(0)).current;
  const [isTextBoxVisible, setIsTextBoxVisible] = useState<boolean>(true);

  // Age Chips Fade In
  const ageChipsFade = useRef(new Animated.Value(0)).current;
  const ageChipsTranslate = useRef(new Animated.Value(18)).current;
  const [areChipsVisible, setAreChipsVisible] = useState<boolean>(false);

  // Continue Button Entrance
  const continueFade = useRef(new Animated.Value(0)).current;
  const continueTranslate = useRef(new Animated.Value(20)).current;
  const [isContinueVisible, setIsContinueVisible] = useState<boolean>(false);

  // -------------------------------------------------------------
  // 1. MASCOT WAVING & FLOATING IDLE ANIMATIONS
  // -------------------------------------------------------------
  useEffect(() => {
    // Hand Waving sinusoidal loop
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(handWaveAnim, {
          toValue: 1,
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(handWaveAnim, {
          toValue: -1,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(handWaveAnim, {
          toValue: 0.8,
          duration: 360,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(handWaveAnim, {
          toValue: -0.8,
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(handWaveAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(900), // Natural playful pause
      ])
    );
    waveLoop.start();

    // Subtle gentle float
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    return () => {
      waveLoop.stop();
      floatLoop.stop();
    };
  }, [handWaveAnim, floatAnim]);

  // -------------------------------------------------------------
  // 2. TYPING DOTS ANIMATION IN BUDDY'S BUBBLE
  // -------------------------------------------------------------
  useEffect(() => {
    const createDotLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -6,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
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

  // -------------------------------------------------------------
  // 3. INITIAL INTRO SEQUENCE:
  // Mascot waves & speaks greeting -> keyboard opens immediately as BabyBoo asks for a name
  // -------------------------------------------------------------
  useEffect(() => {
    // Initial typing indicator for Buddy's greeting
    setIsTyping(true);
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
      setSpeechText(
        lang === 'hi'
          ? 'नमस्ते, मैं बडी हूँ। अपने बच्चे के बारे में बताइए।'
          : 'Hi I am Buddy. Tell me about your little one.'
      );
    }, 250);

    // Make keyboard appear immediately
    inputRef.current?.focus();
    const focusTimer1 = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    const focusTimer2 = setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
    const focusTimer3 = setTimeout(() => {
      inputRef.current?.focus();
    }, 450);

    return () => {
      clearTimeout(typingTimer);
      clearTimeout(focusTimer1);
      clearTimeout(focusTimer2);
      clearTimeout(focusTimer3);
    };
  }, [lang]);

  // -------------------------------------------------------------
  // 4. REACTIVE BUDDY REACTION ON "GO" CLICK
  // User types name, then clicks "Go" -> Buddy reacts & Age chips appear!
  // -------------------------------------------------------------
  const handleNameChange = (text: string) => {
    setChildName(text);
    if (areChipsVisible && text.trim().length >= 1) {
      setSpeechText(
        lang === 'hi'
          ? `नमस्ते ${text.trim()}! ${text.trim()} कितने साल का है?`
          : `Hi ${text.trim()}. How old is ${text.trim()}?`
      );
      prevNameRef.current = text.trim();
    }
  };

  const handleNameSubmit = () => {
    const trimmed = childName.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    Keyboard.dismiss();

    // Trigger Buddy typing indicator then speak: "Hi Leo. How old is Leo?"
    setIsTyping(true);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setSpeechText(
        lang === 'hi'
          ? `नमस्ते ${trimmed}! ${trimmed} कितने साल का है?`
          : `Hi ${trimmed}. How old is ${trimmed}?`
      );
      prevNameRef.current = trimmed;
    }, 380);

    // Reveal Age Chips when Go button is clicked
    if (!areChipsVisible) {
      setAreChipsVisible(true);
      Animated.parallel([
        Animated.timing(ageChipsFade, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ageChipsTranslate, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // -------------------------------------------------------------
  // 5. CONTINUE BUTTON ENTRANCE
  // Appears as soon as an age chip is selected & child name is valid
  // -------------------------------------------------------------
  const handleSelectAge = (ageId: string) => {
    setSelectedAge(ageId);

    // Dismiss keyboard gracefully to focus on review & continue
    Keyboard.dismiss();

    if (!isContinueVisible && childName.trim().length >= 1) {
      setIsContinueVisible(true);
      Animated.parallel([
        Animated.timing(continueFade, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
        Animated.timing(continueTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.3)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleContinuePress = () => {
    const finalName = childName.trim() || 'My Child';
    const chosenOption = AGE_OPTIONS.find((opt) => opt.id === selectedAge) || AGE_OPTIONS[2];
    onContinue({
      name: finalName,
      ageCategory: chosenOption.id,
      ageLabel: chosenOption.label,
    });
  };

  const waveInterpolate = handWaveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-18deg', '22deg'],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ========================================================================= */}
      {/* 1. TOP BAR: BACK & LANGUAGE TOGGLE */}
      {/* ========================================================================= */}
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
          {/* Monochrome Black & White Language Switcher */}
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* 2. BUDDY MASCOT & DYNAMIC SPEECH BUBBLE */}
        {/* ========================================================================= */}
        <View style={styles.mascotSection}>
          {/* Animated Speech Bubble */}
          <View style={styles.speechBubbleWrapper}>
            <View style={styles.speechBubble}>
              {isTyping ? (
                <View style={styles.typingContainer}>
                  <Animated.View
                    style={[
                      styles.typingDot,
                      { transform: [{ translateY: dot1Anim }] },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.typingDot,
                      { transform: [{ translateY: dot2Anim }] },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.typingDot,
                      { transform: [{ translateY: dot3Anim }] },
                    ]}
                  />
                </View>
              ) : (
                <Text style={styles.speechText}>{speechText}</Text>
              )}
            </View>
            <View style={styles.speechBubbleTail} />
          </View>

          {/* Waving Mascot Figure */}
          <Animated.View
            style={[
              styles.mascotFigure,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            {/* Waving Hand Behind / Beside Head */}
            <Animated.View
              style={[
                styles.mascotHandWrapper,
                { transform: [{ rotate: waveInterpolate }] },
              ]}
            >
              <Image
                source={mascotHandSource}
                style={styles.mascotHandImg}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Mascot Body */}
            <Image
              source={mascotBodySource}
              style={styles.mascotBodyImg}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* ========================================================================= */}
        {/* 3. FLOATING TEXT BOX: CHILD NAME (Half-second delay entrance) */}
        {/* The name stays visible so any typo can be corrected! */}
        {/* ========================================================================= */}
        {isTextBoxVisible && (
          <Animated.View
            style={[
              styles.inputCardWrapper,
              {
                opacity: textBoxFade,
                transform: [{ translateY: textBoxTranslate }],
              },
            ]}
          >
            <View style={styles.inputCard}>
              <TextInput
                ref={inputRef}
                autoFocus={true}
                style={styles.textInput}
                placeholder={
                  lang === 'hi'
                    ? 'आपके बच्चे का नाम क्या है?'
                    : 'What is the name of your child?'
                }
                placeholderTextColor="#94A3B8"
                value={childName}
                onChangeText={handleNameChange}
                onSubmitEditing={handleNameSubmit}
                maxLength={25}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="go"
              />

              {childName.trim().length > 0 && (
                <View style={styles.inputActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      handleNameChange('');
                      inputRef.current?.focus();
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.clearBtn}
                  >
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>

                  {!areChipsVisible && (
                    <TouchableOpacity
                      onPress={handleNameSubmit}
                      activeOpacity={0.8}
                      style={styles.goBtn}
                    >
                      <Text style={styles.goBtnText}>{lang === 'hi' ? 'चलो' : 'Go'}</Text>
                      <Text style={styles.goBtnArrow}>→</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            <Text style={styles.inputHint}>
              {lang === 'hi'
                ? 'नाम हमेशा दिखाई देता है ताकि स्पेलिंग सुधारी जा सके'
                : 'Name stays visible so typos can be fixed anytime'}
            </Text>
          </Animated.View>
        )}

        {/* ========================================================================= */}
        {/* 4. AGE CHIPS FADE IN */}
        {/* Options: under 2, 2 to 3, 4 to 5, 6 to 7, 8 to 10 */}
        {/* ========================================================================= */}
        {areChipsVisible && (
          <Animated.View
            style={[
              styles.chipsSection,
              {
                opacity: ageChipsFade,
                transform: [{ translateY: ageChipsTranslate }],
              },
            ]}
          >
            <Text style={styles.chipsHeading}>
              {lang === 'hi'
                ? `चुनिए ${childName.trim() || 'बच्चे'} की उम्र:`
                : `Select ${childName.trim() || 'child'}'s age:`}
            </Text>

            <View style={styles.chipsRow}>
              {AGE_OPTIONS.map((opt) => {
                const isSelected = selectedAge === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => handleSelectAge(opt.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.ageChip,
                      isSelected && styles.ageChipSelected,
                    ]}
                  >
                    <View style={styles.chipTextGroup}>
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected && styles.chipLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.chipDesc,
                          isSelected && styles.chipDescSelected,
                        ]}
                      >
                        {opt.desc}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Spacer for comfortable scroll */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ========================================================================= */}
      {/* 5. CONTINUE BUTTON */}
      {/* Appears when age is selected and name is filled */}
      {/* ========================================================================= */}
      {isContinueVisible && (
        <Animated.View
          style={[
            styles.bottomActionArea,
            {
              opacity: continueFade,
              transform: [{ translateY: continueTranslate }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleContinuePress}
            activeOpacity={0.85}
            style={styles.continueBtn}
          >
            <Text style={styles.continueBtnText}>
              {lang === 'hi' ? 'आगे बढ़ें' : 'Continue'}
            </Text>
            <Text style={styles.continueArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
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
    paddingTop: 10,
    paddingBottom: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2436',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2436',
  },
  devSkipButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  devSkipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  langOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  langOptionActive: {
    backgroundColor: '#000000',
  },
  langText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  mascotSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  speechBubbleWrapper: {
    alignItems: 'center',
    marginBottom: 6,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    shadowColor: '#7C6DF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: SCREEN_WIDTH * 0.85,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechBubbleTail: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#DDD6FE',
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
  },
  speechText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 20,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#7C6DF8',
  },
  mascotFigure: {
    width: 120,
    height: 90,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotHandWrapper: {
    position: 'absolute',
    left: 8,
    top: 14,
    width: 44,
    height: 44,
    zIndex: 10,
  },
  mascotHandImg: {
    width: '100%',
    height: '100%',
  },
  mascotBodyImg: {
    width: '100%',
    height: '100%',
    zIndex: 20,
  },
  inputCardWrapper: {
    width: '100%',
    marginTop: 10,
    marginBottom: 14,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#7C6DF8',
    shadowColor: '#7C6DF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2436',
    paddingVertical: 4,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
  },
  inputActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5D997C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 3,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  goBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  goBtnArrow: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  inputHint: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
    marginLeft: 6,
  },
  chipsSection: {
    width: '100%',
    marginTop: 4,
  },
  chipsHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    gap: 8,
  },
  ageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ageChipSelected: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  chipEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  chipTextGroup: {
    flex: 1,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'capitalize',
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
  chipDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  chipDescSelected: {
    color: '#E6F4EA',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: '#5D997C',
  },
  bottomActionArea: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 10,
    backgroundColor: '#FAF8F5',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D997C',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    gap: 8,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  continueArrow: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
