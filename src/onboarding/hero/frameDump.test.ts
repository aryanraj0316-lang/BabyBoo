/**
 * Writes docs/hero-frames.json (start, middle and end of every beat at the
 * five review canvas sizes) for tools/render_frame_strip.py.
 * Runs only when HERO_DUMP=1:  HERO_DUMP=1 npx vitest run frameDump
 */
import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { BEAT_ORDER, DEFAULT_CONFIG } from './heroConfig';
import { keyTimes, phoneStateAt } from './heroTimeline';
import { fingerAt, sampleStrokes } from './gesture';
import { computeLayout } from './layout';
import { blinkSchedule, direct, sparkleAt, twitchSchedule } from './director';
import { TEST_SIZES } from './contextCheck';

it.skipIf(process.env.HERO_DUMP !== '1')('dump review frames', () => {
  const cfg = DEFAULT_CONFIG;
  const K = keyTimes(cfg);
  const samples = sampleStrokes(cfg.finger.strokes);
  const out: unknown[] = [];
  for (const [W, H] of TEST_SIZES) {
    const layout = computeLayout(W, H);
    const frames = [];
    for (const b of BEAT_ORDER) {
      const { start, end } = cfg.beats[b];
      for (const [tag, u] of [['start', 0.04], ['mid', 0.5], ['end', 0.96]] as const) {
        const t = start + (end - start) * u;
        const master = t;
        const phone = phoneStateAt(t, cfg, master);
        const finger = fingerAt(t, cfg, samples, K);
        const d = direct({ t, master, cfg, layout, phone, finger, blinks: blinkSchedule(cfg, 0), twitches: twitchSchedule(cfg, 0), touchW: 0, touchX: 0, touchY: 0, giggleAt: -1e6, K });
        const sparkles = d.sparkle > 0 ? Array.from({ length: cfg.mascot.sparkles }, (_, i) => sparkleAt(i, d.sparkleT, layout)) : [];
        frames.push({ beat: b, tag, t, phone, finger, pose: d.pose, intent: d.intent, gaze: [d.gazeX, d.gazeY], sparkle: d.sparkle, sparkles });
      }
    }
    out.push({ W, H, layout, frames, strokes: samples.map((s) => s.pts) });
  }
  mkdirSync('docs', { recursive: true });
  writeFileSync('docs/hero-frames.json', JSON.stringify(out));
});
