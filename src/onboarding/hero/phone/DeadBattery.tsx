/**
 * The faint dead-battery glyph the child sees when tapping the dark screen:
 * a battery outline, a thin red sliver at the left and a small bolt.
 */
import React, { useMemo } from 'react';
import { Group, Path, Rect, RoundedRect, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { HeroFrame } from '../heroFrame';
import type { Rect as R } from '../layout';

export function DeadBattery({ frame, screen }: { frame: SharedValue<HeroFrame>; screen: R }) {
  const w = screen.w * 0.3;
  const h = w * 0.5;
  const x = screen.x + (screen.w - w) / 2;
  const y = screen.y + screen.h * 0.5 - h / 2;
  const opacity = useDerivedValue(() => frame.value.phone.glyph);
  const bolt = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const cx = x + w / 2;
    const cy = y + h / 2;
    const s = h * 0.32;
    p.moveTo(cx + s * 0.15, cy - s);
    p.lineTo(cx - s * 0.45, cy + s * 0.1);
    p.lineTo(cx - s * 0.02, cy + s * 0.1);
    p.lineTo(cx - s * 0.2, cy + s);
    p.lineTo(cx + s * 0.45, cy - s * 0.15);
    p.lineTo(cx + s * 0.02, cy - s * 0.15);
    p.close();
    return p.detach();
  }, [x, y, w, h]);
  return (
    <Group opacity={opacity}>
      <RoundedRect x={x} y={y} width={w} height={h} r={h * 0.18} color="#FFFFFF" style="stroke" strokeWidth={Math.max(1.5, w * 0.035)} />
      <Rect x={x + w + 1} y={y + h * 0.32} width={w * 0.05} height={h * 0.36} color="#FFFFFF" />
      <Rect x={x + w * 0.07} y={y + h * 0.16} width={w * 0.06} height={h * 0.68} color="#FF5A5A" />
      <Path path={bolt} color="#FFFFFF" />
    </Group>
  );
}
