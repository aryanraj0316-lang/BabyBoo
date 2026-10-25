/**
 * Hero strings. English is the source. Hindi is a placeholder for review.
 * The demo shows only the notice text and the status-bar time.
 */
export type HeroLanguage = 'en' | 'hi';

export const HERO_STRINGS: Record<HeroLanguage, { notice: string; a11yLabel: string; soundOn: string; soundOff: string }> = {
  en: {
    notice: '1% Battery. Phone needs rest.',
    a11yLabel: 'Animation: a phone runs out of battery and the BabyBoo bear helps',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
  },
  hi: {
    // TODO(hi): native speaker review of all Hindi strings below.
    notice: 'बैटरी 1%। फ़ोन को आराम चाहिए।',
    a11yLabel: 'एनिमेशन: फ़ोन की बैटरी खत्म होती है और BabyBoo भालू मदद करता है', // TODO(hi)
    soundOn: 'आवाज़ चालू', // TODO(hi)
    soundOff: 'आवाज़ बंद', // TODO(hi)
  },
};
