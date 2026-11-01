/**
 * The unlocked home screen (Beat 5): a calm lavender-to-peach wallpaper with
 * two soft blurred shapes, a 4x3 grid of generic pastel app icons with a simple
 * glyph each (no real apps), and a fresh battery. The icons arrive with a
 * staggered zoom, centre out, as the home screen settles.
 */
import React, { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { lerp, progress, springAt } from '../anim';
import type { Rect as R } from '../layout';
import type { SceneState } from '../timeline';
import { battery as BAT, home as HOME, palette, spring } from '../tokens';
import { PhoneStatusBar } from './PhoneStatusBar';

// One simple glyph per icon, in a 24-unit box.
const GLYPHS = [
  'M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16z', // dot
  'M5 5h14v14H5z', // square
  'M12 4l9 16H3z', // triangle
  'M12 20.5s-7.3-4.5-9.2-8.9C1.4 8.3 3.5 5 6.8 5c2 0 3.5 1.1 5.2 2.9C13.7 6.1 15.2 5 17.2 5c3.3 0 5.4 3.3 4 6.6-1.9 4.4-9.2 8.9-9.2 8.9z', // heart
  'M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z', // star
  'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z', // plus
  'M15 3a9 9 0 1 0 6 15.5A9 9 0 0 1 15 3z', // moon
  'M13 2 4 14h6l-1 8 9-12h-6z', // bolt
  'M5 19c0-9 6-14 14-14 0 9-5 14-14 14z', // leaf
  'M9 4v11.5a3.5 3.5 0 1 1-2-3.2V6l11-2v9.5a3.5 3.5 0 1 1-2-3.2V4z', // note
  'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0zm5 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0z', // ring
  'M4 10l8-6 8 6v10h-5v-6H9v6H4z', // house
];

interface Props {
  screen: R;
  state: SharedValue<SceneState>;
}

/** Centre-out arrival order for the grid. */
function arrivalRanks(cols: number, rows: number): number[] {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const cells = Array.from({ length: cols * rows }, (_, i) => ({ i, d: Math.hypot((i % cols) - cx, Math.floor(i / cols) - cy) }));
  const ranks = new Array<number>(cells.length);
  [...cells].sort((a, b) => a.d - b.d || a.i - b.i).forEach((c, rank) => (ranks[c.i] = rank));
  return ranks;
}

function Icon({ x, y, size, color, glyph, rank, state }: {
  x: number; y: number; size: number; color: string; glyph: string; rank: number; state: SharedValue<SceneState>;
}) {
  const path = useMemo(() => Skia.Path.MakeFromSVGString(glyph)!, [glyph]);
  const g = HOME.glyphOfIcon * size;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const transform = useDerivedValue(() => {
    const dt = state.value.iconsTime - rank * HOME.stagger;
    const k = dt <= 0 ? HOME.iconScaleFrom : lerp(HOME.iconScaleFrom, 1, springAt(dt, spring.snappy.stiffness, spring.snappy.dampingRatio).x);
    return [{ translateX: cx }, { translateY: cy }, { scale: k }, { translateX: -cx }, { translateY: -cy }];
  });
  const opacity = useDerivedValue(() => progress(state.value.iconsTime - rank * HOME.stagger, 0, HOME.iconDuration));
  return (
    <Group transform={transform} opacity={opacity}>
      <RoundedRect x={x} y={y} width={size} height={size} r={size * HOME.iconRadiusOfIcon} color={color} />
      <Group transform={[{ translateX: cx - g / 2 }, { translateY: cy - g / 2 }, { scale: g / 24 }]}>
        <Path path={path} color={HOME.glyphColor} />
      </Group>
    </Group>
  );
}

export function HomeScreen({ screen, state }: Props) {
  const { x, y, width: w, height: h } = screen;
  const G = HOME.grid;
  const icon = G.iconOfScreen * w;
  const gapX = (w - G.sideOfScreen * w * 2 - icon * G.cols) / (G.cols - 1);
  const gapY = G.rowGapOfScreen * h;
  const top = y + G.topOfScreen * h;
  const left = x + G.sideOfScreen * w;
  const ranks = useMemo(() => arrivalRanks(G.cols, G.rows), [G.cols, G.rows]);

  const cx = x + w / 2;
  const cy = y + h / 2;
  const transform = useDerivedValue(() => {
    const k = state.value.homeScale;
    return [{ translateX: cx }, { translateY: cy }, { scale: k }, { translateX: -cx }, { translateY: -cy }];
  });

  return (
    <Group transform={transform}>
      <Rect x={x} y={y} width={w} height={h}>
        <LinearGradient start={vec(x, y)} end={vec(x, y + h)} colors={[HOME.wallpaper[0], HOME.wallpaper[1]]} />
      </Rect>
      {HOME.blobs.map((b, i) => (
        <Circle key={i} cx={x + b.x * w} cy={y + b.y * h} r={b.r * w} color={b.color}>
          <BlurMask blur={HOME.blobBlurOfScreen * w} style="normal" />
        </Circle>
      ))}
      {ranks.map((rank, i) => (
        <Icon
          key={i}
          x={left + (i % G.cols) * (icon + gapX)}
          y={top + Math.floor(i / G.cols) * (icon + gapY)}
          size={icon}
          color={HOME.iconColors[i]}
          glyph={GLYPHS[i]}
          rank={rank}
          state={state}
        />
      ))}
      <PhoneStatusBar screen={screen} level={BAT.home} levelColor={palette.battery.green} ink={palette.statusBar.inkOnLight} />
    </Group>
  );
}
