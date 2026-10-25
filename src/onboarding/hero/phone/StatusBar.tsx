/**
 * Status bar inside the phone screen: time, signal, Wi-Fi and a vector
 * battery whose fill follows the charge (white above 15%, soft red at or
 * below).
 */
import React, { useMemo } from 'react';
import { Group, Path, RoundedRect, Rect, Skia, Text, matchFont, Paragraph, TextAlign } from '@shopify/react-native-skia';
import { Platform } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { HeroFrame } from '../heroFrame';
import type { Rect as R } from '../layout';

const fontFamily = Platform.select({ ios: 'Helvetica', default: 'sans-serif' });

export function useStatusFont(size: number) {
  return useMemo(() => {
    try {
      return matchFont({ fontFamily, fontSize: size, fontWeight: '600' });
    } catch {
      return null;
    }
  }, [size]);
}

export function StatusBar({ frame, screen, time }: { frame: SharedValue<HeroFrame>; screen: R; time: string }) {
  const h = screen.h * 0.06;
  const fs = Math.max(7, h * 0.42);
  const font = useStatusFont(fs);
  const pad = screen.w * 0.07;
  const y = screen.y + h * 0.62;
  // battery icon geometry
  const bw = screen.w * 0.075;
  const bh = bw * 0.48;
  const bx = screen.x + screen.w - pad - bw;
  const by = y - bh * 0.85;
  const fillW = useDerivedValue(() => Math.max(0.5, (bw - 3) * Math.min(1, frame.value.phone.battery / 100)));
  const fillColor = useDerivedValue(() => (frame.value.phone.red ? '#FF6B6B' : '#FFFFFF'));
  const pct = useDerivedValue(() => `${Math.max(0, Math.round(frame.value.phone.battery))}%`);
  const pctX = bx - (font ? font.measureText('20%').width : fs * 2) - fs * 0.35;
  const timePara = useMemo(() => {
    try {
      const b = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Left });
      b.pushStyle({ color: Skia.Color('#FFFFFF'), fontSize: fs, fontStyle: { weight: 600 } });
      b.addText(time);
      const p = b.build();
      p.layout(screen.w * 0.4);
      return p;
    } catch {
      return null;
    }
  }, [time, fs, screen.w]);
  const signal = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const sx = pctX - fs * 3.6;
    for (let i = 0; i < 4; i++) {
      const bhh = (h * 0.18) * (i + 1);
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(sx + i * fs * 0.32, y - bhh, fs * 0.2, bhh), 0.8, 0.8));
    }
    return p.detach();
  }, [pctX, fs, h, y]);
  const wifi = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const cx = pctX - fs * 1.0;
    const cy = y;
    for (let i = 1; i <= 3; i++) {
      const r = fs * 0.28 * i;
      p.addArc(Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2), 225, 90);
    }
    return p.detach();
  }, [pctX, fs, y]);
  return (
    <Group>
      {timePara && <Paragraph paragraph={timePara} x={screen.x + pad} y={y - fs * 0.95} width={screen.w * 0.4} />}
      <Path path={signal} color="#FFFFFF" />
      <Path path={wifi} color="#FFFFFF" style="stroke" strokeWidth={Math.max(1, fs * 0.13)} strokeCap="round" />
      {font && <Text x={pctX} y={y} text={pct} font={font} color="#FFFFFF" />}
      <RoundedRect x={bx} y={by} width={bw} height={bh} r={bh * 0.28} color="#FFFFFF" style="stroke" strokeWidth={1} opacity={0.9} />
      <Rect x={bx + bw + 0.5} y={by + bh * 0.3} width={1.6} height={bh * 0.4} color="#FFFFFF" opacity={0.9} />
      <Rect x={bx + 1.5} y={by + 1.5} width={fillW} height={bh - 3} color={fillColor} />
    </Group>
  );
}
