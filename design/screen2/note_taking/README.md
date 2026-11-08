# Fixed Screen 2 + note-taking pose — visual checkpoint

2026-11-08, Asia/Calcutta. Branch: onboarding-screen1-rebuild. Latest requests: make Screen 2 non-scrollable; replace the awkward card-presenting pose with Buddy looking at a card held in one paw and writing with a pen in the other. A subsequent request adds typing-triggered pen movement; that motion is the next milestone, not implemented in this static checkpoint.

## Implemented and installed

- Removed Screen 2's ScrollView entirely. A fixed flex layout reserves the form/Continue area, with a shrinking image slot using contain-fit instead of overflowing or clipping artwork. Automatic keyboard handling remains.
- Existing five age choices use a two-column grid. Short viewports show compact labels; full descriptions remain in accessibility labels. Continue reserves its space while unselected so choosing an age does not move the mascot. No age IDs or callback data changed.
- One static note-taking image is used for both age-ready/age-selected, replacing the two presenting-card frames. Old assets are preserved. Greeting and name-entry v2 remain unchanged in this checkpoint.
- One paw supports a blank cream card at an angle across the lap; the other holds a dark green pen with its tip on the card. Head/eyes are directed down more than the previous card poses. Card has no baked text or user data. Final likeness/gaze approval belongs to the user.
- Screen 1, other screens, navigation, data model and profile persistence were not modified. No pen/body animation in this build, and no new colour/card-completion work.

## Artwork preparation

Used built-in image_gen with the master and recent name-entry original as identity references. Two calls total: initial note-taking pose, then one focused head/gaze correction because the first pose still looked toward the viewer. No further attempts. Full prompts are in generation.json and gaze-correction.json.

Both untouched generated originals are preserved in design/buddy/generated/: buddy_screen2_note_taking-v1-original.png and buddy_screen2_note_taking-original.png. The latter is the selected candidate. `tools/screen2/prepare_note_taking.py` uses the existing head/baseline measurement and premultiplied resampling, exporting unchanged artwork to transparent WebP at2x/3x, shared160×159pt canvas/106pt estimated head/155pt baseline. Manifest records dimensions and visible-alpha bounds. No upscaling or procedural drawing. comparison.png was visually reviewed before native integration.

## Verification actually run

- App TypeScript check passed; task whitespace passed.
- Android arm64 build passed in1m59s; installed on physical Vivo V2432, serial10MF7BG5920005F.
- APK SHA256: 303EDD0B598976F98E7DB0C5151C7F0A6ADAB103E763AF141643FEBE0337390A.
- Actual50.651-second ADB recording pulled; extracted1fps contact sheets, reviewed both sheets and full-size greeting/age/selected-age/Hindi screenshots. New note-taking pose is visible, stationary, and fits with ears/feet inside its slot. Name field is above the auto-open keyboard. All five age choices and Continue fit inside the captured age screen in English/Hindi.
- Editing the name returns to the input and retains the selected age; submitting it again returns to the age step. No Continue press/profile save performed; Mira was a temporary local test name.
- Real upward swipe on the age screen: UI hierarchy contains zero scrollable BabyBoo nodes; every app text/label/bounds entry is unchanged before/after. UI XML evidence is saved in phone_review/. Body uses View, not a disabled ScrollView.
- Recent checked native log window had no fatal exceptions or ReactNativeJS errors.
- Physical verification used the normal720×1600/density300 device. No additional display override/font-scale test performed in this checkpoint; do not claim every device size passed. No system settings were changed.

phone_review/ contains actual PNGs, the50s recording, reviewed contact sheets and before/after swipe UI XML. A small floating system audio/accessibility control may appear in name-entry captures; it is not drawn by Screen 2 and was left untouched. Phone left on the English age step with the note-taking pose for user review.

## Next milestone requires review first

User additionally requested the note-taking pose during name entry and pen movement responding to actual typing, stopping when typing stops. This is retained as the next small milestone after approval of the fixed layout/artwork, honoring the user's request to ask at each milestone. It has NOT been implemented or claimed in this build. Do not start unrelated polish or additional image generation automatically.
