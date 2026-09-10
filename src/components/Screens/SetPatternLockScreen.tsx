import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatternLock } from '../PatternLock/PatternLock';
import { Lock, ShieldCheck, KeyRound, Check, RefreshCw } from 'lucide-react';
import { NatureDecorations } from '../../theme';

export const SetPatternLockScreen: React.FC = () => {
  const { updatePattern, setUser, navigateTo } = useApp();
  const [step, setStep] = useState<'draw' | 'confirm' | 'pin'>('draw');
  const [firstPattern, setFirstPattern] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const [pin, setPin] = useState('1234');

  const handlePatternComplete = (pattern: number[]) => {
    if (step === 'draw') {
      if (pattern.length < 3) {
        setError(true);
        return;
      }
      setFirstPattern(pattern);
      setStep('confirm');
    } else if (step === 'confirm') {
      // Check match
      const isMatch =
        pattern.length === firstPattern.length &&
        pattern.every((val, i) => val === firstPattern[i]);

      if (isMatch) {
        setStep('pin');
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
          setStep('draw');
          setFirstPattern([]);
        }, 1200);
      }
    }
  };

  const handleSavePinAndFinish = () => {
    updatePattern(firstPattern);
    setUser((prev) => ({
      ...prev,
      backupPin: pin || '1234',
    }));
    navigateTo('parent_dashboard');
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] p-6 justify-between overflow-y-auto relative">
      <NatureDecorations variant="playful" />

      {/* Top Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-2xl bg-[#5D997C] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            <Lock className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#1A2436] text-sm">Parent Security Gate</span>
        </div>

        <h1 className="text-2xl font-black text-[#1A2436] tracking-tight mb-1">
          {step === 'draw' && 'Set Parent Pattern Lock'}
          {step === 'confirm' && 'Confirm Your Pattern'}
          {step === 'pin' && 'Set Emergency Backup PIN'}
        </h1>
        <p className="text-xs text-[#718096] mb-6 leading-relaxed">
          {step === 'draw' && 'Draw a continuous pattern connecting 3 or more dots. Only you will know this.'}
          {step === 'confirm' && 'Draw the exact same pattern again to confirm.'}
          {step === 'pin' && 'Create a 4-digit recovery PIN in case you forget your pattern.'}
        </p>
      </div>

      {/* Pattern Lock Canvas or PIN Input */}
      <div className="flex flex-col items-center justify-center my-auto relative z-10">
        {step !== 'pin' ? (
          <div className="flex flex-col items-center">
            <PatternLock
              onComplete={handlePatternComplete}
              error={error}
              label={step === 'draw' ? 'Draw your pattern' : 'Redraw pattern to confirm'}
              helperText={
                error
                  ? 'Patterns did not match! Restarting...'
                  : step === 'draw'
                    ? 'Connect at least 3 dots'
                    : 'Matching first pattern...'
              }
            />

            {step === 'confirm' && (
              <button
                type="button"
                onClick={() => {
                  setStep('draw');
                  setFirstPattern([]);
                }}
                className="mt-3 text-xs font-semibold text-[#5D997C] flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Start over</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full max-w-[280px] bg-white p-6 rounded-[28px] border border-[#EAE5DE] shadow-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF4EF] text-[#5D997C] flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#1A2436] text-sm mb-1">Emergency 4-Digit PIN</h3>
            <p className="text-[11px] text-[#718096] mb-4">Quick fallback for parent overrides</p>
            <input
              type="text"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-full text-center tracking-[1em] text-2xl font-black py-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] text-[#1A2436] mb-4 focus:ring-2 focus:ring-[#5D997C]/20 focus:border-[#5D997C] outline-none"
            />
            <button
              type="button"
              onClick={handleSavePinAndFinish}
              className="w-full py-3.5 bg-[#5D997C] hover:bg-[#4D8569] text-white rounded-full font-bold text-xs shadow-md shadow-[#5D997C]/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save & Complete Setup</span>
            </button>
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="mt-4 p-3.5 rounded-[20px] bg-[#EBF4EF] border border-[#5D997C]/30 flex items-center gap-2.5 text-[#2D5A43] text-xs relative z-10">
        <ShieldCheck className="w-4 h-4 text-[#5D997C] shrink-0" />
        <span className="text-[11px] font-medium leading-tight">
          Children cannot bypass timers or dismiss warnings without this parent pattern.
        </span>
      </div>
    </div>
  );
};
