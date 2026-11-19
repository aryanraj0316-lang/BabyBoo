import React, { useState, useEffect, useRef } from 'react';
import { useRelease } from './website/useRelease';
import './website/reference-theme.css';

/* ───────────────────── Icon Components (inline SVG) ───────────────────── */

const StarIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
);

const ShieldIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
);

const ClockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const BatteryIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="13" x2="23" y2="11"/><line x1="7" y1="10" x2="7" y2="14"/><line x1="7" y1="12" x2="5" y2="10"/><line x1="7" y1="12" x2="9" y2="10"/></svg>
);

const LockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

const PhoneIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
);

const DownloadIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

const HeartIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
);

const EyeOffIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

const WifiOffIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
);

const CheckCircleIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const ChevronDownIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

const MenuIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);

const XIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const PlayIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);

/* ───────────────────── Floating Particles ───────────────────── */

const FloatingParticles: React.FC = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 6 + 6,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
            background: `radial-gradient(circle, rgba(167,139,250,0.6), rgba(139,92,246,0.2))`,
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

/* ───────────────────── Animated Counter ───────────────────── */

const AnimatedCounter: React.FC<{ end: number; suffix?: string; label: string }> = ({ end, suffix = '', label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setCount(end); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const duration = 2000;
        const step = end / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current));
          }
        }, 16);
      }
    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black text-white mb-2">
        {count}{suffix}
      </div>
      <div className="text-sm text-violet-300/80 font-medium">{label}</div>
    </div>
  );
};

/* ───────────────────── FAQ Accordion ───────────────────── */

const FAQItem: React.FC<{ question: string; answer: string; isOpen: boolean; onClick: () => void }> = ({ question, answer, isOpen, onClick }) => (
  <div
    className="border border-white/[0.06] rounded-2xl overflow-hidden transition-all duration-300"
    style={{ background: isOpen ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)' }}
  >
    <button
      onClick={onClick}
      aria-expanded={isOpen}
      className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer group"
    >
      <span className="text-white/90 font-semibold text-base pr-4 group-hover:text-violet-300 transition-colors">{question}</span>
      <ChevronDownIcon className={`w-5 h-5 text-violet-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    <div
      className="overflow-hidden transition-all duration-400"
      style={{ maxHeight: isOpen ? '1000px' : '0', opacity: isOpen ? 1 : 0 }}
    >
      <div className="px-6 pb-5 text-white/60 text-sm leading-relaxed">{answer}</div>
    </div>
  </div>
);


/* ───────────────────── Step Card (How It Works) ───────────────────── */

const StepCard: React.FC<{ step: number; icon: React.ReactNode; title: string; description: string; color: string }> = ({ step, icon, title, description, color }) => (
  <div className="relative group site-step">
    <div
      className="relative rounded-3xl p-8 border border-white/[0.06] backdrop-blur-sm transition-all duration-500 group-hover:border-white/[0.12] group-hover:translate-y-[-4px]"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="site-step-number">
        {String(step).padStart(2, '0')}<span aria-hidden="true" />
      </div>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${color}15` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className="text-white font-bold text-lg mb-3">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);


/* ───────────────────── Feature Card ───────────────────── */

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; gradient: string }> = ({ icon, title, description, gradient }) => (
  <div className="group relative">
    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" style={{ background: gradient }} />
    <div className="relative rounded-3xl p-7 border border-white/[0.06] backdrop-blur-sm transition-all duration-500 group-hover:border-white/[0.12] group-hover:translate-y-[-2px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(139,92,246,0.1)' }}>
        {icon}
      </div>
      <h3 className="text-white font-bold text-base mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);


/* ───────────────────── Battery Simulation Demo ───────────────────── */

const BatterySimDemo: React.FC = () => {
  const [phase, setPhase] = useState(0); // 0=idle, 1=draining, 2=warning, 3=black, 4=wake
  const [batteryLevel, setBatteryLevel] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetDemo = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase(0);
    setBatteryLevel(100);
  };

  const startDemo = () => {
    resetDemo();
    setPhase(1);
    let level = 100;
    timerRef.current = setInterval(() => {
      level -= 2;
      setBatteryLevel(level);
      if (level <= 8) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase(2); // warning
        setTimeout(() => {
          setBatteryLevel(0);
          setPhase(3); // blackout
          setTimeout(() => {
            setPhase(4); // wake flash
            setTimeout(() => {
              setPhase(3); // back to black
              setTimeout(resetDemo, 2000);
            }, 1500);
          }, 2500);
        }, 2000);
      }
    }, 60);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const bgColor = phase === 3 ? '#000' : phase === 4 ? '#0a0a0a' : phase === 2 ? '#0f0a1e' : '#1a1130';
  const screenOpacity = phase === 3 ? 0.02 : phase === 4 ? 0.9 : 1;

  return (
    <div className="relative mx-auto" style={{ maxWidth: 280 }}>
      {/* Phone frame */}
      <div className="relative rounded-[40px] border-[3px] border-white/10 overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)]" style={{ background: '#0c0812', aspectRatio: '9/19.5' }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 rounded-b-2xl z-20" style={{ background: '#0c0812' }} />
        
        {/* Screen */}
        <div
          className="absolute inset-[3px] rounded-[37px] overflow-hidden flex flex-col items-center justify-center transition-all duration-700"
          style={{ background: bgColor, opacity: screenOpacity }}
        >
          {phase === 0 && (
            <div className="text-center animate-fade-in p-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
                <PlayIcon className="w-8 h-8 text-violet-400 ml-1" />
              </div>
              <p className="text-white/60 text-sm font-medium mb-6">See how BabyBoo works</p>
              <button
                onClick={startDemo}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                Play Demo
              </button>
            </div>
          )}

          {phase === 1 && (
            <div className="text-center animate-fade-in p-6">
              <div className="relative w-20 h-32 mx-auto mb-4 border-2 border-white/20 rounded-lg overflow-hidden">
                <div className="absolute top-0 left-0 right-0 transition-all duration-100" style={{
                  height: `${batteryLevel}%`,
                  background: batteryLevel > 20 ? 'linear-gradient(180deg, #22c55e, #16a34a)' : 'linear-gradient(180deg, #ef4444, #dc2626)',
                  transformOrigin: 'bottom',
                  position: 'absolute',
                  bottom: 0,
                  top: 'auto'
                }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-xl drop-shadow-lg">{batteryLevel}%</span>
                </div>
              </div>
              <p className="text-white/40 text-xs">Screen time draining…</p>
            </div>
          )}

          {phase === 2 && (
            <div className="text-center animate-fade-in p-6">
              <div className="w-20 h-20 mx-auto mb-3 animate-pulse">
                <BatteryIcon className="w-full h-full text-red-500" />
              </div>
              <p className="text-red-400 font-bold text-lg mb-1">Battery Critically Low</p>
              <p className="text-white/30 text-xs">Device shutting down…</p>
            </div>
          )}

          {phase === 3 && (
            <div className="absolute inset-0 bg-black" />
          )}

          {phase === 4 && (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-2">
                <BatteryIcon className="w-full h-full text-red-500/80" />
              </div>
              <p className="text-red-400/60 text-xs">0%</p>
            </div>
          )}
        </div>
      </div>

      {/* Phase labels */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: 'rgba(167,139,250,0.8)' }}>
          {phase === 0 && '⭐ Ready to demonstrate'}
          {phase === 1 && '⏱️ Timer counting down…'}
          {phase === 2 && '🔋 Low battery warning'}
          {phase === 3 && '📱 Phone appears dead'}
          {phase === 4 && '⚡ Power button pressed — wake flash'}
        </div>
      </div>
    </div>
  );
};

/* ───────────────────── Installation & Permissions Simulator (Both Cases) ───────────────────── */

type DemoInstallChannel = 'playstore' | 'sideload';

const InstallCasesDemo: React.FC = () => {
  const [channel, setChannel] = useState<DemoInstallChannel>('sideload');
  const [step, setStep] = useState(1);
  const [toggleOn, setToggleOn] = useState(false);

  const switchChannel = (c: DemoInstallChannel) => {
    setChannel(c);
    setStep(1);
    setToggleOn(false);
  };

  const handleToggle = () => {
    setToggleOn(true);
    setTimeout(() => {
      setStep((s) => s + 1);
    }, 700);
  };

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Channel Switcher Tabs */}
      <div className="flex p-1 mb-4 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <button
          onClick={() => switchChannel('playstore')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            channel === 'playstore'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <span>🛍️</span> Google Play
        </button>
        <button
          onClick={() => switchChannel('sideload')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            channel === 'sideload'
              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <span>🌐</span> Website APK
        </button>
      </div>

      {/* Phone frame */}
      <div
        className="relative rounded-[40px] border-[3px] border-white/10 overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)] flex flex-col justify-between"
        style={{ background: '#0c0812', aspectRatio: '9/19', minHeight: 490 }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 rounded-b-2xl z-20 flex items-center justify-center" style={{ background: '#0c0812' }}>
          <div className="w-3 h-3 rounded-full bg-white/10" />
        </div>

        {/* Screen Content */}
        <div className="absolute inset-[3px] rounded-[37px] overflow-hidden flex flex-col justify-between p-4 pt-8" style={{ background: '#0b1120' }}>
          {/* Header bar */}
          <div className="flex items-center justify-between text-[10px] text-white/50 mb-2 px-1">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>

          {/* CHANNEL A: PLAY STORE */}
          {channel === 'playstore' && (
            <div className="flex-1 flex flex-col justify-center">
              {step === 1 && (
                <div className="text-center animate-fade-in py-2">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-2xl shadow-lg">
                    🧸
                  </div>
                  <h4 className="text-white font-bold text-sm">BabyBoo Child Lock</h4>
                  <p className="text-emerald-400 text-[11px] font-medium mb-3">Verified by Play Protect</p>
                  <div className="flex justify-center gap-4 text-[10px] text-white/40 mb-4 border-y border-white/10 py-2">
                    <div><span className="font-bold text-white">4.9★</span> (1.2k)</div>
                    <div><span className="font-bold text-white">42 MB</span></div>
                    <div><span className="font-bold text-white">10K+</span></div>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Install (1-Tap)
                  </button>
                  <p className="text-[9px] text-white/30 mt-2">Zero restricted settings hurdle</p>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white rounded-2xl p-4 text-slate-800 text-left animate-fade-in shadow-xl">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-base mb-2">
                    🛡️
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 mb-1">BabyBoo uses Accessibility</h5>
                  <p className="text-[10px] text-slate-500 leading-tight mb-3">
                    Draws a pure black overlay above the status bar so the phone looks completely dead. Zero screen recording, zero tracking.
                  </p>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-2 rounded-lg bg-indigo-600 text-white font-bold text-[11px] shadow mb-1.5 cursor-pointer"
                  >
                    Agree & Continue
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full py-1 rounded-lg text-slate-400 text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="bg-slate-800/80 rounded-2xl p-3 border border-white/10 text-left animate-fade-in">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 mb-2 font-bold">Android Settings</div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 mb-3">
                    <div>
                      <div className="text-white text-xs font-semibold">BabyBoo Blackout</div>
                      <div className="text-slate-400 text-[9px]">Tap to turn switch ON</div>
                    </div>
                    <button
                      onClick={handleToggle}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        toggleOn ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                          toggleOn ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-400/80 text-center animate-pulse">
                    {toggleOn ? '✓ Permission granted!' : '👉 Tap toggle switch above'}
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="text-center animate-fade-in py-4">
                  <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/30">
                    ✓
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">Play Store Verified</h4>
                  <p className="text-white/50 text-[11px] mb-4">
                    Zero restricted setting prompts. Completely clean 1-tap activation.
                  </p>
                  <button
                    onClick={() => switchChannel('playstore')}
                    className="py-1.5 px-4 rounded-full bg-white/10 text-white text-[11px] font-semibold hover:bg-white/20 cursor-pointer"
                  >
                    Replay Flow
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CHANNEL B: DIRECT WEBSITE APK */}
          {channel === 'sideload' && (
            <div className="flex-1 flex flex-col justify-center">
              {step === 1 && (
                <div className="animate-fade-in text-center">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-left mb-4">
                    <div className="flex items-center gap-2 font-bold text-xs mb-1">
                      <span>⚠️</span> Chrome Browser Alert
                    </div>
                    <p className="text-[10px] text-amber-300/80 leading-tight">
                      "File might be harmful. Do you want to download BabyBoo.apk anyway?"
                    </p>
                    <p className="text-[9px] text-amber-400/60 mt-1">
                      (Android shows this for ANY direct browser APK download)
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow cursor-pointer"
                  >
                    Download Anyway → Open
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="bg-slate-900 rounded-2xl p-4 border border-violet-500/30 text-left animate-fade-in shadow-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🛡️</span>
                    <h5 className="font-bold text-xs text-white">Step 1: Unlock Setup</h5>
                  </div>
                  <p className="text-[10px] text-violet-200/80 leading-relaxed mb-3">
                    Because this app was downloaded from our site, Android flags it with "Restricted setting".
                    <br /><br />
                    1. Tap "Open App Info" below<br />
                    2. Tap <strong>⋮ (three dots)</strong> in top-right<br />
                    3. Tap <strong>"Allow restricted settings"</strong>
                  </p>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-violet-500/30 cursor-pointer"
                  >
                    Open App Info (Step 1)
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="bg-slate-800/90 rounded-2xl p-3 border border-white/10 text-left animate-fade-in relative">
                  {/* Mock Android App Info header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center text-[10px]">🧸</div>
                      <span className="text-white text-xs font-semibold">App info: BabyBoo</span>
                    </div>
                    {/* Pulsing 3-dots highlight */}
                    <div className="relative">
                      <div className="absolute -inset-1.5 rounded-full bg-violet-400 animate-ping opacity-75" />
                      <div className="relative px-2 py-0.5 rounded bg-violet-600 text-white text-xs font-bold shadow-md">
                        ⋮
                      </div>
                    </div>
                  </div>

                  {/* Android 3-dot dropdown popup */}
                  <div className="rounded-xl bg-slate-900 p-2.5 border border-amber-500/40 shadow-xl mb-3">
                    <div className="text-[9px] text-slate-400 py-0.5">Uninstall</div>
                    <button
                      onClick={() => setStep(4)}
                      className="w-full text-left py-1.5 px-2 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/50 flex items-center justify-between cursor-pointer animate-pulse hover:bg-amber-500/30"
                    >
                      <span>Allow restricted settings</span>
                      <span>👈 Tap!</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 text-center">
                    Enter phone PIN, then press Back.
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="bg-slate-800/80 rounded-2xl p-3 border border-white/10 text-left animate-fade-in">
                  <div className="text-[9px] uppercase tracking-wider text-emerald-400 mb-1 font-bold">
                    ✓ Returned to BabyBoo Auto-Guide
                  </div>
                  <div className="text-[10px] text-white/70 mb-3">
                    Settings are now unlocked! Switch ON BabyBoo:
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 mb-3">
                    <div>
                      <div className="text-white text-xs font-semibold">BabyBoo Blackout</div>
                      <div className="text-emerald-400 text-[9px]">Unlocked & ready</div>
                    </div>
                    <button
                      onClick={handleToggle}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                        toggleOn ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                          toggleOn ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-400/80 text-center animate-pulse">
                    {toggleOn ? '✓ Permission granted!' : '👉 Tap switch to finish'}
                  </p>
                </div>
              )}

              {step === 5 && (
                <div className="text-center animate-fade-in py-4">
                  <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl border border-emerald-500/30">
                    ✓
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">Direct APK Unlocked!</h4>
                  <p className="text-white/50 text-[11px] mb-4">
                    BabyBoo automatically chained back from App Info to complete setup without confusion.
                  </p>
                  <button
                    onClick={() => switchChannel('sideload')}
                    className="py-1.5 px-4 rounded-full bg-white/10 text-white text-[11px] font-semibold hover:bg-white/20 cursor-pointer"
                  >
                    Replay Flow
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step indicator dots */}
          <div className="flex justify-center items-center gap-1.5 pt-2 border-t border-white/10">
            {channel === 'playstore' && [1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  step === s ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
            {channel === 'sideload' && [1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  step === s ? 'w-5 bg-violet-400' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="mt-3 text-center">
        <p className="text-[11px] text-white/50">
          {channel === 'playstore'
            ? '🛍️ Google Play: 1-tap download, zero security warnings.'
            : '🌐 Website APK: Built-in 2-step guide unlocks Android 13+ restrictions cleanly.'}
        </p>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════════════ */
/*                          MAIN LANDING PAGE                             */
/* ═══════════════════════════════════════════════════════════════════════ */

export const LandingPage: React.FC = () => {
  const release = useRelease();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [demoTab, setDemoTab] = useState<'blackout' | 'permissions'>('blackout');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      
      // Track active section
      const sections = ['hero', 'how-it-works', 'features', 'demo', 'privacy', 'download', 'faq'];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 200) {
          setActiveSection(id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'features', label: 'Features' },
    { id: 'demo', label: 'Demo' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'download', label: 'Download' },
    { id: 'faq', label: 'FAQ' },
  ];

  const faqs = [
    {
      q: 'Is BabyBoo safe for my child?',
      a: 'Absolutely. BabyBoo is an offline-first, zero-telemetry app. It collects no personal data, contains no ads, no tracking SDKs, and no network connections. Everything stays on your device. It\'s designed with COPPA compliance in mind.'
    },
    {
      q: 'Why does BabyBoo need Accessibility permission?',
      a: 'BabyBoo uses the Accessibility Service solely to detect when a child switches apps — so it can re-assert the blackout lock. It does NOT read typed text, passwords, messages, or screen content. A full disclosure is shown before you enable it.'
    },
    {
      q: 'What if my child presses the power button?',
      a: 'BabyBoo handles this perfectly. When the power button is pressed, the screen displays a realistic 0% battery warning for 1.5 seconds (with a brief brightness flash and haptic feedback), then returns to pitch black. Your child believes the phone is dead. You, the parent, know the digitizer is awake and can unlock with the secret "A" gesture.'
    },
    {
      q: 'How do I unlock the phone?',
      a: 'Draw a capital letter "A" on the pitch-black screen. BabyBoo recognizes the gesture and cleanly unlocks the device, restoring the normal home screen. Only you know the secret unlock pattern.'
    },
    {
      q: 'Does BabyBoo work without internet?',
      a: 'Yes! BabyBoo is 100% offline. It doesn\'t need WiFi or mobile data to function. All settings, timers, and preferences are stored locally on your device.'
    },
    {
      q: 'Why does Android show "Restricted setting" when I install from your website?',
      a: 'Android 13+ adds extra security for apps installed outside Google Play. BabyBoo guides you through it in 3 taps: open App Info → tap ⋮ menu → "Allow restricted settings." Our built-in pre-framer walks you through every step.'
    },
    {
      q: 'Can my toddler accidentally bypass the lock?',
      a: 'No. The screen appears completely dead — pitch black at the lowest possible brightness. Random taps and swipes are ignored. Only the precise capital "A" gesture (which requires specific stroke direction and a horizontal crossbar) can unlock the device.'
    },
  ];

  return (
    <div className="bb-site min-h-screen text-white overflow-x-hidden">

      {/* ────────────── NAVBAR ────────────── */}
      <nav aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0614]/80 backdrop-blur-xl border-b border-white/[0.05] shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => scrollTo('hero')} className="site-brand flex items-center gap-3 cursor-pointer group" aria-label="BabyBoo home">
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-violet-300 to-purple-400 bg-clip-text text-transparent">BabyBoo</span>
          </button>

          {/* Desktop nav */}
          <div className="site-nav-links hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeSection === link.id
                    ? 'text-violet-300 bg-violet-500/10'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('download')}
              className="ml-4 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all cursor-pointer hover:scale-105"
            >
              Download APK
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenuOpen} className="lg:hidden p-2 cursor-pointer">
            {mobileMenuOpen ? <XIcon className="w-6 h-6 text-white" /> : <MenuIcon className="w-6 h-6 text-white" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0614]/95 backdrop-blur-xl border-t border-white/[0.05] animate-fade-in">
            <div className="px-6 py-6 flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="px-4 py-3 rounded-xl text-left text-white/70 hover:text-white hover:bg-white/5 transition-all font-medium cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => scrollTo('download')}
                className="mt-2 px-5 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-center cursor-pointer"
              >
                Download APK
              </button>
            </div>
          </div>
        )}
      </nav>


      {/* ────────────── HERO ────────────── */}
      <section id="hero" className="site-hero">
        <div className="site-hero-ribbon" aria-hidden="true" />
        <div className="site-hero-grid">
          <div className="site-hero-copy">
            <h1>End screen time<br /><span>without<br />tantrums.</span></h1>
            <p>BabyBoo gently simulates a dead phone — your toddler thinks the battery died, while you stay in full control with a secret unlock gesture.</p>
            <div className="site-hero-actions">
              <button onClick={() => scrollTo('download')} className="site-primary">Download Free</button>
              <button onClick={() => scrollTo('demo')} className="site-secondary"><PlayIcon className="w-5 h-5" />Watch Demo</button>
            </div>
            <div className="site-trust" aria-label="App benefits"><span>Safe &amp; Private</span><span>Works Offline</span><span>Lightweight</span></div>
          </div>
          <div className="site-hero-figure">
            <div className="site-buddy-shadow" aria-hidden="true" />
            <picture className="site-buddy-artwork">
              <source media="(prefers-reduced-motion: reduce)" srcSet="/buddy-seated-wave.webp" />
              <img src="/buddy-idle-loop.webp" width="640" height="636" alt="Buddy, BabyBoo’s lavender plush mascot, sitting and waving" fetchPriority="high"
                onError={event => { const image = event.currentTarget; if (!image.src.endsWith('/buddy-seated-wave.webp')) image.src = '/buddy-seated-wave.webp'; }} />
            </picture>
          </div>
        </div>
      </section>

      {/* ────────────── STATS BAR ────────────── */}
      <section className="site-stats relative py-16 border-y border-white/[0.04]" style={{ background: 'rgba(139,92,246,0.03)' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedCounter end={0} suffix="" label="Data Collected" />
          <AnimatedCounter end={100} suffix="%" label="Offline" />
          <AnimatedCounter end={0} suffix="" label="Ads Shown" />
          <AnimatedCounter end={3} suffix="s" label="Setup Time" />
        </div>
      </section>


      {/* ────────────── HOW IT WORKS ────────────── */}
      <section id="how-it-works" className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-violet-500/20" style={{ background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}>
              HOW IT WORKS
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Three steps to <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">peaceful</span> screen time
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              No complicated setup. No subscriptions. Just a simple, elegant solution that works.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              icon={<ClockIcon className="w-7 h-7" />}
              title="Set a Timer"
              description="Choose how long your child can use the phone. BabyBoo’s friendly mascot counts down with gentle visual cues."
              color="#a78bfa"
            />
            <StepCard
              step={2}
              icon={<PhoneIcon className="w-7 h-7" />}
              title="Phone ‘Dies’ Naturally"
              description="When time’s up, the screen transitions through a realistic battery-dead shutdown sequence."
              color="#f59e0b"
            />
            <StepCard
              step={3}
              icon={<LockIcon className="w-7 h-7" />}
              title="Secret Unlock"
              description="Draw a capital ‘A’ on the pitch-black screen to unlock. Only you know the gesture."
              color="#22c55e"
            />
          </div>
        </div>
      </section>


      {/* ────────────── FEATURES ────────────── */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)' }} />
        
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-violet-500/20" style={{ background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}>
              FEATURES
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Designed for <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">real parents</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Every detail is crafted to end screen time gently, without disrupting the peace.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BatteryIcon className="w-6 h-6 text-red-400" />}
              title="Realistic Battery Drain"
              description="Smooth 4% → 3% → 2% → 1% → 0% countdown with authentic battery UI. Indistinguishable from a real dying phone."
              gradient="linear-gradient(135deg, rgba(239,68,68,0.1), transparent)"
            />
            <FeatureCard
              icon={<LockIcon className="w-6 h-6 text-violet-400" />}
              title="Invisible Pattern Lock"
              description="Draw a capital 'A' on the black screen to unlock. Precise gesture recognition ignores random taps and swipes."
              gradient="linear-gradient(135deg, rgba(139,92,246,0.1), transparent)"
            />
            <FeatureCard
              icon={<PhoneIcon className="w-6 h-6 text-amber-400" />}
              title="Power Button Intelligence"
              description="Pressing the power button shows a 1.5-second dead battery flash with haptic feedback, then returns to black. Convinces even curious toddlers."
              gradient="linear-gradient(135deg, rgba(245,158,11,0.1), transparent)"
            />
            <FeatureCard
              icon={<ShieldIcon className="w-6 h-6 text-emerald-400" />}
              title="Call Screening"
              description="Screen incoming calls during lockout. Important calls get through; everything else is silenced. All processed locally, never recorded."
              gradient="linear-gradient(135deg, rgba(34,197,94,0.1), transparent)"
            />
            <FeatureCard
              icon={<EyeOffIcon className="w-6 h-6 text-sky-400" />}
              title="Zero Data Collection"
              description="No analytics, no ads, no tracking SDKs, no network connections. BabyBoo is an offline-first, zero-telemetry application."
              gradient="linear-gradient(135deg, rgba(56,189,248,0.1), transparent)"
            />
            <FeatureCard
              icon={<HeartIcon className="w-6 h-6 text-pink-400" />}
              title="Friendly Mascot"
              description="A warm, lovable purple bear mascot makes the countdown feel like a gentle bedtime story — not a punishment."
              gradient="linear-gradient(135deg, rgba(244,114,182,0.1), transparent)"
            />
          </div>
        </div>
      </section>


      {/* ────────────── INTERACTIVE DEMO ────────────── */}
      <section id="demo" className="relative py-24 md:py-32">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)' }} />

        <div className="max-w-6xl mx-auto px-6">
          {/* Main Demo Tab Switcher */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 rounded-full border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <button
                onClick={() => setDemoTab('blackout')}
                className={`py-2 px-6 rounded-full text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  demoTab === 'blackout'
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <span>🔋</span> Blackout Illusion Demo
              </button>
              <button
                onClick={() => setDemoTab('permissions')}
                className={`py-2 px-6 rounded-full text-xs md:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  demoTab === 'permissions'
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <span>📲</span> Setup Simulator (Both Cases)
              </button>
            </div>
          </div>

          {demoTab === 'blackout' ? (
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-violet-500/20" style={{ background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}>
                  FEATURE SIMULATION
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
                  See the dead-phone illusion <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">in action</span>
                </h2>
                <p className="text-white/40 text-base leading-relaxed mb-8">
                  Click "Play Demo" to watch BabyBoo's natural shutdown sequence — from battery drain to the realistic 0% alert, blackout screen, and the momentary power-button wake cue.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: <ClockIcon className="w-5 h-5" />, text: 'Timer counts down with battery drain animation' },
                    { icon: <BatteryIcon className="w-5 h-5" />, text: 'Critical battery warning at low percentage' },
                    { icon: <PhoneIcon className="w-5 h-5" />, text: 'Screen goes pitch black — looks completely dead' },
                    { icon: <StarIcon className="w-5 h-5" />, text: 'Power button shows brief 0% flash, then black again' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-white/50 text-sm">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.1)' }}>
                        <span className="text-violet-400">{item.icon}</span>
                      </div>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              <BatterySimDemo />
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-emerald-500/20" style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80' }}>
                  TRANSPARENCY & PERMISSIONS
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
                  Frictionless setup for <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">both install methods</span>
                </h2>
                <p className="text-white/40 text-base leading-relaxed mb-8">
                  Try the interactive phone on the right to test both installation experiences: Google Play Store (instant 1-tap activation) versus Website APK (built-in automated 2-step unlock).
                </p>

                <div className="space-y-4">
                  {[
                    {
                      channel: '🛍️ Google Play Store',
                      desc: 'Zero warning prompts. Google Play Protect auto-verifies BabyBoo, so setup is a single tap.',
                      badge: 'Instant'
                    },
                    {
                      channel: '🌐 Website APK (Direct Download)',
                      desc: 'Android 13+ marks browser downloads with "Restricted setting". BabyBoo guides parents to App Info ⋮ → "Allow restricted settings", then auto-resumes to finish.',
                      badge: 'Built-in Helper'
                    },
                    {
                      channel: '🔒 Complete User Privacy',
                      desc: 'Zero screen reading, zero analytics, zero data stored off-device. Pure local overlay.',
                      badge: '100% Offline'
                    },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-semibold text-sm">{item.channel}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-violet-300">{item.badge}</span>
                      </div>
                      <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <InstallCasesDemo />
            </div>
          )}
        </div>
      </section>


      {/* ────────────── PRIVACY ────────────── */}
      <section id="privacy" className="relative py-24 md:py-32">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)' }} />

        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-emerald-500/20" style={{ background: 'rgba(34,197,94,0.08)', color: '#4ade80' }}>
              PRIVACY & SAFETY
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Your family's privacy is <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">sacred</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              BabyBoo is built on a radical privacy principle: we don't want your data.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: <EyeOffIcon className="w-6 h-6 text-emerald-400" />, title: 'No Data Collection', desc: 'Zero personal info, zero device identifiers, zero usage tracking. Nothing leaves your device.' },
              { icon: <WifiOffIcon className="w-6 h-6 text-emerald-400" />, title: '100% Offline', desc: 'No network connections, no background data syncing, no analytics servers. Pure local processing.' },
              { icon: <ShieldIcon className="w-6 h-6 text-emerald-400" />, title: 'COPPA Compliant', desc: 'Designed with Children\'s Online Privacy Protection Act compliance. No ads, no tracking, no external links.' },
              { icon: <LockIcon className="w-6 h-6 text-emerald-400" />, title: 'Encrypted Storage', desc: 'All local settings and PIN codes stored in Android\'s encrypted SharedPreferences. Your data stays yours.' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl p-6 border border-emerald-500/10 transition-all hover:border-emerald-500/20" style={{ background: 'rgba(34,197,94,0.03)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}>
                  {item.icon}
                </div>
                <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href="/privacy"
              className="inline-flex items-center gap-2 text-emerald-400/70 hover:text-emerald-400 text-sm font-medium transition-colors"
            >
              Read Full Privacy Policy →
            </a>
          </div>
        </div>
      </section>


      {/* ────────────── DOWNLOAD ────────────── */}
      <section id="download" className="relative py-24 md:py-32">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)' }} />
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08), transparent 70%)' }} />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-violet-500/20" style={{ background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}>
              GET BABYBOO
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Download <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">BabyBoo</span> today
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Free. No ads. No subscriptions. Choose your preferred installation method.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Play Store Card */}
            <div className="rounded-3xl p-8 border border-white/[0.06] relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 opacity-10 blur-[60px]" style={{ background: '#22c55e' }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(34,197,94,0.1)' }}>
                  <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.707l2.386 1.381c.56.325.56 1.139 0 1.464l-2.386 1.38-2.535-2.535 2.535-2.535zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"/>
                  </svg>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                  RECOMMENDED
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Google Play Store</h3>
                <p className="text-white/40 text-sm mb-6 leading-relaxed">
                  Automatic updates, verified by Google, no extra setup needed. The simplest way to install.
                </p>
                <div className="space-y-2 mb-6">
                  {['Auto-updates', 'No permission workarounds', 'Google Play Protect verified'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/50 text-xs">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-400/60" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="text-center p-4 rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-white/30 text-xs mb-1">🚀 Coming Soon</p>
                  <p className="text-white/20 text-[10px]">Currently in Google Play review</p>
                </div>
              </div>
            </div>

            {/* Direct Download Card */}
            <div className="rounded-3xl p-8 border border-violet-500/20 relative overflow-hidden" style={{ background: 'rgba(139,92,246,0.05)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 opacity-15 blur-[60px]" style={{ background: '#8b5cf6' }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <DownloadIcon className="w-7 h-7 text-violet-400" />
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                  {release.available ? 'AVAILABLE NOW' : 'COMING SOON'}
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Direct Download</h3>
                <p className="text-white/40 text-sm mb-6 leading-relaxed">
                  Download the APK directly from our website. BabyBoo will guide you through the simple setup.
                </p>
                <div className="space-y-2 mb-6">
                  {['Same app, same security', 'Built-in setup guide', release.available ? `v${release.version} (Latest)` : 'APK release coming soon'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/50 text-xs">
                      <CheckCircleIcon className="w-4 h-4 text-violet-400/60" />
                      {item}
                    </div>
                  ))}
                </div>
                <a
                  href={release.available ? '/download' : undefined}
                  aria-disabled={!release.available}
                  tabIndex={release.available ? 0 : -1}
                  onClick={e => { if(!release.available) e.preventDefault(); }}
                  className="block w-full text-center px-6 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <DownloadIcon className="w-5 h-5" />
                    {release.available ? `Download APK (${(release.size! / 1048576).toFixed(1)} MB)` : 'APK coming soon'}
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Installation Guide for Direct Download */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Installing from Direct Download</h3>
              <p className="text-white/40 text-sm">Android 13+ shows extra security prompts for apps installed outside Play Store. Here's how to handle them:</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'Download & Open the APK',
                  desc: 'Tap the download button above. When it finishes, tap the notification or open the file from Downloads.',
                  color: '#a78bfa'
                },
                {
                  step: '2',
                  title: 'Allow Chrome to install',
                  desc: 'Android will ask "Allow Chrome to install apps?" → Tap "Allow." This is a standard Android security prompt for any APK download.',
                  color: '#f59e0b'
                },
                {
                  step: '3',
                  title: 'Enable Permissions',
                  desc: 'BabyBoo will guide you through enabling "Display over other apps." If you see "Restricted setting," BabyBoo\'s built-in helper will take you directly to App Info → ⋮ → "Allow restricted settings" in one tap.',
                  color: '#22c55e'
                },
                {
                  step: '4',
                  title: 'You\'re all set!',
                  desc: 'Set a timer, hand the phone to your toddler, and enjoy the peace. BabyBoo handles everything from here.',
                  color: '#ec4899'
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black" style={{ background: item.color, color: '#0f0a1e' }}>
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-1">{item.title}</h4>
                    <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-2xl border border-amber-500/10 text-center" style={{ background: 'rgba(245,158,11,0.04)' }}>
              <p className="text-amber-400/70 text-xs font-medium">
                💡 <strong>Pro tip:</strong> If installed from Google Play, you skip steps 2 & 3 entirely — permissions are granted automatically.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ────────────── FAQ ────────────── */}
      <section id="faq" className="relative py-24 md:py-32">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)' }} />

        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 border border-violet-500/20" style={{ background: 'rgba(139,92,246,0.08)', color: '#a78bfa' }}>
              FAQ
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Frequently asked <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">questions</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={faqOpen === i}
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>


      {/* ────────────── CTA BANNER ────────────── */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12), transparent 70%)' }} />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <img src="/mascot.png" alt="BabyBoo" className="w-32 h-32 mx-auto mb-8 drop-shadow-[0_10px_40px_rgba(139,92,246,0.4)] animate-bounce-gentle" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Ready for <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">tantrum-free</span> screen time?
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto mb-10">
            Join thousands of parents who've found peace. Download BabyBoo — it's free, private, and works like magic.
          </p>
          <button
            onClick={() => scrollTo('download')}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            Download BabyBoo Free
          </button>
        </div>
      </section>


      {/* ────────────── FOOTER ────────────── */}
      <footer className="border-t border-white/[0.05] py-16" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/mascot.png" alt="BabyBoo" className="w-10 h-10 rounded-xl" />
                <span className="text-lg font-black bg-gradient-to-r from-violet-300 to-purple-400 bg-clip-text text-transparent">BabyBoo</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed">
                Gentle screen time management for toddlers. No data collection. No ads. Just peace.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Product</h4>
              <div className="space-y-3">
                {['How It Works', 'Features', 'Demo', 'Download'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollTo(item.toLowerCase().replace(/ /g, '-'))}
                    className="block text-white/30 hover:text-white/60 text-sm transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Legal</h4>
              <div className="space-y-3">
                <a href="/privacy" className="block text-white/30 hover:text-white/60 text-sm transition-colors">Privacy Policy</a>
                <a href="/website-privacy" className="block text-white/30 hover:text-white/60 text-sm transition-colors">Website Measurement</a>
                <a href="mailto:support@babyboo.app" className="block text-white/30 hover:text-white/60 text-sm transition-colors">Contact Support</a>
              </div>
            </div>

            <div>
              <h4 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Contact</h4>
              <div className="space-y-3 text-white/30 text-sm">
                <a href="mailto:support@babyboo.app" className="block hover:text-white/60 transition-colors">support@babyboo.app</a>
                <a href="mailto:aryanraj0316@gmail.com" className="block hover:text-white/60 transition-colors">aryanraj0316@gmail.com</a>
                <a href="https://github.com/aryanraj0316/BabyBoo" target="_blank" rel="noopener noreferrer" className="block hover:text-white/60 transition-colors">GitHub</a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/20 text-xs">© 2026 BabyBoo. All rights reserved. Made with ❤️ for parents everywhere.</p>
            <p className="text-white/15 text-xs">Version 1.0.3 • Build 4</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
