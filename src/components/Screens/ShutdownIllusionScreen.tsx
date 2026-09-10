import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Wind, Moon, Lock, FastForward, CheckCircle2 } from 'lucide-react';

export const ShutdownIllusionScreen: React.FC = () => {
  const {
    activeSession,
    finishShutdown,
    endSessionEarly,
  } = useApp();

  const shutdownStyle = activeSession.config?.shutdownStyle || 'low_battery';
  const [stage, setStage] = useState<'warning' | 'dimming' | 'blackout' | 'restoring'>('warning');
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(60);

  // Illusion stage progression
  useEffect(() => {
    const t1 = setTimeout(() => {
      setStage('dimming');
    }, 4000);

    const t2 = setTimeout(() => {
      setStage('blackout');
    }, 7000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Rest countdown in blackout stage
  useEffect(() => {
    if (stage === 'blackout') {
      const interval = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStage('restoring');
            setTimeout(() => {
              finishShutdown();
            }, 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [stage, finishShutdown]);

  const handleParentUnlock = () => {
    endSessionEarly();
  };

  const handleInstantRestore = () => {
    finishShutdown();
  };

  return (
    <div
      className={`flex flex-col h-full justify-between transition-all duration-1000 select-none relative overflow-hidden ${stage === 'dimming'
          ? 'bg-black/90 filter brightness-50'
          : stage === 'blackout'
            ? 'bg-black text-slate-800'
            : stage === 'restoring'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-950 text-white'
        }`}
    >
      {/* Top Hidden Override Bar */}
      <div className="p-3 flex items-center justify-between z-30 opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-mono text-slate-500">
          Device Rest Illusion ({restSecondsRemaining}s)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstantRestore}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1"
            title="Fast forward resting period"
          >
            <FastForward className="w-3 h-3" />
            <span>Finish Rest</span>
          </button>

          <button
            type="button"
            onClick={handleParentUnlock}
            className="p-1 rounded-full text-slate-500 hover:text-slate-200"
            title="Parent Override"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Illusion Stage Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* VARIANT 1: LOW BATTERY */}
        {shutdownStyle === 'low_battery' && (
          <div>
            {stage === 'warning' && (
              <div className="w-full max-w-[270px] bg-slate-800/95 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-slate-700/80 animate-scale-up text-white">
                <div className="w-14 h-7 mx-auto mb-3 border-2 border-red-500 rounded-md p-0.5 relative flex items-center">
                  <div className="w-2.5 h-full bg-red-500 rounded-xs animate-pulse" />
                  <div className="absolute -right-1.5 top-1.5 w-1 h-3 bg-red-500 rounded-r" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Low Battery</h3>
                <p className="text-xs text-slate-300 mb-4">1% battery remaining</p>
                <div className="w-full py-2 bg-slate-700/80 rounded-xl text-xs font-bold text-sky-400">
                  Phone shutting down to preserve power
                </div>
              </div>
            )}

            {stage === 'dimming' && (
              <div className="space-y-3 animate-pulse">
                <div className="w-16 h-8 mx-auto border-2 border-red-600/80 rounded-md p-0.5 relative flex items-center">
                  <div className="w-1 h-full bg-red-600 rounded-xs" />
                  <div className="absolute -right-1.5 top-2 w-1 h-3 bg-red-600 rounded-r" />
                </div>
                <p className="text-xs font-mono text-red-400">Powering off...</p>
              </div>
            )}

            {stage === 'blackout' && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-5 border border-red-900/60 rounded p-0.5 relative flex items-center opacity-40">
                  <div className="w-1 h-full bg-red-900" />
                  <div className="absolute -right-1 top-1 w-0.5 h-2 bg-red-900" />
                </div>
                <p className="text-[10px] font-mono text-slate-800">device resting...</p>
              </div>
            )}
          </div>
        )}

        {/* VARIANT 2: COOLDOWN / GLITCH */}
        {shutdownStyle === 'cooldown' && (
          <div>
            {stage === 'warning' && (
              <div className="w-full max-w-[270px] bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-sky-500/40 animate-scale-up text-white">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center animate-spin">
                  <Wind className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Device Cooldown</h3>
                <p className="text-xs text-slate-300 mb-3">Taking a brief 60-second rest break to stay cool</p>
                <div className="w-full py-2 bg-sky-950/60 rounded-xl text-xs font-bold text-sky-300 border border-sky-800">
                  Cooling down...
                </div>
              </div>
            )}

            {stage === 'dimming' && (
              <div className="space-y-2">
                <div className="w-8 h-8 mx-auto rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center animate-ping">
                  <Wind className="w-4 h-4" />
                </div>
                <p className="text-xs font-mono text-sky-400">Taking a power break...</p>
              </div>
            )}

            {stage === 'blackout' && (
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-mono text-slate-800">cooling rest active...</p>
              </div>
            )}
          </div>
        )}

        {/* VARIANT 3: NEEDS A REST */}
        {shutdownStyle === 'needs_rest' && (
          <div>
            {stage === 'warning' && (
              <div className="w-full max-w-[270px] bg-indigo-950/80 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-indigo-500/30 animate-scale-up text-white">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center animate-pulse">
                  <Moon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Time for Phone to Rest</h3>
                <p className="text-xs text-indigo-200 mb-3">Your phone worked hard and is taking a peaceful power nap.</p>
                <div className="w-full py-2 bg-indigo-900/60 rounded-xl text-xs font-bold text-indigo-200 border border-indigo-700">
                  Power Nap Active 💤
                </div>
              </div>
            )}

            {stage === 'dimming' && (
              <div className="space-y-2">
                <Moon className="w-8 h-8 mx-auto text-indigo-400 animate-pulse" />
                <p className="text-xs font-mono text-indigo-400">Resting peacefully...</p>
              </div>
            )}

            {stage === 'blackout' && (
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-mono text-slate-800">phone is resting...</p>
              </div>
            )}
          </div>
        )}

        {/* Restoring Screen */}
        {stage === 'restoring' && (
          <div className="space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Device Rest Completed</h3>
            <p className="text-xs text-slate-300">Returning to parent debrief...</p>
          </div>
        )}
      </div>
    </div>
  );
};
