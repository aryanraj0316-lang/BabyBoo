import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { AgeGroup, ShutdownStyle } from '../../types';
import { UserPlus, ArrowLeft, Check } from 'lucide-react';
import { NatureDecorations } from '../../theme/NatureDecorations';

export const AddChildProfileScreen: React.FC = () => {
  const { addChild, navigateTo } = useApp();
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('4-5');
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(20);
  const [defaultGraceSeconds, setDefaultGraceSeconds] = useState(60);
  const [preferredStyle, setPreferredStyle] = useState<ShutdownStyle>('low_battery');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addChild({
      name: name.trim(),
      ageGroup,
      avatar: name.trim().charAt(0).toUpperCase(),
      dailyLimitMinutes,
      defaultGraceSeconds,
      preferredStyle,
    });

    navigateTo('parent_dashboard');
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] justify-between relative overflow-hidden font-sans select-none">
      <NatureDecorations variant="minimal" />

      {/* Header */}
      <div className="p-4 bg-white/90 backdrop-blur-md border-b border-[#EAE5DE] flex items-center justify-between shadow-xs z-10 shrink-0">
        <button
          type="button"
          onClick={() => navigateTo('parent_dashboard')}
          className="p-2 -ml-2 rounded-xl text-[#64748B] hover:text-[#1A2436] hover:bg-[#FAF8F5] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-extrabold text-base text-[#1A2436]">Add Child Profile</h2>
        <div className="w-9" />
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scrollbar-none">
        {/* Avatar Display */}
        <div className="flex flex-col items-center justify-center pt-2 pb-1">
          <div className="w-20 h-20 rounded-3xl bg-[#5D997C] text-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-black mb-1">
            {name.trim() ? name.trim().charAt(0).toUpperCase() : 'C'}
          </div>
          <p className="text-xs font-bold text-[#64748B]">Child Profile Avatar</p>
        </div>

        {/* Child Name */}
        <div>
          <label className="block text-xs font-bold text-[#1A2436] mb-1.5">Child's Name / Nickname</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Leo or Maya"
            required
            className="w-full px-4 py-3 rounded-2xl bg-white border border-[#EAE5DE] focus:border-[#5D997C] focus:outline-none text-sm font-bold text-[#1A2436] shadow-xs placeholder-[#94A3B8]"
          />
        </div>

        {/* Age Group Selector - Wide Range */}
        <div>
          <label className="block text-xs font-bold text-[#1A2436] mb-1.5">Age Bracket</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'under_2' as AgeGroup, label: 'Under 2', badge: 'Infant', range: '< 2 yrs', mins: 10, icon: '🍼', desc: 'Sensory discovery' },
              { id: '2-3' as AgeGroup, label: '2–3 yrs', badge: 'Preschool', range: '2–3 yrs', mins: 15, icon: '🧸', desc: 'Active curiosity' },
              { id: '4-5' as AgeGroup, label: '4–5 yrs', badge: 'Pre-K', range: '4–5 yrs', mins: 20, icon: '🎨', desc: 'Social play' },
              { id: '6-7' as AgeGroup, label: '6–7 yrs', badge: 'Elementary', range: '6–7 yrs', mins: 30, icon: '🎒', desc: 'Early reading' },
              { id: '8-10' as AgeGroup, label: '8–10 yrs', badge: 'Middle Kid', range: '8–10 yrs', mins: 45, icon: '🎮', desc: 'Gaming & hobbies' },
              { id: '11-13' as AgeGroup, label: '11–13 yrs', badge: 'Early Teen', range: '11–13 yrs', mins: 45, icon: '📱', desc: 'Social streaming' },
              { id: '14+' as AgeGroup, label: '14+ yrs', badge: 'High School', range: '14+ yrs', mins: 60, icon: '🎧', desc: 'Digital focus' },
            ].map((b) => {
              const isSelected = ageGroup === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setAgeGroup(b.id);
                    setDailyLimitMinutes(b.mins);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-[#5D997C] bg-[#EBF4EF] shadow-xs'
                      : 'border border-[#EAE5DE] bg-white hover:border-[#D1C9BE]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{b.icon}</span>
                    <span className="text-xs font-extrabold text-[#1A2436]">{b.label}</span>
                  </div>
                  <span className={`block text-[10px] font-bold ${isSelected ? 'text-[#2D5441]' : 'text-[#5D997C]'}`}>
                    {b.range} • {b.badge}
                  </span>
                  <span className="block text-[9.5px] text-[#64748B] mt-0.5 leading-tight">{b.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Session Limit */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE5DE] shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-[#1A2436]">Default Screen Limit</label>
            <span className="text-xs font-bold text-[#2D5441] bg-[#EBF4EF] border border-[#D1E6DA] px-2.5 py-0.5 rounded-full">
              {dailyLimitMinutes} minutes
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={dailyLimitMinutes}
            onChange={(e) => setDailyLimitMinutes(Number(e.target.value))}
            className="w-full h-2 bg-[#F5F2EB] rounded-lg appearance-none cursor-pointer accent-[#5D997C]"
          />
        </div>

        {/* Default Grace Period */}
        <div className="bg-white p-4 rounded-2xl border border-[#EAE5DE] shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-[#1A2436]">Warning Grace Period</label>
            <span className="text-xs font-bold text-[#7A6216] bg-[#FEF9E7] border border-[#F9ECC0] px-2.5 py-0.5 rounded-full">
              {defaultGraceSeconds} seconds
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[30, 60, 90, 120].map((secs) => (
              <button
                key={secs}
                type="button"
                onClick={() => setDefaultGraceSeconds(secs)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  defaultGraceSeconds === secs
                    ? 'bg-[#F6D878] text-[#1A2436] border border-[#E8C55A] font-extrabold shadow-xs'
                    : 'bg-[#FAF8F5] border border-[#EAE5DE] text-[#475569] hover:bg-[#F5F2EB]'
                }`}
              >
                {secs}s
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Shutdown Style */}
        <div>
          <label className="block text-xs font-bold text-[#1A2436] mb-1.5">Preferred Device Rest Style</label>
          <div className="space-y-2">
            {[
              {
                id: 'low_battery' as ShutdownStyle,
                title: '🔋 Low Battery',
                desc: 'Battery drops to 1% and enters deep sleep for 1 min.',
              },
              {
                id: 'cooldown' as ShutdownStyle,
                title: '🌀 Cooldown Nap',
                desc: 'Device takes a quick 60s cooldown break to rest.',
              },
              {
                id: 'needs_rest' as ShutdownStyle,
                title: '💤 Needs a Rest',
                desc: 'Calm starry dimming screen framed around resting.',
              },
            ].map((style) => (
              <div
                key={style.id}
                onClick={() => setPreferredStyle(style.id)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                  preferredStyle === style.id
                    ? 'border-2 border-[#5D997C] bg-[#EBF4EF] shadow-xs'
                    : 'border border-[#EAE5DE] bg-white hover:border-[#D1C9BE]'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[#1A2436]">{style.title}</p>
                  <p className="text-[11px] text-[#64748B]">{style.desc}</p>
                </div>
                {preferredStyle === style.id && (
                  <div className="w-5 h-5 rounded-full bg-[#5D997C] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 rounded-full bg-[#5D997C] hover:bg-[#51876D] text-white font-extrabold text-sm shadow-[0_2px_10px_rgba(93,153,124,0.25)] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Save Child Profile</span>
        </button>
      </form>
    </div>
  );
};
