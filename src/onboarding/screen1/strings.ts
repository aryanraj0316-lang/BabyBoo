/**
 * Onboarding screen 1 copy. The old single paragraph is split into a headline
 * and a subline (see the decisions log in design/ONBOARDING_SCREEN1_BRIEF.md).
 */

export type Language = 'en' | 'hi';

export const STRINGS: Record<Language, {
  headline: string;
  subline: string;
  cta: string;
  toggleLabel: string;
  toggleA11y: string;
  /** Shown inside the demo phone (decorative). */
  batteryLow: string;
  buddyTimesUp: string;
}> = {
  en: {
    headline: 'Screen time ends with no one being the bad guy.',
    subline: 'BabyBoo helps your child say goodbye to the phone gently.',
    cta: 'Get Started',
    toggleLabel: 'EN',
    toggleA11y: 'English',
    batteryLow: 'Battery low',
    buddyTimesUp: "Time's up!",
  },
  hi: {
    buddyTimesUp: 'समय पूरा!',
    headline: 'स्क्रीन टाइम बिना किसी के विलेन बने खत्म होता है।',
    subline: 'BabyBoo आपके बच्चे को प्यार से फोन को अलविदा कहने में मदद करता है।',
    cta: 'शुरू करें',
    toggleLabel: 'हिन्दी',
    toggleA11y: 'हिन्दी',
    batteryLow: 'बैटरी कम है',
  },
};

export const LANGUAGES: Language[] = ['en', 'hi'];
