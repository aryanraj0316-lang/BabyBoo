# Screen 2 — Checkpoint B static Friend Card

2026-11-05, Asia/Calcutta. Branch: onboarding-screen1-rebuild. Checkpoint A approved; this is Checkpoint B only.

## Result

The existing cream Screen 2 now presents a rounded Friend Card with a forest-green serif title, a restrained lavender New Friend label, a cream speech bubble and the approved stationary full-body greeting Buddy. The card's name/age/colour sections are intentionally blank. The name field, Go action, age chips, Continue and existing Back callbacks remain the existing controls and handlers.

All six approved image stems are registered in `src/onboarding/screen2/buddyFrames.ts` using Metro's density-aware convention. The greeting is the only displayed frame in this checkpoint; no interaction-driven pose switching, user-data overlays, badge tinting or colour selector was added. The existing split-body/hand rendering and its waving/floating loops are disconnected from Screen 2; old assets remain. Approved WebP files are unchanged.

The existing speech/localization handlers and typing indicator remain; this checkpoint only shares the approved Screen 1 bubble appearance tokens through a read-only import. Screen 1 itself is unchanged. New Friend Card labels have English and Hindi copy. Existing age-chip labels remain as implemented, including English labels under the Hindi toggle; full interaction/localization review belongs to C.

## Application files changed

- `src/native/OnboardingSecondScreenNative.tsx`: static Friend Card presentation, one full-body Buddy image, input label, Android keyboard avoidance/scroll-to-focused-input, footer safe-area inset, debug-only Skip visibility. Existing data interface, validation, name/age handlers and navigation callbacks retained.
- `src/onboarding/screen2/buddyFrames.ts`: references all six unchanged approved frames; only greeting consumed.

No Screen 1, other-screen, profile-model, navigation-container or saved-answer changes. No artwork generation or asset modifications.

## Checks actually completed

- `node node_modules/typescript/bin/tsc --project tsconfig.app.json --noEmit` passed on the latest source.
- Task whitespace check passed.
- Android arm64 build succeeded in 53 seconds and installed on Vivo V2432, serial 10MF7BG5920005F.
- APK SHA256: 2F2597762F9532D8BFC67DFC2C57AABF19782394D7E97B39F9E07B3282DD08A1. The last type-only ref correction was included before this build.
- Actual device recordings pulled: greeting6s, keyboard4s, Hindi4s. Extracted contact sheets and reviewed every sampled frame plus full-size screenshots. Debug Skip absent; no debug controls shown. No recent fatal exceptions/ReactNativeJS errors in the checked log window.
- `review/greeting.png` shows the initial empty Friend Card and greeting, with keyboard dismissed. Buddy is sharp at this display size, stationary, proportionate, with no obvious white rectangle, halo or clipped artwork in the static composition.
- `review/keyboard.png` shows the focused name field fully above the keyboard. The scrollable card moves upward while editing, so the upper card/title/Buddy ears may be outside the viewport; dismissing the keyboard restores the full greeting composition. This is viewport scrolling, not image clipping or mascot motion.
- `review/hindi.png` and its recording show the localized initial title, bubble and field. No name, age or colour has been inserted into the card placeholders.

Earlier captures revealed keyboard overlap and an Android navigation-bar footer issue. These were corrected in the final build using the existing KeyboardAvoidingView on Android, focused-field scrolling and footer safe-area padding. Intermediate screenshots/build logs remain local and are not the delivered evidence. One temporary unsaved character was introduced by an earlier keyboard-covered tap during automation; final cold-launch evidence uses the initial empty state. No saved profile data was cleared or changed.

This is a static visual checkpoint on one physical Android device. The final age/Continue path, other screen sizes, reduced-motion preferences and backward/forward answer persistence have not been fully exercised in this checkpoint. The handlers remain in place; Checkpoint C is required for complete interactive verification. No new unit tests were added for this reversible visual change.

STOPPED for Checkpoint B visual approval. Do not begin C until explicitly approved.
