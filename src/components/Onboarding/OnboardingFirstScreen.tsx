import React, { useState, useEffect, useRef } from 'react';
import { Globe, ArrowRight, ShieldCheck, Sparkles, Check, Lock, Unlock, BatteryCharging, BatteryWarning } from 'lucide-react';
import mascotBodyImg from '../../assets/mascot_body.png';
import mascotHandImg from '../../assets/mascot_hand.png';

interface OnboardingFirstScreenProps {
  onGetStarted: () => void;
  onSkip?: () => void;
}

type Language = 'en' | 'hi';

const TRANSLATIONS = {
  en: {
    langLabel: 'English',
    welcomeTag: 'GENTLE SCREEN TIME TRANSITIONS',
    countdowns: [
      '0... Phone needs to sleep! 💤',
      '1... Night night phone! 🌙',
      '2... Ready, set! ✨',
      '3... Saying bye to games! 👋',
      '4... Almost time to rest! ⏰',
      '5... Getting ready to sleep! 🎈',
    ],
    cartoonsTitle: 'Fun Cartoons Playing',
    lowBattery: 'Low Battery',
    batteryRemaining: '1% battery remaining',
    shuttingDown: 'Phone shutting down to preserve power',
    phoneResting: 'Phone resting peacefully... 💤',
    parentUnlock: 'Parent Pattern Unlock',
    unlockedSuccess: 'Phone Unlocked! 🔓',
    homeScreen: 'Parent Home Restored',
    bottomMessage: 'Screen time ends with no one being the bad guy. BabyBoo helps your child to say goodbye to the phone gently.',
    getStartedBtn: 'Get Started',
    skip: 'Skip to setup',
  },
  hi: {
    langLabel: 'हिन्दी',
    welcomeTag: 'प्यार से स्क्रीन टाइम विदाई',
    countdowns: [
      '0... फोन के सोने का समय! 💤',
      '1... शुभ रात्रि फोन! 🌙',
      '2... तैयार हो जाओ! ✨',
      '3... खेलों को अलविदा! 👋',
      '4... अब आराम का समय! ⏰',
      '5... सोने की तैयारी! 🎈',
    ],
    cartoonsTitle: 'कार्टून चल रहा है',
    lowBattery: 'कम बैटरी',
    batteryRemaining: '1% बैटरी बची है',
    shuttingDown: 'बैटरी बचाने के लिए फोन बंद हो रहा है',
    phoneResting: 'फोन शांति से सो रहा है... 💤',
    parentUnlock: 'पैरेंट पैटर्न अनलॉक',
    unlockedSuccess: 'फोन अनलॉक हो गया! 🔓',
    homeScreen: 'पैरेंट स्क्रीन अनलॉक',
    bottomMessage: 'स्क्रीन टाइम बिना किसी के विलेन बने खत्म होता है। BabyBoo आपके बच्चे को प्यार से फोन को अलविदा कहने में मदद करता है।',
    getStartedBtn: 'शुरू करें',
    skip: 'सीधे आगे बढ़ें',
  },
};

// 3x3 pattern grid positions in percentage (0..8)
// 0: top-left, 1: top-center, 2: top-right
// 3: mid-left, 4: mid-center, 5: mid-right
// 6: bot-left, 7: bot-center, 8: bot-right
const PATTERN_DOTS = [
  { id: 0, x: 25, y: 35 },
  { id: 1, x: 50, y: 35 },
  { id: 2, x: 75, y: 35 },
  { id: 3, x: 25, y: 55 },
  { id: 4, x: 50, y: 55 },
  { id: 5, x: 75, y: 55 },
  { id: 6, x: 25, y: 75 },
  { id: 7, x: 50, y: 75 },
  { id: 8, x: 75, y: 75 },
];

// Classic Capital "A" pattern path:
// Start at Dot 6 (bot-left) -> Dot 3 (mid-left) -> Dot 1 (top-center) -> Dot 5 (mid-right) -> Dot 8 (bot-right)
const PATTERN_SEQUENCE = [6, 3, 1, 5, 8];

export const OnboardingFirstScreen: React.FC<OnboardingFirstScreenProps> = ({
  onGetStarted,
  onSkip,
}) => {
  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];

  // Demo Phone Simulation State
  // Phase 1: countdown (5..1) + kids cartoon (0s - 5s)
  // Phase 2: countdown hits 0 + battery drain simulation (5s - 9.5s)
  // Phase 3: finger appears & pattern swipe unlock (9.5s - 14s)
  // Phase 4: unlock success & loop completion (14s - 16s)
  const [cycleTime, setCycleTime] = useState<number>(0);
  const [hasCompletedLoop, setHasCompletedLoop] = useState<boolean>(false);
  const [textVisible, setTextVisible] = useState<boolean>(false);
  const [buttonVisible, setButtonVisible] = useState<boolean>(false);

  // Orbit angle for mascot revolving around the demo phone
  const [orbitAngle, setOrbitAngle] = useState<number>(0);

  // Overall loop duration in milliseconds
  const CYCLE_DURATION = 15000; // 15 seconds full loop

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) % CYCLE_DURATION;
      setCycleTime(elapsed);

      // Revolving angle advances smoothly: 1 full 360-degree orbit every 15 seconds
      const angle = ((elapsed / CYCLE_DURATION) * 2 * Math.PI) - Math.PI / 2;
      setOrbitAngle(angle);

      // Check loop completion
      if (elapsed > 13500 && !hasCompletedLoop) {
        setHasCompletedLoop(true);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [hasCompletedLoop]);

  // When loop completes, trigger staggered appearance of text and then button
  useEffect(() => {
    if (hasCompletedLoop) {
      // Step 1: Text appears
      setTextVisible(true);
      // Step 2: "Get Started" button appears right after text is visible
      const btnTimer = setTimeout(() => {
        setButtonVisible(true);
      }, 500);

      return () => clearTimeout(btnTimer);
    }
  }, [hasCompletedLoop]);

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

  // Derive simulation sub-stages from cycleTime
  // 0ms - 5000ms: Countdown 5 -> 0
  const countdownVal = cycleTime < 1000 ? 5
    : cycleTime < 2000 ? 4
    : cycleTime < 3000 ? 3
    : cycleTime < 4000 ? 2
    : cycleTime < 5000 ? 1
    : 0;

  // Battery drain percentage: 85% -> 20% -> 10% -> 1%
  const batteryPct = cycleTime < 5000 ? 85
    : cycleTime < 6200 ? 20
    : cycleTime < 7400 ? 10
    : 1;

  // Phone Screen Stage:
  // 'cartoon' (0 - 5000ms)
  // 'low_battery_dialog' (5000ms - 7500ms)
  // 'blackout' (7500ms - 9200ms)
  // 'pattern_unlock' (9200ms - 13500ms)
  // 'unlocked' (13500ms - 15000ms)
  const phoneStage = cycleTime < 5000 ? 'cartoon'
    : cycleTime < 7500 ? 'low_battery_dialog'
    : cycleTime < 9200 ? 'blackout'
    : cycleTime < 13500 ? 'pattern_unlock'
    : 'unlocked';

  // Finger & Pattern swipe progress during pattern_unlock (9200ms - 13500ms)
  // Duration: 4300ms
  const patternProgress = phoneStage === 'pattern_unlock'
    ? Math.min(1, Math.max(0, (cycleTime - 9400) / 3200))
    : phoneStage === 'unlocked' ? 1 : 0;

  // Calculate current finger (x, y) coordinates from PATTERN_SEQUENCE
  const getFingerPosition = () => {
    if (phoneStage !== 'pattern_unlock' && phoneStage !== 'unlocked') {
      return { x: 80, y: 90, opacity: 0 };
    }

    if (patternProgress <= 0) {
      const firstDot = PATTERN_DOTS[PATTERN_SEQUENCE[0]];
      return { x: firstDot.x, y: firstDot.y + 12, opacity: 0.8 };
    }

    if (patternProgress >= 1) {
      const lastDot = PATTERN_DOTS[PATTERN_SEQUENCE[PATTERN_SEQUENCE.length - 1]];
      return { x: lastDot.x, y: lastDot.y, opacity: phoneStage === 'unlocked' ? 0 : 0.8 };
    }

    // Segments count = PATTERN_SEQUENCE.length - 1 (4 segments)
    const totalSegments = PATTERN_SEQUENCE.length - 1;
    const scaled = patternProgress * totalSegments;
    const segIndex = Math.min(totalSegments - 1, Math.floor(scaled));
    const segProgress = scaled - segIndex;

    const fromDot = PATTERN_DOTS[PATTERN_SEQUENCE[segIndex]];
    const toDot = PATTERN_DOTS[PATTERN_SEQUENCE[segIndex + 1]];

    const x = fromDot.x + (toDot.x - fromDot.x) * segProgress;
    const y = fromDot.y + (toDot.y - fromDot.y) * segProgress;

    return { x, y, opacity: 1 };
  };

  const fingerPos = getFingerPosition();

  // Determine which dots in the sequence are activated
  const getActivatedDotsCount = () => {
    if (phoneStage === 'unlocked') return PATTERN_SEQUENCE.length;
    if (phoneStage !== 'pattern_unlock') return 0;
    const totalSegments = PATTERN_SEQUENCE.length - 1;
    const activeSegment = Math.floor(patternProgress * totalSegments);
    return Math.min(PATTERN_SEQUENCE.length, activeSegment + 1);
  };

  const activatedDotsCount = getActivatedDotsCount();

  // Elliptical Orbit for the Mascot revolving around the demo phone:
  // Center is at (0, 0), rx = 108px, ry = 142px
  const orbitRx = 105;
  const orbitRy = 140;
  const mascotX = Math.cos(orbitAngle) * orbitRx;
  const mascotY = Math.sin(orbitAngle) * orbitRy;
  
  // Mascot in front if mascotY > 0, behind if mascotY <= 0
  const isMascotInFront = mascotY >= 20;
  const mascotScale = 0.94 + 0.12 * ((mascotY + orbitRy) / (2 * orbitRy)); // scale 0.94 - 1.06
  const mascotTilt = Math.cos(orbitAngle) * -8; // slight tilt based on horizontal velocity

  // Speech bubble positioning relative to mascot
  // When mascot is on right, bubble on top-left of mascot; when on left, bubble on top-right
  const bubbleAlignRight = mascotX < 0;

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] font-sans select-none overflow-hidden relative justify-between p-3.5 sm:p-5">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: MINI LANGUAGE SELECTION BOX (TOP RIGHT, BLACK & WHITE) */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between shrink-0 z-30 pt-1">
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="px-2.5 py-1 text-[11px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-full transition-all cursor-pointer"
          >
            Skip
          </button>
        ) : (
          <div className="w-10" />
        )}

        {/* Small Black & White English / Hindi Selection Box */}
        <div className="flex items-center gap-1.5 bg-white border border-black rounded-full px-2 py-0.5 shadow-xs">
          <Globe className="w-3 h-3 text-black stroke-[2.4]" />
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-2 py-0.5 text-[10.5px] font-black rounded-full transition-all cursor-pointer ${
              lang === 'en'
                ? 'bg-black text-white'
                : 'text-black hover:text-slate-600'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('hi')}
            className={`px-2 py-0.5 text-[10.5px] font-black rounded-full transition-all cursor-pointer ${
              lang === 'hi'
                ? 'bg-black text-white'
                : 'text-black hover:text-slate-600'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER STAGE: DEMO PHONE WITH REVOLVING MASCOT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex items-center justify-center relative my-1 min-h-[340px] max-h-[480px]">
        {/* Soft Cosmic Ambient Glow Behind Phone */}
        <div className="absolute w-56 h-72 rounded-full bg-gradient-to-tr from-emerald-100/50 via-teal-50/40 to-amber-50/50 blur-2xl pointer-events-none -z-10" />

        {/* Orbit Path Guideline (Subtle dotted ellipse) */}
        <svg
          className="absolute pointer-events-none opacity-25"
          width="260"
          height="330"
          viewBox="-130 -165 260 330"
        >
          <ellipse
            cx="0"
            cy="0"
            rx={orbitRx}
            ry={orbitRy}
            fill="none"
            stroke="#5D997C"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        </svg>

        {/* ------------------------------------------------------------- */}
        {/* THE DEMO MOBILE PHONE (In the Center) */}
        {/* ------------------------------------------------------------- */}
        <div
          style={{ width: '162px', height: '292px' }}
          className="relative bg-slate-900 rounded-[32px] p-[5px] shadow-[0_18px_40px_-10px_rgba(26,36,54,0.35)] border-2 border-slate-700/80 shrink-0 z-20 flex flex-col select-none"
        >
          {/* Side Hardware Buttons */}
          <div className="absolute -left-[5px] top-14 w-[3px] h-6 bg-slate-700 rounded-l" />
          <div className="absolute -left-[5px] top-22 w-[3px] h-6 bg-slate-700 rounded-l" />
          <div className="absolute -right-[5px] top-16 w-[3px] h-9 bg-slate-700 rounded-r" />

          {/* Phone Inner Screen Frame */}
          <div className="w-full h-full bg-black rounded-[26px] overflow-hidden relative flex flex-col">
            {/* Top Dynamic Island / Speaker Pill */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-full z-40 flex items-center justify-end px-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800/80" />
            </div>

            {/* Top Status Bar on Demo Phone */}
            <div className="h-6 px-2.5 pt-1.5 flex items-center justify-between z-30 text-[8.5px] font-bold text-white shrink-0">
              <span className="tracking-tight">10:30</span>
              <div className="flex items-center gap-1">
                {/* Battery Icon with dynamic percentage & color */}
                <span className={`text-[8px] font-mono font-bold ${
                  batteryPct <= 1 ? 'text-red-400 animate-pulse' : batteryPct <= 20 ? 'text-amber-400' : 'text-emerald-300'
                }`}>
                  {batteryPct}%
                </span>
                <div className={`w-4 h-2 border rounded-xs p-[1px] flex items-center relative ${
                  batteryPct <= 1 ? 'border-red-500' : batteryPct <= 20 ? 'border-amber-400' : 'border-white/80'
                }`}>
                  <div
                    style={{ width: `${Math.max(10, batteryPct)}%` }}
                    className={`h-full rounded-xs transition-all duration-300 ${
                      batteryPct <= 1 ? 'bg-red-500 animate-pulse' : batteryPct <= 20 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <div className={`absolute -right-[2.5px] top-[1.5px] w-[1.5px] h-1 rounded-r-xs ${
                    batteryPct <= 1 ? 'bg-red-500' : 'bg-white/80'
                  }`} />
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PHONE SCREEN CONTENT ACCORDING TO SIMULATION STAGE */}
            {/* ------------------------------------------------------------- */}
            <div className="flex-1 relative overflow-hidden flex flex-col justify-between">
              {/* STAGE A: CARTOONS / MEDIA PLAYING (Countdown 5 to 0) */}
              <div
                className={`absolute inset-0 transition-opacity duration-700 flex flex-col justify-between p-2 ${
                  phoneStage === 'cartoon' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
                }`}
                style={{
                  background: 'linear-gradient(180deg, #60A5FA 0%, #93C5FD 45%, #86EFAC 100%)',
                }}
              >
                {/* Sun & Clouds Animation */}
                <div className="flex items-center justify-between pt-1">
                  <div className="w-8 h-8 rounded-full bg-amber-300 flex items-center justify-center text-sm shadow-md animate-spin-slow">
                    ☀️
                  </div>
                  <div className="text-[12px] animate-bounce-gentle">
                    ☁️
                  </div>
                </div>

                {/* Main Cartoon Scene */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-2xl mb-1 transform animate-pulse">
                    🦁
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-white/90 text-[8px] font-black text-slate-800 shadow-xs tracking-tight">
                    {t.cartoonsTitle}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px]">
                    <span className="animate-bounce">🎵</span>
                    <span className="animate-pulse">✨</span>
                    <span className="animate-bounce">⭐</span>
                  </div>
                </div>

                {/* Bottom Video Progress Bar */}
                <div className="space-y-1 pb-1">
                  <div className="w-full h-1 bg-white/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(cycleTime / 5000) * 100}%` }}
                      className="h-full bg-red-500 rounded-full transition-all"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[7px] text-white/90 font-bold px-0.5">
                    <span>0:14</span>
                    <span>BabyBoo Fun</span>
                  </div>
                </div>
              </div>

              {/* STAGE B: LOW BATTERY DRAIN SIMULATION MODAL (When countdown hits 0) */}
              <div
                className={`absolute inset-0 transition-all duration-500 flex flex-col items-center justify-center p-3 text-center ${
                  phoneStage === 'low_battery_dialog'
                    ? 'opacity-100 z-20 bg-black/85 backdrop-blur-xs scale-100'
                    : 'opacity-0 pointer-events-none scale-95'
                }`}
              >
                <div className="w-full bg-slate-900/95 border border-red-500/60 rounded-2xl p-2.5 shadow-2xl animate-scale-up">
                  {/* Flashing Red Battery */}
                  <div className="w-10 h-5 mx-auto mb-1.5 border-2 border-red-500 rounded-sm p-[1.5px] relative flex items-center">
                    <div className="w-1.5 h-full bg-red-500 rounded-2xs animate-pulse" />
                    <div className="absolute -right-1.5 top-1 w-1 h-2 bg-red-500 rounded-r-xs" />
                  </div>

                  <h4 className="text-[10px] font-black text-white leading-tight">
                    {t.lowBattery}
                  </h4>
                  <p className="text-[8px] text-red-300 font-semibold mb-2">
                    {t.batteryRemaining}
                  </p>

                  <div className="w-full py-1 px-1.5 bg-red-950/70 border border-red-800/80 rounded-lg text-[7.5px] font-bold text-red-200 leading-tight">
                    {t.shuttingDown}
                  </div>
                </div>
              </div>

              {/* STAGE C: BLACKOUT / POWER NAP SCREEN */}
              <div
                className={`absolute inset-0 transition-opacity duration-700 bg-black flex flex-col items-center justify-center text-center p-3 ${
                  phoneStage === 'blackout' ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="w-7 h-7 rounded-full border-2 border-slate-700 border-t-red-500 animate-spin mb-2" />
                <p className="text-[8.5px] font-mono text-slate-400 font-bold">
                  {t.phoneResting}
                </p>
              </div>

              {/* STAGE D: PATTERN UNLOCK SCREEN (Finger appears & swipes pattern) */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 bg-slate-950 flex flex-col justify-between p-2.5 text-center ${
                  phoneStage === 'pattern_unlock' || phoneStage === 'unlocked'
                    ? 'opacity-100 z-20'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                {/* Header */}
                <div className="pt-2">
                  <div className="flex items-center justify-center gap-1 text-[8.5px] font-black text-emerald-400">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{t.parentUnlock}</span>
                  </div>
                  <p className="text-[7.5px] text-slate-400 mt-0.5">
                    Draw pattern to unlock
                  </p>
                </div>

                {/* 3x3 Dots Pattern Lock Canvas */}
                <div className="relative w-full aspect-square my-auto max-w-[130px] mx-auto">
                  {/* SVG Connecting Lines between activated dots */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {PATTERN_SEQUENCE.slice(0, activatedDotsCount).map((dotId, idx) => {
                      if (idx === 0) return null;
                      const prevDot = PATTERN_DOTS[PATTERN_SEQUENCE[idx - 1]];
                      const curDot = PATTERN_DOTS[dotId];
                      return (
                        <line
                          key={`line-${idx}`}
                          x1={`${prevDot.x}%`}
                          y1={`${prevDot.y}%`}
                          x2={`${curDot.x}%`}
                          y2={`${curDot.y}%`}
                          stroke={phoneStage === 'unlocked' ? '#10B981' : '#34D399'}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                        />
                      );
                    })}

                    {/* Active dragging line from last activated dot to finger pointer */}
                    {phoneStage === 'pattern_unlock' && activatedDotsCount > 0 && activatedDotsCount < PATTERN_SEQUENCE.length && (
                      (() => {
                        const lastDot = PATTERN_DOTS[PATTERN_SEQUENCE[activatedDotsCount - 1]];
                        return (
                          <line
                            x1={`${lastDot.x}%`}
                            y1={`${lastDot.y}%`}
                            x2={`${fingerPos.x}%`}
                            y2={`${fingerPos.y}%`}
                            stroke="#34D399"
                            strokeWidth="2"
                            strokeDasharray="2 3"
                            strokeLinecap="round"
                            className="opacity-70"
                          />
                        );
                      })()
                    )}
                  </svg>

                  {/* 9 Pattern Dots */}
                  {PATTERN_DOTS.map((dot) => {
                    const isDotActive = PATTERN_SEQUENCE.slice(0, activatedDotsCount).includes(dot.id);
                    return (
                      <div
                        key={dot.id}
                        style={{
                          left: `${dot.x}%`,
                          top: `${dot.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute z-20 flex items-center justify-center"
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isDotActive
                              ? 'bg-emerald-400 scale-125 shadow-[0_0_10px_rgba(52,211,153,0.9)] ring-2 ring-emerald-300'
                              : 'bg-slate-700/80 border border-slate-600'
                          }`}
                        >
                          <div className={`w-1 h-1 rounded-full ${isDotActive ? 'bg-white' : 'bg-slate-400'}`} />
                        </div>
                      </div>
                    );
                  })}

                  {/* --------------------------------------------------------- */}
                  {/* ANIMATED FINGER SWIPING PATTERN */}
                  {/* --------------------------------------------------------- */}
                  <div
                    style={{
                      left: `${fingerPos.x}%`,
                      top: `${fingerPos.y}%`,
                      opacity: fingerPos.opacity,
                      transform: 'translate(-20%, -15%)',
                      transition: 'opacity 0.25s ease-out',
                    }}
                    className="absolute z-30 pointer-events-none"
                  >
                    {/* Glowing Touch Contact Ripple */}
                    <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-emerald-400/30 animate-ping" />
                    <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#34D399]" />

                    {/* Hand / Index Finger Graphic (Stylized SVG for ultra-clean rendering) */}
                    <svg
                      width="38"
                      height="38"
                      viewBox="0 0 48 48"
                      fill="none"
                      className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform -rotate-12"
                    >
                      {/* Realistic Hand Silhouette with pointing index finger */}
                      <path
                        d="M12 28 C12 20, 16 12, 17 8 C17.8 4.8, 21.5 5, 22 8.5 C22.8 14, 22.5 19, 23 20 C24 18, 27 18, 28 20 C29 19, 32 19, 33 21 C34 20, 37 21, 37 24 C37 32, 33 39, 26 41 C19 43, 12 37, 12 28 Z"
                        fill="#F8D7BE"
                        stroke="#D4A373"
                        strokeWidth="1.5"
                      />
                      {/* Fingernail accent */}
                      <path
                        d="M17.5 8.5 C17.8 7, 20.2 7, 20.6 8.5 C20.8 9.5, 17.3 9.5, 17.5 8.5 Z"
                        fill="#FFF0E6"
                      />
                    </svg>
                  </div>
                </div>

                {/* Bottom Unlock Status */}
                <div className="pb-2">
                  {phoneStage === 'unlocked' ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[8.5px] font-black border border-emerald-500/40 animate-scale-up">
                      <Unlock className="w-2.5 h-2.5" />
                      <span>{t.unlockedSuccess}</span>
                    </div>
                  ) : (
                    <div className="text-[7.5px] font-mono text-slate-400">
                      Swiping pattern...
                    </div>
                  )}
                </div>
              </div>

              {/* STAGE E: FULLY UNLOCKED HOME SCREEN BLOOM */}
              <div
                className={`absolute inset-0 transition-all duration-700 bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-950 p-2.5 flex flex-col justify-between ${
                  phoneStage === 'unlocked' ? 'opacity-100 z-30 scale-100' : 'opacity-0 pointer-events-none scale-105'
                }`}
              >
                <div className="pt-2 text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-sm shadow-lg mb-1 animate-bounce-gentle">
                    ✓
                  </div>
                  <h4 className="text-[9.5px] font-black text-white">
                    {t.unlockedSuccess}
                  </h4>
                  <p className="text-[7px] text-emerald-300 font-semibold">
                    {t.homeScreen}
                  </p>
                </div>

                {/* Mini App Grid Mockup */}
                <div className="grid grid-cols-3 gap-2 px-1">
                  {[
                    { icon: '📞', bg: 'bg-green-500' },
                    { icon: '💬', bg: 'bg-blue-500' },
                    { icon: '📷', bg: 'bg-purple-500' },
                    { icon: '🎵', bg: 'bg-pink-500' },
                    { icon: '⚙️', bg: 'bg-slate-600' },
                    { icon: '🌟', bg: 'bg-amber-500' },
                  ].map((app, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-lg ${app.bg} text-white flex items-center justify-center text-[10px] shadow-sm`}>
                        {app.icon}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pb-1">
                  <span className="text-[7px] text-slate-400">
                    Looping demo...
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Home Indicator Bar on Demo Phone */}
            <div className="h-4 flex items-center justify-center shrink-0 z-30">
              <div className="w-12 h-1 bg-white/40 rounded-full" />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* THE REVOLVING MASCOT WITH SPEECH BUBBLE (Orbiting Phone) */}
        {/* ------------------------------------------------------------- */}
        <div
          style={{
            transform: `translate(${mascotX}px, ${mascotY}px) scale(${mascotScale}) rotate(${mascotTilt}deg)`,
            zIndex: isMascotInFront ? 35 : 15,
            transition: 'transform 0.05s linear',
          }}
          className="absolute pointer-events-none flex flex-col items-center"
        >
          {/* Conversation Speech Bubble (Counting down 5 to 0) */}
          <div
            style={{
              maxWidth: '160px',
              minWidth: '110px',
            }}
            className={`relative mb-1 px-2.5 py-1.5 rounded-2xl shadow-xl border text-center transition-all duration-300 ${
              countdownVal === 0
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-amber-200/50'
                : 'bg-white border-purple-200 text-slate-800 shadow-purple-200/40'
            }`}
          >
            {/* Bubble Tail */}
            <div
              className={`absolute -bottom-1.5 w-3 h-3 rotate-45 border-r border-b ${
                bubbleAlignRight
                  ? 'left-4 bg-white border-purple-200'
                  : 'right-4 bg-white border-purple-200'
              } ${countdownVal === 0 ? 'bg-amber-50 border-amber-300' : ''}`}
            />

            {/* Speech Text Content */}
            <div className="flex items-center justify-center gap-1 font-black text-[11px] leading-tight">
              <span className={`text-[13px] ${countdownVal === 0 ? 'text-amber-600' : 'text-[#5D997C]'}`}>
                {countdownVal}
              </span>
              <span className="truncate">
                {t.countdowns[countdownVal]}
              </span>
            </div>
          </div>

          {/* Buddy Mascot Body with Waving Arm */}
          <div className="relative w-16 h-12 flex items-center justify-center filter drop-shadow-md">
            {/* Waving Arm */}
            <div
              style={{
                position: 'absolute',
                width: 26,
                height: 25,
                left: 2,
                top: 10,
                transformOrigin: '72% 85%',
                transform: 'rotate(-10deg)',
              }}
              className="z-10 animate-mascot-wave"
            >
              <img
                src={mascotHandImg}
                alt="Buddy Hand"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Body */}
            <img
              src={mascotBodyImg}
              alt="Buddy Mascot"
              className="relative z-20 w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM SECTION: TEXT + BIG GET STARTED BUTTON */}
      {/* "As soon as this particular thing completes one loop, a text should appear */}
      {/* just at the bottom of the screen... And a big 'Get Started' button should */}
      {/* appear at the bottom as soon as this text is completely visible." */}
      {/* ========================================================================= */}
      <div className="shrink-0 z-30 pt-1 pb-1 space-y-2">
        {/* The Reassuring Bottom Message (Appears as soon as loop 1 completes) */}
        <div
          className={`transition-all duration-700 ease-out text-center px-2 ${
            textVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          <p className="text-[13px] sm:text-[14px] font-extrabold text-[#1A2436] leading-snug tracking-tight max-w-md mx-auto">
            {t.bottomMessage}
          </p>
        </div>

        {/* Big "Get Started" Button (Appears as soon as text is completely visible) */}
        <div
          className={`transition-all duration-500 ease-out px-1 ${
            buttonVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={onGetStarted}
            className="w-full py-4 px-6 rounded-full bg-[#5D997C] hover:bg-[#4D8569] active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-lg shadow-[#5D997C]/35 transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>{t.getStartedBtn}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.8] transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Subtle Pre-loop Skip option if parent is in a hurry */}
        {!buttonVisible && (
          <div className="flex items-center justify-center pt-1">
            <button
              type="button"
              onClick={onGetStarted}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors py-1 px-3"
            >
              {t.skip} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFirstScreen;
