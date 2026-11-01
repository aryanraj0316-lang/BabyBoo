import { describe, expect, it } from 'vitest';
import { springAt } from './anim';
import { FRAME_IDS, sceneAt } from './timeline';
import { buddyTimeline, demo, spring, swipes, unlock } from './tokens';

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
    const slow = at(swipes.times[5] + 0.1).feedOffset - 5;
    expect(slow).toBeLessThan(fast);
    const stallPeak = at(swipes.stall.time + swipes.stall.rise).feedOffset;
    expect(stallPeak).toBeGreaterThan(6.3);
    expect(at(demo.beats.shutdown + 0.35).feedOffset).toBeCloseTo(6, 1);
  });

  it('stretches the feed only while it moves fast', () => {
    expect(at(0.3).feedStretch).toBe(1);
    expect(at(swipes.times[0] + 0.04).feedStretch).toBeGreaterThan(1.01);
    expect(at(swipes.times[0] + 0.8).feedStretch).toBeLessThan(1.001);
  });

  it('drains the battery from green to red', () => {
    expect(at(1).batteryLevel).toBeCloseTo(0.23, 3);
    expect(at(5.5).batteryLevel).toBeCloseTo(0.05, 3);
    expect(at(1).batteryColor).toEqual([52, 199, 89]); // battery.green
    expect(at(5.5).batteryColor.map(Math.round)).toEqual([255, 59, 48]); // battery.red
  });

  it('keeps the dot, trail and lock layer moving together', () => {
    for (let u = unlock.swipe[0]; u <= unlock.release[0]; u += 0.02) {
      const s = at(demo.beats.unlock + u);
      expect(s.lockOffset).toBeCloseTo(s.dotTravel, 6);
    }
    const released = at(demo.beats.unlock + unlock.release[1] - 0.001);
    expect(released.dotCore).toBeGreaterThan(0.3); // fades, not deleted
    expect(released.trailOpacity).toBeLessThan(0.01);
  });

  it('dims to black before the lock layer takes over, and shows no dot before Beat 4', () => {
    expect(at(6.45).dim).toBeCloseTo(1, 3);
    expect(at(6.45).lockVisible).toBe(1);
    expect(at(6.7).dotVisible).toBe(0);
    expect(at(6.85).dotVisible).toBe(1);
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
