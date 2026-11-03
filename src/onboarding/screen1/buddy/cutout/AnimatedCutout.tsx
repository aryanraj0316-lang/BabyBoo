import React, { useEffect } from 'react';
import { AccessibilityInfo, AppState, LogBox } from 'react-native';
import { Canvas, Group, Picture, Skia } from '@shopify/react-native-skia';
import { runOnJS, useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { CUTOUT } from './model';
import { drawCutout, type TextureSet } from './drawCutout';
import { MOTION, motionPose } from './motion';

function logMetrics(frames:number,elapsed:number,slow:number) {
  console.info('BUDDY_MOTION_METRICS '+JSON.stringify({frames,elapsedMs:elapsed,meanFps:1000*frames/elapsed,framesOver25ms:slow}));
}

export function AnimatedCutout({images,width,record}:{images:TextureSet;width:number;record:boolean}) {
  const ready=Object.values(images).every(Boolean);
  const elapsed=useSharedValue(0),active=useSharedValue(AppState.currentState==='active'),reduced=useSharedValue(true);
  const stats=useSharedValue({frames:0,elapsed:0,slow:0});
  useEffect(()=>{
    AccessibilityInfo.isReduceMotionEnabled().then(value=>{reduced.value=value;});
    const reduce=AccessibilityInfo.addEventListener('reduceMotionChanged',value=>{reduced.value=value;});
    const state=AppState.addEventListener('change',value=>{active.value=value==='active';});
    if(record)LogBox.ignoreAllLogs(true);
    return ()=>{reduce.remove();state.remove();if(record)LogBox.ignoreAllLogs(false);};
  },[active,reduced,record]);
  useFrameCallback(info=>{
    'worklet';
    if(!ready||!active.value||reduced.value)return;
    const dt=info.timeSincePreviousFrame??0;
    // Skip a suspended-app gap; otherwise keep real elapsed time, including slow frames.
    if(dt<250)elapsed.value+=dt;
    const s=stats.value;
    if(elapsed.value>3000) {
      const next={frames:s.frames+1,elapsed:s.elapsed+dt,slow:s.slow+(dt>25?1:0)};
      if(next.elapsed>=MOTION.duration*1000){runOnJS(logMetrics)(next.frames,next.elapsed,next.slow);stats.value={frames:0,elapsed:0,slow:0};}
      else stats.value=next;
    }
  });
  const picture=useDerivedValue(()=>{
    const recorder=Skia.PictureRecorder(),canvas=recorder.beginRecording(Skia.XYWHRect(0,0,CUTOUT.stage.size,CUTOUT.stage.size));
    if(ready)drawCutout(canvas,{api:Skia,images},motionPose(reduced.value?0:elapsed.value/1000));
    const result=recorder.finishRecordingAsPicture();recorder.dispose();return result;
  },[images,ready]);
  const {size,small,gap}=CUTOUT.stage;
  return <Canvas style={{width,height:width+small+gap,backgroundColor:CUTOUT.background}}>
    <Group transform={[{translateX:(width-small)/2},{scale:small/size}]}><Picture picture={picture}/></Group>
    <Group transform={[{translateY:small+gap},{scale:width/size}]}><Picture picture={picture}/></Group>
  </Canvas>;
}
