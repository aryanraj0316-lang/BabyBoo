/** Existing local reel footage inside the phone; never controls Buddy's clock. */
import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Asset } from 'expo-asset';
import { Image, useImage, useVideo } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Rect } from '../layout';
import type { SceneState } from '../timeline';

export const REEL_MEDIA = [
  { video: require('../../../../assets/onboarding/screen1/reels/01-husky.mp4'), poster: require('../../../../assets/onboarding/screen1/reels/01-husky.jpg') },
  { video: require('../../../../assets/onboarding/screen1/reels/02-waterfall.mp4'), poster: require('../../../../assets/onboarding/screen1/reels/02-waterfall.jpg') },
  { video: require('../../../../assets/onboarding/screen1/reels/03-palms.mp4'), poster: require('../../../../assets/onboarding/screen1/reels/03-palms.jpg') },
  { video: require('../../../../assets/onboarding/screen1/reels/04-hiker.mp4'), poster: require('../../../../assets/onboarding/screen1/reels/04-hiker.jpg') },
  { video: require('../../../../assets/onboarding/screen1/reels/05-gaming.mp4'), poster: require('../../../../assets/onboarding/screen1/reels/05-gaming.jpg') },
] as const;

/** Resolve bundled media to local files once; a failed clip retains its poster. */
export function useReelUris() {
  const [uris, setUris] = useState<(string | null)[]>([]);
  useEffect(() => {
    let alive = true;
    Promise.all(REEL_MEDIA.map(async ({ video }) => {
      try {
        const asset = await Asset.fromModule(video).downloadAsync();
        return asset.localUri ?? asset.uri;
      } catch { return null; }
    })).then((next) => { if (alive) setUris(next); });
    return () => { alive = false; };
  }, []);
  return uris;
}

function PlayingVideo({ uri, rect, position, state }: {
  uri: string; rect: Rect; position: number; state: SharedValue<SceneState>;
}) {
  const foreground = useSharedValue(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => { foreground.value = next === 'active'; });
    return () => sub.remove();
  }, [foreground]);
  const paused = useDerivedValue(() => !foreground.value || state.value.feedOpacity === 0 || Math.round(state.value.feedOffset) !== position);
  const { currentFrame } = useVideo(uri, { paused, looping: true, volume: 0 });
  return <Image image={currentFrame} {...rect} fit="cover" />;
}

export function VideoReel({ rect, index, uri, position, decode, state }: {
  rect: Rect; index: number; uri: string | null; position: number;
  decode: boolean; state: SharedValue<SceneState>;
}) {
  const poster = useImage(REEL_MEDIA[index].poster);
  return <>
    <Image image={poster} {...rect} fit="cover" />
    {decode && uri && <PlayingVideo uri={uri} rect={rect} position={position} state={state} />}
  </>;
}
