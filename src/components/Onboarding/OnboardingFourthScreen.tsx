import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import mascotBodyImg from '../../assets/mascot_body.png';
import mascotHandImg from '../../assets/mascot_hand.png';

export interface OnboardingScreen4Data {
  childName: string;
  ageCategory: string; // 'under_1' | 'age_1' | '2_4' | '5_7' | '8_10'
  chipId: string;
  chipLabel: string;
  handoverType: 'smooth' | 'mild' | 'tantrum' | 'meltdown' | 'give_in';
  empathyPose: 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
}

interface OnboardingFourthScreenProps {
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

export const OnboardingFourthScreen: React.FC<OnboardingFourthScreenProps> = ({
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

  // Keyboard Escape listener
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
      if (line2FadeInTimerRef.current) clearTimeout(line2FadeInTimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  // Chip selection: Sentence 1 fades in -> Waits 1 second while visible -> Sentence 2 fades in
  const handleSelectChip = (chip: HandoverChipConfig) => {
    setSelectedChipId(chip.id);
    setActivePose(chip.pose);
    setIsLearnMoreExpanded(false);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
    if (line2FadeInTimerRef.current) clearTimeout(line2FadeInTimerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    // Reset lines & hide line 2
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
      setSourceText(chip.source || '');
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

    // Settle back to calm companion posture after 2.5s
    settleTimerRef.current = setTimeout(() => {
      setActivePose('E1');
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

  const selectedChipData = config.chips.find((c) => c.id === selectedChipId);

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] overflow-y-auto select-none font-sans text-[#1A2436] justify-between relative">
      <style>{`
        @keyframes buddyWave {
          0% { transform: rotate(-14deg); }
          50% { transform: rotate(18deg); }
          100% { transform: rotate(-14deg); }
        }
        @keyframes buddyFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .animate-buddy-wave {
          animation: buddyWave 0.9s ease-in-out infinite;
          transform-origin: 75% 85%;
        }
        .animate-buddy-float {
          animation: buddyFloat 3.2s ease-in-out infinite;
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

          {/* Animated Mascot Figure (Empathy Pose) */}
          <div
            className={`relative w-28 h-20 flex items-center justify-center animate-buddy-float transition-transform duration-300 ${
              activePose === 'E3'
                ? '-rotate-4'
                : activePose === 'E4'
                ? 'scale-104'
                : activePose === 'E5'
                ? 'rotate-2'
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

        {/* HANDOVER CHIPS LIST (No Emojis - Clean Pill Layout) */}
        <div className="w-full mt-3">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
            {lang === 'hi' ? 'फोन लेते समय क्या होता है?' : 'When screen time ends:'}
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
