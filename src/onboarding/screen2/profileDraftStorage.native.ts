import { File, Paths } from 'expo-file-system';
import { parseProfileDraft, type ProfileDraft } from './profileDraft';
let cached: string | null = null;
const draftFile = () => new File(Paths.document, 'screen2-profile-draft.json');
export function loadProfileDraft(): ProfileDraft {
  try { const file = draftFile(); if (file.exists) cached = file.textSync(); } catch { /* Keep navigation working if storage is unavailable. */ }
  return parseProfileDraft(cached);
}
export function saveProfileDraft(draft: ProfileDraft) {
  cached = JSON.stringify(draft);
  try { draftFile().write(cached); } catch { /* Keep answers in memory for this session. */ }
}
