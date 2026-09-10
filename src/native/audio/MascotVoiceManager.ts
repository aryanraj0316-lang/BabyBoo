import { Platform } from 'react-native';

export type VoiceMode = 'spoken' | 'whispered' | 'muted';

export interface VoiceCue {
  id: string;
  triggerSeconds: number; // e.g. 300 for 5m, 120 for 2m, 30 for 30s
  phrase: string;
  speechText: string;
  expression: 'cheerful' | 'encouraging' | 'waving' | 'sleepy' | 'celebrate';
  durationMs: number;
  audioAssetUri?: string; // Optional local require or remote URI
}

export interface MascotSpeechState {
  isSpeaking: boolean;
  phrase: string | null;
  expression: 'cheerful' | 'encouraging' | 'waving' | 'sleepy' | 'celebrate';
  mouthOpenness: number; // 0.0 (closed) to 1.0 (fully open)
  voiceMode: VoiceMode;
  volume: number; // 0.0 - 1.0
}

export const MILESTONE_VOICE_CUES: VoiceCue[] = [
  {
    id: '5_minutes',
    triggerSeconds: 300,
    phrase: '5 minutes left!',
    speechText: '5 minutes left! Let\'s start wrapping up our game',
    expression: 'encouraging',
    durationMs: 2400,
  },
  {
    id: '3_minutes',
    triggerSeconds: 180,
    phrase: '3 minutes left!',
    speechText: '3 minutes left! Almost time for phone to rest',
    expression: 'encouraging',
    durationMs: 2200,
  },
  {
    id: '2_minutes',
    triggerSeconds: 120,
    phrase: '2 minutes remaining!',
    speechText: '2 minutes left! Time to save your work',
    expression: 'waving',
    durationMs: 2000,
  },
  {
    id: '1_minute',
    triggerSeconds: 60,
    phrase: '1 minute remaining!',
    speechText: '1 minute left! Get ready to put phone down',
    expression: 'sleepy',
    durationMs: 2200,
  },
  {
    id: '30_seconds',
    triggerSeconds: 30,
    phrase: '30 seconds left!',
    speechText: '30 seconds! Buddy is yawning... 💤',
    expression: 'sleepy',
    durationMs: 2000,
  },
  {
    id: '10_seconds',
    triggerSeconds: 10,
    phrase: '10 seconds!',
    speechText: '10 seconds! Let\'s count together!',
    expression: 'waving',
    durationMs: 1500,
  },
  {
    id: '5_seconds',
    triggerSeconds: 5,
    phrase: '5!',
    speechText: '5...',
    expression: 'waving',
    durationMs: 800,
  },
  {
    id: '4_seconds',
    triggerSeconds: 4,
    phrase: '4!',
    speechText: '4...',
    expression: 'waving',
    durationMs: 800,
  },
  {
    id: '3_seconds',
    triggerSeconds: 3,
    phrase: '3!',
    speechText: '3...',
    expression: 'sleepy',
    durationMs: 800,
  },
  {
    id: '2_seconds',
    triggerSeconds: 2,
    phrase: '2!',
    speechText: '2...',
    expression: 'sleepy',
    durationMs: 800,
  },
  {
    id: '1_seconds',
    triggerSeconds: 1,
    phrase: '1!',
    speechText: '1... Night night phone!',
    expression: 'sleepy',
    durationMs: 1000,
  },
  {
    id: 'time_up',
    triggerSeconds: 0,
    phrase: 'Time to put the phone down!',
    speechText: 'Time to put the phone down, buddy! Great job!',
    expression: 'celebrate',
    durationMs: 2600,
  },
];

class MascotVoiceEngine {
  private voiceMode: VoiceMode = 'spoken';
  private volume: number = 1.0;
  private isSpeaking: boolean = false;
  private activeUtterance: any = null;
  private lipSyncInterval: any = null;

  public setVoiceMode(mode: VoiceMode) {
    this.voiceMode = mode;
    if (mode === 'muted') {
      this.volume = 0.0;
      this.stopCurrentSpeech();
    } else if (mode === 'whispered') {
      this.volume = 0.35;
    } else {
      this.volume = 1.0;
    }
  }

  public getVoiceMode(): VoiceMode {
    return this.voiceMode;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0.0, Math.min(1.0, volume));
  }

  public getVolume(): number {
    return this.volume;
  }

  public stopCurrentSpeech() {
    this.isSpeaking = false;
    if (this.lipSyncInterval) {
      clearInterval(this.lipSyncInterval);
      this.lipSyncInterval = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Play Mascot Voice Cue with real-time lip-sync mouth animation callback
   */
  public async playVoiceCue(
    cue: VoiceCue,
    onMouthMove?: (openness: number) => void,
    onSpeechComplete?: () => void
  ): Promise<void> {
    if (this.voiceMode === 'muted' || this.volume <= 0.0) {
      onSpeechComplete?.();
      return;
    }

    this.stopCurrentSpeech();
    this.isSpeaking = true;

    // Start Procedural Lip-Sync Viseme Oscillation
    let step = 0;
    this.lipSyncInterval = setInterval(() => {
      if (!this.isSpeaking) {
        if (this.lipSyncInterval) clearInterval(this.lipSyncInterval);
        onMouthMove?.(0.0);
        return;
      }
      step += 1;
      // Natural speech rhythm curve (bouncing between 0.15 and 0.95 openness)
      const openness = 0.2 + 0.75 * Math.abs(Math.sin(step * 0.45) * Math.cos(step * 0.25));
      onMouthMove?.(openness);
    }, 60);

    // Web Speech API / High Quality Vocal Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const textToSpeak = cue.phrase || cue.speechText;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        // Vocal style adaptation based on parent settings
        if (this.voiceMode === 'whispered') {
          utterance.rate = 0.85; // Slow and calming
          utterance.pitch = 1.3; // Soft gentle pitch
          utterance.volume = 0.35;
        } else {
          utterance.rate = 1.05; // Cheerful pacing
          utterance.pitch = 1.6; // High friendly cute mascot pitch
          utterance.volume = this.volume;
        }

        utterance.onend = () => {
          this.isSpeaking = false;
          if (this.lipSyncInterval) clearInterval(this.lipSyncInterval);
          onMouthMove?.(0.0);
          onSpeechComplete?.();
        };

        utterance.onerror = () => {
          this.isSpeaking = false;
          if (this.lipSyncInterval) clearInterval(this.lipSyncInterval);
          onMouthMove?.(0.0);
          onSpeechComplete?.();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        // fallback to timer duration
      }
    }

    // Fallback Timer for audio file duration if synthesis unavailable
    setTimeout(() => {
      this.isSpeaking = false;
      if (this.lipSyncInterval) clearInterval(this.lipSyncInterval);
      onMouthMove?.(0.0);
      onSpeechComplete?.();
    }, cue.durationMs);
  }
}

export const mascotVoiceEngine = new MascotVoiceEngine();
