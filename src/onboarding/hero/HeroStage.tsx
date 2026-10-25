/**
 * Screen 1 animated hero: a phone demo of the battery-down simulation and
 * Buddy reacting to it, in one Skia canvas driven from the UI thread.
 *
 * Props: width, height, config, language ('en' | 'hi'), paused, onBeat.
 * The headline, language picker and Get Started button live outside.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { Canvas, Group, Circle, Oval, BlurMask, Path, Skia, Rect, useImage } from '@shopify/react-native-skia';
import {
  runOnJS, useAnimatedReaction, useDerivedValue, useFrameCallback, useSharedValue, type SharedValue,
} from 'react-native-reanimated';
import { BEAT_ORDER, DEFAULT_CONFIG, type BeatId, type HeroConfig } from './heroConfig';
import { keyTimes, loopIndex, loopStart, timelineTime, smoothstep } from './heroTimeline';
import { sampleStrokes, type StrokeSamples } from './gesture';
import { computeLayout, type StageLayout } from './layout';
import { blinkSchedule, giggleAllowed, sparkleAt, twitchSchedule } from './director';
import { computeFrame, useHeroFrame, type HeroFrame, type HeroShared } from './heroFrame';
import { MascotLayer, MascotDebug, type MascotImages } from './mascot/MascotLayer';
import { getLightingEffect } from './mascot/lighting';
import { MASCOT_NORMALS, MASCOT_TEXTURES } from './mascot/mascotAssets.generated';
import { RIG, apply, stageMatrix } from './mascot/rig';
import { PhoneLayer } from './phone/PhoneLayer';
import { Finger } from './phone/Finger';
import { HeroFallback } from './HeroFallback';
import { HERO_STRINGS, type HeroLanguage } from './i18n';
import { heroHaptic, playHeroSound } from './audio';

export interface HeroStageProps {
  width: number;
  height: number;
  config?: HeroConfig;
  language?: HeroLanguage;
  paused?: boolean;
  onBeat?: (beat: BeatId) => void;
  /** Optional external master clock (the Studio drives playback with it). */
  clock?: SharedValue<number>;
  /** Show the small speaker toggle (sound is off by default). */
  showSoundToggle?: boolean;
  /** Force the reduced-motion composition (Studio preview). */
  forceReducedMotion?: boolean;
  /** Receives the shared state so the Studio can read the director. */
  onShared?: (s: HeroShared, frame: SharedValue<HeroFrame>) => void;
  /** Canvas ref (the Studio snapshots frames for review). */
  canvasRef?: React.RefObject<any>;
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const TEX_KEYS = Object.keys(MASCOT_TEXTURES) as Array<keyof typeof MASCOT_TEXTURES>;
const NRM_KEYS = Object.keys(MASCOT_NORMALS) as Array<keyof typeof MASCOT_NORMALS>;

function useMascotImages(): { images: MascotImages; normals: MascotImages; ready: boolean } {
  const images: MascotImages = {};
  const normals: MascotImages = {};
  // The key lists are constant, so the hook order never changes.
  // oxlint-disable-next-line react-hooks/rules-of-hooks
  for (const k of TEX_KEYS) images[k] = useImage(MASCOT_TEXTURES[k]);
  // oxlint-disable-next-line react-hooks/rules-of-hooks
  for (const k of NRM_KEYS) normals[k] = useImage(MASCOT_NORMALS[k]);
  const ready = TEX_KEYS.every((k) => images[k]) && NRM_KEYS.every((k) => normals[k]);
  return { images, normals, ready };
}

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

function useHeroShared(config: HeroConfig, layout: StageLayout, reduced: boolean): HeroShared {
  const samples = useMemo(() => sampleStrokes(config.finger.strokes), [config.finger.strokes]);
  const schedules = useMemo(() => ({
    blinks: [0, 1, 2, 3].map((i) => blinkSchedule(config, i)),
    twitches: [0, 1, 2, 3].map((i) => twitchSchedule(config, i)),
  }), [config]);
  const keys = useMemo(() => keyTimes(config), [config]);
  const shared: HeroShared = {
    cfg: useSharedValue(config),
    layout: useSharedValue(layout),
    samples: useSharedValue<StrokeSamples[]>(samples),
    keys: useSharedValue(keys),
    blinks: useSharedValue(schedules.blinks),
    twitches: useSharedValue(schedules.twitches),
    touch: useSharedValue<{ active: boolean; x: number; y: number; at: number }>({ active: false, x: 0, y: 0, at: -100 }),
    giggleAt: useSharedValue(-1e6),
    tilt: useSharedValue({ x: 0, y: 0 }),
    reduced: useSharedValue(reduced),
  };
  useEffect(() => { shared.cfg.value = config; }, [config]);
  useEffect(() => { shared.layout.value = layout; }, [layout]);
  useEffect(() => { shared.samples.value = samples; }, [samples]);
  useEffect(() => { shared.keys.value = keys; }, [keys]);
  useEffect(() => {
    shared.blinks.value = schedules.blinks;
    shared.twitches.value = schedules.twitches;
  }, [schedules]);
  useEffect(() => { shared.reduced.value = reduced; }, [reduced]);
  return shared;
}

// ---------------------------------------------------------------------------
// Scene (everything inside the canvas, for one clock)
// ---------------------------------------------------------------------------

const STAR = (() => {
  const p = Skia.PathBuilder.Make();
  const r = 6;
  const k = 0.32;
  p.moveTo(0, -r);
  p.quadTo(r * k * 0.4, -r * k * 0.4, r, 0);
  p.quadTo(r * k * 0.4, r * k * 0.4, 0, r);
  p.quadTo(-r * k * 0.4, r * k * 0.4, -r, 0);
  p.quadTo(-r * k * 0.4, -r * k * 0.4, 0, -r);
  p.close();
  return p.detach();
})();

function Sparkle({ i, frame, shared }: { i: number; frame: SharedValue<HeroFrame>; shared: HeroShared }) {
  const st = useDerivedValue(() => {
    const d = frame.value.d;
    if (d.sparkle <= 0 || i >= shared.cfg.value.mascot.sparkles || shared.reduced.value) return { x: -50, y: -50, s: 0, a: 0 };
    const s = sparkleAt(i, d.sparkleT, shared.layout.value);
    return { x: s.x, y: s.y, s: s.s, a: s.a * d.sparkle };
  });
  const transform = useDerivedValue(() => [{ translateX: st.value.x }, { translateY: st.value.y }, { scale: Math.max(0.001, st.value.s) }]);
  const opacity = useDerivedValue(() => st.value.a);
  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={STAR} color="#FFF4B8" />
      <Path path={STAR} color="#FFD86B" style="stroke" strokeWidth={0.8} />
    </Group>
  );
}

function ContactShadow({ frame, shared }: { frame: SharedValue<HeroFrame>; shared: HeroShared }) {
  const rect = useDerivedValue(() => {
    const L = shared.layout.value;
    const stage = stageMatrix(L.buddy.x, L.buddy.y, L.buddy.scale);
    const seat = apply(stage, RIG.seat[0], RIG.seat[1]);
    const p = frame.value.d.pose;
    const up = Math.max(0, -p.bodyDy) * 20;
    const w = L.buddy.width * (0.95 - up * 0.3) * p.introScale;
    const h = L.buddy.width * 0.13;
    return { x: seat[0] - w / 2, y: seat[1] - h * 0.55, width: w, height: h };
  });
  const blur = useDerivedValue(() => {
    const lt = shared.cfg.value.lighting;
    return lt.shadowSoftness * (1 + 0.5 * frame.value.phone.screenLuma) * (shared.layout.value.buddy.width / 150);
  });
  const opacity = useDerivedValue(() => {
    const p = frame.value.d.pose;
    const up = Math.max(0, -p.bodyDy) * 12;
    return shared.cfg.value.lighting.shadowOpacity * (1 - up) * p.opacity;
  });
  return (
    <Group opacity={opacity}>
      <Oval rect={rect} color="#3B2E5A">
        <BlurMask blur={blur} style="normal" />
      </Oval>
    </Group>
  );
}

function KeepClear({ shared }: { shared: HeroShared }) {
  const path = useDerivedValue(() => {
    const P = Skia.PathBuilder.Make();
    if (!shared.cfg.value.debug.keepClear) return P.detach();
    const z = shared.layout.value.zones;
    const rs = [z.statusBar, z.notice, z.swipe, z.glyph, shared.layout.value.allowed];
    for (let i = 0; i < rs.length; i++) P.addRect(Skia.XYWHRect(rs[i].x, rs[i].y, rs[i].w, rs[i].h));
    return P.detach();
  });
  return <Path path={path} style="stroke" strokeWidth={1} color="#00b894" />;
}

interface SceneProps {
  clock: SharedValue<number>;
  shared: HeroShared;
  layout: StageLayout;
  config: HeroConfig;
  samples: StrokeSamples[];
  images: MascotImages;
  normals: MascotImages;
  noticeText: string;
  opacity?: SharedValue<number> | number;
  frameOut?: (f: SharedValue<HeroFrame>) => void;
}

function HeroScene({ clock, shared, layout, config, samples, images, normals, noticeText, opacity = 1, frameOut }: SceneProps) {
  const frame = useHeroFrame(clock, shared);
  const effect = getLightingEffect();
  useEffect(() => { frameOut?.(frame); }, [frame]);
  const bgShift = useDerivedValue(() => {
    const k = shared.reduced.value ? 0 : 4 * shared.cfg.value.mascot.tiltParallax;
    return [{ translateX: shared.tilt.value.x * k }, { translateY: shared.tilt.value.y * k }];
  });
  return (
    <Group opacity={opacity}>
      <Group transform={bgShift}>
        <ContactShadow frame={frame} shared={shared} />
      </Group>
      <MascotLayer frame={frame} shared={shared} images={images} normals={normals} effect={effect} pass="back" />
      <PhoneLayer
        frame={frame}
        shared={shared}
        layout={layout}
        samples={samples}
        noticeText={noticeText}
        bezel={config.phone.bezel}
        sheen={config.phone.sheen}
        palette={config.phone.palette}
        time={config.phone.time}
        trailColor={config.finger.trailColor}
      />
      <MascotLayer frame={frame} shared={shared} images={images} normals={normals} effect={effect} pass="front" />
      <Finger frame={frame} shared={shared} skinTone={config.finger.skinTone} size={config.finger.size} />
      {Array.from({ length: 12 }, (_, i) => <Sparkle key={i} i={i} frame={frame} shared={shared} />)}
      <MascotDebug frame={frame} shared={shared} />
      <KeepClear shared={shared} />
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Error boundary -> fallback
// ---------------------------------------------------------------------------

class HeroBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    if (__DEV__) console.warn('[HeroStage] falling back to the static hero:', e);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

const REDUCED_STILLS = [2.4, 10.0, 16.4]; // playing, dead, woken

export function HeroStage(props: HeroStageProps) {
  const fallback = <HeroFallback width={props.width} height={props.height} />;
  const skiaOk = useMemo(() => {
    try {
      return !!Skia.Path.Make() && getLightingEffect() !== null;
    } catch {
      return false;
    }
  }, []);
  if (!skiaOk) return fallback;
  return (
    <HeroBoundary fallback={fallback}>
      <HeroStageInner {...props} />
    </HeroBoundary>
  );
}

function HeroStageInner({
  width, height, config = DEFAULT_CONFIG, language = 'en', paused = false, onBeat, clock: externalClock,
  showSoundToggle = true, forceReducedMotion, onShared, canvasRef,
}: HeroStageProps) {
  const [soundOn, setSoundOn] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [appActive, setAppActive] = useState(true);
  const reduced = forceReducedMotion ?? systemReduced;
  const cfg = useMemo(() => ({ ...config, audio: { ...config.audio, enabled: config.audio.enabled || soundOn } }), [config, soundOn]);
  const layout = useMemo(() => computeLayout(width, height, { phoneRadius: cfg.phone.radius }), [width, height, cfg.phone.radius]);
  const shared = useHeroShared(cfg, layout, reduced);
  const { images, normals, ready } = useMascotImages();
  const samples = useMemo(() => sampleStrokes(cfg.finger.strokes), [cfg.finger.strokes]);
  const strings = HERO_STRINGS[language];
  const noticeText = cfg.phone.bannerText || strings.notice;

  // --- reduce motion -------------------------------------------------------
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setSystemReduced(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setSystemReduced(v));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  // --- app state / focus ---------------------------------------------------
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // --- clock ----------------------------------------------------------------
  const internalClock = useSharedValue(0);
  const clock = externalClock ?? internalClock;
  const lastInteraction = useSharedValue(0);
  const frameParity = useSharedValue(0);
  const running = !paused && appActive && ready && !externalClock && !reduced;
  const speed = useSharedValue(cfg.speed);
  useEffect(() => { speed.value = cfg.speed; }, [cfg.speed]);
  useFrameCallback((info) => {
    'worklet';
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    // After 60 s without interaction, step at 30 fps for the idle loop.
    if (clock.value - lastInteraction.value > 60) {
      frameParity.value = 1 - frameParity.value;
      if (frameParity.value === 1) return;
      clock.value += dt * 2 * speed.value;
      return;
    }
    clock.value += dt * speed.value;
  }, running);

  // Language change restarts the loop from 1.0 s.
  const firstLang = useRef(true);
  useEffect(() => {
    if (firstLang.current) {
      firstLang.current = false;
      return;
    }
    clock.value = loopStart(cfg);
  }, [language]);

  // --- reduced motion: slow crossfade between three stills ------------------
  const stillA = useSharedValue(REDUCED_STILLS[0]);
  const stillB = useSharedValue(REDUCED_STILLS[1]);
  const fade = useSharedValue(0);
  const reducedClock = useSharedValue(0);
  useFrameCallback((info) => {
    'worklet';
    reducedClock.value += Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    const cycle = 4.5; // hold 3.3 s, crossfade 1.2 s
    const k = Math.floor(reducedClock.value / cycle);
    const u = (reducedClock.value % cycle) / cycle;
    stillA.value = REDUCED_STILLS[k % 3];
    stillB.value = REDUCED_STILLS[(k + 1) % 3];
    fade.value = smoothstep(0.73, 1, u);
  }, reduced && !paused && appActive && ready);

  // --- beats -> sounds, haptics, onBeat -------------------------------------
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const onBeatRef = useRef(onBeat);
  onBeatRef.current = onBeat;
  const handleBeat = useCallback((idx: number) => {
    const id = BEAT_ORDER[idx];
    const c = cfgRef.current;
    if (id === 'warning') playHeroSound('chirp', c);
    else if (id === 'off') playHeroSound('powerDown', c);
    else if (id === 'wake') {
      playHeroSound('chime', c);
      heroHaptic(c, 'success');
    }
    onBeatRef.current?.(id);
  }, []);
  useAnimatedReaction(
    () => {
      const c = shared.cfg.value;
      const t = timelineTime(clock.value, c);
      let i = 0;
      for (let k = BEAT_ORDER.length - 1; k >= 0; k--) {
        if (t >= c.beats[BEAT_ORDER[k]].start) { i = k; break; }
      }
      return i + 100 * loopIndex(clock.value, c);
    },
    (cur, prev) => {
      if (prev !== null && cur !== prev) runOnJS(handleBeat)(cur % 100);
    },
  );

  // --- touch ----------------------------------------------------------------
  const onTouchStart = (e: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    lastInteraction.value = clock.value;
    shared.touch.value = { active: true, x, y, at: clock.value };
    const B = layout.buddy;
    const onBuddy = x >= B.x && x <= B.x + B.width && y >= B.y && y <= B.y + B.height;
    if (onBuddy) {
      const t = timelineTime(clock.value, cfg);
      const last = shared.giggleAt.value;
      if (giggleAllowed(t, cfg, clock.value) && t - last > 0.9) {
        shared.giggleAt.value = t;
        playHeroSound('giggle', cfg);
        heroHaptic(cfg, 'light');
      }
    }
  };
  const onTouchMove = (e: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    shared.touch.value = { active: true, x, y, at: shared.touch.value.at };
  };
  const onTouchEnd = () => {
    shared.touch.value = { ...shared.touch.value, active: false, at: clock.value };
  };

  // --- device tilt -----------------------------------------------------------
  useEffect(() => {
    if (reduced || paused || !appActive) return;
    let sub: { remove: () => void } | null = null;
    try {
      const { DeviceMotion } = require('expo-sensors');
      DeviceMotion.setUpdateInterval(33);
      sub = DeviceMotion.addListener((m: { rotation?: { beta: number; gamma: number } }) => {
        const r = m.rotation;
        if (!r) return;
        const x = Math.max(-1, Math.min(1, r.gamma / 0.45));
        const y = Math.max(-1, Math.min(1, (r.beta - 0.7) / 0.45));
        const prev = shared.tilt.value;
        shared.tilt.value = { x: prev.x + (x - prev.x) * 0.15, y: prev.y + (y - prev.y) * 0.15 };
      });
    } catch {
      sub = null;
    }
    return () => sub?.remove();
  }, [reduced, paused, appActive]);

  const frameRef = useRef<SharedValue<HeroFrame> | null>(null);
  const exposeFrame = useCallback((f: SharedValue<HeroFrame>) => {
    frameRef.current = f;
    onShared?.(shared, f);
  }, [onShared]);

  if (!ready) {
    // First frame within ~300 ms: static bear and phone while textures load.
    return (
      <View style={{ width, height }} accessible accessibilityLabel={strings.a11yLabel}>
        <HeroFallback width={width} height={height} animated={false} />
      </View>
    );
  }

  const fadeB = fade;
  return (
    <View
      style={{ width, height }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={strings.a11yLabel}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={onTouchStart}
      onResponderMove={onTouchMove}
      onResponderRelease={onTouchEnd}
      onResponderTerminate={onTouchEnd}
    >
      <Canvas ref={canvasRef} style={{ width, height }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {reduced ? (
          <>
            <HeroScene clock={stillA} shared={shared} layout={layout} config={cfg} samples={samples} images={images} normals={normals} noticeText={noticeText} frameOut={exposeFrame} />
            <HeroScene clock={stillB} shared={shared} layout={layout} config={cfg} samples={samples} images={images} normals={normals} noticeText={noticeText} opacity={fadeB} />
          </>
        ) : (
          <HeroScene clock={clock} shared={shared} layout={layout} config={cfg} samples={samples} images={images} normals={normals} noticeText={noticeText} frameOut={exposeFrame} />
        )}
      </Canvas>
      {showSoundToggle && (
        <Pressable
          onPress={() => setSoundOn((s) => !s)}
          accessibilityRole="button"
          accessibilityLabel={soundOn ? strings.soundOff : strings.soundOn}
          hitSlop={10}
          style={[styles.sound, { top: 6, right: 6 }]}
        >
          <Text style={styles.soundIcon}>{soundOn ? '🔊' : '🔈'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sound: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundIcon: { fontSize: 14 },
});

export { computeFrame };
export default HeroStage;
