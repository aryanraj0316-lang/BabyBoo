/**
 * Buddy, drawn inside the hero's single Skia canvas.
 *
 * Every animated value is a Reanimated derived value computed on the UI
 * thread from the shared `frame`. Two passes: 'back' (everything behind the
 * phone) and 'front' (the right leg over the phone's bezel corner and the
 * raised paw).
 */
import React from 'react';
import {
  Group, Image, ImageShader, Oval, Path, Rect, Shader, Skia, LinearGradient, vec, Circle,
  type SkImage, type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { RIG, mul, mT, mS, about, apply, partMatrix, rigMatrices, stageMatrix, type M3, type RigMatrices } from './rig';
import { toLocal, NEUTRAL_LIGHT } from './lighting';
import type { HeroFrame, HeroShared } from '../heroFrame';

export type MascotImages = Record<string, SkImage | null>;

interface LayerProps {
  frame: SharedValue<HeroFrame>;
  shared: HeroShared;
  images: MascotImages;
  normals: MascotImages;
  effect: SkRuntimeEffect | null;
  pass: 'back' | 'front';
}

function hexToRgb(h: string): [number, number, number] {
  'worklet';
  return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
}

/** Rig matrices for the current frame (shared by all parts). */
export function useRigMatrices(frame: SharedValue<HeroFrame>, shared: HeroShared) {
  return useDerivedValue<RigMatrices>(() => {
    const L = shared.layout.value;
    const cfg = shared.cfg.value;
    const tilt = shared.tilt.value;
    const k = 8 * cfg.mascot.tiltParallax * (shared.reduced.value ? 0 : 1);
    const stage = stageMatrix(L.buddy.x, L.buddy.y, L.buddy.scale, tilt.x * k, tilt.y * k);
    return rigMatrices(frame.value.d.pose, stage, RIG, cfg.mascot.blinkStyle === 'squash');
  });
}

/** Global light for this frame: key direction (with tilt) and screen spill. */
function useLight(frame: SharedValue<HeroFrame>, shared: HeroShared) {
  return useDerivedValue(() => {
    const cfg = shared.cfg.value;
    const tilt = shared.tilt.value;
    const lt = cfg.lighting;
    const tk = shared.reduced.value ? 0 : 0.35 * cfg.mascot.tiltParallax;
    let lx = lt.dir[0] + tilt.x * tk;
    let ly = lt.dir[1] + tilt.y * tk;
    let lz = lt.dir[2];
    const n = Math.hypot(lx, ly, lz) || 1;
    lx /= n; ly /= n; lz /= n;
    const ph = frame.value.phone;
    const tint = frame.value.tint;
    const s = lt.spill * ph.screenLuma * 1.6;
    return {
      dir: [lx, ly, lz] as [number, number, number],
      spill: [tint[0] * s, tint[1] * s, tint[2] * s] as [number, number, number],
      spillDir: [0.82, -0.1, 0.56] as [number, number, number],
    };
  });
}

function LitPart({ name, mats, light, shared, images, normals, effect }: {
  name: string;
  mats: SharedValue<RigMatrices>;
  light: SharedValue<{ dir: [number, number, number]; spill: [number, number, number]; spillDir: [number, number, number] }>;
  shared: HeroShared;
  images: MascotImages;
  normals: MascotImages;
  effect: SkRuntimeEffect | null;
}) {
  const part = RIG.parts[name];
  const [x, y, w, h] = part.rect;
  const matrix = useDerivedValue(() => partMatrix(name, mats.value));
  const uniforms = useDerivedValue(() => {
    const m = matrix.value;
    const lt = shared.cfg.value.lighting;
    const L = light.value;
    return {
      lightDir: toLocal(L.dir, m),
      neutralDir: toLocal(NEUTRAL_LIGHT, m),
      lightColor: [1, 0.97, 1],
      ambient: lt.ambient,
      key: lt.key,
      specPower: lt.specPower,
      specAmount: lt.specAmount,
      rimAmount: lt.rim * 4,
      spillDir: toLocal(L.spillDir, m),
      spillColor: L.spill,
      debugNormals: shared.cfg.value.debug.normals ? 1 : 0,
    };
  });
  const img = images[name];
  const nrm = normals[name];
  if (!img) return null;
  const rect = Skia.XYWHRect(x, y, w, h);
  if (!effect || !nrm) {
    return (
      <Group matrix={matrix}>
        <Image image={img} x={x} y={y} width={w} height={h} fit="fill" />
      </Group>
    );
  }
  return (
    <Group matrix={matrix}>
      <Rect x={x} y={y} width={w} height={h}>
        <Shader source={effect} uniforms={uniforms}>
          <ImageShader image={img} fit="fill" rect={rect} />
          <ImageShader image={nrm} fit="fill" rect={rect} />
        </Shader>
      </Rect>
    </Group>
  );
}

function FlatPart({ name, matrix, images, opacity, blendMode }: {
  name: string;
  matrix: SharedValue<M3>;
  images: MascotImages;
  opacity?: SharedValue<number> | number;
  blendMode?: 'srcATop';
}) {
  const part = RIG.parts[name];
  const img = images[name];
  if (!img) return null;
  const [x, y, w, h] = part.rect;
  return (
    <Group matrix={matrix} opacity={opacity}>
      <Image image={img} x={x} y={y} width={w} height={h} fit="fill" blendMode={blendMode} />
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Eyes: socket halo (static with the face), eyeball + highlights clipped by
// lids that reveal the real fur beneath, and a soft lash line.
// ---------------------------------------------------------------------------

function Eye({ side, mats, frame, shared, images }: {
  side: 'l' | 'r';
  mats: SharedValue<RigMatrices>;
  frame: SharedValue<HeroFrame>;
  shared: HeroShared;
  images: MascotImages;
}) {
  const e = RIG.eyes[side];
  const R = Math.max(e.r[0], e.r[1]) + 3;
  const lidFrame = useDerivedValue(() => (side === 'l' ? mats.value.lidL : mats.value.lidR));
  const faceM = useDerivedValue(() => mats.value.face);
  // eye and highlight matrices relative to the lid frame
  const eyeRel = useDerivedValue<M3>(() => {
    const p = frame.value.d.pose;
    const open = side === 'l' ? p.openL : p.openR;
    const oy = shared.cfg.value.mascot.blinkStyle === 'squash' ? Math.max(open, 0.02) : 1;
    return about(e.c[0], e.c[1], mS(p.wide, p.wide * oy));
  });
  const hlRel = useDerivedValue<M3>(() => {
    const p = frame.value.d.pose;
    const ox = side === 'l' ? p.eyeLX : p.eyeRX;
    const oy = side === 'l' ? p.eyeLY : p.eyeRY;
    return mul(mT(-ox * 0.75, -oy * 0.75), eyeRel.value);
  });
  const hlOpacity = useDerivedValue(() => {
    const p = frame.value.d.pose;
    const open = side === 'l' ? p.openL : p.openR;
    if (shared.cfg.value.mascot.blinkStyle !== 'squash') return 1;
    const u = Math.min(1, Math.max(0, (open - 0.15) / 0.4));
    return u * u * (3 - 2 * u);
  });
  const lids = useDerivedValue(() => {
    const p = frame.value.d.pose;
    const open = side === 'l' ? p.openL : p.openR;
    const closure = shared.cfg.value.mascot.blinkStyle === 'eyelid' ? 1 - open : 0;
    const squint = p.squint;
    const cx = e.c[0];
    const cy = e.c[1];
    const upRy = 1.15 * R;
    const upRx = 1.35 * R;
    const bottom = cy - R - 2 + (2 * R + 4) * closure;
    const loRy = 1.1 * R;
    const loRx = 1.25 * R;
    const top = cy + R + 2 - (2 * R + 4) * squint;
    return {
      up: Skia.XYWHRect(cx - upRx, bottom - 2 * upRy, upRx * 2, upRy * 2),
      lo: Skia.XYWHRect(cx - loRx, top, loRx * 2, loRy * 2),
      upLash: closure > 0.001 ? Math.min(1, closure * 3) : 0,
      loLash: squint > 0.001 ? Math.min(1, squint * 3) : 0,
      lashW: 4 + 4.4 * Math.max(closure, squint),
    };
  });
  const upClip = useDerivedValue(() => Skia.RRectXY(lids.value.up, lids.value.up.width / 2, lids.value.up.height / 2));
  const loClip = useDerivedValue(() => Skia.RRectXY(lids.value.lo, lids.value.lo.width / 2, lids.value.lo.height / 2));
  const upRect = useDerivedValue(() => lids.value.up);
  const loRect = useDerivedValue(() => lids.value.lo);
  const upOp = useDerivedValue(() => lids.value.upLash * 0.85);
  const loOp = useDerivedValue(() => lids.value.loLash * 0.85);
  const lashW = useDerivedValue(() => lids.value.lashW);
  const eyeClip = Skia.RRectXY(Skia.XYWHRect(e.c[0] - e.r[0] - 4, e.c[1] - e.r[1] - 4, (e.r[0] + 4) * 2, (e.r[1] + 4) * 2), e.r[0] + 4, e.r[1] + 4);
  const eyeImg = images[`eye_${side}`];
  const hlImg = images[`highlight_${side}`];
  const eyePart = RIG.parts[`eye_${side}`];
  const hlPart = RIG.parts[`highlight_${side}`];
  return (
    <>
      <FlatPart name={`eye_halo_${side}`} matrix={faceM} images={images} />
      <Group matrix={lidFrame}>
        <Group clip={upClip} invertClip>
          <Group clip={loClip} invertClip>
            {eyeImg && (
              <Group matrix={eyeRel}>
                <Image image={eyeImg} x={eyePart.rect[0]} y={eyePart.rect[1]} width={eyePart.rect[2]} height={eyePart.rect[3]} fit="fill" />
              </Group>
            )}
            {hlImg && (
              <Group matrix={hlRel} opacity={hlOpacity}>
                <Image image={hlImg} x={hlPart.rect[0]} y={hlPart.rect[1]} width={hlPart.rect[2]} height={hlPart.rect[3]} fit="fill" />
              </Group>
            )}
          </Group>
        </Group>
        <Group clip={eyeClip}>
          <Oval rect={upRect} style="stroke" strokeWidth={lashW} color="#452685" opacity={upOp} />
          <Oval rect={loRect} style="stroke" strokeWidth={lashW} color="#452685" opacity={loOp} />
        </Group>
      </Group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Mouth: exact raster sprite at rest, contour-morph vector for expressions.
// ---------------------------------------------------------------------------

const SHAPES = RIG.mouth.shapes;
const NPTS = SHAPES.smile.length;

function Mouth({ mats, frame, images }: { mats: SharedValue<RigMatrices>; frame: SharedValue<HeroFrame>; images: MascotImages }) {
  const faceM = useDerivedValue(() => mats.value.face);
  const vecW = useDerivedValue(() => {
    const p = frame.value.d.pose;
    const u = Math.min(1, Math.max(0, (1 - p.mouthSmile) / 0.15));
    return u * u * (3 - 2 * u);
  });
  const rasterOp = useDerivedValue(() => 1 - vecW.value);
  const path = useDerivedValue(() => {
    const p = frame.value.d.pose;
    const ws = p.mouthSmile;
    const wf = p.mouthSoft;
    const wo = p.mouthO;
    const wm = p.mouthSmall;
    const pts: number[] = [];
    for (let i = 0; i < NPTS; i++) {
      pts.push(
        SHAPES.smile[i][0] * ws + SHAPES.soft[i][0] * wf + SHAPES.o[i][0] * wo + SHAPES.small[i][0] * wm,
        SHAPES.smile[i][1] * ws + SHAPES.soft[i][1] * wf + SHAPES.o[i][1] * wo + SHAPES.small[i][1] * wm,
      );
    }
    // closed Catmull-Rom through the points
    const P = Skia.PathBuilder.Make();
    P.moveTo(pts[0], pts[1]);
    for (let i = 0; i < NPTS; i++) {
      const i0 = ((i - 1 + NPTS) % NPTS) * 2;
      const i1 = i * 2;
      const i2 = ((i + 1) % NPTS) * 2;
      const i3 = ((i + 2) % NPTS) * 2;
      P.cubicTo(
        pts[i1] + (pts[i2] - pts[i0]) / 6, pts[i1 + 1] + (pts[i2 + 1] - pts[i0 + 1]) / 6,
        pts[i2] - (pts[i3] - pts[i1]) / 6, pts[i2 + 1] - (pts[i3 + 1] - pts[i1 + 1]) / 6,
        pts[i2], pts[i2 + 1],
      );
    }
    P.close();
    return P.detach();
  });
  const tongueRect = useDerivedValue(() => {
    const p = frame.value.d.pose;
    const T = RIG.mouth.tongue;
    const cx = T.smile.c[0] * p.mouthSmile + T.soft.c[0] * p.mouthSoft + T.o.c[0] * p.mouthO + T.small.c[0] * p.mouthSmall;
    const cy = T.smile.c[1] * p.mouthSmile + T.soft.c[1] * p.mouthSoft + T.o.c[1] * p.mouthO + T.small.c[1] * p.mouthSmall;
    const rx = T.smile.r[0] * p.mouthSmile + T.soft.r[0] * p.mouthSoft + T.o.r[0] * p.mouthO + T.small.r[0] * p.mouthSmall;
    const ry = T.smile.r[1] * p.mouthSmile + T.soft.r[1] * p.mouthSoft + T.o.r[1] * p.mouthO + T.small.r[1] * p.mouthSmall;
    return Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2);
  });
  const identity = useDerivedValue<M3>(() => [1, 0, 0, 0, 1, 0, 0, 0, 1]);
  const bb = RIG.mouth.bbox;
  const C = RIG.mouth.colors;
  return (
    <Group matrix={faceM}>
      <FlatPart name="mouth" matrix={identity} images={images} opacity={rasterOp} />
      <Group opacity={vecW}>
        <Path path={path}>
          <LinearGradient start={vec(0, bb[1])} end={vec(0, bb[1] + bb[3])} colors={['#3a1150', C.interiorBottom]} />
        </Path>
        <Group clip={path}>
          <Oval rect={tongueRect}>
            <LinearGradient start={vec(0, bb[1] + bb[3] * 0.4)} end={vec(0, bb[1] + bb[3])} colors={[C.tongueLight, C.tongue]} />
          </Oval>
        </Group>
        <Path path={path} style="stroke" strokeWidth={3} color="#3d1360" opacity={0.55} />
      </Group>
    </Group>
  );
}

// ---------------------------------------------------------------------------

export function MascotLayer({ frame, shared, images, normals, effect, pass }: LayerProps) {
  const mats = useRigMatrices(frame, shared);
  const light = useLight(frame, shared);
  const head = useDerivedValue(() => mats.value.head);
  const opacity = useDerivedValue(() => frame.value.d.pose.opacity);
  const cheekOp = useDerivedValue(() => Math.min(1, frame.value.d.pose.cheek));
  const cheekL = useDerivedValue(() => mats.value.cheekL);
  const cheekR = useDerivedValue(() => mats.value.cheekR);
  const faceBase = useDerivedValue(() => mats.value.faceBase);
  const armM = useDerivedValue(() => mats.value.arm);
  const lit = (name: string) => (
    <LitPart key={name} name={name} mats={mats} light={light} shared={shared} images={images} normals={normals} effect={effect} />
  );
  if (pass === 'front') {
    return (
      <Group opacity={opacity}>
        {lit('leg_r')}
        <FlatPart name="arm_wave_front" matrix={armM} images={images} />
      </Group>
    );
  }
  return (
    <Group opacity={opacity}>
      {lit('ear_l')}
      {lit('ear_r')}
      <Group layer>
        {lit('torso')}
        {lit('arm_rest')}
        {lit('leg_l')}
        {lit('arm_wave')}
        <FlatPart name="chin_shadow" matrix={head} images={images} blendMode="srcATop" />
      </Group>
      {lit('head')}
      <FlatPart name="face_base" matrix={faceBase} images={images} />
      <FlatPart name="cheek_l" matrix={cheekL} images={images} opacity={cheekOp} />
      <FlatPart name="cheek_r" matrix={cheekR} images={images} opacity={cheekOp} />
      <Mouth mats={mats} frame={frame} images={images} />
      <Eye side="l" mats={mats} frame={frame} shared={shared} images={images} />
      <Eye side="r" mats={mats} frame={frame} shared={shared} images={images} />
    </Group>
  );
}

/** Debug overlay: rig polygons, pivots, light vector and gaze target. */
export function MascotDebug({ frame, shared }: { frame: SharedValue<HeroFrame>; shared: HeroShared }) {
  const mats = useRigMatrices(frame, shared);
  const rigPath = useDerivedValue(() => {
    const P = Skia.PathBuilder.Make();
    if (!shared.cfg.value.debug.rig) return P.detach();
    const names = ['ear_l', 'ear_r', 'torso', 'arm_rest', 'leg_l', 'leg_r', 'arm_wave', 'head'];
    for (let n = 0; n < names.length; n++) {
      const part = RIG.parts[names[n]];
      const M = partMatrix(names[n], mats.value);
      const poly = part.polygon;
      for (let i = 0; i < poly.length; i++) {
        const q = apply(M, poly[i][0], poly[i][1]);
        if (i === 0) P.moveTo(q[0], q[1]);
        else P.lineTo(q[0], q[1]);
      }
      P.close();
      const pv = apply(M, part.pivot[0], part.pivot[1]);
      P.addCircle(pv[0], pv[1], 2.5);
    }
    return P.detach();
  });
  const gazeX = useDerivedValue(() => frame.value.d.gazeX);
  const gazeY = useDerivedValue(() => frame.value.d.gazeY);
  const gazeOp = useDerivedValue(() => (shared.cfg.value.debug.gazeTarget ? 1 : 0));
  const lightPath = useDerivedValue(() => {
    const P = Skia.PathBuilder.Make();
    if (!shared.cfg.value.debug.lightVector) return P.detach();
    const L = shared.layout.value;
    const d = shared.cfg.value.lighting.dir;
    const cx = L.buddy.x + L.buddy.width * 0.5;
    const cy = L.buddy.y + L.buddy.height * 0.35;
    P.moveTo(cx, cy);
    P.lineTo(cx - d[0] * 50, cy - d[1] * 50);
    P.addCircle(cx - d[0] * 50, cy - d[1] * 50, 4);
    return P.detach();
  });
  return (
    <Group>
      <Path path={rigPath} style="stroke" strokeWidth={1} color="#ff2d75" />
      <Path path={lightPath} style="stroke" strokeWidth={2} color="#f5a623" />
      <Circle cx={gazeX} cy={gazeY} r={5} color="#00c2ff" opacity={gazeOp} />
    </Group>
  );
}

export { hexToRgb };
