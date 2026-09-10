import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { BuddyMascotNative } from './BuddyMascotNative';
import type {
  ChildAgeCategory,
  DailyScreenTimeOption,
  ContentCategoryId,
  InappropriateExposureFrequency,
  ScreenTimeTiming,
  TransitionReaction,
  OffScreenActivity,
  MonsterTypeId,
  SwitchOffStyleId,
  DevelopmentalDomainRisk,
} from '../types/onboarding';
import {
  RESEARCH_CITATIONS,
  MONSTER_PROFILES,
  SWITCH_OFF_PROFILES,
} from '../data/researchCitations';

export interface OnboardingChildData {
  name: string;
  ageBracket: string;
  dailyMinutes: number;
  graceSeconds: number;
  preferredStyle: 'low_battery' | 'cooldown' | 'needs_rest';
  avatarColor: string;
}

interface OnboardingAssessmentNativeProps {
  onComplete?: (childData?: OnboardingChildData) => void;
  onNavigateToDashboard?: () => void;
}

export const OnboardingAssessmentNative: React.FC<OnboardingAssessmentNativeProps> = ({
  onComplete,
  onNavigateToDashboard,
}) => {
  // Steps: 1..5 questions, 6 = Analyzing Telemetry, 7 = Full Report
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
  const [customContentText, setCustomContentText] = useState<string>('');
  const [inappropriateExposure, setInappropriateExposure] = useState<InappropriateExposureFrequency | null>('rarely');

  // Optional Context
  const [usageTimings, setUsageTimings] = useState<ScreenTimeTiming[]>(['after_school', 'before_bedtime']);
  const [transitionReaction, setTransitionReaction] = useState<TransitionReaction | null>('becomes_frustrated');
  const [offScreenActivities, setOffScreenActivities] = useState<OffScreenActivity[]>([
    'outdoor_play',
    'reading',
    'creative_activities',
  ]);

  // UI Modals
  const [showEstimatorModal, setShowEstimatorModal] = useState<boolean>(false);
  const [sessionsPerDay, setSessionsPerDay] = useState<number>(2);
  const [minutesPerSession, setMinutesPerSession] = useState<number>(45);

  const [showResearchModal, setShowResearchModal] = useState<boolean>(false);
  const [previewMonsterModal, setPreviewMonsterModal] = useState<MonsterTypeId | null>(null);
  const [previewSwitchOffModal, setPreviewSwitchOffModal] = useState<SwitchOffStyleId | null>(null);

  const [selectedMonster, setSelectedMonster] = useState<MonsterTypeId>('friendly_ghost');
  const [selectedSwitchOff, setSelectedSwitchOff] = useState<SwitchOffStyleId>('low_battery');

  // Telemetry Progress
  const [telemetryProgress, setTelemetryProgress] = useState<number>(0);
  const [telemetryPhase, setTelemetryPhase] = useState<string>('Evaluating exposure duration & baseline...');

  const getMappedAgeBracket = (cat: ChildAgeCategory | null): string => {
    switch (cat) {
      case 'under_2': return '< 2';
      case '2_3': return '2–3';
      case '4_5': return '4–5';
      case '6_7': return '6–7';
      case '8_10': return '8–10';
      case '11_13': return '11–13';
      case '14_plus': return '14+';
      default: return '4–5';
    }
  };

  const getRecommendedDailyMinutes = (cat: ChildAgeCategory | null): number => {
    switch (cat) {
      case 'under_2': return 10;
      case '2_3': return 15;
      case '4_5': return 20;
      case '6_7': return 30;
      case '8_10': return 45;
      case '11_13': return 45;
      case '14_plus': return 60;
      default: return 20;
    }
  };

  const getMappedShutdownStyle = (styleId: SwitchOffStyleId): 'low_battery' | 'cooldown' | 'needs_rest' => {
    if (styleId === 'cooldown') return 'cooldown';
    if (styleId === 'needs_rest' || styleId === 'screen_fade') return 'needs_rest';
    return 'low_battery';
  };

  const handleFinishOnboarding = () => {
    const finalChildData: OnboardingChildData = {
      name: childName.trim() || 'My Child',
      ageBracket: getMappedAgeBracket(ageCategory),
      dailyMinutes: getRecommendedDailyMinutes(ageCategory),
      graceSeconds: 60,
      preferredStyle: getMappedShutdownStyle(selectedSwitchOff),
      avatarColor: '#7C6DF8',
    };

    if (onComplete) {
      onComplete(finalChildData);
    } else if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  };

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
          setTimeout(() => {
            setCurrentStep(7);
          }, 600);
        }
      }, 700);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const resolveHoursNumber = (opt: DailyScreenTimeOption | null): number => {
    switch (opt) {
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
        return estimatedHours || 2.0;
    }
  };

  const handleApplyEstimator = () => {
    const totalMinutes = sessionsPerDay * minutesPerSession;
    const hours = Math.round((totalMinutes / 60) * 10) / 10;
    setEstimatedHours(hours);
    if (hours < 0.5) setDailyScreenTime('less_than_30m');
    else if (hours <= 1.0) setDailyScreenTime('30_60m');
    else if (hours <= 2.0) setDailyScreenTime('1_2h');
    else if (hours <= 3.0) setDailyScreenTime('2_3h');
    else if (hours <= 4.0) setDailyScreenTime('3_4h');
    else if (hours <= 6.0) setDailyScreenTime('4_6h');
    else setDailyScreenTime('6h_plus');
    setShowEstimatorModal(false);
  };

  const toggleContentCategory = (id: ContentCategoryId) => {
    if (id === 'not_sure') {
      setContentCategories(['not_sure']);
      return;
    }
    const filtered = contentCategories.filter((c) => c !== 'not_sure');
    if (filtered.includes(id)) {
      setContentCategories(filtered.filter((c) => c !== id));
    } else {
      setContentCategories([...filtered, id]);
    }
  };

  const toggleTiming = (timing: ScreenTimeTiming) => {
    if (usageTimings.includes(timing)) {
      setUsageTimings(usageTimings.filter((t) => t !== timing));
    } else {
      setUsageTimings([...usageTimings, timing]);
    }
  };

  const toggleActivity = (act: OffScreenActivity) => {
    if (act === 'not_much_currently') {
      setOffScreenActivities(['not_much_currently']);
      return;
    }
    const filtered = offScreenActivities.filter((a) => a !== 'not_much_currently');
    if (filtered.includes(act)) {
      setOffScreenActivities(filtered.filter((a) => a !== act));
    } else {
      setOffScreenActivities([...filtered, act]);
    }
  };

  const getAgeLabel = (age: ChildAgeCategory | null) => {
    switch (age) {
      case 'under_2':
        return 'Under 2 years';
      case '2_3':
        return '2–3 years';
      case '4_5':
        return '4–5 years';
      case '6_7':
        return '6–7 years';
      case '8_10':
        return '8–10 years';
      case '11_13':
        return '11–13 years';
      case '14_plus':
        return '14+ years';
      default:
        return '4–5 years';
    }
  };

  const hoursNum = resolveHoursNumber(dailyScreenTime);
  const hasBedtimeUsage = usageTimings.includes('before_bedtime');
  const hasInappropriate =
    inappropriateExposure === 'sometimes' ||
    inappropriateExposure === 'often' ||
    inappropriateExposure === 'very_often' ||
    contentCategories.includes('profanity_vulgar') ||
    contentCategories.includes('sexualized_content') ||
    contentCategories.includes('violence_fighting') ||
    contentCategories.includes('scary_horror');
  const hasTransitionTrouble =
    transitionReaction === 'becomes_frustrated' ||
    transitionReaction === 'gets_very_upset' ||
    transitionReaction === 'frequent_tantrums';
  const hasLowActivePlay = offScreenActivities.includes('not_much_currently') || !offScreenActivities.includes('outdoor_play');

  const developmentalDomains: DevelopmentalDomainRisk[] = [
    {
      domain: 'Sleep & Circadian Rhythm',
      icon: '😴',
      level: hasBedtimeUsage || hoursNum >= 3 ? 'elevated' : hoursNum >= 2 ? 'moderate' : 'low',
      summary: hasBedtimeUsage
        ? 'Evening screen exposure within 60 minutes of sleep is associated with delayed melatonin onset and lighter sleep architecture.'
        : 'Predictable screen wind-down routines support healthy sleep onset and natural rest.',
      researchBasis: 'JAMA Pediatrics (2019) & AAP sleep physiology research.',
      evidenceType: 'Known Evidence',
    },
    {
      domain: 'Attention & Self-Regulation',
      icon: '🧠',
      level: contentCategories.includes('comedy_memes_shorts') || hoursNum >= 3 ? 'elevated' : hoursNum >= 1.5 ? 'moderate' : 'low',
      summary: contentCategories.includes('comedy_memes_shorts')
        ? 'Rapidly pacing short-form video formats deliver frequent dopamine-stimulating shifts that may challenge sustained attention on slower tasks.'
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

  const getTopOpportunity = () => {
    if (hasInappropriate) {
      return {
        title: 'Curate Content & Filter Mature Themes',
        desc: 'Establishing strict content boundaries prevents accidental exposure to crude language and themes that exceed your child\'s developmental readiness.',
        badge: 'High Impact Opportunity',
        color: '#D97706',
      };
    }
    if (hasBedtimeUsage) {
      return {
        title: 'Protect the Last Hour Before Bedtime',
        desc: 'Creating a screen-free buffer 60 minutes before lights-out helps natural melatonin production, ensuring deeper sleep and easier mornings.',
        badge: 'Sleep Quality Opportunity',
        color: '#4F46E5',
      };
    }
    if (hasTransitionTrouble) {
      return {
        title: 'Deploy Predictable, Zero-Blame Ending Cues',
        desc: 'Using automated device sleep illusions or friendly monster countdowns shifts the blame away from the parent, preventing meltdowns.',
        badge: 'Emotional Harmony Opportunity',
        color: '#7C3AED',
      };
    }
    if (hoursNum >= 3) {
      return {
        title: 'Gradually Shift 30 Minutes to Active Play',
        desc: 'Small 15–30 minute daily reductions easily replace sedentary media with sensory play, creative building, and outdoor exploration.',
        badge: 'Healthy Balance Opportunity',
        color: '#059669',
      };
    }
    return {
      title: 'Maintain Healthy Digital Consistency',
      desc: 'Your child\'s digital environment already incorporates strong protective elements. Focus on steady routine consistency and co-viewing.',
      badge: 'Consistency & Connection',
      color: '#4F46E5',
    };
  };

  const topOpportunity = getTopOpportunity();

  return (
    <View style={styles.container}>
      {/* ⚡ Development Mode Quick Skip Banner */}
      <View style={styles.devBanner}>
        <View style={styles.devBannerLeft}>
          <View style={styles.devTag}>
            <Text style={styles.devTagText}>DEV MODE</Text>
          </View>
          <Text style={styles.devHint}>Skip assessment during development</Text>
        </View>
        <TouchableOpacity
          style={styles.devSkipBtn}
          activeOpacity={0.8}
          onPress={handleFinishOnboarding}
          accessibilityLabel="Development Only: Skip Onboarding"
        >
          <Text style={styles.devSkipBtnText}>⚡ Skip to Dashboard →</Text>
        </TouchableOpacity>
      </View>

      {/* Step Header */}
      {currentStep <= 5 && (
        <View style={styles.topHeaderRow}>
          {currentStep > 1 ? (
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.8}
              onPress={() => setCurrentStep((p) => Math.max(1, p - 1))}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.brandRow}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>BB</Text>
              </View>
              <Text style={styles.brandTitle}>BabyBoo Wellbeing</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {currentStep === 5 ? (
              <TouchableOpacity
                style={styles.skipBtn}
                activeOpacity={0.8}
                onPress={() => setCurrentStep(6)}
              >
                <Text style={styles.skipBtnText}>Skip Context →</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.stepCounterText}>Step 0{currentStep} / 05</Text>
            )}
          </View>
        </View>
      )}

      {/* Progress Stepper Indicators matching reference */}
      {currentStep <= 5 && (
        <View style={styles.stepperContainer}>
          {[1, 2, 3, 4, 5].map((s, i) => {
            const isActive = currentStep === s;
            const isDone = currentStep > s;
            return (
              <React.Fragment key={s}>
                <View
                  style={[
                    styles.stepperNode,
                    isActive && styles.stepperNodeActive,
                    isDone && styles.stepperNodeDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepperNodeText,
                      isActive && styles.stepperNodeTextActive,
                      isDone && styles.stepperNodeTextDone,
                    ]}
                  >
                    {isDone ? '✓' : `0${s}`}
                  </Text>
                </View>
                {i < 4 && (
                  <View style={styles.stepperTrack}>
                    <View
                      style={[
                        styles.stepperTrackFill,
                        {
                          width: currentStep > s ? '100%' : currentStep === s ? '50%' : '0%',
                        },
                      ]}
                    />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ========================================================================= */}
        {/* STEP 1: CHILD'S AGE (Exact recreation of Screen 1 reference) */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            {/* Top Row: Title + 3D Toy Bear Illustration */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={styles.stageTag}>
                  <Text style={styles.stageTagText}>💜 DEVELOPMENTAL STAGE</Text>
                </View>
                <Text style={styles.mainTitle}>Let's start with</Text>
                <Text style={[styles.mainTitle, { color: '#5438DC' }]}>your little one.</Text>
                <Text style={styles.mainSub}>How old is your child?</Text>
              </View>

              {/* 3D Toy Companion Badge */}
              <View style={{ width: 90, height: 90, borderRadius: 28, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 44 }}>🧸</Text>
              </View>
            </View>

            {/* Child's Name Input Field */}
            <View style={styles.childNameCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.childNameLabel}>CHILD'S FIRST NAME</Text>
                <Text style={styles.childNameOptionalTag}>OPTIONAL</Text>
              </View>
              <TextInput
                style={styles.childNameInput}
                placeholder="e.g. Leo, Maya, or Liam"
                placeholderTextColor="#94A3B8"
                value={childName}
                onChangeText={setChildName}
                maxLength={20}
              />
            </View>

            {/* Reassurance Callout Card with Sparkle */}
            <View style={styles.reassuranceCard}>
              <View style={styles.sparkleIconWrapper}>
                <Text style={{ fontSize: 14 }}>✨</Text>
              </View>
              <Text style={styles.reassuranceText}>
                Age matters because children's developmental needs and media comprehension change rapidly as they grow.
              </Text>
            </View>

            {/* 8 Age Option Cards Grid (2-column layout) */}
            <View style={styles.gridTwoCols}>
              {[
                { id: 'under_2' as ChildAgeCategory, label: 'Under 2', badge: 'Infant / Toddler', badgeBg: '#EFF6FF', badgeColor: '#1D4ED8', desc: 'Sensory discovery & hands-on exploration', icon: '🍼' },
                { id: '2_3' as ChildAgeCategory, label: '2–3 years', badge: 'Early Preschool', badgeBg: '#FEF3C7', badgeColor: '#B45309', desc: 'Rapid language acquisition & active curiosity', icon: '🧸' },
                { id: '4_5' as ChildAgeCategory, label: '4–5 years', badge: 'Preschool / Pre-K', badgeBg: '#F3E8FF', badgeColor: '#7E22CE', desc: 'Social play, imagination & emotional growth', icon: '🎨' },
                { id: '6_7' as ChildAgeCategory, label: '6–7 years', badge: 'Early Elementary', badgeBg: '#FCE7F3', badgeColor: '#BE185D', desc: 'Sustained attention & early reading routines', icon: '🎒' },
                { id: '8_10' as ChildAgeCategory, label: '8–10 years', badge: 'Middle Childhood', badgeBg: '#CCFBF1', badgeColor: '#0F766E', desc: 'Independent hobbies, gaming & peer media', icon: '🎮' },
                { id: '11_13' as ChildAgeCategory, label: '11–13 years', badge: 'Early Teen', badgeBg: '#E0F2FE', badgeColor: '#0369A1', desc: 'Social platforms, streaming & self-direction', icon: '📱' },
                { id: '14_plus' as ChildAgeCategory, label: '14+ years', badge: 'High School', badgeBg: '#E0E7FF', badgeColor: '#4338CA', desc: 'Digital focus, identity & study routines', icon: '🎧' },
              ].map((opt) => {
                const isSelected = ageCategory === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.8}
                    onPress={() => setAgeCategory(opt.id)}
                    style={[
                      styles.gridCardAge,
                      isSelected && styles.gridCardAgeSelected,
                    ]}
                  >
                    <View style={styles.cardEmojiCircle}>
                      <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                    </View>
                    <Text style={styles.cardAgeTitle}>{opt.label}</Text>
                    <View style={[styles.cardAgeBadge, { backgroundColor: opt.badgeBg }]}>
                      <Text style={[styles.cardAgeBadgeText, { color: opt.badgeColor }]}>{opt.badge}</Text>
                    </View>
                    <Text style={styles.cardAgeDesc} numberOfLines={2}>{opt.desc}</Text>

                    <View style={styles.radioContainer}>
                      {isSelected ? (
                        <View style={styles.radioCheckSolid}>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>✓</Text>
                        </View>
                      ) : (
                        <View style={styles.radioEmptyCircle} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* 8th Card: Not sure yet? (Warm Yellow Card) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setAgeCategory('4_5');
                  setCurrentStep(2);
                }}
                style={styles.gridCardNotSure}
              >
                <View style={styles.cardEmojiCircleWarm}>
                  <Text style={{ fontSize: 20 }}>⭐</Text>
                </View>
                <Text style={styles.cardNotSureTitle}>Not sure yet?</Text>
                <Text style={styles.cardNotSureDesc}>We'll help you personalize later</Text>
                <View style={styles.notSureArrowBtn}>
                  <Text style={{ color: '#78350F', fontSize: 12, fontWeight: '900' }}>→</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, !ageCategory && styles.btnDisabled]}
              disabled={!ageCategory}
              activeOpacity={0.8}
              onPress={() => setCurrentStep(2)}
            >
              <Text style={styles.continueBtnText}>Continue →</Text>
            </TouchableOpacity>

            <View style={styles.privacyGuaranteeRow}>
              <Text style={styles.privacyGuaranteeText}>🛡️ Your information is private and secure.</Text>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: DAILY SCREEN TIME (Exact recreation of Screen 2 reference) */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            {/* Top Row: Title + 3D Boy with Tablet Illustration */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={styles.stageTag}>
                  <Text style={styles.stageTagText}>⏱️ EXPOSURE DURATION</Text>
                </View>
                <Text style={styles.mainTitle}>How much screen time</Text>
                <Text style={[styles.mainTitle, { color: '#1E1B4B' }]}>does your child usually get?</Text>
                <Text style={styles.mainSub}>An estimate is completely fine.</Text>
              </View>

              {/* 3D Boy with Tablet Avatar */}
              <View style={{ width: 90, height: 90, borderRadius: 28, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 44 }}>👦</Text>
              </View>
            </View>

            {/* 6 Screen Time Option Cards Grid (2-column layout) */}
            <View style={styles.gridTwoCols}>
              {[
                { id: '2_3h' as DailyScreenTimeOption, label: '2–3 hours', sub: 'Common daily window', icon: '⏳' },
                { id: 'less_than_30m' as DailyScreenTimeOption, label: 'Less than 30 minutes', sub: 'Minimal exposure', icon: '⏱️' },
                { id: '30_60m' as DailyScreenTimeOption, label: '30–60 minutes', sub: 'Light daily routine', icon: '☀️' },
                { id: '1_2h' as DailyScreenTimeOption, label: '1–2 hours', sub: 'Moderate exposure', icon: '📖' },
                { id: '3_4h' as DailyScreenTimeOption, label: '3–4 hours', sub: 'Extended exposure', icon: '🎮' },
                { id: '4_6h' as DailyScreenTimeOption, label: '4–6 hours', sub: 'High recreational use', icon: '💻' },
              ].map((opt) => {
                const isSelected = dailyScreenTime === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.8}
                    onPress={() => setDailyScreenTime(opt.id)}
                    style={[
                      styles.gridCardTime,
                      isSelected && styles.gridCardTimeSelected,
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                      {isSelected ? (
                        <View style={styles.radioCheckSolid}>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>✓</Text>
                        </View>
                      ) : (
                        <View style={styles.radioEmptyCircle} />
                      )}
                    </View>
                    <Text style={styles.cardTimeTitle}>{opt.label}</Text>
                    <Text style={styles.cardTimeSub}>{opt.sub}</Text>
                    {isSelected && <View style={styles.selectedTimeIndicatorBar} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.estimatorHelperCard}
              activeOpacity={0.8}
              onPress={() => setShowEstimatorModal(true)}
            >
              <Text style={styles.estimatorHelperTitle}>🕒 Not sure about total hours?</Text>
              <Text style={styles.estimatorHelperAction}>Help me estimate →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.continueBtn, !dailyScreenTime && styles.btnDisabled]}
              disabled={!dailyScreenTime}
              activeOpacity={0.8}
              onPress={() => setCurrentStep(3)}
            >
              <Text style={styles.continueBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: WHAT DOES YOUR CHILD WATCH? (12 CATEGORIES) */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.stageTag}>
              <Text style={styles.stageTagText}>CONTENT ENVIRONMENT</Text>
            </View>
            <Text style={styles.mainTitle}>What usually appears on their screen?</Text>
            <Text style={styles.mainSub}>Select everything your child regularly watches or interacts with.</Text>

            <View style={styles.optionsList}>
              {[
                { id: 'nursery_rhymes' as ContentCategoryId, icon: '🎵', name: 'Nursery Rhymes & Songs', desc: 'Rhythmic music & animated tunes' },
                { id: 'educational' as ContentCategoryId, icon: '📚', name: 'Educational / Learning Content', desc: 'Science, phonics, numbers & nature' },
                { id: 'creative_crafts' as ContentCategoryId, icon: '🎨', name: 'Drawing, Craft & Creative Content', desc: 'Art tutorials, origami & DIY builds' },
                { id: 'cartoons_shows' as ContentCategoryId, icon: '🧸', name: "Cartoons & Children's Shows", desc: 'Narrative animations & animated TV' },
                { id: 'games_gaming' as ContentCategoryId, icon: '🎮', name: 'Games & Gaming Videos', desc: 'Roblox, Minecraft & gameplay streams' },
                { id: 'comedy_memes_shorts' as ContentCategoryId, icon: '😂', name: 'Comedy, Memes & Short Videos', desc: 'Fast-paced YouTube Shorts & viral clips' },
                { id: 'general_entertainment' as ContentCategoryId, icon: '🎬', name: 'General Entertainment', desc: 'Movies, family vlogs & music' },
                { id: 'scary_horror' as ContentCategoryId, icon: '👻', name: 'Scary / Horror Content', desc: 'Themes generally considered scary for children' },
                { id: 'profanity_vulgar' as ContentCategoryId, icon: '🤬', name: 'Profanity & Crude Humor', desc: 'Language considered inappropriate for age' },
                { id: 'sexualized_content' as ContentCategoryId, icon: '🔞', name: 'Sexualized / Mature Themes', desc: 'Mature content not intended for kids' },
                { id: 'violence_fighting' as ContentCategoryId, icon: '⚔️', name: 'Violence & Fighting Content', desc: 'Action combat & aggressive media' },
                { id: 'influencers_social' as ContentCategoryId, icon: '📱', name: 'Influencers & Social Media', desc: 'Streamers, challenge videos & lifestyle posts' },
                { id: 'not_sure' as ContentCategoryId, icon: '❓', name: 'Not sure', desc: 'No full visibility into all viewed media' },
                { id: 'something_else' as ContentCategoryId, icon: '✨', name: 'Something else', desc: 'Custom formats or unique hobbies' },
              ].map((cat) => {
                const isSelected = contentCategories.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.8}
                    onPress={() => toggleContentCategory(cat.id)}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  >
                    <View style={styles.optionLeft}>
                      <Text style={styles.optionEmoji}>{cat.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>{cat.name}</Text>
                        <Text style={styles.optionDesc}>{cat.desc}</Text>
                      </View>
                    </View>
                    <View style={[styles.checkboxSquare, isSelected && styles.checkboxSquareSelected]}>
                      {isSelected && <Text style={styles.radioCheck}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {contentCategories.includes('something_else') && (
              <TextInput
                style={styles.customTextInput}
                placeholder="E.g., Language learning apps, audiobooks, robotics..."
                placeholderTextColor="#94A3B8"
                value={customContentText}
                onChangeText={setCustomContentText}
              />
            )}

            <TouchableOpacity
              style={[styles.continueBtn, contentCategories.length === 0 && styles.btnDisabled]}
              disabled={contentCategories.length === 0}
              activeOpacity={0.8}
              onPress={() => setCurrentStep(4)}
            >
              <Text style={styles.continueBtnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SENSITIVE EXPOSURE FREQUENCY */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <View style={styles.stageTag}>
              <Text style={styles.stageTagText}>SAFETY & BOUNDARIES</Text>
            </View>
            <Text style={styles.mainTitle}>One more important question.</Text>
            <Text style={styles.mainSub}>
              Is your child regularly exposed to vulgar, sexualized, aggressive, or otherwise age-inappropriate language/content?
            </Text>

            <View style={styles.zeroJudgmentCard}>
              <Text style={styles.zeroJudgmentText}>
                ❤️ There is no judgment here. Honest answers help us make the assessment significantly more useful.
              </Text>
            </View>

            <View style={styles.optionsList}>
              {[
                { id: 'never' as InappropriateExposureFrequency, label: 'Never', desc: 'Strictly age-filtered environment', icon: '🛡️' },
                { id: 'rarely' as InappropriateExposureFrequency, label: 'Rarely', desc: 'Occasional accidental slip or mature video', icon: '🌱' },
                { id: 'sometimes' as InappropriateExposureFrequency, label: 'Sometimes', desc: 'Seen on gaming feeds, shorts, or sibling screens', icon: '⚡' },
                { id: 'often' as InappropriateExposureFrequency, label: 'Often', desc: 'Regularly part of gaming or social platforms', icon: '⚠️' },
                { id: 'very_often' as InappropriateExposureFrequency, label: 'Very often', desc: 'Frequent unfiltered media consumption', icon: '🚨' },
                { id: 'not_sure' as InappropriateExposureFrequency, label: "I'm not sure", desc: 'Independent media access without active monitoring', icon: '❓' },
              ].map((opt) => {
                const isSelected = inappropriateExposure === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.8}
                    onPress={() => setInappropriateExposure(opt.id)}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  >
                    <View style={styles.optionLeft}>
                      <Text style={styles.optionEmoji}>{opt.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>{opt.label}</Text>
                        <Text style={styles.optionDesc}>{opt.desc}</Text>
                      </View>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <Text style={styles.radioCheck}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, !inappropriateExposure && styles.btnDisabled]}
              disabled={!inappropriateExposure}
              activeOpacity={0.8}
              onPress={() => setCurrentStep(5)}
            >
              <Text style={styles.continueBtnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: OPTIONAL CONTEXT QUESTIONS */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <View style={styles.stepContainer}>
            <View style={styles.stageTag}>
              <Text style={styles.stageTagText}>BEHAVIORAL CONTEXT (OPTIONAL)</Text>
            </View>
            <Text style={styles.mainTitle}>A little more context helps.</Text>
            <Text style={styles.mainSub}>
              Screen-time duration alone cannot reliably predict a child's wellbeing. Context matters.
            </Text>

            {/* Q1: When do they use screens? */}
            <View style={styles.contextBox}>
              <Text style={styles.contextBoxLabel}>When does your child use screens most?</Text>
              <View style={styles.chipRow}>
                {[
                  { id: 'before_school' as ScreenTimeTiming, label: 'Before school' },
                  { id: 'after_school' as ScreenTimeTiming, label: 'After school' },
                  { id: 'during_meals' as ScreenTimeTiming, label: 'During meals' },
                  { id: 'before_bedtime' as ScreenTimeTiming, label: 'Before bedtime 🌙' },
                  { id: 'during_travel' as ScreenTimeTiming, label: 'During travel' },
                  { id: 'when_bored' as ScreenTimeTiming, label: 'When bored' },
                  { id: 'when_upset' as ScreenTimeTiming, label: 'When upset / emotional' },
                  { id: 'throughout_day' as ScreenTimeTiming, label: 'Throughout day' },
                ].map((timing) => {
                  const isSelected = usageTimings.includes(timing.id);
                  return (
                    <TouchableOpacity
                      key={timing.id}
                      activeOpacity={0.8}
                      onPress={() => toggleTiming(timing.id)}
                      style={[styles.contextChip, isSelected && styles.contextChipActive]}
                    >
                      <Text style={[styles.contextChipText, isSelected && styles.contextChipTextActive]}>
                        {timing.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Q2: Reaction when screen time ends */}
            <View style={styles.contextBox}>
              <Text style={styles.contextBoxLabel}>How does your child react when screen time ends?</Text>
              <View style={styles.reactionGrid}>
                {[
                  { id: 'stops_easily' as TransitionReaction, label: 'Stops easily', emoji: '🟢' },
                  { id: 'asks_for_more' as TransitionReaction, label: 'Asks for more', emoji: '🟡' },
                  { id: 'becomes_frustrated' as TransitionReaction, label: 'Frustrated', emoji: '🟠' },
                  { id: 'gets_very_upset' as TransitionReaction, label: 'Very upset', emoji: '🔴' },
                  { id: 'frequent_tantrums' as TransitionReaction, label: 'Tantrums', emoji: '⚡' },
                  { id: 'it_varies' as TransitionReaction, label: 'It varies', emoji: '🔄' },
                ].map((re) => {
                  const isSelected = transitionReaction === re.id;
                  return (
                    <TouchableOpacity
                      key={re.id}
                      activeOpacity={0.8}
                      onPress={() => setTransitionReaction(re.id)}
                      style={[styles.reactionBtn, isSelected && styles.reactionBtnActive]}
                    >
                      <Text style={{ fontSize: 13 }}>{re.emoji}</Text>
                      <Text style={[styles.reactionBtnText, isSelected && styles.reactionBtnTextActive]}>
                        {re.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Q3: Outside screen activities */}
            <View style={styles.contextBox}>
              <Text style={styles.contextBoxLabel}>How often do they do these outside screen time?</Text>
              <View style={styles.chipRow}>
                {[
                  { id: 'outdoor_play' as OffScreenActivity, label: '🏃 Outdoor / Active Play' },
                  { id: 'reading' as OffScreenActivity, label: '📖 Reading / Storytime' },
                  { id: 'creative_activities' as OffScreenActivity, label: '🎨 Art / Building' },
                  { id: 'social_family' as OffScreenActivity, label: '👨‍👩‍👧 Family Boardgames' },
                  { id: 'hobbies' as OffScreenActivity, label: '🧩 Hobbies / Music' },
                  { id: 'not_much_currently' as OffScreenActivity, label: '⚠️ Not much currently' },
                ].map((act) => {
                  const isSelected = offScreenActivities.includes(act.id);
                  return (
                    <TouchableOpacity
                      key={act.id}
                      activeOpacity={0.8}
                      onPress={() => toggleActivity(act.id)}
                      style={[styles.contextChip, isSelected && styles.contextChipActive]}
                    >
                      <Text style={[styles.contextChipText, isSelected && styles.contextChipTextActive]}>
                        {act.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueBtnGradient}
              activeOpacity={0.8}
              onPress={() => setCurrentStep(6)}
            >
              <Text style={styles.continueBtnText}>Generate Snapshot ✨</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: ANIMATED TELEMETRY TRANSITION */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <View style={styles.telemetryContainer}>
            <View style={styles.telemetryMascotCircle}>
              <BuddyMascotNative size={100} animated={false} />
            </View>
            <View style={styles.stageTag}>
              <Text style={styles.stageTagText}>PEDIATRIC WELLBEING SYNTHESIS</Text>
            </View>
            <Text style={styles.telemetryMainTitle}>Analyzing your child's digital environment...</Text>
            <Text style={styles.telemetrySub}>{telemetryPhase}</Text>

            <View style={styles.telemetryBarBg}>
              <View style={[styles.telemetryBarFill, { width: `${telemetryProgress}%` }]} />
            </View>
            <Text style={styles.telemetryProgressText}>{telemetryProgress}% synthesized</Text>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: FINAL COMPREHENSIVE REPORT */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <View style={styles.reportContainer}>
            {/* Header Hero Banner */}
            <View style={styles.reportHeroCard}>
              <View style={styles.reportHeroTagRow}>
                <View style={styles.reportHeroTag}>
                  <Text style={styles.reportHeroTagText}>DIGITAL WELLBEING SNAPSHOT</Text>
                </View>
                <Text style={styles.reportHeroAgeText}>Age: {getAgeLabel(ageCategory)}</Text>
              </View>
              <Text style={styles.reportHeroTitle}>
                {childName.trim() ? `${childName.trim()}'s Screen Exposure Snapshot` : "Your Child's Screen Exposure Snapshot"}
              </Text>
              <Text style={styles.reportHeroSub}>
                Educational analysis based on your responses, developmental benchmarks, and pediatric digital media research.
              </Text>
            </View>

            {/* Disclaimer */}
            <View style={styles.reportDisclaimerCard}>
              <Text style={styles.reportDisclaimerTitle}>ℹ️ Educational Notice:</Text>
              <Text style={styles.reportDisclaimerText}>
                This is an educational risk snapshot based on the information you provided and research on children's digital-media exposure. It is not a medical diagnosis or a deterministic prediction of your child's future behavior.
              </Text>
            </View>

            {/* Section 1: Screen Exposure */}
            <View style={styles.reportCard}>
              <View style={styles.reportSectionHeaderRow}>
                <Text style={styles.reportSectionIndex}>SECTION 1</Text>
                <Text style={styles.reportExposurePill}>Daily Exposure: ~{hoursNum} hrs/day</Text>
              </View>
              <Text style={styles.reportCardTitle}>Daily Screen Exposure & Displacement</Text>
              <Text style={styles.reportCardDesc}>
                Longer recreational screen exposure can displace sleep, physical activity, face-to-face interaction, and other developmentally valuable activities. The impact depends heavily on what the child is watching, when they use screens, and what activities screens replace.
              </Text>
              <View style={styles.metricsTripleRow}>
                <View style={styles.metricTripleItem}>
                  <Text style={styles.metricTripleLabel}>Est. Weekly</Text>
                  <Text style={styles.metricTripleValue}>~{Math.round(hoursNum * 7)}h</Text>
                </View>
                <View style={styles.metricTripleItem}>
                  <Text style={styles.metricTripleLabel}>Bedtime</Text>
                  <Text style={[styles.metricTripleValue, { color: hasBedtimeUsage ? '#D97706' : '#059669', fontSize: 11 }]}>
                    {hasBedtimeUsage ? '🌙 Active' : '✨ Protected'}
                  </Text>
                </View>
                <View style={styles.metricTripleItem}>
                  <Text style={styles.metricTripleLabel}>Active Areas</Text>
                  <Text style={styles.metricTripleValue}>{offScreenActivities.length} Types</Text>
                </View>
              </View>
            </View>

            {/* Section 2: Content Mix */}
            <View style={styles.reportCard}>
              <View style={styles.reportSectionHeaderRow}>
                <Text style={styles.reportSectionIndex}>SECTION 2</Text>
                <Text style={styles.reportContentPill}>{contentCategories.length} Content Types</Text>
              </View>
              <Text style={styles.reportCardTitle}>Content Environment & Pacing</Text>
              <Text style={styles.reportCardDesc}>
                Content matters, not just screen duration. Educational, interactive, age-appropriate content can have very different implications from content that is violent, sexualized, or designed around rapid engagement.
              </Text>
              <View style={styles.chipRow}>
                {contentCategories.map((c) => {
                  const isSensitive = ['scary_horror', 'profanity_vulgar', 'sexualized_content', 'violence_fighting'].includes(c);
                  const isEdu = ['educational', 'creative_crafts', 'nursery_rhymes'].includes(c);
                  return (
                    <View
                      key={c}
                      style={[
                        styles.contentBadgePill,
                        isSensitive
                          ? styles.contentBadgeSensitive
                          : isEdu
                          ? styles.contentBadgeEdu
                          : styles.contentBadgeGeneral,
                      ]}
                    >
                      <Text style={styles.contentBadgePillText}>
                        {isSensitive ? '🔴 ' : isEdu ? '🟢 ' : '🟡 '}
                        {c.replace('_', ' ')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Possible Developmental Risks */}
            <View style={styles.reportCard}>
              <View style={styles.reportSectionHeaderRow}>
                <Text style={styles.reportSectionIndex}>SECTION 3</Text>
                <TouchableOpacity
                  style={styles.researchLinkBtn}
                  activeOpacity={0.8}
                  onPress={() => setShowResearchModal(true)}
                >
                  <Text style={styles.researchLinkBtnText}>📖 Learn research →</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reportCardTitle}>What could this pattern influence?</Text>
              <Text style={styles.reportCardDesc}>
                High recreational screen exposure, particularly when it replaces sleep or active/social experiences, has been associated with less favorable outcomes in some studies. Individual outcomes vary considerably.
              </Text>

              <View style={styles.domainsList}>
                {developmentalDomains.map((dom) => {
                  const isElevated = dom.level === 'elevated';
                  const isMod = dom.level === 'moderate';
                  return (
                    <View key={dom.domain} style={styles.domainItemCard}>
                      <View style={styles.domainItemHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Text style={{ fontSize: 15 }}>{dom.icon}</Text>
                          <Text style={styles.domainItemTitle}>{dom.domain}</Text>
                        </View>
                        <View
                          style={[
                            styles.riskBadge,
                            isElevated ? styles.riskBadgeElevated : isMod ? styles.riskBadgeMod : styles.riskBadgeLow,
                          ]}
                        >
                          <Text
                            style={[
                              styles.riskBadgeText,
                              isElevated
                                ? styles.riskBadgeTextElevated
                                : isMod
                                ? styles.riskBadgeTextMod
                                : styles.riskBadgeTextLow,
                            ]}
                          >
                            {isElevated ? 'Elevated Concern' : isMod ? 'Moderate Concern' : 'Low Concern'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.domainItemSummary}>{dom.summary}</Text>
                      <Text style={styles.domainItemSource}>Source: {dom.researchBasis}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Age Specific Insight */}
            <View style={styles.reportCard}>
              <View style={styles.reportSectionHeaderRow}>
                <Text style={styles.reportSectionIndex}>SECTION 4</Text>
                <Text style={styles.reportExposurePill}>{getAgeLabel(ageCategory)} Focus</Text>
              </View>
              <Text style={styles.reportCardTitle}>Why this matters as they grow</Text>
              <Text style={styles.reportCardDesc}>
                {ageCategory === 'under_2' &&
                  'Under age 2, unstructured sensory play, face-to-face vocal interactions, and restful sleep form the core foundation of neural development. Passive media has limited transfer.'}
                {ageCategory === '2_3' &&
                  'At age 2–3, language vocabulary, tactile sensory play, and caregiver co-viewing are paramount. Interactive back-and-forth communication supports language far better than solitary screen viewing.'}
                {ageCategory === '4_5' &&
                  'At age 4–5, routines, sleep, language development, active play, and caregiver interaction are especially important parts of a child\'s environment.'}
                {ageCategory === '6_7' &&
                  'At age 6–7, sustained attention, early reading habits, peer playground interactions, and predictable sleep times become critical as formal schooling begins.'}
                {ageCategory === '8_10' &&
                  'At age 8–10, independent media use, self-regulation, learning routines, peer relationships, and sleep become increasingly important.'}
                {ageCategory === '11_13' &&
                  'At age 11–13, social media literacy, digital boundary self-management, critical thinking, and protecting sleep hours are the primary focus.'}
                {ageCategory === '14_plus' &&
                  'At age 14+, balance between academic digital work, recreation, deep focus sessions, and physical wellbeing dictates long-term executive function habits.'}
              </Text>
            </View>

            {/* Section 5: Transition Signals */}
            <View style={styles.reportCard}>
              <View style={styles.reportSectionHeaderRow}>
                <Text style={styles.reportSectionIndex}>SECTION 5</Text>
                <Text style={styles.reportContentPill}>Transition Signal</Text>
              </View>
              <Text style={styles.reportCardTitle}>Screen Transition Signal</Text>
              <Text style={styles.reportCardDesc}>
                {hasTransitionTrouble
                  ? 'Your answers indicate that stopping screen use may sometimes be difficult. Frequent conflict around stopping screens can be a useful signal to review boundaries, transition routines, and the role screens play in your child’s daily schedule.'
                  : 'Your answers indicate relatively smooth screen-ending transitions. Preserving predictable cues and keeping boundaries clear ensures this positive habit remains stable.'}
              </Text>
            </View>

            {/* Section 6: Biggest Opportunity */}
            <View style={[styles.opportunityCard, { backgroundColor: topOpportunity.color }]}>
              <View style={styles.oppBadge}>
                <Text style={styles.oppBadgeText}>{topOpportunity.badge}</Text>
              </View>
              <Text style={styles.oppTitle}>{topOpportunity.title}</Text>
              <Text style={styles.oppDesc}>{topOpportunity.desc}</Text>
            </View>

            {/* Section 7: Core Feature & Modes */}
            <View style={styles.engineCard}>
              <Text style={styles.engineHeaderBadge}>AUTOMATED ENDING ENGINE</Text>
              <Text style={styles.engineTitle}>Make Screen Time End Automatically</Text>
              <Text style={styles.engineSub}>
                Choose what happens when the timer finishes. No yelling, no blame.
              </Text>

              <View style={styles.engineModesRow}>
                {/* Monster Mode Card */}
                <View style={styles.modeBox}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>👾</Text>
                  <Text style={styles.modeBoxTitle}>Monster Mode</Text>
                  <Text style={styles.modeBoxDesc}>Playful spooky character appears with sleepy dialogue.</Text>
                  <TouchableOpacity
                    style={styles.modePreviewBtn}
                    activeOpacity={0.8}
                    onPress={() => setPreviewMonsterModal(selectedMonster)}
                  >
                    <Text style={styles.modePreviewBtnText}>Preview Monsters (8)</Text>
                  </TouchableOpacity>
                </View>

                {/* Switch-Off Mode Card */}
                <View style={styles.modeBox}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>🔋</Text>
                  <Text style={styles.modeBoxTitle}>Switch-Off Mode</Text>
                  <Text style={styles.modeBoxDesc}>Realistic simulated battery rest or system power-down.</Text>
                  <TouchableOpacity
                    style={styles.modePreviewBtnSec}
                    activeOpacity={0.8}
                    onPress={() => setPreviewSwitchOffModal(selectedSwitchOff)}
                  >
                    <Text style={styles.modePreviewBtnText}>Preview Illusions (6)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.actionPlanBtn}
                activeOpacity={0.8}
                onPress={handleFinishOnboarding}
              >
                <Text style={styles.actionPlanBtnText}>
                  Create {childName.trim() ? `${childName.trim()}'s` : "My Child's"} Screen Plan →
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sourcesFootBtn}
                activeOpacity={0.8}
                onPress={() => setShowResearchModal(true)}
              >
                <Text style={styles.sourcesFootBtnText}>📖 Explore Research Citations & Sources</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL 1: ESTIMATOR MODAL */}
      {/* ========================================================================= */}
      <Modal visible={showEstimatorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Daily Screen-Time Estimator</Text>
              <TouchableOpacity onPress={() => setShowEstimatorModal(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHeaderSub}>
              Tell us approximately how many sessions per day and the average duration.
            </Text>

            <Text style={styles.modalFieldLabel}>How many times per day? ({sessionsPerDay}x)</Text>
            <View style={styles.modalOptionRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSessionsPerDay(s)}
                  style={[styles.miniPill, sessionsPerDay === s && styles.miniPillActive]}
                >
                  <Text style={[styles.miniPillText, sessionsPerDay === s && styles.miniPillTextActive]}>{s}x</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalFieldLabel}>Average session duration ({minutesPerSession} mins)</Text>
            <View style={styles.modalOptionRow}>
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMinutesPerSession(m)}
                  style={[styles.miniPill, minutesPerSession === m && styles.miniPillActive]}
                >
                  <Text style={[styles.miniPillText, minutesPerSession === m && styles.miniPillTextActive]}>{m}m</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalCalculatedBox}>
              <Text style={styles.modalCalcLabel}>Estimated Daily Total:</Text>
              <Text style={styles.modalCalcVal}>
                {Math.round(((sessionsPerDay * minutesPerSession) / 60) * 10) / 10} hours / day
              </Text>
            </View>

            <TouchableOpacity style={styles.modalApplyBtn} onPress={handleApplyEstimator}>
              <Text style={styles.modalApplyBtnText}>Apply to Assessment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: RESEARCH MODAL */}
      {/* ========================================================================= */}
      <Modal visible={showResearchModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { maxHeight: '82%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Research & Evidence Sources</Text>
              <TouchableOpacity onPress={() => setShowResearchModal(false)}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHeaderSub}>
              All insights follow verified peer-reviewed pediatric literature (AAP, WHO, JAMA Pediatrics, NIH).
            </Text>

            <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
              {RESEARCH_CITATIONS.map((cit) => (
                <View key={cit.id} style={styles.citationCard}>
                  <View style={styles.citationTitleRow}>
                    <Text style={styles.citationTitle}>{cit.title}</Text>
                    <Text style={styles.citationYear}>{cit.year}</Text>
                  </View>
                  <Text style={styles.citationSource}>{cit.source}</Text>
                  <Text style={styles.citationFinding}>"{cit.keyFinding}"</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setShowResearchModal(false)}>
              <Text style={styles.modalApplyBtnText}>Close Sources</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: MONSTER SELECTOR MODAL */}
      {/* ========================================================================= */}
      <Modal visible={previewMonsterModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialogDark, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitleDark}>Monster Mode Selector (8 Characters)</Text>
              <TouchableOpacity onPress={() => setPreviewMonsterModal(null)}>
                <Text style={styles.modalCloseXDark}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {MONSTER_PROFILES.map((mon) => {
                const isSelected = selectedMonster === mon.id;
                return (
                  <TouchableOpacity
                    key={mon.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedMonster(mon.id)}
                    style={[styles.monsterCard, isSelected && styles.monsterCardSelected]}
                  >
                    <Text style={{ fontSize: 28 }}>{mon.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={styles.monsterHeaderRow}>
                        <Text style={styles.monsterName}>{mon.name}</Text>
                        <Text style={styles.monsterBadge}>{mon.badge}</Text>
                      </View>
                      <Text style={styles.monsterDesc}>{mon.description}</Text>
                      <View style={styles.monsterQuoteBox}>
                        <Text style={styles.monsterQuoteText}>"{mon.dialogue}"</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalApplyBtnPurple}
              onPress={() => setPreviewMonsterModal(null)}
            >
              <Text style={styles.modalApplyBtnText}>Confirm Monster Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: SWITCH-OFF SELECTOR MODAL */}
      {/* ========================================================================= */}
      <Modal visible={previewSwitchOffModal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialogDark, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitleDark}>Switch-Off Illusion Selector (6 Styles)</Text>
              <TouchableOpacity onPress={() => setPreviewSwitchOffModal(null)}>
                <Text style={styles.modalCloseXDark}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {SWITCH_OFF_PROFILES.map((sw) => {
                const isSelected = selectedSwitchOff === sw.id;
                return (
                  <TouchableOpacity
                    key={sw.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedSwitchOff(sw.id)}
                    style={[styles.monsterCard, isSelected && styles.monsterCardSelected]}
                  >
                    <Text style={{ fontSize: 28 }}>{sw.icon}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={styles.monsterHeaderRow}>
                        <Text style={styles.monsterName}>{sw.title}</Text>
                        <Text style={styles.monsterBadge}>{sw.badge}</Text>
                      </View>
                      <Text style={styles.monsterDesc}>{sw.description}</Text>
                      <View style={styles.stagesRow}>
                        {sw.stages.map((stg, i) => (
                          <View key={i} style={styles.stageChip}>
                            <Text style={styles.stageChipText}>{stg}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalApplyBtnPurple}
              onPress={() => setPreviewSwitchOffModal(null)}
            >
              <Text style={styles.modalApplyBtnText}>Confirm Simulation Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingTop: 8,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4A5568',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#5D997C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1A2436',
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EBF4EF',
    borderRadius: 10,
  },
  skipBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5D997C',
  },
  stepCounterText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  progressNum: {
    fontSize: 11,
    fontWeight: '900',
  },
  progressNumActive: {
    color: '#5D997C',
  },
  progressNumDone: {
    color: '#1A2436',
  },
  progressNumIdle: {
    color: '#CBD5E1',
  },
  progressLine: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    marginHorizontal: 6,
  },
  progressLineDone: {
    backgroundColor: '#5D997C',
  },
  progressLineActive: {
    backgroundColor: '#A8D5BA',
  },
  progressLineIdle: {
    backgroundColor: '#EAE5DE',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  stepContainer: {
    paddingTop: 4,
  },
  stageTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  stageTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#2D5A43',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A2436',
    lineHeight: 28,
    marginBottom: 4,
  },
  mainSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 12,
  },
  reassuranceCard: {
    backgroundColor: '#EBF4EF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(93, 153, 124, 0.3)',
    marginBottom: 14,
  },
  reassuranceText: {
    fontSize: 11.5,
    color: '#2D5A43',
    lineHeight: 16,
    fontWeight: '600',
  },
  optionsList: {
    gap: 8,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: '#5D997C',
    backgroundColor: '#EBF4EF',
    borderWidth: 2,
    shadowColor: '#5D997C',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A2436',
  },
  optPill: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#718096',
  },
  optionDesc: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  exposureBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#5D997C',
    marginTop: 3,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
  },
  radioCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareSelected: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
  },
  customTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12,
    color: '#1A2436',
    fontWeight: '600',
    marginBottom: 14,
  },
  zeroJudgmentCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginBottom: 14,
  },
  zeroJudgmentText: {
    fontSize: 11.5,
    color: '#718096',
    lineHeight: 16,
    fontWeight: '600',
  },
  estimatorHelperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  estimatorHelperTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1A2436',
  },
  estimatorHelperAction: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#5D997C',
  },
  contextBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginBottom: 12,
  },
  contextBoxLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1A2436',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  contextChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  contextChipActive: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
  },
  contextChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A5568',
  },
  contextChipTextActive: {
    color: '#FFFFFF',
  },
  reactionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    backgroundColor: '#FAF8F5',
  },
  reactionBtnActive: {
    borderColor: '#5D997C',
    backgroundColor: '#EBF4EF',
  },
  reactionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A5568',
  },
  reactionBtnTextActive: {
    color: '#2D5A43',
    fontWeight: '900',
  },
  continueBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  continueBtnGradient: {
    backgroundColor: '#5D997C',
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.45,
  },

  // Telemetry Step
  telemetryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  telemetryMascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EBF4EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  telemetryMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A2436',
    textAlign: 'center',
    marginBottom: 8,
  },
  telemetrySub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5D997C',
    textAlign: 'center',
    marginBottom: 24,
    minHeight: 34,
  },
  telemetryBarBg: {
    width: '80%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EAE5DE',
    overflow: 'hidden',
    marginBottom: 8,
  },
  telemetryBarFill: {
    height: '100%',
    backgroundColor: '#5D997C',
    borderRadius: 4,
  },
  telemetryProgressText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },

  // Report Section Styles
  reportContainer: {
    gap: 14,
  },
  reportHeroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  reportHeroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportHeroTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reportHeroTagText: {
    color: '#C7D2FE',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  reportHeroAgeText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '900',
  },
  reportHeroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 25,
    marginBottom: 4,
  },
  reportHeroSub: {
    fontSize: 11,
    color: '#C7D2FE',
    lineHeight: 15,
  },
  reportDisclaimerCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reportDisclaimerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#92400E',
    marginBottom: 2,
  },
  reportDisclaimerText: {
    fontSize: 10.5,
    color: '#92400E',
    lineHeight: 15,
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  reportSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reportSectionIndex: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  reportExposurePill: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reportContentPill: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reportCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  reportCardDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 10,
  },
  metricsTripleRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'space-around',
  },
  metricTripleItem: {
    alignItems: 'center',
  },
  metricTripleLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 2,
  },
  metricTripleValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  contentBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  contentBadgeEdu: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  contentBadgeSensitive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  contentBadgeGeneral: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  contentBadgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  researchLinkBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  researchLinkBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#4F46E5',
  },
  domainsList: {
    gap: 8,
    marginTop: 4,
  },
  domainItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  domainItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  domainItemTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  riskBadgeElevated: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  riskBadgeMod: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  riskBadgeLow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  riskBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  riskBadgeTextElevated: {
    color: '#E11D48',
  },
  riskBadgeTextMod: {
    color: '#D97706',
  },
  riskBadgeTextLow: {
    color: '#059669',
  },
  domainItemSummary: {
    fontSize: 10.5,
    color: '#475569',
    lineHeight: 14.5,
  },
  domainItemSource: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  opportunityCard: {
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  oppBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  oppBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  oppTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  oppDesc: {
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 15,
    opacity: 0.95,
  },

  // Ending Engine Card
  engineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  engineHeaderBadge: {
    color: '#5D997C',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginBottom: 4,
  },
  engineTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A2436',
    textAlign: 'center',
    marginBottom: 4,
  },
  engineSub: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 16,
  },
  engineModesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modeBox: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    justifyContent: 'space-between',
  },
  modeBoxTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1A2436',
    marginBottom: 2,
  },
  modeBoxDesc: {
    fontSize: 10,
    color: '#718096',
    lineHeight: 13,
    marginBottom: 8,
  },
  modePreviewBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  modePreviewBtnSec: {
    backgroundColor: '#EAE5DE',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  modePreviewBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  actionPlanBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  actionPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  sourcesFootBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  sourcesFootBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    width: '100%',
    maxWidth: 380,
  },
  modalDialogDark: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 18,
    width: '100%',
    maxWidth: 380,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalHeaderTitleDark: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalCloseX: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '800',
    padding: 4,
  },
  modalCloseXDark: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '800',
    padding: 4,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 15,
  },
  modalFieldLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  modalOptionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  miniPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  miniPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  miniPillTextActive: {
    color: '#FFFFFF',
  },
  modalCalculatedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
  modalCalcLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3730A3',
  },
  modalCalcVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4338CA',
  },
  modalApplyBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalApplyBtnPurple: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  citationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  citationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  citationTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  citationYear: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  citationSource: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  citationFinding: {
    fontSize: 10.5,
    color: '#334155',
    lineHeight: 14,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  monsterCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  monsterCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#1E1B4B',
  },
  monsterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monsterName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  monsterBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  monsterDesc: {
    fontSize: 10,
    color: '#CBD5E1',
    lineHeight: 13,
    marginTop: 2,
  },
  monsterQuoteBox: {
    marginTop: 6,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 6,
  },
  monsterQuoteText: {
    fontSize: 9.5,
    color: '#A5B4FC',
    fontStyle: 'italic',
  },
  stagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  stageChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stageChipText: {
    fontSize: 8.5,
    color: '#94A3B8',
  },
  // Refactored Stepper & Grid Styles
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  stepperNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperNodeActive: {
    backgroundColor: '#5438DC',
    shadowColor: '#5438DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepperNodeDone: {
    backgroundColor: '#5438DC',
  },
  stepperNodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepperNodeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  stepperNodeTextDone: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  stepperTrack: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    borderRadius: 1,
    overflow: 'hidden',
  },
  stepperTrackFill: {
    height: '100%',
    backgroundColor: '#5438DC',
  },
  sparkleIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  gridTwoCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  gridCardAge: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  gridCardAgeSelected: {
    borderColor: '#5438DC',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#5438DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardEmojiCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardAgeTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  cardAgeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginTop: 1,
  },
  cardAgeBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  cardAgeDesc: {
    fontSize: 8.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 10,
  },
  radioContainer: {
    marginTop: 3,
  },
  radioCheckSolid: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#5438DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioEmptyCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  gridCardNotSure: {
    width: '48%',
    backgroundColor: '#FFFDF5',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  cardEmojiCircleWarm: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardNotSureTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#78350F',
    textAlign: 'center',
  },
  cardNotSureDesc: {
    fontSize: 8.5,
    color: '#92400E',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 10,
  },
  notSureArrowBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  privacyGuaranteeRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  privacyGuaranteeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  gridCardTime: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 95,
    justifyContent: 'space-between',
  },
  gridCardTimeSelected: {
    borderColor: '#5438DC',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#5438DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTimeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 6,
  },
  cardTimeSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  selectedTimeIndicatorBar: {
    position: 'absolute',
    bottom: 4,
    left: 14,
    right: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(84, 56, 220, 0.4)',
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  devBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  devTag: {
    backgroundColor: '#D97706',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  devTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  devHint: {
    fontSize: 9.5,
    color: '#92400E',
    fontWeight: '600',
  },
  devSkipBtn: {
    backgroundColor: '#78350F',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  devSkipBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FEF3C7',
  },
  childNameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#5438DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  childNameLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#5438DC',
    letterSpacing: 0.8,
  },
  childNameOptionalTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  childNameInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
});
