import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Vibration,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ShutdownSimulationNative } from '../src/components/Simulation/ShutdownSimulationNative';

export default function WidgetScreen() {
  const params = useLocalSearchParams<{ action?: string; minutes?: string }>();
  const router = useRouter();

  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(false);
  const [activeSessionMinutes, setActiveSessionMinutes] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [showShutdownSimulation, setShowShutdownSimulation] = useState<boolean>(false);

  // Read initial query params from widget click
  useEffect(() => {
    if (params.minutes) {
      const mins = parseInt(params.minutes, 10);
      if (!isNaN(mins) && mins > 0) {
        startWidgetTimer(mins);
      }
    } else if (params.action === 'open') {
      setIsWidgetExpanded(true);
    }
  }, [params.minutes, params.action]);

  const startWidgetTimer = (mins: number) => {
    const total = mins * 60;
    setActiveSessionMinutes(mins);
    setTotalSeconds(total);
    setRemainingSeconds(total);
    setIsSessionActive(true);
    setShowShutdownSimulation(false);
    try {
      Vibration.vibrate(40);
    } catch { }
  };

  // Active countdown ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSessionActive && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsSessionActive(false);
            setShowShutdownSimulation(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isSessionActive && remainingSeconds <= 0) {
      setIsSessionActive(false);
      setShowShutdownSimulation(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, remainingSeconds]);

  // When parent unlocks via capital 'A'
  const handlePatternUnlocked = () => {
    setShowShutdownSimulation(false);
    setIsSessionActive(false);
    setActiveSessionMinutes(null);
    router.replace('/');
  };

  // If shutdown simulation is triggered, render full-screen simulation
  if (showShutdownSimulation) {
    return (
      <ShutdownSimulationNative
        childName="Child"
        onUnlocked={handlePatternUnlocked}
        onInstantBypass={handlePatternUnlocked}
      />
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    totalSeconds > 0 ? Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
          accessibilityLabel="Back to Dashboard"
        >
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BabyBoo Widget</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ACTIVE COUNTDOWN VIEW */}
        {isSessionActive && (
          <View style={styles.activeCard}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Background Countdown Running</Text>
            </View>

            <Text style={styles.activeTimerText}>{formatTime(remainingSeconds)}</Text>
            <Text style={styles.activeSubText}>
              {activeSessionMinutes}-Minute Screen Time Active
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            {/* Instant Fast-Forward button to simulate timer hitting clock */}
            <TouchableOpacity
              style={styles.fastForwardBtn}
              onPress={() => setRemainingSeconds(1)}
            >
              <Text style={styles.fastForwardText}>
                ⚡ Jump to 1s (Simulate Timer Hit)
              </Text>
            </TouchableOpacity>

            <Text style={styles.countdownHint}>
              When this timer hits zero, phone will simulate battery drain & shutdown, and turn completely black.
            </Text>
          </View>
        )}

        {/* WIDGET SHOWCASE & EXPANDABLE PREVIEW */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Home Screen Widget</Text>
          <Text style={styles.sectionSubtitle}>
            This interactive preview demonstrates the exact workflow of your Android home screen widget:
          </Text>

          {/* Interactive Widget Container */}
          <View style={styles.widgetDemoBox}>
            {!isWidgetExpanded ? (
              /* 1. COLLAPSED: Very small icon */
              <TouchableOpacity
                style={styles.smallWidgetIconBox}
                activeOpacity={0.8}
                onPress={() => setIsWidgetExpanded(true)}
              >
                <View style={styles.smallWidgetIconCircle}>
                  <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
                      fill="#5D997C"
                    />
                  </Svg>
                </View>
                <Text style={styles.smallWidgetLabel}>BabyBoo</Text>
                <View style={styles.tapToExpandBadge}>
                  <Text style={styles.tapToExpandText}>Tap to Expand</Text>
                </View>
              </TouchableOpacity>
            ) : (
              /* 2. EXPANDED: Selectable options appear */
              <View style={styles.expandedWidgetBox}>
                <View style={styles.expandedHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#5D997C">
                      <Circle cx="12" cy="12" r="10" />
                    </Svg>
                    <Text style={styles.expandedTitle}>Select Screen Time</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.collapseBtn}
                    onPress={() => setIsWidgetExpanded(false)}
                  >
                    <Text style={styles.collapseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.expandedDesc}>
                  Select a timing to automatically activate the background countdown:
                </Text>

                <View style={styles.optionsRow}>
                  {[10, 15, 30, 45, 60].map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[
                        styles.optionPill,
                        activeSessionMinutes === mins && styles.optionPillActive,
                      ]}
                      onPress={() => startWidgetTimer(mins)}
                    >
                      <Text
                        style={[
                          styles.optionPillText,
                          activeSessionMinutes === mins && styles.optionPillTextActive,
                        ]}
                      >
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* WORKFLOW GUIDE */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Complete Workflow Explained</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepHead}>Very Small Icon on Home Screen</Text>
              <Text style={styles.stepBody}>
                The widget starts as a clean, compact 1x1 icon on your home screen.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepHead}>Expands into Selectable Options</Text>
              <Text style={styles.stepBody}>
                Tap the icon and it smoothly expands into timing pills (10m, 15m, 30m, 45m, 60m).
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepHead}>Automatic Activation & Background Timer</Text>
              <Text style={styles.stepBody}>
                Tap a timing and the countdown immediately begins in the background.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>4</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepHead}>Battery Drain & Shutdown Simulation</Text>
              <Text style={styles.stepBody}>
                When the timer hits 0, the phone displays a critical battery drain warning, plays OS shutdown sequence, and powers off into complete pitch-black.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>5</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepHead}>Capital 'A' Pattern Unlock</Text>
              <Text style={styles.stepBody}>
                Swipe the letter "A" anywhere on the glass or across the 3x3 pattern dots to automatically unlock the phone.
              </Text>
            </View>
          </View>
        </View>

        {/* Back to Home Button */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.homeBtnText}>Return to Parent Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#EAE5DE',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2436',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2436',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#5D997C',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D5A43',
  },
  activeTimerText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1A2436',
    letterSpacing: 1,
  },
  activeSubText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5D997C',
    borderRadius: 4,
  },
  fastForwardBtn: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#C084FC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  fastForwardText: {
    color: '#7E22CE',
    fontSize: 12,
    fontWeight: '800',
  },
  countdownHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 15,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2436',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 16,
  },
  widgetDemoBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  smallWidgetIconBox: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FAF8F5',
    borderWidth: 2,
    borderColor: '#5D997C',
  },
  smallWidgetIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginBottom: 6,
  },
  smallWidgetLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
  },
  tapToExpandBadge: {
    marginTop: 6,
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tapToExpandText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2D5A43',
  },
  expandedWidgetBox: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#5D997C',
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expandedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A2436',
  },
  collapseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  expandedDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  optionPill: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionPillActive: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
  },
  optionPillTextActive: {
    color: '#FFFFFF',
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2436',
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EBF4EF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5D997C',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2D5A43',
  },
  stepHead: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
    marginBottom: 2,
  },
  stepBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  homeBtn: {
    backgroundColor: '#5D997C',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
