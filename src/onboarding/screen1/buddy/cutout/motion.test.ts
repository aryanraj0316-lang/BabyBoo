import { describe, expect, it } from 'vitest';
import { CUTOUT, NEUTRAL, yawForTurn, projectSurface } from './model';
import { motionPose, MOTION } from './motion';

describe('bounded cutout animation',()=>{
  it('never exceeds the measured three-quarter yaw, even with oversized input',()=>{
    expect(yawForTurn(-1)).toBe(yawForTurn(-.5));
    expect(yawForTurn(20)).toBe(yawForTurn(.5));
    expect(Math.abs(yawForTurn(-.5))).toBeCloseTo(Math.abs(CUTOUT.yawThreeQuarter),10);
  });
  it('keeps every visible eye contour facing the camera through turn and nod limits',()=>{
    // Contour fits exclude each texture transparent margin.
    for(const turn of [-1,1])for(const nod of [-1,0,1])for(const eye of CUTOUT.features.filter(f=>f.name.startsWith('eye'))){
      for(let i=0;i<64;i++){
        const a=i*Math.PI*2/64,x=eye.x+eye.w*(.5+.365*Math.cos(a)),y=eye.y+eye.h*(.5+.39*Math.sin(a));
        expect(projectSurface(x,y,{...NEUTRAL,turn,nod}).facing).toBeGreaterThan(.06);
      }
    }
  });
  it('has one hop and keeps the approved tilt and turn bounds for a whole loop',()=>{
    let hops=0,airborne=false;
    for(let t=0;t<MOTION.duration;t+=1/120){const p=motionPose(t);
      expect(Math.abs(p.turn)).toBeLessThanOrEqual(.5);
      expect(Math.abs(p.roll)).toBeLessThanOrEqual(8*Math.PI/180+1e-8);
      expect(p.rootSquash??1).toBeGreaterThanOrEqual(.879);
      if((p.hop??0)>0&&!airborne)hops++;
      airborne=(p.hop??0)>0;
    }
    expect(hops).toBe(1);
    expect(motionPose(1.57).blink).toBeGreaterThan(.98);
    expect(motionPose(17.21).rootSquash).toBeCloseTo(.88,2);
  });
  it('keeps animation parameters continuous through its seam and event boundaries',()=>{
    const keys=['turn','nod','roll','squash','armL','blink','breath','earL','earR','elbowL','hop','rootSquash'] as const;
    for(let t=0;t<=20;t+=.01){const a=motionPose(t),b=motionPose(t+.0001);for(const k of keys)expect(Math.abs((a[k]??0)-(b[k]??0))).toBeLessThan(.08);}
    for(const k of keys)expect(Math.abs((motionPose(20-.0001)[k]??0)-(motionPose(0)[k]??0))).toBeLessThan(.001);
  });
});
