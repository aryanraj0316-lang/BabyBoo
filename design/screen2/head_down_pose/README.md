# New bowed-head writing pose — image first

2026-11-08, Asia/Calcutta. User rejects the current upright-head writing effect and reports the pen drifting away from the hand. They explicitly request a NEW contextual rendered frame first, with head physically lowered and eyes aimed at the paper. They also request moving the mascot and input upward when the keyboard is hidden; layout work waits for this image review.

One built-in image_gen edit used the approved `buddy_screen2_localized_note-original.png` as its only reference. Full prompt in `generation.json`; original preserved at `design/buddy/generated/buddy_screen2_head_down-original.png`.

The generated candidate was visually inspected: it shows a physically bowed head, more visible top of head, lowered eyes toward the card, green/gold pen passing behind the rounded gripping paw, and nib on the blank card. It retains the lavender plush rendering direction, but exact likeness/colour approval remains with the user; generation success is not approval. No further attempts or derivatives were generated.

No app code, layout, animation, image integration, native build or device installation changed. The user explicitly requested the image first. The phone still contains the previous preview, whose pen grip and upright-head behavior are NOT approved.

After image approval: use this whole rendered head-down pose rather than only moving eye highlights; keep down while input is active. Fix the floating pen by moving the gripping paw and pen as one connected unit, not independently displacing the pen farther than the paw. Compute the single ink line from that same nib transform. Preserve the forward approved pose after Go/keyboard dismissal. Shift the keyboard-hidden mascot/input upward without scrolling or changing other screens. STOP here for image review before those app changes.
