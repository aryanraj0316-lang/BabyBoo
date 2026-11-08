# Approved Screen 2 writing interaction

2026-11-08, Asia/Calcutta. User approved the localized card-and-pen pose in commit5036df9 and said to proceed. This implementation uses that approved artwork, not any rejected full-character replacement.

## Appearance and interaction

- `buddy_note_approved@2x/@3x.webp` are unchanged copies of the approved review exports. The3x SHA256 is `F56BECBFD4EDA9A6D84303B70B7018A8DC6D44DB3DB80A9539A8E9E0043B6BCC`.
- The approved whole-body bitmap is preserved outside the requested eye and writing areas. Two generated technical repair plates supply only local pixels: lowered eye interiors, pen removal/under-paw background, and the penless writing paw. Full-body versions of those plates are never used as replacement mascot images.
- While the name input and keyboard are active, the rendered eye highlights stay down, including typing pauses. Go or keyboard dismissal switches immediately to the approved original forward-facing pose. Refocusing restores the down gaze. No inactivity timer.
- Real text edits trigger one240ms pen/paw gesture. A short wrist pulse ensures a small writing movement on each edit. There is no idle clock, breathing, swaying or other body animation. Reduced motion snaps ink/pose updates and cancels the gesture.
- One continuous black ink path is clipped to the card. The same distance value controls the pen nib and the revealed ink endpoint. Clearing the name clears the ink; deleting pauses movement. The source artwork contains no baked child name or ink.
- Existing soft ground shadow, fixed non-scroll form, name/age controls, language strings, navigation and profile model are unchanged. No Screen1/other-screen edits or new dependencies.

## Checks completed before native build

- `npx tsc -p tsconfig.app.json --noEmit`: passed.
- `npx vitest run src/onboarding/screen2/approvedWritingModel.test.ts`:3 passed, including2001 nib/ink endpoint samples, monotonic single-line reveal/reset/clamp and ink inside the registered card.
- `review_approved_writing.cjs`: approved-source rest plus7 static writing states rendered and visually reviewed. A local card-edge seam was corrected using feathered pen repair; no image regeneration loop.
- `check_approved_pixels.py`: passed for all8 previews, with ZERO changed pixels outside the permitted eye and writing regions compared with the approved reference render. This is a headless render invariant, not a phone-pixel comparison.

## Sources and reproducibility

`prepare_approved_writing.py` applies only common registration/scale/export; it copies the approved body and reuses the existing green/gold pen. `noteRegistration.generated.ts` stores the approved-pose coordinates. Full prompts in `generation.json`; originals preserved at `design/buddy/generated/buddy_screen2_approved_writing_repair-original.png` and `buddy_screen2_approved_penless-original.png`. Each technical plate used one built-in image_gen call with the approved pose as its only input. No old rejected mascot frame is imported by the new component.

The edited eye/hand patches are intentionally localized; exact original pixels are not claimed within those areas. No Blender, rig, meshes, live facial drawing or whole-character regeneration. The old disconnected renderer and rejected files are preserved for recovery.

## Device review

Native arm64 build succeeded in3m4s; installed APK SHA256 `654305E96A8BFE14519FBD215FE5F35B876418FB9DF4D258020FF0C1A31518EC`. The initial capture was blocked by the timed-out/locked screen; the user explicitly unlocked it. No lock bypass, call changes or device-setting changes.

Completed `powershell -File tools/screen2/capture_writing.ps1 -UseInstalled -LeaveReady`. Actual44.520s recording saved at `phone/phone.mp4`;445frames extracted at10fps. Full-size screenshots, full-screen contact, first/middle/late pen/paw temporal crops and focus/gaze close-ups were visually reviewed. Observed:

- Card stays present throughout. Typed test name updates the native greeting.
- Pen/paw move with typing; one connected black line appears at the nib. Movement is intentionally small at the existing156pt keyboard-visible Buddy size and stops during pauses.
- Eyes remain down during typing pauses; keyboard dismissal returns the approved forward pose. Refocus returns down; Go shows the forward pose on the same-page age question.
- Input remains above the keyboard; all five age options fit. No debug controls. The floating voice/accessibility control is from the phone system.
- After the recording, Edit name and Clear name reset the test name/ink and leave the focused empty input with the keyboard open for the user (`phone/06-ready-to-type.png`). No Continue/profile save action.

The phone is left ready to type. Physical Hindi, enlarged-font and reduced-motion settings were not repeated in this milestone; localization is unchanged, and reduced-motion handling is implemented but not claimed as physically verified here. Small patch-region variation remains subject to user visual approval; the approved pixels outside those regions are protected by the local invariant check. No further automatic polish.

STOP after the reviewed phone milestone for user approval; no further automatic polish.
