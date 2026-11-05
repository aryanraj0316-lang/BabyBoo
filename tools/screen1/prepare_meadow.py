"""Optimize the generated background without changing its artwork."""
from pathlib import Path
import hashlib,json
from PIL import Image

root=Path(__file__).resolve().parents[2]
source=root/'design/screen1/meadow/meadow-breeze-original.png'
target=root/'assets/onboarding/screen1/meadow-background.webp'
im=Image.open(source).convert('RGB')
im.save(target,quality=95,method=6)
report={'source':source.relative_to(root).as_posix(),'asset':target.relative_to(root).as_posix(),'dimensions':im.size,'bytes':target.stat().st_size,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'operation':'WebP export only; no retouching or artwork changes'}
(source.parent/'asset.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
hand=Image.open(root/'design/screen1/meadow/toddler-hand-original.png').convert('RGBA')
hist=hand.getchannel('A').histogram()
assert hist[0]>0, 'Gesture asset must have actual transparency'
hand.thumbnail((512,768),Image.Resampling.LANCZOS)
hand.save(root/'assets/onboarding/screen1/swipe-hand.webp',lossless=True,method=6)
print(json.dumps({'hand_size':hand.size,'transparent_pixels_original':hist[0],'opaque_pixels_original':hist[255]}))
twig=Image.open(root/'design/screen1/meadow/twig-original.png').convert('RGBA')
assert twig.getchannel('A').histogram()[0]>0
twig.thumbnail((512,512),Image.Resampling.LANCZOS)
twig.save(root/'assets/onboarding/screen1/meadow-twig.webp',lossless=True,method=6)
preview=Image.new('RGBA',(1024,768),'#F7FBE8')
preview.alpha_composite(hand,(0,0));preview.alpha_composite(twig,(512,128))
preview.convert('RGB').save(root/'design/screen1/meadow/transparent-assets-review.jpg',quality=93)
parent=Image.open(root/'design/screen1/meadow/parent-hand-original.png').convert('RGBA')
assert parent.getchannel('A').histogram()[0]>0
parent.thumbnail((512,768),Image.Resampling.LANCZOS)
parent.save(root/'assets/onboarding/screen1/parent-hand.webp',lossless=True,method=6)
