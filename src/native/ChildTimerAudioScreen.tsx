import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { BuddyMascotNative } from './BuddyMascotNative';
import { useMascotVoiceCountdown } from './audio/useMascotVoiceCountdown';
import type { VoiceMode } from './audio/MascotVoiceManager';

const { width } = Dimensions.get('window');

export interface ChildTimerAudioScreenProps {
  childName?: string;
  initialMinutes?: number;
  initialGraceSeconds?: number;
  onBack?: () => void;
  onComplete?: () => void;
}

export const ChildTimerAudioScreen: React.FC<ChildTimerAudioScreenProps> = ({
  childName = 'Leo',
  initialMinutes = 5,
  initialGraceSeconds = 60,
  onBack,
  onComplete,
}) => {
  // Session Timer State
  const [totalSeconds, setTotalSeconds] = useState<number>(initialMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isGraceActive, setIsGraceActive] = useState<boolean>(false);
  const [graceSeconds, setGraceSeconds] = useState<number>(initialGraceSeconds);
  const [graceRemaining, setGraceRemaining] = useState<number>(initialGraceSeconds);

  // Custom Time Adjuster Modals
  const [showCustomTimerModal, setShowCustomTimerModal] = useState<boolean>(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>(String(initialMinutes));
  const [showCustomCountdownModal, setShowCustomCountdownModal] = useState<boolean>(false);
  const [customCountdownInput, setCustomCountdownInput] = useState<string>(String(initialGraceSeconds));

  // Audio & Lip-sync Mascot Voice Hook
  const {
    isSpeaking,
    currentSpeechText,
    currentExpression,
    mouthAnim,
    voiceMode,
    setVoiceMode,
    playCustomPhrase,
    stopSpeech,
  } = useMascotVoiceCountdown({
    totalSeconds,
    remainingSeconds,
    isGraceActive,
    graceRemainingSeconds: graceRemaining,
    initialVoiceMode: 'spoken',
  });

  // Main Session Countdown Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && !isGraceActive) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsGraceActive(true);
            setGraceRemaining(graceSeconds);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isRunning && isGraceActive) {
      interval = setInterval(() => {
        setGraceRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isGraceActive, graceSeconds, onComplete]);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timerProgress = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
  const graceProgress = Math.max(0, Math.min(100, (graceRemaining / graceSeconds) * 100));

  const handleApplyCustomSessionTime = () => {
    const parsed = parseInt(customMinutesInput, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 180) {
      const newTotal = parsed * 60;
      setTotalSeconds(newTotal);
      setRemainingSeconds(newTotal);
      setIsGraceActive(false);
      setIsRunning(true);
      setShowCustomTimerModal(false);
      playCustomPhrase(`Timer set to ${parsed} minutes! Have fun! 💛`, 'cheerful');
    }
  };

  const handleApplyCustomCountdown = () => {
    const parsed = parseInt(customCountdownInput, 10);
    if (!isNaN(parsed) && parsed >= 5 && parsed <= 300) {
      setGraceSeconds(parsed);
      setGraceRemaining(parsed);
      setShowCustomCountdownModal(false);
      playCustomPhrase(`Buddy will count down for ${parsed} seconds when time is up! 🧸`, 'encouraging');
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backButton}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.5}>
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{childName}'s Screen Timer</Text>
          <View style={styles.activeStatusPill}>
            <View style={[styles.statusDot, { backgroundColor: isGraceActive ? '#F59E0B' : '#10B981' }]} />
            <Text style={styles.activeStatusText}>
              {isGraceActive ? 'Mascot Countdown Active' : 'Session In Progress'}
            </Text>
          </View>
        </View>

        {/* Quick Voice Mode Indicator */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.voiceModeToggle}
            onPress={() => {
              if (voiceMode === 'spoken') setVoiceMode('whispered');
              else if (voiceMode === 'whispered') setVoiceMode('muted');
              else setVoiceMode('spoken');
            }}
          >
            <Text style={styles.voiceModeEmoji}>
              {voiceMode === 'spoken' ? '🔊' : voiceMode === 'whispered' ? '🤫' : '🔇'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* 2. Main Mascot Display with Lip-Sync */}
        <View style={styles.mascotCard}>
          <BuddyMascotNative
            mood={currentExpression}
            size={160}
            speechText={currentSpeechText}
            isSpeaking={isSpeaking}
            mouthAnim={mouthAnim}
            waveHand={isSpeaking || isGraceActive}
            lookAround={true}
          />

          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <View style={styles.audioWaveBar1} />
              <View style={styles.audioWaveBar2} />
              <View style={styles.audioWaveBar3} />
              <Text style={styles.speakingText}>
                Buddy is speaking ({voiceMode === 'whispered' ? 'Whisper Mode' : 'Spoken Voice'})
              </Text>
            </View>
          )}
        </View>

        {/* 3. Timer & Countdown Dial */}
        <View style={styles.timerDisplayCard}>
          <Text style={styles.timerDisplayLabel}>
            {isGraceActive ? '🧸 MASCOT COUNTDOWN' : 'TIME REMAINING'}
          </Text>

          <Text style={[styles.timerDigits, isGraceActive && { color: '#D97706' }]}>
            {isGraceActive
              ? `${graceRemaining}s`
              : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${isGraceActive ? graceProgress : timerProgress}%`,
                  backgroundColor: isGraceActive ? '#F59E0B' : '#4F46E5',
                },
              ]}
            />
          </View>

          {/* Quick Custom Session & Countdown Actions */}
          <View style={styles.customButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowCustomTimerModal(true)}
              style={styles.customBtn}
            >
              <Text style={styles.customBtnText}>⏱️ Set Custom Session Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowCustomCountdownModal(true)}
              style={[styles.customBtn, styles.customCountdownBtn]}
            >
              <Text style={[styles.customBtnText, { color: '#B45309' }]}>
                🧸 Set Custom Countdown ({graceSeconds}s)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Parent Voice & Countdown Settings Card */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsSectionTitle}>Mascot Voice & Audio Settings</Text>
          <Text style={styles.settingsSectionSubtitle}>
            Configure how Buddy delivers voice cues throughout the countdown.
          </Text>

          {/* Voice Mode Selector Tabs */}
          <View style={styles.voiceModeTabsRow}>
            {[
              { id: 'spoken' as VoiceMode, label: 'Spoken', icon: '🔊', desc: 'Full cheerful mascot voice' },
              { id: 'whispered' as VoiceMode, label: 'Whispered', icon: '🤫', desc: 'Gentle calming bedtime whisper' },
              { id: 'muted' as VoiceMode, label: 'Muted', icon: '🔇', desc: 'Visual speech bubble only' },
            ].map((tab) => {
              const isSelected = voiceMode === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.85}
                  onPress={() => setVoiceMode(tab.id)}
                  style={[styles.voiceTabItem, isSelected && styles.voiceTabItemActive]}
                >
                  <Text style={styles.voiceTabIcon}>{tab.icon}</Text>
                  <Text style={[styles.voiceTabLabel, isSelected && styles.voiceTabLabelActive]}>
                    {tab.label}
                  </Text>
                  <Text style={styles.voiceTabDesc}>{tab.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Voice Test Buttons */}
          <View style={styles.voiceTestRow}>
            <Text style={styles.voiceTestTitle}>Sample Mascot Cues:</Text>
            <View style={styles.cueChipsRow}>
              {[
                { label: '5m Cue', phrase: '5 minutes left! Let\'s finish our drawing 💛', expr: 'encouraging' as const },
                { label: '1m Cue', phrase: '1 minute remaining! Almost time to sleep 🌙', expr: 'sleepy' as const },
                { label: '3-2-1', phrase: '3... 2... 1... Good night phone! ⭐', expr: 'sleepy' as const },
              ].map((cue) => (
                <TouchableOpacity
                  key={cue.label}
                  activeOpacity={0.8}
                  onPress={() => playCustomPhrase(cue.phrase, cue.expr)}
                  style={styles.sampleCueChip}
                >
                  <Text style={styles.sampleCueChipText}>{cue.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL 1: Custom Session Duration */}
      <Modal transparent animationType="fade" visible={showCustomTimerModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Custom Session Duration</Text>
            <Text style={styles.modalSubtitle}>Enter total screen time in minutes (1 - 180 mins):</Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={customMinutesInput}
              onChangeText={setCustomMinutesInput}
              placeholder="e.g. 25"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCustomTimerModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleApplyCustomSessionTime}
              >
                <Text style={styles.modalConfirmText}>Apply Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Custom Countdown / Grace Time */}
      <Modal transparent animationType="fade" visible={showCustomCountdownModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Custom Countdown Time</Text>
            <Text style={styles.modalSubtitle}>
              Enter how many seconds Buddy will count down (5 - 300 seconds):
            </Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={customCountdownInput}
              onChangeText={setCustomCountdownInput}
              placeholder="e.g. 45"
            />

            <View style={styles.presetSecondsRow}>
              {[15, 30, 45, 60, 90, 120].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  onPress={() => setCustomCountdownInput(String(sec))}
                  style={[
                    styles.presetSecChip,
                    customCountdownInput === String(sec) && styles.presetSecChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetSecText,
                      customCountdownInput === String(sec) && styles.presetSecTextActive,
                    ]}
                  >
                    {sec}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCustomCountdownModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#F59E0B' }]}
                onPress={handleApplyCustomCountdown}
              >
                <Text style={styles.modalConfirmText}>Save Countdown</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  activeStatusText: { fontSize: 9.5, fontWeight: '700', color: '#475569' },
  headerRight: { width: 38, alignItems: 'flex-end' },
  voiceModeToggle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  voiceModeEmoji: { fontSize: 16 },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  mascotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
  },
  audioWaveBar1: { width: 3, height: 10, backgroundColor: '#8B5CF6', borderRadius: 1.5 },
  audioWaveBar2: { width: 3, height: 16, backgroundColor: '#7C3AED', borderRadius: 1.5 },
  audioWaveBar3: { width: 3, height: 8, backgroundColor: '#8B5CF6', borderRadius: 1.5 },
  speakingText: { fontSize: 10.5, fontWeight: '800', color: '#6D28D9' },
  timerDisplayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  timerDisplayLabel: { fontSize: 10.5, fontWeight: '900', color: '#64748B', letterSpacing: 0.6 },
  timerDigits: { fontSize: 44, fontWeight: '900', color: '#0F172A', fontFamily: 'monospace', marginVertical: 4 },
  progressBarTrack: { width: '100%', height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginVertical: 10 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  customButtonsRow: { width: '100%', gap: 8, marginTop: 6 },
  customBtn: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  customCountdownBtn: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  customBtnText: { fontSize: 11.5, fontWeight: '800', color: '#4338CA' },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  settingsSectionTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  settingsSectionSubtitle: { fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 12 },
  voiceModeTabsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  voiceTabItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  voiceTabItemActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  voiceTabIcon: { fontSize: 20, marginBottom: 2 },
  voiceTabLabel: { fontSize: 12, fontWeight: '900', color: '#475569' },
  voiceTabLabelActive: { color: '#4338CA' },
  voiceTabDesc: { fontSize: 8.5, color: '#94A3B8', textAlign: 'center', marginTop: 2 },
  voiceTestRow: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  voiceTestTitle: { fontSize: 11, fontWeight: '800', color: '#334155', marginBottom: 8 },
  cueChipsRow: { flexDirection: 'row', gap: 8 },
  sampleCueChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  sampleCueChipText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  modalSubtitle: { fontSize: 11.5, color: '#64748B', marginBottom: 12 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  presetSecondsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16, justifyContent: 'center' },
  presetSecChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  presetSecChipActive: { backgroundColor: '#F59E0B' },
  presetSecText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  presetSecTextActive: { color: '#FFFFFF', fontWeight: '900' },
  modalButtonsRow: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },
  modalConfirmText: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
});

export default ChildTimerAudioScreen;
