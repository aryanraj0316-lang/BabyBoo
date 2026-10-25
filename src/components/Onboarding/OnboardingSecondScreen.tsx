import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, X, Sparkles } from 'lucide-react';
import mascotBodyImg from '../../assets/mascot_body.png';
import mascotHandImg from '../../assets/mascot_hand.png';

export interface OnboardingSecondChildData {
  name: string;
  ageCategory: string; // 'under_2' | '2_3' | '4_5' | '6_7' | '8_10'
  ageLabel: string;
}

interface OnboardingSecondScreenProps {
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

export const OnboardingSecondScreen: React.FC<OnboardingSecondScreenProps> = ({
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

  // Animated elements visibility
  const [isTextBoxVisible, setIsTextBoxVisible] = useState<boolean>(true);
  const [areChipsVisible, setAreChipsVisible] = useState<boolean>(false);
  const [isContinueVisible, setIsContinueVisible] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNameRef = useRef<string>('');

  // 1. Initial Speech & Immediate Keyboard Focus
  useEffect(() => {
    setIsTyping(true);
    const speechTimer = setTimeout(() => {
      setIsTyping(false);
      setSpeechText(
        lang === 'hi'
          ? 'नमस्ते, मैं बडी हूँ। अपने बच्चे के बारे में बताइए।'
          : 'Hi I am Buddy. Tell me about your little one.'
      );
    }, 250);

    // Make the keyboard appear immediately as BabyBoo asks for a name
    inputRef.current?.focus();
    const focusTimer1 = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    const focusTimer2 = setTimeout(() => {
      inputRef.current?.focus();
    }, 200);

    return () => {
      clearTimeout(speechTimer);
      clearTimeout(focusTimer1);
      clearTimeout(focusTimer2);
    };
  }, [lang]);

  // 2. React to name input when "Go" is clicked
  const handleNameChange = (val: string) => {
    setChildName(val);
    if (areChipsVisible && val.trim().length >= 1) {
      setSpeechText(
        lang === 'hi'
          ? `नमस्ते ${val.trim()}! ${val.trim()} कितने साल का है?`
          : `Hi ${val.trim()}. How old is ${val.trim()}?`
      );
      prevNameRef.current = val.trim();
    }
  };

  const handleNameSubmit = () => {
    const trimmed = childName.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

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

    // Reveal Age Chips when Go is clicked
    if (!areChipsVisible) {
      setAreChipsVisible(true);
    }
  };

  const handleSelectAge = (ageId: string) => {
    setSelectedAge(ageId);
    if (!isContinueVisible && childName.trim().length >= 1) {
      setIsContinueVisible(true);
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

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] overflow-y-auto select-none font-sans text-[#1A2436] justify-between relative">
      {/* Inline styles for Waving & Typing animations */}
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

      {/* TOP BAR */}
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
        {/* BUDDY MASCOT & SPEECH BUBBLE */}
        <div className="flex flex-col items-center my-3 relative">
          {/* Speech Bubble */}
          <div className="relative mb-3 px-4 py-3 bg-white text-slate-800 rounded-2xl shadow-lg border-1.5 border-[#DDD6FE] max-w-[280px] text-center min-h-[48px] flex items-center justify-center transition-all duration-300">
            {isTyping ? (
              <div className="flex items-center gap-1.5 px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-[#7C6DF8] animate-dot-1" />
                <div className="w-2 h-2 rounded-full bg-[#7C6DF8] animate-dot-2" />
                <div className="w-2 h-2 rounded-full bg-[#7C6DF8] animate-dot-3" />
              </div>
            ) : (
              <span className="text-sm md:text-base font-extrabold text-[#1E293B] leading-snug">
                {speechText}
              </span>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-b-1.5 border-r-1.5 border-[#DDD6FE] rotate-45" />
          </div>

          {/* Waving Figure */}
          <div className="relative w-32 h-24 flex items-center justify-center animate-buddy-float">
            {/* Waving Hand */}
            <div className="absolute left-2 top-3 w-11 h-11 z-10 animate-buddy-wave">
              <img
                src={mascotHandImg}
                alt="Buddy Waving Hand"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
            {/* Mascot Body */}
            <img
              src={mascotBodyImg}
              alt="Buddy Mascot"
              className="w-full h-full object-contain z-20 pointer-events-none drop-shadow-md"
            />
          </div>
        </div>

        {/* FLOATING TEXT BOX: CHILD NAME (0.5s later) */}
        {/* Name stays visible so typos can be fixed! */}
        <div
          className={`w-full transition-all duration-500 transform ${
            isTextBoxVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6 pointer-events-none'
          }`}
        >
          <div className="w-full bg-white rounded-2xl p-3 px-3.5 flex items-center gap-2.5 border-1.5 border-[#7C6DF8] shadow-[0_4px_16px_rgba(124,109,248,0.12)]">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={childName}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNameSubmit();
                }
              }}
              placeholder={
                lang === 'hi'
                  ? 'आपके बच्चे का नाम क्या है?'
                  : 'What is the name of your child?'
              }
              className="flex-1 bg-transparent text-[#1A2436] text-base font-bold placeholder-[#94A3B8] focus:outline-hidden"
              maxLength={25}
            />
            {childName.trim().length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    handleNameChange('');
                    inputRef.current?.focus();
                  }}
                  className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {!areChipsVisible && (
                  <button
                    type="button"
                    onClick={handleNameSubmit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#5D997C] hover:bg-[#4E856A] text-white text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <span>{lang === 'hi' ? 'चलो' : 'Go'}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-1.5 ml-2">
            {lang === 'hi'
              ? 'नाम हमेशा दिखाई देता है ताकि स्पेलिंग सुधारी जा सके'
              : 'Name stays visible so typos can be fixed anytime'}
          </p>
        </div>

        {/* AGE CHIPS FADE IN */}
        {/* Options: under 2, 2 to 3, 4 to 5, 6 to 7, 8 to 10 */}
        <div
          className={`w-full mt-4 transition-all duration-500 transform ${
            areChipsVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">
            {lang === 'hi'
              ? `चुनिए ${childName.trim() || 'बच्चे'} की उम्र:`
              : `Select ${childName.trim() || 'child'}'s age:`}
          </p>

          <div className="flex flex-col gap-2 w-full">
            {AGE_OPTIONS.map((opt) => {
              const isSelected = selectedAge === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectAge(opt.id)}
                  className={`w-full flex items-center p-3 rounded-2xl border-1.5 transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#5D997C] border-[#5D997C] text-white shadow-[0_4px_14px_rgba(93,153,124,0.3)] scale-[1.01]'
                      : 'bg-white border-[#E2E8F0] text-[#1E293B] hover:border-[#CBD5E1] shadow-xs'
                  }`}
                >
                  <div className="flex-1">
                    <div
                      className={`text-sm font-extrabold capitalize ${
                        isSelected ? 'text-white' : 'text-[#1E293B]'
                      }`}
                    >
                      {opt.label}
                    </div>
                    <div
                      className={`text-[11px] font-medium ${
                        isSelected ? 'text-[#E6F4EA]' : 'text-slate-500'
                      }`}
                    >
                      {opt.desc}
                    </div>
                  </div>
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
      </div>

      {/* CONTINUE BUTTON */}
      <div
        className={`p-4 pt-2 bg-[#FAF8F5] transition-all duration-400 transform max-w-md mx-auto w-full shrink-0 ${
          isContinueVisible && childName.trim().length >= 1 && selectedAge
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
