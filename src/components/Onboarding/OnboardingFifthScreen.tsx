import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import mascotBodyImg from '../../assets/mascot_body.png';
import mascotHandImg from '../../assets/mascot_hand.png';

export interface OnboardingScreen5Data {
  childName: string;
  ageCategory: string;
  frequencyChipId: string;
  frequencyLabel: string;
  dailyFrequency: number;
  empathyPose: 'E1' | 'E2' | 'E3' | 'E4';
}

interface OnboardingFifthScreenProps {
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

export const OnboardingFifthScreen: React.FC<OnboardingFifthScreenProps> = ({
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
  const [isLine1Visible, setIsLine1Visible] = useState<boolean>(false);
  const [isLine2Visible, setIsLine2Visible] = useState<boolean>(false);
  const [isContinueVisible, setIsContinueVisible] = useState<boolean>(false);

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
    if (!selectedChipId) {
      setIsTyping(true);
      setIsLine1Visible(false);
      setIsLine2Visible(false);

      const timer = setTimeout(() => {
        setIsTyping(false);
        setLine1Text(lang === 'hi' ? questionHi : questionEn);
        setLine2Text('');
        setIsLine1Visible(true);
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

  // Chip Selection & Sequential Speech Fade-In
  const handleSelectChip = (chip: FrequencyChipConfig) => {
    setSelectedChipId(chip.id);
    setActivePose(chip.pose);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (line2TimerRef.current) clearTimeout(line2TimerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);

    setIsLine1Visible(false);
    setIsLine2Visible(false);

    const l1 = lang === 'hi' ? chip.line1Hi : chip.line1;
    const l2 = lang === 'hi' ? chip.line2Hi : chip.line2;

    setIsTyping(true);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      setLine1Text(l1);
      setLine2Text(l2);
      setIsLine1Visible(true);

      // Sentence 2 appears once Sentence 1 has been there for 1 second
      line2TimerRef.current = setTimeout(() => {
        setIsLine2Visible(true);
        setIsContinueVisible(true);
      }, 1000);
    }, 220);

    settleTimerRef.current = setTimeout(() => {
      setActivePose('E1');
    }, 2800);
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

  // Buddy dynamic CSS transforms based on empathy pose
  const getBuddyPoseClass = () => {
    switch (activePose) {
      case 'E1':
        return 'scale-105 transition-all duration-300';
      case 'E2':
        return 'rotate-2 transition-all duration-300 animate-pulse';
      case 'E3':
        return '-rotate-3 transition-all duration-300';
      case 'E4':
        return 'scale-104 rotate-1 transition-all duration-300';
      default:
        return 'transition-all duration-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col justify-between font-sans select-none pb-8">
      {/* 1. TOP HEADER: BACK, LANGUAGE TOGGLE & DEV SKIP */}
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
          {/* Monochrome Language Pill */}
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
        {/* BUDDY MASCOT & DYNAMIC SPEECH BUBBLE */}
        <div className="flex flex-col items-center my-3 relative w-full">
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
                {/* Sentence 1 */}
                <p
                  className={`text-sm font-bold text-slate-800 leading-snug transition-all duration-400 ${
                    isLine1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                  }`}
                >
                  {line1Text}
                </p>

                {/* Sentence 2: 1s later */}
                {isLine2Visible && line2Text && (
                  <p className="text-sm font-black text-[#4338CA] leading-snug mt-1 animate-fadeIn">
                    {line2Text}
                  </p>
                )}
              </div>
            )}

            {/* Bubble Tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-[#DDD6FE]" />
          </div>

          {/* Buddy Mascot Figure */}
          <div className={`relative w-28 h-28 flex items-center justify-center ${getBuddyPoseClass()}`}>
            {/* Waving Hand */}
            <div className="absolute -top-1 right-2 z-10 animate-wave origin-bottom">
              <img src={mascotHandImg} alt="Waving Hand" className="w-8 h-8 object-contain" />
            </div>
            {/* Body */}
            <img src={mascotBodyImg} alt="Buddy Mascot" className="w-24 h-24 object-contain" />
          </div>
        </div>

        {/* 3. FREQUENCY CHIPS (Pure Typography, Zero Emojis) */}
        <div className="w-full max-w-sm mt-3">
          <p className="text-[12px] font-black text-slate-500 uppercase tracking-wider text-center mb-2.5">
            {lang === 'hi' ? 'दिन में कितनी बार फोन मिलता है?' : 'Phone handovers in a day:'}
          </p>

          <div className="flex flex-col gap-2.5 w-full">
            {FREQUENCY_CHIPS.map((chip) => {
              const isSelected = selectedChipId === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleSelectChip(chip)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border-1.5 transition-all cursor-pointer text-left ${
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
                    {lang === 'hi' ? chip.labelHi : chip.label}
                  </span>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
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

        {/* 4. CONTINUE BUTTON */}
        <div
          className={`w-full max-w-sm mt-6 transition-all duration-400 ${
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
