/**
 * Dev-only route for the Screen 1 Animation Studio.
 * Available when __DEV__ is true, or after tapping the Screen 1 tag seven
 * times (which sets the unlock flag below).
 */
import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { HeroStudioScreen } from '../../src/onboarding/hero/studio/HeroStudioScreen';
import { HERO_STUDIO_UNLOCK_KEY } from '../../src/onboarding/hero/studio/unlock';
import { heroGetItem } from '../../src/onboarding/hero/storage';

export default function HeroStudioRoute() {
  const [allowed, setAllowed] = useState<boolean | null>(__DEV__ ? true : null);
  useEffect(() => {
    if (__DEV__) return;
    heroGetItem(HERO_STUDIO_UNLOCK_KEY)
      .then((v: string | null) => setAllowed(v === '1'))
      .catch(() => setAllowed(false));
  }, []);
  if (allowed === null) return <View style={{ flex: 1, backgroundColor: '#FAF8F5' }} />;
  if (!allowed) return <Redirect href="/" />;
  return <HeroStudioScreen />;
}
