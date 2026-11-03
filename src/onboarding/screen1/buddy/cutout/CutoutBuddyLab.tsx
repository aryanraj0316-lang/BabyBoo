import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Picture, Skia, useImage } from '@shopify/react-native-skia';
import { CUTOUT, DIAGNOSTICS, MASTER_POSE, NEUTRAL, type CutoutPose } from './model';
import { drawCutout } from './drawCutout';

function Preview({ images, pose, size, headOnly=false }: {images:Record<string,any>;pose:CutoutPose;size:number;headOnly?:boolean}) {
  const picture=useMemo(()=>{
    const recorder=Skia.PictureRecorder();const c=recorder.beginRecording(Skia.XYWHRect(0,0,size,size));
    c.clear(Skia.Color(CUTOUT.background));c.scale(size/1254,size/1254);
    if(Object.values(images).every(Boolean))drawCutout(c,{api:Skia,images},pose,headOnly);
    return recorder.finishRecordingAsPicture();
  },[images,pose,size,headOnly]);
  return <Canvas style={{width:size,height:size}}><Picture picture={picture}/></Canvas>;
}
export function CutoutBuddyLab({record=false,shot='master'}:{record?:boolean;shot?:string}) {
  const {width}=useWindowDimensions();
  const head_blank=useImage(require('../../../../../design/buddy/parts_review/cutouts/head_blank.png'));
  const torso=useImage(require('../../../../../design/buddy/parts_review/cutouts/torso.png'));
  const ear_viewer_left=useImage(require('../../../../../design/buddy/parts_review/cutouts/ear_viewer_left.png'));
  const ear_viewer_right=useImage(require('../../../../../design/buddy/parts_review/cutouts/ear_viewer_right.png'));
  const arm_viewer_left=useImage(require('../../../../../design/buddy/parts_review/cutouts/arm_viewer_left.png'));
  const arm_viewer_right=useImage(require('../../../../../design/buddy/parts_review/cutouts/arm_viewer_right.png'));
  const foot_viewer_left=useImage(require('../../../../../design/buddy/parts_review/cutouts/foot_viewer_left.png'));
  const foot_viewer_right=useImage(require('../../../../../design/buddy/parts_review/cutouts/foot_viewer_right.png'));
  const eye_left=useImage(require('../../../../../design/buddy/assembly_review/face/eye_left.png'));
  const eye_right=useImage(require('../../../../../design/buddy/assembly_review/face/eye_right.png'));
  const mouth_happy=useImage(require('../../../../../design/buddy/assembly_review/face/mouth_happy.png'));
  const blush_left=useImage(require('../../../../../design/buddy/assembly_review/face/blush_left.png'));
  const blush_right=useImage(require('../../../../../design/buddy/assembly_review/face/blush_right.png'));
  const head_surface=useImage(require('../../../../../design/buddy/assembly_review/face/head_surface.png'));
  const images=useMemo(()=>({head_blank,torso,ear_viewer_left,ear_viewer_right,arm_viewer_left,arm_viewer_right,foot_viewer_left,foot_viewer_right,eye_left,eye_right,mouth_happy,blush_left,blush_right,head_surface}),[head_blank,torso,ear_viewer_left,ear_viewer_right,arm_viewer_left,arm_viewer_right,foot_viewer_left,foot_viewer_right,eye_left,eye_right,mouth_happy,blush_left,blush_right,head_surface]);
  const [selected,setSelected]=useState(-1);
  const [reviewFrame,setReviewFrame]=useState(0);
  useEffect(()=>{
    if(!record||shot!=='review')return;
    setReviewFrame(0);
    const timer=setInterval(()=>setReviewFrame(f=>(f+1)%12),1600);
    return ()=>clearInterval(timer);
  },[record,shot]);
  const shotIndex=Number(shot);
  const pose=record?(shot==='review'?(reviewFrame===0?MASTER_POSE:reviewFrame===1?NEUTRAL:DIAGNOSTICS[reviewFrame-2].pose):shot==='neutral'?NEUTRAL:Number.isFinite(shotIndex)?DIAGNOSTICS[Math.max(0,Math.min(9,shotIndex))].pose:MASTER_POSE):(selected===-2?NEUTRAL:selected>=0?DIAGNOSTICS[selected].pose:MASTER_POSE);
  return <ScrollView style={styles.root} contentContainerStyle={{paddingTop:38,paddingBottom:40}}>
    {record&&<View style={{alignItems:"center"}}><Preview images={images} pose={pose} size={200}/></View>}<Preview images={images} pose={pose} size={width}/>
    {!record&&<>
      <Text style={styles.title}>Buddy Lab / rendered cut-out assembly</Text>
      <View style={styles.row}><Pressable style={styles.button} onPress={()=>setSelected(-1)}><Text>Master pose</Text></Pressable><Pressable style={styles.button} onPress={()=>setSelected(-2)}><Text>Both arms resting</Text></Pressable></View>
      <Text style={styles.title}>Head surface test strip</Text>
      <ScrollView horizontal>{DIAGNOSTICS.map((d,i)=><Pressable key={d.label} onPress={()=>setSelected(i)}><Preview images={images} pose={d.pose} size={180} headOnly/><Text style={styles.label}>{d.label}</Text></Pressable>)}</ScrollView>
      <Text style={styles.title}>3/4 reference and projected face</Text>
      <View style={styles.row}><Image source={require('../../../../../design/buddy/assembly_review/reference_three_quarter.png')} style={{width:width/2,height:width/2}} resizeMode="contain"/><Preview images={images} pose={DIAGNOSTICS[1].pose} size={width/2} headOnly/></View>
    </>}
  </ScrollView>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:CUTOUT.background},title:{fontSize:16,fontWeight:'600',padding:14,color:'#241C36'},row:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center'},button:{padding:12,margin:6,backgroundColor:'#DDD3FF',borderRadius:10},label:{textAlign:'center',fontSize:13,color:'#241C36',paddingBottom:12}});
