import { describe, expect, it } from 'vitest';
import { computeScene, fitBuddyHeight } from './layout';
import { buddy, page, phone } from './tokens';

const regions = {
  small: { x: 0, y: 60, width: 375, height: 300 },
  standard: { x: 0, y: 90, width: 390, height: 470 },
  large: { x: 0, y: 90, width: 430, height: 560 },
  huge: { x: 0, y: 0, width: 1024, height: 1400 },
};

describe('screen 1 scene layout', () => {
  it('never shows Buddy taller than the cap, however much space there is', () => {
    expect(fitBuddyHeight(regions.huge)).toBe(buddy.maxHeightPt);
    expect(computeScene(regions.huge).buddyHeight).toBe(buddy.maxHeightPt);
  });

  it('scales the scene down on small screens instead of crowding it', () => {
    expect(computeScene(regions.small).buddyHeight).toBeLessThan(buddy.maxHeightPt);
  });

  it('keeps identical proportions on every device', () => {
    for (const region of Object.values(regions)) {
      const s = computeScene(region);
      expect(s.phone.height).toBeCloseTo(s.buddyHeight / buddy.heightOfPhone, 6);
      expect(s.phone.height / s.phone.width).toBeCloseTo(phone.aspect, 6);
      expect(s.screen.radius).toBeCloseTo(s.phone.radius - s.phone.bezel, 6);
    }
  });

  it('fits the whole composition inside its region and the page margins', () => {
    for (const region of Object.values(regions)) {
      const { bounds } = computeScene(region);
      expect(bounds.x).toBeGreaterThanOrEqual(region.x + page.marginH - 1e-6);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(region.x + region.width - page.marginH + 1e-6);
      expect(bounds.y).toBeGreaterThanOrEqual(region.y - 1e-6);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(region.y + region.height + 1e-6);
    }
  });

  it('sits Buddy on the phone baseline, overlapping its right edge', () => {
    const s = computeScene(regions.standard);
    const phoneBottom = s.phone.y + s.phone.height;
    const phoneRight = s.phone.x + s.phone.width;
    expect(s.floorShadow.y + s.floorShadow.height / 2).toBeCloseTo(phoneBottom, 6);
    expect(s.buddyCanvas.x).toBeLessThan(phoneRight);
  });
});
