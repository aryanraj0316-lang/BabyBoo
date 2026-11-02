/**
 * Buddy, drawn procedurally with Skia from the measured model (buddyModel.ts).
 *
 * One drawing function serves both the app (recorded into a picture on the UI
 * thread every frame) and the render harness (headless in Node), so what the
 * harness verifies is exactly what the phone draws. The Skia API is passed in
 * through `BuddyResources` for that reason.
 *
 * Fur parts share one SkSL shader:
 *  - coverage: the part's superellipse with a thin, velvety edge (no spiky strands)
 *  - volume: a plush normal (flat in the middle, rounding over at the edge)
 *  - lighting, two modes: 'procedural' (wrapped key light) or 'baked' (a
 *    lightness field fitted to the reference in the part's own frame, so it
 *    moves with the part); both darken fur that faces the ground
 *  - contact occlusion, always dynamic: up to five occluding parts at their
 *    current positions, each with a shadow offset, softness and strength
 *  - rim light, suppressed where the part overlaps a part beneath it (no seams)
 *  - the baked fur grain from the references as the detail layer
 */
import type { SkCanvas, SkImage, SkPaint, SkRuntimeEffect, Skia as SkiaApi } from '@shopify/react-native-skia';
import { BUDDY_MODEL as M, type BuddyView } from './buddyModel';
import { BUDDY_LOOK as LOOK } from './buddyLook';

type SkiaT = typeof SkiaApi;

export interface BuddyResources {
  Skia: SkiaT;
  fur: SkRuntimeEffect;
  grain: SkImage;
}

/** Where to draw: the head centre in canvas pixels and the head width in pixels. */
export interface BuddyPlacement {
  x: number;
  y: number;
  headWidth: number;
}

export type ShadingMode = 'procedural' | 'baked';

export const FUR_SKSL = `
uniform shader grain;
uniform float2 c;
uniform float rx;
uniform float4 shp;        // ryTop, ryBot, nTop, nBot
uniform float rot;
uniform float edge;        // half-width of the soft edge, px
uniform float3 cShadow;
uniform float3 cBase;
uniform float3 cHigh;
uniform float3 cRim;
uniform float3 light;      // light direction (x right, y down, z toward the viewer)
uniform float texScale;    // grain texture px per canvas px
uniform float grainAmt;
uniform float rimAmt;
uniform float plushPow;    // >1: flatter middle, rounder edge (a stuffed toy)
uniform float ground;      // 0..1 darkening of downward-facing fur
uniform float4 o0; uniform float4 o1; uniform float4 o2; uniform float4 o3; uniform float4 o4;
uniform float4 q0; uniform float4 q1; uniform float4 q2; uniform float4 q3; uniform float4 q4;
uniform float4 u0; uniform float4 u1;
uniform float mode;        // 0 procedural, 1 baked
uniform float4 pa; uniform float4 pb; uniform float2 pc;
uniform float3 Lk;         // L* of cShadow, cBase, cHigh
uniform float deepen;      // contact shadows deepen toward cShadow * deepen
uniform float3 sheetTone;  // the reference sheet's fur L* (p5, p50, p95)
uniform float3 masterTone; // the master's: baked lightness is re-toned from one to the other
uniform float limb;        // 1: a limb (tapered capsule shoulder -> paw) instead of a superellipse
uniform float4 lb;         // limb: shoulder centre (xy), paw centre (zw)
uniform float2 lr;         // limb: shoulder radius, paw radius

// Occluder o (cx, cy, rx, ry) with q = (offset x, offset y, softness, strength).
float occlusion(float2 p, float4 o, float4 q) {
  if (o.z <= 0.0) { return 1.0; }
  float so = length((p - o.xy - q.xy) / o.zw);
  return 1.0 - q.w * (1.0 - smoothstep(1.0, 1.0 + q.z, so));
}

// 1 where p lies over a part beneath this one (cx, cy, rx, ry).
float beneath(float2 p, float4 b) {
  if (b.z <= 0.0) { return 0.0; }
  return 1.0 - smoothstep(0.92, 1.0, length((p - b.xy) / b.zw));
}

half4 main(float2 p) {
  float s;
  float rmin;
  float2 uv;
  float2 dirc;   // outward direction in canvas space
  if (limb > 0.5) {
    // One continuous limb: a capsule whose radius grows from the shoulder to the round paw.
    float2 ba = lb.zw - lb.xy;
    float tt = clamp(dot(p - lb.xy, ba) / dot(ba, ba), 0.0, 1.0);
    float2 cl = lb.xy + ba * tt;
    float rr = mix(lr.x, lr.y, tt);
    float dd = length(p - cl);
    s = dd / rr;
    rmin = rr;
    uv = float2(s, tt * 2.0 - 1.0);
    dirc = dd > 0.001 ? (p - cl) / dd : float2(0.0);
  } else {
    float2 d = p - c;
    float cs = cos(rot);
    float sn = sin(rot);
    float2 q = float2(d.x * cs + d.y * sn, -d.x * sn + d.y * cs);
    float ry = q.y < 0.0 ? shp.x : shp.y;
    float n = q.y < 0.0 ? shp.z : shp.w;
    uv = q / float2(rx, ry);
    s = pow(pow(abs(uv.x), n) + pow(abs(uv.y), n), 1.0 / n);
    rmin = min(rx, ry);
    float2 dl = s > 0.001 ? uv / s : float2(0.0);
    dirc = float2(dl.x * cs - dl.y * sn, dl.x * sn + dl.y * cs);
  }
  float t = grain.eval(p * texScale).r - 0.5;

  // Velvety edge: thin and smooth, only lightly broken by the grain.
  float distPx = (1.0 - s) * rmin;
  float alpha = smoothstep(-edge, edge, distPx + t * edge * 0.6);
  if (alpha <= 0.0) { return half4(0.0); }

  // Plush normal: flat in the middle, rounding over toward the edge.
  float sc = clamp(s, 0.0, 1.0);
  float tilt = pow(sc, plushPow);
  float3 nrm = float3(dirc * tilt, sqrt(max(0.0, 1.0 - tilt * tilt)));

  float3 col;
  if (mode < 0.5) {
    float k = clamp((dot(nrm, normalize(light)) + 0.45) / 1.45, 0.0, 1.0);
    col = mix(cShadow, cBase, smoothstep(0.08, 0.62, k));
    col = mix(col, cHigh, smoothstep(0.72, 1.0, k));
  } else {
    float u = uv.x;
    float v = uv.y;
    float L = pa.x + pa.y * u + pa.z * v + pa.w * u * u + pb.x * u * v + pb.y * v * v
            + pb.z * u * u * u + pb.w * u * u * v + pc.x * u * v * v + pc.y * v * v * v;
    // Re-tone from the sheet's lightness to the master's (piecewise linear through p5, p50, p95).
    L = L < sheetTone.y
      ? masterTone.x + (L - sheetTone.x) * (masterTone.y - masterTone.x) / (sheetTone.y - sheetTone.x)
      : masterTone.y + (L - sheetTone.y) * (masterTone.z - masterTone.y) / (sheetTone.z - sheetTone.y);
    // Never darker than a little below the shadow colour (the fit extrapolates in areas it never saw).
    L = clamp(L, Lk.x - 4.0, Lk.z + 4.0);
    if (L < Lk.y) {
      float a = (L - Lk.x) / (Lk.y - Lk.x);
      col = a >= 0.0 ? mix(cShadow, cBase, a) : cShadow * (1.0 + a * 0.35);
    } else {
      col = mix(cBase, cHigh, clamp((L - Lk.y) / (Lk.z - Lk.y), 0.0, 1.0));
    }
  }
  // Fur facing the ground leans toward the (saturated) shadow lavender, never toward grey.
  col = mix(col, cShadow, ground * clamp(nrm.y, 0.0, 1.0));

  // Rim along the silhouette only: not where this part overlaps a part beneath it.
  float over = max(beneath(p, u0), beneath(p, u1));
  col = mix(col, cRim, pow(1.0 - clamp(nrm.z, 0.0, 1.0), 3.0) * rimAmt * (1.0 - over));

  // Dynamic contact occlusion from the parts around this one. It deepens toward the shadow
  // lavender (keeping the hue, as on the master) rather than multiplying toward grey.
  float occ = occlusion(p, o0, q0) * occlusion(p, o1, q1) * occlusion(p, o2, q2) * occlusion(p, o3, q3) * occlusion(p, o4, q4);
  col = mix(cShadow * deepen, col, occ);

  col *= 1.0 + t * grainAmt;
  return half4(col * alpha, alpha);
}
`;

export function makeBuddyResources(Skia: SkiaT, grain: SkImage): BuddyResources {
  const fur = Skia.RuntimeEffect.Make(FUR_SKSL);
  if (!fur) throw new Error('Buddy fur shader failed to compile');
  return { Skia, fur, grain };
}

type Part = { cx: number; cy: number; rx: number; ryTop: number; ryBot: number; nTop: number; nBot: number; rot: number };
/** A limb: one tapered capsule from the shoulder (a) to the round paw (b). */
type Limb = { ax: number; ay: number; bx: number; by: number; ra: number; rb: number };
type Rgb = readonly [number, number, number];
type Ellipse = { cx: number; cy: number; rx: number; ry: number };
type Contact = { by: Ellipse; dx: number; dy: number; soft: number; strength: number };
type Palette = { shadow: Rgb; base: Rgb; high: Rgb; rim: Rgb };
type Shading = {
  light: readonly number[]; rim: number; ground: number; contacts: Contact[]; beneath: Ellipse[];
  poly: readonly number[] | null; plush: number;
};

function rgb01(hex: string): Rgb {
  'worklet';
  const v = parseInt(hex.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

function ellipseOf(p: Part): Ellipse {
  'worklet';
  return { cx: p.cx, cy: p.cy, rx: p.rx, ry: Math.max(p.ryTop, p.ryBot) };
}

function drawFurPart(
  canvas: SkCanvas, res: BuddyResources, part: Part, pl: BuddyPlacement, palette: Palette, sh: Shading, mode: ShadingMode,
  tone: readonly number[], limb?: Limb,
) {
  'worklet';
  const { Skia } = res;
  const W = pl.headWidth;
  const cx = pl.x + part.cx * W;
  const cy = pl.y + part.cy * W;
  const rx = part.rx * W;
  const edge = LOOK.edgeOfHead * W;
  const reach = Math.max(rx, part.ryTop * W, part.ryBot * W) + edge * 3;
  let box = Skia.XYWHRect(cx - reach, cy - reach, reach * 2, reach * 2);
  if (limb) {
    const r = Math.max(limb.ra, limb.rb) * W + edge * 3;
    const x0 = pl.x + Math.min(limb.ax, limb.bx) * W - r;
    const y0 = pl.y + Math.min(limb.ay, limb.by) * W - r;
    box = Skia.XYWHRect(x0, y0, Math.abs(limb.bx - limb.ax) * W + r * 2, Math.abs(limb.by - limb.ay) * W + r * 2);
  }
  const occ: number[] = [];
  const prm: number[] = [];
  for (let i = 0; i < 5; i++) {
    const k = sh.contacts[i];
    if (k) {
      occ.push(pl.x + k.by.cx * W, pl.y + k.by.cy * W, k.by.rx * W, k.by.ry * W);
      prm.push(k.dx * W, k.dy * W, k.soft, k.strength);
    } else {
      occ.push(0, 0, 0, 0);
      prm.push(0, 0, 0, 0);
    }
  }
  const under: number[] = [];
  for (let i = 0; i < 2; i++) {
    const b = sh.beneath[i];
    if (b) under.push(pl.x + b.cx * W, pl.y + b.cy * W, b.rx * W, b.ry * W);
    else under.push(0, 0, 0, 0);
  }
  const poly = sh.poly ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const Lab = M.coloursLab;
  const uniforms = [
    cx, cy, rx,
    part.ryTop * W, part.ryBot * W, part.nTop, part.nBot,
    part.rot,
    edge,
    ...palette.shadow, ...palette.base, ...palette.high, ...palette.rim,
    ...sh.light,
    LOOK.grainHeadPx / W,
    LOOK.grainAmount,
    sh.rim,
    sh.plush,
    sh.ground,
    ...occ, ...prm, ...under,
    mode === 'baked' && sh.poly ? 1 : 0,
    ...poly,
    Lab.furShadow[0], Lab.furBase[0], Lab.furHighlight[0],
    LOOK.contactDeepen,
    ...tone, ...M.masterTone,
    ...(limb
      ? [1, pl.x + limb.ax * W, pl.y + limb.ay * W, pl.x + limb.bx * W, pl.y + limb.by * W, limb.ra * W, limb.rb * W]
      : [0, 0, 0, 0, 0, 0, 0]),
  ];
  const grainShader = res.grain.makeShaderOptions(1, 1, 1, 0); // repeat, repeat, linear filter
  const shader = res.fur.makeShaderWithChildren(uniforms, [grainShader]);
  const paint = Skia.Paint();
  paint.setShader(shader);
  canvas.drawRect(box, paint);
}

function fill(res: BuddyResources, hex: string, alpha = 1): SkPaint {
  'worklet';
  const p = res.Skia.Paint();
  p.setColor(res.Skia.Color(hex));
  p.setAlphaf(alpha);
  p.setAntiAlias(true);
  return p;
}

function clearOf(hex: string): string {
  'worklet';
  const c = rgb01(hex);
  return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},0)`;
}

/** A part's outline as a path (the same superellipse the shader draws), in canvas pixels. */
function superellipsePath(res: BuddyResources, part: Part, pl: BuddyPlacement) {
  'worklet';
  const W = pl.headWidth;
  const steps = LOOK.outlineSteps;
  const cs = Math.cos(part.rot);
  const sn = Math.sin(part.rot);
  let d = '';
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    const top = st < 0;
    const ry = (top ? part.ryTop : part.ryBot) * W;
    const n = top ? part.nTop : part.nBot;
    const px = part.rx * W * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
    const py = ry * Math.sign(st) * Math.pow(Math.abs(st), 2 / n);
    d += `${i === 0 ? 'M' : 'L'} ${pl.x + part.cx * W + px * cs - py * sn} ${pl.y + part.cy * W + px * sn + py * cs} `;
  }
  return res.Skia.Path.MakeFromSVGString(d + 'Z')!;
}

const HEART_SVG = 'M 0 0.85 C -0.35 0.55 -1 0.2 -1 -0.25 C -1 -0.7 -0.45 -0.95 0 -0.5 C 0.45 -0.95 1 -0.7 1 -0.25 C 1 0.2 0.35 0.55 0 0.85 Z';

/**
 * A puffy, raised pad: soft contact shadow under it, a gradient that is lighter
 * up-left and deeper at the edge, and one small soft highlight.
 */
function drawPad(canvas: SkCanvas, res: BuddyResources, cx: number, cy: number, r: number, heart: boolean) {
  'worklet';
  const { Skia } = res;
  const P = LOOK.pad;
  const path = heart ? Skia.Path.MakeFromSVGString(HEART_SVG)! : null;
  const shape = (paint: SkPaint, dy: number) => {
    canvas.save();
    canvas.translate(cx, cy + dy);
    canvas.scale(r, r);
    if (path) canvas.drawPath(path, paint);
    else canvas.drawCircle(0, 0, 1, paint);
    canvas.restore();
  };
  const shadow = fill(res, P.shadow, P.shadowOpacity);
  shadow.setMaskFilter(Skia.MaskFilter.MakeBlur(0, P.shadowBlur, true));
  shape(shadow, P.shadowDrop);
  // The gradient is defined in the pad's unit space (it is drawn under canvas.scale).
  const body = fill(res, M.colours.pad);
  body.setShader(Skia.Shader.MakeRadialGradient({ x: -P.lightOffset, y: -P.lightOffset }, P.gradientReach,
    [Skia.Color(P.light), Skia.Color(M.colours.pad), Skia.Color(P.deep)], [0, 0.55, 1], 0));
  shape(body, 0);
  const hl = fill(res, P.highlight, P.highlightOpacity);
  hl.setMaskFilter(Skia.MaskFilter.MakeBlur(0, r * P.highlightBlur, true));
  canvas.drawOval(Skia.XYWHRect(cx - r * (P.highlightX + P.highlightR), cy - r * (P.highlightY + P.highlightR * 0.7),
    r * P.highlightR * 2, r * P.highlightR * 1.4), hl);
}

/** Draw Buddy in one of the measured views. */
export function drawBuddy(
  canvas: SkCanvas, res: BuddyResources, pl: BuddyPlacement, viewName: BuddyView = 'front', mode: ShadingMode = LOOK.shadingMode,
): void {
  'worklet';
  const { Skia } = res;
  const W = pl.headWidth;
  const C = M.colours as typeof M.colours & { tongueTop?: string };
  const V = M.views[viewName];
  const P = V.parts;
  const fur: Palette = { shadow: rgb01(C.furShadow), base: rgb01(C.furBase), high: rgb01(C.furHighlight), rim: rgb01(C.furRim) };
  const X = (v: number) => pl.x + v * W;
  const Y = (v: number) => pl.y + v * W;
  const K = LOOK.contact;
  const headShadow: Contact = { by: ellipseOf(P.head), ...K.headShadow };
  const beside = (p: Part, k: { soft: number; strength: number; dy?: number }): Contact => ({ by: ellipseOf(p), dx: 0, ...k, dy: k.dy ?? 0 });
  const polys = V.lightPoly as Record<string, readonly number[] | null>;
  const shading = (name: string, contacts: Contact[], beneath: Ellipse[], rim: number): Shading => ({
    light: LOOK.light, rim, ground: LOOK.ground, contacts, beneath, plush: LOOK.plush, poly: polys[name] ?? null,
  });

  // Ears, darkened where they meet the head, each with a recessed pink cup.
  for (const side of ['earL', 'earR'] as const) {
    // The master's ears are the same light fur as the head, shaded a little where they meet it.
    drawFurPart(canvas, res, P[side], pl, fur, shading(side, [beside(P.head, K.earByHead)], [], LOOK.rim.ear), mode, V.tone);
    for (const ie of V.innerEars) {
      if (ie.side !== side) continue;
      const cx = X(ie.c[0]);
      const cy = Y(ie.c[1]);
      const r = ie.r * W;
      const I = LOOK.innerEar;
      canvas.save();
      canvas.clipPath(superellipsePath(res, P[side], pl), 1, true);
      // The cup: lit from below (it is concave), deeper toward its rim.
      const cup = fill(res, C.innerEar);
      cup.setShader(Skia.Shader.MakeRadialGradient({ x: cx, y: cy + r * I.lightDrop }, r * I.reach,
        [Skia.Color(I.light), Skia.Color(C.innerEar), Skia.Color(I.deep)], [0, 0.5, 1], 0));
      cup.setMaskFilter(Skia.MaskFilter.MakeBlur(0, r * I.edgeBlur, true));
      canvas.drawCircle(cx, cy, r, cup);
      // The ear's rim overhangs the cup: a soft shadow along its upper edge.
      const lip = Skia.Paint();
      lip.setShader(Skia.Shader.MakeRadialGradient({ x: cx, y: cy + r * I.lipDrop }, r * I.lipReach,
        [Skia.Color(clearOf(I.lip)), Skia.Color(clearOf(I.lip)), Skia.Color(I.lip)], [0, 0.7, 1], 0));
      lip.setAlphaf(I.lipOpacity);
      canvas.drawCircle(cx, cy, r, lip);
      canvas.restore();
    }
  }

  // Body: the head's shadow falls on it, and it darkens between the limbs.
  drawFurPart(canvas, res, P.body, pl, fur, shading('body', [
    headShadow, beside(P.armL, K.bodyByArm), beside(P.armR, K.bodyByArm), beside(P.footL, K.bodyByFoot), beside(P.footR, K.bodyByFoot),
  ], [], LOOK.rim.body), mode, V.tone);
  // Arms: chubby tubes in front of the body, shaded by the head and by the feet they rest on.
  const limbs = (V as unknown as { limbs?: Record<'armL' | 'armR', Limb> }).limbs;
  if (!limbs) {
    for (const side of ['armL', 'armR'] as const) {
      const foot = side === 'armL' ? P.footL : P.footR;
      drawFurPart(canvas, res, P[side], pl, fur, shading(side, [headShadow, beside(foot, K.armByFoot)], [ellipseOf(P.body)], LOOK.rim.arm), mode, V.tone);
    }
  }
  // Paws are separate parts (the rig waves them later); views measured without them skip them.
  const parts = P as unknown as Record<string, Part | undefined>;
  // Feet with puffy pads, shaded where their paw rests on them.
  for (const side of ['footL', 'footR'] as const) {
    const arm = side === 'footL' ? P.armL : P.armR;
    const lm = limbs ? limbs[side === 'footL' ? 'armL' : 'armR'] : null;
    const paw = lm ? { cx: lm.bx, cy: lm.by, rx: lm.rb, ryTop: lm.rb, ryBot: lm.rb, nTop: 2, nBot: 2, rot: 0 } : parts[side === 'footL' ? 'pawL' : 'pawR'];
    const contacts = paw ? [beside(paw, K.footByPaw)] : [];
    drawFurPart(canvas, res, P[side], pl, fur, shading(side, contacts, [ellipseOf(P.body), ellipseOf(arm)], LOOK.rim.foot), mode, V.tone);
    for (const pad of V.pads) {
      if (pad.side !== side) continue;
      drawPad(canvas, res, X(pad.heart.c[0]), Y(pad.heart.c[1]), pad.heart.r * W * LOOK.heartScale, true);
      for (const [bx, by, br] of pad.beans) drawPad(canvas, res, X(bx), Y(by), br * W, false);
    }
  }
  // Arms as single limbs: a stubby arm ending in a round paw on the tummy, in front of the foot.
  if (limbs) {
    for (const side of ['armL', 'armR'] as const) {
      const foot = side === 'armL' ? P.footL : P.footR;
      drawFurPart(canvas, res, P[side], pl, fur, shading('limb', [headShadow], [ellipseOf(P.body), ellipseOf(foot)], LOOK.rim.arm),
        mode, V.tone, limbs[side]);
    }
  }
  // Round paws at the ends of the arms, resting on the tummy just above the feet.
  for (const side of ['pawL', 'pawR'] as const) {
    const paw = parts[side];
    if (!paw) continue;
    const foot = side === 'pawL' ? P.footL : P.footR;
    drawFurPart(canvas, res, paw, pl, fur, shading(side, [headShadow], [ellipseOf(P.body), ellipseOf(foot)], LOOK.rim.paw), mode, V.tone);
  }
  drawFurPart(canvas, res, P.head, pl, fur, shading('head', [], [ellipseOf(P.body)], LOOK.rim.head), mode, V.tone);

  // The face is painted on the head: clip it to the head's outline.
  canvas.save();
  canvas.clipPath(superellipsePath(res, P.head, pl), 1, true);

  // Eyes: glossy black with ONE highlight (upper right), fixed to the light.
  for (const e of V.eyes) {
    const ex = X(e.c[0]);
    const ey = Y(e.c[1]);
    const erx = e.rx * W;
    const ery = e.ry * W;
    const eyePaint = fill(res, C.eye);
    eyePaint.setShader(Skia.Shader.MakeRadialGradient(
      { x: ex, y: ey - ery * LOOK.eyeGloss.centreUp }, ery * LOOK.eyeGloss.reach,
      [Skia.Color(C.eye), Skia.Color(C.eye), Skia.Color(LOOK.eyeGloss.rim)], [0, LOOK.eyeGloss.from, 1], 0,
    ));
    canvas.drawOval(Skia.XYWHRect(ex - erx, ey - ery, erx * 2, ery * 2), eyePaint);
    const er = Math.sqrt(erx * ery);
    const h = M.highlight;
    canvas.drawCircle(ex + h.dx * er, ey + h.dy * er, h.r * er, fill(res, C.eyeHighlight));
  }

  // Blush: fades to transparent blush (not transparent black, which would darken the edge).
  for (const b of V.blush) {
    const r = b.r * W * LOOK.blushSpread;
    const paint = Skia.Paint();
    paint.setShader(Skia.Shader.MakeRadialGradient({ x: X(b.c[0]), y: Y(b.c[1]) }, r,
      [Skia.Color(C.blush), Skia.Color(C.blush), Skia.Color(clearOf(C.blush))], [0, LOOK.blushCore, 1], 0));
    paint.setAlphaf(LOOK.blushOpacity);
    canvas.drawCircle(X(b.c[0]), Y(b.c[1]), r, paint);
  }

  // Mouth: the traced outline (a deep D with an arched top) when the view has one, else the
  // parametric smile. The tongue is lit lighter at the top.
  const traced = V as unknown as { mouthOutline?: number[][]; tongueOutline?: number[][] };
  const outlinePath = (pts: number[][]) =>
    Skia.Path.MakeFromSVGString(pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${X(x)} ${Y(y)}`).join(' ') + ' Z')!;
  let mouth;
  if (traced.mouthOutline) {
    mouth = outlinePath(traced.mouthOutline);
  } else {
    const Mo = V.mouth;
    const lx = X(Mo.left[0]);
    const ly = Y(Mo.left[1]);
    const rxp = X(Mo.right[0]);
    const ryp = Y(Mo.right[1]);
    const bx = X(Mo.bottom[0]);
    const byp = Y(Mo.bottom[1]);
    const midX = (lx + rxp) / 2;
    const midY = (ly + ryp) / 2 + Mo.topSag * W * 2;
    const belly = LOOK.mouthBelly;
    const round = LOOK.mouthRound;
    mouth = Skia.Path.MakeFromSVGString(
      `M ${lx} ${ly} Q ${midX} ${midY} ${rxp} ${ryp} ` +
      `C ${rxp} ${ryp + (byp - ryp) * belly} ${bx + (rxp - bx) * round} ${byp} ${bx} ${byp} ` +
      `C ${bx - (bx - lx) * round} ${byp} ${lx} ${ly + (byp - ly) * belly} ${lx} ${ly} Z`,
    )!;
  }
  canvas.drawPath(mouth, fill(res, C.mouth));
  canvas.save();
  canvas.clipPath(mouth, 1, true);
  const T = V.mouth.tongue;
  const tongue = fill(res, C.tongue);
  tongue.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: Y(T.cy - T.ry) }, { x: 0, y: Y(T.cy + T.ry) },
    [Skia.Color(C.tongueTop ?? C.tongue), Skia.Color(C.tongue)], [0, 1], 0));
  if (traced.tongueOutline) canvas.drawPath(outlinePath(traced.tongueOutline), tongue);
  else canvas.drawOval(Skia.XYWHRect(X(T.cx - T.rx), Y(T.cy - T.ry), T.rx * 2 * W, T.ry * 2 * W * LOOK.tongueDepth), tongue);
  canvas.restore();
  canvas.restore(); // head clip
}
