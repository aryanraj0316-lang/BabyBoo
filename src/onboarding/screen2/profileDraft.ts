export const AGE_IDS = ['under_1', 'age_1', '2_4', '5_7', '8_10'] as const;
export interface ProfileDraft {
  name: string;
  age: string | null;
  confirmed: boolean;
  language: 'en' | 'hi';
}
export const EMPTY_DRAFT: ProfileDraft = { name: '', age: null, confirmed: false, language: 'en' };
export function parseProfileDraft(raw: string | null): ProfileDraft {
  try {
    const value = JSON.parse(raw || 'null');
    if (!value || typeof value !== 'object') return { ...EMPTY_DRAFT };
    const name = typeof value.name === 'string' ? value.name.slice(0, 25) : '';
    return {
      name,
      age: AGE_IDS.includes(value.age) ? value.age : null,
      confirmed: value.confirmed === true && name.trim().length > 0,
      language: value.language === 'hi' ? 'hi' : 'en',
    };
  } catch { return { ...EMPTY_DRAFT }; }
}
