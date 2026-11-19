import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_DRAFT, parseProfileDraft } from './profileDraft';
import { loadProfileDraft, saveProfileDraft } from './profileDraftStorage';

afterEach(() => vi.unstubAllGlobals());

describe('Screen 2 saved answers', () => {
  it('recovers safely from invalid or stale data', () => {
    for (const raw of [null, '{', 'null', '42']) expect(parseProfileDraft(raw)).toEqual(EMPTY_DRAFT);
    expect(parseProfileDraft(JSON.stringify({ name: '   ', age: 'removed-age', confirmed: true, language: 'fr' })))
      .toEqual({ ...EMPTY_DRAFT, name: '   ' });
  });
  it('restores the age step, Hindi and corrected answers across remounts', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value) });
    const draft = { name: 'आरव', age: '2_4', confirmed: true, language: 'hi' as const };
    saveProfileDraft(draft);
    expect(loadProfileDraft()).toEqual(draft);
    saveProfileDraft({ ...draft, name: 'आरव कुमार', confirmed: false });
    expect(loadProfileDraft()).toEqual({ ...draft, name: 'आरव कुमार', confirmed: false });
  });
  it('keeps answers when persistent storage is unavailable', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('unavailable'); }, setItem() { throw new Error('unavailable'); } });
    const draft = { name: 'Alex', age: '5_7', confirmed: true, language: 'en' as const };
    saveProfileDraft(draft);
    expect(loadProfileDraft()).toEqual(draft);
  });
  it('enforces the input limit and only restores supported ages', () => {
    expect(parseProfileDraft(JSON.stringify({ name: 'A'.repeat(40), age: '8_10', confirmed: true })).name).toHaveLength(25);
    expect(parseProfileDraft(JSON.stringify({ name: 'Alex', age: 'adult' })).age).toBeNull();
  });
});
