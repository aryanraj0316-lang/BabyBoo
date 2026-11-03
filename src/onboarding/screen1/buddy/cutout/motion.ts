import { NEUTRAL, type CutoutPose } from './model';

// All event timings and amplitudes belong to the lab, never screen 1's timeline.
export const MOTION = {
  duration: 20, breathPeriod: 2.5, breathScale: 0.022,
  blinks: [1.5, 4.9, 8.1, 13.9, 19.0], blinkDuration: 0.19,
  turn: [2, 3.2, 4, 5.3], nod: [5.5, 6.4, 7.2, 8],
  tilt: [8.2, 9.1, 10.1, 11], tiltRadians: 8 * Math.PI / 180,
  wave: [11.1, 12.2, 14.4, 15.5], elbowRadians: 0.42,
  hop: [16.1, 16.35, 17.05, 17.7], hopHeight: 114,
  jiggles: [3.2, 5.3, 6.4, 7.2, 9.1, 10.1, 12.2, 17.05],
  earRadians: 4.5 * Math.PI / 180, earDamping: 6.2, earFrequency: 17,
} as const;

export function smooth(a: number, b: number, t: number) {
  'worklet';
  const x=Math.max(0,Math.min(1,(t-a)/(b-a)));
  return x*x*(3-2*x);
}
function envelope(t:number, points: readonly number[]) {
  'worklet';
  return smooth(points[0],points[1],t)*(1-smooth(points[2],points[3],t));
}
export function motionPose(seconds: number): CutoutPose {
  'worklet';
  const t=((seconds%MOTION.duration)+MOTION.duration)%MOTION.duration;
  const pose:CutoutPose={...NEUTRAL};
  pose.breath=MOTION.breathScale*(0.5-0.5*Math.cos(t*Math.PI*2/MOTION.breathPeriod));
  pose.turn=-0.5*envelope(t,MOTION.turn);
  const n=MOTION.nod;
  pose.nod=-0.72*smooth(n[0],n[1],t)+1.44*smooth(n[1],n[2],t)-0.72*smooth(n[2],n[3],t);
  const tilt=MOTION.tilt;
  pose.roll=MOTION.tiltRadians*(-smooth(tilt[0],tilt[1],t)+2*smooth(tilt[1],tilt[2],t)-smooth(tilt[2],tilt[3],t));
  pose.turn+=0.25*envelope(t,[5.5,6,9.5,11]);
  pose.blink=0;
  for(const start of MOTION.blinks) {
    const p=(t-start)/MOTION.blinkDuration;
    if(p>=0&&p<1)pose.blink=Math.max(pose.blink,p<0.36?smooth(0,0.36,p):1-smooth(0.36,1,p));
  }
  const wave=envelope(t,MOTION.wave);
  pose.armL=wave;
  pose.elbowL=wave*MOTION.elbowRadians*Math.sin((t-MOTION.wave[1])*Math.PI*4/(MOTION.wave[2]-MOTION.wave[1]));
  const h=MOTION.hop;
  pose.rootSquash=1-0.07*envelope(t,[h[0],h[1]-.06,h[1]-.03,h[1]]);
  if(t>=h[1]&&t<h[2]) {
    const p=(t-h[1])/(h[2]-h[1]);
    pose.hop=MOTION.hopHeight*4*p*(1-p);
    pose.rootSquash+=0.045*Math.sin(p*Math.PI);
  }
  if(t>=h[2]&&t<h[3]) {
    const dt=t-h[2];
    // Continuous contact followed by one soft squash/rebound, then settling.
    pose.rootSquash-=0.12*Math.sin(Math.min(1,dt/.16)*Math.PI/2)*Math.exp(-Math.max(0,dt-.16)*8)*(1-smooth(h[2]+.4,h[3],t));
  }
  let jiggle=0;
  for(const event of MOTION.jiggles) {
    const dt=t-event;
    if(dt>=0&&dt<1.4)jiggle+=MOTION.earRadians*Math.exp(-MOTION.earDamping*dt)*Math.sin(MOTION.earFrequency*dt);
  }
  pose.earL=jiggle;pose.earR=-jiggle*.83;
  return pose;
}
