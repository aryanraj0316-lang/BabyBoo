import { describe, expect, it } from 'vitest';
import { CUTOUT, NEUTRAL, projectSurface, raisedWeight } from './model';
describe('Buddy face surface',()=>{
  it('preserves authored master coordinates at rest',()=>{
    for(const f of CUTOUT.features){const x=f.x+f.w/2,y=f.y+f.h/2,p=projectSurface(x,y,NEUTRAL);expect(p.x).toBeCloseTo(x,8);expect(p.y).toBeCloseTo(y,8);}
  });
  it('foreshortens a quad non-uniformly when turning',()=>{
    const p={...NEUTRAL,turn:-.5};const f=CUTOUT.features[0];
    const a=projectSurface(f.x,f.y,p),b=projectSurface(f.x+f.w,f.y,p),c=projectSurface(f.x,f.y+f.h,p),d=projectSurface(f.x+f.w,f.y+f.h,p);
    expect(Math.abs((b.x-a.x)-(d.x-c.x))).toBeGreaterThan(.005);
  });
  it('carries the face through nod, roll and squash',()=>{
    const f=CUTOUT.features[0],x=f.x+f.w/2,y=f.y+f.h/2;
    expect(projectSurface(x,y,{...NEUTRAL,nod:1}).y).toBeGreaterThan(y);
    expect(projectSurface(x,y,{...NEUTRAL,nod:-1}).y).toBeLessThan(y);
    const s=projectSurface(x,y,{...NEUTRAL,squash:.88});expect(s.y).toBeCloseTo(y*.88,8);expect(s.x).toBeCloseTo(x/Math.sqrt(.88),8);
    const r=projectSurface(x,y,{...NEUTRAL,roll:Math.PI/2});expect(r.x).toBeCloseTo(-y,8);expect(r.y).toBeCloseTo(x,8);
  });
  it('keeps the shoulder-height artwork blend continuous',()=>{
    expect(raisedWeight(0)).toBe(0);expect(raisedWeight(1)).toBe(1);
    let previous=0;for(let i=0;i<=100;i++){const a=raisedWeight(i/100);expect(a).toBeGreaterThanOrEqual(previous);expect(a-previous).toBeLessThan(.1);previous=a;}
  });
});
