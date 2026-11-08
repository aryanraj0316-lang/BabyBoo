# Screen 2 original-art restoration

2026-11-08, Asia/Calcutta. User rejected all regenerated Screen 2 artwork because facial features, colour, fur, smoothness and identity had changed. Whole-character regeneration is stopped.

Screen 2 now displays the **exact existing Screen 1 wave asset** directly: `assets/onboarding/screen1/buddy/buddy_wave.webp` (Metro's 2x/3x resolution variants). No generated pose, eye patch, tint, recolouring, mesh or image distortion is used. A small separate stationary shadow sits behind/below the bitmap. Screen 1 itself was not modified.

Source hashes remain:

- 2x: `31F7A1583E7F9CBA17C5F0C6E04A6560ED08E9BDB7F2FC5EFAC8D8BD995944B5`
- 3x: `D4DAAB9A748152CB5A46D240921F3FBFB00F142C3207190262B0F8C1846E642B`

`OnboardingSecondScreenNative.tsx` no longer imports the rejected `WritingBuddy` renderer or generated frame registry. Old source and assets are preserved, not deleted. Existing name/age input, same-page flow, validation, English/Hindi strings, navigation and fixed non-scroll layout are retained.

**This is a recovery of the approved appearance, not completion of the writing feature.** The same original wave is shown throughout Screen 2. Note-taking pose, down/forward gaze changes, moving paw/pen and writing ink are on hold pending an identity-preserving approach and approval. Do not resume whole-character image generation automatically.

Validation actually completed:

- `npx tsc -p tsconfig.app.json --noEmit`: passed.
- Android arm64 debug build: succeeded in 2m; installed on Vivo V2432, serial10MF7BG5920005F.
- APK SHA256: `2EC8B9E4F35A14FAB8A0E55488D2EC0D3159A5B994FCED951B3ADCA4B4034933`.
- Actual phone capture via `tools/screen2/capture_name_age.ps1 -NoteFrameOnly`:21.275s;21frames extracted at1fps; contact and full-size name/age screenshots visually reviewed. Original plush character remains unchanged as the local test name is typed and the age question opens. Keyboard stays below the input, all five age options fit. No Continue/profile save action.
- Debug controls hidden. The floating voice/accessibility control in the name screenshot belongs to the phone system, not the app.
- Task whitespace check passed. No new artwork generated; no other onboarding screens changed.

Evidence: `phone/02-name.png`, `phone/03-age.png`, `phone/phone.mp4`, `phone/contact.png`. Physical reduced-motion/font-scale variations were not repeated for this static recovery. Phone left on the English age question with the unchanged approved Buddy. STOP at this restoration checkpoint.
