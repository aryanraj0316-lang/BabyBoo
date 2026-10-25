/**
 * A generic modern phone (not modelled on any brand): 9:19.5, ~11% corner
 * radius, 2.2% bezel, punch-hole camera, thin metallic edge whose highlight
 * shifts with tilt, and a faint glass sheen that keeps drifting even when the
 * screen is black.
 */
import React, { useMemo } from 'react';
import {
  BlurMask, Circle, ColorMatrix, Group, LinearGradient, Paint, Paragraph, RadialGradient, Rect, RoundedRect,
  Skia, vec, Path, TextAlign,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { BEZEL_PRESETS } from '../heroConfig';
import type { HeroFrame, HeroShared } from '../heroFrame';
import type { StageLayout } from '../layout';
import type { StrokeSamples } from '../gesture';
import { CartoonScene } from './CartoonScene';
import { StatusBar } from './StatusBar';
import { DeadBattery } from './DeadBattery';
import { PatternDemo } from './PatternDemo';

function saturationMatrix(s: number): number[] {
  'worklet';
  const lr = 0.2126 * (1 - s);
  const lg = 0.7152 * (1 - s);
  const lb = 0.0722 * (1 - s);
  return [
    lr + s, lg, lb, 0, 0,
    lr, lg + s, lb, 0, 0,
    lr, lg, lb + s, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

function Notice({ frame, layout, text }: { frame: SharedValue<HeroFrame>; layout: StageLayout; text: string }) {
  const s = layout.screen;
  const w = s.w * 0.88;
  const h = s.h * 0.085;
  const x = s.x + (s.w - w) / 2;
  const yIn = s.y + s.h * 0.065;
  const fs = Math.max(8, Math.min(h * 0.3, w / 17));
  const para = useMemo(() => {
    try {
      const b = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Left, maxLines: 2 });
      b.pushStyle({ color: Skia.Color('#26213A'), fontSize: fs, fontStyle: { weight: 600 }, fontFamilies: ['sans-serif', 'Noto Sans Devanagari', 'Roboto'] });
      b.addText(text);
      const p = b.build();
      p.layout(w - h * 1.25);
      return p;
    } catch {
      return null;
    }
  }, [text, fs, w, h]);
  const transform = useDerivedValue(() => {
    const n = frame.value.phone.notice;
    return [{ translateY: (1 - n) * -(h + s.h * 0.08) }];
  });
  const opacity = useDerivedValue(() => Math.min(1, frame.value.phone.notice * 1.5));
  const ph = para ? para.getHeight() : fs;
  const iconX = x + h * 0.28;
  const iconW = h * 0.42;
  const iconH = iconW * 0.55;
  const iconY = yIn + (h - iconH) / 2;
  return (
    <Group transform={transform} opacity={opacity}>
      <RoundedRect x={x} y={yIn} width={w} height={h} r={h * 0.32} color="#FFFFFF" opacity={0.94}>
        <BlurMask blur={0.6} style="solid" />
      </RoundedRect>
      <RoundedRect x={iconX} y={iconY} width={iconW} height={iconH} r={iconH * 0.22} color="#E2483D" style="stroke" strokeWidth={1.4} />
      <Rect x={iconX + iconW + 0.5} y={iconY + iconH * 0.3} width={1.5} height={iconH * 0.4} color="#E2483D" />
      <Rect x={iconX + 1.6} y={iconY + 1.6} width={iconW * 0.12} height={iconH - 3.2} color="#E2483D" />
      {para && <Paragraph paragraph={para} x={x + h * 0.95} y={yIn + (h - ph) / 2} width={w - h * 1.25} />}
    </Group>
  );
}

export function PhoneLayer({ frame, shared, layout, samples, noticeText, bezel, sheen, palette, time, trailColor }: {
  frame: SharedValue<HeroFrame>;
  shared: HeroShared;
  layout: StageLayout;
  samples: StrokeSamples[];
  noticeText: string;
  bezel: string;
  sheen: number;
  palette: string;
  time: string;
  trailColor: string;
}) {
  const P = layout.phone;
  const S = layout.screen;
  const body = BEZEL_PRESETS[bezel] || BEZEL_PRESETS.graphite;
  const screenClip = useMemo(() => Skia.RRectXY(Skia.XYWHRect(S.x, S.y, S.w, S.h), S.r, S.r), [S.x, S.y, S.w, S.h, S.r]);
  const transform = useDerivedValue(() => {
    const t = shared.tilt.value;
    const k = shared.reduced.value ? 0 : 12 * shared.cfg.value.mascot.tiltParallax;
    const intro = frame.value.phone.intro;
    return [{ translateX: t.x * k }, { translateY: t.y * k + (1 - intro) * 24 }];
  });
  const opacity = useDerivedValue(() => frame.value.phone.intro);
  const satMatrix = useDerivedValue(() => saturationMatrix(frame.value.phone.saturation));
  const dimOp = useDerivedValue(() => frame.value.phone.dim);
  // Power-off black with a radial hole for the wake reveal.
  const blackOp = useDerivedValue(() => frame.value.phone.black);
  const revealC = useDerivedValue(() => vec(S.x + frame.value.phone.revealX * S.w, S.y + frame.value.phone.revealY * S.h));
  const revealR = useDerivedValue(() => {
    const ph = frame.value.phone;
    const maxR = Math.hypot(S.w, S.h) * 1.05;
    return Math.max(1, ph.reveal * maxR);
  });
  const revealColors = useDerivedValue(() => (frame.value.phone.reveal > 0 ? ['#00000000', '#00000000', '#000000FF', '#000000FF'] : ['#000000FF', '#000000FF', '#000000FF', '#000000FF']));
  const sheenT = useDerivedValue(() => {
    const m = frame.value.master;
    const u = ((m * 0.06) % 1.6) - 0.3;
    return [{ translateX: S.x + u * S.w }];
  });
  const edgeStart = useDerivedValue(() => vec(P.x + P.w * (0.2 + shared.tilt.value.x * 0.3), P.y));
  const edgeEnd = useDerivedValue(() => vec(P.x + P.w * (0.8 + shared.tilt.value.x * 0.3), P.y + P.h));
  const sheenPath = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(0, S.y - 10);
    p.lineTo(S.w * 0.18, S.y - 10);
    p.lineTo(-S.w * 0.12, S.y + S.h + 10);
    p.lineTo(-S.w * 0.3, S.y + S.h + 10);
    p.close();
    return p.detach();
  }, [S.y, S.w, S.h]);
  const shadowOp = useDerivedValue(() => 0.18 * frame.value.phone.intro);
  return (
    <Group transform={transform} opacity={opacity}>
      {/* floor shadow */}
      <Group opacity={shadowOp}>
        <RoundedRect x={P.x + P.w * 0.06} y={P.y + P.h - P.w * 0.05} width={P.w * 0.95} height={P.w * 0.1} r={P.w * 0.05} color="#3B2E5A">
          <BlurMask blur={P.w * 0.06} style="normal" />
        </RoundedRect>
      </Group>
      {/* body and metallic edge */}
      <RoundedRect x={P.x} y={P.y} width={P.w} height={P.h} r={P.r} color={body} />
      <RoundedRect x={P.x + 0.75} y={P.y + 0.75} width={P.w - 1.5} height={P.h - 1.5} r={P.r - 0.75} style="stroke" strokeWidth={1.5}>
        <LinearGradient start={edgeStart} end={edgeEnd} colors={['#ffffff55', '#ffffff10', '#ffffff66', '#ffffff08']} positions={[0, 0.35, 0.55, 1]} />
      </RoundedRect>
      <RoundedRect x={P.x + P.w - 1} y={P.y + P.h * 0.2} width={2.2} height={P.h * 0.08} r={1} color={body} />
      <RoundedRect x={P.x - 1.2} y={P.y + P.h * 0.18} width={2.2} height={P.h * 0.05} r={1} color={body} />
      <RoundedRect x={P.x - 1.2} y={P.y + P.h * 0.25} width={2.2} height={P.h * 0.05} r={1} color={body} />
      {/* screen */}
      <Group clip={screenClip}>
        <Group layer={<Paint><ColorMatrix matrix={satMatrix} /></Paint>}>
          <CartoonScene frame={frame} shared={shared} screen={S} palette={palette} />
        </Group>
        <Rect x={S.x} y={S.y} width={S.w} height={S.h} color="#000" opacity={dimOp} />
        <Rect x={S.x} y={S.y} width={S.w} height={S.h * 0.075} color="#00000040" opacity={0.5} />
        <StatusBar frame={frame} screen={S} time={time} />
        <Notice frame={frame} layout={layout} text={noticeText} />
        <Rect x={S.x} y={S.y} width={S.w} height={S.h} opacity={blackOp}>
          <RadialGradient c={revealC} r={revealR} colors={revealColors} positions={[0, 0.82, 0.995, 1]} />
        </Rect>
        <DeadBattery frame={frame} screen={S} />
        <PatternDemo frame={frame} samples={samples} screen={S} color={trailColor} />
        {/* glass sheen band, drifting even when black */}
        <Group transform={sheenT} opacity={0.06 + 0.1 * sheen}>
          <Path path={sheenPath}>
            <LinearGradient start={vec(-S.w * 0.3, 0)} end={vec(S.w * 0.18, 0)} colors={['#ffffff00', '#ffffff', '#ffffff00']} />
          </Path>
        </Group>
        <Circle cx={S.x + S.w / 2} cy={S.y + S.h * 0.028} r={S.w * 0.028} color="#07070b" />
        <Circle cx={S.x + S.w / 2 - S.w * 0.008} cy={S.y + S.h * 0.026} r={S.w * 0.008} color="#2b3350" />
      </Group>
    </Group>
  );
}
