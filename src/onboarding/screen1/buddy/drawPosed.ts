/**
 * The rigged Buddy: draws any pose produced by rig.poseBuddy(), with the same fur
 * shader and parts as drawBuddy.ts. Used by the app (recorded into a picture on the
 * UI thread) and by the headless render harness, so both draw identically.
 */
import type { SkCanvas } from '@shopify/react-native-skia';
import { BUDDY_MODEL as M } from './buddyModel';
import { BUDDY_LOOK as LOOK } from './buddyLook';
import {
  clearOf, drawFurPart, drawPad, ellipseOf, fill, rgb01, superellipsePath,
  type BuddyPlacement, type BuddyResources, type Contact, type Ellipse, type Palette, type Part, type Shading, type ShadingMode,
} from './drawBuddy';
import type { Posed, Seg } from './rig';

/** A smooth closed path through a polygon (quadratic curves through the edge midpoints). */
function smoothPath(res: BuddyResources, flat: number[], pl: BuddyPlacement) {
  'worklet';
  const W = pl.headWidth;
  const n = flat.length / 2;
  const at = (i: number) => (((i % n) + n) % n) * 2;
  const X = (i: number) => pl.x + flat[at(i)] * W;
  const Y = (i: number) => pl.y + flat[at(i) + 1] * W;
  let d = `M ${(X(0) + X(1)) / 2} ${(Y(0) + Y(1)) / 2} `;
  for (let i = 1; i <= n; i++) d += `Q ${X(i)} ${Y(i)} ${(X(i) + X(i + 1)) / 2} ${(Y(i) + Y(i + 1)) / 2} `;
  return res.Skia.Path.MakeFromSVGString(d + 'Z')!;
}

function segEllipse(s: Seg): Ellipse {
  'worklet';
  const r = Math.max(s.ra, s.rb);
  return { cx: (s.ax + s.bx) / 2, cy: (s.ay + s.by) / 2, rx: r + Math.abs(s.bx - s.ax) / 2, ry: r + Math.abs(s.by - s.ay) / 2 };
}

export function drawBuddyPosed(
  canvas: SkCanvas, res: BuddyResources, pl: BuddyPlacement, posed: Posed, mode: ShadingMode = LOOK.shadingMode,
  /** Light direction override (the phone relights Buddy; Buddy Lab's light controls). */
  light: readonly number[] = LOOK.light,
): void {
  'worklet';
  const { Skia } = res;
  const W = pl.headWidth;
  const C = M.colours as typeof M.colours & { tongueTop?: string };
  const V = M.views.front;
  const P = posed.parts;
  const fur: Palette = { shadow: rgb01(C.furShadow), base: rgb01(C.furBase), high: rgb01(C.furHighlight), rim: rgb01(C.furRim) };
  const X = (v: number) => pl.x + v * W;
  const Y = (v: number) => pl.y + v * W;
  const K = LOOK.contact;
  const headE = ellipseOf(P.head);
  const headShadow: Contact = { by: headE, ...K.headShadow };
  const beside = (e: Ellipse, k: { soft: number; strength: number; dy?: number }): Contact => ({ by: e, dx: 0, ...k, dy: k.dy ?? 0 });
  const polys = V.lightPoly as Record<string, readonly number[] | null>;
  const shading = (name: string, contacts: Contact[], beneath: Ellipse[], rim: number): Shading => ({
    light, rim, ground: LOOK.ground, contacts, beneath, plush: LOOK.plush, poly: polys[name] ?? null,
  });
  const arms = posed.arms;
  const armE = { armL: segEllipse(arms.armL.fore), armR: segEllipse(arms.armR.fore) };

  // Ears with their recessed pink cups.
  for (const side of ['earL', 'earR'] as const) {
    drawFurPart(canvas, res, P[side], pl, fur, shading(side, [beside(headE, K.earByHead)], [], LOOK.rim.ear), mode, V.tone);
    for (const ie of posed.innerEars) {
      if (ie.side !== side) continue;
      const cx = X(ie.cx);
      const cy = Y(ie.cy);
      const r = ie.r * W;
      const I = LOOK.innerEar;
      canvas.save();
      canvas.clipPath(superellipsePath(res, P[side], pl), 1, true);
      const cup = fill(res, C.innerEar);
      cup.setShader(Skia.Shader.MakeRadialGradient({ x: cx, y: cy + r * I.lightDrop }, r * I.reach,
        [Skia.Color(I.light), Skia.Color(C.innerEar), Skia.Color(I.deep)], [0, 0.5, 1], 0));
      cup.setMaskFilter(Skia.MaskFilter.MakeBlur(0, r * I.edgeBlur, true));
      canvas.drawCircle(cx, cy, r, cup);
      const lip = Skia.Paint();
      lip.setShader(Skia.Shader.MakeRadialGradient({ x: cx, y: cy + r * I.lipDrop }, r * I.lipReach,
        [Skia.Color(clearOf(I.lip)), Skia.Color(clearOf(I.lip)), Skia.Color(I.lip)], [0, 0.7, 1], 0));
      lip.setAlphaf(I.lipOpacity);
      canvas.drawCircle(cx, cy, r, lip);
      canvas.restore();
    }
  }

  // Body, darkened under the head and beside the arms and feet.
  drawFurPart(canvas, res, P.body, pl, fur, shading('body', [
    headShadow, beside(armE.armL, K.bodyByArm), beside(armE.armR, K.bodyByArm),
    beside(ellipseOf(P.footL), K.bodyByFoot), beside(ellipseOf(P.footR), K.bodyByFoot),
  ], [], LOOK.rim.body), mode, V.tone);

  // Feet with puffy pads (the pads follow the foot from its rest position).
  for (const side of ['footL', 'footR'] as const) {
    const arm = arms[side === 'footL' ? 'armL' : 'armR'];
    const pawE: Ellipse = { cx: arm.paw.cx, cy: arm.paw.cy, rx: arm.paw.r, ry: arm.paw.r };
    drawFurPart(canvas, res, P[side], pl, fur, shading(side, arm.front ? [] : [beside(pawE, K.footByPaw)], [ellipseOf(P.body)], LOOK.rim.foot), mode, V.tone);
    const rest = V.parts[side];
    const dx = P[side].cx - rest.cx;
    const dy = P[side].cy - rest.cy;
    for (const pad of V.pads) {
      if (pad.side !== side) continue;
      drawPad(canvas, res, X(pad.heart.c[0] + dx), Y(pad.heart.c[1] + dy), pad.heart.r * W * LOOK.heartScale, true);
      for (const [bx, by, br] of pad.beans) drawPad(canvas, res, X(bx + dx), Y(by + dy), br * W, false);
    }
  }

  // An arm: two tapered segments (shoulder -> elbow -> wrist) and a round paw, with pads when it faces us.
  // Arms use the body's fur tones without the top highlight (they are lit from the side,
  // not from above), so they read as the same plush as the baked body.
  // Their edge darkens toward the shadow lavender (rim = shadow), which is what makes an
  // arm read as a round tube in front of the body, as on the master.
  const limbFur: Palette = { shadow: fur.shadow, base: fur.base, high: fur.base, rim: fur.shadow };
  const capsule = (sg: Seg, k: number) => {
    const dx = sg.bx - sg.ax;
    const dy = sg.by - sg.ay;
    const len = Math.max(1e-6, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    const ra = sg.ra * k;
    const rb = sg.rb * k;
    return Skia.Path.MakeFromSVGString(
      `M ${X(sg.ax + nx * ra)} ${Y(sg.ay + ny * ra)} L ${X(sg.bx + nx * rb)} ${Y(sg.by + ny * rb)} ` +
      `A ${rb * W} ${rb * W} 0 1 1 ${X(sg.bx - nx * rb)} ${Y(sg.by - ny * rb)} L ${X(sg.ax - nx * ra)} ${Y(sg.ay - ny * ra)} ` +
      `A ${ra * W} ${ra * W} 0 1 1 ${X(sg.ax + nx * ra)} ${Y(sg.ay + ny * ra)} Z`,
    )!;
  };
  const drawArm = (side: 'armL' | 'armR', which: 'all' | 'upper' | 'hand') => {
    const a = arms[side];
    // The arm's soft shadow on the body: the crease between arm and tummy.
    if (which !== 'hand') {
      const S = LOOK.limbShadow;
      const sh = fill(res, C.furShadow, S.opacity);
      sh.setMaskFilter(Skia.MaskFilter.MakeBlur(0, S.blur * W, true));
      canvas.save();
      canvas.translate(0, S.dy * W);
      canvas.drawPath(capsule(a.upper, S.spread), sh);
      if (which === 'all') {
        canvas.drawPath(capsule(a.fore, S.spread), sh);
        canvas.drawCircle(X(a.paw.cx), Y(a.paw.cy), a.paw.r * W * S.spread, sh);
      }
      canvas.restore();
    }
    const contacts = [headShadow];
    // Arms keep their dark edge all round (it defines the tube against the body).
    const under: Ellipse[] = [];
    const segs = which === 'all' ? [a.upper, a.fore] : which === 'upper' ? [a.upper] : [a.fore];
    for (const seg of segs) {
      const box = segEllipse(seg);
      const part: Part = { cx: box.cx, cy: box.cy, rx: box.rx, ryTop: box.ry, ryBot: box.ry, nTop: 2, nBot: 2, rot: 0 };
      drawFurPart(canvas, res, part, pl, limbFur, shading('limb', contacts, under, LOOK.rim.arm), mode, V.tone,
        { ax: seg.ax, ay: seg.ay, bx: seg.bx, by: seg.by, ra: seg.ra, rb: seg.rb });
    }
    if (which === 'upper') return;
    const pw = a.paw;
    const pawPart: Part = { cx: pw.cx, cy: pw.cy, rx: pw.r, ryTop: pw.r, ryBot: pw.r, nTop: 2, nBot: 2, rot: 0 };
    drawFurPart(canvas, res, pawPart, pl, limbFur, shading('paw', contacts, [segEllipse(a.fore)], LOOK.rim.paw), mode, V.tone);
    if (pw.open > 0.01) {
      const layer = Skia.Paint();
      layer.setAlphaf(Math.min(1, pw.open));
      canvas.saveLayer(layer);
      canvas.translate(X(pw.cx), Y(pw.cy));
      canvas.rotate((pw.rot * 180) / Math.PI, 0, 0);
      const r = pw.r * W;
      const PP = M.pawPads;
      drawPad(canvas, res, PP.heart[0] * r, PP.heart[1] * r, PP.heart[2] * r * LOOK.heartScale, true);
      for (const [bx, by, br] of PP.beans) drawPad(canvas, res, bx * r, by * r, br * r, false);
      canvas.restore();
    }
  };
  // A paw raised to the face: its upper arm stays behind the head, forearm and paw come in front.
  for (const side of ['armL', 'armR'] as const) drawArm(side, arms[side].front ? 'upper' : 'all');

  // Head; the face is clipped to its outline.
  drawFurPart(canvas, res, P.head, pl, fur, shading('head', [], [ellipseOf(P.body)], LOOK.rim.head), mode, V.tone);
  canvas.save();
  canvas.clipPath(superellipsePath(res, P.head, pl), 1, true);

  for (const b of posed.blush) {
    if (b.alpha <= 0.01) continue;
    const r = b.r * W * LOOK.blushSpread;
    const paint = Skia.Paint();
    paint.setShader(Skia.Shader.MakeRadialGradient({ x: X(b.cx), y: Y(b.cy) }, r,
      [Skia.Color(C.blush), Skia.Color(C.blush), Skia.Color(clearOf(C.blush))], [0, LOOK.blushCore, 1], 0));
    paint.setAlphaf(Math.min(1, LOOK.blushOpacity * b.alpha));
    canvas.drawCircle(X(b.cx), Y(b.cy), r, paint);
  }

  // Eyes: the blended shape, glossy black with the bluish rim low on the edge, and ONE
  // highlight fixed to the light (screen space: it does not turn with the head).
  for (const e of posed.eyes) {
    const er = Math.max(e.er, 1e-4) * W;
    const eyePaint = fill(res, C.eye);
    eyePaint.setShader(Skia.Shader.MakeRadialGradient(
      { x: X(e.cx), y: Y(e.cy) - er * LOOK.eyeGloss.centreUp }, er * LOOK.eyeGloss.reach,
      [Skia.Color(C.eye), Skia.Color(C.eye), Skia.Color(LOOK.eyeGloss.rim)], [0, LOOK.eyeGloss.from, 1], 0,
    ));
    canvas.drawPath(smoothPath(res, e.poly, pl), eyePaint);
    if (e.highlight > 0.01) {
      const h = M.highlight;
      canvas.drawCircle(X(e.cx) + h.dx * er, Y(e.cy) + h.dy * er, h.r * er, fill(res, C.eyeHighlight, e.highlight));
    }
  }

  // Mouth: blended shape, the tongue lit lighter at the top, and a soft inner edge where the
  // fur curls into the mouth (no hard cut-out line).
  const mouth = smoothPath(res, posed.mouth.poly, pl);
  canvas.drawPath(mouth, fill(res, C.mouth));
  canvas.save();
  canvas.clipPath(mouth, 1, true);
  if (posed.mouth.tongueAlpha > 0.01) {
    const tongue = fill(res, C.tongue, posed.mouth.tongueAlpha);
    tongue.setShader(Skia.Shader.MakeLinearGradient({ x: 0, y: Y(posed.mouth.tongueTop) }, { x: 0, y: Y(posed.mouth.tongueBottom) },
      [Skia.Color(C.tongueTop ?? C.tongue), Skia.Color(C.tongue)], [0, 1], 0));
    canvas.drawPath(smoothPath(res, posed.mouth.tongue, pl), tongue);
  }
  const lip = fill(res, C.furBase, LOOK.mouthLip.opacity);
  lip.setStyle(1); // stroke
  lip.setStrokeWidth(LOOK.mouthLip.width * W);
  lip.setMaskFilter(Skia.MaskFilter.MakeBlur(0, LOOK.mouthLip.blur * W, true));
  canvas.drawPath(mouth, lip);
  canvas.restore();
  canvas.restore(); // head clip

  // Paws raised to the face are drawn in front of it.
  for (const side of ['armL', 'armR'] as const) if (arms[side].front) drawArm(side, 'hand');
}
