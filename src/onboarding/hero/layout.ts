/**
 * Responsive stage layout for the hero canvas. Pure.
 *
 * The phone stands on an invisible floor; Buddy sits in front of it at the
 * lower left. Buddy may only overlap the phone at its bottom-left corner
 * (at most 8% of the phone width into the glass, lowest 8% of the screen).
 * The solver nudges the phone right, Buddy left and finally shrinks both
 * until that holds, with a margin for motion and tilt parallax.
 */
import { RIG, NEUTRAL_POSE, rigMatrices, stageMatrix, partPolygon, SILHOUETTE_PARTS, type RigData } from './mascot/rig';

export interface Rect { x: number; y: number; w: number; h: number }

export interface StageLayout {
  width: number;
  height: number;
  floorY: number;
  phone: Rect & { r: number; bezel: number };
  screen: Rect & { r: number };
  buddy: { x: number; y: number; scale: number; width: number; height: number };
  /** keep-clear zones in canvas coordinates */
  zones: { statusBar: Rect; notice: Rect; swipe: Rect; glyph: Rect };
  /** the only part of the phone Buddy may overlap */
  allowed: Rect;
  narrow: boolean;
}

export const ZONES = {
  statusBar: { x0: 0, x1: 1, y0: 0, y1: 0.06 },
  notice: { x0: 0, x1: 1, y0: 0.06, y1: 0.16 },
  swipe: { x0: 0.15, x1: 0.85, y0: 0.28, y1: 0.78 },
  glyph: { x0: 0.3, x1: 0.7, y0: 0.4, y1: 0.6 },
};

function zoneRect(screen: Rect, z: { x0: number; x1: number; y0: number; y1: number }): Rect {
  return { x: screen.x + z.x0 * screen.w, y: screen.y + z.y0 * screen.h, w: (z.x1 - z.x0) * screen.w, h: (z.y1 - z.y0) * screen.h };
}

/** Silhouette polygons at neutral, in source coordinates (cached). */
let cachedNeutral: Array<Array<[number, number]>> | null = null;
function neutralPolys(rig: RigData): Array<Array<[number, number]>> {
  if (cachedNeutral) return cachedNeutral;
  const m = rigMatrices(NEUTRAL_POSE, [1, 0, 0, 0, 1, 0, 0, 0, 1], rig);
  cachedNeutral = SILHOUETTE_PARTS.map((n) => partPolygon(n, m, rig));
  return cachedNeutral;
}

export interface LayoutOptions {
  phoneRadius?: number; // fraction of phone width
  motionMargin?: number; // extra px kept clear around Buddy
}

export function computeLayout(W: number, H: number, opts: LayoutOptions = {}, rig: RigData = RIG): StageLayout {
  const narrow = W < 340;
  const sb = rig.silhouetteBounds; // x0, y0, x1, y1 in source px
  const silW = sb[2] - sb[0];
  const silH = sb[3] - sb[1];
  const radiusFrac = opts.phoneRadius ?? 0.11;
  // Motion margin: head turn, ear twitch, hop and the 4 px tilt difference.
  const marginOpt = opts.motionMargin;
  const polys = neutralPolys(rig);

  let buddyW = Math.min(200, Math.max(120, (narrow ? 0.32 : 0.38) * W));
  let phoneW = Math.min(0.54 * W, (0.78 * H * 9) / 19.5);
  const floorY = H - Math.max(10, H * 0.035);

  for (let iter = 0; iter < 40; iter++) {
    const scale = buddyW / silW;
    const margin = marginOpt ?? Math.max(12, 0.09 * buddyW);
    const buddyH = silH * scale;
    const phoneH = (phoneW * 19.5) / 9;
    const bezel = phoneW * 0.022;
    // Buddy: seat slightly in front of (below) the phone's foot.
    const by = floorY + H * 0.008 - buddyH;
    let bx = W * 0.27 - buddyW / 2;
    bx = Math.max(bx, W * 0.02);
    let px = W * 0.58 - phoneW / 2;
    const py = floorY - phoneH;
    // Allowed overlap corner (canvas coords) for a phone at px.
    const glassBottom = py + phoneH - bezel;
    const screenH = phoneH - 2 * bezel;
    const allowTop = glassBottom - 0.08 * screenH;

    // Required phone x so Buddy's upper body clears the phone and only the
    // lowest band reaches <= 8% of the width into the glass.
    let needPx = -Infinity;
    for (const poly of polys) {
      for (const [sx, sy] of poly) {
        const cx = bx + (sx - sb[0]) * scale;
        const cy = by + (sy - sb[1]) * scale;
        if (cy < allowTop - margin) needPx = Math.max(needPx, cx + margin);
        else needPx = Math.max(needPx, cx + margin - bezel - 0.08 * phoneW * 0.85);
      }
    }
    if (px < needPx) px = needPx;
    const maxPx = W - phoneW - Math.max(6, W * 0.025);
    if (px > maxPx) {
      // Slide Buddy left first, then shrink.
      const shift = px - maxPx;
      const minBx = Math.max(4, W * 0.015);
      const room = bx - minBx;
      if (room >= shift) {
        bx -= shift;
        px = maxPx;
      } else {
        buddyW *= 0.97;
        phoneW *= 0.98;
        continue;
      }
    }
    if (py < H * 0.02) {
      phoneW *= 0.97;
      continue;
    }
    const phone = { x: px, y: py, w: phoneW, h: phoneH, r: radiusFrac * phoneW, bezel };
    const screen = { x: px + bezel, y: py + bezel, w: phoneW - 2 * bezel, h: phoneH - 2 * bezel, r: Math.max(2, radiusFrac * phoneW - bezel) };
    const allowed = { x: phone.x, y: allowTop, w: bezel + 0.08 * phoneW, h: phone.y + phone.h - allowTop };
    return {
      width: W,
      height: H,
      floorY,
      phone,
      screen,
      buddy: { x: bx, y: by, scale, width: buddyW, height: buddyH },
      zones: {
        statusBar: zoneRect(screen, ZONES.statusBar),
        notice: zoneRect(screen, ZONES.notice),
        swipe: zoneRect(screen, ZONES.swipe),
        glyph: zoneRect(screen, ZONES.glyph),
      },
      allowed,
      narrow,
    };
  }
  throw new Error(`hero layout could not be solved for ${W}x${H}`);
}

export function buddyStage(L: StageLayout, dx = 0, dy = 0) {
  'worklet';
  return stageMatrix(L.buddy.x, L.buddy.y, L.buddy.scale, dx, dy);
}
