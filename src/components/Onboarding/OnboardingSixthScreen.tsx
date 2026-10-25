import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import mascotBodyImg from '../../assets/mascot_body.png';
import mascotHandImg from '../../assets/mascot_hand.png';

export interface OnboardingScreen6Data {
  childName: string;
  ageCategory: string;
  selectedOptionIds: string[];
  selectedOptionLabels: string[];
  hasWorryingContent: boolean;
}

interface OnboardingSixthScreenProps {
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

export const OnboardingSixthScreen: React.FC<OnboardingSixthScreenProps> = ({
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

  // Speech bubble states
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [line1Text, setLine1Text] = useState<string>(lang === 'hi' ? config.questionHi : config.questionEn);
  const [line2Text, setLine2Text] = useState<string>('');
  const [sourceText, setSourceText] = useState<string>('');
  const [smallPrintText, setSmallPrintText] = useState<string>('');
  const [learnMoreText, setLearnMoreText] = useState<string>('');
  const [isLine1Visible, setIsLine1Visible] = useState<boolean>(false);
  const [isLine2Visible, setIsLine2Visible] = useState<boolean>(false);
  const [isLearnMoreExpanded, setIsLearnMoreExpanded] = useState<boolean>(false);
  const [isContinueVisible, setIsContinueVisible] = useState<boolean>(false);

  const hasWorryingSelection = selectedOptionIds.some((id) => {
    const opt = config.options.find((o) => o.id === id);
    return opt?.isWorrying;
  });

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const line2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut listener: Escape key skips only current screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onSkip) {
          onSkip();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  // Initial Question entrance
  useEffect(() => {
    if (!lastSelectedOptionId) {
      setIsTyping(true);
      setIsLine1Visible(false);
      setIsLine2Visible(false);

      const timer = setTimeout(() => {
        setIsTyping(false);
        setLine1Text(lang === 'hi' ? config.questionHi : config.questionEn);
        setLine2Text('');
        setSourceText('');
        setSmallPrintText('');
        setLearnMoreText('');
        setIsLine1Visible(true);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  // Multi-Select Toggle & Buddy Reactive Speech
  const handleToggleOption = (option: ContentOptionConfig) => {
    let nextSelected: string[];

    if (option.id === 'nothing_worrying') {
      nextSelected = ['nothing_worrying'];
    } else {
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

    if (nextSelected.length > 0) {
      setIsContinueVisible(true);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    setIsLine1Visible(false);
    setIsLine2Visible(false);

    const l1 = lang === 'hi' ? option.line1Hi : option.line1;
    const l2 = lang === 'hi' ? (option.line2Hi || '') : (option.line2 || '');

    setIsTyping(true);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setLine1Text(l1);
      setLine2Text(l2);
      setSourceText(option.source || '');
      setSmallPrintText(option.smallPrint || '');
      setLearnMoreText(option.learnMore || '');
      setIsLine1Visible(true);

      // Sentence 2 appears once Sentence 1 has been there for 1 second
      line2TimerRef.current = setTimeout(() => {
        setIsLine2Visible(true);
      }, 1000);
    }, 220);

    settleTimerRef.current = setTimeout(() => {
      setActivePose('L1');
    }, 2800);
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

  const getBuddyPoseClass = () => {
    switch (activePose) {
      case 'L1':
        return 'scale-105 transition-all duration-300';
      case 'L3':
        return 'rotate-3 transition-all duration-300';
      case 'L4':
        return 'scale-95 -rotate-2 transition-all duration-300';
      case 'E4':
        return 'scale-104 rotate-1 transition-all duration-300';
      default:
        return 'transition-all duration-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col justify-between font-sans select-none pb-8">
      {/* 1. TOP HEADER */}
      <div className="w-full max-w-md mx-auto px-4 pt-3 pb-2 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F1EFEA] hover:bg-[#EAE5DE] text-[#1A2436] text-xs font-black rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{lang === 'hi' ? 'पीछे' : 'Back'}</span>
          </button>
        ) : (
          <div className="w-12" />
        )}

        <div className="flex items-center gap-2">
          {/* Monochrome Language Toggle */}
          <div className="flex items-center bg-white border border-[#E2E8F0] rounded-full p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-full transition-all cursor-pointer ${
                lang === 'en' ? 'bg-black text-white' : 'text-black hover:bg-slate-100'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-full transition-all cursor-pointer ${
                lang === 'hi' ? 'bg-black text-white' : 'text-black hover:bg-slate-100'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Dev Skip Button */}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="px-2.5 py-1 text-[11px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-full transition-all cursor-pointer"
            >
              Skip
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 px-4 py-2 flex flex-col items-center max-w-md mx-auto w-full">
        {/* BUDDY MASCOT & SPEECH BUBBLE */}
        <div className="flex flex-col items-center my-2 relative w-full">
          {/* Speech Bubble */}
          <div className="relative mb-3 px-5 py-3.5 bg-white text-slate-800 rounded-2xl shadow-lg border-1.5 border-[#DDD6FE] max-w-[320px] text-center min-h-[52px] flex items-center justify-center transition-all duration-300 w-full">
            {isTyping ? (
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-[#7C6DF8] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-[#7C6DF8] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-[#7C6DF8] animate-bounce" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <p
                  className={`text-sm font-bold text-slate-800 leading-snug transition-all duration-300 ${
                    isLine1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  {line1Text}
                </p>

                {isLine2Visible && line2Text && (
                  <p className="text-sm font-black text-[#4338CA] leading-snug mt-1 animate-fadeIn">
                    {line2Text}
                  </p>
                )}

                {isLine2Visible && (sourceText || smallPrintText) && (
                  <div className="mt-1.5 flex flex-col items-center gap-0.5 animate-fadeIn">
                    {sourceText && (
                      <span className="text-[10px] font-semibold text-slate-500">{sourceText}</span>
                    )}
                    {smallPrintText && (
                      <span className="text-[9.5px] italic text-slate-400">{smallPrintText}</span>
                    )}
                  </div>
                )}

                {isLine2Visible && learnMoreText && (
                  <div className="mt-2 w-full animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => setIsLearnMoreExpanded(!isLearnMoreExpanded)}
                      className="text-[10.5px] font-black text-[#7C6DF8] hover:text-[#6D28D9] flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <span>
                        {isLearnMoreExpanded
                          ? (lang === 'hi' ? 'संक्षेप में देखें' : 'Show less')
                          : (lang === 'hi' ? 'अध्ययन विवरण पढ़ें' : 'Read study details')}
                      </span>
                      {isLearnMoreExpanded ? (
                        <ChevronUp className="w-3 h-3 stroke-[3]" />
                      ) : (
                        <ChevronDown className="w-3 h-3 stroke-[3]" />
                      )}
                    </button>

                    {isLearnMoreExpanded && (
                      <div className="mt-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-left">
                        <p className="text-[10.5px] text-slate-600 leading-relaxed font-normal">
                          {learnMoreText}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bubble Tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-[#DDD6FE]" />
          </div>

          {/* Buddy Mascot Figure */}
          <div className={`relative w-28 h-28 flex items-center justify-center ${getBuddyPoseClass()}`}>
            <div className="absolute -top-1 right-2 z-10 animate-wave origin-bottom">
              <img src={mascotHandImg} alt="Waving Hand" className="w-8 h-8 object-contain" />
            </div>
            <img src={mascotBodyImg} alt="Buddy Mascot" className="w-24 h-24 object-contain" />
          </div>
        </div>

        {/* 3. STANDING LINE (Appears when any worrying option is selected) */}
        {hasWorryingSelection && (
          <div className="w-full max-w-sm mb-3 px-3 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-center animate-fadeIn">
            <p className="text-[11px] font-medium text-slate-600 leading-snug">
              {lang === 'hi' ? config.standingLineHi : config.standingLineEn}
            </p>
          </div>
        )}

        {/* 4. MULTI-SELECT CHIPS LIST */}
        <div className="w-full max-w-sm">
          <p className="text-[11.5px] font-black text-slate-500 uppercase tracking-wider text-center mb-2">
            {lang === 'hi' ? 'लागू होने वाले सभी विकल्प चुनें:' : 'Pick all that apply:'}
          </p>

          <div className="flex flex-col gap-2 w-full">
            {config.options.map((opt) => {
              const isSelected = selectedOptionIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleToggleOption(opt)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl border-1.5 transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#FAF5FF] border-[#7C6DF8] shadow-[0_4px_14px_rgba(124,109,248,0.18)] scale-[1.01]'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:bg-slate-50/50'
                  }`}
                >
                  <span
                    className={`text-sm font-extrabold transition-colors ${
                      isSelected ? 'text-[#6D28D9]' : 'text-slate-800'
                    }`}
                  >
                    {lang === 'hi' ? opt.labelHi : opt.label}
                  </span>

                  {/* Multi-Select Checkbox Box */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#7C6DF8] text-white shadow-xs'
                        : 'border-1.5 border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. CONTINUE BUTTON */}
        <div
          className={`w-full max-w-sm mt-5 transition-all duration-400 ${
            isContinueVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={handleContinuePress}
            className="w-full py-3.5 px-5 bg-[#5D997C] hover:bg-[#4E856A] active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-[0_4px_16px_rgba(93,153,124,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{lang === 'hi' ? 'आगे बढ़ें' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
