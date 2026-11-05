import { describe, expect, it } from 'vitest';
import { DIALOGUE_IDS, dialogueAt, dialogueTurns } from './dialogue';
import { STRINGS } from './strings';
import { sceneAt } from './timeline';
import { demo, unlock } from './tokens';

describe('Buddy dialogue on the existing story', () => {
  it('has all seven messages in both supported languages', () => {
    for (const copy of Object.values(STRINGS)) {
      for (const id of DIALOGUE_IDS) expect(copy.buddyDialogue[id].length).toBeGreaterThan(0);
    }
    expect(STRINGS.en.buddyDialogue.parents).toBe("Parents, it's your turn!");
    expect(STRINGS.en.buddyDialogue.drawA).toBe('Draw an A to unlock!');
  });

  it('never overlaps turns and gives the parent hand-off its own reading window', () => {
    for (let i = 0; i < dialogueTurns.length; i++) {
      const turn = dialogueTurns[i];
      expect(turn.to - turn.from).toBeGreaterThanOrEqual(1);
      if (i > 0) expect(turn.from).toBeGreaterThanOrEqual(dialogueTurns[i - 1].to);
      expect(DIALOGUE_IDS[dialogueAt((turn.from + turn.to) / 2, 1).id]).toBe(turn.id);
    }
    const parents = dialogueTurns.find(t => t.id === 'parents')!;
    const draw = dialogueTurns.find(t => t.id === 'drawA')!;
    expect(parents.to - parents.from).toBeGreaterThanOrEqual(1.7);
    expect(draw.to - draw.from).toBeGreaterThan(2);
    expect(parents.from).toBeLessThan(demo.beats.unlock);
    const nap = dialogueTurns.find(t => t.id === 'sleepy')!;
    expect(nap.to - nap.from).toBeCloseTo(3.2);
    expect(DIALOGUE_IDS[dialogueAt(16, 1).id]).toBe('sleepy');
    expect(parents.to).toBe(draw.from);
    for (let t = parents.from; t < parents.to; t += 0.1) {
      const phone = sceneAt(t, t, 1);
      expect(phone.lockVisible).toBe(1);
      expect(phone.lockOpacity).toBe(1);
      expect(phone.feedOpacity).toBe(0);
      expect(phone.dim).toBe(1);
    }
    expect(draw.from).toBeGreaterThanOrEqual(demo.beats.unlock + unlock.swipe[0]);
    expect(draw.to).toBeLessThan(demo.beats.unlocked);
  });

  it('derives visibility from sceneAt, stays quiet at the seam and under a reduced-motion still', () => {
    expect(dialogueAt(0, 1).id).toBe(-1);
    expect(dialogueAt(demo.loop - 0.01, 1).id).toBe(-1);
    expect(dialogueAt(6, 1).id).toBe(-1);
    const still = sceneAt(demo.stillTime, 0, 0);
    expect(DIALOGUE_IDS[still.dialogueId]).toBe('success');
    expect(still.dialogueOpacity).toBe(1);
    for (const turn of dialogueTurns) {
      expect(sceneAt(turn.from, turn.from, 1).dialogueOpacity).toBe(0);
      const t = (turn.from + turn.to) / 2;
      expect(sceneAt(t, t, 1).dialogueId).toBe(dialogueAt(t, 1).id);
      expect(sceneAt(t, t, 1).dialogueOpacity).toBe(1);
    }
  });
});
