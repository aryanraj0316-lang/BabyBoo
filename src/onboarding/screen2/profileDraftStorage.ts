import { parseProfileDraft, type ProfileDraft } from './profileDraft';
const KEY = 'babyboo_screen2_draft_v1';
let cached: string | null = null;
export function loadProfileDraft(): ProfileDraft {
  try { cached = localStorage.getItem(KEY) ?? cached; } catch { /* In-memory fallback. */ }
  return parseProfileDraft(cached);
}
export function saveProfileDraft(draft: ProfileDraft) {
  cached = JSON.stringify(draft);
  try { localStorage.setItem(KEY, cached); } catch { /* Keep answers during this session. */ }
}
