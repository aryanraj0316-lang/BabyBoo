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

export interface OnboardingScreen6Data {
  childName: string;
  ageCategory: string;
  selectedOptionIds: string[];
  selectedOptionLabels: string[];
  hasWorryingContent: boolean;
}

interface OnboardingSixthScreenNativeProps {
  childName?: string;
  ageCategory?: string;
  onBack?: () => void;
  onContinue: (data: OnboardingScreen6Data) => void;
  onSkip?: () => void;
  initialLanguage?: 'en' | 'hi';
}

type Language = 'en' | 'hi';
type BuddyPose = 'L1' | 'L3' | 'L4' | 'E4';

interface ContentOptionConfig {
  id: string;
  label: string;
  labelHi: string;
  pose: BuddyPose;
  line1: string;
  line2?: string;
  line1Hi: string;
  line2Hi?: string;
  source?: string;
  smallPrint?: string;
  learnMore?: string;
  isWorrying: boolean;
}

const getConfigsForAgeGroup = (
  ageCategory: string,
  name: string
): { questionEn: string; questionHi: string; standingLineEn: string; standingLineHi: string; options: ContentOptionConfig[] } => {
  const normAge = (ageCategory || '2_4').toLowerCase();

  const standingLineEn = `I can’t choose what ${name} watches, but I can limit how long. Less time means less exposure.`;
  const standingLineHi = `मैं यह नहीं चुन सकता कि ${name} क्या देखे, लेकिन मैं समय सीमित कर सकता हूँ। कम समय मतलब कम जोखिम।`;

  const questionEn = `What does ${name} pick up from the phone? Pick all that apply.`;
  const questionHi = `${name} फोन से ज्यादातर क्या सीखता या देखता है? जो भी लागू हो, चुनें।`;

  const c1Text = `Researchers studied 426 YouTube videos watched by 47 children under 3. Only 19% were made for their age, 27% showed physical violence, 15% had scary content, 48% promoted products, and only 6% had a learning goal. Music videos had far less violence (8%) and product promotion (11%) than other videos (34% and 62%). Gaming videos stood out, with 64% showing physical violence and 89% promoting products. Source: Henderson et al., 2024.`;
  const c2Text = `A review by the American Academy of Pediatrics found a significant link between media violence and aggressive behavior, aggressive thoughts and angry feelings. In one study, violent TV at ages 1 to 3 was linked to more attention problems five years later, but not at ages 4 to 5. In a randomized trial, replacing violent TV with age-appropriate programs reduced behavior problems in preschool boys. Sources: AAP; Zimmerman and Christakis, 2007; Christakis et al., 2013.`;
  const c3Text = `Researchers reviewed 135 popular apps for children 5 and under. 95% contained at least one type of advertising, including all of the free apps. In-app purchases appeared in about a third of the apps. Children under 8 often have difficulty telling advertising from regular content. Sources: Meyer et al., 2019; APA task force on advertising and children, 2004.`;
  const c4Text = `In a 2018 Pew Research Center survey, 61% of parents said their child had come across content on YouTube that was unsuitable for children. In a Common Sense study, about 1 in 10 parents said they were surprised by some videos their child had watched. Sources: Pew Research Center, 2018; Radesky et al., Common Sense Media, 2020.`;

  // Group A: Under 1 year
  if (normAge === 'under_1' || normAge === 'under_2' || normAge === '< 2') {
    return {
      questionEn,
      questionHi,
      standingLineEn,
      standingLineHi,
      options: [
        {
          id: 'violence',
          label: 'Fighting or hitting scenes',
          labelHi: 'लड़ाई या मार-पीट वाले दृश्य',
          pose: 'L4',
          line1: 'In one study, babies under 1 saw more violent videos than 2-year-olds.',
          line2: 'Less screen time means fewer chances of that.',
          line1Hi: 'एक अध्ययन में, 1 वर्ष से कम उम्र के शिशुओं ने 2 साल के बच्चों की तुलना में अधिक हिंसक वीडियो देखे।',
          line2Hi: 'कम स्क्रीन समय से इसका जोखिम कम होता है।',
          source: 'Henderson et al., 2024. Small study',
          smallPrint: `Patterns across many children, not a prediction for ${name}. Small study.`,
          learnMore: c1Text,
          isWorrying: true,
        },
        {
          id: 'scary',
          label: 'Scary or grown-up scenes',
          labelHi: 'डरावने या बड़ों वाले दृश्य',
          pose: 'E4',
          line1: 'In one study, only 19% of videos watched by children under 3 were made for their age.',
          line2: 'Less time means less exposure.',
          line1Hi: 'एक अध्ययन में, 3 वर्ष से कम उम्र के बच्चों द्वारा देखे गए केवल 19% वीडियो उनकी उम्र के लिए बने थे।',
          line2Hi: 'कम समय मतलब कम जोखिम।',
          source: 'Henderson et al., 2024. Small study',
          smallPrint: `Patterns across many children, not a prediction for ${name}. Small study.`,
          learnMore: c1Text,
          isWorrying: true,
        },
        {
          id: 'ads',
          label: 'Ads and toy videos',
          labelHi: 'विज्ञापन और खिलौनों के वीडियो',
          pose: 'L3',
          line1: '95% of popular apps for children 5 and under contain ads.',
          line2: 'Less time means fewer of them.',
          line1Hi: '5 वर्ष और उससे कम उम्र के बच्चों के 95% लोकप्रिय ऐप्स में विज्ञापन होते हैं।',
          line2Hi: 'कम समय मतलब ऐसे विज्ञापन कम दिखना।',
          source: 'Meyer et al., 2019',
          learnMore: c3Text,
          isWorrying: true,
        },
        {
          id: 'songs',
          label: 'Songs and rhymes',
          labelHi: 'गाने और कविताएँ (राइम्स)',
          pose: 'L1',
          line1: 'Lovely. In one study, music videos had far less violence and advertising than other videos.',
          line1Hi: 'बहुत बढ़िया। एक अध्ययन में पाया गया कि संगीत वीडियो में अन्य वीडियो की तुलना में हिंसा और विज्ञापन बहुत कम थे।',
          source: 'Henderson et al., 2024. Small study',
          learnMore: c1Text,
          isWorrying: false,
        },
        {
          id: 'nothing_worrying',
          label: 'Nothing worrying so far',
          labelHi: 'अभी तक कुछ भी चिंताजनक नहीं',
          pose: 'L1',
          line1: 'Wonderful. Let’s keep it that way.',
          line1Hi: 'अद्भुत। आइए इसे ऐसे ही बनाए रखें।',
          isWorrying: false,
        },
      ],
    };
  }

  // Group B: 1 year (12–23 months)
  if (normAge === 'age_1' || normAge === '1' || normAge === '1_year') {
    return {
      questionEn,
      questionHi,
      standingLineEn,
      standingLineHi,
      options: [
        {
          id: 'rude_words',
          label: 'Rude or bad words',
          labelHi: 'अनुचित या बुरे शब्द',
          pose: 'L3',
          line1: 'Young children copy what they see.',
          line2: 'Children as young as 14 months can imitate behavior from a screen.',
          line1Hi: 'छोटे बच्चे जो देखते हैं वही सीखते हैं।',
          line2Hi: '14 महीने तक के छोटे बच्चे भी स्क्रीन से व्यवहार की नकल कर सकते हैं।',
          source: 'Henderson et al., 2024 (citing earlier studies)',
          isWorrying: true,
        },
        {
          id: 'violence',
          label: 'Hitting or fighting scenes',
          labelHi: 'मार-पीट या लड़ाई वाले दृश्य',
          pose: 'L4',
          line1: 'Researchers see ages 1 to 3 as an especially sensitive time for violent content.',
          line2: 'Less screen time means less exposure.',
          line1Hi: 'शोधकर्ताओं के अनुसार 1 से 3 वर्ष की उम्र हिंसक सामग्री के प्रति विशेष रूप से संवेदनशील होती है।',
          line2Hi: 'कम समय मतलब कम जोखिम।',
          source: 'Henderson et al., 2024 (the authors’ interpretation)',
          learnMore: c2Text,
          isWorrying: true,
        },
        {
          id: 'scary',
          label: 'Scary or grown-up scenes',
          labelHi: 'डरावने या बड़ों वाले दृश्य',
          pose: 'E4',
          line1: 'In one study, 81% of videos watched by children under 3 were not made for their age.',
          line2: 'Less time means less exposure.',
          line1Hi: 'एक अध्ययन में, 3 वर्ष से कम उम्र के बच्चों द्वारा देखे गए 81% वीडियो उनकी उम्र के लिए नहीं थे।',
          line2Hi: 'कम समय मतलब कम जोखिम।',
          source: 'Henderson et al., 2024. Small study',
          smallPrint: `Patterns across many children, not a prediction for ${name}. Small study.`,
          learnMore: c1Text,
          isWorrying: true,
        },
        {
          id: 'ads',
          label: 'Ads and toy videos',
          labelHi: 'विज्ञापन और खिलौनों के वीडियो',
          pose: 'L3',
          line1: '95% of popular apps for children 5 and under contain ads.',
          line2: '48% of videos in one study promoted products.',
          line1Hi: '5 वर्ष से कम उम्र के 95% लोकप्रिय ऐप्स में विज्ञापन होते हैं।',
          line2Hi: 'एक अध्ययन में 48% वीडियो उत्पादों का प्रचार करते पाए गए।',
          source: 'Meyer et al., 2019; Henderson et al., 2024',
          learnMore: c3Text,
          isWorrying: true,
        },
        {
          id: 'songs',
          label: 'Songs and rhymes',
          labelHi: 'गाने और कविताएँ (राइम्स)',
          pose: 'L1',
          line1: 'Lovely. In one study, music videos had far less violence and advertising than other videos.',
          line1Hi: 'बहुत बढ़िया। एक अध्ययन में पाया गया कि संगीत वीडियो में अन्य वीडियो की तुलना में हिंसा और विज्ञापन बहुत कम थे।',
          source: 'Henderson et al., 2024. Small study',
          learnMore: c1Text,
          isWorrying: false,
        },
        {
          id: 'nothing_worrying',
          label: 'Nothing worrying so far',
          labelHi: 'अभी तक कुछ भी चिंताजनक नहीं',
          pose: 'L1',
          line1: 'Wonderful. Let’s keep it that way.',
          line1Hi: 'अद्भुत। आइए इसे ऐसे ही बनाए रखें।',
          isWorrying: false,
        },
      ],
    };
  }

  // Group D: 5–10 years
  if (normAge === '5_7' || normAge === '8_10' || normAge === '5-7' || normAge === '8-10' || normAge === '6_7' || normAge === '6-7') {
    return {
      questionEn,
      questionHi,
      standingLineEn,
      standingLineHi,
      options: [
        {
          id: 'rude_words',
          label: 'Rude slang or abusive words',
          labelHi: 'अनुचित स्लैंग या अभद्र शब्द',
          pose: 'L3',
          line1: 'Thank you for telling me.',
          line2: 'Talking about words together is a great first step.',
          line1Hi: 'मुझे बताने के लिए धन्यवाद।',
          line2Hi: 'साथ मिलकर शब्दों पर बात करना एक बहुत अच्छी शुरुआत है।',
          isWorrying: true,
        },
        {
          id: 'violence',
          label: 'Copying fights or violent games',
          labelHi: 'लड़ाई या हिंसक खेलों की नकल करना',
          pose: 'L3',
          line1: 'The AAP links media violence to more aggressive behavior and angry feelings.',
          line2: 'Less time means less exposure.',
          line1Hi: 'अमेरिकन एकेडमी ऑफ पीडियाट्रिक्स मीडिया हिंसा को अधिक आक्रामक व्यवहार और गुस्से से जोड़ती है।',
          line2Hi: 'कम समय मतलब कम जोखिम।',
          source: 'AAP policy statement on virtual violence',
          learnMore: c2Text,
          isWorrying: true,
        },
        {
          id: 'scary',
          label: 'Content that’s too grown-up',
          labelHi: 'ऐसी सामग्री जो बड़ों के लिए है',
          pose: 'E4',
          line1: 'In a 2018 Pew survey, 61% of parents said their child had come across unsuitable content on YouTube.',
          line2: 'You’re not alone.',
          line1Hi: '2018 के प्यू सर्वे में 61% माता-पिता ने कहा कि उनके बच्चे ने यूट्यूब पर अनुपयुक्त सामग्री देखी है।',
          line2Hi: 'आप अकेले नहीं हैं।',
          source: 'Pew Research Center, 2018',
          learnMore: c4Text,
          isWorrying: true,
        },
        {
          id: 'ads',
          label: 'Ads and in-app spending',
          labelHi: 'विज्ञापन और इन-ऐप खरीदारी',
          pose: 'L3',
          line1: 'Ads are common in kids’ apps: 95% of popular apps for children 5 and under contain them.',
          line1Hi: 'बच्चों के ऐप्स में विज्ञापन आम हैं: 95% लोकप्रिय ऐप्स में विज्ञापन होते हैं।',
          source: 'Meyer et al., 2019',
          learnMore: c3Text,
          isWorrying: true,
        },
        {
          id: 'songs',
          label: 'Useful things (learning, creating)',
          labelHi: 'उपयोगी चीजें (सीखना, रचनात्मकता)',
          pose: 'L1',
          line1: 'Great. Learning and creating are what I’d hope to see.',
          line1Hi: 'शानदार। सीखना और रचनात्मक होना वही है जो हम देखना चाहते हैं।',
          isWorrying: false,
        },
        {
          id: 'nothing_worrying',
          label: 'Nothing worrying so far',
          labelHi: 'अभी तक कुछ भी चिंताजनक नहीं',
          pose: 'L1',
          line1: 'Wonderful. Let’s keep it that way.',
          line1Hi: 'अद्भुत। आइए इसे ऐसे ही बनाए रखें।',
          isWorrying: false,
        },
      ],
    };
  }

  // Default: Group C (2–4 years)
  return {
    questionEn,
    questionHi,
    standingLineEn,
    standingLineHi,
    options: [
      {
        id: 'rude_words',
        label: 'Rude words or slang',
        labelHi: 'अनुचित शब्द या गलत भाषा',
        pose: 'L3',
        line1: 'Young children copy the people and characters they watch, even cartoon characters.',
        line1Hi: 'छोटे बच्चे उन लोगों और किरदारों की नकल करते हैं जिन्हें वे देखते हैं, यहाँ तक कि कार्टून किरदारों की भी।',
        source: 'JAMA Pediatrics review of media violence research',
        isWorrying: true,
      },
      {
        id: 'violence',
        label: 'Hitting, pushing or acting out fights',
        labelHi: 'मारना, धक्का देना या लड़ाई की नकल करना',
        pose: 'L4',
        line1: 'The AAP links media violence to more aggressive behavior and angry feelings.',
        line2: 'Children copy what they see.',
        line1Hi: 'अमेरिकन एकेडमी ऑफ पीडियाट्रिक्स मीडिया हिंसा को अधिक आक्रामक व्यवहार और गुस्से से जोड़ती है।',
        line2Hi: 'बच्चे जो देखते हैं, वही सीखते हैं।',
        source: 'AAP policy statement on virtual violence',
        learnMore: c2Text,
        isWorrying: true,
      },
      {
        id: 'scary',
        label: 'Scary or grown-up scenes',
        labelHi: 'डरावने या बड़ों वाले दृश्य',
        pose: 'E4',
        line1: 'In a 2018 Pew survey, 61% of parents said their child had come across unsuitable content on YouTube.',
        line2: 'You’re not alone.',
        line1Hi: '2018 के प्यू सर्वे में 61% माता-पिता ने कहा कि उनके बच्चे ने यूट्यूब पर अनुपयुक्त सामग्री देखी है।',
        line2Hi: 'आप अकेले नहीं हैं।',
        source: 'Pew Research Center, 2018',
        learnMore: c4Text,
        isWorrying: true,
      },
      {
        id: 'ads',
        label: 'Ads and toy videos',
        labelHi: 'विज्ञापन और खिलौनों के वीडियो',
        pose: 'L3',
        line1: '95% of popular apps for children 5 and under contain ads, and young kids often can’t spot them.',
        line1Hi: '5 वर्ष से कम उम्र के बच्चों के 95% लोकप्रिय ऐप्स में विज्ञापन होते हैं, और छोटे बच्चे अक्सर उन्हें पहचान नहीं पाते।',
        source: 'Meyer et al., 2019; APA task force, 2004',
        learnMore: c3Text,
        isWorrying: true,
      },
      {
        id: 'songs',
        label: 'Songs and learning',
        labelHi: 'गाने और सीखने वाली चीजें',
        pose: 'L1',
        line1: 'Lovely. In one study, music and informational videos had less violence than other videos.',
        line1Hi: 'बहुत अच्छा। एक अध्ययन में पाया गया कि संगीत और जानकारीपूर्ण वीडियो में अन्य वीडियो की तुलना में हिंसा कम थी।',
        source: 'Henderson et al., 2024. Small study',
        learnMore: c1Text,
        isWorrying: false,
      },
      {
        id: 'nothing_worrying',
        label: 'Nothing worrying so far',
        labelHi: 'अभी तक कुछ भी चिंताजनक नहीं',
        pose: 'L1',
        line1: 'Wonderful. Let’s keep it that way.',
        line1Hi: 'अद्भुत। आइए इसे ऐसे ही बनाए रखें।',
        isWorrying: false,
      },
    ],
  };
};

export const OnboardingSixthScreenNative: React.FC<OnboardingSixthScreenNativeProps> = ({
  childName = 'Leo',
  ageCategory = '2_4',
  onBack,
  onContinue,
  onSkip,
  initialLanguage = 'en',
}) => {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const cleanName = childName?.trim() || 'Leo';
  const config = getConfigsForAgeGroup(ageCategory, cleanName);

  // Multi-select state
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [lastSelectedOptionId, setLastSelectedOptionId] = useState<string | null>(null);
  const [activePose, setActivePose] = useState<BuddyPose>('L1');

  // Sequential speech line state
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [line1Text, setLine1Text] = useState<string>(lang === 'hi' ? config.questionHi : config.questionEn);
  const [line2Text, setLine2Text] = useState<string>('');
  const [sourceText, setSourceText] = useState<string>('');
  const [smallPrintText, setSmallPrintText] = useState<string>('');
  const [learnMoreText, setLearnMoreText] = useState<string>('');
  const [isLine2Mounted, setIsLine2Mounted] = useState<boolean>(false);
  const [isLearnMoreExpanded, setIsLearnMoreExpanded] = useState<boolean>(false);

  // Standing line visibility: appears once any worrying option is selected
  const hasWorryingSelection = selectedOptionIds.some((id) => {
    const opt = config.options.find((o) => o.id === id);
    return opt?.isWorrying;
  });

  // Animations
  const handWaveAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const poseScale = useRef(new Animated.Value(1)).current;
  const poseTilt = useRef(new Animated.Value(0)).current;

  // Typing Dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Speech Lines Animations
  const line1Fade = useRef(new Animated.Value(0)).current;
  const line1Translate = useRef(new Animated.Value(6)).current;
  const line2Fade = useRef(new Animated.Value(0)).current;
  const line2Translate = useRef(new Animated.Value(6)).current;
  const extraFade = useRef(new Animated.Value(0)).current;

  // Standing Line animation
  const standingLineFade = useRef(new Animated.Value(0)).current;

  // Continue Button
  const continueFade = useRef(new Animated.Value(0)).current;
  const continueTranslate = useRef(new Animated.Value(16)).current;
  const [isContinueVisible, setIsContinueVisible] = useState<boolean>(false);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const line2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Idle mascot waving
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
    if (!lastSelectedOptionId) {
      setIsTyping(true);
      setIsLine2Mounted(false);
      line1Fade.setValue(0);
      line1Translate.setValue(6);
      line2Fade.setValue(0);

      const timer = setTimeout(() => {
        setIsTyping(false);
        setLine1Text(lang === 'hi' ? config.questionHi : config.questionEn);
        setLine2Text('');
        setSourceText('');
        setSmallPrintText('');
        setLearnMoreText('');

        Animated.parallel([
          Animated.timing(line1Fade, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(line1Translate, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]).start();
      }, 350);

      return () => clearTimeout(timer);
    } else {
      const opt = config.options.find((o) => o.id === lastSelectedOptionId);
      if (opt) {
        setLine1Text(lang === 'hi' ? opt.line1Hi : opt.line1);
        setLine2Text(lang === 'hi' ? (opt.line2Hi || '') : (opt.line2 || ''));
      }
    }
  }, [lang, config.questionEn, config.questionHi, lastSelectedOptionId]);

  // Animate standing line when worrying options change
  useEffect(() => {
    if (hasWorryingSelection) {
      Animated.timing(standingLineFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } else {
      Animated.timing(standingLineFade, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [hasWorryingSelection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  // 4. Multi-Select Toggle & Buddy Reactive Speech
  const handleToggleOption = (option: ContentOptionConfig) => {
    let nextSelected: string[];

    if (option.id === 'nothing_worrying') {
      // Choosing "Nothing worrying so far" clears every other option
      nextSelected = ['nothing_worrying'];
    } else {
      // If "Nothing worrying so far" was active, clear it when another option is picked
      const withoutNothing = selectedOptionIds.filter((id) => id !== 'nothing_worrying');
      if (withoutNothing.includes(option.id)) {
        nextSelected = withoutNothing.filter((id) => id !== option.id);
      } else {
        nextSelected = [...withoutNothing, option.id];
      }
    }

    setSelectedOptionIds(nextSelected);
    setLastSelectedOptionId(option.id);
    setActivePose(option.pose);
    setIsLearnMoreExpanded(false);

    if (nextSelected.length > 0 && !isContinueVisible) {
      setIsContinueVisible(true);
      Animated.parallel([
        Animated.timing(continueFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(continueTranslate, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    // Reset line 2
    setIsLine2Mounted(false);
    line1Fade.setValue(0);
    line1Translate.setValue(6);
    line2Fade.setValue(0);
    line2Translate.setValue(6);
    extraFade.setValue(0);

    const l1 = lang === 'hi' ? option.line1Hi : option.line1;
    const l2 = lang === 'hi' ? (option.line2Hi || '') : (option.line2 || '');

    // Show typing dots briefly
    setIsTyping(true);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setLine1Text(l1);
      setLine2Text(l2);
      setSourceText(option.source || '');
      setSmallPrintText(option.smallPrint || '');
      setLearnMoreText(option.learnMore || '');

      Animated.parallel([
        Animated.timing(line1Fade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(line1Translate, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        line2TimerRef.current = setTimeout(() => {
          setIsLine2Mounted(true);
          Animated.parallel([
            Animated.timing(line2Fade, { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.timing(line2Translate, { toValue: 0, duration: 380, useNativeDriver: true }),
            Animated.timing(extraFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          ]).start();
        }, 1000);
      });
    }, 220);

    // Buddy Pose Animation
    if (option.pose === 'L1') {
      Animated.sequence([
        Animated.timing(poseScale, { toValue: 1.06, duration: 200, useNativeDriver: true }),
        Animated.timing(poseScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (option.pose === 'L3') {
      // Curious head tilt
      Animated.sequence([
        Animated.timing(poseTilt, { toValue: 4, duration: 220, useNativeDriver: true }),
        Animated.timing(poseTilt, { toValue: -2, duration: 200, useNativeDriver: true }),
        Animated.timing(poseTilt, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (option.pose === 'L4') {
      // Worried soft gasp
      Animated.sequence([
        Animated.timing(poseScale, { toValue: 0.96, duration: 160, useNativeDriver: true }),
        Animated.timing(poseScale, { toValue: 1.03, duration: 200, useNativeDriver: true }),
        Animated.timing(poseScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (option.pose === 'E4') {
      // Gentle hug
      Animated.parallel([
        Animated.timing(poseScale, { toValue: 1.05, duration: 250, useNativeDriver: true }),
        Animated.timing(poseTilt, { toValue: 3, duration: 250, useNativeDriver: true }),
      ]).start();
    }

    settleTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(poseScale, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(poseTilt, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 2500);
  };

  const handleContinuePress = () => {
    const selectedLabels = selectedOptionIds.map((id) => {
      const opt = config.options.find((o) => o.id === id);
      return opt ? opt.label : id;
    });

    onContinue({
      childName: cleanName,
      ageCategory,
      selectedOptionIds,
      selectedOptionLabels: selectedLabels,
      hasWorryingContent: hasWorryingSelection,
    });
  };

  const waveInterpolate = handWaveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-16deg', '22deg'],
  });

  const tiltInterpolate = poseTilt.interpolate({
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
          {/* Monochrome Language Switcher */}
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
                  {/* Sentence 1 */}
                  <Animated.View
                    style={{
                      opacity: line1Fade,
                      transform: [{ translateY: line1Translate }],
                    }}
                  >
                    <Text style={styles.speechText}>{line1Text}</Text>
                  </Animated.View>

                  {/* Sentence 2: 1s later */}
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

                  {/* Source and small disclaimer */}
                  {isLine2Mounted && (sourceText || smallPrintText) ? (
                    <Animated.View style={{ opacity: extraFade, alignItems: 'center', marginTop: 4 }}>
                      {sourceText ? <Text style={styles.sourceText}>{sourceText}</Text> : null}
                      {smallPrintText ? <Text style={styles.smallPrintText}>{smallPrintText}</Text> : null}
                    </Animated.View>
                  ) : null}

                  {/* Expandable Learn More Card */}
                  {isLine2Mounted && learnMoreText ? (
                    <Animated.View style={{ opacity: extraFade, marginTop: 6, width: '100%', alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => setIsLearnMoreExpanded(!isLearnMoreExpanded)}
                        activeOpacity={0.7}
                        style={styles.learnMoreLink}
                      >
                        <Text style={styles.learnMoreLinkText}>
                          {isLearnMoreExpanded
                            ? (lang === 'hi' ? 'संक्षेप में देखें ▲' : 'Show less ▲')
                            : (lang === 'hi' ? 'अध्ययन विवरण पढ़ें ▼' : 'Read study details ▼')}
                        </Text>
                      </TouchableOpacity>

                      {isLearnMoreExpanded && (
                        <View style={styles.learnMoreCard}>
                          <Text style={styles.learnMoreCardText}>{learnMoreText}</Text>
                        </View>
                      )}
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
                  { scale: poseScale },
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

        {/* 3. STANDING LINE (Appears when any worrying option is chosen) */}
        {hasWorryingSelection && (
          <Animated.View style={[styles.standingLineContainer, { opacity: standingLineFade }]}>
            <Text style={styles.standingLineText}>
              {lang === 'hi' ? config.standingLineHi : config.standingLineEn}
            </Text>
          </Animated.View>
        )}

        {/* 4. MULTI-SELECT CHIPS LIST (Pure Typography, Zero Emojis) */}
        <View style={styles.chipsSection}>
          <Text style={styles.chipsHeading}>
            {lang === 'hi' ? 'लागू होने वाले सभी विकल्प चुनें:' : 'Pick all that apply:'}
          </Text>

          <View style={styles.chipsList}>
            {config.options.map((opt) => {
              const isSelected = selectedOptionIds.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => handleToggleOption(opt)}
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
                      {lang === 'hi' ? opt.labelHi : opt.label}
                    </Text>
                  </View>

                  {/* Multi-select Checkbox Indicator */}
                  <View
                    style={[
                      styles.chipCheckbox,
                      isSelected ? styles.chipCheckboxSelected : styles.chipCheckboxNormal,
                    ]}
                  >
                    {isSelected && <Text style={styles.chipCheckmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. CONTINUE ACTION BUTTON */}
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
    minHeight: 48,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 19,
  },
  speechTextLine2: {
    fontWeight: '800',
    color: '#4338CA',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  smallPrintText: {
    fontSize: 9.5,
    fontStyle: 'italic',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 1,
  },
  learnMoreLink: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  learnMoreLinkText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7C6DF8',
    textAlign: 'center',
  },
  learnMoreCard: {
    marginTop: 6,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  learnMoreCardText: {
    fontSize: 10.5,
    color: '#334155',
    lineHeight: 15,
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
    width: 105,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mascotHandWrapper: {
    position: 'absolute',
    top: 5,
    right: 10,
    zIndex: 2,
  },
  mascotHandImg: {
    width: 32,
    height: 32,
  },
  mascotBodyImg: {
    width: 95,
    height: 95,
  },
  standingLineContainer: {
    maxWidth: 340,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 6,
    alignItems: 'center',
  },
  standingLineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
  },
  chipsSection: {
    width: '100%',
    maxWidth: 360,
    marginTop: 6,
  },
  chipsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsList: {
    gap: 8,
    width: '100%',
  },
  chipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
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
    fontSize: 14,
    fontWeight: '800',
  },
  chipTitleNormal: {
    color: '#1E293B',
  },
  chipTitleSelected: {
    color: '#6D28D9',
  },
  chipCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  chipCheckboxNormal: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  chipCheckboxSelected: {
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
    marginTop: 16,
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
