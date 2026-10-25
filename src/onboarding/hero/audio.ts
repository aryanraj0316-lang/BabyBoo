/**
 * Hero sounds and haptics. Sound is off by default; everything respects the
 * Studio toggles. Players are created lazily on first use.
 */
import type { HeroConfig } from './heroConfig';

export type HeroSound = 'chirp' | 'powerDown' | 'chime' | 'giggle';

const SOURCES: Record<HeroSound, number> = {
  chirp: require('../../../assets/sounds/hero/chirp.wav'),
  powerDown: require('../../../assets/sounds/hero/powerDown.wav'),
  chime: require('../../../assets/sounds/hero/chime.wav'),
  giggle: require('../../../assets/sounds/hero/giggle.wav'),
};

type Player = { seekTo: (s: number) => unknown; play: () => void; volume: number; remove?: () => void };
const players: Partial<Record<HeroSound, Player>> = {};

function getPlayer(name: HeroSound): Player | null {
  if (players[name]) return players[name]!;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createAudioPlayer } = require('expo-audio');
    const p = createAudioPlayer(SOURCES[name]) as Player;
    p.volume = 0.6;
    players[name] = p;
    return p;
  } catch {
    return null;
  }
}

export function playHeroSound(name: HeroSound, cfg: HeroConfig) {
  const a = cfg.audio;
  if (!a.enabled) return;
  const allowed = name === 'chirp' ? a.chirp : name === 'powerDown' ? a.powerDown : name === 'chime' ? a.chime : a.giggle;
  if (!allowed) return;
  const p = getPlayer(name);
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch {
    // audio is decorative; ignore failures
  }
}

export function heroHaptic(cfg: HeroConfig, kind: 'light' | 'success') {
  if (!cfg.audio.haptics) return;
  try {
    const H = require('expo-haptics');
    if (kind === 'success') H.notificationAsync(H.NotificationFeedbackType.Success);
    else H.impactAsync(H.ImpactFeedbackStyle.Light);
  } catch {
    // haptics unavailable (web / simulator)
  }
}

export function releaseHeroAudio() {
  for (const k of Object.keys(players) as HeroSound[]) {
    try {
      players[k]?.remove?.();
    } catch {
      // ignore
    }
    delete players[k];
  }
}
