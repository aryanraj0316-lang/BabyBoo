import React, { useEffect, useRef, useState } from 'react';
import { AppState, Image as NativeImage, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurMask, Canvas, Group, Image, Mask, Path, Skia, useImage, type SkImage } from '@shopify/react-native-skia';
import { cancelAnimation, Easing, useDerivedValue, useSharedValue, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { useReducedMotion } from '../screen1/useDemoClock';
import { writing, writingAt, WRITING_LENGTH } from './approvedWritingModel';

const APPROVED = require('../../../assets/onboarding/screen2/buddy/buddy_note_approved.webp');
const PEN_REPAIR = Skia.Path.MakeFromSVGString(writing.penRepairPath)!;
const PAW = Skia.Path.MakeFromSVGString(writing.pawPath)!;
const EYES = Skia.Path.Make(); writing.eyeRects.forEach(rect => EYES.addOval(rect));
const CARD = Skia.Path.Make();
writing.card.forEach(([x,y], i) => i ? CARD.lineTo(x,y) : CARD.moveTo(x,y)); CARD.close();
const INK = Skia.Path.Make();
writing.strokes[0].forEach(([x,y], i) => i ? INK.lineTo(x,y) : INK.moveTo(x,y));

/** Approved bitmap is used everywhere except the requested eye/hand patches. */
export function ApprovedWritingArtwork({ body, repair, penless, pen, distance, pulse, lookingDown }: {
  body: SkImage; repair: SkImage; penless: SkImage; pen: SkImage;
  distance: SharedValue<number>; pulse: SharedValue<number>; lookingDown: boolean;
}) {
  const state = useDerivedValue(() => writingAt(distance.value));
  const end = useDerivedValue(() => state.value.end);
  const penTransform = useDerivedValue(() => [
    { translateX: state.value.x }, { translateY: state.value.y },
    { rotate: writing.penAngle - pulse.value * 0.025 },
  ]);
  const pawTransform = useDerivedValue(() => [
    { translateX: state.value.pawX }, { translateY: state.value.pawY + pulse.value * 0.55 },
    { rotate: pulse.value * 0.018 },
  ]);
  const penWidth = writing.penHeight * writing.penAspect;
  return <>
    {lookingDown ? <>
      <Group clip={PAW} invertClip>
        <Image image={body} x={0} y={0} width={160} height={159} fit="contain" />
      </Group>
      <Group clip={PAW}>
        <Image image={repair} x={0} y={0} width={160} height={159} fit="contain" />
      </Group>
      <Mask mask={<Path path={PEN_REPAIR} color="white"><BlurMask blur={0.65} style="normal" /></Path>}>
        <Image image={repair} x={0} y={0} width={160} height={159} fit="contain" />
      </Mask>
      <Mask mask={<Path path={EYES} color="white"><BlurMask blur={0.15} style="normal" /></Path>}>
        <Image image={repair} x={0} y={0} width={160} height={159} fit="contain" />
      </Mask>
    </> : <Image image={body} x={0} y={0} width={160} height={159} fit="contain" />}
    <Group clip={CARD}>
      <Path path={INK} start={0} end={end} style="stroke" color={writing.ink}
        strokeWidth={writing.strokeWidth} strokeCap="round" strokeJoin="round" />
    </Group>
    {lookingDown && <>
      <Group transform={penTransform}>
        <Image image={pen} x={-penWidth/2} y={-writing.penHeight} width={penWidth} height={writing.penHeight} fit="fill" />
      </Group>
      <Group transform={pawTransform} origin={{ x: writing.pawOrigin[0], y: writing.pawOrigin[1] }}>
        <Mask mask={<Path path={PAW} color="white"><BlurMask blur={0.5} style="normal" /></Path>}>
          <Image image={penless} x={0} y={0} width={160} height={159} fit="contain" />
        </Mask>
      </Group>
    </>}
  </>;
}

export function ApprovedWritingBuddy({ text, lookingDown, finished, label, style }: {
  text: string; lookingDown: boolean; finished: boolean; label: string; style: StyleProp<ViewStyle>;
}) {
  const body = useImage(APPROVED);
  const repair = useImage(require('../../../assets/onboarding/screen2/buddy/buddy_note_repair.webp'));
  const penless = useImage(require('../../../assets/onboarding/screen2/buddy/buddy_note_penless.webp'));
  const pen = useImage(require('../../../assets/onboarding/screen2/buddy/buddy_note_pen.webp'));
  const reduced = useReducedMotion();
  const distance = useSharedValue(0); const pulse = useSharedValue(0);
  const previous = useRef(text); const target = useRef(0);
  const [size,setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const old = previous.current; previous.current = text;
    if (old === text) return;
    cancelAnimation(pulse); pulse.set(0);
    if (!text.length) { cancelAnimation(distance); target.current=0; distance.set(0); return; }
    if (text.length < old.length) { cancelAnimation(distance); return; }
    target.current += (WRITING_LENGTH-target.current)*writing.progressPerEdit;
    if (reduced || finished || !lookingDown) { distance.set(target.current); return; }
    distance.set(withTiming(target.current,{duration:writing.durationMs,easing:Easing.inOut(Easing.quad)}));
    pulse.set(withSequence(withTiming(1,{duration:90}),withTiming(0,{duration:150})));
  }, [text, reduced, finished, lookingDown, distance, pulse]);

  useEffect(() => {
    if (!lookingDown || finished || reduced) {
      cancelAnimation(distance); cancelAnimation(pulse); pulse.set(0);
      if (reduced) distance.set(target.current);
    }
  }, [lookingDown, finished, reduced, distance, pulse]);

  useEffect(() => {
    const sub=AppState.addEventListener('change', value => {
      if (value !== 'active') { cancelAnimation(distance); cancelAnimation(pulse); pulse.set(0); }
    });
    return () => { sub.remove(); cancelAnimation(distance); cancelAnimation(pulse); };
  }, [distance,pulse]);

  const scale=Math.min(size.width/160,size.height/159);
  return <View style={style} accessible accessibilityLabel={label}
    onLayout={event=>setSize({width:event.nativeEvent.layout.width,height:event.nativeEvent.layout.height})}>
    {!body || !repair || !penless || !pen ? <NativeImage source={APPROVED} resizeMode="contain" style={{width:'100%',height:'100%'}} /> :
      <Canvas style={{width:size.width,height:size.height}} pointerEvents="none">
        <Group transform={[{translateX:(size.width-160*scale)/2},{translateY:(size.height-159*scale)/2},{scale}]}>
          <ApprovedWritingArtwork body={body} repair={repair} penless={penless} pen={pen}
            distance={distance} pulse={pulse} lookingDown={lookingDown} />
        </Group>
      </Canvas>}
  </View>;
}
