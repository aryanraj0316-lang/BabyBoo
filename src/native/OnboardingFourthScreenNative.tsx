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

export interface OnboardingScreen4Data {
  childName: string;
  ageCategory: string; // 'under_1' | 'age_1' | '2_4' | '5_7' | '8_10'
  chipId: string;
  chipLabel: string;
  handoverType: 'smooth' | 'mild' | 'tantrum' | 'meltdown' | 'give_in';
  empathyPose: 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
}

interface OnboardingFourthScreenNativeProps {
  childName?: string;
  ageCategory?: string;
  onBack?: () => void;
  onContinue: (data: OnboardingScreen4Data) => void;
  onSkip?: () => void;
  initialLanguage?: 'en' | 'hi';
}

type Language = 'en' | 'hi';
type EmpathyPose = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
type HandoverType = 'smooth' | 'mild' | 'tantrum' | 'meltdown' | 'give_in';

interface HandoverChipConfig {
  id: string;
  label: string;
  labelHi: string;
  handoverType: HandoverType;
  pose: EmpathyPose;
  line1: string;
  line2?: string;
  line1Hi: string;
  line2Hi?: string;
  source?: string;
  smallPrint?: string;
  learnMore?: string;
}

// -------------------------------------------------------------
// SOURCED FROM BabyBoo Onboarding Screen 4 Reaction Guide
// Buddy only shows empathy, never alarm. No chip gets a worried face.
// -------------------------------------------------------------
const getConfigsForAgeGroup = (
  ageCategory: string,
  name: string
): { questionEn: string; questionHi: string; chips: HandoverChipConfig[] } => {
  const normAge = (ageCategory || '2_4').toLowerCase();

  const learnMoreT1 = `Tantrums are a normal part of growing up. A review of studies found them in 87% of children aged 18 to 24 months, 91% at 30 to 36 months and 59% at 42 to 48 months. Most last about 3 minutes, and three in four last 5 minutes or less. Daily tantrums happen in about 20% of 2-year-olds, 18% of 3-year-olds and 10% of 4-year-olds. (Source: StatPearls review)`;
  const learnMoreT2 = `Most tantrums are a normal part of growing up. A pediatrician can help if tantrums are very frequent or very long, or if a child hurts themselves or others. Tantrums that keep happening often after age 5 are worth mentioning too. (Source: AACAP, 2025; StatPearls)`;
  const learnMoreT3 = `In a study of 422 children aged 3 to 5 followed for six months, parents who often used phones or tablets to calm upset children saw more quick mood shifts and impulsive behavior over time, especially in boys and in children who already react strongly. The lead researcher suggested timers, clear limits, and talking through feelings when the child is calm. (Source: Radesky et al., JAMA Pediatrics, 2022)`;

  // Group A: Under 1 year
  if (normAge === 'under_1' || normAge === 'under_2' || normAge === '< 2') {
    return {
      questionEn: `What usually happens when ${name}’s screen time ends?`,
      questionHi: `${name} का स्क्रीन समय खत्म होने पर आमतौर पर क्या होता है?`,
      chips: [
        {
          id: 'goes_smoothly',
          label: 'Goes smoothly',
          labelHi: 'आसानी से हो जाता है',
          handoverType: 'smooth',
          pose: 'E1',
          line1: 'That’s a great routine.',
          line2: 'I can help keep it that way.',
          line1Hi: 'यह बहुत अच्छी दिनचर्या है।',
          line2Hi: 'मैं इसे ऐसे ही बनाए रखने में मदद करूंगा।',
        },
        {
          id: 'little_fussing',
          label: 'A little fussing',
          labelHi: 'हल्की सी ज़िद',
          handoverType: 'mild',
          pose: 'E2',
          line1: 'Very common.',
          line2: 'Small moments like that add up, and I can soften them.',
          line1Hi: 'यह बहुत सामान्य है।',
          line2Hi: 'ऐसे छोटे पल जुड़ते हैं, और मैं इन्हें आसान बना सकता हूँ।',
        },
        {
          id: 'crying',
          label: 'Crying',
          labelHi: 'रोना',
          handoverType: 'tantrum',
          pose: 'E3',
          line1: 'That’s a hard moment for everyone.',
          line2: 'It’s exactly what I’m here for.',
          line1Hi: 'यह पल सबके लिए कठिन होता है।',
          line2Hi: 'मैं इसी पल को आसान बनाने के लिए यहाँ हूँ।',
        },
        {
          id: 'hard_settle',
          label: 'Hard to settle',
          labelHi: 'शांत होना मुश्किल',
          handoverType: 'meltdown',
          pose: 'E4',
          line1: 'That sounds exhausting.',
          line2: 'Let’s make this moment easier for you both.',
          line1Hi: 'यह बहुत थका देने वाला हो सकता है।',
          line2Hi: 'आइए आप दोनों के लिए इस पल को आसान बनाते हैं।',
        },
        {
          id: 'give_in',
          label: 'I give in',
          labelHi: 'मैं फोन दे देता हूँ',
          handoverType: 'give_in',
          pose: 'E5',
          line1: 'Giving in is human.',
          line2: 'Let me be the one who says it’s time, so you don’t have to.',
          line1Hi: 'हार मान लेना स्वाभाविक है।',
          line2Hi: 'समय खत्म होने की बात मुझे कहने दें, आपको नहीं।',
        },
      ],
    };
  }

  // Group B: 1 year (12–23 months)
  if (normAge === 'age_1' || normAge === '1' || normAge === '1_year') {
    return {
      questionEn: `What usually happens when ${name}’s screen time ends?`,
      questionHi: `${name} का स्क्रीन समय खत्म होने पर आमतौर पर क्या होता है?`,
      chips: [
        {
          id: 'goes_smoothly',
          label: 'Goes smoothly',
          labelHi: 'आसानी से हो जाता है',
          handoverType: 'smooth',
          pose: 'E1',
          line1: 'That’s a great routine.',
          line2: 'I can help keep it that way.',
          line1Hi: 'यह बहुत अच्छी दिनचर्या है।',
          line2Hi: 'मैं इसे ऐसे ही बनाए रखने में मदद करूंगा।',
        },
        {
          id: 'little_fussing',
          label: 'A little fussing',
          labelHi: 'हल्की सी ज़िद',
          handoverType: 'mild',
          pose: 'E2',
          line1: 'Very common.',
          line2: 'Small moments like that add up, and I can soften them.',
          line1Hi: 'यह बहुत सामान्य है।',
          line2Hi: 'ऐसे छोटे पल जुड़ते हैं, और मैं इन्हें आसान बना सकता हूँ।',
        },
        {
          id: 'crying_tantrum',
          label: 'Crying or a tantrum',
          labelHi: 'रोना या गुस्सा',
          handoverType: 'tantrum',
          pose: 'E3',
          line1: 'Very common: 87% of children aged 18 to 24 months have tantrums.',
          line2: 'It’s a hard moment, and I can make it easier.',
          line1Hi: 'बहुत सामान्य: 18 से 24 महीने के 87% बच्चों में गुस्सा या ज़िद देखी जाती है।',
          line2Hi: 'यह कठिन पल है, और मैं इसे आसान बना सकता हूँ।',
          source: 'Source: StatPearls review',
          learnMore: learnMoreT1,
        },
        {
          id: 'meltdown',
          label: 'A full meltdown',
          labelHi: 'बहुत ज़्यादा गुस्सा',
          handoverType: 'meltdown',
          pose: 'E4',
          line1: 'Most tantrums pass in about 3 minutes.',
          line2: 'If they worry you, mention it to your pediatrician. Let’s make this easier.',
          line1Hi: 'अधिकांश गुस्सा लगभग 3 मिनट में शांत हो जाता है।',
          line2Hi: 'यदि आपको चिंता हो, तो बाल रोग विशेषज्ञ से सलाह लें। आइए इसे आसान बनाएं।',
          source: 'Source: StatPearls review',
          learnMore: learnMoreT2,
        },
        {
          id: 'give_in',
          label: 'I give in',
          labelHi: 'मैं फोन दे देता हूँ',
          handoverType: 'give_in',
          pose: 'E5',
          line1: 'Giving in is human.',
          line2: 'Let me be the one who says it’s time, so you don’t have to.',
          line1Hi: 'हार मान लेना स्वाभाविक है।',
          line2Hi: 'समय खत्म होने की बात मुझे कहने दें, आपको नहीं।',
        },
      ],
    };
  }

  // Group D: 5–7 and 8–10 years
  if (normAge === '5_7' || normAge === '8_10' || normAge === '6_7' || normAge === '8-10') {
    return {
      questionEn: `What usually happens when ${name}’s screen time ends?`,
      questionHi: `${name} का स्क्रीन समय खत्म होने पर आमतौर पर क्या होता है?`,
      chips: [
        {
          id: 'goes_smoothly',
          label: 'Goes smoothly',
          labelHi: 'आसानी से हो जाता है',
          handoverType: 'smooth',
          pose: 'E1',
          line1: 'That’s a great routine.',
          line2: 'I can help keep it that way.',
          line1Hi: 'यह बहुत अच्छी दिनचर्या है।',
          line2Hi: 'मैं इसे ऐसे ही बनाए रखने में मदद करूंगा।',
        },
        {
          id: 'little_grumbling',
          label: 'A little grumbling',
          labelHi: 'थोड़ी सी बड़बड़ाहट',
          handoverType: 'mild',
          pose: 'E2',
          line1: 'Very common.',
          line2: 'Small moments like that add up, and I can soften them.',
          line1Hi: 'यह बहुत सामान्य है।',
          line2Hi: 'ऐसे छोटे पल जुड़ते हैं, और मैं इन्हें आसान बना सकता हूँ।',
        },
        {
          id: 'arguing_shouting',
          label: 'Arguing or shouting',
          labelHi: 'बहस या चिल्लाना',
          handoverType: 'tantrum',
          pose: 'E3',
          line1: 'Pushback is common at this age.',
          line2: 'Researchers suggest agreeing the ending before screen time starts. I can keep it consistent.',
          line1Hi: 'इस उम्र में विरोध करना आम बात है।',
          line2Hi: 'विशेषज्ञ स्क्रीन समय शुरू होने से पहले नियम तय करने की सलाह देते हैं।',
          source: 'Source: Radesky, University of Michigan',
        },
        {
          id: 'meltdown',
          label: 'A full meltdown',
          labelHi: 'बहुत ज़्यादा गुस्सा',
          handoverType: 'meltdown',
          pose: 'E4',
          line1: 'Big meltdowns become less common after age 5.',
          line2: 'If they’re frequent, a chat with your pediatrician can help.',
          line1Hi: '5 साल के बाद बड़ा गुस्सा कम देखने को मिलता है।',
          line2Hi: 'यदि यह बार-बार हो, तो अपने बाल रोग विशेषज्ञ से परामर्श लें।',
          source: 'Source: AACAP, 2025',
          learnMore: learnMoreT2,
        },
        {
          id: 'give_in',
          label: 'I give in',
          labelHi: 'मैं फोन दे देता हूँ',
          handoverType: 'give_in',
          pose: 'E5',
          line1: 'Giving in is human.',
          line2: 'Let me be the one who says it’s time, so you don’t have to.',
          line1Hi: 'हार मान लेना स्वाभाविक है।',
          line2Hi: 'समय खत्म होने की बात मुझे कहने दें, आपको नहीं।',
        },
      ],
    };
  }

  // Default: Group C: 2–4 years
  return {
    questionEn: `What usually happens when ${name}’s screen time ends?`,
    questionHi: `${name} का स्क्रीन समय खत्म होने पर आमतौर पर क्या होता है?`,
    chips: [
      {
        id: 'goes_smoothly',
        label: 'Goes smoothly',
        labelHi: 'आसानी से हो जाता है',
        handoverType: 'smooth',
        pose: 'E1',
        line1: 'That’s a great routine.',
        line2: 'I can help keep it that way.',
        line1Hi: 'यह बहुत अच्छी दिनचर्या है।',
        line2Hi: 'मैं इसे ऐसे ही बनाए रखने में मदद करूंगा।',
      },
      {
        id: 'little_whining',
        label: 'A little whining',
        labelHi: 'थोड़ी सी चिड़चिड़ाहट',
        handoverType: 'mild',
        pose: 'E2',
        line1: 'Very common.',
        line2: 'Small moments like that add up, and I can soften them.',
        line1Hi: 'यह बहुत सामान्य है।',
        line2Hi: 'ऐसे छोटे पल जुड़ते हैं, और मैं इन्हें आसान बना सकता हूँ।',
      },
      {
        id: 'crying_tantrum',
        label: 'Crying or a tantrum',
        labelHi: 'रोना या गुस्सा',
        handoverType: 'tantrum',
        pose: 'E3',
        line1: 'Very common: about 9 in 10 children have tantrums around age 3.',
        line2: 'It’s a hard moment, and I can make it easier.',
        line1Hi: 'बहुत सामान्य: 3 साल के लगभग 10 में से 9 बच्चों में ज़िद देखी जाती है।',
        line2Hi: 'यह कठिन पल है, और मैं इसे आसान बना सकता हूँ।',
        source: 'Source: StatPearls review (91% at 30–36 months)',
        learnMore: learnMoreT1,
      },
      {
        id: 'meltdown',
        label: 'A full meltdown',
        labelHi: 'बहुत ज़्यादा गुस्सा',
        handoverType: 'meltdown',
        pose: 'E4',
        line1: 'Most tantrums pass in about 3 minutes.',
        line2: 'If they worry you, mention it to your pediatrician. Let’s make this easier.',
        line1Hi: 'अधिकांश गुस्सा लगभग 3 मिनट में शांत हो जाता है।',
        line2Hi: 'यदि आपको चिंता हो, तो बाल रोग विशेषज्ञ से सलाह लें। आइए इसे आसान बनाएं।',
        source: 'Source: StatPearls review',
        learnMore: learnMoreT2,
      },
      {
        id: 'give_in',
        label: 'I give in',
        labelHi: 'मैं मान जाता हूँ',
        handoverType: 'give_in',
        pose: 'E5',
        line1: 'Giving in is human.',
        line2: 'A study linked often using phones to calm upset kids with more outbursts later. Let me end it for you.',
        line1Hi: 'हार मान लेना बहुत स्वाभाविक है।',
        line2Hi: 'शोध के अनुसार शांत करने के लिए फोन देने से आगे चिड़चिड़ापन बढ़ सकता है। मुझे संभालने दें।',
        source: 'Source: Radesky et al., JAMA Pediatrics, 2022',
        smallPrint: `Patterns across many children, not a prediction for ${name}.`,
        learnMore: learnMoreT3,
      },
    ],
  };
};

export const OnboardingFourthScreenNative: React.FC<OnboardingFourthScreenNativeProps> = ({
  childName = 'My Child',
  ageCategory = '2_4',
  onBack,
  onContinue,
  onSkip,
  initialLanguage = 'en',
}) => {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const cleanName = childName.trim() || 'My Child';

  const config = getConfigsForAgeGroup(ageCategory, cleanName);

  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [activePose, setActivePose] = useState<EmpathyPose>('E1');
  const [isTyping, setIsTyping] = useState<boolean>(true);

  // Sequential Two-Sentence Speech
  const [line1Text, setLine1Text] = useState<string>('');
  const [line2Text, setLine2Text] = useState<string>('');
  const [isLine2Mounted, setIsLine2Mounted] = useState<boolean>(false);
  const [sourceText, setSourceText] = useState<string>('');
  const [smallPrintText, setSmallPrintText] = useState<string>('');
  const [showLearnMore, setShowLearnMore] = useState<boolean>(false);
  const [isLearnMoreExpanded, setIsLearnMoreExpanded] = useState<boolean>(false);

  // -------------------------------------------------------------
  // ANIMATIONS
  // -------------------------------------------------------------
  const handWaveAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const empathyScale = useRef(new Animated.Value(1)).current;
  const empathyTilt = useRef(new Animated.Value(0)).current;

  // Typing Dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Sequential Speech Animations
  const line1Fade = useRef(new Animated.Value(0)).current;
  const line1Translate = useRef(new Animated.Value(6)).current;
  const line2Fade = useRef(new Animated.Value(0)).current;
  const line2Translate = useRef(new Animated.Value(6)).current;
  const extraFade = useRef(new Animated.Value(0)).current;

  // Continue Button
  const continueFade = useRef(new Animated.Value(0)).current;
  const continueTranslate = useRef(new Animated.Value(20)).current;
  const [isContinueVisible, setIsContinueVisible] = useState<boolean>(false);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const line2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Idle Float & Gentle Wave
  useEffect(() => {
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(handWaveAnim, {
          toValue: 0.8,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(handWaveAnim, {
          toValue: -0.8,
          duration: 450,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(handWaveAnim, {
          toValue: 0.6,
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(handWaveAnim, {
          toValue: 0,
          duration: 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ])
    );
    waveLoop.start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
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

  // 2. Typing Dots
  useEffect(() => {
    const createDotLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -5,
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

  // 3. Initial Question Speech
  useEffect(() => {
    if (!selectedChipId) {
      setIsTyping(true);
      setIsLine2Mounted(false);
      line1Fade.setValue(0);
      line1Translate.setValue(6);
      line2Fade.setValue(0);
      extraFade.setValue(0);

      const timer = setTimeout(() => {
        setIsTyping(false);
        setLine1Text(lang === 'hi' ? config.questionHi : config.questionEn);
        setLine2Text('');
        setSourceText('');
        setSmallPrintText('');

        Animated.parallel([
          Animated.timing(line1Fade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(line1Translate, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      }, 450);

      return () => clearTimeout(timer);
    } else {
      const chip = config.chips.find((c) => c.id === selectedChipId);
      if (chip) {
        setLine1Text(lang === 'hi' ? chip.line1Hi : chip.line1);
        setLine2Text(lang === 'hi' ? (chip.line2Hi || '') : (chip.line2 || ''));
      }
    }
  }, [lang, config.questionEn, config.questionHi, selectedChipId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------
  // CHIP SELECTION & TWO-LINE SEQUENTIAL FADE-IN
  // -------------------------------------------------------------
  const handleSelectChip = (chip: HandoverChipConfig) => {
    setSelectedChipId(chip.id);
    setActivePose(chip.pose);
    setIsLearnMoreExpanded(false);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    // Reset line 2 and fade values so bubble initially sizes cleanly for line 1
    setIsLine2Mounted(false);
    line1Fade.setValue(0);
    line1Translate.setValue(6);
    line2Fade.setValue(0);
    line2Translate.setValue(6);
    extraFade.setValue(0);

    const l1 = lang === 'hi' ? chip.line1Hi : chip.line1;
    const l2 = lang === 'hi' ? (chip.line2Hi || '') : (chip.line2 || '');

    // Show typing dots briefly
    setIsTyping(true);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setLine1Text(l1);
      setLine2Text(l2);
      setSourceText(chip.source || '');
      setSmallPrintText(chip.smallPrint || '');
      setShowLearnMore(!!chip.learnMore);

      // Sentence 1 fades in
      Animated.parallel([
        Animated.timing(line1Fade, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(line1Translate, { toValue: 0, duration: 360, useNativeDriver: true }),
      ]).start(() => {
        // Once sentence 1 is there, wait exactly 1 second, then sentence 2 appears
        line2TimerRef.current = setTimeout(() => {
          setIsLine2Mounted(true);
          Animated.parallel([
            Animated.timing(line2Fade, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(line2Translate, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(extraFade, { toValue: 1, duration: 450, useNativeDriver: true }),
          ]).start();

          // Reveal Continue button smoothly when line 2 appears
          if (!isContinueVisible) {
            setIsContinueVisible(true);
            Animated.parallel([
              Animated.timing(continueFade, { toValue: 1, duration: 380, useNativeDriver: true }),
              Animated.timing(continueTranslate, { toValue: 0, duration: 380, useNativeDriver: true }),
            ]).start();
          }
        }, 1000);
      });
    }, 250);

    // Empathy Pose Animation (Gentle, warm, comforting — NEVER alarming)
    if (chip.pose === 'E1') {
      Animated.sequence([
        Animated.timing(empathyScale, { toValue: 1.05, duration: 240, useNativeDriver: true }),
        Animated.timing(empathyScale, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else if (chip.pose === 'E2') {
      Animated.sequence([
        Animated.timing(empathyTilt, { toValue: -3, duration: 180, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: 3, duration: 200, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (chip.pose === 'E3') {
      // Sympathetic soft lean, hand on heart
      Animated.timing(empathyTilt, {
        toValue: -4,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else if (chip.pose === 'E4') {
      // Gentle concerned hug posture
      Animated.parallel([
        Animated.timing(empathyScale, { toValue: 1.04, duration: 250, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: 3, duration: 250, useNativeDriver: true }),
      ]).start();
    } else if (chip.pose === 'E5') {
      // Warm knowing nod
      Animated.sequence([
        Animated.timing(empathyTilt, { toValue: 2, duration: 200, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: -2, duration: 200, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }

    // Settle back to calm companion posture after 2.5s
    settleTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(empathyScale, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(empathyTilt, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2500);
  };

  const handleContinuePress = () => {
    const chosenChip = config.chips.find((c) => c.id === selectedChipId) || config.chips[0];
    onContinue({
      childName: cleanName,
      ageCategory,
      chipId: chosenChip.id,
      chipLabel: chosenChip.label,
      handoverType: chosenChip.handoverType,
      empathyPose: chosenChip.pose,
    });
  };

  const waveInterpolate = handWaveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-14deg', '18deg'],
  });

  const tiltInterpolate = empathyTilt.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  const selectedChipData = config.chips.find((c) => c.id === selectedChipId);

  return (
    <View style={styles.container}>
      {/* Top Header */}
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
          {/* Monochrome Language Toggle */}
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
        {/* Mascot & Speech Bubble */}
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
                  {/* Sentence 1: Appears first, fading in */}
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

                  {/* Source and small disclaimer print */}
                  {isLine2Mounted ? (
                    <Animated.View style={{ opacity: extraFade, alignItems: 'center', marginTop: 4 }}>
                      {sourceText ? (
                        <Text style={styles.sourceText}>{sourceText}</Text>
                      ) : null}
                      {smallPrintText ? (
                        <Text style={styles.smallPrintText}>{smallPrintText}</Text>
                      ) : null}
                    </Animated.View>
                  ) : null}
                </View>
              )}
            </View>
            <View style={styles.speechBubbleTail} />
          </View>

          {/* Animated Mascot Figure (Empathy Pose) */}
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

        {/* Handover Chips List (Clean Pill Layout, Zero Emojis) */}
        <View style={styles.chipsSection}>
          <Text style={styles.chipsHeading}>
            {lang === 'hi' ? 'फोन लेते समय क्या होता है?' : 'When screen time ends:'}
          </Text>

          <View style={styles.chipsList}>
            {config.chips.map((chip) => {
              const isSelected = selectedChipId === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  onPress={() => handleSelectChip(chip)}
                  activeOpacity={0.8}
                  style={[
                    styles.timeChip,
                    isSelected && styles.timeChipSelected,
                  ]}
                >
                  <View style={styles.chipTextGroup}>
                    <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                      {lang === 'hi' ? chip.labelHi : chip.label}
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
        </View>

        {/* Optional Expandable "Learn more" Card */}
        {showLearnMore && selectedChipData?.learnMore && (
          <View style={styles.learnMoreContainer}>
            <TouchableOpacity
              onPress={() => setIsLearnMoreExpanded(!isLearnMoreExpanded)}
              activeOpacity={0.8}
              style={styles.learnMoreHeader}
            >
              <Text style={styles.learnMoreTitle}>
                {isLearnMoreExpanded ? '▾ Close research context' : '▸ Learn more about the research'}
              </Text>
            </TouchableOpacity>

            {isLearnMoreExpanded && (
              <View style={styles.learnMoreBody}>
                <Text style={styles.learnMoreText}>{selectedChipData.learnMore}</Text>
                <Text style={styles.learnMoreDisclaimer}>
                  Patterns across many children, not a prediction for {cleanName}.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Continue Button */}
      {isContinueVisible && selectedChipId && (
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
    paddingTop: 10,
    paddingBottom: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
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
    marginVertical: 10,
  },
  speechBubbleWrapper: {
    alignItems: 'center',
    marginBottom: 6,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    shadowColor: '#7C6DF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: SCREEN_WIDTH * 0.88,
    minHeight: 52,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 20,
  },
  speechTextLine2: {
    color: '#5D997C',
    fontWeight: '800',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  smallPrintText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
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
    width: 110,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mascotHandWrapper: {
    position: 'absolute',
    left: 8,
    top: 6,
    width: 44,
    height: 44,
    zIndex: 10,
    transformOrigin: '75% 85%',
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
  chipsSection: {
    width: '100%',
    marginTop: 8,
  },
  chipsHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  chipsList: {
    gap: 8,
    width: '100%',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  timeChipSelected: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  chipTextGroup: {
    flex: 1,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: '#5D997C',
  },
  learnMoreContainer: {
    width: '100%',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  learnMoreHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  learnMoreTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  learnMoreBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  learnMoreText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '500',
  },
  learnMoreDisclaimer: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 6,
    fontStyle: 'italic',
  },
  bottomActionArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#FAF8F5',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D997C',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  continueArrow: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
