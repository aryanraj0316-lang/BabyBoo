import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
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

export type VoiceMode = 'spoken' | 'whispered' | 'muted';

export interface ParentControlsSecurityProps {
  childName?: string;
  childAvatarInitial?: string;
  childAvatarColor?: string;
  onBack?: () => void;
  onNavigateAnalytics?: () => void;
}

export const ParentControlsSecurityNative: React.FC<ParentControlsSecurityProps> = ({
  childName = 'Leo',
  childAvatarInitial = 'L',
  childAvatarColor = '#6366F1',
  onBack,
  onNavigateAnalytics,
}) => {
  // Security & Gates State
  const [pinProtection, setPinProtection] = useState<boolean>(true);
  const [bgTimerPersistence, setBgTimerPersistence] = useState<boolean>(true);
  const [preventAppSwitching, setPreventAppSwitching] = useState<boolean>(true);

  // Mascot Voice & Audio State
  const [voiceCountdown, setVoiceCountdown] = useState<boolean>(true);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('spoken');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(true);

  // Wellbeing Illusions & Transitions
  const [lowBatteryIllusion, setLowBatteryIllusion] = useState<boolean>(true);
  const [gentleDimming, setGentleDimming] = useState<boolean>(true);
  const [streakProtector, setStreakProtector] = useState<boolean>(true);

  return (
    <View style={styles.container}>
      {/* 1. Header Navigation */}
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
          <Text style={styles.headerTitle}>Parent Controls & Security</Text>
          <View style={styles.childSubtitleRow}>
            <View style={[styles.childBadgeDot, { backgroundColor: childAvatarColor }]}>
              <Text style={styles.childBadgeInitial}>{childAvatarInitial}</Text>
            </View>
            <Text style={styles.headerSubtitle}>Active Profile: {childName}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNavigateAnalytics}
          style={styles.analyticsButton}
          accessibilityLabel="View Analytics"
        >
          <Text style={{ fontSize: 16 }}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Security & Protection Gates */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionIconBadge}>
              <Text style={{ fontSize: 15 }}>🔒</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Parent Security & PIN Gates</Text>
              <Text style={styles.sectionSubtitle}>
                Restrict unauthorized exits and secure settings
              </Text>
            </View>
          </View>

          {/* Toggle 1: PIN & Pattern Lock */}
          <View style={styles.featureItemRow}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Pattern & PIN Lock Protection</Text>
              <Text style={styles.featureDesc}>
                Requires parent unlock pattern or PIN before exiting sessions early or accessing settings.
              </Text>
            </View>
            <Switch
              value={pinProtection}
              onValueChange={setPinProtection}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={pinProtection ? '#4F46E5' : '#FFFFFF'}
            />
          </View>

          {/* Toggle 2: Background Timer Persistence */}
          <View style={styles.featureItemRow}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Background Timer Persistence</Text>
              <Text style={styles.featureDesc}>
                Keeps screen session timer counting accurately even if the device locks or switches apps.
              </Text>
            </View>
            <Switch
              value={bgTimerPersistence}
              onValueChange={setBgTimerPersistence}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={bgTimerPersistence ? '#4F46E5' : '#FFFFFF'}
            />
          </View>

          {/* Toggle 3: Profile Switch Lock */}
          <View style={[styles.featureItemRow, { borderBottomWidth: 0 }]}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Child Profile Switch Guard</Text>
              <Text style={styles.featureDesc}>
                Prevents children from switching to another child's account without parent authorization.
              </Text>
            </View>
            <Switch
              value={preventAppSwitching}
              onValueChange={setPreventAppSwitching}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={preventAppSwitching ? '#4F46E5' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Section 2: Mascot Voice & Audio Controls */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={{ fontSize: 15 }}>🧸</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Mascot Voice & Audio Controls</Text>
              <Text style={styles.sectionSubtitle}>
                Manage Buddy vocal countdowns & lip-sync cues
              </Text>
            </View>
          </View>

          {/* Toggle 4: Voice Countdown */}
          <View style={styles.featureItemRow}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Voice Mascot Countdown</Text>
              <Text style={styles.featureDesc}>
                Buddy actively speaks countdown milestone cues (*5m, 1m, 3-2-1*) to prepare child.
              </Text>
            </View>
            <Switch
              value={voiceCountdown}
              onValueChange={setVoiceCountdown}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={voiceCountdown ? '#4F46E5' : '#FFFFFF'}
            />
          </View>

          {/* Vocal Volume Style Selector */}
          <Text style={styles.subSectionTitle}>Vocal Volume Style</Text>
          <View style={styles.voiceModeTabs}>
            {[
              { id: 'spoken' as VoiceMode, label: 'Spoken Voice', icon: '🔊' },
              { id: 'whispered' as VoiceMode, label: 'Bedtime Whisper', icon: '🤫' },
              { id: 'muted' as VoiceMode, label: 'Muted Bubble', icon: '🔇' },
            ].map((v) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => setVoiceMode(v.id)}
                style={[styles.voiceTabBtn, voiceMode === v.id && styles.voiceTabBtnActive]}
              >
                <Text style={{ fontSize: 15 }}>{v.icon}</Text>
                <Text style={[styles.voiceTabText, voiceMode === v.id && styles.voiceTabTextActive]}>
                  {v.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Toggle 5: Audio Tick Feedback */}
          <View style={[styles.featureItemRow, { borderBottomWidth: 0, marginTop: 10 }]}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Interactive Audio Chimes</Text>
              <Text style={styles.featureDesc}>
                Play soft procedural chimes and cheerful click feedback during interactions.
              </Text>
            </View>
            <Switch
              value={audioFeedback}
              onValueChange={setAudioFeedback}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={audioFeedback ? '#4F46E5' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Section 3: Screen Wellbeing Illusions */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: '#F3E8FF' }]}>
              <Text style={{ fontSize: 15 }}>🌀</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Wellbeing & Exit Illusions</Text>
              <Text style={styles.sectionSubtitle}>
                Psychology-backed transition triggers that eliminate tantrums
              </Text>
            </View>
          </View>

          {/* Toggle 6: Low Battery Illusion */}
          <View style={styles.featureItemRow}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Low Battery Illusion</Text>
              <Text style={styles.featureDesc}>
                Simulates authentic 1% battery and gentle cooling rest to remove parent blame.
              </Text>
            </View>
            <Switch
              value={lowBatteryIllusion}
              onValueChange={setLowBatteryIllusion}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={lowBatteryIllusion ? '#4F46E5' : '#FFFFFF'}
            />
          </View>

          {/* Toggle 7: Gentle Dimming */}
          <View style={styles.featureItemRow}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Pre-Bedtime Gentle Dimming</Text>
              <Text style={styles.featureDesc}>
                Gradually softens brightness during the final 3 minutes to cue natural melatonin release.
              </Text>
            </View>
            <Switch
              value={gentleDimming}
              onValueChange={setGentleDimming}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={gentleDimming ? '#4F46E5' : '#FFFFFF'}
            />
          </View>

          {/* Toggle 8: Streak Protector */}
          <View style={[styles.featureItemRow, { borderBottomWidth: 0 }]}>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Peaceful Streak Protector</Text>
              <Text style={styles.featureDesc}>
                Rewards {childName} with glowing stars when phone is put down voluntarily during countdown.
              </Text>
            </View>
            <Switch
              value={streakProtector}
              onValueChange={setStreakProtector}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={streakProtector ? '#4F46E5' : '#FFFFFF'}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
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
    color: '#64748B',
  },
  analyticsButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  featureDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  voiceModeTabs: {
    flexDirection: 'row',
    gap: 6,
  },
  voiceTabBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 2,
  },
  voiceTabBtnActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  voiceTabText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  voiceTabTextActive: {
    color: '#4338CA',
    fontWeight: '900',
  },
});

export default ParentControlsSecurityNative;
