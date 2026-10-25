import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, PRESETS, validateConfig, A_PRESET } from './heroConfig';
import { checkBeats, runContextCheck } from './contextCheck';
import { loopEnd, loopStart, phoneStateAt, keyTimes } from './heroTimeline';
import { fingerAt, sampleStrokes } from './gesture';
import { computeLayout } from './layout';
import { blinkSchedule, direct, twitchSchedule } from './director';

describe('hero context rules', () => {
  for (const [name, cfg] of Object.entries(PRESETS)) {
    it(`${name}: no violations across the whole loop at all five sizes`, () => {
      const res = runContextCheck(cfg);
      const summary = res.violations.slice(0, 15).map((v) => `${v.size} t=${v.t.toFixed(2)} ${v.rule} ${v.detail}`);
      expect(summary).toEqual([]);
      expect(res.samples).toBeGreaterThan(1000);
    });
  }

  it('beats match the timeline table within 30 ms', () => {
    expect(checkBeats(DEFAULT_CONFIG)).toEqual([]);
  });

  it('loop is seamless: the state at the loop end equals the state at the loop start', () => {
    const cfg = DEFAULT_CONFIG;
    const lay = computeLayout(360, 640);
    const K = keyTimes(cfg);
    const samples = sampleStrokes(cfg.finger.strokes);
    const L = loopEnd(cfg) - loopStart(cfg);
    const at = (t: number, master: number, pass: number) => {
      const phone = phoneStateAt(t, cfg, master);
      const finger = fingerAt(t, cfg, samples, K);
      return { phone, d: direct({ t, master, cfg, layout: lay, phone, finger, blinks: blinkSchedule(cfg, pass), twitches: twitchSchedule(cfg, pass), touchW: 0, touchX: 0, touchY: 0, giggleAt: -1e6, K }) };
    };
    const a = at(loopEnd(cfg) - 1e-4, loopEnd(cfg) - 1e-4, 0);
    const b = at(loopStart(cfg), loopStart(cfg) + L, 1);
    expect(Math.abs(a.phone.battery - b.phone.battery)).toBeLessThan(1e-3);
    const dph = Math.abs(a.phone.phase - b.phone.phase) % 1;
    expect(Math.min(dph, 1 - dph)).toBeLessThan(2e-3);
    for (const k of ['bodySx', 'bodySy', 'headRot', 'arm', 'openL', 'mouthSmile'] as const) {
      expect({ k, diff: +Math.abs(a.d.pose[k] - b.d.pose[k]).toFixed(2) }).toEqual({ k, diff: 0 });
    }
  });

  it('the A preset reads as an A: apex on top, feet at the bottom, crossbar between', () => {
    const [s1, s2] = A_PRESET;
    const apex = s1.reduce((m, p) => (p[1] < m[1] ? p : m));
    expect(apex[0]).toBeGreaterThan(0.45);
    expect(apex[0]).toBeLessThan(0.55);
    expect(s1[0][1]).toBeGreaterThan(0.65);
    expect(s1[s1.length - 1][1]).toBeGreaterThan(0.65);
    expect(s2[0][0]).toBeLessThan(s2[s2.length - 1][0]);
    const barY = s2[0][1];
    expect(barY).toBeGreaterThan(apex[1] + 0.15);
    expect(barY).toBeLessThan(s1[0][1] - 0.1);
  });

  it('config validation clamps and survives a JSON round trip', () => {
    const json = JSON.stringify(DEFAULT_CONFIG);
    expect(validateConfig(JSON.parse(json))).toEqual(DEFAULT_CONFIG);
    const bad = validateConfig({ speed: 99, mascot: { breath: -1, blinkStyle: 'wink' }, finger: { strokes: 'nope' } });
    expect(bad.speed).toBe(2);
    expect(bad.mascot.breath).toBe(0);
    expect(bad.mascot.blinkStyle).toBe('eyelid');
    expect(bad.finger.strokes).toEqual(A_PRESET);
  });
});
