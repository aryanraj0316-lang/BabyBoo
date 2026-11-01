/**
 * The phone: near-black bezel with a soft vertical gradient and a 1px lighter
 * hairline, side buttons, a punch-hole camera, screen content clipped exactly to the
 * screen shape, and a faint glass sheen that stays visible on a black screen.
 */
import React from 'react';
import { Circle, Group, LinearGradient, RoundedRect, Shadow, rrect, rect, vec } from '@shopify/react-native-skia';
import type { SceneLayout } from '../layout';
import { palette, phone as P, shadow } from '../tokens';
import { tint } from './colour';

interface Props {
  layout: SceneLayout;
  /** Screen content, drawn in screen coordinates and clipped to the screen. */
  children?: React.ReactNode;
}

export function PhoneMockup({ layout, children }: Props) {
  const { phone, screen } = layout;
  const outer = rrect(rect(phone.x, phone.y, phone.width, phone.height), phone.radius, phone.radius);
  const screenShape = rrect(rect(screen.x, screen.y, screen.width, screen.height), screen.radius, screen.radius);

  const btn = P.buttons;
  const t = btn.thickness;
  const sideButton = (x: number, top: number, length: number) => (
    <RoundedRect
      x={x}
      y={phone.y + top * phone.height}
      width={t * 2}
      height={length * phone.height}
      r={t}
      color={palette.phone.button}
    />
  );

  const camR = (P.camera.diameterOfScreen * screen.width) / 2;
  const camY = screen.y + P.camera.centreFromTopOfScreen * screen.width;

  return (
    <Group>
      {/* Side buttons sit behind the body, so only their raised edge shows. */}
      {sideButton(phone.x - t, btn.volumeUp.top, btn.volumeUp.length)}
      {sideButton(phone.x - t, btn.volumeDown.top, btn.volumeDown.length)}
      {sideButton(phone.x + phone.width - t, btn.power.top, btn.power.length)}

      {/* The screen's one shadow language: two soft lavender layers, each its own pass. */}
      {[shadow.ambient, shadow.key].map((layer, i) => (
        <RoundedRect key={i} rect={outer} color={palette.phone.bezelBottom}>
          <Shadow dx={layer.dx} dy={layer.dy} blur={layer.blur / 2} color={tint(palette.shadowTint, layer.opacity)} shadowOnly />
        </RoundedRect>
      ))}

      {/* Body: near-black bezel with a subtle vertical gradient. */}
      <RoundedRect rect={outer}>
        <LinearGradient
          start={vec(0, phone.y)}
          end={vec(0, phone.y + phone.height)}
          colors={[palette.phone.bezelTop, palette.phone.bezelBottom]}
        />
      </RoundedRect>

      {/* 1px lighter hairline on the outer edge. */}
      <RoundedRect
        rect={rrect(
          rect(phone.x + P.hairlineWidth / 2, phone.y + P.hairlineWidth / 2, phone.width - P.hairlineWidth, phone.height - P.hairlineWidth),
          phone.radius - P.hairlineWidth / 2,
          phone.radius - P.hairlineWidth / 2,
        )}
        style="stroke"
        strokeWidth={P.hairlineWidth}
        color={palette.phone.hairline}
      />

      {/* Screen: black base, then content clipped to the exact screen shape. */}
      <RoundedRect rect={screenShape} color={palette.phone.screenOff} />
      <Group clip={screenShape}>{children}</Group>

      {/* Punch-hole camera. */}
      <Circle cx={screen.x + screen.width / 2} cy={camY} r={camR} color={palette.phone.camera} />

      {/* Glass sheen: faint diagonal light across the screen, always on top. */}
      <Group clip={screenShape}>
        <RoundedRect rect={screenShape}>
          <LinearGradient
            start={vec(screen.x, screen.y)}
            end={vec(screen.x + screen.width, screen.y + screen.height)}
            colors={[`rgba(255,255,255,${P.sheen.opacity})`, 'rgba(255,255,255,0)']}
            positions={[P.sheen.from, P.sheen.to]}
          />
        </RoundedRect>
      </Group>
    </Group>
  );
}
