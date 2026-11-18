import { CLIP_FPS, CLIP_FRAME_INDEX, CLIP_UNTIL } from './buddyClips.generated';

/** Select existing rendered pixels from the phone's clock; no playback timer. */
export function buddyClipFrame(time: number, motion: number): number {
  'worklet';
  if (motion === 0 || !Number.isFinite(time) || time < 0 || time >= CLIP_UNTIL) return -1;
  return CLIP_FRAME_INDEX[Math.min(CLIP_FRAME_INDEX.length - 1, Math.floor(time * CLIP_FPS))] ?? -1;
}
