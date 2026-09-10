import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BuddyMascot } from '../Mascot/BuddyMascot';
import {
  Sun,
  Lock,
  FastForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Tv,
  Gamepad2,
  Palette,
} from 'lucide-react';

export const ActiveSessionScreen: React.FC = () => {
  const {
    activeChild,
    activeSession,
    endSessionEarly,
    simulationSpeed,
    setSimulationSpeed,
    isAudioMuted,
    toggleAudioMute,
  } = useApp();

  const [selectedKidApp, setSelectedKidApp] = useState<'cartoons' | 'drawing' | 'game'>('cartoons');
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);

  const remaining = activeSession.remainingSeconds;
  const total = activeSession.totalSeconds || 1;
  const progressPercent = Math.min(100, Math.round(((total - remaining) / total) * 100));
  const is80PercentOrMore = progressPercent >= 80;

  const handleParentUnlock = () => {
    endSessionEarly();
  };

  const jumpTo80 = () => {
    const targetRemaining = Math.max(10, Math.round(total * 0.2));
    activeSession.remainingSeconds = targetRemaining;
    activeSession.elapsedSeconds = total - targetRemaining;
  };

  const jumpToTimeUp = () => {
    activeSession.remainingSeconds = 1;
  };

  return (
    <div className="flex flex-col h-full bg-[#1A2436] text-white relative overflow-hidden select-none">
      {/* Top Ambient Status Bar */}
      <div className="px-4 py-2.5 bg-[#1A2436]/90 backdrop-blur-md flex items-center justify-between z-30 border-b border-[#2C3B53]">
        {/* Child Identifier */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{activeChild.avatar}</span>
          <span className="text-xs font-black tracking-wide text-[#FAF8F5]">{activeChild.name}'s Time</span>
        </div>

        {/* Ambient Subtle Time Indicator (Sun glowing gently, non-alarming) */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-500 ${
              is80PercentOrMore
                ? 'bg-[#F6D878] text-[#78350F] border border-[#FDE68A] animate-pulse shadow-xs'
                : 'bg-[#2A374F] text-[#E2E8F0] border border-[#3A4B6B]'
            }`}
            title="Subtle ambient indicator"
          >
            <Sun
              className={`w-3.5 h-3.5 ${
                is80PercentOrMore ? 'text-[#D97706] rotate-45 transition-transform' : 'text-[#F6D878]'
              }`}
            />
            <span className="text-[11px] font-mono font-medium">
              {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={toggleAudioMute}
            className="p-1.5 rounded-full bg-[#2A374F] text-[#CBD5E1] hover:text-white"
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Secret Parent Unlock Button */}
          <button
            type="button"
            onClick={handleParentUnlock}
            className="p-1.5 rounded-full bg-[#2A374F] text-[#CBD5E1] hover:text-white hover:bg-[#3A4B6B] transition-colors"
            title="Parent Override"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 80% Ambient Mascot Soft Wave Cue (Corner Overlay) */}
      {is80PercentOrMore && (
        <div className="absolute top-14 right-3 z-40 animate-slide-in-right">
          <div className="bg-[#FAF8F5] text-[#1A2436] rounded-[20px] p-2.5 shadow-xl border border-[#EAE5DE] flex items-center gap-2.5">
            <BuddyMascot mood="waving" size={44} />
            <div className="pr-1 font-bold text-[11px] leading-tight">
              <span className="text-[#1A2436]">Buddy waved</span>
              <p className="text-[9.5px] font-medium text-[#718096]">Friendly gentle cue</p>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Child Screen (Kid's App Content) */}
      <div className="flex-1 flex flex-col bg-[#141C2B] relative overflow-hidden">
        {/* Child App Category Tabs */}
        <div className="flex items-center justify-around bg-[#1A2436]/80 p-2 border-b border-[#2C3B53]">
          <button
            type="button"
            onClick={() => setSelectedKidApp('cartoons')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedKidApp === 'cartoons' ? 'bg-[#5D997C] text-white shadow-xs' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Cartoons</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedKidApp('drawing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedKidApp === 'drawing' ? 'bg-[#5D997C] text-white shadow-xs' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Creative</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedKidApp('game')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedKidApp === 'game' ? 'bg-[#5D997C] text-white shadow-xs' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Puzzles</span>
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          {selectedKidApp === 'cartoons' && (
            <div className="w-full h-full max-h-[300px] rounded-[24px] bg-gradient-to-tr from-[#3B627D] via-[#4A6D88] to-[#5C7F9B] p-6 flex flex-col items-center justify-between shadow-xl relative overflow-hidden border border-white/10">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-extrabold bg-black/25 px-3 py-1 rounded-full text-[#E0F2FE]">
                  Episode 4: The Starry Meadow
                </span>
                <span className="text-xs font-bold text-[#F6D878]">HD Kids</span>
              </div>

              <div className="flex flex-col items-center justify-center my-auto text-center">
                <p className="text-base font-black text-white mb-1">Meadow Explorers</p>
                <p className="text-xs font-medium text-[#E0F2FE]">Episode 4: The Starry Meadow</p>
              </div>

              <div className="w-full flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                  className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                >
                  {isPlayingVideo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="flex-1 mx-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="bg-[#89B6D8] h-full w-2/3 animate-pulse" />
                </div>
                <span className="text-[10px] text-[#E0F2FE] font-mono">14:20</span>
              </div>
            </div>
          )}

          {selectedKidApp === 'drawing' && (
            <div className="w-full h-full max-h-[300px] rounded-[24px] bg-[#FEF9E7] p-6 flex flex-col items-center justify-center text-[#1A2436] shadow-xl border-4 border-[#FDE68A]">
              <p className="text-base font-extrabold text-[#78350F]">Pastel Doodle Canvas</p>
              <p className="text-xs text-[#92400E] mt-1">Drawing happy trees & sunshine</p>
            </div>
          )}

          {selectedKidApp === 'game' && (
            <div className="w-full h-full max-h-[300px] rounded-[24px] bg-[#1E382B] p-6 flex flex-col items-center justify-center text-white shadow-xl border-2 border-[#5D997C]/50">
              <p className="text-base font-extrabold text-[#A7F3D0]">Animal Match Puzzle</p>
              <p className="text-xs text-[#6EE7B7] mt-1">Score: 450 Stars</p>
            </div>
          )}
        </div>
      </div>

      {/* Tester Fast-Forward & Simulation Bar */}
      <div className="bg-[#1A2436] border-t border-[#2C3B53] p-2.5 px-4 flex items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Demo Speed:</span>
          {[1, 10, 30].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setSimulationSpeed(spd)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all ${
                simulationSpeed === spd ? 'bg-[#5D997C] text-white' : 'bg-[#2A374F] text-[#94A3B8] hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={jumpTo80}
            className="px-2.5 py-1 bg-[#F6D878]/20 text-[#F6D878] hover:bg-[#F6D878]/30 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-[#F6D878]/30"
            title="Fast forward to 80% cue"
          >
            <span>Jump 80%</span>
          </button>

          <button
            type="button"
            onClick={jumpToTimeUp}
            className="px-2.5 py-1 bg-[#E05252]/20 text-[#FCA5A5] hover:bg-[#E05252]/30 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-[#E05252]/30"
            title="Fast forward to time-up warning"
          >
            <FastForward className="w-3 h-3" />
            <span>Time Up</span>
          </button>
        </div>
      </div>
    </div>
  );
};
