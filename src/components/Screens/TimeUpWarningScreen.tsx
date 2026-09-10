import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BuddyMascot } from '../Mascot/BuddyMascot';
import { HeartHandshake, Lock, FastForward, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { NatureDecorations } from '../../theme';

export const TimeUpWarningScreen: React.FC = () => {
  const {
    activeChild,
    activeSession,
    childPutPhoneDown,
    gracePeriodElapsed,
    endSessionEarly,
    isAudioMuted,
    toggleAudioMute,
  } = useApp();

  const graceRemaining = activeSession.graceRemainingSeconds;
  const totalGrace = activeSession.config?.gracePeriodSeconds || 60;
  const graceProgress = Math.max(0, Math.min(100, (graceRemaining / totalGrace) * 100));
  const lastSecondRef = useRef<number>(graceRemaining);

  // Play cute mascot countdown audio on every second of the countdown
  useEffect(() => {
    if (graceRemaining !== lastSecondRef.current) {
      lastSecondRef.current = graceRemaining;
      soundEngine.playMascotCountdownTick(graceRemaining);
    }
  }, [graceRemaining]);

  // Initial greeting yawn/chime on entry
  useEffect(() => {
    soundEngine.playMascotYawn();
  }, []);

  // Mascot dynamic speech & mood based on countdown progression
  const getMascotSpeech = () => {
    if (graceRemaining > 15) {
      return `Buddy is getting sleepy... Let's put the phone to bed! 💤`;
    }
    if (graceRemaining > 10) {
      return `Wrap up time! Only ${graceRemaining} seconds left!`;
    }
    if (graceRemaining > 5) {
      return `Counting with you: ${graceRemaining}...`;
    }
    if (graceRemaining > 3) {
      return `${graceRemaining}... Ready to put phone down?`;
    }
    if (graceRemaining === 3) {
      return `3... Almost there!`;
    }
    if (graceRemaining === 2) {
      return `2... Ready, set!`;
    }
    if (graceRemaining === 1) {
      return `1... Night night phone!`;
    }
    return `Time for phone to rest! 💤`;
  };

  const getMascotMood = () => {
    if (graceRemaining <= 3) return 'sleepy';
    if (graceRemaining <= 10) return 'waving';
    return 'encouraging';
  };

  const handleParentUnlock = () => {
    endSessionEarly();
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] p-5 sm:p-6 justify-between relative overflow-hidden select-none">
      <NatureDecorations variant="playful" />

      {/* Floating Gentle Twilight Elements */}
      <div className="absolute top-12 left-6 w-3 h-3 rounded-full bg-[#F6D878] animate-ping opacity-40 pointer-events-none" />
      <div className="absolute top-28 right-8 w-4 h-4 rounded-full bg-[#C4B5FD] animate-bounce-gentle opacity-40 pointer-events-none" />
      <div className="absolute bottom-28 left-8 w-3 h-3 rounded-full bg-[#89B6D8] opacity-30 pointer-events-none" />

      {/* Top Bar with Child Info & Parent Controls */}
      <div className="flex items-center justify-between pt-1 z-10 relative">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xs text-[#1A2436] text-xs font-black shadow-xs border border-[#EAE5DE]">
          <span className="text-base">{activeChild.avatar}</span>
          <span>{activeChild.name}'s Bedtime Countdown</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mute/Unmute audio toggle */}
          <button
            type="button"
            onClick={toggleAudioMute}
            className="p-2 rounded-full bg-white text-[#4A5568] hover:text-[#1A2436] shadow-xs border border-[#EAE5DE] transition-all active:scale-95"
            title={isAudioMuted ? 'Unmute countdown audio' : 'Mute countdown audio'}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Fast-forward grace period for testing */}
          <button
            type="button"
            onClick={gracePeriodElapsed}
            className="px-2.5 py-1.5 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#8E4B10] text-[10.5px] font-bold flex items-center gap-1 border border-[#FDE68A] transition-colors active:scale-95"
            title="Simulate grace timeout"
          >
            <FastForward className="w-3 h-3" />
            <span>Skip</span>
          </button>

          <button
            type="button"
            onClick={handleParentUnlock}
            className="p-2 rounded-full bg-white text-[#718096] hover:text-[#1A2436] shadow-xs border border-[#EAE5DE] active:scale-95"
            title="Parent Override"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Mascot actively counting down */}
      <div className="flex flex-col items-center text-center my-auto py-1 z-10 relative">
        {/* Dynamic Buddy Mascot with Speech Bubble */}
        <div className="relative mb-2 transform scale-105 sm:scale-115 transition-transform">
          <BuddyMascot
            mood={getMascotMood()}
            size={165}
            speechText={getMascotSpeech()}
            waveHand={graceRemaining <= 10}
            lookAround={true}
          />

          {/* Big Floating Number Badge when countdown <= 10 */}
          {graceRemaining <= 10 && graceRemaining > 0 && (
            <div className="absolute -top-3 -right-2 w-12 h-12 rounded-full bg-gradient-to-tr from-[#F6D878] to-[#FBBF9C] text-[#78350F] font-black text-2xl flex items-center justify-center shadow-lg shadow-[#F6D878]/50 animate-bounce-gentle border-2 border-white ring-2 ring-[#FDE68A]">
              {graceRemaining}
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#1A2436] mt-3 mb-1 tracking-tight">
          Buddy is Counting Down!
        </h1>

        <p className="text-xs sm:text-sm font-bold text-[#718096] max-w-[280px] leading-snug">
          Great job playing today! Let's help Buddy put the phone to bed.
        </p>

        {/* Gentle Circular Countdown Dial */}
        <div className="mt-4 flex flex-col items-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#EAE5DE"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#5D997C"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - graceProgress / 100)}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300"
              />
            </svg>

            {/* Inner Clock / Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1A2436]">
              <span className="text-2xl font-black font-mono leading-none tracking-tight text-[#1A2436]">
                {graceRemaining}s
              </span>
              <span className="text-[9.5px] font-extrabold text-[#718096] uppercase mt-0.5">
                wrap up
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 bg-white px-3.5 py-1 rounded-full border border-[#EAE5DE] shadow-xs">
            <Sparkles className="w-3 h-3 text-[#5D997C] fill-[#5D997C]" />
            <span className="text-[10.5px] font-bold text-[#2D5A43]">
              Put phone down to earn reward!
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Voluntary Put-Down Button (Child Compliance CTA) */}
      <div className="space-y-2.5 z-10 relative">
        <button
          type="button"
          onClick={childPutPhoneDown}
          className="w-full py-4 rounded-full bg-[#5D997C] hover:bg-[#4D8569] active:scale-[0.98] text-white font-black text-base sm:text-lg shadow-lg shadow-[#5D997C]/25 flex items-center justify-center gap-2.5 transition-all border border-white/30"
        >
          <HeartHandshake className="w-5 h-5" />
          <span>I'm Putting the Phone Down!</span>
        </button>

        <p className="text-[11px] text-center font-bold text-[#718096]">
          Protects {activeChild.name}'s {activeChild.streakDays || 5}-day screen streak
        </p>
      </div>
    </div>
  );
};
