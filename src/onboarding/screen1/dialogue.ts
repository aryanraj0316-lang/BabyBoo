/** Dialogue is a view of the existing story time, never a second clock. */
import { battery, demo, dim, speechBubble, unlock } from './tokens';

export const DIALOGUE_IDS = ['reels', 'battery', 'timesUp', 'sleepy', 'parents', 'drawA', 'success'] as const;
export type DialogueId = typeof DIALOGUE_IDS[number];
export type BuddyDialogue = Record<DialogueId, string>;

// Parent hand-off leads the visible prompt slightly so it can be read before
// the instruction turn. The phone's A stroke/timings remain untouched.
export const dialogueTurns = [
  { id: 'reels', from: demo.beats.reels + 0.7, to: demo.beats.battery - 2.2 },
  { id: 'battery', from: battery.drainFrom, to: dim.at - 0.35 },
  { id: 'timesUp', from: dim.at, to: 13.6 },
  { id: 'sleepy', from: 13.6, to: demo.beats.unlock - 0.7 },
  { id: 'parents', from: demo.beats.unlock - 0.7, to: demo.beats.unlock + unlock.swipe[0] + 0.4 },
  { id: 'drawA', from: demo.beats.unlock + unlock.swipe[0] + 0.4, to: demo.beats.unlocked - 0.15 },
  { id: 'success', from: demo.beats.unlocked, to: demo.beats.rest + 0.3 },
] as const;

export function dialogueAt(t: number, motion: number): { id: number; opacity: number } {
  'worklet';
  for (let i = 0; i < dialogueTurns.length; i++) {
    const turn = dialogueTurns[i];
    if (t >= turn.from && t < turn.to) {
      const fade = speechBubble.fadeSeconds;
      return {
        id: i,
        opacity: motion === 0 ? 1 : Math.max(0, Math.min(1, (t - turn.from) / fade, (turn.to - t) / fade)),
      };
    }
  }
  return { id: -1, opacity: 0 };
}
