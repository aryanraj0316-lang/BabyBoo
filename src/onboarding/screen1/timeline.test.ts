import { describe, expect, it } from 'vitest';
import { springAt } from './anim';
import { FRAME_IDS, sceneAt } from './timeline';
import { battery, batteryTakeover, buddyTimeline, demo, dim, spring, swipes, unlock } from './tokens';

const L = demo.loop;
const at = (t: number, elapsed = t) => sceneAt(t, elapsed, 1);

describe('demo timeline', () => {
  it('has an invisible loop seam', () => {
    const end = at(L - 1e-4, L - 1e-4); // the last instant of a loop
    const start = at(0, L); // the first instant of the next loop
    const keys = [
      'feedOpacity', 'feedOffset', 'feedStretch', 'batteryLevel', 'toastIn', 'emptyIcon', 'dim',
      'lockVisible', 'dotVisible', 'haloFactor', 'lightIntensity', 'buddyScaleX', 'buddyScaleY',
      'buddyRotate', 'buddyDy', 'floorShadowScale',
    ] as const;
    for (const k of keys) expect(start[k], k).toBeCloseTo(end[k], 2);
    for (let c = 0; c < 3; c++) {
      expect(start.haloColor[c]).toBeCloseTo(end.haloColor[c], 0);
      expect(start.lightColor[c]).toBeCloseTo(end.lightColor[c], 0);
      expect(start.batteryColor[c]).toBeCloseTo(end.batteryColor[c], 0);
    }
    expect(end.frameTo).toBe(start.frameTo);
    expect(end.frameMix).toBeCloseTo(1, 3);
  });

  it('swipes overshoot 2-3% and settle', () => {
    const peak = Math.max(...Array.from({ length: 200 }, (_, i) => springAt(i / 200, spring.snappy.stiffness, spring.snappy.dampingRatio).x));
    expect(peak).toBeGreaterThan(1.02);
    expect(peak).toBeLessThan(1.03);
    expect(at(swipes.times[1] - 0.01).feedOffset).toBeCloseTo(1, 2);
  });

  it('slows the swipes in Beat 2 and stalls the last one', () => {
    const fast = at(swipes.times[0] + 0.1).feedOffset - 0;
    const last = swipes.times.length - 1;
    const slow = at(swipes.times[last] + 0.1).feedOffset - last;
    expect(slow).toBeLessThan(fast);
    const stallPeak = at(swipes.stall.time + swipes.stall.rise).feedOffset;
    expect(stallPeak).toBeGreaterThan(swipes.times.length + swipes.stall.reach * 0.9);
    expect(at(demo.beats.shutdown + 0.35).feedOffset).toBeCloseTo(swipes.times.length, 1);
  });

  it('stretches the feed only while it moves fast', () => {
    expect(at(0.3).feedStretch).toBe(1);
    expect(at(swipes.times[0] + 0.08).feedStretch).toBeGreaterThan(1.005);
    expect(at(swipes.times[0] + 0.8).feedStretch).toBeLessThan(1.001);
  });

  it('holds the large battery at 5% before draining to zero', () => {
    expect(at(batteryTakeover.from + batteryTakeover.length).batteryLevel).toBeCloseTo(0.05, 3);
    expect(at(battery.drainTo).batteryLevel).toBe(0);
    expect(at(1).batteryColor).toEqual([255, 59, 48]);
    expect(at(battery.drainTo).batteryColor.map(Math.round)).toEqual([255, 59, 48]);
    const levels = Array.from({ length: 30 }, (_, i) => at(battery.drainFrom + i * (battery.drainTo - battery.drainFrom) / 29).batteryLevel);
    expect(levels.every((value, i) => i === 0 || value <= levels[i - 1])).toBe(true);
  });

  it('shows the swipe hand only at reel events and removes it for reduced motion', () => {
    expect(at(0).reelGestureOpacity).toBe(0);
    for (const time of swipes.times) {
      expect(at(time).reelGestureOpacity).toBeGreaterThan(0.99);
      expect(at(time + 0.15).reelGestureTravel).toBeGreaterThan(at(time).reelGestureTravel);
      expect(sceneAt(time, time, 0).reelGestureOpacity).toBe(0);
    }
    expect(at(demo.beats.battery).reelGestureOpacity).toBe(0);
    expect(at(demo.beats.unlock + 1).reelGestureOpacity).toBe(0);
    expect(sceneAt(2, 2, 0).environmentMotion).toBe(0);
    expect(at(2).environmentTime).toBe(2);
  });

  it('keeps the phone dark until the full A gesture completes, then unlocks', () => {
    for (let u = unlock.swipe[0]; u <= unlock.release[0]; u += 0.02) {
      const s = at(demo.beats.unlock + u);
      expect(s.lockOffset).toBe(0);
      expect(s.lockOpacity).toBe(1);
    }
    const released = at(demo.beats.unlock + unlock.release[1] - 0.001);
    expect(released.gestureProgress).toBe(1);
    expect(released.dotCore).toBeGreaterThan(0); // fades, not deleted
    expect(released.trailOpacity).toBeLessThan(0.01);
    expect(at(demo.beats.unlocked).lockVisible).toBe(0);
  });

  it('dims to black before the lock layer takes over, and shows no dot before Beat 4', () => {
    expect(at(dim.at + dim.length + 0.05).dim).toBeCloseTo(1, 3);
    expect(at(dim.at + dim.length + 0.05).lockVisible).toBe(1);
    expect(at(demo.beats.unlock - 0.1).dotVisible).toBe(0);
    expect(at(demo.beats.unlock + 0.1).dotVisible).toBe(1);
  });

  it('keeps all five reel holds and adds two seconds of sleep before the parent turn', () => {
    expect(demo.loop).toBe(26);
    expect(demo.beats.unlock).toBe(17.5);
    expect(demo.beats.unlocked - demo.beats.unlock).toBe(3.5);
    expect(FRAME_IDS[at(15.6).frameTo]).toBe('sleepy');
    expect(FRAME_IDS[at(demo.beats.unlock - 0.01).frameTo]).toBe('sleepy');
    expect(at(16.5).dotVisible).toBe(0);
    expect(swipes.times).toHaveLength(4);
    expect(swipes.times[0]).toBeGreaterThanOrEqual(1.5);
    for (let i = 1; i < swipes.times.length; i++) expect(swipes.times[i] - swipes.times[i - 1]).toBeGreaterThanOrEqual(1.5);
    expect(batteryTakeover.from - swipes.times[3]).toBeGreaterThan(2);
  });

  it('shows the frame mapping from section 7', () => {
    for (const [time, frame] of buddyTimeline) {
      const s = at(time + 0.2);
      expect(FRAME_IDS[s.frameTo]).toBe(frame);
      expect(s.frameMix).toBeCloseTo(1, 3);
    }
  });

  it('breathes 1.00-1.02 at rest and sinks when sleepy', () => {
    const scales = Array.from({ length: 220 }, (_, i) => at(0.4 + i * 0.01).buddyScaleY);
    expect(Math.min(...scales)).toBeGreaterThanOrEqual(0.999);
    expect(Math.max(...scales)).toBeLessThanOrEqual(1.0205);
    expect(Math.max(...scales)).toBeGreaterThan(1.015);
    expect(at(6.5).buddyDy).toBeCloseTo(2, 1);
  });

  it('jumps about 8pt on the arms-up frame', () => {
    const dys = Array.from({ length: 100 }, (_, i) => at(8.2 + i * 0.01).buddyDy);
    expect(Math.min(...dys)).toBeLessThan(-7);
    expect(Math.min(...dys)).toBeGreaterThan(-8.5);
  });

  it('switches living motion off for reduced motion', () => {
    const s = sceneAt(demo.stillTime, 123.4, 0);
    expect(s.buddyRotate).toBe(0);
    expect(s.buddyScaleY).toBeCloseTo(1, 6);
  });
});
