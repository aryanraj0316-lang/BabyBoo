/**
 * Status bar inside the phone: time on the left; signal, wifi and a battery
 * glyph with an animatable fill on the right.
 */
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { Group, Path, RoundedRect, Skia, Text, matchFont } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { Rect } from '../layout';
import { palette, phone, statusBar as SB } from '../tokens';

interface Props {
  screen: Rect;
  /** 0..1 battery level (fixed, or animated by the demo clock). */
  level: number | SharedValue<number>;
  /** Fill colour of the battery level. */
  levelColor: string | SharedValue<string>;
  /** Icon and text colour. */
  ink?: string;
}

const FONT_FAMILY = Platform.select({ ios: 'Helvetica Neue', default: 'sans-serif' });

export function PhoneStatusBar({ screen, level, levelColor, ink = palette.statusBar.ink }: Props) {
  const w = screen.width;
  const fontSize = SB.fontSizeOfScreen * w;
  const font = useMemo(
    () => matchFont({ fontFamily: FONT_FAMILY, fontSize, fontWeight: '600' }),
    [fontSize],
  );

  const pad = SB.sidePaddingOfScreen * w;
  // The status bar row is centred on the punch-hole camera, as on a real phone.
  const midY = screen.y + phone.camera.centreFromTopOfScreen * w;

  // Battery glyph, right-aligned.
  const bw = SB.battery.widthOfScreen * w;
  const bh = SB.battery.heightOfScreen * w;
  const capW = bw * 0.08;
  const bx = screen.x + w - pad - bw - capW;
  const by = midY - bh / 2;
  const stroke = Math.max(1, bh * 0.1);
  const inset = stroke * 1.6;
  const innerW = bw - inset * 2;

  // Wifi and signal to the left of the battery.
  const iconH = bh * 1.05;
  const gap = bw * 0.28;
  const wifiW = iconH * 1.35;
  const wifiX = bx - gap - wifiW;
  const sigW = iconH * 1.25;
  const sigX = wifiX - gap - sigW;

  const fillW = useDerivedValue(() => {
    const l = typeof level === 'number' ? level : level.value;
    return Math.max(0, innerW * l);
  });

  const wifi = useMemo(() => {
    // Three concentric arcs (a standard wifi glyph), as one SVG path.
    const cx = wifiX + wifiW / 2;
    const base = midY + iconH / 2;
    const arcs = [1, 2, 3].map((i) => {
      const r = (wifiW / 2) * (i / 3);
      const dx = r * Math.SQRT1_2;
      return `M ${cx - dx} ${base - dx} A ${r} ${r} 0 0 1 ${cx + dx} ${base - dx}`;
    });
    return Skia.Path.MakeFromSVGString(arcs.join(' '))!;
  }, [wifiX, wifiW, midY, iconH]);

  const bars = [0.4, 0.6, 0.8, 1].map((h, i) => {
    const barW = sigW / 5.5;
    return (
      <RoundedRect
        key={i}
        x={sigX + i * barW * 1.5}
        y={midY + iconH / 2 - iconH * h}
        width={barW}
        height={iconH * h}
        r={barW / 3}
        color={ink}
      />
    );
  });

  return (
    <Group>
      {font && <Text x={screen.x + pad} y={midY + fontSize * 0.36} text={SB.time} font={font} color={ink} />}
      {bars}
      <Path path={wifi} style="stroke" strokeWidth={Math.max(1, iconH * 0.17)} strokeCap="round" color={ink} />
      <RoundedRect x={bx} y={by} width={bw} height={bh} r={bh * 0.28} style="stroke" strokeWidth={stroke} color={ink} opacity={0.5} />
      <RoundedRect x={bx + bw + capW * 0.25} y={midY - bh * 0.18} width={capW} height={bh * 0.36} r={capW / 2} color={ink} opacity={0.5} />
      <RoundedRect
        x={bx + inset}
        y={by + inset}
        width={fillW}
        height={bh - inset * 2}
        r={(bh - inset * 2) * 0.25}
        color={levelColor}
      />
    </Group>
  );
}
