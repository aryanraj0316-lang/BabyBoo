/**
 * Buddy Lab route (dev only). In release builds __DEV__ is false, so the require below is
 * removed by Metro's constant folding and the Lab (and its reference images) never ship;
 * the route only redirects home.
 *
 *   adb shell am start -a android.intent.action.VIEW -d "babyboo://dev/buddy-lab?record=1"
 */
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

const Lab: React.ComponentType<{ record?: boolean }> | null = __DEV__
  ? require('../../src/onboarding/screen1/buddy/BuddyLab').BuddyLab
  : null;

const CutoutLab: React.ComponentType<{record?:boolean;shot?:string}> | null = __DEV__
  ? require('../../src/onboarding/screen1/buddy/cutout/CutoutBuddyLab').CutoutBuddyLab : null;

export default function BuddyLabRoute() {
  const { record, cutout, shot } = useLocalSearchParams<{ record?: string; cutout?: string; shot?: string }>();
  if (!Lab) return <Redirect href="/" />;
  if(cutout === '1' && CutoutLab) return <CutoutLab record={record === '1'} shot={shot}/>;
  return <Lab record={record === '1'} />;
}
