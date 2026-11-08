import { noteRegistration } from './noteRegistration.generated';

export const writing = { ...noteRegistration, penAspect: 0.1411975,
  strokeWidth: 0.55, ink: '#181818', durationMs: 240, progressPerEdit: 0.28 } as const;
const points = writing.strokes[0];
let total = 0;
const segments = points.slice(1).map((to, index) => {
  const from = points[index];
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const segment = { from, to, length, start: total };
  total += length;
  return segment;
});
export const WRITING_LENGTH = total;

/** One distance determines BOTH the pen nib and the single revealed ink line. */
export function writingAt(distance: number) {
  'worklet';
  const d = Math.max(0, Math.min(WRITING_LENGTH, distance));
  let x: number = points[0][0]; let y: number = points[0][1];
  for (const segment of segments) {
    if (d < segment.start) break;
    const fraction = Math.min(1, (d - segment.start) / segment.length);
    x = segment.from[0] + (segment.to[0] - segment.from[0]) * fraction;
    y = segment.from[1] + (segment.to[1] - segment.from[1]) * fraction;
  }
  const fraction = d / WRITING_LENGTH;
  return { x, y, end: fraction < 1e-7 ? 0 : fraction > 1 - 1e-7 ? 1 : fraction,
    pawX: (x - points[0][0]) * 0.4, pawY: (y - points[0][1]) * 0.2 };
}
