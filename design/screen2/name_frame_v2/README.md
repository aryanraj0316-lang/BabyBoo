# Name-entry frame — one replacement candidate

2026-11-08, Asia/Calcutta. User rejected the existing name-entry Buddy as inconsistent and asked to regenerate that frame only. One built-in image_gen call, using the original buddy_master.png as the edit/identity reference and the approved greeting as a supporting reference. No additional generations or app integration.

Observed issue in the rejected frame: tall forehead, smaller-looking eyes, small smile and high clasped paws made the switch from the greeting feel like a different character. The prompt asks to preserve the master's face/head proportions, cheerful D smile, lavender/pink plush and lighting, lowering the paws with only a slight downward gaze. Full prompt/references are saved in generation.json.

Untouched generated original: `design/buddy/generated/buddy_screen2_name_attentive_v2-original.png`. Tool source: `C:/Users/LENOVO/.codex/generated_images/01a1a111-e0bd-7762-9b0f-cbe52b5637dd/exec-44e61bd2-d99a-4a15-a3b6-f337fa9a0ee0.png`.

Prepared candidate siblings are here at @2x/@3x WebP, using the same 160×159pt canvas, estimated106pt head width and155pt baseline. Existing measurement/premultiplied resampling reused; no character painting, warping or recolouring. Visible alpha bounds fit inside the canvas. Both light/dark comparison rows were visually inspected at identical scale.

Assessment: the new candidate has a less dominant forehead, larger-looking eyes, wider D smile and lower paws, improving facial warmth and continuity with the greeting. It remains more frontal and slightly paler than that greeting; downward gaze is subtle. These differences are disclosed rather than claimed as an exact identity match. No obvious opaque rectangle, clipped ears/paws or white edge halo at the reviewed comparison scale.

`comparison.png`: approved greeting / rejected name frame / new candidate, on warm-white and dark surfaces. `manifest.json` records source hash, dimensions and alpha bounds. `tools/screen2/review_name_frame_v2.py` prepares this comparison without touching production assets.

No source code, Screen 1, other mascot frames or live app assets changed. No native build or phone capture needed/claimed for this asset-only candidate. Earlier Screen 2 device-verification blocker remains pending separately.

STOPPED for user approval before replacing the name-entry frame in the app. No second attempt or unrelated work started.
