/**
 * One reel: a bright gradient with a few friendly shapes that move gently, so
 * it reads as video, plus generic overlay UI (progress bar, an action rail of
 * heart / comment / share with skeleton counts, two skeleton caption lines).
 * No real app's logos or UI.
 *
 * `time` is the feed's clock (seconds). The progress bar fills between
 * `playFrom` and `playTo`, the window in which this reel is on screen.
 */
import React, { useMemo } from 'react';
import { Circle, Group, LinearGradient, Oval, Path, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { Rect as R } from '../layout';
import { palette, reelShapes as RS, reelUi as U, reels } from '../tokens';

interface Props {
  rect: R;
  index: number;
  time: SharedValue<number>;
  playFrom: number;
  playTo: number;
}

// Icons and the star, in a 24-unit box.
const HEART = 'M12 20.5s-7.3-4.5-9.2-8.9C1.4 8.3 3.5 5 6.8 5c2 0 3.5 1.1 5.2 2.9C13.7 6.1 15.2 5 17.2 5c3.3 0 5.4 3.3 4 6.6-1.9 4.4-9.2 8.9-9.2 8.9z';
const BUBBLE = 'M4.5 4.5h15a2.5 2.5 0 0 1 2.5 2.5v8.5a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V18H4.5A2.5 2.5 0 0 1 2 15.5V7a2.5 2.5 0 0 1 2.5-2.5z';
const SHARE = 'M13.5 4.5 22 11.5l-8.5 7v-4.2c-5.4 0-8.6 1.7-11.5 5.2 1-5.6 4.3-9.6 11.5-10.4V4.5z';
const STAR = 'M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z';

/** A 24-unit path drawn at (x, y) with the given size, positioned by a group transform. */
function Glyph({ d, x, y, size, color }: { d: string; x: number; y: number; size: number; color: string }) {
  const path = useMemo(() => Skia.Path.MakeFromSVGString(d)!, [d]);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: size / 24 }]}>
      <Path path={path} color={color} />
    </Group>
  );
}

/** One moving shape of a reel's mini-scene. */
function Shape({ rect, kind, item, color, time }: {
  rect: R;
  kind: string;
  item: readonly number[];
  color: string;
  time: SharedValue<number>;
}) {
  const [fx, fy, fr, bob, phase] = item;
  const { x, y, width: w, height: h } = rect;
  const r = fr * w;
  const cx = x + fx * w;
  const cy = y + fy * h;

  const transform = useDerivedValue(() => {
    const t = time.value;
    const dy = Math.sin(t * RS.bobSpeed + phase) * bob * h;
    const dx = kind === 'clouds' ? Math.sin(t * RS.bobSpeed * 0.5 + phase) * RS.drift * w : 0;
    const spin = kind === 'stars' ? t * RS.spinSpeed + phase : 0;
    return [{ translateX: cx + dx }, { translateY: cy + dy }, { rotate: spin }];
  });

  let body: React.ReactNode;
  switch (kind) {
    case 'balloons':
      body = (
        <>
          <Rect x={-RS.balloonString.width / 2} y={r * 1.15} width={RS.balloonString.width} height={RS.balloonString.lengthOfHeight * h} color={RS.balloonString.color} />
          <Oval x={-r} y={-r * 1.15} width={r * 2} height={r * 2.3} color={color} />
          <Oval x={-r * 0.55} y={-r * 0.8} width={r * 0.45} height={r * 0.7} color={RS.highlight} />
        </>
      );
      break;
    case 'stars':
      body = <Glyph d={STAR} x={-r} y={-r} size={r * 2} color={color} />;
      break;
    case 'clouds':
      body = (
        <>
          <Oval x={-r * 1.8} y={-r * 0.2} width={r * 3.6} height={r} color={color} />
          <Circle cx={0} cy={0} r={r} color={color} />
          <Circle cx={-r * 0.9} cy={r * 0.15} r={r * 0.65} color={color} />
        </>
      );
      break;
    case 'bubbles':
      body = (
        <>
          <Circle cx={0} cy={0} r={r} color={color} opacity={0.35} />
          <Circle cx={0} cy={0} r={r} color={color} style="stroke" strokeWidth={Math.max(1, r * 0.08)} />
          <Oval x={-r * 0.55} y={-r * 0.6} width={r * 0.4} height={r * 0.3} color={RS.highlight} />
        </>
      );
      break;
    default: // ball
      body = (
        <>
          <Circle cx={0} cy={0} r={r} color={color} />
          <Oval x={-r * 0.55} y={-r * 0.6} width={r * 0.5} height={r * 0.35} color={RS.highlight} />
        </>
      );
  }
  return <Group transform={transform}>{body}</Group>;
}

export function ReelClip({ rect, index, time, playFrom, playTo }: Props) {
  const { x, y, width: w, height: h } = rect;
  const reel = reels[index];
  const scene = RS.scenes[index];

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
  const fillW = useDerivedValue(() => {
    const p = (time.value - playFrom) / Math.max(0.001, playTo - playFrom);
    return progW * Math.min(1, Math.max(0, p));
  });

  const scrimTop = y + h * (1 - U.scrimOfScreen);

  return (
    <Group>
      <Rect x={x} y={y} width={w} height={h}>
        <LinearGradient start={vec(x, y)} end={vec(x, y + h)} colors={[reel.bg[0], reel.bg[1]]} />
      </Rect>
      {scene.items.map((item, i) => (
        <Shape key={i} rect={rect} kind={scene.kind} item={item} color={reel.shapes[i]} time={time} />
      ))}

      {/* Soft neutral bottom shade so the overlay UI reads on any clip. */}
      <Rect x={x} y={scrimTop} width={w} height={h * U.scrimOfScreen}>
        <LinearGradient start={vec(0, scrimTop)} end={vec(0, y + h)} colors={['rgba(0,0,0,0)', palette.reelUi.scrim]} />
      </Rect>

      {[HEART, BUBBLE, SHARE].map((d, i) => (
        <Group key={i}>
          <Glyph d={d} x={railX} y={ys[i]} size={icon} color={palette.reelUi.icon} />
          <RoundedRect x={railX + (icon - countW) / 2} y={ys[i] + icon + countH * 0.9} width={countW} height={countH} r={countH / 2} color={palette.reelUi.skeleton} />
        </Group>
      ))}

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

      <RoundedRect x={progX} y={progY} width={progW} height={progH} r={progH / 2} color={palette.reelUi.progressTrack} />
      <RoundedRect x={progX} y={progY} width={fillW} height={progH} r={progH / 2} color={palette.reelUi.progressFill} />
    </Group>
  );
}
