import { describe, expect, it } from 'vitest';
import { writing, writingAt, WRITING_LENGTH } from './approvedWritingModel';

function endpoint(fraction: number) {
  const points=writing.strokes[0];
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let remaining=lengths.reduce((a,b)=>a+b,0)*fraction;
  for(let i=0;i<lengths.length;i++) {
    if(remaining<=lengths[i] || i===lengths.length-1) {
      const f=Math.min(1,remaining/lengths[i]);
      return [points[i][0]+(points[i+1][0]-points[i][0])*f,points[i][1]+(points[i+1][1]-points[i][1])*f];
    }
    remaining-=lengths[i];
  }
  return points[0];
}
describe('approved-pose writing',()=>{
  it('keeps the visible ink endpoint exactly under the nib during every stroke',()=>{
    for(let i=0;i<=2000;i++) {
      const state=writingAt(WRITING_LENGTH*i/2000),tip=endpoint(state.end);
      expect(state.x).toBeCloseTo(tip[0],5);expect(state.y).toBeCloseTo(tip[1],5);
    }
  });
  it('reveals only one continuous line monotonically and clamps reset/end',()=>{
    expect(writing.strokes).toHaveLength(1);expect(writingAt(-1).end).toBe(0);
    expect(writingAt(WRITING_LENGTH+1).end).toBe(1);
    let last=0;
    for(let i=0;i<=1000;i++) {
      const {end}=writingAt(WRITING_LENGTH*i/1000);
      expect(end).toBeGreaterThanOrEqual(last);expect(end).toBeLessThanOrEqual(1);last=end;
    }
  });
  it('keeps all ink inside the approved card surface',()=>{
    for(const [x,y] of writing.strokes[0]) {
      const crosses=writing.card.map((a,i)=>{
        const b=writing.card[(i+1)%writing.card.length];return (b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);
      });
      expect(crosses.every(v=>v>=0)||crosses.every(v=>v<=0)).toBe(true);
    }
  });
});
