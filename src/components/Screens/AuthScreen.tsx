import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Mail, Lock, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { NatureDecorations } from '../../theme';

export const AuthScreen: React.FC = () => {
  const { navigateTo, user, setUser } = useApp();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('sarah.parent@example.com');
  const [password, setPassword] = useState('••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser((prev) => ({
      ...prev,
      email: email || prev.email,
      isParentVerified: true,
    }));
    if (!user.patternLock || user.patternLock.length === 0) {
      navigateTo('set_pattern');
    } else {
      navigateTo('parent_dashboard');
    }
  };

  const handleInstantDemo = () => {
    setUser((prev) => ({
      ...prev,
      isParentVerified: true,
    }));
    navigateTo('parent_dashboard');
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] p-6 justify-between overflow-y-auto relative">
      <NatureDecorations variant="playful" />

      {/* Top Brand Bar */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-2xl bg-[#5D997C] flex items-center justify-center text-white font-black text-sm shadow-sm shadow-[#5D997C]/25">
            BB
          </div>
          <span className="font-extrabold text-[#1A2436] tracking-tight text-xl">BabyBoo</span>
        </div>

        <h1 className="text-2xl font-black text-[#1A2436] tracking-tight mb-2">
          {isSignUp ? 'Create Parent Account' : 'Welcome Back, Parent'}
        </h1>
        <p className="text-xs text-[#718096] mb-5 leading-relaxed">
          {isSignUp
            ? 'Parent-managed gentle screen time structure with natural consequence illusions.'
            : 'Enter your credentials or use the 1-Tap Parent Demo to jump straight in.'}
        </p>

        {/* 1-Tap Quick Demo Sign-In Card */}
        <div className="mb-5 p-4.5 rounded-[24px] bg-[#FEF9E7] border border-[#FDE68A] text-[#1A2436] shadow-xs relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8E4B10] mb-1">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <span>Instant Review Mode</span>
            </div>
            <p className="text-xs text-[#78350F] font-semibold mb-3">
              Jump into parent dashboard with preloaded child profiles & stats
            </p>
            <button
              type="button"
              onClick={handleInstantDemo}
              className="px-4 py-2.5 bg-[#5D997C] hover:bg-[#4D8569] text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Instant Parent Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#1A2436] mb-1.5">Parent Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                required
                className="w-full pl-10 pr-4 py-3.5 bg-white rounded-2xl border border-[#EAE5DE] focus:border-[#5D997C] focus:ring-2 focus:ring-[#5D997C]/20 text-sm text-[#1A2436] font-medium transition-all shadow-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A2436] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#718096] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3.5 bg-white rounded-2xl border border-[#EAE5DE] focus:border-[#5D997C] focus:ring-2 focus:ring-[#5D997C]/20 text-sm text-[#1A2436] font-medium transition-all shadow-xs outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-full bg-[#5D997C] hover:bg-[#4D8569] active:scale-[0.98] text-white font-extrabold text-sm shadow-md shadow-[#5D997C]/25 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{isSignUp ? 'Continue to Pattern Lock' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-semibold text-[#718096] hover:text-[#5D997C] transition-colors"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>

      {/* COPPA Privacy Guarantee Badge */}
      <div className="mt-6 pt-4 border-t border-[#EAE5DE] relative z-10">
        <div className="flex items-start gap-2.5 p-3.5 rounded-[20px] bg-[#EBF4EF] border border-[#5D997C]/30 text-[#1A2436]">
          <ShieldCheck className="w-5 h-5 text-[#5D997C] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <p className="font-bold text-[#2D5A43] flex items-center gap-1">
              COPPA-Compliant & Kid-Safe
              <CheckCircle className="w-3 h-3 text-[#5D997C] inline" />
            </p>
            <p className="text-[#4A5568] mt-0.5">
              Zero child data collection. No camera required, no microphone tracking, 100% parent control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
