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
  Platform,
} from 'react-native';

const mascotBodySource = require('../../assets/mascot_body.png');
const mascotHandSource = require('../../assets/mascot_hand.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface OnboardingScreen3Data {
  childName: string;
  ageCategory: string; // 'under_1' | 'age_1' | '2_4' | '5_7' | '8_10'
  timeChipId: string;
  timeChipLabel: string;
  reactionLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}

interface OnboardingThirdScreenNativeProps {
  childName?: string;
  ageCategory?: string;
  onBack?: () => void;
  onContinue: (data: OnboardingScreen3Data) => void;
  onSkip?: () => void;
  initialLanguage?: 'en' | 'hi';
}

type Language = 'en' | 'hi';
type ReactionLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

interface TimeChipConfig {
  id: string;
  label: string;
  labelHi: string;
  level: ReactionLevel;
  line1: string;
  line2?: string;
  line1Hi: string;
  line2Hi?: string;
  source: string;
  smallPrint?: string;
  learnMore?: string;
}

// -------------------------------------------------------------
// BENCHMARKS & REACTION CONFIGURATION BY AGE GROUP
// Sourced from BabyBoo Onboarding Screen 3 Reaction Guide
// Two-step sequential speech: Line 1 appears first, Line 2 appears 1s later.
// -------------------------------------------------------------
const getConfigsForAgeGroup = (ageCategory: string, name: string): { questionEn: string; questionHi: string; chips: TimeChipConfig[] } => {
  const normAge = (ageCategory || '2_4').toLowerCase();

  // Group A: Under 1 year
  if (normAge === 'under_1' || normAge === 'under_2' || normAge === '< 2') {
    return {
      questionEn: `How long does ${name} usually get the phone in a day?`,
      questionHi: `${name} दिन में आमतौर पर कितनी देर फोन देखता है?`,
      chips: [
        {
          id: 'almost_none',
          label: 'Almost none',
          labelHi: 'लगभग कभी नहीं',
          level: 'L1',
          line1: 'That’s exactly what the WHO recommends for babies.',
          line2: 'Lovely!',
          line1Hi: 'डब्ल्यूएचओ (WHO) शिशुओं के लिए यही सलाह देता है।',
          line2Hi: 'बहुत बढ़िया!',
          source: 'Source: WHO, 2019',
        },
        {
          id: 'under_1h',
          label: 'Under 1 hour',
          labelHi: '1 घंटे से कम',
          level: 'L2',
          line1: 'The WHO recommends no screens before age 1.',
          line2: 'Video calls with family are the one exception the AAP makes.',
          line1Hi: 'डब्ल्यूएचओ 1 वर्ष से पहले स्क्रीन न देने की सलाह देता है।',
          line2Hi: 'केवल परिवार से वीडियो कॉल ही एक अपवाद है।',
          source: 'Source: WHO, 2019; AAP, 2016',
        },
        {
          id: '1_2h',
          label: '1 to 2 hours',
          labelHi: '1 से 2 घंटे',
          level: 'L3',
          line1: 'The WHO recommends no screens before age 1, and the AAP advises unplugged play for babies.',
          line2: 'Let’s work on it together.',
          line1Hi: 'डब्ल्यूएचओ 1 वर्ष से पहले स्क्रीन न देने और खेलकूद की सलाह देता है।',
          line2Hi: 'हम मिलकर योजना बनाएंगे।',
          source: 'Source: WHO, 2019; AAP, 2016',
        },
        {
          id: '2_4h',
          label: '2 to 4 hours',
          labelHi: '2 से 4 घंटे',
          level: 'L4',
          line1: 'That’s a lot at this age, since the WHO recommends none.',
          line2: 'Small steps help, and I’ll guide you.',
          line1Hi: 'इस उम्र के लिए यह काफी अधिक है, क्योंकि डब्ल्यूएचओ शून्य स्क्रीन की सलाह देता है।',
          line2Hi: 'छोटे-छोटे कदम मददगार होंगे, और मैं आपका मार्गदर्शन करूँगा।',
          source: 'Source: WHO, 2019',
        },
        {
          id: 'more_4h',
          label: 'More than 4 hours',
          labelHi: '4 घंटे से अधिक',
          level: 'L5',
          line1: 'The WHO recommends no screens before age 1, and this is well beyond that.',
          line2: 'Let’s fix this together.',
          line1Hi: 'डब्ल्यूएचओ 1 साल से पहले स्क्रीन न देने की सलाह देता है, और यह उससे कहीं अधिक है।',
          line2Hi: 'आइए मिलकर इसे ठीक करते हैं।',
          source: 'Source: WHO, 2019',
        },
      ],
    };
  }

  // Group B: 1 year (12–23 months)
  if (normAge === 'age_1' || normAge === '1' || normAge === '1_year') {
    return {
      questionEn: `How long does ${name} usually get the phone in a day?`,
      questionHi: `${name} दिन में आमतौर पर कितनी देर फोन देखता है?`,
      chips: [
        {
          id: 'almost_none',
          label: 'Almost none',
          labelHi: 'लगभग कभी नहीं',
          level: 'L1',
          line1: 'That’s in line with the WHO, which advises against screen time at age 1.',
          line2: 'Great choice for healthy development!',
          line1Hi: 'यह डब्ल्यूएचओ की गाइडलाइन के अनुसार है, जो 1 वर्ष में स्क्रीन से बचने की सलाह देता है।',
          line2Hi: 'स्वस्थ विकास के लिए बहुत अच्छा कदम!',
          source: 'Source: WHO, 2019',
        },
        {
          id: 'under_1h',
          label: 'Under 1 hour',
          labelHi: '1 घंटे से कम',
          level: 'L2',
          line1: 'The WHO advises against screens at age 1.',
          line2: 'In a big 2023 study, under 1 hour a day was the group with the fewest delays.',
          line1Hi: 'डब्ल्यूएचओ 1 वर्ष में स्क्रीन से बचने की सलाह देता है।',
          line2Hi: '2023 के बड़े अध्ययन में 1 घंटे से कम में सबसे कम देरी देखी गई।',
          source: 'Source: WHO, 2019; Takahashi et al., 2023',
        },
        {
          id: '1_2h',
          label: '1 to 2 hours',
          labelHi: '1 से 2 घंटे',
          level: 'L3',
          line1: 'A big 2023 study linked 1 to 2 hours a day at age 1 to higher odds of language delay by age 2.',
          line2: 'Let’s work on it together.',
          line1Hi: '2023 के शोध के अनुसार 1 वर्ष में 1-2 घंटे स्क्रीन समय भाषा में देरी से जुड़ा पाया गया।',
          line2Hi: 'आइए मिलकर इस पर काम करते हैं।',
          source: 'Source: Takahashi et al., 2023 (odds ratio 1.61)',
          smallPrint: `Patterns across many children, not a prediction for ${name}.`,
        },
        {
          id: '2_4h',
          label: '2 to 4 hours',
          labelHi: '2 से 4 घंटे',
          level: 'L4',
          line1: 'In a 2023 study of 7,097 children, 2 to 4 hours a day at age 1 went with about double the odds of a language delay at age 2.',
          line2: 'Let’s work on it together.',
          line1Hi: '7,097 बच्चों पर 2023 के अध्ययन में 2-4 घंटे स्क्रीन समय भाषा में देरी की दोगुनी संभावना से जुड़ा पाया गया।',
          line2Hi: 'आइए मिलकर इस पर काम करते हैं।',
          source: 'Source: Takahashi et al., 2023 (odds ratio 2.04)',
          smallPrint: `Patterns across many children, not a prediction for ${name}.`,
          learnMore: 'In this Japanese study of 7,097 mother-child pairs, more screen time went with more delays in communication and problem-solving in a step-by-step pattern. The data show an association, not proof of cause.',
        },
        {
          id: 'more_4h',
          label: 'More than 4 hours',
          labelHi: '4 घंटे से अधिक',
          level: 'L5',
          line1: 'In a 2023 study, language delays at age 2 were 14.8% with 4+ hours a day at age 1, against 3.5% with under 1 hour.',
          line2: 'Let’s fix this together.',
          line1Hi: '2023 के अध्ययन में 4+ घंटे वाले बच्चों में भाषा देरी 14.8% पाई गई, जबकि 1 घंटे से कम में 3.5%।',
          line2Hi: 'चिंता न करें, आइए मिलकर इसे ठीक करते हैं।',
          source: 'Source: Takahashi et al., 2023',
          smallPrint: `Patterns across many children, not a prediction for ${name}.`,
          learnMore: 'The link was still visible at age 4. Screen time displaces vital parent-child verbal turns. Small gentle boundaries bring immediate healthy recovery.',
        },
      ],
    };
  }

  // Group D: 5–7 and 8–10 years
  if (normAge === '5_7' || normAge === '8_10' || normAge === '6_7' || normAge === '8-10') {
    return {
      questionEn: `How long does ${name} usually get the phone in a day, not counting schoolwork?`,
      questionHi: `${name} पढ़ाई के अलावा दिन में आमतौर पर कितनी देर फोन इस्तेमाल करता है?`,
      chips: [
        {
          id: 'under_30m',
          label: 'Under 30 minutes',
          labelHi: '30 मिनट से कम',
          level: 'L1',
          line1: 'That’s well within the 2-hour guideline for kids this age.',
          line2: 'Plenty of time left for play and rest!',
          line1Hi: 'यह इस उम्र के बच्चों के लिए 2 घंटे की गाइडलाइन के पूरी तरह भीतर है।',
          line2Hi: 'खेलकूद और आराम के लिए भरपूर समय!',
          source: 'Source: Canadian 24-Hour Movement Guidelines, 2016',
        },
        {
          id: 'about_1h',
          label: 'About 1 hour',
          labelHi: 'लगभग 1 घंटा',
          level: 'L1',
          line1: 'Well within the 2-hour guideline for recreational screen time.',
          line2: 'Great balance with daily activities!',
          line1Hi: 'मनोरंजन स्क्रीन समय के 2 घंटे के मानक के भीतर है।',
          line2Hi: 'दैनिक गतिविधियों के साथ बेहतरीन संतुलन!',
          source: 'Source: Canadian 24-Hour Movement Guidelines, 2016',
        },
        {
          id: 'about_2h',
          label: 'About 2 hours',
          labelHi: 'लगभग 2 घंटे',
          level: 'L2',
          line1: 'Right at the 2-hour guideline for recreational screen time.',
          line2: 'Keep sleep and play protected.',
          line1Hi: '2 घंटे की अधिकतम सीमा पर है।',
          line2Hi: 'नींद और खेलकूद के समय को सुरक्षित रखें।',
          source: 'Source: Canadian 24-Hour Movement Guidelines, 2016',
        },
        {
          id: 'about_3h',
          label: 'About 3 hours',
          labelHi: 'लगभग 3 घंटे',
          level: 'L3',
          line1: 'That’s 1.5x the 2-hour guideline for recreational screen time.',
          line2: 'Let’s find a gentle plan.',
          line1Hi: 'यह 2 घंटे की सीमा से 1.5 गुना अधिक है।',
          line2Hi: 'आइए एक सहज योजना बनाएं।',
          source: 'Source: Canadian 24-Hour Movement Guidelines, 2016',
          learnMore: 'Children aged 5 to 13 need 9 to 11 hours of uninterrupted sleep. The AAP suggests observing what screen time is replacing: sleep, active play, reading, or family connection.',
        },
        {
          id: '4h_more',
          label: '4 hours or more',
          labelHi: '4 घंटे या अधिक',
          level: 'L4',
          line1: 'That’s 2x the 2-hour guideline or more.',
          line2: 'Let’s make a plan together.',
          line1Hi: 'यह 2 घंटे की सीमा से 2 गुना से भी अधिक है।',
          line2Hi: 'आइए मिलकर एक योजना बनाएं।',
          source: 'Source: Canadian 24-Hour Movement Guidelines, 2016',
          learnMore: 'Protecting the last hour before sleep and setting predictable wind-down limits naturally balances screen usage without struggles.',
        },
      ],
    };
  }

  // Default: Group C: 2–4 years
  return {
    questionEn: `How long does ${name} usually get the phone in a day?`,
    questionHi: `${name} दिन में आमतौर पर कितनी देर फोन देखता है?`,
    chips: [
      {
        id: 'under_30m',
        label: 'Under 30 minutes',
        labelHi: '30 मिनट से कम',
        level: 'L1',
        line1: 'That’s well within the WHO limit of 1 hour a day at this age.',
        line2: 'Keep up the wonderful play routines!',
        line1Hi: 'यह इस उम्र के लिए डब्ल्यूएचओ की 1 घंटे की सीमा के पूरी तरह भीतर है।',
        line2Hi: 'इस बेहतरीन रूटीन को जारी रखें!',
        source: 'Source: WHO, 2019',
      },
      {
        id: 'about_1h',
        label: 'About 1 hour',
        labelHi: 'लगभग 1 घंटा',
        level: 'L2',
        line1: 'Right at the WHO limit of 1 hour a day at this age.',
        line2: 'Less is even better.',
        line1Hi: 'इस उम्र के लिए डब्ल्यूएचओ की 1 घंटे की सीमा पर है।',
        line2Hi: 'इससे कम और भी बेहतर है।',
        source: 'Source: WHO, 2019',
      },
      {
        id: 'about_2h',
        label: 'About 2 hours',
        labelHi: 'लगभग 2 घंटे',
        level: 'L3',
        line1: 'That’s 2x the WHO limit of 1 hour a day for this age.',
        line2: 'Let’s find a gentle plan.',
        line1Hi: 'यह इस उम्र के लिए डब्ल्यूएचओ की 1 घंटे की सीमा से 2 गुना है।',
        line2Hi: 'आइए एक सहज संतुलन बनाते हैं।',
        source: 'Source: WHO, 2019',
        learnMore: 'A study of 2,441 Canadian children found that more screen time at age 2 went with lower developmental scores at ages 3 and 5. The differences were modest, so this is a helpful nudge, not a verdict.',
      },
      {
        id: 'about_3h',
        label: 'About 3 hours',
        labelHi: 'लगभग 3 घंटे',
        level: 'L4',
        line1: 'That’s 3x the WHO limit for this age.',
        line2: 'Let’s make a plan together.',
        line1Hi: 'यह इस उम्र की सीमा से 3 गुना है।',
        line2Hi: 'आइए मिलकर एक योजना बनाएं।',
        source: 'Source: WHO, 2019',
        learnMore: 'In an Australian study, each extra minute of screen time at age 3 went with fewer conversational turns. At 3 hours a day, a child could miss significant parent-child conversation turns every day.',
      },
      {
        id: '4h_more',
        label: '4 hours or more',
        labelHi: '4 घंटे या अधिक',
        level: 'L5',
        line1: 'That’s 4x the WHO limit or more.',
        line2: 'Let’s fix this together.',
        line1Hi: 'यह डब्ल्यूएचओ की सीमा से 4 गुना या अधिक है।',
        line2Hi: 'आइए मिलकर इसे ठीक करते हैं।',
        source: 'Source: WHO, 2019',
        learnMore: 'Every minute of screen time is a minute not spent in free sensory play. Small gradual reductions build healthy routines without emotional conflict.',
      },
    ],
  };
};

export const OnboardingThirdScreenNative: React.FC<OnboardingThirdScreenNativeProps> = ({
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
  const [activeLevel, setActiveLevel] = useState<ReactionLevel>('L1');
  const [isTyping, setIsTyping] = useState<boolean>(true);

  // Two-sentence sequential lines
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
  const reactionScale = useRef(new Animated.Value(1)).current;
  const reactionTilt = useRef(new Animated.Value(0)).current;

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

  // 1. Mascot Idle Float & Wave
  useEffect(() => {
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
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    );
    waveLoop.start();

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

  // 3. Initial Question Speech (Fade in Line 1)
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
  // CHIP SELECTION & SEQUENTIAL TWO-LINE CHOREOGRAPHY
  // Line 1 appears first fading in -> Remains there for 1s -> Line 2 appears fading in
  // -------------------------------------------------------------
  const handleSelectChip = (chip: TimeChipConfig) => {
    setSelectedChipId(chip.id);
    setActiveLevel(chip.level);
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
      setSourceText(chip.source);
      setSmallPrintText(chip.smallPrint || '');
      setShowLearnMore(!!chip.learnMore);

      // Sentence 1 fades in
      Animated.parallel([
        Animated.timing(line1Fade, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(line1Translate, { toValue: 0, duration: 360, useNativeDriver: true }),
      ]).start(() => {
        // Once sentence 1 is fully there, wait exactly 1 second (1000ms), then sentence 2 appears
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

    // Visual Reaction Animation:
    if (chip.level === 'L1') {
      Animated.sequence([
        Animated.timing(reactionScale, { toValue: 1.08, duration: 250, useNativeDriver: true }),
        Animated.timing(reactionScale, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else if (chip.level === 'L2') {
      Animated.sequence([
        Animated.timing(reactionTilt, { toValue: -4, duration: 180, useNativeDriver: true }),
        Animated.timing(reactionTilt, { toValue: 4, duration: 220, useNativeDriver: true }),
        Animated.timing(reactionTilt, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (chip.level === 'L3') {
      Animated.timing(reactionTilt, {
        toValue: 8,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else if (chip.level === 'L4') {
      Animated.parallel([
        Animated.timing(reactionScale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(reactionTilt, { toValue: -6, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (chip.level === 'L5') {
      Animated.parallel([
        Animated.timing(reactionScale, { toValue: 1.06, duration: 220, useNativeDriver: true }),
        Animated.timing(reactionTilt, { toValue: 5, duration: 220, useNativeDriver: true }),
      ]).start();
    }

    // Settle back to calm smile after 2s
    settleTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(reactionScale, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(reactionTilt, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2000);
  };

  const handleContinuePress = () => {
    const chosenChip = config.chips.find((c) => c.id === selectedChipId) || config.chips[1];
    onContinue({
      childName: cleanName,
      ageCategory,
      timeChipId: chosenChip.id,
      timeChipLabel: chosenChip.label,
      reactionLevel: chosenChip.level,
    });
  };

  const waveInterpolate = handWaveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-18deg', '22deg'],
  });

  const tiltInterpolate = reactionTilt.interpolate({
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
                  {/* Line 1: Appears first, fading in */}
                  <Animated.View
                    style={{
                      opacity: line1Fade,
                      transform: [{ translateY: line1Translate }],
                    }}
                  >
                    <Text style={styles.speechText}>{line1Text}</Text>
                  </Animated.View>

                  {/* Line 2: Appears once Line 1 has been there for 1 second */}
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

          {/* Animated Mascot Figure */}
          <Animated.View
            style={[
              styles.mascotFigure,
              {
                transform: [
                  { translateY: floatAnim },
                  { scale: reactionScale },
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

        {/* Time Chips (No Emojis - Clean Pill Layout) */}
        <View style={styles.chipsSection}>
          <Text style={styles.chipsHeading}>
            {lang === 'hi' ? 'दैनिक स्क्रीन समय चुनें:' : 'Daily Screen Time:'}
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

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Continue Button */}
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
    paddingBottom: 20,
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
    height: 82,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotHandWrapper: {
    position: 'absolute',
    left: 8,
    top: 12,
    width: 40,
    height: 40,
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
  chipsSection: {
    width: '100%',
    marginTop: 10,
  },
  chipsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsList: {
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  timeChipSelected: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  chipTextGroup: {
    flex: 1,
  },
  chipLabel: {
    fontSize: 14.5,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  learnMoreHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  learnMoreTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  learnMoreBody: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  learnMoreText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    fontWeight: '600',
  },
  learnMoreDisclaimer: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 6,
    fontStyle: 'italic',
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
