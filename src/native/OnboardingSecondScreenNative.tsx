import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCREEN2_BUDDY_FRAMES } from '../onboarding/screen2/buddyFrames';
import { palette, speechBubble, type as typography } from '../onboarding/screen1/tokens';

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

const CARD_COPY = {
  en: {
    title: "Buddy's Friend Card", tag: 'NEW FRIEND', name: 'Name', age: 'Age', colour: 'Favourite colour',
    inputLabel: "Child's name", emptyCard: 'Friend card, ready to personalise', buddy: 'Buddy waving hello',
  },
  hi: {
    title: 'दोस्ती का कार्ड', tag: 'नया दोस्त', name: 'नाम', age: 'उम्र', colour: 'पसंदीदा रंग',
    inputLabel: 'बच्चे का नाम', emptyCard: 'दोस्ती का कार्ड, जानकारी भरने के लिए तैयार', buddy: 'नमस्ते करता बडी',
  },
} as const;

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
  const cardCopy = CARD_COPY[lang];
  const insets = useSafeAreaInsets();

  // Buddy Speech Bubble State
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [speechText, setSpeechText] = useState<string>('Hi I am Buddy. Tell me about your little one.');

  const inputRef = useRef<any>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const inputTop = useRef(0);
  const keyboardShown = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNameRef = useRef<string>('');

  const revealNameInput = useCallback(() => {
    if (inputRef.current?.isFocused()) {
      scrollRef.current?.scrollTo({ y: Math.max(0, inputTop.current - 16), animated: false });
    }
  }, []);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      keyboardShown.current = true;
      revealNameInput();
    });
    const hidden = Keyboard.addListener('keyboardDidHide', () => { keyboardShown.current = false; });
    return () => { shown.remove(); hidden.remove(); };
  }, [revealNameInput]);

  // -------------------------------------------------------------
  // ANIMATION VALUES
  // -------------------------------------------------------------

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={insets.top}
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
          {__DEV__ && onSkip ? (
            <TouchableOpacity onPress={onSkip} activeOpacity={0.7} style={styles.devSkipButton}>
              <Text style={styles.devSkipText}>Skip</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        onLayout={() => { if (keyboardShown.current) revealNameInput(); }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* 2. BUDDY MASCOT & DYNAMIC SPEECH BUBBLE */}
        {/* ========================================================================= */}
        <View style={styles.friendCard}>
          <View style={styles.friendCardHeader}>
            <Text style={styles.friendCardTitle} maxFontSizeMultiplier={typography.maxFontScale}>{cardCopy.title}</Text>
            <Text style={styles.friendCardTag} maxFontSizeMultiplier={typography.maxFontScale}>{cardCopy.tag}</Text>
          </View>
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

          {/* Approved full-body still. No body-part transforms or pose wiring in B. */}
          <Image
            source={SCREEN2_BUDDY_FRAMES.greeting}
            style={styles.mascotFigure}
            resizeMode="contain"
            accessibilityLabel={cardCopy.buddy}
          />
        </View>
          <View style={styles.friendCardDetails} accessible accessibilityLabel={cardCopy.emptyCard}>
            <View style={styles.friendCardName}>
              <Text style={styles.friendCardLabel}>{cardCopy.name}</Text>
              <View style={styles.blankNameLine} />
            </View>
            <View style={styles.friendCardAge}>
              <Text style={styles.friendCardLabel}>{cardCopy.age}</Text>
              <View style={styles.blankAgeLine} />
            </View>
            <View style={styles.friendCardColour}>
              <Text style={styles.friendCardLabel}>{cardCopy.colour}</Text>
              <View style={styles.blankColourBadge} />
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 3. FLOATING TEXT BOX: CHILD NAME (Half-second delay entrance) */}
        {/* The name stays visible so any typo can be corrected! */}
        {/* ========================================================================= */}
        {isTextBoxVisible && (
          <Animated.View
            onLayout={(event) => { inputTop.current = event.nativeEvent.layout.y; }}
            style={[
              styles.inputCardWrapper,
              {
                opacity: textBoxFade,
                transform: [{ translateY: textBoxTranslate }],
              },
            ]}
          >
            <Text style={styles.inputLabel}>{cardCopy.inputLabel}</Text>
            <View style={styles.inputCard}>
              <TextInput
                ref={inputRef}
                autoFocus={true}
                onFocus={() => { if (keyboardShown.current) revealNameInput(); }}
                accessibilityLabel={cardCopy.inputLabel}
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
              paddingBottom: insets.bottom + 16,
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
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'center',
  },
  friendCard: {
    width: '100%', maxWidth: 430, padding: 18, borderRadius: 24,
    backgroundColor: '#FFFEFB', borderWidth: 1, borderColor: '#E9E3D9',
    shadowColor: '#4C493D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  friendCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    marginBottom: 16,
  },
  friendCardTitle: {
    flexShrink: 1, fontSize: 22, lineHeight: 28, color: palette.ink.primary,
    fontFamily: Platform.select(typography.headline.family), fontWeight: '500',
  },
  friendCardTag: {
    fontSize: 9, lineHeight: 14, fontWeight: '700', letterSpacing: 0.7,
    color: '#76648C', backgroundColor: '#F1EDF8', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  friendCardDetails: {
    flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#EDE7DE',
    paddingTop: 14, marginTop: 10, alignItems: 'flex-start',
  },
  friendCardName: { flex: 1.2 },
  friendCardAge: { flex: 0.6 },
  friendCardColour: { flex: 1.1 },
  friendCardLabel: { fontSize: 11, lineHeight: 16, fontWeight: '500', color: '#6C7269', marginBottom: 9 },
  blankNameLine: { width: '85%', height: 4, borderRadius: 2, backgroundColor: '#EAE5DE', marginTop: 8 },
  blankAgeLine: { width: 24, height: 4, borderRadius: 2, backgroundColor: '#EAE5DE', marginTop: 8 },
  blankColourBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFEF7', borderWidth: 1, borderColor: '#D9D5CE' },
  mascotSection: {
    alignItems: 'center',
    marginVertical: 0,
  },
  speechBubbleWrapper: {
    alignItems: 'center',
    marginBottom: 6,
  },
  speechBubble: {
    backgroundColor: speechBubble.surface,
    borderRadius: speechBubble.radius,
    paddingHorizontal: speechBubble.paddingH,
    paddingVertical: speechBubble.paddingV,
    shadowColor: speechBubble.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    maxWidth: Math.min(272, SCREEN_WIDTH - 88),
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechBubbleTail: {
    width: speechBubble.tail,
    height: speechBubble.tail,
    backgroundColor: speechBubble.surface,
    transform: [{ rotate: '45deg' }],
    marginTop: -speechBubble.tail / 2,
  },
  speechText: {
    fontSize: speechBubble.fontSize,
    fontWeight: '500',
    fontFamily: Platform.select(typography.subline.family),
    color: speechBubble.ink,
    textAlign: 'center',
    lineHeight: speechBubble.lineHeight,
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
    width: 180,
    height: 180 * 159 / 160,
  },
  inputCardWrapper: {
    width: '100%',
    marginTop: 22,
    marginBottom: 14,
  },
  inputLabel: { fontSize: 13, lineHeight: 18, color: palette.ink.primary, fontWeight: '600', marginBottom: 8 },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C8BDD9',
    shadowColor: '#62506B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    fontWeight: '500',
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
    color: '#6E786E',
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
