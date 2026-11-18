import { describe, expect, it } from 'vitest';
import { buddyClipFrame } from './buddyClipFrame';
import { CLIP_FRAME_INDEX, CLIP_SEGMENTS, CLIP_TILE, CLIP_UNTIL } from './buddyClips.generated';
import { sceneAt } from './timeline';
import { demo } from './tokens';

describe('reviewed Buddy video frames on the shared story clock', () => {
  it('returns to the original ending frames at the exact unlock-success boundary', () => {
    expect(buddyClipFrame(demo.beats.unlocked - 0.001, 1)).toBeGreaterThanOrEqual(0);
    for (const t of [demo.beats.unlocked, demo.beats.rest, demo.loop]) expect(buddyClipFrame(t, 1)).toBe(-1);
    expect(CLIP_UNTIL).toBe(demo.beats.unlocked);
  });
  it('keeps reduced motion on the existing composed still', () => {
    for (const t of [0, 9, 13, 17.5, 20.5]) expect(buddyClipFrame(t, 0)).toBe(-1);
  });
  it('repeated or background-paused story time always chooses identical pixels', () => {
    const s = sceneAt(14.7, 14.7, 1);
    const resumed = sceneAt(14.7, 500, 1);
    expect(buddyClipFrame(s.environmentTime, s.environmentMotion)).toBe(buddyClipFrame(resumed.environmentTime, resumed.environmentMotion));
    expect(buddyClipFrame(0, 1)).toBe(CLIP_FRAME_INDEX[0]);
    expect(CLIP_TILE.width / CLIP_TILE.height).toBeCloseTo(160 / 159);
  });
  it('rejects invalid time rather than drawing an undefined atlas slot', () => {
    for (const t of [-1, NaN, Infinity]) expect(buddyClipFrame(t, 1)).toBe(-1);
  });
  it('trims material instead of slowing any source animation to fill time', () => {
    expect(demo.loop).toBe(21.5);
    for (const [from, to, , sourceFrom, sourceTo] of CLIP_SEGMENTS) {
      expect(sourceTo - sourceFrom).toBeCloseTo(to - from, 5);
    }
    expect(CLIP_FRAME_INDEX.length).toBe(CLIP_UNTIL * 24);
  });
});
