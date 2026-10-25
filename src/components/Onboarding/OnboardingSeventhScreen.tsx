import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import mascotBodyImg from '../../assets/mascot_body.png';
import mascotHandImg from '../../assets/mascot_hand.png';

interface OnboardingSeventhScreenProps {
  childName?: string;
  ageCategory?: string;
  dailyMinutes?: number;
  timeChipId?: string;
  dailyFrequency?: number;
  frequencyChipId?: string;
  handoverType?: string;
  hasWorryingContent?: boolean;
  onBack?: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  initialLanguage?: 'en' | 'hi';
}

type Language = 'en' | 'hi';

interface ChangePair {
  id: string;
  noteTitle: string;
  noteTitleHi: string;
  color: string;
  rotation: string;
  parentRed: string;
  parentRedHi: string;
  babyBooGreen: string;
  babyBooGreenHi: string;
}

export const OnboardingSeventhScreen: React.FC<OnboardingSeventhScreenProps> = ({
  childName = 'Leo',
  ageCategory = '2_4',
  dailyMinutes = 20,
  timeChipId = '2_4h',
  dailyFrequency = 3,
  frequencyChipId = '2_to_3',
  handoverType = 'tantrum',
  hasWorryingContent = true,
  onBack,
  onContinue,
  onSkip,
  initialLanguage = 'en',
}) => {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const cleanName = childName?.trim() || 'Leo';

  // Dynamic text based on actual answers
  const getParentScreenTimeText = () => {
    if (timeChipId === 'more_4h') return { en: 'Over 4 hours of phone time a day', hi: 'दिन में 4 घंटे से अधिक फोन' };
    if (timeChipId === '2_4h') return { en: 'About 2 hours of phone time a day', hi: 'दिन में लगभग 2 घंटे फोन का समय' };
    if (timeChipId === '1_2h') return { en: 'About 1 to 2 hours of phone time a day', hi: 'दिन में लगभग 1 से 2 घंटे फोन' };
    if (timeChipId === 'under_1h') return { en: 'Under 1 hour of phone time a day', hi: 'दिन में 1 घंटे से कम फोन' };
    return { en: 'About 2 hours of phone time a day', hi: 'दिन में लगभग 2 घंटे फोन का समय' };
  };

  const getParentFrequencyText = () => {
    if (frequencyChipId === 'once') return { en: '1 goodbye a day', hi: 'दिन में 1 अलविदा' };
    if (frequencyChipId === '4_to_5') return { en: 'About 4 to 5 goodbyes a day', hi: 'दिन में लगभग 4 से 5 अलविदा' };
    if (frequencyChipId === 'more_than_5') return { en: 'More than 5 goodbyes a day', hi: 'दिन में 5 से ज्यादा बार अलविदा' };
    return { en: 'About 3 goodbyes a day', hi: 'दिन में लगभग 3 अलविदा' };
  };

  const getParentHandoverText = () => {
    if (handoverType === 'meltdown') return { en: 'Screen time ends with heavy crying or meltdown', hi: 'स्क्रीन समय भारी रोने या ड्रामे से खत्म होता है' };
    if (handoverType === 'mild') return { en: 'Screen time ends with fussing and resistance', hi: 'स्क्रीन समय हल्की ज़िद और ना-नुकुर से खत्म होता है' };
    if (handoverType === 'give_in') return { en: 'Screen time ends with negotiations & giving in', hi: 'स्क्रीन समय बहस और झुक जाने पर खत्म होता है' };
    return { en: 'Screen time ends with crying or a tantrum', hi: 'स्क्रीन समय रोने या नखरे के साथ खत्म होता है' };
  };

  const pTime = getParentScreenTimeText();
  const pFreq = getParentFrequencyText();
  const pHandover = getParentHandoverText();

  const CHANGE_PAIRS: ChangePair[] = [
    {
      id: 'time',
      noteTitle: pTime.en,
      noteTitleHi: pTime.hi,
      color: 'bg-yellow-100 border-yellow-300 text-yellow-950',
      rotation: '-rotate-2',
      parentRed: pTime.en,
      parentRedHi: pTime.hi,
      babyBooGreen: 'A daily limit you can choose, kept for your automatic mode.',
      babyBooGreenHi: 'एक दैनिक सीमा जो आप चुनते हैं, स्वचालित मोड में सुरक्षित।',
    },
    {
      id: 'frequency',
      noteTitle: pFreq.en,
      noteTitleHi: pFreq.hi,
      color: 'bg-sky-100 border-sky-300 text-sky-950',
      rotation: 'rotate-2',
      parentRed: pFreq.en,
      parentRedHi: pFreq.hi,
      babyBooGreen: 'One-tap preset countdowns so every goodbye is calm and predictable.',
      babyBooGreenHi: 'एक-टैप टाइमर प्रीसेट ताकि हर अलविदा शांत और अनुमानित रहे।',
    },
    {
      id: 'handover',
      noteTitle: pHandover.en,
      noteTitleHi: pHandover.hi,
      color: 'bg-amber-100 border-amber-300 text-amber-950',
      rotation: '-rotate-1',
      parentRed: pHandover.en,
      parentRedHi: pHandover.hi,
      babyBooGreen: 'Natural simulated battery shutdown so the phone takes the blame, not you.',
      babyBooGreenHi: 'प्राकृतिक नकली बैटरी शटडाउन ताकि फोन को दोष मिले, आपको नहीं।',
    },
    {
      id: 'exposure',
      noteTitle: 'Unfiltered videos, commercial ads, or random autoplay',
      noteTitleHi: 'अनचाहे वीडियो, विज्ञापन या स्वचालित वीडियो',
      color: 'bg-rose-100 border-rose-300 text-rose-950',
      rotation: 'rotate-2',
      parentRed: 'Unfiltered videos, commercial ads, or random autoplay',
      parentRedHi: 'अनचाहे वीडियो, विज्ञापन या स्वचालित वीडियो',
      babyBooGreen: 'Less screen time means less exposure, keeping early years protected.',
      babyBooGreenHi: 'कम स्क्रीन समय मतलब कम जोखिम, बचपन की सुरक्षा के साथ।',
    },
  ];

  const [notesVisibleCount, setNotesVisibleCount] = useState<number>(0);
  const [hasNodded, setHasNodded] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Side-by-side row animation states: red -> line -> green
  interface RowAnimationState {
    red: boolean;
    line: boolean;
    green: boolean;
  }

  const [rowStates, setRowStates] = useState<RowAnimationState[]>([
    { red: false, line: false, green: false },
    { red: false, line: false, green: false },
    { red: false, line: false, green: false },
    { red: false, line: false, green: false },
  ]);
  const [showClosing, setShowClosing] = useState<boolean>(false);

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

  // Sequential sticky notes drop and Buddy nod sequence -> then side-by-side transformations
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Note 1 lands
    timers.push(setTimeout(() => setNotesVisibleCount(1), 200));
    // Note 2 lands
    timers.push(setTimeout(() => setNotesVisibleCount(2), 500));
    // Note 3 lands
    timers.push(setTimeout(() => setNotesVisibleCount(3), 800));
    // Note 4 lands
    timers.push(
      setTimeout(() => {
        setNotesVisibleCount(4);
        // Buddy nods after last note lands
        timers.push(
          setTimeout(() => {
            setHasNodded(true);

            // Fade in results container
            timers.push(
              setTimeout(() => {
                setShowResults(true);

                // Sequential side-by-side row animation: Red -> Dotted Line -> Green
                const updateRowState = (idx: number, key: keyof RowAnimationState, val: boolean) => {
                  setRowStates((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], [key]: val };
                    return next;
                  });
                };

                let baseTime = 150;
                const stepDelay = 220;
                const rowGap = 200;

                for (let i = 0; i < 4; i++) {
                  const rowIndex = i;
                  // Step A: Red statement appears
                  timers.push(
                    setTimeout(() => {
                      updateRowState(rowIndex, 'red', true);
                    }, baseTime)
                  );
                  baseTime += stepDelay;

                  // Step B: Dotted line draws across connecting red to green
                  timers.push(
                    setTimeout(() => {
                      updateRowState(rowIndex, 'line', true);
                    }, baseTime)
                  );
                  baseTime += stepDelay;

                  // Step C: Green statement appears
                  timers.push(
                    setTimeout(() => {
                      updateRowState(rowIndex, 'green', true);
                    }, baseTime)
                  );
                  baseTime += stepDelay + rowGap;
                }

                // Finally reveal closing quote and CTA button
                timers.push(
                  setTimeout(() => {
                    setShowClosing(true);
                  }, baseTime + 100)
                );
              }, 400)
            );
          }, 350)
        );
      }, 1100)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

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
        {/* BUDDY MASCOT WITH WRITING ANIMATION */}
        <div className="flex flex-col items-center my-2 relative w-full">
          {/* Speech Bubble */}
          <div className="relative mb-3 px-5 py-3.5 bg-white text-slate-800 rounded-2xl shadow-lg border-1.5 border-[#DDD6FE] max-w-[330px] text-center min-h-[50px] flex items-center justify-center transition-all duration-300 w-full">
            <p className="text-sm font-extrabold text-slate-800 leading-snug">
              {hasNodded
                ? (lang === 'hi'
                  ? `मैंने सब नोट कर लिया है। यहाँ बताया गया है कि BabyBoo क्या बदलता है:`
                  : `Buddy has taken notes on ${cleanName}. Here is what BabyBoo changes:`)
                : (lang === 'hi'
                  ? `बडी ${cleanName} के बारे में नोट्स लिख रहा है...`
                  : `Buddy has been taking notes on ${cleanName}...`)}
            </p>

            {/* Bubble Tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-[#DDD6FE]" />
          </div>

          {/* Buddy Mascot with Notepad & Animated Writing Pencil */}
          <div
            className={`relative w-28 h-28 flex items-center justify-center transition-all duration-300 ${
              hasNodded ? 'animate-bounce' : 'animate-float'
            }`}
          >
            {/* Notepad held by mascot */}
            <div className="absolute bottom-2 left-3 w-8 h-10 bg-amber-50 rounded-sm border border-amber-300 shadow-sm p-1 z-20 flex flex-col gap-1">
              <div className="w-full h-1.5 bg-amber-600 rounded-xs" />
              <div className="w-4/5 h-0.5 bg-amber-400 rounded-xs" />
              <div className="w-3/5 h-0.5 bg-amber-400 rounded-xs" />
            </div>

            {/* Animated Writing Pencil */}
            {!hasNodded && (
              <div className="absolute bottom-5 left-8 w-2 h-7 bg-yellow-400 border border-yellow-600 rounded-xs z-30 animate-pulse origin-bottom-left rotate-12" />
            )}

            {/* Waving/Holding Hand */}
            <div className="absolute -top-1 right-2 z-10 animate-wave origin-bottom">
              <img src={mascotHandImg} alt="Mascot Hand" className="w-8 h-8 object-contain" />
            </div>

            {/* Mascot Body */}
            <img src={mascotBodyImg} alt="Buddy Mascot" className="w-24 h-24 object-contain" />
          </div>
        </div>

        {/* 3. STICKY NOTES BOARD */}
        <div className="w-full max-w-sm mt-1">
          <p className="text-[11.5px] font-black text-slate-500 uppercase tracking-wider text-center mb-2">
            {lang === 'hi' ? 'बडी के स्टिकी नोट्स:' : 'Buddy’s Sticky Notes:'}
          </p>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            {CHANGE_PAIRS.map((item, idx) => {
              const isVisible = notesVisibleCount > idx;
              return (
                <div
                  key={item.id}
                  className={`p-3 pt-3.5 rounded-xl border shadow-sm transition-all duration-400 flex flex-col items-center justify-center text-center relative min-h-[82px] ${
                    item.color
                  } ${item.rotation} ${
                    isVisible
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
                  }`}
                >
                  {/* Sticky Pin */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 border border-white" />
                  <p className="text-xs font-black leading-snug">
                    {lang === 'hi' ? item.noteTitleHi : item.noteTitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. RESULTS SECTION: WHAT BABYBOO CHANGES */}
        {/* Side-by-side animation: Red statement appears -> dotted line appears -> green statement appears */}
        <div
          className={`w-full max-w-md mt-6 transition-all duration-500 ${
            showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-center mb-3">
            <span className="px-3.5 py-1 bg-purple-100 text-purple-900 border border-purple-200 text-xs font-black rounded-full uppercase tracking-wider shadow-xs">
              {lang === 'hi' ? 'परिवर्तन योजना (आमने-सामने)' : 'What Changes What'}
            </span>
          </div>

          {/* 4 Side-by-Side Comparison Rows */}
          <div className="flex flex-col gap-3 w-full">
            {CHANGE_PAIRS.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-2.5 pt-3 border-1.5 border-slate-200 shadow-sm relative w-full"
              >
                {/* Index badge */}
                <div className="absolute -top-2 left-3 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10.5px] font-black flex items-center justify-center shadow-xs">
                  {idx + 1}
                </div>

                <div className="flex items-center justify-between gap-1.5 w-full mt-1">
                  {/* Left: Parent Red Statement (Appears 1st) */}
                  <div
                    className={`flex-1 bg-red-50/90 border border-red-200 rounded-xl p-2.5 min-h-[86px] flex flex-col justify-center transition-all duration-300 ${
                      rowStates[idx].red
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-red-600">
                        {lang === 'hi' ? 'वर्तमान' : 'Today'}
                      </span>
                    </div>
                    <p className="text-[11.5px] font-bold text-red-900 leading-snug">
                      {lang === 'hi' ? item.parentRedHi : item.parentRed}
                    </p>
                  </div>

                  {/* Center: Dotted Connector Line (Appears 2nd) */}
                  <div
                    className={`shrink-0 w-8 flex items-center justify-center transition-all duration-300 origin-left ${
                      rowStates[idx].line
                        ? 'opacity-100 scale-x-100 translate-x-0'
                        : 'opacity-0 scale-x-0 -translate-x-1 pointer-events-none'
                    }`}
                  >
                    <svg width="32" height="18" viewBox="0 0 32 18" className="overflow-visible">
                      <line
                        x1="2"
                        y1="9"
                        x2="23"
                        y2="9"
                        stroke="#7C6DF8"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                      <polygon points="22,5 30,9 22,13" fill="#7C6DF8" />
                    </svg>
                  </div>

                  {/* Right: BabyBoo Green Statement (Appears 3rd) */}
                  <div
                    className={`flex-1 bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5 min-h-[86px] flex flex-col justify-center transition-all duration-300 ${
                      rowStates[idx].green
                        ? 'opacity-100 scale-100 translate-x-0'
                        : 'opacity-0 scale-95 translate-x-2 pointer-events-none'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-600">
                        {lang === 'hi' ? 'BabyBoo' : 'With BabyBoo'}
                      </span>
                    </div>
                    <p className="text-[11.5px] font-extrabold text-emerald-950 leading-snug">
                      {lang === 'hi' ? item.babyBooGreenHi : item.babyBooGreen}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 5. CLOSING REASSURING STATEMENT */}
          <div
            className={`mt-5 p-4 bg-[#FAF5FF] border-1.5 border-[#C4B5FD] rounded-2xl shadow-xs text-center transition-all duration-500 ${
              showClosing
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
            }`}
          >
            <span className="text-2xl font-black text-[#7C6DF8] leading-none block mb-1">“</span>
            <p className="text-sm font-black text-[#4C1D95] leading-snug">
              {lang === 'hi'
                ? 'वही दिन, नया और शांत अंत। नियंत्रण हमेशा आपके हाथ में।'
                : 'Same day, different ending. You stay in charge.'}
            </p>
          </div>

          {/* 6. PRIMARY CTA BUTTON */}
          <div
            className={`mt-4 transition-all duration-500 ${
              showClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={onContinue}
              className="w-full py-4 px-5 bg-[#5D997C] hover:bg-[#4E856A] active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-[0_4px_16px_rgba(93,153,124,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{lang === 'hi' ? 'BabyBoo शुरू करें' : 'Get Started with BabyBoo'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

