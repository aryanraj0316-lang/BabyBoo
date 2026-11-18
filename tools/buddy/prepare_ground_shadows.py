"""Contact/penumbra masks from existing alpha. Buddy artwork is never edited."""
from pathlib import Path
import re,json
import numpy as np
import cv2
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];SRC=ROOT/'src/onboarding/screen1'
OUT=ROOT/'assets/onboarding/screen1/buddy/shadows';OUT.mkdir(exist_ok=True)
TOP=280;HEIGHT=64;W=320
ids=re.findall(r'^  (\w+): \{ x0:',(SRC/'buddyMetrics.generated.ts').read_text(),re.M)
s=(SRC/'buddyClips.generated.ts').read_text();lookup=json.loads(re.search(r'CLIP_FRAME_INDEX: readonly number\[\] = (\[.*\]);',s).group(1))
sourceTimes={'watch_34_left':0,'worried_wavy':4.3,'worried_paws':7,'yawn':9,'sleepy':11,'surprised':13.5,'point_left':15.2}
atlases={};registry={'stills':[],'clips':[]};details=[]
def shadow(im):
    a=np.asarray(im.convert('RGBA'))[:,:,3];h,w=a.shape
    if (w,h)!=(320,318):a=cv2.resize(a,(320,318),interpolation=cv2.INTER_AREA)
    yy,xx=np.mgrid[TOP:TOP+HEIGHT,0:W];seeds=[];soles=[]
    for left,right in [(0,160),(160,320)]:
        mask=a[220:,left:right]>32;ys,xs=np.where(mask);bottom=int(ys.max())+220
        seed=np.zeros((HEIGHT,W),np.float32)
        for x in range(left,right):
            ys=np.where(a[220:,x]>32)[0]
            if not len(ys):continue
            y=int(ys.max())+220
            weight=np.exp(-((bottom-y)/4)**2/2)
            if TOP<=y<TOP+HEIGHT:seed[y-TOP,x]=weight
        seeds.append(seed);soles.append(bottom)
    seed=np.maximum(seeds[0],seeds[1])
    near=cv2.GaussianBlur(seed,(0,0),2.2,1.15)
    if near.max():near=near/near.max()*.21
    penumbra=cv2.GaussianBlur(seed,(0,0),12,3.2)
    if penumbra.max():penumbra=penumbra/penumbra.max()*.095
    ambient=.055*np.exp(-(((xx-160)/92)**2+((yy-max(soles)+2)/7)**2)/2)
    alpha=1-(1-near)*(1-penumbra)*(1-ambient)
    alpha=np.rint(np.clip(alpha,0,1)*255).astype(np.uint8)
    rgba=np.zeros((HEIGHT,W,4),np.uint8);rgba[:,:,:3]=(38,44,36);rgba[:,:,3]=alpha
    return Image.fromarray(rgba),soles
for name in ids:
    im=Image.open(ROOT/f'assets/onboarding/screen1/buddy/buddy_{name}@2x.webp')
    mask,soles=shadow(im);filename=f'still-{name}.webp';mask.save(OUT/filename,'WEBP',lossless=True,method=4)
    registry['stills'].append(filename)
    if name in sourceTimes:
        k=lookup[int(sourceTimes[name]*24)];n=k//36;slot=k%36
        if n not in atlases:atlases[n]=Image.open(ROOT/f'assets/onboarding/screen1/buddy/clips/buddy-clip-atlas-{n:02d}.webp').convert('RGBA')
        x=slot%6*324+2;y=slot//6*322+2;im=atlases[n].crop((x,y,x+320,y+318));mask,soles=shadow(im)
        filename=f'clip-{name}.webp';mask.save(OUT/filename,'WEBP',lossless=True,method=4)
    registry['clips'].append(filename);details.append({'id':name,'soles':soles})
def requires(names):return ',\n'.join("  require('../../../assets/onboarding/screen1/buddy/shadows/"+n+"')" for n in names)
(SRC/'buddyGroundAssets.generated.ts').write_text('// Generated alpha-only ground contacts; original Buddy images unchanged.\n'
    +f'export const GROUND_TOP_PT = {TOP/2};\nexport const GROUND_HEIGHT_PT = {HEIGHT/2};\n'
    +'export const STILL_GROUND = [\n'+requires(registry['stills'])+'\n] as const;\n'
    +'export const CLIP_GROUND = [\n'+requires(registry['clips'])+'\n] as const;\n',encoding='utf-8')
(ROOT/'design/screen1/gemini_review/integration/ground-shadow-masks.json').write_text(json.dumps({'method':'actual sole contour + tight contact + wider penumbra + low-opacity ambient','originalArtworkChanged':False,'details':details},indent=2),encoding='utf-8')
print('Prepared17smallground-onlymasks; original mascot pixels unchanged.')
