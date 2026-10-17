import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Rect,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

export interface AnalyticsInsightsProps {
  childName?: string;
  childAvatarInitial?: string;
  childAvatarColor?: string;
  bottomPadding?: number;
  onBack?: () => void;
  onNavigateControls?: () => void;
}

interface DayMetric {
  day: string;
  minutes: number;
}

export const AnalyticsFeaturesHubNative: React.FC<AnalyticsInsightsProps> = ({
  childName = 'Leo',
  childAvatarInitial = 'L',
  childAvatarColor = '#5D997C',
  bottomPadding = 80,
  onBack,
}) => {
  const dailyTarget = 20;

  const weekData: DayMetric[] = [
    { day: 'MON', minutes: 18 },
    { day: 'TUE', minutes: 22 },
    { day: 'WED', minutes: 15 },
    { day: 'THU', minutes: 24 },
    { day: 'FRI', minutes: 20 },
    { day: 'SAT', minutes: 26 },
    { day: 'SUN', minutes: 19 },
  ];

  const avgMinutes = Math.round(weekData.reduce((acc, d) => acc + d.minutes, 0) / weekData.length);
  const maxMinutes = 35;
  const complianceRate = 94;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1A2436" strokeWidth={2.2}>
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wellbeing Analytics</Text>
          <Text style={styles.headerSubtitle}>{childName} • Weekly Overview</Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 3-Metric KPI Grid */}
        <View style={styles.kpiRow}>
          {/* Card 1: Daily Average */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Daily Avg</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiMainValue}>{avgMinutes}</Text>
              <Text style={styles.kpiUnit}>min</Text>
            </View>
            <Text style={styles.kpiSubText}>Target: {dailyTarget}m</Text>
          </View>

          {/* Card 2: Compliance */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Compliance</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiMainValue}>{complianceRate}%</Text>
            </View>
            <Text style={styles.kpiSubText}>Peaceful wrap-up</Text>
          </View>

          {/* Card 3: Streak */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Habit Streak</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiMainValue}>5</Text>
              <Text style={styles.kpiUnit}>days</Text>
            </View>
            <Text style={styles.kpiSubText}>Zero conflict</Text>
          </View>
        </View>

        {/* 7-Day Usage Bar Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.cardTitle}>Daily Screen Time Distribution</Text>
              <Text style={styles.cardSubtitle}>Usage vs recommended 20m daily limit</Text>
            </View>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: '#5D997C' }]} />
              <Text style={styles.legendText}>Actual</Text>
            </View>
          </View>

          {/* Chart Columns Area */}
          <View style={styles.chartContainer}>
            {/* Target Guideline Line */}
            <View
              style={[
                styles.targetGuideline,
                { bottom: (dailyTarget / maxMinutes) * 110 },
              ]}
            >
              <View style={styles.targetDashedLine} />
              <Text style={styles.targetText}>{dailyTarget}m limit</Text>
            </View>

            <View style={styles.barsRow}>
              {weekData.map((item) => {
                const barHeight = Math.min(100, (item.minutes / maxMinutes) * 100);
                const isOver = item.minutes > dailyTarget;
                return (
                  <View key={item.day} style={styles.barColumn}>
                    <Text style={styles.barValueText}>{item.minutes}m</Text>
                    <View
                      style={[
                        styles.barPill,
                        {
                          height: barHeight,
                          backgroundColor: isOver ? '#7A8E82' : '#5D997C',
                        },
                      ]}
                    />
                    <Text style={styles.barDayText}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Executive Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#5D997C" strokeWidth={2.4}>
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </Svg>
            <Text style={styles.summaryTitle}>Weekly Behavioral Summary</Text>
          </View>

          <Text style={styles.summaryBody}>
            {childName}’s screen routines remained consistent across 6 of 7 monitored days.
            Device wrap-ups concluded with calm cooperation, maintaining a {complianceRate}%
            voluntary hand-off rate with zero recorded pushback.
          </Text>

          <View style={styles.summaryMetricsRow}>
            <View style={styles.summaryMetricItem}>
              <Text style={styles.summaryMetricLabel}>Average Hand-off</Text>
              <Text style={styles.summaryMetricValue}>18 seconds</Text>
            </View>
            <View style={styles.summaryMetricItem}>
              <Text style={styles.summaryMetricLabel}>Cooperation Level</Text>
              <Text style={[styles.summaryMetricValue, { color: '#2D5441' }]}>Optimal</Text>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
  },
  backButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A2436',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5D997C',
    marginTop: 1,
  },
  headerRightPlaceholder: {
    width: 32,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  kpiMainValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A2436',
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  kpiSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5D997C',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  chartContainer: {
    height: 140,
    marginTop: 8,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  targetGuideline: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  targetDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 0.8,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  targetText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginLeft: 6,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    zIndex: 2,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFEA',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  barPill: {
    width: 18,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barDayText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1EFEA',
  },
  summaryMetricItem: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  summaryMetricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  summaryMetricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1A2436',
    marginTop: 2,
  },
});

export default AnalyticsFeaturesHubNative;
