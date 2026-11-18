"""Small video-matting proof. Processes source frames; generates no character art."""
from pathlib import Path
import cv2
import numpy as np
import subprocess
import json
import hashlib

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'design/screen1/gemini_review/clip03/gemini_clip03_yawn_sleep_original.mp4'
OUT = ROOT / 'design/screen1/gemini_review/clip03/key_test'
OUT.mkdir(parents=True, exist_ok=True)
cap = cv2.VideoCapture(str(SOURCE))
fps = cap.get(cv2.CAP_PROP_FPS)
width, height = int(cap.get(3)), int(cap.get(4))
first, last = round(fps), round(5 * fps)
font = cv2.FONT_HERSHEY_SIMPLEX

def encoder(path, args, log_name, size):
    log = (OUT / log_name).open('w')
    proc = subprocess.Popen(['ffmpeg', '-hide_banner', '-loglevel', 'warning', '-y',
        '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', size, '-r', str(fps), '-i', '-',
        '-an', *args, str(path)], stdin=subprocess.PIPE, stderr=log)
    return proc, log

alpha_proc, alpha_log = encoder(OUT / 'buddy_alpha_proof.mov',
    ['-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le',
     '-alpha_bits', '16', '-threads', '2'], 'alpha_encode.log', f'{width}x{height}')
preview_proc, preview_log = encoder(OUT / 'light_dark_preview.mp4',
    ['-c:v', 'libx264', '-crf', '17', '-preset', 'fast', '-pix_fmt', 'yuv420p',
     '-threads', '2', '-movflags', '+faststart'], 'preview_encode.log', '1280x720')
records = []
selected = []
frame_id = 0
while True:
    ok, bgr = cap.read()
    if not ok or frame_id >= last:
        break
    if frame_id < first:
        frame_id += 1
        continue
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    f = rgb.astype(np.float32)
    difference = f[:, :, 1] - np.maximum(f[:, :, 0], f[:, :, 2])
    # Lavender/pink seed excludes green decorations and the green floor shadow.
    seed = ((difference < -12) & (f[:, :, 2] > 70)).astype(np.uint8)
    contours, _ = cv2.findContours(seed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour = max(contours, key=cv2.contourArea)
    body = np.zeros(seed.shape, np.uint8)
    cv2.drawContours(body, [contour], -1, 255, cv2.FILLED)
    interior = cv2.erode(body, np.ones((5, 5), np.uint8)) > 0
    vicinity = cv2.dilate(body, np.ones((11, 11), np.uint8)) > 0
    a = np.clip((18 - difference) / 40, 0, 1)
    a[~vicinity] = 0
    a[interior] = 1  # Protect eyes, mouth and all opaque artwork inside the silhouette.
    key_pixels = (difference > 70) & (~vicinity)
    background = np.median(f[key_pixels], axis=0)
    corrected = f.copy()
    edge = (a > 0.01) & (a < 1)
    corrected[edge] = np.clip((f[edge] - (1-a[edge, None])*background) / a[edge, None], 0, 255)
    corrected[a == 0] = 0
    rgba = np.dstack((np.rint(corrected).astype(np.uint8), np.rint(a*255).astype(np.uint8)))
    assert np.array_equal(rgba[:, :, :3][interior], rgb[interior])
    assert not np.any(rgba[:, :, 3][~vicinity])
    alpha_proc.stdin.write(rgba.tobytes())
    # Fixed crop for this proof only; no pose-dependent reframing or app registration.
    crop = rgba[40:700, 360:960]
    ca = crop[:, :, 3].astype(np.float32) / 255
    premul = crop[:, :, :3].astype(np.float32) * ca[:, :, None]
    premul = cv2.resize(premul, (545, 600), interpolation=cv2.INTER_AREA)
    ca = cv2.resize(ca, (545, 600), interpolation=cv2.INTER_AREA)
    panels = []
    for color, label in [((246, 243, 255), 'LIGHT'), ((26, 26, 30), 'DARK')]:
        panel = np.full((720, 640, 3), color, np.uint8)
        panel[90:690, 47:592] = np.rint(np.clip(premul + (1-ca[:, :, None])*np.array(color), 0, 255)).astype(np.uint8)
        ink = (47, 41, 57) if label == 'LIGHT' else (244, 240, 255)
        cv2.putText(panel, label+' / source '+f'{frame_id/fps:.2f}s', (25, 40), font, .7, ink, 1, cv2.LINE_AA)
        panels.append(panel)
    preview = np.concatenate(panels, axis=1)
    preview_proc.stdin.write(np.dstack((preview, np.full((720,1280),255,np.uint8))).tobytes())
    if frame_id in [24, 36, 48, 60, 72, 96, 114]:
        stem = f'{frame_id/fps:05.2f}'
        cv2.imwrite(str(OUT / f'alpha-{stem}.png'), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
        cv2.imwrite(str(OUT / f'comparison-{stem}.png'), cv2.cvtColor(preview, cv2.COLOR_RGB2BGR))
        selected.append((frame_id/fps, preview.copy()))
    records.append({'sourceFrame': frame_id, 'sourceTime': frame_id/fps,
        'opaquePixels': int(np.count_nonzero(a == 1)), 'softEdgePixels': int(np.count_nonzero(edge)),
        'exteriorAlphaPixels': 0, 'opaqueInteriorRgbIdentical': True})
    frame_id += 1
cap.release()
for proc, log in [(alpha_proc, alpha_log), (preview_proc, preview_log)]:
    proc.stdin.close()
    assert proc.wait() == 0, 'See encoder log'
    log.close()
sheet = np.full((((len(selected)+1)//2)*360, 1280, 3), (246,243,255), np.uint8)
for i, (_, preview) in enumerate(selected):
    x, y = (i % 2)*640, (i // 2)*360
    sheet[y:y+360, x:x+640] = cv2.resize(preview, (640,360), interpolation=cv2.INTER_AREA)
cv2.imwrite(str(OUT/'contact_sheet.png'), cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR))
(OUT/'checks.json').write_text(json.dumps({'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'sourceIntervalSeconds': [1,5], 'fps': fps, 'framesProcessed': len(records),
    'method': 'green dominance matte, largest lavender silhouette, filled opaque interior, edge-only screen unmix',
    'fixedPreviewSourceCrop': [360,40,960,700], 'frames': records}, indent=2), encoding='utf-8')
print(json.dumps({'frames': len(records), 'out': str(OUT), 'checks': 'interior RGB and disconnected exterior assertions passed'}))
