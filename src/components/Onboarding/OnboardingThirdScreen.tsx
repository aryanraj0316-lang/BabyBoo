import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import mascotBodyImg from '../../assets/mascot_body.png';
import mascotHandImg from '../../assets/mascot_hand.png';

export interface OnboardingScreen3Data {
  childName: string;
  ageCategory: string;
  timeChipId: string;
  timeChipLabel: string;
  reactionLevel: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}

interface OnboardingThirdScreenProps {
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

const getConfigsForAgeGroup = (
  ageCategory: string,
  name: string
): { questionEn: string; questionHi: string; chips: TimeChipConfig[] } => {
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
          line1Hi: 'डब्ल्यूएचओ 1 वर्ष से पहले स्क्रीन न देने और खेलकूद को प्राथमिकता देने की सलाह देता है।',
          line2Hi: 'आइए मिलकर इस पर काम करते हैं।',
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
          line2Hi: 'छोटे-छोटे कदम मददगार होंगे, मैं आपका मार्गदर्शन करूंगा।',
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
          line2: 'Wonderful step for healthy growth!',
          line1Hi: 'यह डब्ल्यूएचओ की गाइडलाइन के अनुसार है, जो 1 वर्ष की उम्र में स्क्रीन से बचने की सलाह देता है।',
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

export const OnboardingThirdScreen: React.FC<OnboardingThirdScreenProps> = ({
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

  // Sequential Two-Line Speech States
  const [line1Text, setLine1Text] = useState<string>('');
  const [line2Text, setLine2Text] = useState<string>('');
  const [isLine1Visible, setIsLine1Visible] = useState<boolean>(false);
  const [isLine2Mounted, setIsLine2Mounted] = useState<boolean>(false);
  const [isLine2Visible, setIsLine2Visible] = useState<boolean>(false);

  const [sourceText, setSourceText] = useState<string>('');
  const [smallPrintText, setSmallPrintText] = useState<string>('');
  const [showLearnMore, setShowLearnMore] = useState<boolean>(false);
  const [isLearnMoreExpanded, setIsLearnMoreExpanded] = useState<boolean>(false);
  const [isContinueVisible, setIsContinueVisible] = useState<boolean>(false);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const line2TimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const line2FadeInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Question speech
  useEffect(() => {
    if (!selectedChipId) {
      setIsTyping(true);
      setIsLine1Visible(false);
      setIsLine2Mounted(false);
      setIsLine2Visible(false);

      const timer = setTimeout(() => {
        setIsTyping(false);
        setLine1Text(lang === 'hi' ? config.questionHi : config.questionEn);
        setLine2Text('');
        setSourceText('');
        setSmallPrintText('');
        setIsLine1Visible(true);
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
      if (line2FadeInTimerRef.current) clearTimeout(line2FadeInTimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  // Keyboard Escape listener to skip current screen for dev purposes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onSkip) {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  // Chip selection: Sentence 1 fades in -> Waits 1 second while visible -> Sentence 2 fades in
  const handleSelectChip = (chip: TimeChipConfig) => {
    setSelectedChipId(chip.id);
    setActiveLevel(chip.level);
    setIsLearnMoreExpanded(false);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
    if (line2FadeInTimerRef.current) clearTimeout(line2FadeInTimerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    // Reset lines & hide line 2 so bubble fits sentence 1 cleanly
    setIsLine1Visible(false);
    setIsLine2Mounted(false);
    setIsLine2Visible(false);

    const l1 = lang === 'hi' ? chip.line1Hi : chip.line1;
    const l2 = lang === 'hi' ? (chip.line2Hi || '') : (chip.line2 || '');

    // Show typing dots briefly (250ms)
    setIsTyping(true);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setLine1Text(l1);
      setLine2Text(l2);
      setSourceText(chip.source);
      setSmallPrintText(chip.smallPrint || '');
      setShowLearnMore(!!chip.learnMore);

      // Sentence 1 fades in smoothly
      setIsLine1Visible(true);

      // Wait 360ms for sentence 1 fade-in, then 1000ms with sentence 1 resting there -> reveal sentence 2
      line2TimerRef.current = setTimeout(() => {
        setIsLine2Mounted(true);
        line2FadeInTimerRef.current = setTimeout(() => {
          setIsLine2Visible(true);
          setIsContinueVisible(true);
        }, 30);
      }, 1360);
    }, 250);

    // Settle back to calm after 2s
    settleTimerRef.current = setTimeout(() => {
      setActiveLevel('L1');
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

  const selectedChipData = config.chips.find((c) => c.id === selectedChipId);

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] overflow-y-auto select-none font-sans text-[#1A2436] justify-between relative">
      <style>{`
        @keyframes buddyWave {
          0% { transform: rotate(-18deg); }
          50% { transform: rotate(22deg); }
          100% { transform: rotate(-18deg); }
        }
        @keyframes buddyFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .animate-buddy-wave {
          animation: buddyWave 0.8s ease-in-out infinite;
          transform-origin: 75% 85%;
        }
        .animate-buddy-float {
          animation: buddyFloat 3s ease-in-out infinite;
        }
        .animate-dot-1 {
          animation: typingBounce 1.2s infinite ease-in-out;
        }
        .animate-dot-2 {
          animation: typingBounce 1.2s infinite ease-in-out 0.2s;
        }
        .animate-dot-3 {
          animation: typingBounce 1.2s infinite ease-in-out 0.4s;
        }
      `}</style>

      {/* TOP HEADER */}
      <div className="flex items-center justify-between p-4 pb-2 shrink-0">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1A2436] hover:text-[#5D997C] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'hi' ? 'पीछे' : 'Back'}</span>
          </button>
        ) : (
          <div className="w-10" />
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 px-4 py-2 flex flex-col items-center max-w-md mx-auto w-full">
        {/* Mascot & Speech Bubble */}
        <div className="flex flex-col items-center my-3 relative">
          <div className="relative mb-3 px-5 py-3.5 bg-white text-slate-800 rounded-2xl shadow-lg border-1.5 border-[#DDD6FE] max-w-[320px] text-center min-h-[56px] flex flex-col items-center justify-center transition-all duration-300">
            {isTyping ? (
              <div className="flex items-center gap-1.5 px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-[#7C6DF8] animate-dot-1" />
                <div className="w-2 h-2 rounded-full bg-[#7C6DF8] animate-dot-2" />
                <div className="w-2 h-2 rounded-full bg-[#7C6DF8] animate-dot-3" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Sentence 1: Appears first, fading in */}
                <div
                  className={`text-sm md:text-base font-extrabold text-[#1E293B] leading-snug transition-all duration-350 ease-out ${
                    isLine1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'
                  }`}
                >
                  {line1Text}
                </div>

                {/* Sentence 2: Appears once Sentence 1 has been there for 1 second */}
                {isLine2Mounted && line2Text && (
                  <div
                    className={`text-sm md:text-base font-extrabold text-[#5D997C] leading-snug mt-1 transition-all duration-400 ease-out ${
                      isLine2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'
                    }`}
                  >
                    {line2Text}
                  </div>
                )}

                {/* Source & small disclaimer */}
                {isLine2Mounted && (
                  <div
                    className={`flex flex-col items-center mt-1 transition-opacity duration-400 ${
                      isLine2Visible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {sourceText && (
                      <div className="text-[10px] font-bold text-slate-500">
                        {sourceText}
                      </div>
                    )}
                    {smallPrintText && (
                      <div className="text-[9.5px] font-medium text-slate-400 mt-0.5 italic">
                        {smallPrintText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-b-1.5 border-r-1.5 border-[#DDD6FE] rotate-45" />
          </div>

          {/* Animated Mascot Figure */}
          <div
            className={`relative w-28 h-20 flex items-center justify-center animate-buddy-float transition-transform duration-300 ${
              activeLevel === 'L3'
                ? 'rotate-6'
                : activeLevel === 'L4' || activeLevel === 'L5'
                ? 'scale-105'
                : ''
            }`}
          >
            <div className="absolute left-2 top-2.5 w-10 h-10 z-10 animate-buddy-wave">
              <img
                src={mascotHandImg}
                alt="Buddy Waving Hand"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
            <img
              src={mascotBodyImg}
              alt="Buddy Mascot"
              className="w-full h-full object-contain z-20 pointer-events-none drop-shadow-md"
            />
          </div>
        </div>

        {/* TIME CHIPS LIST (No Emojis - Clean Pill Layout) */}
        <div className="w-full mt-3">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
            {lang === 'hi' ? 'दैनिक स्क्रीन समय चुनें:' : 'Daily Screen Time:'}
          </p>

          <div className="flex flex-col gap-2 w-full">
            {config.chips.map((chip) => {
              const isSelected = selectedChipId === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleSelectChip(chip)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-1.5 transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#5D997C] border-[#5D997C] text-white shadow-[0_4px_14px_rgba(93,153,124,0.3)] scale-[1.01]'
                      : 'bg-white border-[#E2E8F0] text-[#1E293B] hover:border-[#CBD5E1] shadow-xs'
                  }`}
                >
                  <span
                    className={`text-sm font-extrabold ${
                      isSelected ? 'text-white' : 'text-[#1E293B]'
                    }`}
                  >
                    {lang === 'hi' ? chip.labelHi : chip.label}
                  </span>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[#5D997C] stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expandable Learn More Card */}
        {showLearnMore && selectedChipData?.learnMore && (
          <div className="w-full mt-3 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden text-left">
            <button
              type="button"
              onClick={() => setIsLearnMoreExpanded(!isLearnMoreExpanded)}
              className="w-full p-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-between cursor-pointer"
            >
              <span>{isLearnMoreExpanded ? '▾ Close research context' : '▸ Learn more about the research'}</span>
            </button>
            {isLearnMoreExpanded && (
              <div className="p-3 pt-1 border-t border-slate-200 text-[11px] text-slate-600 leading-relaxed font-medium">
                <p>{selectedChipData.learnMore}</p>
                <p className="text-[9.5px] text-slate-400 mt-1 italic">
                  Patterns across many children, not a prediction for {cleanName}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTINUE BUTTON */}
      <div
        className={`p-4 pt-2 bg-[#FAF8F5] transition-all duration-400 transform max-w-md mx-auto w-full shrink-0 ${
          isContinueVisible && selectedChipId
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={handleContinuePress}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#5D997C] hover:bg-[#4E856A] text-white text-base font-black shadow-[0_4px_16px_rgba(93,153,124,0.35)] active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>{lang === 'hi' ? 'आगे बढ़ें' : 'Continue'}</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
