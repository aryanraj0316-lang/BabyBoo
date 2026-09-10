import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

export type TransitionOutcomeType = 'smooth' | 'resistance';

export interface ExitEffectStat {
  id: string;
  name: string;
  emoji: string;
  successRate: number; // 0 - 100
  totalSessions: number;
  avgGraceSeconds: number;
  highlightBadge?: string;
  color: string;
}

export interface SessionTimelineItem {
  id: string;
  startTime: string;
  durationMinutes: number;
  exitEffectName: string;
  exitEffectEmoji: string;
  activityName: string;
  outcome: TransitionOutcomeType;
  graceTakenSeconds: number;
  notes: string;
}

export interface AnalyticsInsightsProps {
  childName?: string;
  childAvatarInitial?: string;
  childAvatarColor?: string;
  onBack?: () => void;
  onNavigateControls?: () => void;
}

export const AnalyticsFeaturesHubNative: React.FC<AnalyticsInsightsProps> = ({
  childName = 'Leo',
  childAvatarInitial = 'L',
  childAvatarColor = '#6366F1',
  onBack,
  onNavigateControls,
}) => {
  const [timeframe, setTimeframe] = useState<'today' | '7days' | '30days'>('today');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'smooth' | 'resistance'>('all');

  // Overview Metrics
  const screenTimeTodayMinutes = 45;
  const weeklyAverageMinutes = 57;
  const peacefulTransitionsRate = 88; // 88%

  // Transition Effectiveness Data
  const exitEffectsData: ExitEffectStat[] = [
    {
      id: 'sleepy_mascot',
      name: 'Sleepy Mascot',
      emoji: '🧸',
      successRate: 94,
      totalSessions: 18,
      avgGraceSeconds: 22,
      highlightBadge: 'Top Performer',
      color: '#10B981',
    },
    {
      id: 'battery_dies',
      name: 'Battery Power Down',
      emoji: '🔋',
      successRate: 89,
      totalSessions: 14,
      avgGraceSeconds: 15,
      highlightBadge: 'Zero Conflict',
      color: '#3B82F6',
    },
    {
      id: 'bedtime_rest',
      name: 'Bedtime Rest Illusion',
      emoji: '🌙',
      successRate: 83,
      totalSessions: 12,
      avgGraceSeconds: 28,
      color: '#8B5CF6',
    },
    {
      id: 'cooldown_nap',
      name: 'Device Cooling Nap',
      emoji: '🌀',
      successRate: 78,
      totalSessions: 9,
      avgGraceSeconds: 35,
      color: '#F59E0B',
    },
  ];

  // Daily Timeline Log Sessions
  const pastSessions: SessionTimelineItem[] = [
    {
      id: 's_1',
      startTime: '5:45 PM',
      durationMinutes: 20,
      exitEffectName: 'Sleepy Mascot',
      exitEffectEmoji: '🧸',
      activityName: 'Creative Drawing',
      outcome: 'smooth',
      graceTakenSeconds: 18,
      notes: `${childName} cheerfully put the phone down upon hearing Buddy count down.`,
    },
    {
      id: 's_2',
      startTime: '2:15 PM',
      durationMinutes: 15,
      exitEffectName: 'Battery Dies',
      exitEffectEmoji: '🔋',
      activityName: 'Kids Simulator',
      outcome: 'smooth',
      graceTakenSeconds: 12,
      notes: 'Handed phone to mom saying "The phone is out of battery". No tears.',
    },
    {
      id: 's_3',
      startTime: '10:30 AM',
      durationMinutes: 25,
      exitEffectName: 'Bedtime Rest',
      exitEffectEmoji: '🌙',
      activityName: 'Educational Puzzles',
      outcome: 'resistance',
      graceTakenSeconds: 52,
      notes: 'Needed extra reminder after grace countdown finished before letting go.',
    },
    {
      id: 's_4',
      startTime: 'Yesterday 6:00 PM',
      durationMinutes: 30,
      exitEffectName: 'Sleepy Mascot',
      exitEffectEmoji: '🧸',
      activityName: 'Storybook Animation',
      outcome: 'smooth',
      graceTakenSeconds: 24,
      notes: 'Voluntary hand-off within 24s. Streak maintained.',
    },
  ];

  const filteredSessions = pastSessions.filter((s) => {
    if (timelineFilter === 'smooth') return s.outcome === 'smooth';
    if (timelineFilter === 'resistance') return s.outcome === 'resistance';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* 1. Top Navigation & Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.5}>
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Analytics & Insights</Text>
          <View style={styles.childSubtitleRow}>
            <View style={[styles.childBadgeDot, { backgroundColor: childAvatarColor }]}>
              <Text style={styles.childBadgeInitial}>{childAvatarInitial}</Text>
            </View>
            <Text style={styles.headerSubtitle}>Active Profile: {childName}</Text>
          </View>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* Main Scroll Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe Selector Pill Bar */}
        <View style={styles.timeframeRow}>
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
          ].map((tf) => (
            <TouchableOpacity
              key={tf.id}
              onPress={() => setTimeframe(tf.id as any)}
              style={[styles.timeframeChip, timeframe === tf.id && styles.timeframeChipActive]}
            >
              <Text style={[styles.timeframeText, timeframe === tf.id && styles.timeframeTextActive]}>
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 2. Overview Metric Cards */}
        <View style={styles.metricsGrid}>
          {/* Card 1: Total Screen Time Today */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricLabel}>Total Screen Time</Text>
              <View style={styles.metricIconBox}>
                <Text style={{ fontSize: 13 }}>⏱️</Text>
              </View>
            </View>

            <View style={styles.metricValueRow}>
              <Text style={styles.metricMainValue}>{screenTimeTodayMinutes}</Text>
              <Text style={styles.metricUnit}>mins</Text>
            </View>

            <View style={styles.trendRow}>
              <View style={styles.trendPill}>
                <Text style={styles.trendIcon}>↓</Text>
                <Text style={styles.trendText}>
                  {weeklyAverageMinutes - screenTimeTodayMinutes}m less
                </Text>
              </View>
              <Text style={styles.trendComparisonText}>vs. 7d avg ({weeklyAverageMinutes}m)</Text>
            </View>
          </View>

          {/* Card 2: Peaceful Transitions Rate */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricLabel}>Peaceful Transitions</Text>
              <View style={[styles.metricIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={{ fontSize: 13 }}>💛</Text>
              </View>
            </View>

            <View style={styles.metricValueRow}>
              <Text style={[styles.metricMainValue, { color: '#059669' }]}>
                {peacefulTransitionsRate}%
              </Text>
            </View>

            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>5-Day Peace Streak ⭐</Text>
            </View>
          </View>
        </View>

        {/* 3. Transition Effectiveness Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Exit Effect Effectiveness</Text>
              <Text style={styles.sectionSubtitle}>
                Which wrap-up cues help {childName} transition with zero resistance
              </Text>
            </View>
          </View>

          {/* Comparative Horizontal Breakdown Bars */}
          <View style={styles.effectivenessList}>
            {exitEffectsData.map((item) => (
              <View key={item.id} style={styles.effectRow}>
                <View style={styles.effectHeader}>
                  <View style={styles.effectTitleGroup}>
                    <Text style={styles.effectEmoji}>{item.emoji}</Text>
                    <Text style={styles.effectName}>{item.name}</Text>
                    {item.highlightBadge && (
                      <View style={[styles.highlightPill, { backgroundColor: `${item.color}20` }]}>
                        <Text style={[styles.highlightPillText, { color: item.color }]}>
                          {item.highlightBadge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.effectRateNumber, { color: item.color }]}>
                    {item.successRate}%
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${item.successRate}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.effectMetaRow}>
                  <Text style={styles.effectMetaText}>
                    {item.totalSessions} sessions logged
                  </Text>
                  <Text style={styles.effectMetaText}>
                    avg {item.avgGraceSeconds}s wrap-up grace taken
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pediatric Behavioral Insight Banner */}
          <View style={styles.insightBanner}>
            <Text style={styles.insightEmoji}>💡</Text>
            <Text style={styles.insightText}>
              <Text style={{ fontWeight: '900', color: '#1E293B' }}>Pediatric Insight: </Text>
              {childName} complies 15% faster with the{' '}
              <Text style={{ fontWeight: '800', color: '#059669' }}>Sleepy Mascot</Text> effect
              because children mirror character tiredness naturally.
            </Text>
          </View>
        </View>

        {/* 4. Daily Timeline Log */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Daily Session Timeline</Text>
              <Text style={styles.sectionSubtitle}>
                Chronological activity log & transition outcomes
              </Text>
            </View>
          </View>

          {/* Timeline Filter Segmented Chips */}
          <View style={styles.filterChipsRow}>
            {[
              { id: 'all', label: 'All Sessions' },
              { id: 'smooth', label: '✅ Smooth Hand-offs' },
              { id: 'resistance', label: '⚠️ Resistance Log' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setTimelineFilter(f.id as any)}
                style={[
                  styles.filterChip,
                  timelineFilter === f.id && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    timelineFilter === f.id && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chronological Session Cards */}
          <View style={styles.timelineList}>
            {filteredSessions.map((session) => {
              const isSmooth = session.outcome === 'smooth';
              return (
                <View key={session.id} style={styles.timelineCard}>
                  <View style={styles.timelineTopRow}>
                    <View style={styles.timelineTimeGroup}>
                      <Text style={styles.timelineTimeText}>{session.startTime}</Text>
                      <Text style={styles.timelineDurationText}>• {session.durationMinutes} mins</Text>
                    </View>

                    <View
                      style={[
                        styles.outcomeBadge,
                        isSmooth ? styles.outcomeBadgeSmooth : styles.outcomeBadgeResistance,
                      ]}
                    >
                      <Text
                        style={[
                          styles.outcomeBadgeText,
                          isSmooth ? styles.outcomeTextSmooth : styles.outcomeTextResistance,
                        ]}
                      >
                        {isSmooth ? '✓ Smooth Transition' : '⚠️ Mild Resistance'}
                      </Text>
                    </View>
                  </View>

                  {/* Middle Activity & Effect Pill */}
                  <View style={styles.timelineActivityRow}>
                    <View style={styles.activityChip}>
                      <Text style={styles.activityChipText}>🎮 {session.activityName}</Text>
                    </View>
                    <View style={styles.effectChip}>
                      <Text style={styles.effectChipText}>
                        {session.exitEffectEmoji} {session.exitEffectName}
                      </Text>
                    </View>
                    <Text style={styles.graceMetaText}>
                      Grace: {session.graceTakenSeconds}s
                    </Text>
                  </View>

                  {/* Parent / Pediatric Observation Note */}
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>{session.notes}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 14 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A2436',
  },
  childSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  childBadgeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childBadgeInitial: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#718096',
  },
  controlsButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 85,
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
  },
  timeframeChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
  },
  timeframeChipActive: {
    backgroundColor: '#5D997C',
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
  },
  timeframeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    shadowColor: '#1A2436',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#718096',
    maxWidth: 90,
  },
  metricIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#EBF4EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginBottom: 6,
  },
  metricMainValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A2436',
    fontFamily: 'monospace',
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '800',
    color: '#718096',
  },
  trendRow: {
    gap: 3,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: '#5D997C',
  },
  trendText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#3E6B56',
  },
  trendComparisonText: {
    fontSize: 9,
    color: '#8C9AA8',
    fontWeight: '600',
  },
  streakBadge: {
    backgroundColor: '#FFF8DE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F6D878',
  },
  streakBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#7C5209',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    shadowColor: '#1A2436',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#1A2436',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  effectivenessList: {
    gap: 12,
  },
  effectRow: {
    gap: 4,
  },
  effectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  effectTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  effectEmoji: {
    fontSize: 16,
  },
  effectName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
  },
  highlightPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  highlightPillText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  effectRateNumber: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  barTrack: {
    height: 7,
    backgroundColor: '#FAF8F5',
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  effectMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  effectMetaText: {
    fontSize: 9.5,
    color: '#8C9AA8',
    fontWeight: '600',
  },
  insightBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EBF4EF',
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#CBE1D5',
  },
  insightEmoji: {
    fontSize: 16,
  },
  insightText: {
    flex: 1,
    fontSize: 11,
    color: '#3E6B56',
    lineHeight: 16,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  filterChipActive: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
  },
  filterChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#718096',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  timelineList: {
    gap: 10,
  },
  timelineCard: {
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  timelineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineTimeText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#1A2436',
  },
  timelineDurationText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '700',
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  outcomeBadgeSmooth: {
    backgroundColor: '#EBF4EF',
  },
  outcomeBadgeResistance: {
    backgroundColor: '#FFF8DE',
  },
  outcomeBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  outcomeTextSmooth: {
    color: '#3E6B56',
  },
  outcomeTextResistance: {
    color: '#7C5209',
  },
  timelineActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  activityChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  activityChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A2436',
  },
  effectChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  effectChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A2436',
  },
  graceMetaText: {
    fontSize: 9.5,
    color: '#8C9AA8',
    fontWeight: '700',
  },
  noteBox: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  noteText: {
    fontSize: 10.5,
    color: '#718096',
    lineHeight: 15,
  },
  controlsLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF4EF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CBE1D5',
  },
  controlsLinkIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBE1D5',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlsLinkTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1A2436',
  },
  controlsLinkSubtitle: {
    fontSize: 10.5,
    color: '#3E6B56',
    marginTop: 1,
  },
});

export default AnalyticsFeaturesHubNative;
