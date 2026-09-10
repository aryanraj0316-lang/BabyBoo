import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
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

// Types
export type TransitionOutcomeType = 'smooth' | 'resistance';

export interface ExitEffectStat {
  id: string;
  name: string;
  emoji: string;
  category: string;
  successRate: number; // 0 - 100
  totalSessions: number;
  avgGraceSeconds: number;
  highlightBadge?: string;
  accentColor: string;
  barGradient: [string, string];
}

export interface SessionTimelineItem {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  exitEffectName: string;
  exitEffectEmoji: string;
  activityName: string;
  outcome: TransitionOutcomeType;
  graceTakenSeconds: number;
  notes: string;
}

export interface ParentAnalyticsProps {
  childName?: string;
  childAvatarInitial?: string;
  childAvatarColor?: string;
  onBack?: () => void;
  onSelectExitEffect?: (effectId: string) => void;
}

export const ParentAnalyticsNative: React.FC<ParentAnalyticsProps> = ({
  childName = 'Leo',
  childAvatarInitial = 'L',
  childAvatarColor = '#6366F1',
  onBack,
  onSelectExitEffect,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | '7days' | '30days'>('today');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'smooth' | 'resistance'>('all');
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  // Overview metrics
  const screenTimeTodayMinutes = 45;
  const weeklyAverageMinutes = 57;
  const peacefulTransitionsRate = 88; // 88%
  const totalSessionsCount = 17;
  const smoothSessionsCount = 15;

  // Exit Effect Effectiveness Data
  const exitEffectsData: ExitEffectStat[] = [
    {
      id: 'sleepy_mascot',
      name: 'Sleepy Mascot',
      emoji: '🧸',
      category: 'Buddy Routine',
      successRate: 92,
      totalSessions: 24,
      avgGraceSeconds: 32,
      highlightBadge: 'Most Peaceful',
      accentColor: '#8B5CF6',
      barGradient: ['#8B5CF6', '#A78BFA'],
    },
    {
      id: 'battery_dies',
      name: 'Battery Dies (1%)',
      emoji: '🔋',
      category: 'Power Illusion',
      successRate: 86,
      totalSessions: 18,
      avgGraceSeconds: 45,
      highlightBadge: 'Zero Parent Blame',
      accentColor: '#10B981',
      barGradient: ['#10B981', '#34D399'],
    },
    {
      id: 'bedtime_rest',
      name: 'Needs a Rest',
      emoji: '🌙',
      category: 'Twilight Sleep',
      successRate: 84,
      totalSessions: 12,
      avgGraceSeconds: 40,
      accentColor: '#3B82F6',
      barGradient: ['#3B82F6', '#60A5FA'],
    },
    {
      id: 'cooldown_nap',
      name: 'Cooldown Nap',
      emoji: '🌀',
      category: 'Thermal Pause',
      successRate: 78,
      totalSessions: 9,
      avgGraceSeconds: 58,
      accentColor: '#F59E0B',
      barGradient: ['#F59E0B', '#FBBF24'],
    },
  ];

  // Daily Timeline Log Data
  const timelineSessions: SessionTimelineItem[] = [
    {
      id: 'sess_1',
      startTime: '06:45 PM',
      endTime: '07:15 PM',
      durationMinutes: 30,
      exitEffectName: 'Sleepy Mascot',
      exitEffectEmoji: '🧸',
      activityName: 'Bedtime Cartoons',
      outcome: 'smooth',
      graceTakenSeconds: 28,
      notes: 'Child said "Night night Buddy" and put phone on bedside table voluntarily.',
    },
    {
      id: 'sess_2',
      startTime: '03:15 PM',
      endTime: '03:30 PM',
      durationMinutes: 15,
      exitEffectName: 'Battery Dies',
      exitEffectEmoji: '🔋',
      activityName: 'Drawing & Puzzles',
      outcome: 'smooth',
      graceTakenSeconds: 35,
      notes: 'Handed device to parent without complaints when 1% alert appeared.',
    },
    {
      id: 'sess_3',
      startTime: '11:20 AM',
      endTime: '11:45 AM',
      durationMinutes: 25,
      exitEffectName: 'Cooldown Nap',
      exitEffectEmoji: '🌀',
      activityName: 'Educational Videos',
      outcome: 'resistance',
      graceTakenSeconds: 85,
      notes: 'Tapped screen twice during cooldown wave; needed verbal reassurance.',
    },
    {
      id: 'sess_4',
      startTime: '08:30 AM',
      endTime: '08:50 AM',
      durationMinutes: 20,
      exitEffectName: 'Sleepy Mascot',
      exitEffectEmoji: '🧸',
      activityName: 'Morning Animation',
      outcome: 'smooth',
      graceTakenSeconds: 22,
      notes: 'Smooth transition right before kindergarten prep.',
    },
  ];

  const filteredSessions = timelineSessions.filter((item) => {
    if (timelineFilter === 'smooth') return item.outcome === 'smooth';
    if (timelineFilter === 'resistance') return item.outcome === 'resistance';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* ========================================================================= */}
      {/* 1. TOP APP BAR & HEADER */}
      {/* ========================================================================= */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack}
              style={styles.backButton}
              accessibilityLabel="Go back to dashboard"
              accessibilityRole="button"
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.5}>
                <Path d="M19 12H5M12 19l-7-7 7-7" />
              </Svg>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIconPlaceholder} />
          )}

          {/* Child Badge Header */}
          <View style={styles.childHeaderPill}>
            <View style={[styles.childAvatarBadge, { backgroundColor: childAvatarColor }]}>
              <Text style={styles.childAvatarLetter}>{childAvatarInitial}</Text>
            </View>
            <Text style={styles.childHeaderName}>{childName}'s Insights</Text>
          </View>

          {/* Pediatric Trust Badge */}
          <View style={styles.pediatricBadge}>
            <Text style={styles.pediatricBadgeText}>Pediatric Log</Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Analytics Dashboard</Text>
          <Text style={styles.pageSubtitle}>
            Objective behavioral metrics for calmer, tear-free screen boundaries.
          </Text>
        </View>

        {/* Timeframe Filter Pills */}
        <View style={styles.timeframeRow}>
          {[
            { id: 'today' as const, label: 'Today' },
            { id: '7days' as const, label: 'Past 7 Days' },
            { id: '30days' as const, label: 'Past 30 Days' },
          ].map((tf) => {
            const isSelected = selectedTimeframe === tf.id;
            return (
              <TouchableOpacity
                key={tf.id}
                activeOpacity={0.8}
                onPress={() => setSelectedTimeframe(tf.id)}
                style={[styles.timeframePill, isSelected && styles.timeframePillActive]}
              >
                <Text style={[styles.timeframePillText, isSelected && styles.timeframePillTextActive]}>
                  {tf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* 2. OVERVIEW CARDS AT THE TOP */}
        {/* ========================================================================= */}
        <View style={styles.overviewCardsRow}>
          {/* Card 1: Total Screen Time Today */}
          <View style={styles.overviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={2.2}>
                  <Circle cx="12" cy="12" r="10" />
                  <Polyline points="12 6 12 12 16 14" />
                </Svg>
              </View>
              <View style={styles.cardTagHealthy}>
                <Text style={styles.cardTagHealthyText}>Within Target</Text>
              </View>
            </View>

            <Text style={styles.cardMetricLabel}>Total Screen Time Today</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.cardBigNumber}>{screenTimeTodayMinutes}</Text>
              <Text style={styles.cardUnitText}>mins</Text>
            </View>

            {/* Weekly Comparison Trend Pill */}
            <View style={styles.trendRow}>
              <View style={styles.trendIconGreen}>
                <Text style={styles.trendArrowText}>↓</Text>
              </View>
              <Text style={styles.trendComparisonText}>
                <Text style={styles.trendBoldText}>12m less</Text> than 7-day avg ({weeklyAverageMinutes}m)
              </Text>
            </View>
          </View>

          {/* Card 2: Peaceful Transitions Rate */}
          <View style={styles.overviewCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2.2}>
                  <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <Polyline points="22 4 12 14.01 9 11.01" />
                </Svg>
              </View>
              <View style={[styles.cardTagHealthy, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Text style={[styles.cardTagHealthyText, { color: '#047857' }]}>High Calm</Text>
              </View>
            </View>

            <Text style={styles.cardMetricLabel}>Peaceful Transitions Rate</Text>
            <View style={styles.metricValueRow}>
              <Text style={[styles.cardBigNumber, { color: '#059669' }]}>{peacefulTransitionsRate}%</Text>
            </View>

            {/* Sub-label comparison */}
            <View style={styles.trendRow}>
              <View style={[styles.trendIconGreen, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.trendArrowText, { color: '#059669' }]}>↑</Text>
              </View>
              <Text style={styles.trendComparisonText}>
                <Text style={styles.trendBoldText}>{smoothSessionsCount}/{totalSessionsCount}</Text> voluntary stops
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 3. TRANSITION EFFECTIVENESS SECTION (Bar Graph / Vertical Rank List) */}
        {/* ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <View style={styles.badgeLabelRow}>
                <Text style={styles.sectionPreTitle}>Comparative Exit Analysis</Text>
                <View style={styles.liveIndicatorDot} />
              </View>
              <Text style={styles.sectionTitle}>Transition Effectiveness</Text>
            </View>
            <View style={styles.filterPillSmall}>
              <Text style={styles.filterPillSmallText}>Success Rate %</Text>
            </View>
          </View>

          <Text style={styles.sectionDescription}>
            Success percentage represents sessions ending voluntarily without behavioral escalation or tantrums.
          </Text>

          {/* Ranking list of Exit Effects */}
          <View style={styles.effectsList}>
            {exitEffectsData.map((effect, index) => {
              const isSelected = selectedEffectId === effect.id;
              return (
                <TouchableOpacity
                  key={effect.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedEffectId(isSelected ? null : effect.id);
                    onSelectExitEffect?.(effect.id);
                  }}
                  style={[
                    styles.effectItemCard,
                    isSelected && styles.effectItemCardSelected,
                  ]}
                >
                  <View style={styles.effectTopInfoRow}>
                    <View style={styles.effectNameGroup}>
                      <View style={[styles.effectEmojiCircle, { backgroundColor: effect.accentColor + '18' }]}>
                        <Text style={styles.effectEmoji}>{effect.emoji}</Text>
                      </View>
                      <View>
                        <View style={styles.effectTitleRow}>
                          <Text style={styles.effectNameText}>{effect.name}</Text>
                          {effect.highlightBadge && (
                            <View style={[styles.effectHighlightBadge, { backgroundColor: effect.accentColor + '15' }]}>
                              <Text style={[styles.effectHighlightText, { color: effect.accentColor }]}>
                                {effect.highlightBadge}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.effectCategoryText}>
                          {effect.category} • {effect.totalSessions} sessions
                        </Text>
                      </View>
                    </View>

                    {/* Percentage Score */}
                    <View style={styles.scoreColumn}>
                      <Text style={[styles.scorePercentText, { color: effect.accentColor }]}>
                        {effect.successRate}%
                      </Text>
                      <Text style={styles.avgGraceText}>avg {effect.avgGraceSeconds}s grace</Text>
                    </View>
                  </View>

                  {/* Horizontal Bar Chart Component */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${effect.successRate}%`,
                          backgroundColor: effect.accentColor,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pediatric Insight Callout */}
          <View style={styles.pediatricTipBox}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipTextContent}>
              <Text style={styles.tipHeading}>Parenting Research Tip</Text>
              <Text style={styles.tipBody}>
                <Text style={styles.tipBold}>Sleepy Mascot</Text> achieves higher voluntary compliance because bedtime framing transfers responsibility to the character's biological tiredness.
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 4. DAILY TIMELINE LOG (Chronological Flat List) */}
        {/* ========================================================================= */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionPreTitle}>Chronological History</Text>
              <Text style={styles.sectionTitle}>Daily Timeline Log</Text>
            </View>

            {/* Filter Toggle Buttons */}
            <View style={styles.timelineFilterGroup}>
              {[
                { id: 'all' as const, label: 'All (4)' },
                { id: 'smooth' as const, label: 'Smooth (3)' },
                { id: 'resistance' as const, label: 'Resistance (1)' },
              ].map((f) => {
                const isSelected = timelineFilter === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setTimelineFilter(f.id)}
                    style={[
                      styles.timelineFilterBtn,
                      isSelected && styles.timelineFilterBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timelineFilterBtnText,
                        isSelected && styles.timelineFilterBtnTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Timeline FlatList */}
          <View style={styles.timelineContainer}>
            {filteredSessions.map((session, index) => {
              const isSmooth = session.outcome === 'smooth';
              const isLast = index === filteredSessions.length - 1;

              return (
                <View key={session.id} style={styles.timelineItemRow}>
                  {/* Timeline Left Stem & Indicator */}
                  <View style={styles.timelineStemColumn}>
                    <View
                      style={[
                        styles.timelineNode,
                        isSmooth ? styles.timelineNodeSmooth : styles.timelineNodeResistance,
                      ]}
                    >
                      {isSmooth ? (
                        <Text style={styles.timelineNodeIcon}>✓</Text>
                      ) : (
                        <Text style={[styles.timelineNodeIcon, { color: '#D97706' }]}>!</Text>
                      )}
                    </View>
                    {!isLast && <View style={styles.timelineStemLine} />}
                  </View>

                  {/* Session Card Content */}
                  <View style={styles.timelineCard}>
                    <View style={styles.timelineCardTop}>
                      <View>
                        <Text style={styles.timelineTimeText}>
                          {session.startTime} – {session.endTime}
                        </Text>
                        <Text style={styles.timelineDurationText}>
                          {session.durationMinutes} mins • {session.activityName}
                        </Text>
                      </View>

                      {/* Outcome Status Badge */}
                      <View
                        style={[
                          styles.outcomeBadge,
                          isSmooth ? styles.outcomeBadgeSmooth : styles.outcomeBadgeResistance,
                        ]}
                      >
                        <Text
                          style={[
                            styles.outcomeBadgeText,
                            isSmooth ? styles.outcomeBadgeTextSmooth : styles.outcomeBadgeTextResistance,
                          ]}
                        >
                          {isSmooth ? 'Smooth Transition' : 'Mild Resistance'}
                        </Text>
                      </View>
                    </View>

                    {/* Exit Effect Used Pill */}
                    <View style={styles.timelineEffectPill}>
                      <Text style={styles.timelineEffectEmoji}>{session.exitEffectEmoji}</Text>
                      <Text style={styles.timelineEffectName}>
                        Exit Effect: <Text style={styles.boldText}>{session.exitEffectName}</Text>
                      </Text>
                      <Text style={styles.timelineGraceTaken}>
                        (took {session.graceTakenSeconds}s grace)
                      </Text>
                    </View>

                    {/* Observational Log Note */}
                    <View style={styles.timelineNotesBox}>
                      <Text style={styles.timelineNotesText}>"{session.notes}"</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {filteredSessions.length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateEmoji}>📋</Text>
                <Text style={styles.emptyStateTitle}>No sessions match this filter</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Try selecting "All" to view the complete history.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

// Polyline component helper for SVG
const Polyline: React.FC<{ points: string; fill?: string; stroke?: string; strokeWidth?: number }> = ({
  points,
  stroke = '#4F46E5',
  strokeWidth = 2,
}) => {
  const coords = points.split(' ').map((p) => p.split(',').map(Number));
  if (coords.length < 2) return null;
  const d = coords.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr[0]} ${curr[1]}`, '');
  return <Path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerIconPlaceholder: {
    width: 38,
  },
  childHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  childAvatarBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  childHeaderName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  pediatricBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  pediatricBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  titleSection: {
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  timeframeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  timeframePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 11,
  },
  timeframePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  timeframePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  timeframePillTextActive: {
    color: '#4F46E5',
    fontWeight: '900',
  },

  // 2. Scroll Area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // 3. Overview Cards Row
  overviewCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTagHealthy: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  cardTagHealthyText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#4F46E5',
  },
  cardMetricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginBottom: 8,
  },
  cardBigNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  cardUnitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendIconGreen: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendArrowText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#16A34A',
    lineHeight: 12,
  },
  trendComparisonText: {
    fontSize: 9.5,
    color: '#64748B',
    flex: 1,
  },
  trendBoldText: {
    fontWeight: '800',
    color: '#0F172A',
  },

  // 4. Section Card Shared Styles
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  sectionPreTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionDescription: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 16,
  },
  filterPillSmall: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  filterPillSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },

  // 5. Exit Effects Ranking
  effectsList: {
    gap: 10,
    marginBottom: 14,
  },
  effectItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  effectItemCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FAF5FF',
  },
  effectTopInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  effectNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  effectEmojiCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectEmoji: {
    fontSize: 20,
  },
  effectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  effectNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  effectHighlightBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  effectHighlightText: {
    fontSize: 9,
    fontWeight: '800',
  },
  effectCategoryText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  scoreColumn: {
    alignItems: 'flex-end',
  },
  scorePercentText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  avgGraceText: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  // 6. Parenting Tip Box
  pediatricTipBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  tipIcon: {
    fontSize: 18,
  },
  tipTextContent: {
    flex: 1,
  },
  tipHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 2,
  },
  tipBody: {
    fontSize: 11,
    color: '#4C1D95',
    lineHeight: 15,
  },
  tipBold: {
    fontWeight: '800',
  },

  // 7. Timeline Styles
  timelineFilterGroup: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F1F5F9',
    padding: 2,
    borderRadius: 10,
  },
  timelineFilterBtn: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timelineFilterBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineFilterBtnText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  timelineFilterBtnTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineItemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineStemColumn: {
    alignItems: 'center',
    width: 22,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNodeSmooth: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  timelineNodeResistance: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
  },
  timelineNodeIcon: {
    fontSize: 11,
    fontWeight: '900',
    color: '#16A34A',
  },
  timelineStemLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  timelineCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timelineTimeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  timelineDurationText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  outcomeBadgeSmooth: {
    backgroundColor: '#DCFCE7',
  },
  outcomeBadgeResistance: {
    backgroundColor: '#FEF3C7',
  },
  outcomeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  outcomeBadgeTextSmooth: {
    color: '#15803D',
  },
  outcomeBadgeTextResistance: {
    color: '#B45309',
  },
  timelineEffectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  timelineEffectEmoji: {
    fontSize: 13,
  },
  timelineEffectName: {
    fontSize: 11,
    color: '#334155',
  },
  boldText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  timelineGraceTaken: {
    fontSize: 10,
    color: '#64748B',
  },
  timelineNotesBox: {
    borderLeftWidth: 2,
    borderLeftColor: '#CBD5E1',
    paddingLeft: 8,
  },
  timelineNotesText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 15,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  emptyStateSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default ParentAnalyticsNative;
