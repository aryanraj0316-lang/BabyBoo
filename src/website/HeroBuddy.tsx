import { useEffect, useState } from 'react';

export function HeroBuddy() {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setAnimate(!preference.matches);
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  if (!animate) return <img src="/buddy-seated-wave.webp" width="640" height="636" alt="Buddy, BabyBoo’s lavender plush mascot" fetchPriority="high" />;
  return <video className="site-buddy-video" autoPlay muted loop playsInline disablePictureInPicture disableRemotePlayback
    poster="/buddy-seated-wave.webp" width="640" height="636" aria-label="Buddy gently waving and blinking"
    onError={() => setAnimate(false)}><source src="/buddy-idle-loop.webm" type="video/webm" /></video>;
}
