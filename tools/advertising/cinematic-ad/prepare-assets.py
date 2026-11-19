"""Extract exact home-header pixels. No changes to original art/animation."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];ASSETS=HERE/'assets';(ASSETS/'frames').mkdir(parents=True,exist_ok=True)
source=ROOT/'public/buddy-idle-loop.webp';im=Image.open(source)
for pose in range(180):
    # 12distinct samples/sec from original24fps. Output30fps holds alternate2/3frames.
    im.seek(pose*2)
    im.convert('RGBA').save(ASSETS/'frames'/f'{pose:03d}.png',compress_level=2)
(ASSETS/'font.ttf').write_bytes((ROOT/'public/fonts/nunito-variable.ttf').read_bytes())
# No independent logo image exists: rasterize the actual homepage BabyBoo wordmark,
# using its self-hosted Nunito900 face, without the extra punctuation from the rejected ad.
f=ImageFont.truetype(str(ASSETS/'font.ttf'),180);f.set_variation_by_axes([900]);logo=Image.new('RGBA',(1000,260));d=ImageDraw.Draw(logo);b=d.textbbox((0,0),'BabyBoo',font=f);d.text(((1000-b[2])/2,15),'BabyBoo',font=f,fill='#FFF7EF');logo.save(ASSETS/'logo.png')
rng=np.random.default_rng(82716);grain=rng.integers(0,255,(192,192),dtype=np.uint8);Image.fromarray(grain).save(ASSETS/'grain.png')
(HERE/'asset-provenance.json').write_text(json.dumps({'mascot':str(source.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'originalFrames':im.n_frames,'originalSize':list(im.size),'sampledFrames':180,'fps':12,'frameSelection':'pose*2 from existing24fps header animation; no generated/yawn/arms-up frames','logo':'Exact homepage BabyBoo text wordmark rendered in its existing Nunito900; no standalone logo asset found','grainSeed':82716},indent=2))
print('Prepared180 exact header poses, homepage wordmark and deterministic grain.',flush=True)
