/** Small colour helpers for the Skia scene. */

/** '#RRGGBB' + alpha (0..1) -> 'rgba(r,g,b,a)'. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** The lavender shadow tint at a given opacity. */
export function tint(rgba: string, alpha: number): string {
  return rgba.replace(/,\s*[\d.]+\)$/, `,${alpha})`);
}
