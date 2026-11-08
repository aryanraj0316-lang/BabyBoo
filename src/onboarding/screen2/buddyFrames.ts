/** Approved Checkpoint A artwork, selected by Screen 2 input events. */
export const SCREEN2_BUDDY_FRAMES = {
  // Metro selects the existing @2x/@3x files from their density-free stem,
  // matching the established Screen 1 asset-import convention.
  greeting: require('../../../assets/onboarding/screen2/buddy/buddy_greeting.webp'),
  nameAttentive: require('../../../assets/onboarding/screen2/buddy/buddy_name_attentive_v2.webp'),
  noteTaking: require('../../../assets/onboarding/screen2/buddy/buddy_note_taking.webp'),
  ageReady: require('../../../assets/onboarding/screen2/buddy/buddy_age_ready.webp'),
  ageProud: require('../../../assets/onboarding/screen2/buddy/buddy_age_proud.webp'),
  colourBadge: require('../../../assets/onboarding/screen2/buddy/buddy_colour_badge.webp'),
  friendComplete: require('../../../assets/onboarding/screen2/buddy/buddy_friend_complete.webp'),
} as const;
