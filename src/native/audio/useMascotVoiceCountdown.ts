import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import {
  mascotVoiceEngine,
  MILESTONE_VOICE_CUES,
  type VoiceCue,
  type VoiceMode,
} from './MascotVoiceManager';

export interface UseMascotVoiceCountdownProps {
  totalSeconds: number;
  remainingSeconds: number;
  isGraceActive?: boolean;
  graceRemainingSeconds?: number;
  initialVoiceMode?: VoiceMode;
  onMilestoneTriggered?: (cue: VoiceCue) => void;
}

export interface UseMascotVoiceCountdownReturn {
  isSpeaking: boolean;
  currentSpeechText: string;
  currentExpression: 'cheerful' | 'encouraging' | 'waving' | 'sleepy' | 'celebrate';
  mouthAnim: Animated.Value;
  voiceMode: VoiceMode;
  setVoiceMode: (mode: VoiceMode) => void;
  customCountdownSeconds: number;
  setCustomCountdownSeconds: (seconds: number) => void;
  playCustomPhrase: (phrase: string, expression?: 'cheerful' | 'encouraging' | 'waving' | 'sleepy' | 'celebrate') => void;
  stopSpeech: () => void;
}

export const useMascotVoiceCountdown = ({
  totalSeconds,
  remainingSeconds,
  isGraceActive = false,
  graceRemainingSeconds = 60,
  initialVoiceMode = 'spoken',
  onMilestoneTriggered,
}: UseMascotVoiceCountdownProps): UseMascotVoiceCountdownReturn => {
  const [voiceMode, setVoiceModeState] = useState<VoiceMode>(initialVoiceMode);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentSpeechText, setCurrentSpeechText] = useState<string>('Ready for screen time!');
  const [currentExpression, setCurrentExpression] = useState<
    'cheerful' | 'encouraging' | 'waving' | 'sleepy' | 'celebrate'
  >('cheerful');
  const [customCountdownSeconds, setCustomCountdownSeconds] = useState<number>(60);

  const mouthAnim = useRef(new Animated.Value(0)).current;
  const triggeredMilestonesRef = useRef<Set<string>>(new Set());
  const lastSecondCheckedRef = useRef<number>(-1);

  // Sync engine voice mode
  const setVoiceMode = useCallback((mode: VoiceMode) => {
    setVoiceModeState(mode);
    mascotVoiceEngine.setVoiceMode(mode);
  }, []);

  const stopSpeech = useCallback(() => {
    mascotVoiceEngine.stopCurrentSpeech();
    setIsSpeaking(false);
    Animated.timing(mouthAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [mouthAnim]);

  const playCustomPhrase = useCallback(
    (phrase: string, expression: 'cheerful' | 'encouraging' | 'waving' | 'sleepy' | 'celebrate' = 'encouraging') => {
      setCurrentSpeechText(phrase);
      setCurrentExpression(expression);
      setIsSpeaking(true);

      const tempCue: VoiceCue = {
        id: `custom_${Date.now()}`,
        triggerSeconds: -1,
        phrase,
        speechText: phrase,
        expression,
        durationMs: 2500,
      };

      mascotVoiceEngine.playVoiceCue(
        tempCue,
        (openness) => {
          mouthAnim.setValue(openness);
        },
        () => {
          setIsSpeaking(false);
          mouthAnim.setValue(0);
        }
      );
    },
    [mouthAnim]
  );

  // Reset milestone triggers on fresh session start
  useEffect(() => {
    if (remainingSeconds === totalSeconds && remainingSeconds > 0) {
      triggeredMilestonesRef.current.clear();
      lastSecondCheckedRef.current = -1;
    }
  }, [totalSeconds, remainingSeconds]);

  // Main Milestone Listener Logic
  useEffect(() => {
    const currentTargetSec = isGraceActive ? graceRemainingSeconds : remainingSeconds;
    if (currentTargetSec === lastSecondCheckedRef.current) return;
    lastSecondCheckedRef.current = currentTargetSec;

    // Check if target matches any designated voice countdown milestone
    const matchingCue = MILESTONE_VOICE_CUES.find((cue) => {
      // In normal countdown mode (matching 300s, 180s, 120s, 60s, 30s)
      if (!isGraceActive && cue.triggerSeconds >= 30 && cue.triggerSeconds === currentTargetSec) {
        return true;
      }
      // In wrap-up countdown / grace mode (matching 30s, 10s, 5s, 4s, 3s, 2s, 1s, 0s)
      if (isGraceActive && cue.triggerSeconds <= 30 && cue.triggerSeconds === currentTargetSec) {
        return true;
      }
      return false;
    });

    if (matchingCue && !triggeredMilestonesRef.current.has(`${isGraceActive ? 'grace_' : 'main_'}${matchingCue.id}`)) {
      triggeredMilestonesRef.current.add(`${isGraceActive ? 'grace_' : 'main_'}${matchingCue.id}`);
      setCurrentSpeechText(matchingCue.speechText);
      setCurrentExpression(matchingCue.expression);
      setIsSpeaking(true);
      onMilestoneTriggered?.(matchingCue);

      mascotVoiceEngine.playVoiceCue(
        matchingCue,
        (openness) => {
          mouthAnim.setValue(openness);
        },
        () => {
          setIsSpeaking(false);
          mouthAnim.setValue(0);
        }
      );
    }
  }, [
    remainingSeconds,
    graceRemainingSeconds,
    isGraceActive,
    mouthAnim,
    onMilestoneTriggered,
  ]);

  return {
    isSpeaking,
    currentSpeechText,
    currentExpression,
    mouthAnim,
    voiceMode,
    setVoiceMode,
    customCountdownSeconds,
    setCustomCountdownSeconds,
    playCustomPhrase,
    stopSpeech,
  };
};
