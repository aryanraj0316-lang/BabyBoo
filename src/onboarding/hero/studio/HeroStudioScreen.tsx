/**
 * Animation Studio (dev only): the live HeroStage on top, tabbed controls
 * below. Same engine as the real Screen 1; every change applies live.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { runOnJS, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Skia, ImageFormat, type SkImage } from '@shopify/react-native-skia';
import {
  A_PRESET, BEAT_ORDER, BEZEL_PRESETS, CARTOON_PALETTES, DEFAULT_CONFIG, PRESETS, SKIN_TONES,
  getConfigValue, setConfigValue, validateConfig, type HeroConfig, type Stroke,
} from '../heroConfig';
import { loopEnd, timelineTime } from '../heroTimeline';
import { computeLayout } from '../layout';
import { simplifyStroke } from '../gesture';
import { runContextCheck, type Violation } from '../contextCheck';
import { HeroStage } from '../HeroStage';
import { heroGetItem, heroSetItem } from '../storage';
import type { HeroFrame, HeroShared } from '../heroFrame';
import type { HeroLanguage } from '../i18n';
import { Btn, C, LightPad, Section, Segmented, Slider, Toggle } from './controls';

const STORAGE_KEY = 'babyboo.heroStudio.config';
type Tab = 'Timeline' | 'Mascot' | 'Lighting' | 'Phone' | 'Finger' | 'Audio' | 'Debug' | 'Context' | 'Poses' | 'Config';
const TABS: Tab[] = ['Timeline', 'Mascot', 'Lighting', 'Phone', 'Finger', 'Audio', 'Debug', 'Context', 'Poses', 'Config'];

interface P { path: string; label: string; min: number; max: number; step?: number }
const MASCOT_PARAMS: P[] = [
  { path: 'mascot.breath', label: 'Breathing amplitude', min: 0, max: 0.04, step: 0.001 },
  { path: 'mascot.blinkMin', label: 'Blink interval min (s)', min: 1, max: 12, step: 0.1 },
  { path: 'mascot.blinkMax', label: 'Blink interval max (s)', min: 1, max: 15, step: 0.1 },
  { path: 'mascot.gaze', label: 'Gaze strength', min: 0, max: 1.5 },
  { path: 'mascot.faceParallax', label: 'Face parallax (src px)', min: 0, max: 10, step: 0.1 },
  { path: 'mascot.tiltParallax', label: 'Tilt parallax', min: 0, max: 2 },
  { path: 'mascot.earLag', label: 'Ear lag (deg)', min: 0, max: 8, step: 0.1 },
  { path: 'mascot.wave.amplitudeDeg', label: 'Wave amplitude (deg)', min: 0, max: 24, step: 0.5 },
  { path: 'mascot.wave.cycles', label: 'Wave cycles', min: 1, max: 5, step: 1 },
  { path: 'mascot.squash', label: 'Squash & stretch', min: 0, max: 1.5 },
  { path: 'mascot.cheer', label: 'Cheer intensity', min: 0, max: 1.5 },
  { path: 'mascot.sparkles', label: 'Sparkle count', min: 0, max: 12, step: 1 },
];
const LIGHT_PARAMS: P[] = [
  { path: 'lighting.key', label: 'Key intensity', min: 0, max: 2 },
  { path: 'lighting.ambient', label: 'Ambient', min: 0.2, max: 1 },
  { path: 'lighting.specAmount', label: 'Specular amount', min: 0, max: 0.3, step: 0.005 },
  { path: 'lighting.specPower', label: 'Specular power', min: 2, max: 64, step: 1 },
  { path: 'lighting.rim', label: 'Rim amount', min: 0, max: 0.4, step: 0.005 },
  { path: 'lighting.spill', label: 'Screen spill', min: 0, max: 0.6, step: 0.005 },
  { path: 'lighting.shadowSoftness', label: 'Shadow softness', min: 1, max: 30, step: 0.5 },
  { path: 'lighting.shadowOpacity', label: 'Shadow opacity', min: 0, max: 0.6, step: 0.01 },
];
const PHONE_PARAMS: P[] = [
  { path: 'phone.radius', label: 'Corner radius (x width)', min: 0.04, max: 0.16, step: 0.005 },
  { path: 'phone.sheen', label: 'Sheen intensity', min: 0, max: 1 },
  { path: 'phone.dimAmount', label: 'Dim amount', min: 0.3, max: 0.95 },
];
const FINGER_PARAMS: P[] = [
  { path: 'finger.size', label: 'Finger size', min: 0.6, max: 1.6 },
  { path: 'finger.speed', label: 'Stroke speed', min: 0.5, max: 2 },
  { path: 'finger.jitter', label: 'Jitter (px)', min: 0, max: 2, step: 0.05 },
  { path: 'finger.trailLength', label: 'Trail length (s)', min: 0.2, max: 2, step: 0.05 },
];
const TIMELINE_BAT: P[] = [
  { path: 'battery.start', label: 'Battery start %', min: 2, max: 100, step: 1 },
  { path: 'battery.mid', label: 'Battery after drain %', min: 1, max: 50, step: 1 },
  { path: 'battery.end', label: 'Battery final %', min: 0, max: 10, step: 1 },
  { path: 'battery.redBelow', label: 'Red at or below %', min: 1, max: 50, step: 1 },
  { path: 'battery.drainCurve', label: 'Drain curve', min: 0, max: 1 },
];

export function HeroStudioScreen() {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const [cfg, setCfg] = useState<HeroConfig>(DEFAULT_CONFIG);
  const [tab, setTab] = useState<Tab>('Timeline');
  const [playing, setPlaying] = useState(true);
  const [lang, setLang] = useState<HeroLanguage>('en');
  const [reduced, setReduced] = useState(false);
  const [status, setStatus] = useState('');
  const [now, setNow] = useState({ t: 0, beat: 'intro', intent: '', gaze: '' });
  const [violations, setViolations] = useState<Violation[] | null>(null);
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<Stroke[]>([]);
  const sharedRef = useRef<HeroShared | null>(null);
  const frameRef = useRef<SharedValue<HeroFrame> | null>(null);
  const canvasRef = useRef<any>(null);

  const stageW = W;
  const stageH = Math.round(Math.min(H * 0.5, W * 1.25));
  const layout = useMemo(() => computeLayout(stageW, stageH, { phoneRadius: cfg.phone.radius }), [stageW, stageH, cfg.phone.radius]);

  // --- clock (the Studio owns playback) -----------------------------------
  const clock = useSharedValue(0);
  const speedSV = useSharedValue(cfg.speed);
  const loopSV = useSharedValue(cfg.loop);
  useEffect(() => { speedSV.value = cfg.speed; loopSV.value = cfg.loop; }, [cfg.speed, cfg.loop]);
  useFrameCallback((info) => {
    'worklet';
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    clock.value += dt * speedSV.value;
  }, playing);

  // status line at ~8 Hz
  const push = useCallback((t: number, beat: number, intent: string, gx: number, gy: number) => {
    setNow({ t, beat: BEAT_ORDER[beat], intent, gaze: `${gx.toFixed(0)}, ${gy.toFixed(0)}` });
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      const f = frameRef.current?.value;
      if (f) push(f.t, f.beat, f.d.intent, f.d.gazeX, f.d.gazeY);
      if (!cfg.loop && clock.value >= loopEnd(cfg)) setPlaying(false);
    }, 125);
    return () => clearInterval(id);
  }, [cfg]);

  const update = (path: string, v: unknown) => setCfg((c) => setConfigValue(c, path, v));
  const num = (path: string) => getConfigValue(cfg, path) as number;

  const seek = (t: number) => {
    clock.value = Math.max(0, t);
  };
  const beatJump = (dir: -1 | 1) => {
    const t = timelineTime(clock.value, cfg);
    const starts = BEAT_ORDER.map((b) => cfg.beats[b].start);
    if (dir > 0) {
      const n = starts.find((s) => s > t + 0.01);
      seek(n ?? 0);
    } else {
      const prev = [...starts].reverse().find((s) => s < t - 0.15);
      seek(prev ?? 0);
    }
  };

  // --- scrubber -----------------------------------------------------------
  const [scrubW, setScrubW] = useState(1);
  const total = loopEnd(cfg);
  const scrubPan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => seek((e.nativeEvent.locationX / scrubW) * total),
    onPanResponderMove: (e) => seek((Math.max(0, Math.min(scrubW, e.nativeEvent.locationX)) / scrubW) * total),
  });

  // --- pose tester ----------------------------------------------------------
  const pose = (name: string) => {
    const s = sharedRef.current;
    const t = timelineTime(clock.value, cfg);
    const B = cfg.beats;
    switch (name) {
      case 'waveHello': seek(B.settle.start); break;
      case 'yawn': seek(B.deadHold.start - 0.1); break;
      case 'curiousTilt': seek(B.tap.start); break;
      case 'cheer': seek(B.celebrate.start - 0.1); break;
      case 'giggle': if (s) s.giggleAt.value = t; break;
      case 'blink':
        if (s) s.blinks.value = s.blinks.value.map((list) => [...list, { t: t + 0.05, down: 0.14, up: 0.12 }]);
        break;
      case 'look left':
      case 'look right':
        if (s) {
          const x = name === 'look left' ? 0 : stageW;
          s.touch.value = { active: true, x, y: stageH * 0.45, at: clock.value };
          setTimeout(() => { s.touch.value = { ...s.touch.value, active: false, at: clock.value }; }, 1200);
        }
        break;
    }
  };

  // --- config tools ---------------------------------------------------------
  const save = async () => {
    await heroSetItem(STORAGE_KEY, JSON.stringify(cfg));
    setStatus('Saved');
  };
  const load = async () => {
    const raw = await heroGetItem(STORAGE_KEY);
    if (raw) setCfg(validateConfig(JSON.parse(raw)));
    setStatus(raw ? 'Loaded' : 'Nothing saved yet');
  };
  const copyJson = async () => {
    const Clipboard = require('expo-clipboard');
    await Clipboard.setStringAsync(JSON.stringify(cfg, null, 2));
    setStatus('Copied JSON to clipboard');
  };
  const importJson = async () => {
    try {
      const Clipboard = require('expo-clipboard');
      const text = await Clipboard.getStringAsync();
      setCfg(validateConfig(JSON.parse(text)));
      setStatus('Imported from clipboard');
    } catch (e) {
      setStatus(`Import failed: ${String(e)}`);
    }
  };
  const writeAndShare = async (name: string, content: string, base64 = false, mime = 'application/json') => {
    const { File, Paths } = require('expo-file-system');
    const f = new File(Paths.cache, name);
    try { f.delete(); } catch { /* new file */ }
    f.create();
    await f.write(content, base64 ? { encoding: 'base64' } : undefined);
    const Sharing = require('expo-sharing');
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f.uri, { mimeType: mime });
    return f.uri;
  };
  const exportFile = async () => {
    try {
      const uri = await writeAndShare('hero-config.json', JSON.stringify(cfg, null, 2));
      setStatus(`Exported ${uri}`);
    } catch (e) {
      setStatus(`Export failed: ${String(e)}`);
    }
  };
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const exportFrames = async () => {
    const was = playing;
    setPlaying(false);
    try {
      const shots: SkImage[] = [];
      const times: number[] = [];
      for (const b of BEAT_ORDER) {
        const { start, end } = cfg.beats[b];
        for (const u of [0.05, 0.5, 0.95]) times.push(start + (end - start) * u);
      }
      for (const t of times) {
        seek(t);
        await nextFrame();
        await nextFrame();
        const img = canvasRef.current?.makeImageSnapshot?.();
        if (img) shots.push(img);
      }
      if (!shots.length) throw new Error('snapshot unavailable');
      const cols = 6;
      const tw = shots[0].width();
      const th = shots[0].height();
      const rows = Math.ceil(shots.length / cols);
      const surface = Skia.Surface.MakeOffscreen(tw * cols, th * rows);
      if (!surface) throw new Error('offscreen surface unavailable');
      const canvas = surface.getCanvas();
      canvas.clear(Skia.Color('#FAF8F5'));
      shots.forEach((img, i) => canvas.drawImage(img, (i % cols) * tw, Math.floor(i / cols) * th));
      surface.flush();
      const b64 = surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, 100);
      const uri = await writeAndShare(`hero-frames-${stageW}x${stageH}.png`, b64, true, 'image/png');
      setStatus(`Exported ${shots.length} frames: ${uri}`);
    } catch (e) {
      setStatus(`Export frames failed: ${String(e)}`);
    } finally {
      setPlaying(was);
    }
  };

  const runCheck = () => {
    const res = runContextCheck(cfg);
    setViolations(res.violations);
    setStatus(`Context test: ${res.samples} samples, ${res.violations.length} violations`);
  };

  // --- stroke recorder (draw on the studio phone) ---------------------------
  const S = layout.screen;
  const cur = useRef<Stroke>([]);
  const recPan = PanResponder.create({
    onStartShouldSetPanResponder: () => recording,
    onMoveShouldSetPanResponder: () => recording,
    onPanResponderGrant: (e) => {
      cur.current = [[(e.nativeEvent.locationX) / S.w, (e.nativeEvent.locationY) / S.h]];
    },
    onPanResponderMove: (e) => {
      const p: [number, number] = [Math.max(0, Math.min(1, e.nativeEvent.locationX / S.w)), Math.max(0, Math.min(1, e.nativeEvent.locationY / S.h))];
      cur.current.push(p);
    },
    onPanResponderRelease: () => {
      const st = simplifyStroke(cur.current);
      if (st.length >= 2) setDraft((d) => [...d, st]);
      cur.current = [];
    },
  });

  // draggable point handles for editing the active strokes
  const strokes = recording ? draft : cfg.finger.strokes;
  const movePoint = (si: number, pi: number, x: number, y: number) => {
    const next = cfg.finger.strokes.map((s, i) => (i === si ? s.map((p, j) => (j === pi ? ([+x.toFixed(4), +y.toFixed(4)] as [number, number]) : p)) : s));
    update('finger.strokes', next);
  };

  // --- render ----------------------------------------------------------------
  const panel = () => {
    switch (tab) {
      case 'Timeline':
        return (
          <>
            <Section title="Beats (start / end, s)">
              {BEAT_ORDER.map((b) => (
                <Slider key={b} label={`${b} end`} value={cfg.beats[b].end} min={cfg.beats[b].start + 0.1} max={cfg.beats[b].start + 4} step={0.05}
                  onChange={(v) => update(`beats.${b}.end`, v)} format={(v) => `${cfg.beats[b].start.toFixed(2)} → ${v.toFixed(2)}`} />
              ))}
              <Btn label="Reset timing" onPress={() => update('beats', DEFAULT_CONFIG.beats)} />
            </Section>
            <Section title="Battery">
              {TIMELINE_BAT.map((p) => <Slider key={p.path} label={p.label} value={num(p.path)} min={p.min} max={p.max} step={p.step} onChange={(v) => update(p.path, v)} />)}
            </Section>
          </>
        );
      case 'Mascot':
        return (
          <Section title="Mascot">
            <Segmented label="Blink style" value={cfg.mascot.blinkStyle} options={['eyelid', 'squash'] as const} onChange={(v) => update('mascot.blinkStyle', v)} />
            {MASCOT_PARAMS.map((p) => <Slider key={p.path} label={p.label} value={num(p.path)} min={p.min} max={p.max} step={p.step} onChange={(v) => update(p.path, v)} />)}
          </Section>
        );
      case 'Lighting':
        return (
          <Section title="Lighting">
            <LightPad dir={cfg.lighting.dir} onChange={(d) => update('lighting.dir', d)} />
            {LIGHT_PARAMS.map((p) => <Slider key={p.path} label={p.label} value={num(p.path)} min={p.min} max={p.max} step={p.step} onChange={(v) => update(p.path, v)} />)}
          </Section>
        );
      case 'Phone':
        return (
          <Section title="Phone">
            <Segmented label="Bezel" value={cfg.phone.bezel} options={Object.keys(BEZEL_PRESETS)} onChange={(v) => update('phone.bezel', v)} />
            <Segmented label="Cartoon palette" value={cfg.phone.palette} options={Object.keys(CARTOON_PALETTES)} onChange={(v) => update('phone.palette', v)} />
            <Segmented label="Status bar time" value={cfg.phone.time} options={['4:15', '7:30', '12:00', '6:45']} onChange={(v) => update('phone.time', v)} />
            <Segmented label="Banner text" value={cfg.phone.bannerText ? 'custom' : 'localized'} options={['localized', 'custom'] as const}
              onChange={(v) => update('phone.bannerText', v === 'custom' ? 'Battery low. Phone needs rest.' : '')} />
            {PHONE_PARAMS.map((p) => <Slider key={p.path} label={p.label} value={num(p.path)} min={p.min} max={p.max} step={p.step} onChange={(v) => update(p.path, v)} />)}
          </Section>
        );
      case 'Finger':
        return (
          <>
            <Section title="Finger">
              <Segmented label="Skin tone" value={cfg.finger.skinTone} options={Object.keys(SKIN_TONES)} onChange={(v) => update('finger.skinTone', v)} />
              <Segmented label="Trail colour" value={cfg.finger.trailColor} options={['#B9A3FF', '#9AD8FF', '#FFB3D9']} onChange={(v) => update('finger.trailColor', v)} />
              {FINGER_PARAMS.map((p) => <Slider key={p.path} label={p.label} value={num(p.path)} min={p.min} max={p.max} step={p.step} onChange={(v) => update(p.path, v)} />)}
            </Section>
            <Section title="Gesture strokes">
              <Text style={st.note}>Free-form swipe, no dots or grid. Drag the handles on the phone to edit points, or record a new gesture by drawing on the phone.</Text>
              <View style={st.btnRow}>
                <Btn label="A preset" onPress={() => update('finger.strokes', A_PRESET)} />
                {!recording ? (
                  <Btn label="Record" primary onPress={() => { setDraft([]); setRecording(true); setPlaying(false); }} />
                ) : (
                  <>
                    <Btn label="Save gesture" primary onPress={() => { if (draft.length) update('finger.strokes', draft.slice(0, 6)); setRecording(false); }} />
                    <Btn label="Undo stroke" onPress={() => setDraft((d) => d.slice(0, -1))} />
                    <Btn label="Cancel" onPress={() => setRecording(false)} />
                  </>
                )}
                <Btn label="Remove last point" onPress={() => {
                  const s = cfg.finger.strokes.map((x) => x.slice());
                  const last = s[s.length - 1];
                  if (last.length > 2) last.pop();
                  else if (s.length > 1) s.pop();
                  update('finger.strokes', s);
                }} />
              </View>
              {cfg.finger.strokes.map((s, i) => (
                <Text key={i} style={st.mono}>{`stroke ${i + 1}: ${s.map((p) => `(${p[0].toFixed(2)},${p[1].toFixed(2)})`).join(' ')}`}</Text>
              ))}
            </Section>
          </>
        );
      case 'Audio':
        return (
          <Section title="Audio and haptics">
            <Toggle label="Master sound (off by default)" value={cfg.audio.enabled} onChange={(v) => update('audio.enabled', v)} />
            <Toggle label="Low-battery chirp" value={cfg.audio.chirp} onChange={(v) => update('audio.chirp', v)} />
            <Toggle label="Power-down sweep" value={cfg.audio.powerDown} onChange={(v) => update('audio.powerDown', v)} />
            <Toggle label="Wake chime" value={cfg.audio.chime} onChange={(v) => update('audio.chime', v)} />
            <Toggle label="Giggle" value={cfg.audio.giggle} onChange={(v) => update('audio.giggle', v)} />
            <Toggle label="Haptics" value={cfg.audio.haptics} onChange={(v) => update('audio.haptics', v)} />
          </Section>
        );
      case 'Debug':
        return (
          <Section title="Debug">
            <Toggle label="Rig polygons and pivots" value={cfg.debug.rig} onChange={(v) => update('debug.rig', v)} />
            <Toggle label="Normal map" value={cfg.debug.normals} onChange={(v) => update('debug.normals', v)} />
            <Toggle label="Light vector" value={cfg.debug.lightVector} onChange={(v) => update('debug.lightVector', v)} />
            <Toggle label="Gaze target" value={cfg.debug.gazeTarget} onChange={(v) => update('debug.gazeTarget', v)} />
            <Toggle label="FPS / frame-time HUD" value={cfg.debug.hud} onChange={(v) => update('debug.hud', v)} />
            <Toggle label="Reduce Motion preview" value={reduced} onChange={setReduced} />
            <Slider label="Slow motion (speed)" value={cfg.speed} min={0.25} max={2} step={0.05} onChange={(v) => update('speed', v)} />
          </Section>
        );
      case 'Context':
        return (
          <Section title="Context director">
            <Text style={st.kv}>Beat: <Text style={st.kvV}>{now.beat}</Text></Text>
            <Text style={st.kv}>Intent: <Text style={st.kvV}>{now.intent}</Text></Text>
            <Text style={st.kv}>Gaze target: <Text style={st.kvV}>{now.gaze}</Text></Text>
            <Toggle label="Show keep-clear zones" value={cfg.debug.keepClear} onChange={(v) => update('debug.keepClear', v)} />
            <Btn label="Run context test" primary onPress={runCheck} />
            {violations && (violations.length === 0
              ? <Text style={st.ok}>No violations across the whole loop at 5 canvas sizes.</Text>
              : violations.slice(0, 40).map((v, i) => <Text key={i} style={st.bad}>{`${v.size} t=${v.t.toFixed(2)} ${v.rule} ${v.detail}`}</Text>))}
          </Section>
        );
      case 'Poses':
        return (
          <Section title="Pose tester">
            <View style={st.btnRow}>
              {['waveHello', 'blink', 'yawn', 'curiousTilt', 'cheer', 'giggle', 'look left', 'look right'].map((p) => (
                <Btn key={p} label={p} onPress={() => pose(p)} />
              ))}
            </View>
          </Section>
        );
      case 'Config':
        return (
          <Section title="Config">
            <View style={st.btnRow}>
              {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((k) => <Btn key={k} label={k} onPress={() => setCfg(PRESETS[k])} />)}
            </View>
            <View style={st.btnRow}>
              <Btn label="Save" onPress={save} />
              <Btn label="Load" onPress={load} />
              <Btn label="Copy JSON" onPress={copyJson} />
              <Btn label="Import JSON" onPress={importJson} />
              <Btn label="Export file" onPress={exportFile} />
              <Btn label="Export frames" primary onPress={exportFrames} />
              <Btn label="Reset to defaults" onPress={() => setCfg(DEFAULT_CONFIG)} />
            </View>
            <Segmented label="Demo language" value={lang} options={['en', 'hi'] as const} onChange={setLang} />
          </Section>
        );
    }
  };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={{ width: stageW, height: stageH }}>
        <HeroStage
          width={stageW}
          height={stageH}
          config={cfg}
          language={lang}
          clock={clock}
          forceReducedMotion={reduced}
          canvasRef={canvasRef}
          onShared={(s, f) => { sharedRef.current = s; frameRef.current = f; }}
        />
        {/* stroke handles / recorder over the phone screen */}
        <View style={{ position: 'absolute', left: S.x, top: S.y, width: S.w, height: S.h }} pointerEvents={recording || tab === 'Finger' ? 'auto' : 'none'} {...(recording ? recPan.panHandlers : {})}>
          {tab === 'Finger' && strokes.map((s, si) => s.map((p, pi) => (
            <Handle key={`${si}-${pi}`} x={p[0] * S.w} y={p[1] * S.h} label={pi === 0 ? `${si + 1}` : ''}
              onMove={recording ? undefined : (x, y) => movePoint(si, pi, Math.max(0, Math.min(1, x / S.w)), Math.max(0, Math.min(1, y / S.h)))} />
          )))}
        </View>
        {cfg.debug.hud && <Hud />}
      </View>
      <View style={st.transport}>
        <Btn small label={playing ? 'Pause' : 'Play'} primary onPress={() => setPlaying((p) => !p)} />
        <Btn small label="◀ beat" onPress={() => beatJump(-1)} />
        <Btn small label="beat ▶" onPress={() => beatJump(1)} />
        <Btn small label={cfg.loop ? 'Loop' : 'Once'} onPress={() => update('loop', !cfg.loop)} />
        <Btn small label={`${cfg.speed.toFixed(2)}x`} onPress={() => update('speed', cfg.speed >= 2 ? 0.25 : +(cfg.speed * 2).toFixed(2))} />
        <Text style={st.time}>{now.t.toFixed(2)}s · {now.beat}</Text>
      </View>
      <View style={st.scrub} onLayout={(e) => setScrubW(e.nativeEvent.layout.width)} {...scrubPan.panHandlers}>
        <View style={st.scrubTrack} />
        {BEAT_ORDER.map((b) => (
          <Pressable key={b} onPress={() => seek(cfg.beats[b].start)} style={[st.marker, { left: (cfg.beats[b].start / total) * scrubW }]}>
            <Text style={st.markerText}>{b.slice(0, 4)}</Text>
          </Pressable>
        ))}
        <View pointerEvents="none" style={[st.playhead, { left: (Math.min(now.t, total) / total) * scrubW }]} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.tabs} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[st.tab, tab === t && st.tabOn]}>
            <Text style={[st.tabText, tab === t && st.tabTextOn]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 24 }}>
        {status ? <Text style={st.status}>{status}</Text> : null}
        {panel()}
      </ScrollView>
    </View>
  );
}

function Handle({ x, y, label, onMove }: { x: number; y: number; label: string; onMove?: (x: number, y: number) => void }) {
  const start = useRef({ x, y });
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => !!onMove,
    onMoveShouldSetPanResponder: () => !!onMove,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { start.current = { x, y }; },
    onPanResponderMove: (_, g) => onMove?.(start.current.x + g.dx, start.current.y + g.dy),
  });
  return (
    <View {...pan.panHandlers} style={[st.handle, { left: x - 9, top: y - 9 }]}>
      {label ? <Text style={st.handleText}>{label}</Text> : null}
    </View>
  );
}

function Hud() {
  const [fps, setFps] = useState({ fps: 0, ms: 0 });
  const acc = useSharedValue({ n: 0, sum: 0, max: 0 });
  const report = useCallback((n: number, sum: number) => setFps({ fps: Math.round((n / sum) * 1000), ms: +(sum / n).toFixed(1) }), []);
  useFrameCallback((info) => {
    'worklet';
    const dt = info.timeSincePreviousFrame ?? 16;
    const a = acc.value;
    const next = { n: a.n + 1, sum: a.sum + dt, max: Math.max(a.max, dt) };
    if (next.sum > 500) {
      runOnJS(report)(next.n, next.sum);
      acc.value = { n: 0, sum: 0, max: 0 };
    } else acc.value = next;
  });
  return (
    <View style={st.hud} pointerEvents="none">
      <Text style={st.hudText}>{`${fps.fps} fps · ${fps.ms} ms/frame (UI thread)`}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  transport: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, flexWrap: 'wrap' },
  time: { marginLeft: 'auto', color: C.sub, fontSize: 12, fontVariant: ['tabular-nums'] },
  scrub: { height: 38, marginHorizontal: 16, justifyContent: 'center' },
  scrubTrack: { height: 4, borderRadius: 2, backgroundColor: C.line },
  marker: { position: 'absolute', top: 0, width: 2, height: 16, backgroundColor: C.accent, alignItems: 'flex-start' },
  markerText: { position: 'absolute', top: 18, left: -8, fontSize: 8, color: C.sub, width: 30 },
  playhead: { position: 'absolute', width: 3, height: 22, marginLeft: -1.5, backgroundColor: C.ink, borderRadius: 2 },
  tabs: { maxHeight: 44, flexGrow: 0, marginTop: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 6, borderRadius: 18, backgroundColor: C.accentSoft, alignSelf: 'center' },
  tabOn: { backgroundColor: C.accent },
  tabText: { fontSize: 13, color: C.ink },
  tabTextOn: { color: '#fff', fontWeight: '700' },
  status: { fontSize: 12, color: C.accent, marginBottom: 8 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { fontSize: 12, color: C.sub, marginBottom: 10 },
  mono: { fontSize: 10, color: C.sub, fontFamily: 'monospace', marginTop: 4 },
  kv: { fontSize: 13, color: C.sub, marginBottom: 4 },
  kvV: { color: C.ink, fontWeight: '600' },
  ok: { color: '#1e9e6a', fontSize: 12, marginTop: 6 },
  bad: { color: '#c0392b', fontSize: 11, marginTop: 2 },
  handle: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(124,92,255,0.75)', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  handleText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  hud: { position: 'absolute', left: 8, top: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  hudText: { color: '#fff', fontSize: 11, fontVariant: ['tabular-nums'] },
});

export default HeroStudioScreen;
