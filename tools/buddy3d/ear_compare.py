"""Produce the two comparison deliverables from the unmodified source."""
from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[2]
out=root/'design/buddy3d/ear_spike';out.mkdir(parents=True,exist_ok=True)
# Exact source crop, no retouching. Lower right includes the original head overlap.
crop=Image.open(root/'design/buddy/buddy_master.png').convert('RGB').crop((245,160,555,470))
crop.save(out/'original_ear_crop.png')
preview=Image.open(out/'ear_preview.png').convert('RGB')
board=Image.new('RGB',(750,416),'#FCFAF3');draw=ImageDraw.Draw(board)
draw.text((14,10),'ORIGINAL (head hides lower right)',fill='#302244')
draw.text((389,10),'BLENDER EAR ONLY - 16 samples',fill='#302244')
board.paste(crop.resize((360,360),Image.Resampling.LANCZOS),(8,38))
board.paste(preview,(382,38))
board.save(out/'side_by_side.png')
print('Three images saved:',out)
