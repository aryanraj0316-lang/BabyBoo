/**
 * Small dependency-free controls for the Animation Studio.
 */
import React, { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Switch, Text, View, type LayoutChangeEvent } from 'react-native';

export const C = {
  bg: '#FAF8F5',
  card: '#FFFFFF',
  ink: '#2A2540',
  sub: '#7B7494',
  line: '#E7E2F2',
  accent: '#7C5CFF',
  accentSoft: '#EDE7FF',
};

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Slider({ label, value, min, max, step = 0.01, onChange, format }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const [w, setW] = useState(1);
  const startX = useRef(0);
  const set = (x: number) => {
    const u = Math.max(0, Math.min(1, x / w));
    let v = min + u * (max - min);
    v = Math.round(v / step) * step;
    onChange(+v.toFixed(5));
  };
  const pan = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  // keep the latest width/handlers in the responder
  pan.current = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      startX.current = e.nativeEvent.locationX;
      set(startX.current);
    },
    onPanResponderMove: (_, g) => set(startX.current + g.dx),
  });
  const u = (value - min) / (max - min || 1);
  return (
    <View style={s.row}>
      <View style={s.rowHead}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>{format ? format(value) : +value.toFixed(3)}</Text>
      </View>
      <View style={s.track} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} {...pan.current!.panHandlers}>
        <View style={[s.fill, { width: `${Math.max(0, Math.min(1, u)) * 100}%` }]} />
        <View style={[s.knob, { left: `${Math.max(0, Math.min(1, u)) * 100}%` }]} />
      </View>
    </View>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[s.row, s.toggleRow]}>
      <Text style={s.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.accent, false: C.line }} />
    </View>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: {
  label?: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.row}>
      {label ? <Text style={[s.label, { marginBottom: 6 }]}>{label}</Text> : null}
      <View style={s.seg}>
        {options.map((o) => (
          <Pressable key={o} onPress={() => onChange(o)} style={[s.segItem, o === value && s.segOn]}>
            <Text style={[s.segText, o === value && s.segTextOn]}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Btn({ label, onPress, primary, small }: { label: string; onPress: () => void; primary?: boolean; small?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[s.btn, primary && s.btnPrimary, small && s.btnSmall]}>
      <Text style={[s.btnText, primary && s.btnTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

/** Draggable light-direction sphere: x/y on the disc, z from the sphere. */
export function LightPad({ dir, onChange }: { dir: [number, number, number]; onChange: (d: [number, number, number]) => void }) {
  const size = 132;
  const setFrom = (x: number, y: number) => {
    let nx = (x / size) * 2 - 1;
    let ny = (y / size) * 2 - 1;
    const r = Math.hypot(nx, ny);
    if (r > 0.95) {
      nx = (nx / r) * 0.95;
      ny = (ny / r) * 0.95;
    }
    const nz = Math.sqrt(Math.max(0.0, 1 - nx * nx - ny * ny));
    onChange([+nx.toFixed(3), +ny.toFixed(3), +Math.max(0.2, nz).toFixed(3)]);
  };
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => setFrom(e.nativeEvent.locationX, e.nativeEvent.locationY),
    onPanResponderMove: (e) => setFrom(e.nativeEvent.locationX, e.nativeEvent.locationY),
  });
  const kx = ((dir[0] + 1) / 2) * size;
  const ky = ((dir[1] + 1) / 2) * size;
  return (
    <View style={s.row}>
      <Text style={[s.label, { marginBottom: 6 }]}>Light direction (drag)</Text>
      <View style={[s.pad, { width: size, height: size, borderRadius: size / 2 }]} {...pan.panHandlers}>
        <View pointerEvents="none" style={[s.padShade, { width: size, height: size, borderRadius: size / 2 }]} />
        <View pointerEvents="none" style={[s.padKnob, { left: kx - 9, top: ky - 9 }]} />
      </View>
      <Text style={s.value}>{dir.map((v) => v.toFixed(2)).join(', ')}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  section: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.ink, marginBottom: 8, letterSpacing: 0.3 },
  row: { marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: C.ink },
  value: { fontSize: 12, color: C.sub, fontVariant: ['tabular-nums'] },
  track: { height: 26, justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: C.accent },
  knob: { position: 'absolute', width: 18, height: 18, borderRadius: 9, marginLeft: -9, backgroundColor: '#fff', borderWidth: 2, borderColor: C.accent },
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  segItem: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.accentSoft },
  segOn: { backgroundColor: C.accent },
  segText: { fontSize: 12, color: C.ink },
  segTextOn: { color: '#fff', fontWeight: '600' },
  btn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: C.accentSoft, marginRight: 8, marginBottom: 8 },
  btnSmall: { paddingHorizontal: 9, paddingVertical: 6 },
  btnPrimary: { backgroundColor: C.accent },
  btnText: { fontSize: 13, color: C.ink, fontWeight: '600' },
  btnTextPrimary: { color: '#fff' },
  pad: { backgroundColor: '#E9E3FF', overflow: 'hidden' },
  padShade: { position: 'absolute', borderWidth: 1, borderColor: '#cfc4ff' },
  padKnob: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFD66B', borderWidth: 2, borderColor: '#fff' },
});
