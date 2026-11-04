"""One-variable ear experiment: native-scale source, previous and new preview."""
from pathlib import Path
from PIL import Image,ImageDraw

root=Path(__file__).resolve().parents[2]
out=root/'design/buddy3d/ear_spike'
board=Image.new('RGB',(1128,416),'#FCFAF3')
draw=ImageDraw.Draw(board)
source=Image.open(root/'design/buddy/buddy_master.png').convert('RGB').crop((245,160,555,470))
# No enlargement of the reference: source ear ~265px across; Blender diameter
# is 2 model units * 360px / 2.72 camera units = 264.7px. Both renders use
# exactly the same camera and canvas. Original head overlap is preserved.
reference=Image.new('RGB',(360,360),'#FCFAF3');reference.paste(source,(25,25))
items=[('ORIGINAL / native source scale',reference),
       ('BEFORE / outer fur length .026',Image.open(out/'ear_preview.png').convert('RGB')),
       ('AFTER / outer fur length .060',Image.open(out/'ear_preview_length_v2.png').convert('RGB'))]
for i,(label,im) in enumerate(items):
    x=8+i*376;draw.text((x+4,10),label,fill='#302244');board.paste(im,(x,38))
board.save(out/'length_v2_comparison.png')
print('Saved',out/'length_v2_comparison.png')
