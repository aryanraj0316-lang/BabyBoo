"""Create portable source archive, without node_modules/browser/profile/runtime data."""
from pathlib import Path
import zipfile
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2];OUT=ROOT/'design/prebooking/cinematic';OUT.mkdir(parents=True,exist_ok=True)
target=OUT/'BabyBoo_Cinematic_Ad_Source.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in HERE.rglob('*'):
        if not p.is_file() or any(v in p.parts for v in ['node_modules','.browser-profile','output','__pycache__']):continue
        archive.write(p,p.relative_to(ROOT))
    for relative in ['public/buddy-idle-loop.webp','public/fonts/nunito-variable.ttf','public/fonts/Nunito-OFL.txt']:
        archive.write(ROOT/relative,relative)
    archive.writestr('START_HERE.txt','BabyBoo Cinematic Ad\nOpen tools/advertising/cinematic-ad/README.md.\nNode24+, ffmpeg, npm ci, npx playwright install chromium, node render.mjs.\nExisting extracted assets included. No account/credential/browser profile inside.\n')
print(target,target.stat().st_size)
