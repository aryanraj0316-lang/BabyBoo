# Name-entry frame v2 — installed for phone review

2026-11-08, Asia/Calcutta. User explicitly requested seeing the candidate on their phone before approving it. This authorizes a review installation, not final likeness approval.

Only the name-entry artwork reference changed. Candidate WebPs were copied byte-for-byte into versioned `buddy_name_attentive_v2@2x.webp` / `@3x.webp` siblings under assets/onboarding/screen2/buddy; previous name-entry files remain. `src/onboarding/screen2/buddyFrames.ts` now points nameAttentive at the versioned stem. No layout, interaction, other frame, Screen 1 or other-screen changes.

The existing capture helper gained a NameFrameOnly option so the review stops after typing a temporary name. It does not select age, press Continue or save a child profile. The phone was left in the name-entry state showing “Hi, Mira!” and the regenerated frame, with keyboard open.

## Verification completed

- App TypeScript check passed; task whitespace passed.
- Android arm64 build succeeded in 2m5s and installed on Vivo V2432, serial10MF7BG5920005F.
- APK SHA256: 1A35BB8B14342C7B283F14FBFD31C3A5DA38F9B06E27D526B7A27308CF58F2B9.
- Actual14.312-second ADB recording pulled; extracted1fps contact sheet and reviewed all14 sampled frames, plus full-size greeting/name-entry PNGs. New pose appears after entering Mira and stays stationary. Input remains above keyboard; Buddy's ears/feet are visible, no obvious stretch, opaque background rectangle or edge halo at this size. Debug controls absent.
- Recent checked log window contains no fatal exceptions or ReactNativeJS errors. Foreground activity confirmed com.babyboo.app.
- A small system floating audio/accessibility overlay appears to the right in the captures; it is not drawn by Screen 2. It was left untouched.

Evidence: phone_review/greeting.png, name-entry.png, phone.mp4 and contact.png. These are actual unedited phone captures. No age/Hindi/complete-flow verification is claimed by this short frame-only review. Earlier name-and-age milestone's broader device checks remain separate.

STOPPED awaiting user approval of the regenerated name-entry frame on their phone. No further art generation or component changes started.
