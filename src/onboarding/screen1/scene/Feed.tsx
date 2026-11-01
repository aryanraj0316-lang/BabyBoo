/**
 * The phone's feed (Beats 1-3): a vertical strip of reels that swipes with a
 * spring, the status bar with its draining battery, the "Battery low" toast,
 * the empty-battery icon and the shutdown dim. As the screen dims it also loses
 * colour and contrast, the way a real screen dims; there is no instant cut.
 */
import React, { useMemo } from 'react';
import {
  BackdropBlur, ColorMatrix, Group, Paint, Paragraph, Rect, RoundedRect, Skia, rrect, rect as skRect,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { lerp, rgba } from '../anim';
import type { Rect as R } from '../layout';
import type { SceneState } from '../timeline';
import { dim as DIM, emptyBattery as EB, palette, reels, swipes as SW, toast as TOAST } from '../tokens';
import { PhoneStatusBar } from './PhoneStatusBar';
import { ReelClip } from './ReelClip';

interface Props {
  screen: R;
  state: SharedValue<SceneState>;
  toastText: string;
}

/** Reel positions in the strip: one more than the number of completed swipes. */
const POSITIONS = SW.times.length + 1;

/** When the reel at each strip position is on screen (for its progress bar). */
function playWindow(pos: number): [number, number] {
  const from = pos === 0 ? 0 : SW.times[pos - 1];
  const to = pos < SW.times.length ? SW.times[pos] : DIM.at + DIM.length;
  return [from, to];
}

const LUMA = [0.2126, 0.7152, 0.0722];

/** Saturation then contrast, as a 4x5 colour matrix (offsets in 0..1). */
function dimMatrix(saturation: number, contrast: number): number[] {
  'worklet';
  const s = saturation;
  const c = contrast;
  const o = (1 - c) * 0.5;
  const row = (i: number) => [0, 1, 2].map((j) => c * (LUMA[j] * (1 - s) + (i === j ? s : 0)));
  return [...row(0), 0, o, ...row(1), 0, o, ...row(2), 0, o, 0, 0, 0, 1, 0];
}

function BatteryToast({ screen, state, text }: { screen: R; state: SharedValue<SceneState>; text: string }) {
  const w = screen.width;
  const tw = TOAST.widthOfScreen * w;
  const th = TOAST.heightOfScreen * screen.height;
  const tx = screen.x + (w - tw) / 2;
  const restY = screen.y + TOAST.topOfScreen * screen.height;
  const hiddenDy = -(restY - screen.y + th); // fully above the screen's top edge
  const fontSize = TOAST.fontSizeOfScreen * w;

  const iconW = TOAST.iconWidthOfScreen * w;
  const iconH = iconW * 0.5;
  const pad = th * 0.4;

  const paragraph = useMemo(() => {
    const p = Skia.ParagraphBuilder.Make({ maxLines: 1 })
      .pushStyle({ color: Skia.Color(TOAST.text), fontSize, fontStyle: { weight: 600 } })
      .addText(text)
      .pop()
      .build();
    p.layout(tw - pad * 3 - iconW);
    return p;
  }, [text, fontSize, tw, pad, iconW]);

  const transform = useDerivedValue(() => {
    const s = state.value;
    // Springs down from above the screen edge, then slides back up and away.
    const dy = lerp(hiddenDy, 0, s.toastIn) + lerp(0, hiddenDy, s.toastOut);
    return [{ translateY: dy }];
  });
  const opacity = useDerivedValue(() => (state.value.toastIn > 0 ? 1 - state.value.toastOut : 0));

  const shape = rrect(skRect(tx, restY, tw, th), th / 2, th / 2);
  const textH = paragraph.getHeight();

  return (
    <Group transform={transform} opacity={opacity}>
      <BackdropBlur blur={TOAST.blur} clip={shape}>
        <RoundedRect rect={shape} color={TOAST.fill} />
      </BackdropBlur>
      {/* Small red battery icon. */}
      <RoundedRect x={tx + pad} y={restY + (th - iconH) / 2} width={iconW} height={iconH} r={iconH * 0.25} style="stroke" strokeWidth={Math.max(1, iconH * 0.12)} color={palette.battery.red} />
      <RoundedRect x={tx + pad + iconH * 0.18} y={restY + (th - iconH) / 2 + iconH * 0.22} width={iconW * 0.18} height={iconH * 0.56} r={iconH * 0.1} color={palette.battery.red} />
      <Paragraph paragraph={paragraph} x={tx + pad * 2 + iconW} y={restY + (th - textH) / 2} width={tw - pad * 3 - iconW} />
    </Group>
  );
}

function EmptyBattery({ screen, state }: { screen: R; state: SharedValue<SceneState> }) {
  const w = EB.widthOfScreen * screen.width;
  const h = EB.heightOfScreen * screen.width;
  const cx = screen.x + screen.width / 2;
  const cy = screen.y + screen.height / 2;
  const stroke = Math.max(1.5, h * 0.09);
  const inset = stroke * 1.8;
  const capW = w * 0.07;

  const transform = useDerivedValue(() => {
    const k = lerp(EB.scaleFrom, 1, state.value.emptyIcon);
    return [{ translateX: cx }, { translateY: cy }, { scale: k }, { translateX: -cx }, { translateY: -cy }];
  });
  const opacity = useDerivedValue(() => state.value.emptyIcon);

  return (
    <Group transform={transform} opacity={opacity}>
      <RoundedRect x={cx - w / 2} y={cy - h / 2} width={w} height={h} r={h * 0.22} style="stroke" strokeWidth={stroke} color={EB.stroke} />
      <RoundedRect x={cx + w / 2 + capW * 0.3} y={cy - h * 0.2} width={capW} height={h * 0.4} r={capW / 2} color={EB.stroke} />
      <RoundedRect x={cx - w / 2 + inset} y={cy - h / 2 + inset} width={(w - inset * 2) * EB.sliverOfInner} height={h - inset * 2} r={(h - inset * 2) * 0.2} color={palette.battery.red} />
    </Group>
  );
}

export function Feed({ screen, state, toastText }: Props) {
  const H = screen.height;
  const feedTime = useDerivedValue(() => state.value.feedTime);
  const cx = screen.x + screen.width / 2;
  const cy = screen.y + H / 2;

  const strip = useDerivedValue(() => {
    const s = state.value;
    // Stretch about the screen's centre, then move the strip up by the swipe offset.
    return [
      { translateX: cx }, { translateY: cy }, { scaleY: s.feedStretch }, { translateX: -cx }, { translateY: -cy },
      { translateY: -s.feedOffset * H },
    ];
  });

  const opacity = useDerivedValue(() => state.value.feedOpacity);
  const matrix = useDerivedValue(() => {
    const d = state.value.dim;
    return dimMatrix(lerp(1, DIM.saturation, d), lerp(1, DIM.contrast, d));
  });
  const black = useDerivedValue(() => state.value.dim);
  const level = useDerivedValue(() => state.value.batteryLevel);
  const levelColor = useDerivedValue(() => rgba(state.value.batteryColor, 1));

  return (
    <Group opacity={opacity} layer={<Paint><ColorMatrix matrix={matrix} /></Paint>}>
      <Group transform={strip}>
        {Array.from({ length: POSITIONS }, (_, pos) => {
          const [from, to] = playWindow(pos);
          return (
            <ReelClip
              key={pos}
              rect={{ x: screen.x, y: screen.y + pos * H, width: screen.width, height: H }}
              index={pos % reels.length}
              time={feedTime}
              playFrom={from}
              playTo={to}
            />
          );
        })}
      </Group>
      <PhoneStatusBar screen={screen} level={level} levelColor={levelColor} />
      <BatteryToast screen={screen} state={state} text={toastText} />
      <EmptyBattery screen={screen} state={state} />
      <Rect x={screen.x} y={screen.y} width={screen.width} height={H} color="black" opacity={black} />
    </Group>
  );
}
