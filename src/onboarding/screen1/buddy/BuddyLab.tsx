/**
 * Buddy Lab (dev only; see app/dev/buddy-lab.tsx). Live, rigged Buddy at display size
 * and at 2x, with:
 *  - Script mode: plays LAB_SCRIPT (every preset, blinks, gaze, head turn, wave, hop)
 *    through the windowed spring re-simulation, and measures its per-frame cost.
 *  - Manual mode: a slider for every rig parameter, a button for every preset, light
 *    controls, a reference overlay (the master, with opacity / offset / scale) and an
 *    export button that logs the current pose for the render harness.
 * `record=1` hides every control (for screen recordings).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Image as SkImageView, Picture, Rect, Skia, useImage } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { makeBuddyResources } from './drawBuddy';
import { drawBuddyPosed } from './drawPosed';
import { BUDDY_LOOK } from './buddyLook';
import { REST, RIG_KEYS, RIG_RANGES, poseBuddy, type RigKey, type RigParams } from './rig';
import { LAB_SCRIPT, PRESET_NAMES, compileScript, labelAt, presetParams, rigAt, type PresetName } from './rigTimeline';

const BG = '#F6F3FF';
/** Display size: the watching Buddy is 159pt tall; he spans about 1.39 head widths. */
const DISPLAY_HEAD = 159 / 1.39;

function Slider({ label, value, range, onChange }: { label: string; value: number; range: [number, number]; onChange: (v: number) => void }) {
  const width = useRef(1);
  const set = (x: number) => onChange(range[0] + Math.max(0, Math.min(1, x / width.current)) * (range[1] - range[0]));
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => set(e.nativeEvent.locationX),
    onPanResponderMove: (e) => set(e.nativeEvent.locationX),
  }), [range]); // eslint-disable-line react-hooks/exhaustive-deps
  const f = (value - range[0]) / (range[1] - range[0]);
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.track} onLayout={(e) => (width.current = e.nativeEvent.layout.width)} {...pan.panHandlers}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, f)) * 100}%` }]} />
      </View>
      <Text style={styles.sliderValue}>{value.toFixed(2)}</Text>
    </View>
  );
}

export function BuddyLab({ record = false }: { record?: boolean }) {
  const { width } = useWindowDimensions();
  const grain = useImage(require('../../../../assets/onboarding/screen1/buddy/fur.png'));
  const master = useImage(require('../../../../design/buddy/buddy_master.png'));
  const res = useMemo(() => (grain ? makeBuddyResources(Skia, grain) : null), [grain]);
  const script = useMemo(() => compileScript(LAB_SCRIPT), []);

  const [mode, setMode] = useState<'script' | 'manual'>(record ? 'script' : 'script');
  const [params, setParams] = useState<RigParams>(REST);
  const [light, setLight] = useState<number[]>([...BUDDY_LOOK.light]);
  const [overlay, setOverlay] = useState({ on: false, opacity: 0.5, dx: 0, dy: 0, scale: 1 });
  const [stats, setStats] = useState({ label: '', t: 0, ms: 0 });

  const time = useSharedValue(0);
  const scripted = useSharedValue(true);
  const manual = useSharedValue<RigParams>(REST);
  const lightSV = useSharedValue<number[]>([...BUDDY_LOOK.light]);
  const cost = useSharedValue(0);

  useEffect(() => {
    scripted.set(mode === 'script');
    manual.set(params);
    lightSV.set(light);
  }, [mode, params, light, scripted, manual, lightSV]);

  useFrameCallback((info) => {
    'worklet';
    time.set(time.get() + Math.min(info.timeSincePreviousFrame ?? 16, 100) / 1000);
  });

  const canvasW = width;
  const canvasH = DISPLAY_HEAD * 1.55 + DISPLAY_HEAD * 2 * 1.55;
  const picture = useDerivedValue(() => {
    const rec = Skia.PictureRecorder();
    const canvas = rec.beginRecording(Skia.XYWHRect(0, 0, canvasW, canvasH));
    if (res) {
      let p: RigParams;
      if (scripted.value) {
        const now = (globalThis as unknown as { performance?: { now(): number } }).performance;
        const t0 = now ? now.now() : 0;
        p = rigAt(script, time.value);
        if (now) cost.set(cost.get() * 0.95 + (now.now() - t0) * 0.05);
      } else {
        p = manual.value;
      }
      const posed = poseBuddy(p);
      // Display size (left) and 2x (below).
      drawBuddyPosed(canvas, res, { x: canvasW * 0.28, y: DISPLAY_HEAD * 0.62, headWidth: DISPLAY_HEAD }, posed, undefined, lightSV.value);
      drawBuddyPosed(canvas, res, { x: canvasW * 0.5, y: DISPLAY_HEAD * 1.55 + DISPLAY_HEAD * 1.24, headWidth: DISPLAY_HEAD * 2 }, posed, undefined, lightSV.value);
    }
    return rec.finishRecordingAsPicture();
  });

  // Caption and cost readout: a JS-thread timer reads the shared values (no UI->JS calls).
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      const t = time.get() % LAB_SCRIPT.loop;
      setStats({ label: labelAt(LAB_SCRIPT, t), t, ms: cost.get() });
      if (++n % 8 === 0) console.log(`[BuddyLab] rigAt ms=${cost.get().toFixed(3)} t=${t.toFixed(1)}`);
    }, 250);
    return () => clearInterval(id);
  }, [time, cost]);

  const applyPreset = (name: PresetName) => {
    setMode('manual');
    setParams(presetParams(name));
  };

  // Master overlay placement: master head width 710.7 px, centred on the 2x Buddy's head.
  const ov = useMemo(() => {
    const k = (DISPLAY_HEAD * 2 * overlay.scale) / 710.7;
    return { w: 1015 * k, h: 1095 * k, x: canvasW * 0.5 - 565 * k + overlay.dx, y: DISPLAY_HEAD * 1.55 + DISPLAY_HEAD * 1.24 - 429 * k + overlay.dy };
  }, [overlay, canvasW]);

  return (
    <View style={styles.root}>
      <Canvas style={{ width: canvasW, height: canvasH }}>
        <Rect x={0} y={0} width={canvasW} height={canvasH} color={BG} />
        <Picture picture={picture} />
        {overlay.on && master && <SkImageView image={master} x={ov.x} y={ov.y} width={ov.w} height={ov.h} opacity={overlay.opacity} />}
      </Canvas>
      {record ? (
        <Text style={styles.caption}>{stats.label}</Text>
      ) : (
        <ScrollView style={styles.panel} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.caption}>
            {mode === 'script' ? `${stats.label}  ·  ${stats.t.toFixed(1)}s  ·  re-sim ${stats.ms.toFixed(3)} ms` : 'manual'}
          </Text>
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={() => setMode('script')}><Text style={styles.btnText}>Play script</Text></Pressable>
            <Pressable style={styles.btn} onPress={() => setMode('manual')}><Text style={styles.btnText}>Manual</Text></Pressable>
            <Pressable style={styles.btn} onPress={() => setParams(REST)}><Text style={styles.btnText}>Reset</Text></Pressable>
            <Pressable style={styles.btn} onPress={() => console.log('[BuddyLab] EXPORT ' + JSON.stringify({ params, light }))}>
              <Text style={styles.btnText}>Export pose</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            {PRESET_NAMES.map((n) => (
              <Pressable key={n} style={styles.chip} onPress={() => applyPreset(n)}><Text style={styles.btnText}>{n}</Text></Pressable>
            ))}
          </View>
          <Text style={styles.section}>Light</Text>
          {(['x', 'y', 'z'] as const).map((axis, i) => (
            <Slider key={axis} label={`light ${axis}`} value={light[i]} range={[-1, 1]}
              onChange={(v) => setLight((l) => l.map((c, j) => (j === i ? v : c)))} />
          ))}
          <Text style={styles.section}>Reference overlay (master, on the 2x Buddy)</Text>
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={() => setOverlay((o) => ({ ...o, on: !o.on }))}>
              <Text style={styles.btnText}>{overlay.on ? 'Hide master' : 'Show master'}</Text>
            </Pressable>
          </View>
          <Slider label="opacity" value={overlay.opacity} range={[0, 1]} onChange={(v) => setOverlay((o) => ({ ...o, opacity: v }))} />
          <Slider label="offset x" value={overlay.dx} range={[-80, 80]} onChange={(v) => setOverlay((o) => ({ ...o, dx: v }))} />
          <Slider label="offset y" value={overlay.dy} range={[-80, 80]} onChange={(v) => setOverlay((o) => ({ ...o, dy: v }))} />
          <Slider label="scale" value={overlay.scale} range={[0.7, 1.3]} onChange={(v) => setOverlay((o) => ({ ...o, scale: v }))} />
          <Text style={styles.section}>Rig</Text>
          {RIG_KEYS.map((k: RigKey) => (
            <Slider key={k} label={k} value={params[k]} range={RIG_RANGES[k]}
              onChange={(v) => { setMode('manual'); setParams((p) => ({ ...p, [k]: v })); }} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, paddingTop: 36 },
  panel: { flex: 1, paddingHorizontal: 12 },
  caption: { fontSize: 13, color: '#1B1A24', textAlign: 'center', paddingVertical: 6 },
  section: { fontSize: 12, fontWeight: '600', color: '#6B6880', marginTop: 12, marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  btn: { backgroundColor: '#6E5CD6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  chip: { backgroundColor: '#8E7FE0', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  btnText: { color: '#FFFFFF', fontSize: 12 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', height: 28 },
  sliderLabel: { width: 92, fontSize: 11, color: '#1B1A24' },
  track: { flex: 1, height: 18, borderRadius: 9, backgroundColor: 'rgba(110,92,214,0.15)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#6E5CD6' },
  sliderValue: { width: 46, fontSize: 11, textAlign: 'right', color: '#6B6880' },
});
