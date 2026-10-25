#!/usr/bin/env node
// Generates the hero's short, soft sound effects as 16-bit mono WAV files
// from sine and filtered-noise envelopes. No external assets.
//   node tools/generate_hero_sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets/sounds/hero');
const SR = 22050;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767 | 0, i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const make = (dur, fn) => Array.from({ length: Math.round(dur * SR) }, (_, i) => fn(i / SR));

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

// Low-battery chirp: two soft descending blips.
const chirp = make(0.42, (t) => {
  const blip = (t0, f) => (t > t0 ? env(t - t0, 0.008, 0.06) * Math.sin(2 * Math.PI * f * (t - t0) * (1 - (t - t0) * 0.6)) : 0);
  return 0.32 * (blip(0, 1180) + blip(0.16, 940));
});

// Power-down sweep: gentle falling sine with a touch of filtered noise.
let lp = 0;
const powerDown = make(0.6, (t) => {
  const f = 520 * Math.pow(0.25, t / 0.6);
  lp += 0.06 * (rnd() - lp);
  return env(t, 0.02, 0.22) * (0.28 * Math.sin(2 * Math.PI * f * t) + 0.05 * lp);
});

// Wake chime: soft major arpeggio with bell-like partials.
const chime = make(1.1, (t) => {
  const note = (t0, f) => (t > t0 ? env(t - t0, 0.006, 0.35) * (Math.sin(2 * Math.PI * f * (t - t0)) + 0.3 * Math.sin(2 * Math.PI * f * 2.01 * (t - t0))) : 0);
  return 0.16 * (note(0, 784) + note(0.09, 988) + note(0.18, 1175));
});

// Very soft giggle: three quick breathy pitch wobbles.
let lp2 = 0;
const giggle = make(0.5, (t) => {
  let s = 0;
  for (let k = 0; k < 3; k++) {
    const t0 = k * 0.13;
    if (t > t0) {
      const u = t - t0;
      const f = 620 + 90 * Math.sin(u * 40) - k * 30;
      s += env(u, 0.01, 0.05) * Math.sin(2 * Math.PI * f * u);
    }
  }
  lp2 += 0.15 * (rnd() - lp2);
  return 0.18 * s + 0.02 * lp2 * env(t, 0.01, 0.15);
});

mkdirSync(OUT, { recursive: true });
for (const [name, s] of Object.entries({ chirp, powerDown, chime, giggle })) {
  writeFileSync(join(OUT, `${name}.wav`), wav(s));
  console.log('wrote', join('assets/sounds/hero', `${name}.wav`));
}
