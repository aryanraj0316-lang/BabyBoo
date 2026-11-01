/**
 * Buddy, drawn procedurally with Skia from the measured model (buddyModel.ts).
 *
 * One drawing function serves both the app (recorded into a picture on the UI
 * thread every frame) and the render harness (headless in Node), so what the
 * harness verifies is exactly what the phone draws. The Skia API is passed in
 * through `BuddyResources` for that reason.
 *
 * Fur parts share one SkSL shader: superellipse coverage with a grain-broken
 * fuzzy edge (never a crisp outline), a dome normal for soft volume lighting
 * (key + ambient, soft terminator, rim), contact darkening near an occluding
 * part, and the baked fur grain from the references as the detail layer.
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

export const FUR_SKSL = `
uniform shader grain;
uniform float2 c;
uniform float rx;
uniform float4 shp;      // ryTop, ryBot, nTop, nBot
uniform float rot;
uniform float edge;      // fuzz width in px
uniform float3 cShadow;
uniform float3 cBase;
uniform float3 cHigh;
uniform float3 cRim;
uniform float3 light;    // light direction (x right, y down, z toward the viewer); flipped y for concave parts
uniform float texScale;  // grain texture px per canvas px
uniform float grainAmt;
uniform float rimAmt;
uniform float4 occ0;     // up to three occluding ellipses: cx, cy, rx, ry (rx = 0 for none)
uniform float4 occ1;
uniform float4 occ2;
uniform float occAmt;

half4 main(float2 p) {
  float2 d = p - c;
  float cs = cos(rot);
  float sn = sin(rot);
  float2 q = float2(d.x * cs + d.y * sn, -d.x * sn + d.y * cs);
  float ry = q.y < 0.0 ? shp.x : shp.y;
  float n = q.y < 0.0 ? shp.z : shp.w;
  float2 u = q / float2(rx, ry);
  float s = pow(pow(abs(u.x), n) + pow(abs(u.y), n), 1.0 / n);
  float t = grain.eval(p * texScale).r - 0.5;

  // Fuzzy edge centred on the outline (so the silhouette keeps its measured size),
  // broken up by the grain.
  float distPx = (1.0 - s) * min(rx, ry);
  float alpha = smoothstep(-edge * 0.5, edge * 0.5, distPx + t * edge * 0.9);
  if (alpha <= 0.0) { return half4(0.0); }

  // Dome normal from the superellipse, rotated back to canvas space.
  float sc = clamp(s, 0.0, 1.0);
  float3 nl = normalize(float3(u.x, u.y, 1.25 * sqrt(max(0.0, 1.0 - sc * sc))));
  float3 nrm = float3(nl.x * cs - nl.y * sn, nl.x * sn + nl.y * cs, nl.z);

  // Wrapped key light with a soft terminator, then a rim along the silhouette.
  float k = clamp((dot(nrm, normalize(light)) + 0.45) / 1.45, 0.0, 1.0);
  float3 col = mix(cShadow, cBase, smoothstep(0.08, 0.62, k));
  col = mix(col, cHigh, smoothstep(0.72, 1.0, k));
  col = mix(col, cRim, pow(1.0 - clamp(nrm.z, 0.0, 1.0), 3.0) * rimAmt);

  // Contact darkening just outside each occluding part (under the chin, beside the arms).
  float shade = 1.0;
  for (int i = 0; i < 3; i++) {
    float4 occ = i == 0 ? occ0 : (i == 1 ? occ1 : occ2);
    if (occ.z > 0.0) {
      float so = length((p - occ.xy) / occ.zw);
      shade *= 1.0 - occAmt * exp(-max(so - 1.0, 0.0) * 9.0) * step(1.0, so);
    }
  }
  col *= shade;

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
type Rgb = readonly [number, number, number];
type Occluder = { cx: number; cy: number; rx: number; ry: number };
type Shading = { light: readonly number[]; rim: number; occluders: Occluder[]; contact: number };

function rgb01(hex: string): Rgb {
  'worklet';
  const v = parseInt(hex.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

function drawFurPart(
  canvas: SkCanvas, res: BuddyResources, part: Part, pl: BuddyPlacement,
  palette: { shadow: Rgb; base: Rgb; high: Rgb; rim: Rgb }, shading: Shading,
) {
  'worklet';
  const { Skia } = res;
  const W = pl.headWidth;
  const cx = pl.x + part.cx * W;
  const cy = pl.y + part.cy * W;
  const rx = part.rx * W;
  const reach = Math.max(rx, part.ryTop * W, part.ryBot * W) + LOOK.edgeOfHead * W * 2;
  const occ: number[] = [];
  for (let i = 0; i < 3; i++) {
    const o = shading.occluders[i];
    if (o) occ.push(pl.x + o.cx * W, pl.y + o.cy * W, o.rx * W, o.ry * W);
    else occ.push(0, 0, 0, 0);
  }
  const uniforms = [
    cx, cy, rx,
    part.ryTop * W, part.ryBot * W, part.nTop, part.nBot,
    part.rot,
    LOOK.edgeOfHead * W,
    ...palette.shadow, ...palette.base, ...palette.high, ...palette.rim,
    ...shading.light,
    LOOK.grainHeadPx / W,
    LOOK.grainAmount,
    shading.rim,
    ...occ, shading.contact,
  ];
  const grainShader = res.grain.makeShaderOptions(1, 1, 1, 0); // repeat, repeat, linear filter
  const shader = res.fur.makeShaderWithChildren(uniforms, [grainShader]);
  const paint = Skia.Paint();
  paint.setShader(shader);
  canvas.drawRect(Skia.XYWHRect(cx - reach, cy - reach, reach * 2, reach * 2), paint);
}

function fill(res: BuddyResources, hex: string, alpha = 1): SkPaint {
  'worklet';
  const p = res.Skia.Paint();
  p.setColor(res.Skia.Color(hex));
  p.setAlphaf(alpha);
  p.setAntiAlias(true);
  return p;
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
    const x = pl.x + part.cx * W + px * cs - py * sn;
    const y = pl.y + part.cy * W + px * sn + py * cs;
    d += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
  }
  return res.Skia.Path.MakeFromSVGString(d + 'Z')!;
}

const HEART_SVG = 'M 0 0.85 C -0.35 0.55 -1 0.2 -1 -0.25 C -1 -0.7 -0.45 -0.95 0 -0.5 C 0.45 -0.95 1 -0.7 1 -0.25 C 1 0.2 0.35 0.55 0 0.85 Z';

/** A heart pad, pointing down, centred at (cx, cy) with half-width r (positioned by the canvas, no path mutation). */
function drawHeart(canvas: SkCanvas, res: BuddyResources, cx: number, cy: number, r: number, paint: SkPaint) {
  'worklet';
  canvas.save();
  canvas.translate(cx, cy);
  canvas.scale(r, r);
  canvas.drawPath(res.Skia.Path.MakeFromSVGString(HEART_SVG)!, paint);
  canvas.restore();
}

/** Draw Buddy in one of the measured views (F1: static likeness). */
export function drawBuddy(canvas: SkCanvas, res: BuddyResources, pl: BuddyPlacement, viewName: BuddyView = 'front'): void {
  'worklet';
  const { Skia } = res;
  const W = pl.headWidth;
  const C = M.colours;
  const V = M.views[viewName];
  const P = V.parts;
  const fur = { shadow: rgb01(C.furShadow), base: rgb01(C.furBase), high: rgb01(C.furHighlight), rim: rgb01(C.furRim) };
  // Ears sit in the head's shade: their own measured fur colour.
  const earFur = { shadow: rgb01(C.furShadow), base: rgb01(C.earFur), high: rgb01(C.furBase), rim: rgb01(C.furRim) };
  const earPink = { shadow: rgb01(LOOK.innerEarShadow), base: rgb01(C.innerEar), high: rgb01(LOOK.innerEarHigh), rim: rgb01(C.innerEar) };
  const X = (v: number) => pl.x + v * W;
  const Y = (v: number) => pl.y + v * W;
  const head = P.head;
  const chin: Occluder = { cx: head.cx, cy: head.cy, rx: head.rx, ry: head.ryBot };
  const asOcc = (p: Part): Occluder => ({ cx: p.cx, cy: p.cy, rx: p.rx, ry: Math.max(p.ryTop, p.ryBot) });
  const lit = (rim: number, occluders: Occluder[] = []): Shading => ({ light: LOOK.light, rim, occluders, contact: LOOK.contact });
  const cup: Shading = { light: LOOK.cupLight, rim: 0, occluders: [], contact: 0 };

  // Back to front: ears (with their pink cups), body, arms, feet with pads, head, face.
  for (const side of ['earL', 'earR'] as const) {
    drawFurPart(canvas, res, P[side], pl, earFur, lit(LOOK.rim.ear));
    for (const ie of V.innerEars) {
      if (ie.side !== side) continue;
      drawFurPart(canvas, res, { cx: ie.c[0], cy: ie.c[1], rx: ie.r, ryTop: ie.r, ryBot: ie.r, nTop: 2, nBot: 2, rot: 0 }, pl, earPink, cup);
    }
  }
  drawFurPart(canvas, res, P.body, pl, fur, lit(LOOK.rim.body, [chin, asOcc(P.armL), asOcc(P.armR)]));
  drawFurPart(canvas, res, P.armL, pl, fur, lit(LOOK.rim.arm, [chin, asOcc(P.footL)]));
  drawFurPart(canvas, res, P.armR, pl, fur, lit(LOOK.rim.arm, [chin, asOcc(P.footR)]));
  for (const side of ['footL', 'footR'] as const) {
    drawFurPart(canvas, res, P[side], pl, fur, lit(LOOK.rim.foot));
    for (const pad of V.pads) {
      if (pad.side !== side) continue;
      drawHeart(canvas, res, X(pad.heart.c[0]), Y(pad.heart.c[1]), pad.heart.r * W * LOOK.heartScale, fill(res, C.pad));
      for (const [bx, by, br] of pad.beans) {
        canvas.drawOval(Skia.XYWHRect(X(bx) - br * W, Y(by) - br * W, br * W * 2, br * W * 2), fill(res, C.bean));
      }
    }
  }
  drawFurPart(canvas, res, head, pl, fur, lit(LOOK.rim.head));

  // The face is painted on the head: clip it to the head's outline (the far blush in the
  // 3/4 view would otherwise spill past the cheek).
  canvas.save();
  canvas.clipPath(superellipsePath(res, head, pl), 1, true);

  // Eyes: glossy black; highlights fixed to the light (same offset in both eyes).
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
    const hs = M.highlightSmall;
    canvas.drawCircle(ex + hs.dx * er, ey + hs.dy * er, hs.r * er, fill(res, C.eyeHighlight, hs.opacity));
  }

  // Blush: fades to transparent blush (not transparent black, which would darken the edge).
  const bc = rgb01(C.blush);
  const clear = Skia.Color(`rgba(${Math.round(bc[0] * 255)},${Math.round(bc[1] * 255)},${Math.round(bc[2] * 255)},0)`);
  for (const b of V.blush) {
    const r = b.r * W * LOOK.blushSpread;
    const paint = Skia.Paint();
    paint.setShader(Skia.Shader.MakeRadialGradient({ x: X(b.c[0]), y: Y(b.c[1]) }, r,
      [Skia.Color(C.blush), Skia.Color(C.blush), clear], [0, LOOK.blushCore, 1], 0));
    paint.setAlphaf(LOOK.blushOpacity);
    canvas.drawCircle(X(b.c[0]), Y(b.c[1]), r, paint);
  }

  // Mouth: a smile with a gently curved top edge and a rounded bottom, tongue inside.
  const Mo = V.mouth;
  const left = X(Mo.cx - Mo.width / 2);
  const right = X(Mo.cx + Mo.width / 2);
  const top = Y(Mo.cornerY);
  const bottom = Y(Mo.cornerY + Mo.depth);
  const mid = X(Mo.cx);
  const mouth = Skia.Path.MakeFromSVGString(
    `M ${left} ${top} Q ${mid} ${top + Mo.topSag * W * 2} ${right} ${top} ` +
    `C ${right} ${top + (bottom - top) * LOOK.mouthBelly} ${mid + (right - mid) * LOOK.mouthRound} ${bottom} ${mid} ${bottom} ` +
    `C ${mid - (mid - left) * LOOK.mouthRound} ${bottom} ${left} ${top + (bottom - top) * LOOK.mouthBelly} ${left} ${top} Z`,
  )!;
  canvas.drawPath(mouth, fill(res, C.mouth));
  canvas.save();
  canvas.clipPath(mouth, 1, true);
  const T = Mo.tongue;
  canvas.drawOval(Skia.XYWHRect(X(T.cx - T.rx), Y(T.cy - T.ry), T.rx * 2 * W, T.ry * 2 * W * LOOK.tongueDepth), fill(res, C.tongue));
  canvas.restore();
  canvas.restore(); // head clip
}
