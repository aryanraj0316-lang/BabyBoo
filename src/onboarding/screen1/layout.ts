/**
 * Scene geometry for onboarding screen 1. Pure functions, no React.
 *
 * Everything is sized from Buddy: his watching frame is at most
 * tokens.buddy.maxHeightPt tall, the phone is 1 / heightOfPhone times his
 * height, and the composition only shrinks when the space is too small. Extra
 * space on large screens becomes air around the scene, never a bigger phone.
 */
import { BUDDY_BASELINE_PT, BUDDY_BOUNDS, BUDDY_CANVAS_PT } from './buddyMetrics.generated';
import { buddy as B, contactShadow as CS, halo as H, page, phone as P, radius } from './tokens';

export interface Rect { x: number; y: number; width: number; height: number }

export interface SceneLayout {
  /** Displayed height of the watching frame's visible fur. */
  buddyHeight: number;
  /** Scale from Buddy canvas points to screen points. */
  buddyScale: number;
  /** Where Buddy's shared canvas is drawn. */
  buddyCanvas: Rect;
  phone: Rect & { radius: number; bezel: number };
  screen: Rect & { radius: number };
  halo: { cx: number; cy: number; r: number };
  floorShadow: Rect;
  /** Bounding box of the phone, Buddy (any frame) and the floor shadow. */
  bounds: Rect;
}

const WATCH = BUDDY_BOUNDS.watch_34_left;
const WATCH_HEIGHT_PT = WATCH.y1 - WATCH.y0;
const WATCH_WIDTH_PT = WATCH.x1 - WATCH.x0;

// Extents over every frame, so no later expression can overflow the layout.
const ALL = Object.values(BUDDY_BOUNDS);
const MAX_RIGHT_PT = Math.max(...ALL.map((b) => b.x1));

/** Composition size per point of Buddy height (it scales linearly). */
function unitExtents() {
  const b = 1;
  const s = b / WATCH_HEIGHT_PT;
  const phoneH = b / B.heightOfPhone;
  const phoneW = phoneH / P.aspect;
  const overlap = B.overlapOfWidth * WATCH_WIDTH_PT * s;
  const buddyRight = phoneW - overlap + (MAX_RIGHT_PT - WATCH.x0) * s;
  const shadowBelow = (CS.heightOfBuddy / 2 + CS.blurOfBuddy * 2) * b;
  return {
    // The floor shadow overhangs both ends of the phone + Buddy group.
    width: CS.overhangOfBuddy * b + buddyRight + CS.overhangOfBuddy * b,
    height: phoneH + shadowBelow,
  };
}

const UNIT = unitExtents();

/** Buddy's displayed height for a scene region, capped at the token maximum. */
export function fitBuddyHeight(region: { width: number; height: number }): number {
  const fitW = (region.width - page.marginH * 2) / UNIT.width;
  const fitH = region.height / UNIT.height;
  return Math.max(0, Math.min(B.maxHeightPt, fitW, fitH));
}

/** Full scene geometry, centred in `region` (screen coordinates). */
export function computeScene(region: Rect): SceneLayout {
  const b = fitBuddyHeight(region);
  const s = b / WATCH_HEIGHT_PT;

  const phoneH = b / B.heightOfPhone;
  const phoneW = phoneH / P.aspect;
  const compW = UNIT.width * b;
  const compH = UNIT.height * b;

  // Centre the whole composition; the phone ends up left of centre with Buddy to its right.
  const compX = region.x + (region.width - compW) / 2;
  const compY = region.y + (region.height - compH) / 2;
  const phoneX = compX + CS.overhangOfBuddy * b;
  const phoneY = compY;
  const phoneBottom = phoneY + phoneH;

  const bezel = P.bezelOfWidth * phoneW;
  const outerR = radius.phoneOuter * (phoneW / P.radiusRefWidth);

  // Buddy: visible fur overlaps the phone's right edge; baseline on the phone's bottom edge.
  const visW = WATCH_WIDTH_PT * s;
  const visLeft = phoneX + phoneW - B.overlapOfWidth * visW;
  const canvasX = visLeft - WATCH.x0 * s;
  const canvasY = phoneBottom - BUDDY_BASELINE_PT * s;

  const shadowH = CS.heightOfBuddy * b;
  const floorLeft = phoneX - CS.overhangOfBuddy * b;
  const floorRight = canvasX + MAX_RIGHT_PT * s + CS.overhangOfBuddy * b;

  return {
    buddyHeight: b,
    buddyScale: s,
    buddyCanvas: { x: canvasX, y: canvasY, width: BUDDY_CANVAS_PT.width * s, height: BUDDY_CANVAS_PT.height * s },
    phone: { x: phoneX, y: phoneY, width: phoneW, height: phoneH, radius: outerR, bezel },
    screen: {
      x: phoneX + bezel,
      y: phoneY + bezel,
      width: phoneW - bezel * 2,
      height: phoneH - bezel * 2,
      radius: Math.max(0, outerR - bezel),
    },
    halo: {
      cx: phoneX + phoneW / 2,
      cy: phoneY + phoneH / 2 + H.offsetYOfPhoneHeight * phoneH,
      r: H.radiusOfPhoneHeight * phoneH,
    },
    floorShadow: { x: floorLeft, y: phoneBottom - shadowH / 2, width: floorRight - floorLeft, height: shadowH },
    bounds: { x: compX, y: compY, width: compW, height: compH },
  };
}
