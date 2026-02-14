import { describe, expect, it } from "vitest";
import {
  findSnapTarget,
  getSnapOffset,
  resolveSnapPoints,
} from "./snap-points";

// ── resolveSnapPoints ──────────────────────────

describe("resolveSnapPoints", () => {
  const vh = 800; // viewport height

  it("returns empty array for no snap points", () => {
    expect(resolveSnapPoints([], vh)).toEqual([]);
  });

  it("resolves fractions (0-1) to viewport height", () => {
    expect(resolveSnapPoints([0.5], vh)).toEqual([400]);
    expect(resolveSnapPoints([0.25, 0.75], vh)).toEqual([200, 600]);
  });

  it("resolves 1 as full viewport", () => {
    expect(resolveSnapPoints([1], vh)).toEqual([800]);
  });

  it("passes through pixel values (>1) directly", () => {
    expect(resolveSnapPoints([300], vh)).toEqual([300]);
    expect(resolveSnapPoints([150, 500], vh)).toEqual([150, 500]);
  });

  it("resolves px strings", () => {
    expect(resolveSnapPoints(["148px"], vh)).toEqual([148]);
  });

  it("resolves vh strings", () => {
    expect(resolveSnapPoints(["50vh"], vh)).toEqual([400]);
  });

  it("resolves % strings", () => {
    expect(resolveSnapPoints(["25%"], vh)).toEqual([200]);
  });

  it("sorts results ascending", () => {
    expect(resolveSnapPoints([0.8, 0.3, 0.5], vh)).toEqual([240, 400, 640]);
  });

  it("deduplicates within 1px tolerance", () => {
    // 0.5 * 800 = 400, and 400px = 400 — should deduplicate
    expect(resolveSnapPoints([0.5, 400], vh)).toEqual([400]);
    // 399px and 400px are within 1px — should deduplicate
    expect(resolveSnapPoints([399, 400], vh)).toEqual([399]);
  });

  it("filters out zero/invalid values", () => {
    expect(resolveSnapPoints([0, "invalid" as never, 300], vh)).toEqual([300]);
  });

  it("handles mixed types", () => {
    const result = resolveSnapPoints([0.3, 500, "148px"], vh);
    expect(result).toEqual([148, 240, 500]);
  });
});

// ── findSnapTarget ─────────────────────────────

describe("findSnapTarget", () => {
  // Panel height 600px, snap points at 200, 400, 600 (ascending heights)
  const snapHeights = [200, 400, 600];
  const panelHeight = 600;

  it("returns -1 for empty snap heights", () => {
    expect(findSnapTarget(100, 600, [], 0, 0, false)).toBe(-1);
  });

  it("snaps to nearest point based on position (no velocity)", () => {
    // dragOffset 0 = fully open (600px height) → snap to index 2 (600)
    expect(findSnapTarget(0, panelHeight, snapHeights, 0, 2, false)).toBe(2);
    // dragOffset 150 = 450px visible → closer to 400 (index 1)
    expect(findSnapTarget(150, panelHeight, snapHeights, 0, 2, false)).toBe(1);
    // dragOffset 350 = 250px visible → closer to 200 (index 0)
    expect(findSnapTarget(350, panelHeight, snapHeights, 0, 2, false)).toBe(0);
  });

  it("returns -1 when dismiss is closest", () => {
    // dragOffset 500 = 100px visible → closer to dismiss (600 offset) than 200 (400 offset)
    expect(findSnapTarget(500, panelHeight, snapHeights, 0, 2, false)).toBe(-1);
  });

  it("velocity shifts the projected position", () => {
    // Small offset but high velocity in dismiss direction → jumps further
    expect(findSnapTarget(50, panelHeight, snapHeights, 0.8, 2, false)).toBe(1); // velocity projects past fully open
  });

  it("sequential mode only moves to adjacent point", () => {
    // Currently at index 2 (fully open), swiping down (positive velocity)
    expect(findSnapTarget(100, panelHeight, snapHeights, 0.5, 2, true)).toBe(1);
    // Currently at index 1, swiping down
    expect(findSnapTarget(100, panelHeight, snapHeights, 0.5, 1, true)).toBe(0);
    // Currently at index 0, swiping down → dismiss
    expect(findSnapTarget(100, panelHeight, snapHeights, 0.5, 0, true)).toBe(
      -1
    );
  });

  it("sequential mode moves up when swiping up (negative velocity)", () => {
    // Currently at index 0, swiping up (negative velocity)
    expect(findSnapTarget(50, panelHeight, snapHeights, -0.5, 0, true)).toBe(1);
    // Currently at index 1, swiping up
    expect(findSnapTarget(50, panelHeight, snapHeights, -0.5, 1, true)).toBe(2);
    // Currently at top (index 2), swiping up → stay at top
    expect(findSnapTarget(50, panelHeight, snapHeights, -0.5, 2, true)).toBe(2);
  });
});

// ── getSnapOffset ──────────────────────────────

describe("getSnapOffset", () => {
  const snapHeights = [200, 400, 600];
  const panelHeight = 600;

  it("returns 0 offset for fully open (height === panel)", () => {
    expect(getSnapOffset(2, snapHeights, panelHeight)).toBe(0);
  });

  it("returns correct offset for partial snap", () => {
    // Snap to 400px → offset = 600 - 400 = 200
    expect(getSnapOffset(1, snapHeights, panelHeight)).toBe(200);
    // Snap to 200px → offset = 600 - 200 = 400
    expect(getSnapOffset(0, snapHeights, panelHeight)).toBe(400);
  });

  it("returns 0 for out-of-bounds index", () => {
    expect(getSnapOffset(-1, snapHeights, panelHeight)).toBe(0);
    expect(getSnapOffset(5, snapHeights, panelHeight)).toBe(0);
  });
});
