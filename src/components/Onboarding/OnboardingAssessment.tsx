import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type {
  ChildAgeCategory,
  DailyScreenTimeOption,
  ContentCategoryId,
  InappropriateExposureFrequency,
  ScreenTimeTiming,
  TransitionReaction,
  OffScreenActivity,
  DevelopmentalDomainRisk,
} from '../../types/onboarding';
import {
  RESEARCH_CITATIONS,
} from '../../data/researchCitations';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Clock,
  Shield,
  Activity,
  Smile,
  Moon,
  Info,
  X,
  Award,
  Check,
} from 'lucide-react';
import { BuddyMascot } from '../Mascot/BuddyMascot';

interface OnboardingAssessmentProps {
  onComplete?: (childData?: { name?: string; ageGroup?: any; dailyMinutes?: number; preferredStyle?: any }) => void;
}

export const OnboardingAssessment: React.FC<OnboardingAssessmentProps> = ({ onComplete }) => {
  const { navigateTo, completeOnboarding } = useApp();

  // 1 = Age, 2 = Daily Time, 3 = Content, 4 = Inappropriate, 5 = Context (Optional), 6 = Analyzing, 7 = Report
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [childName, setChildName] = useState<string>('');
  const [ageCategory, setAgeCategory] = useState<ChildAgeCategory | null>('4_5');
  const [dailyScreenTime, setDailyScreenTime] = useState<DailyScreenTimeOption | null>('2_3h');
  const [estimatedHours, setEstimatedHours] = useState<number>(2.5);
  const [contentCategories, setContentCategories] = useState<ContentCategoryId[]>([
    'educational',
    'cartoons_shows',
    'games_gaming',
  ]);
  const [inappropriateExposure, setInappropriateExposure] = useState<InappropriateExposureFrequency | null>('rarely');

  // Optional Context
  const [usageTimings, setUsageTimings] = useState<ScreenTimeTiming[]>(['after_school', 'before_bedtime']);
  const [transitionReaction, setTransitionReaction] = useState<TransitionReaction | null>('becomes_frustrated');
  const [offScreenActivities] = useState<OffScreenActivity[]>([
    'outdoor_play',
    'creative_activities',
  ]);

  // UI Interactive Modals
  const [showEstimatorModal, setShowEstimatorModal] = useState<boolean>(false);
  const [sessionsPerDay, setSessionsPerDay] = useState<number>(2);
  const [minutesPerSession, setMinutesPerSession] = useState<number>(45);

  const [showResearchModal, setShowResearchModal] = useState<boolean>(false);

  // Telemetry animation progress for step 6
  const [telemetryProgress, setTelemetryProgress] = useState<number>(0);
  const [telemetryPhase, setTelemetryPhase] = useState<string>('Evaluating exposure duration & baseline...');

  useEffect(() => {
    if (currentStep === 6) {
      setTelemetryProgress(0);
      const phases = [
        { progress: 25, text: 'Measuring daily screen displacement indices...' },
        { progress: 50, text: 'Analyzing content stimulation and pacing load...' },
        { progress: 75, text: 'Comparing developmental benchmarks (AAP & WHO)...' },
        { progress: 100, text: 'Finalizing child digital environment snapshot...' },
      ];

      let idx = 0;
      const interval = setInterval(() => {
        if (idx < phases.length) {
          setTelemetryProgress(phases[idx].progress);
          setTelemetryPhase(phases[idx].text);
          idx++;
        } else {
          clearInterval(interval);
          setTimeout(() => setCurrentStep(7), 400);
        }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const handleFinish = () => {
    const getMappedAgeGroup = (cat: ChildAgeCategory | null) => {
      switch (cat) {
        case 'under_2': return 'under_2';
        case '2_3': return '2-3';
        case '4_5': return '4-5';
        case '6_7': return '6-7';
        case '8_10': return '8-10';
        case '11_13': return '11-13';
        case '14_plus': return '14+';
        default: return '4-5';
      }
    };
    const finalChildData = {
      name: childName.trim() || 'My Child',
      ageGroup: getMappedAgeGroup(ageCategory),
      dailyMinutes: Math.round(hoursNum * 60) || 20,
      preferredStyle: 'low_battery' as const,
    };
    if (onComplete) {
      onComplete(finalChildData);
    } else {
      completeOnboarding(finalChildData);
    }
  };

  // Helper for numeric duration
  const getDurationHours = (): number => {
    switch (dailyScreenTime) {
      case 'less_than_30m':
        return 0.4;
      case '30_60m':
        return 0.75;
      case '1_2h':
        return 1.5;
      case '2_3h':
        return 2.5;
      case '3_4h':
        return 3.5;
      case '4_6h':
        return 5.0;
      case '6h_plus':
        return 7.0;
      default:
        return estimatedHours;
    }
  };

  const hoursNum = getDurationHours();
  const hasInappropriate = inappropriateExposure === 'often' || inappropriateExposure === 'very_often';
  const hasBedtimeUsage = usageTimings.includes('before_bedtime');
  const hasTransitionTrouble =
    transitionReaction === 'becomes_frustrated' ||
    transitionReaction === 'gets_very_upset' ||
    transitionReaction === 'frequent_tantrums';
  const hasLowActivePlay = offScreenActivities.includes('not_much_currently');

  // Multi-domain risk analysis
  const domainRisks: DevelopmentalDomainRisk[] = [
    {
      domain: 'Sleep Architecture & Rest',
      icon: '😴',
      level: hasBedtimeUsage || hoursNum >= 3 ? 'elevated' : 'low',
      summary: hasBedtimeUsage
        ? 'Screen use within 60 minutes of bedtime suppresses melatonin onset and may delay sleep latency by 30–45 minutes.'
        : 'Protecting evening hours supports natural circadian rhythms and deeper REM recovery.',
      researchBasis: 'American Academy of Pediatrics (AAP) Sleep Quality Guidelines (2016).',
      evidenceType: 'Known Evidence',
    },
    {
      domain: 'Attention & Executive Function',
      icon: '🧠',
      level: hoursNum >= 4 ? 'elevated' : hoursNum >= 2 ? 'moderate' : 'low',
      summary: hoursNum >= 2.5
        ? 'Rapidly edited, highly stimulating media can increase cognitive load and shorten focus duration on lower-stimulus tasks like reading.'
        : 'Balanced, slower-paced media supports calm cognitive processing without sensory overstimulation.',
      researchBasis: 'NIH Adolescent Brain Cognitive Development (ABCD) longitudinal cohort.',
      evidenceType: 'Statistical Association',
    },
    {
      domain: 'Emotional Regulation & Transitions',
      icon: '😤',
      level: hasTransitionTrouble ? 'elevated' : 'moderate',
      summary: hasTransitionTrouble
        ? 'Difficulty wrapping up screen time is a frequent behavioral signal. Predictable zero-blame ending cues significantly reduce emotional escalation.'
        : 'Your child shows flexible transitions. Keeping boundary expectations clear preserves this natural regulation.',
      researchBasis: 'Pediatrics Journal & Child Development clinical research.',
      evidenceType: 'Individual Risk Factor',
    },
    {
      domain: 'Physical Play & Motor Growth',
      icon: '🏃',
      level: hasLowActivePlay || hoursNum >= 3 ? 'elevated' : 'low',
      summary: hoursNum >= 3
        ? 'Extended sedentary screen time can displace free gross-motor play, which is critical for physical coordination and energy release.'
        : 'Regular outdoor play and active movement provide vital physical counterbalances.',
      researchBasis: 'World Health Organization (WHO) Guidelines on Physical Activity (2019).',
      evidenceType: 'Known Evidence',
    },
    {
      domain: 'Language & Social Interaction',
      icon: '🗣️',
      level: ageCategory === 'under_2' || ageCategory === '2_3' ? (hoursNum >= 2 ? 'elevated' : 'moderate') : 'low',
      summary: ageCategory === 'under_2' || ageCategory === '2_3'
        ? 'In early childhood, back-and-forth conversational turns with caregivers drive language development far more effectively than solitary screen audio.'
        : 'Active co-viewing and conversational engagement enrich vocabulary and storytelling comprehension.',
      researchBasis: 'JAMA Pediatrics Systematic Review on Expressive Language (2023).',
      evidenceType: 'Known Evidence',
    },
  ];

  // Dynamic Highest Leverage Opportunity
  const getTopOpportunity = () => {
    if (hasInappropriate) {
      return {
        title: 'Curate Content & Filter Age-Inappropriate Media',
        desc: 'Establishing strict content boundaries prevents accidental exposure to crude language and mature themes that exceed your child\'s developmental readiness.',
        badge: 'High Impact Opportunity',
        icon: Shield,
      };
    }
    if (hasBedtimeUsage) {
      return {
        title: 'Protect the Last Hour Before Bedtime',
        desc: 'Creating a screen-free buffer 60 minutes before lights-out helps natural melatonin production, ensuring deeper sleep and easier morning transitions.',
        badge: 'Sleep Quality Opportunity',
        icon: Moon,
      };
    }
    if (hasTransitionTrouble) {
      return {
        title: 'Deploy Predictable, Zero-Blame Ending Cues',
        desc: 'Using automated device sleep illusions or friendly monster countdowns shifts the blame away from the parent, preventing power struggles and meltdowns.',
        badge: 'Emotional Harmony Opportunity',
        icon: Smile,
      };
    }
    if (hoursNum >= 3) {
      return {
        title: 'Gradually Shift 30 Minutes of Screen Time to Active Play',
        desc: 'Small 15–30 minute daily reductions easily replace sedentary media with sensory play, creative building, and outdoor exploration without feeling restrictive.',
        badge: 'Healthy Balance Opportunity',
        icon: Activity,
      };
    }
    return {
      title: 'Maintain Healthy Digital Consistency',
      desc: 'Your child\'s digital environment already incorporates strong protective elements. Focus on steady routine consistency and open co-viewing discussions.',
      badge: 'Consistency & Connection',
      icon: Award,
    };
  };

  const topOpportunity = getTopOpportunity();

  // Progress Stepper Track
  const renderProgress = () => {
    if (currentStep > 5) return null;
    const steps = [1, 2, 3, 4, 5];
    return (
      <div className="flex items-center justify-between w-full px-1 mb-2 shrink-0">
        {steps.map((s, i) => {
          const isActive = currentStep === s;
          const isDone = currentStep > s;
          return (
            <React.Fragment key={s}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#5D997C] text-white shadow-sm shadow-[#5D997C]/20 ring-2 ring-[#5D997C]/20'
                    : isDone
                      ? 'bg-[#5D997C] text-white'
                      : 'bg-[#F4EFEA] text-[#718096] font-semibold'
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  `0${s}`
                )}
              </div>

              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1.5 bg-[#EAE5DE] relative overflow-hidden rounded-full">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep > s
                        ? 'w-full bg-[#5D997C]'
                        : currentStep === s
                          ? 'w-1/2 bg-[#5D997C]'
                          : 'w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] p-3 md:p-5 overflow-hidden font-sans text-[#1A2436] select-none justify-between">
      {/* ========================================================================= */}
      {/* TOP HEADER: BRAND / BACK + STEP PILL */}
      {/* ========================================================================= */}
      {currentStep <= 5 && (
        <div className="flex items-center justify-between mb-2 shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="flex items-center gap-1 text-[11px] font-black text-[#1A2436] hover:text-[#5D997C] px-3 py-1 rounded-full bg-white border border-[#EAE5DE] shadow-xs active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-xl bg-[#5D997C] text-white flex items-center justify-center font-black text-[10px] shadow-xs">
                BB
              </div>
              <span className="text-[11px] font-black text-[#1A2436] tracking-tight">BabyBoo Wellbeing</span>
            </div>
          )}

          <div className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-black text-[#5438DC] uppercase tracking-wider">
            STEP 0{currentStep} / 05
          </div>
        </div>
      )}

      {renderProgress()}

      {/* ========================================================================= */}
      {/* STEP 1: CHILD'S AGE (100% Single Screen Unscrollable) */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden animate-fade-in">
          {/* Top Title & 3D Companion */}
          <div className="shrink-0 mb-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0EEFF] text-[#5438DC] text-[9px] font-black uppercase tracking-wider mb-0.5">
                  <span>💜 DEVELOPMENTAL STAGE</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-[#1E1B4B] leading-snug tracking-tight">
                  Let's start with <span className="text-[#5438DC]">your little one.</span>
                </h1>
                <p className="text-[11px] font-semibold text-slate-500">
                  How old is your child?
                </p>
              </div>

              {/* 3D Toy Bear & Blocks Companion Illustration */}
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-3xl shadow-inner">
                🧸
              </div>
            </div>

            {/* Reassuring Callout */}
            <div className="px-2.5 py-1.5 rounded-xl bg-white border border-indigo-100 shadow-sm text-slate-600 text-[10px] font-medium flex items-center gap-2 mt-1.5">
              <span className="text-amber-500 text-xs shrink-0">✨</span>
              <span className="leading-tight line-clamp-1">
                Age matters because children's developmental needs change rapidly as they grow.
              </span>
            </div>

            {/* Child's Name Input Field */}
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-sm mt-1.5 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-[#5438DC] tracking-wider uppercase">Child's First Name</span>
                <span className="text-[9px] font-semibold text-slate-400">Optional</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Liam, Emma, or Zoe"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                maxLength={20}
                className="w-full text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* 8 Age Option Cards Grid (4 columns x 2 rows on desktop / 2 cols on compact mobile) */}
          <div className="grid grid-cols-4 gap-1.5 flex-1 max-h-[52vh] items-stretch">
            {[
              { id: 'under_2' as ChildAgeCategory, label: 'Under 2', badge: 'Infant', badgeColor: 'bg-blue-50 text-blue-700', desc: 'Sensory discovery', icon: '🍼' },
              { id: '2_3' as ChildAgeCategory, label: '2–3 yrs', badge: 'Preschool', badgeColor: 'bg-amber-50 text-amber-700', desc: 'Active curiosity', icon: '🧸' },
              { id: '4_5' as ChildAgeCategory, label: '4–5 yrs', badge: 'Pre-K', badgeColor: 'bg-purple-50 text-purple-700', desc: 'Social play', icon: '🎨' },
              { id: '6_7' as ChildAgeCategory, label: '6–7 yrs', badge: 'Elementary', badgeColor: 'bg-pink-50 text-pink-700', desc: 'Early reading', icon: '🎒' },
              { id: '8_10' as ChildAgeCategory, label: '8–10 yrs', badge: 'Middle Kid', badgeColor: 'bg-teal-50 text-teal-700', desc: 'Gaming & hobbies', icon: '🎮' },
              { id: '11_13' as ChildAgeCategory, label: '11–13 yrs', badge: 'Early Teen', badgeColor: 'bg-sky-50 text-sky-700', desc: 'Social streaming', icon: '📱' },
              { id: '14_plus' as ChildAgeCategory, label: '14+ yrs', badge: 'High School', badgeColor: 'bg-indigo-50 text-indigo-700', desc: 'Digital focus', icon: '🎧' },
            ].map((opt) => {
              const isSelected = ageCategory === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAgeCategory(opt.id)}
                  className={`p-2 rounded-2xl border text-center transition-all duration-150 flex flex-col items-center justify-between ${isSelected
                      ? 'bg-white border-[#5438DC] ring-2 ring-[#5438DC]/20 shadow-md shadow-indigo-100'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                    }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-base shadow-inner">
                    {opt.icon}
                  </div>
                  <div className="text-[11px] font-black text-slate-900 leading-none">{opt.label}</div>
                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full ${opt.badgeColor}`}>
                    {opt.badge}
                  </span>
                  <p className="text-[9px] text-slate-400 leading-tight line-clamp-1">
                    {opt.desc}
                  </p>
                  <div>
                    {isSelected ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-[#5438DC] text-white flex items-center justify-center shadow-sm">
                        <Check className="w-2 h-2 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                    )}
                  </div>
                </button>
              );
            })}

            {/* 8th Card: Not sure yet? */}
            <button
              type="button"
              onClick={() => {
                setAgeCategory('4_5');
                setCurrentStep(2);
              }}
              className="p-2 rounded-2xl border border-amber-200 bg-[#FFFDF5] hover:bg-[#FFF9EB] text-center transition-all flex flex-col items-center justify-between shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100/60 flex items-center justify-center text-base">
                ⭐
              </div>
              <div className="text-[11px] font-black text-amber-900 leading-none">Not sure?</div>
              <p className="text-[8.5px] text-amber-700/80 leading-tight">
                Personalize later
              </p>
              <div className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-black">
                →
              </div>
            </button>
          </div>

          {/* Bottom Sticky Action & Security Badge */}
          <div className="shrink-0 mt-2 space-y-1">
            <button
              type="button"
              disabled={!ageCategory}
              onClick={() => setCurrentStep(2)}
              className="w-full py-3.5 bg-[#5D997C] hover:bg-[#4D8569] disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-md shadow-[#5D997C]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400">
              <Shield className="w-3 h-3 text-indigo-400" />
              <span>Your information is private and secure.</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: DAILY SCREEN TIME (100% Single Screen Unscrollable) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden animate-fade-in">
          {/* Top Row: Title + 3D Boy Companion */}
          <div className="shrink-0 mb-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0EEFF] text-[#5438DC] text-[9px] font-black uppercase tracking-wider mb-0.5">
                  <span>⏱️ EXPOSURE DURATION</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-[#1E1B4B] leading-snug tracking-tight">
                  How much screen time does your child get?
                </h1>
                <p className="text-[11px] font-semibold text-slate-500">
                  An estimate is completely fine.
                </p>
              </div>

              <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-3xl shadow-inner">
                👦
              </div>
            </div>
          </div>

          {/* 6 Screen Time Option Cards Grid (2 columns x 3 rows, fixed unscrollable) */}
          <div className="grid grid-cols-2 gap-2 flex-1 max-h-[52vh] items-stretch">
            {[
              { id: '2_3h' as DailyScreenTimeOption, label: '2–3 hours', sub: 'Common daily window', icon: '⏳' },
              { id: 'less_than_30m' as DailyScreenTimeOption, label: 'Less than 30m', sub: 'Minimal exposure', icon: '⏱️' },
              { id: '30_60m' as DailyScreenTimeOption, label: '30–60 minutes', sub: 'Light daily routine', icon: '☀️' },
              { id: '1_2h' as DailyScreenTimeOption, label: '1–2 hours', sub: 'Moderate exposure', icon: '📖' },
              { id: '3_4h' as DailyScreenTimeOption, label: '3–4 hours', sub: 'Extended exposure', icon: '🎮' },
              { id: '4_6h' as DailyScreenTimeOption, label: '4–6 hours', sub: 'High recreational use', icon: '💻' },
            ].map((opt) => {
              const isSelected = dailyScreenTime === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDailyScreenTime(opt.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between relative ${isSelected
                      ? 'bg-white border-[#5438DC] ring-2 ring-[#5438DC]/20 shadow-md shadow-indigo-100'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl">{opt.icon}</span>
                    {isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-[#5438DC] text-white flex items-center justify-center shadow-sm">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                  </div>

                  <div className="mt-1">
                    <div className="text-xs font-black text-slate-900">{opt.label}</div>
                    <p className="text-[9.5px] font-medium text-slate-400 leading-tight">{opt.sub}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute bottom-1 left-3 right-3 h-0.5 rounded-full bg-[#5438DC]/50" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Estimator & Bottom Action */}
          <div className="shrink-0 mt-2 space-y-1.5">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-indigo-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-700">
                <Clock className="w-3 h-3 text-[#5438DC]" />
                <span>Not sure about total hours?</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEstimatorModal(true)}
                className="text-[10.5px] font-black text-[#5438DC] hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100"
              >
                Help me estimate →
              </button>
            </div>

            <button
              type="button"
              disabled={!dailyScreenTime}
              onClick={() => setCurrentStep(3)}
              className="w-full py-3.5 bg-[#5D997C] hover:bg-[#4D8569] disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-md shadow-[#5D997C]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CONTENT CATEGORIES (Single Screen Unscrollable) */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden animate-fade-in">
          <div className="shrink-0 mb-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0EEFF] text-[#5438DC] text-[9px] font-black uppercase tracking-wider mb-0.5">
              <span>📱 CONTENT ENVIRONMENT</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#1E1B4B] leading-snug">
              What usually appears on their screen?
            </h1>
            <p className="text-[11px] font-semibold text-slate-500">
              Select what your child regularly watches.
            </p>
          </div>

          {/* 12 Categories in 2 Columns Grid */}
          <div className="grid grid-cols-2 gap-1.5 flex-1 max-h-[58vh] items-stretch">
            {[
              { id: 'nursery_rhymes' as ContentCategoryId, title: 'Songs & Rhymes', icon: '🎵' },
              { id: 'educational' as ContentCategoryId, title: 'Educational', icon: '📚' },
              { id: 'creative_crafts' as ContentCategoryId, title: 'Drawing & Crafts', icon: '🎨' },
              { id: 'cartoons_shows' as ContentCategoryId, title: "Cartoons & Shows", icon: '🧸' },
              { id: 'games_gaming' as ContentCategoryId, title: 'Games & Streams', icon: '🎮' },
              { id: 'comedy_memes_shorts' as ContentCategoryId, title: 'Comedy & Shorts', icon: '😂' },
              { id: 'general_entertainment' as ContentCategoryId, title: 'Entertainment', icon: '🎬' },
              { id: 'scary_horror' as ContentCategoryId, title: 'Scary / Horror', icon: '👻' },
              { id: 'profanity_vulgar' as ContentCategoryId, title: 'Profanity / Crude', icon: '🤬' },
              { id: 'sexualized_content' as ContentCategoryId, title: 'Mature / 18+', icon: '🔞' },
              { id: 'violence_fighting' as ContentCategoryId, title: 'Violence & Combat', icon: '⚔️' },
              { id: 'influencers_social' as ContentCategoryId, title: 'Influencers / Social', icon: '📱' },
            ].map((item) => {
              const isSelected = contentCategories.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) setContentCategories(contentCategories.filter((c) => c !== item.id));
                    else setContentCategories([...contentCategories, item.id]);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${isSelected
                      ? 'bg-white border-[#5438DC] ring-2 ring-[#5438DC]/20 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[11px] font-black text-slate-900 leading-tight">{item.title}</span>
                  </div>
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#5438DC] border-[#5438DC] text-white' : 'border-slate-300'
                      }`}
                  >
                    {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 mt-2">
            <button
              type="button"
              disabled={contentCategories.length === 0}
              onClick={() => setCurrentStep(4)}
              className="w-full py-3.5 bg-[#5D997C] hover:bg-[#4D8569] disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-md shadow-[#5D997C]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Continue ({contentCategories.length} selected)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: INAPPROPRIATE EXPOSURE (Single Screen Unscrollable) */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden animate-fade-in">
          <div className="shrink-0 mb-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0EEFF] text-[#5438DC] text-[9px] font-black uppercase tracking-wider mb-0.5">
              <span>🛡️ SAFETY & BOUNDARIES</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#1E1B4B] leading-snug">
              One more important question.
            </h1>
            <p className="text-[11px] font-semibold text-slate-500">
              Is your child exposed to vulgar, aggressive or age-inappropriate content?
            </p>
          </div>

          <div className="space-y-1.5 flex-1 max-h-[58vh] justify-center flex flex-col">
            {[
              { id: 'never' as InappropriateExposureFrequency, label: 'Never', desc: 'Strictly filtered & supervised' },
              { id: 'rarely' as InappropriateExposureFrequency, label: 'Rarely', desc: 'Occasional pop-up or ad' },
              { id: 'sometimes' as InappropriateExposureFrequency, label: 'Sometimes', desc: 'Some unmonitored videos' },
              { id: 'often' as InappropriateExposureFrequency, label: 'Often', desc: 'Frequent unfiltered autoplay' },
              { id: 'very_often' as InappropriateExposureFrequency, label: 'Very often', desc: 'Broad access to unmoderated media' },
              { id: 'not_sure' as InappropriateExposureFrequency, label: "I'm not sure", desc: 'Recommend safe baseline limits' },
            ].map((opt) => {
              const isSelected = inappropriateExposure === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setInappropriateExposure(opt.id)}
                  className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${isSelected
                      ? 'bg-white border-[#5438DC] ring-2 ring-[#5438DC]/20 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                >
                  <div>
                    <div className="text-xs font-black text-slate-900">{opt.label}</div>
                    <p className="text-[9.5px] text-slate-400 leading-tight">{opt.desc}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#5438DC] bg-[#5438DC] text-white' : 'border-slate-300'
                      }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 mt-2">
            <button
              type="button"
              disabled={!inappropriateExposure}
              onClick={() => setCurrentStep(5)}
              className="w-full py-3.5 bg-[#5D997C] hover:bg-[#4D8569] disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-md shadow-[#5D997C]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: OPTIONAL CONTEXT (Single Screen Unscrollable) */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden animate-fade-in">
          <div className="shrink-0 mb-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0EEFF] text-[#5438DC] text-[9px] font-black uppercase tracking-wider mb-0.5">
              <span>🎯 BEHAVIOR & ROUTINES</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-[#1E1B4B] leading-snug">
              Context around screen time.
            </h1>
            <p className="text-[11px] font-semibold text-slate-500">
              How screens fit into daily schedules.
            </p>
          </div>

          <div className="space-y-2.5 flex-1 max-h-[58vh] justify-center flex flex-col">
            <div>
              <p className="text-[11px] font-black text-slate-800 mb-1">When does your child use screens most?</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'after_school' as ScreenTimeTiming, label: 'After school' },
                  { id: 'before_bedtime' as ScreenTimeTiming, label: 'Before bedtime' },
                  { id: 'during_meals' as ScreenTimeTiming, label: 'During meals' },
                  { id: 'when_bored' as ScreenTimeTiming, label: 'When bored' },
                ].map((t) => {
                  const isSelected = usageTimings.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) setUsageTimings(usageTimings.filter((x) => x !== t.id));
                        else setUsageTimings([...usageTimings, t.id]);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${isSelected ? 'bg-indigo-50 border-[#5438DC] text-[#5438DC]' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-black text-slate-800 mb-1">Reaction when screen time ends?</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'stops_easily' as TransitionReaction, label: 'Stops easily' },
                  { id: 'becomes_frustrated' as TransitionReaction, label: 'Becomes frustrated' },
                  { id: 'frequent_tantrums' as TransitionReaction, label: 'Frequent tantrums' },
                  { id: 'it_varies' as TransitionReaction, label: 'It varies' },
                ].map((r) => {
                  const isSelected = transitionReaction === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setTransitionReaction(r.id)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${isSelected ? 'bg-indigo-50 border-[#5438DC] text-[#5438DC]' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="shrink-0 mt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="w-full py-3.5 bg-[#5D997C] hover:bg-[#4D8569] text-white font-extrabold text-xs rounded-full shadow-md shadow-[#5D997C]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Analyze Digital Environment →</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6: TELEMETRY ANALYSIS ANIMATION */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-fade-in">
          <div className="w-20 h-20 rounded-[28px] bg-[#EBF4EF] border-2 border-[#5D997C]/30 flex items-center justify-center mb-4 shadow-xs">
            <BuddyMascot mood="cheerful" size={70} lookAround={true} />
          </div>

          <h2 className="text-lg font-black text-[#1A2436] mb-1">
            Analyzing your child's digital environment...
          </h2>
          <p className="text-xs text-[#718096] max-w-xs mb-4">
            {telemetryPhase}
          </p>

          <div className="w-full max-w-xs bg-[#EAE5DE] h-2 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#5D997C] transition-all duration-300 rounded-full"
              style={{ width: `${telemetryProgress}%` }}
            />
          </div>
          <span className="text-xs font-black text-[#5D997C]">{telemetryProgress}%</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7: COMPREHENSIVE SNAPSHOT REPORT (Scrollable Report View) */}
      {/* ========================================================================= */}
      {currentStep === 7 && (
        <div className="flex-1 overflow-y-auto space-y-3 animate-fade-in pb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0EEFF] text-[#5438DC] text-[9px] font-black uppercase tracking-wider mb-0.5">
                <span>📊 ASSESSMENT SUMMARY</span>
              </div>
              <h1 className="text-xl font-black text-slate-900">
                {childName.trim() ? `${childName.trim()}'s Screen Exposure Snapshot` : 'Child Screen Exposure Snapshot'}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowResearchModal(true)}
              className="text-[11px] font-bold text-[#5438DC] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100"
            >
              Research Sources
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[10.5px] text-amber-900 leading-relaxed flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Educational risk snapshot based on media patterns and pediatric research. Not a medical diagnosis.
            </span>
          </div>

          {/* Highest Opportunity Card */}
          <div className="p-4 rounded-[24px] bg-[#5D997C] text-white shadow-xs">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-[#F6D878]" />
              <span>{topOpportunity.badge}</span>
            </div>
            <h3 className="text-sm font-black mb-0.5">{topOpportunity.title}</h3>
            <p className="text-[11px] text-[#EBF4EF] leading-relaxed">{topOpportunity.desc}</p>
          </div>

          {/* Developmental Domains */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-[#718096]">
              Developmental Areas & Research Associations
            </h3>
            {domainRisks.map((d, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#EAE5DE] shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{d.icon}</span>
                    <span className="text-xs font-black text-[#1A2436]">{d.domain}</span>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      d.level === 'elevated'
                        ? 'bg-[#FEF3C7] text-[#8E4B10]'
                        : d.level === 'moderate'
                          ? 'bg-[#E0F2FE] text-[#0369A1]'
                          : 'bg-[#EBF4EF] text-[#2D5A43]'
                    }`}
                  >
                    {d.level} exposure concern
                  </span>
                </div>
                <p className="text-[11px] text-[#4A5568] leading-relaxed">{d.summary}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-4 bg-[#5D997C] hover:bg-[#4D8569] text-white font-extrabold text-sm rounded-full shadow-md shadow-[#5D997C]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>Create {childName.trim() ? `${childName.trim()}'s` : "My Child's"} Screen Plan →</span>
            </button>
          </div>
        </div>
      )}

      {/* Estimator Modal */}
      {showEstimatorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl text-slate-800 animate-scale-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-indigo-600">Daily Calculator</span>
              <button type="button" onClick={() => setShowEstimatorModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Approximately how many sessions and how long per session?</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700">Sessions per day: {sessionsPerDay}</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={sessionsPerDay}
                  onChange={(e) => setSessionsPerDay(Number(e.target.value))}
                  className="w-full accent-[#5438DC]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700">Minutes per session: {minutesPerSession} min</label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={minutesPerSession}
                  onChange={(e) => setMinutesPerSession(Number(e.target.value))}
                  className="w-full accent-[#5438DC]"
                />
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 text-xs font-black text-[#5438DC] text-center">
                Estimated: {((sessionsPerDay * minutesPerSession) / 60).toFixed(1)} hours / day
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEstimatedHours((sessionsPerDay * minutesPerSession) / 60);
                setDailyScreenTime('2_3h');
                setShowEstimatorModal(false);
              }}
              className="w-full py-2.5 bg-[#5438DC] text-white font-black text-xs rounded-xl shadow-md"
            >
              Apply Estimate
            </button>
          </div>
        </div>
      )}

      {/* Research Modal */}
      {showResearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl text-slate-800 animate-scale-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-indigo-600">Research & Evidence Sources</span>
              <button type="button" onClick={() => setShowResearchModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              {RESEARCH_CITATIONS.map((c, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-black text-slate-900">{c.title} ({c.year})</div>
                  <div className="text-indigo-600 font-bold mt-0.5">{c.source}</div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{c.keyFinding}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
