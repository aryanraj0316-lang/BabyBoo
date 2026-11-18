/** A full-screen battery demonstration, derived from the shared story clock. */
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { Group, LinearGradient, Paint, Paragraph, Path, Rect, RoundedRect, Skia, Text, TextAlign, matchFont, rect, rrect, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { progress, rgba, smoothstep } from '../anim';
import type { Rect as R } from '../layout';
import type { SceneState } from '../timeline';
import { batteryTakeover as B } from '../tokens';

export function BatteryTakeover({ screen, state, label }: { screen: R; state: SharedValue<SceneState>; label: string }) {
  const { x, y, width: w, height: h } = screen;
  const width = w * B.widthOfScreen, height = h * B.heightOfScreen;
  const bx = x + (w - width) / 2, by = y + h * B.topOfScreen;
  const inset = w * B.insetOfWidth, radius = w * B.radiusOfWidth;
  const innerHeight = height - inset * 2;
  const innerWidth = width - inset * 2;
  const ix = bx + inset, iy = by + inset;
  const fontFamily = Platform.select({ ios: 'Helvetica Neue', default: 'sans-serif' });
  const font = useMemo(() => matchFont({ fontFamily, fontSize: w * B.counterSizeOfScreen, fontWeight: '700' }), [fontFamily, w]);
  // Paragraph shaping uses the system fallback fonts for Hindi conjuncts;
  // a single matchFont('sans-serif') draws missing-glyph boxes instead.
  const labelParagraph = useMemo(() => {
    const p = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Center, maxLines: 1 })
      .pushStyle({ color: Skia.Color(B.outline), fontSize: w * B.labelSizeOfScreen, fontStyle: { weight: 500 } })
      .addText(label).pop().build();
    p.layout(w);
    return p;
  }, [label, w]);
  const opacity = useDerivedValue(() => {
    const s = state.value;
    return smoothstep(progress(s.feedTime, B.from, B.from + B.length)) * s.feedOpacity * (1 - s.dim);
  });
  const fillColors = useDerivedValue(() => [rgba(state.value.batteryColor, 1), rgba(state.value.batteryColor, 0.65)]);
  const fillPath = useDerivedValue(() => {
    const s = state.value;
    const top = iy + innerHeight * (1 - s.batteryLevel);
    const wave = Math.min(w * B.waveOfWidth, innerHeight * s.batteryLevel * 0.15) * Math.sin(s.feedTime * B.waveSpeed);
    const path = Skia.Path.Make();
    path.moveTo(ix, iy + innerHeight); path.lineTo(ix, top);
    path.cubicTo(ix + innerWidth * 0.33, top + wave, ix + innerWidth * 0.66, top - wave, ix + innerWidth, top);
    path.lineTo(ix + innerWidth, iy + innerHeight); path.close();
    return path;
  });
  const fillTop = useDerivedValue(() => vec(ix, iy + innerHeight * (1 - state.value.batteryLevel)));
  const counter = useDerivedValue(() => `${Math.ceil(state.value.batteryLevel * 100)}%`);
  const counterX = useDerivedValue(() => x + (w - font.measureText(counter.value).width) / 2);
  // Paragraph owns its text paint; a layer applies the shared fade to it too.
  return <Group layer={<Paint opacity={opacity} />}>
    <Rect x={x} y={y} width={w} height={h}>
      <LinearGradient start={vec(x, y)} end={vec(x, y + h)} colors={[...B.background]} />
    </Rect>
    <RoundedRect x={x + (w - w * B.capWidthOfScreen) / 2} y={by - w * B.capHeightOfScreen - w * B.strokeOfWidth} width={w * B.capWidthOfScreen} height={w * B.capHeightOfScreen} r={radius / 3} color={B.outline} />
    <RoundedRect x={bx} y={by} width={width} height={height} r={radius} color={B.housing} />
    <RoundedRect x={bx} y={by} width={width} height={height} r={radius} color={B.outline} style="stroke" strokeWidth={w * B.strokeOfWidth} />
    <Group clip={rrect(rect(bx + inset, by + inset, width - inset * 2, innerHeight), radius / 2, radius / 2)}>
      <Path path={fillPath}>
        <LinearGradient start={fillTop} end={vec(ix, iy + innerHeight)} colors={fillColors} />
      </Path>
    </Group>
    <Text text={counter} x={counterX} y={y + h * B.counterYOfScreen} font={font} color={B.ink} />
    <Paragraph paragraph={labelParagraph} x={x} y={y + h * B.labelYOfScreen - w * B.labelSizeOfScreen} width={w} />
  </Group>;
}
