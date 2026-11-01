/**
 * One reel: a bright gradient with a few friendly shapes, plus generic overlay
 * UI (progress bar, an action rail of heart / comment / share with skeleton
 * counts, two skeleton caption lines). No real app's logos or UI.
 *
 * `t` is the clip's local time in seconds; shapes move gently with it so the
 * reel reads as video. `progress` (0..1) fills the progress bar.
 */
import React, { useMemo } from 'react';
import { Circle, Group, LinearGradient, Oval, Path, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import type { Rect as R } from '../layout';
import { palette, reelUi as U, reels } from '../tokens';

interface Props {
  rect: R;
  index: number;
  t?: number;
  progress?: number;
}

// Icons in a 24-unit box.
const HEART = 'M12 20.5s-7.3-4.5-9.2-8.9C1.4 8.3 3.5 5 6.8 5c2 0 3.5 1.1 5.2 2.9C13.7 6.1 15.2 5 17.2 5c3.3 0 5.4 3.3 4 6.6-1.9 4.4-9.2 8.9-9.2 8.9z';
const BUBBLE = 'M4.5 4.5h15a2.5 2.5 0 0 1 2.5 2.5v8.5a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V18H4.5A2.5 2.5 0 0 1 2 15.5V7a2.5 2.5 0 0 1 2.5-2.5z';
const SHARE = 'M13.5 4.5 22 11.5l-8.5 7v-4.2c-5.4 0-8.6 1.7-11.5 5.2 1-5.6 4.3-9.6 11.5-10.4V4.5z';

/** A 24-unit icon drawn at (x, y) with the given size, positioned by a group transform. */
function Icon({ d, x, y, size, color }: { d: string; x: number; y: number; size: number; color: string }) {
  const path = useMemo(() => Skia.Path.MakeFromSVGString(d)!, [d]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: size / 24 }]}>
      <Path path={path} color={color} />
    </Group>
  );
}

/** The designed mini-scene for each reel. Positions are fractions of the reel rect. */
function Shapes({ rect, index, t }: { rect: R; index: number; t: number }) {
  const { x, y, width: w, height: h } = rect;
  const c = reels[index].shapes;
  const bob = (phase: number, amp: number) => Math.sin(t * 2.2 + phase) * amp * h;
  switch (reels[index].id) {
    case 'balloons':
      return (
        <Group>
          {[
            { cx: 0.32, cy: 0.38, r: 0.11, col: c[0], ph: 0 },
            { cx: 0.6, cy: 0.3, r: 0.13, col: c[1], ph: 1.3 },
            { cx: 0.5, cy: 0.52, r: 0.1, col: c[2], ph: 2.4 },
          ].map((b, i) => {
            const cy = y + b.cy * h + bob(b.ph, 0.012);
            const rx = b.r * w;
            return (
              <Group key={i}>
                <Rect x={x + b.cx * w - 0.5} y={cy + rx * 1.15} width={1} height={0.16 * h} color="rgba(255,255,255,0.8)" />
                <Oval x={x + b.cx * w - rx} y={cy - rx * 1.15} width={rx * 2} height={rx * 2.3} color={b.col} />
                <Oval x={x + b.cx * w - rx * 0.55} y={cy - rx * 0.8} width={rx * 0.45} height={rx * 0.7} color="rgba(255,255,255,0.45)" />
              </Group>
            );
          })}
        </Group>
      );
    case 'stars':
      return (
        <Group>
          {[[0.3, 0.3, 0.07], [0.68, 0.42, 0.1], [0.45, 0.58, 0.06]].map(([cx, cy, r], i) => (
            <Circle key={i} cx={x + cx * w} cy={y + cy * h + bob(i, 0.01)} r={r * w} color={c[i]} />
          ))}
        </Group>
      );
    case 'ball':
      return (
        <Group>
          <Circle cx={x + 0.5 * w} cy={y + 0.45 * h + bob(0, 0.03)} r={0.16 * w} color={c[0]} />
          <Circle cx={x + 0.5 * w} cy={y + 0.45 * h + bob(0, 0.03)} r={0.06 * w} color={c[1]} />
          <Circle cx={x + 0.26 * w} cy={y + 0.26 * h} r={0.05 * w} color={c[2]} />
        </Group>
      );
    case 'clouds':
      return (
        <Group>
          <Circle cx={x + 0.7 * w} cy={y + 0.24 * h} r={0.09 * w} color={c[2]} />
          {[[0.25, 0.38], [0.58, 0.52]].map(([cx, cy], i) => (
            <Group key={i}>
              <Oval x={x + (cx - 0.16) * w + bob(i, 0.01)} y={y + cy * h} width={0.32 * w} height={0.09 * w} color={c[i]} />
              <Circle cx={x + cx * w + bob(i, 0.01)} cy={y + cy * h} r={0.08 * w} color={c[i]} />
            </Group>
          ))}
        </Group>
      );
    default:
      return (
        <Group>
          {[[0.3, 0.32, 0.08], [0.62, 0.44, 0.12], [0.42, 0.6, 0.06]].map(([cx, cy, r], i) => (
            <Circle key={i} cx={x + cx * w} cy={y + cy * h + bob(i, 0.015)} r={r * w} color={c[i]} opacity={0.85} />
          ))}
        </Group>
      );
  }
}

export function ReelClip({ rect, index, t = 0, progress = 0.15 }: Props) {
  const { x, y, width: w, height: h } = rect;
  const bg = reels[index].bg;

  const icon = U.railIconOfScreen * w;
  const railX = x + w - U.railRightOfScreen * w - icon;
  const railBottom = y + h - U.railBottomOfScreen * h;
  const step = icon + U.railGapOfScreen * w;
  const ys = [railBottom - step * 3, railBottom - step * 2, railBottom - step];
  const countW = U.countBar.widthOfScreen * w;
  const countH = U.countBar.heightOfScreen * w;

  const cap = U.caption;
  const capLeft = x + cap.leftOfScreen * w;
  const capBottom = y + h - cap.bottomOfScreen * h;
  const lineH = cap.lineHeightOfScreen * w;

  const prog = U.progress;
  const progH = prog.heightOfScreen * w;
  const progY = y + h - prog.bottomOfScreen * h;
  const progX = x + prog.sideOfScreen * w;
  const progW = w - prog.sideOfScreen * w * 2;

  return (
    <Group>
      <Rect x={x} y={y} width={w} height={h}>
        <LinearGradient start={vec(x, y)} end={vec(x + w * 0.4, y + h)} colors={[bg[0], bg[1]]} />
      </Rect>
      <Shapes rect={rect} index={index} t={t} />

      {/* Soft bottom shade so the overlay UI reads on any clip. */}
      <Rect x={x} y={y + h * (1 - U.scrimOfScreen)} width={w} height={h * U.scrimOfScreen}>
        <LinearGradient start={vec(0, y + h * (1 - U.scrimOfScreen))} end={vec(0, y + h)} colors={['rgba(0,0,0,0)', palette.reelUi.scrim]} />
      </Rect>

      {/* Action rail: icon with a skeleton count under it. */}
      {[HEART, BUBBLE, SHARE].map((d, i) => (
        <Group key={i}>
          <Icon d={d} x={railX} y={ys[i]} size={icon} color={palette.reelUi.icon} />
          <RoundedRect
            x={railX + (icon - countW) / 2}
            y={ys[i] + icon + countH * 0.9}
            width={countW}
            height={countH}
            r={countH / 2}
            color={palette.reelUi.skeleton}
          />
        </Group>
      ))}

      {/* Two skeleton caption lines. */}
      {cap.widthsOfScreen.map((lw, i) => (
        <RoundedRect
          key={i}
          x={capLeft}
          y={capBottom - (cap.widthsOfScreen.length - i) * (lineH + cap.gapOfScreen * w) + cap.gapOfScreen * w}
          width={lw * w}
          height={lineH}
          r={lineH / 2}
          color={i === 0 ? palette.reelUi.skeleton : palette.reelUi.skeletonSoft}
        />
      ))}

      {/* Thin progress bar that fills while the reel plays. */}
      <RoundedRect x={progX} y={progY} width={progW} height={progH} r={progH / 2} color={palette.reelUi.progressTrack} />
      <RoundedRect x={progX} y={progY} width={progW * progress} height={progH} r={progH / 2} color={palette.reelUi.progressFill} />
    </Group>
  );
}
