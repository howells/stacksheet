import { describe, expect, it } from "vitest";
import {
  getAnimatedBorderRadius,
  getPanelStyles,
  getSlideFrom,
  getSlideTarget,
  getStackOffset,
  getStackTransform,
} from "./stacking";
import type { ResolvedConfig, StackingConfig } from "./types";

const defaultStacking: StackingConfig = {
  scaleStep: 0.04,
  offsetStep: 16,
  radius: 12,
  renderThreshold: 3,
  opacityStep: 0.15,
};

describe("getStackTransform", () => {
  it("returns identity transform at depth 0", () => {
    const result = getStackTransform(0, defaultStacking);
    expect(result).toEqual({
      scale: 1,
      offset: 0,
      opacity: 1,
      borderRadius: 0,
    });
  });

  it("returns identity for negative depth", () => {
    const result = getStackTransform(-1, defaultStacking);
    expect(result).toEqual({
      scale: 1,
      offset: 0,
      opacity: 1,
      borderRadius: 0,
    });
  });

  it("scales and offsets at depth 1", () => {
    const result = getStackTransform(1, defaultStacking);
    expect(result.scale).toBe(0.96);
    expect(result.offset).toBe(16);
    expect(result.opacity).toBe(0.85);
    expect(result.borderRadius).toBe(12);
  });

  it("scales and offsets at depth 2", () => {
    const result = getStackTransform(2, defaultStacking);
    expect(result.scale).toBe(0.92);
    expect(result.offset).toBe(32);
    expect(result.opacity).toBe(0.7);
    expect(result.borderRadius).toBe(12);
  });

  it("clamps at renderThreshold boundary", () => {
    // depth === renderThreshold (3) → clamped to visualDepth 2, opacity 0
    const result = getStackTransform(3, defaultStacking);
    expect(result.scale).toBe(0.92);
    expect(result.offset).toBe(32);
    expect(result.opacity).toBe(0);
  });

  it("clamps beyond renderThreshold", () => {
    const result = getStackTransform(5, defaultStacking);
    expect(result.scale).toBe(0.92);
    expect(result.offset).toBe(32);
    expect(result.opacity).toBe(0);
  });

  it("enforces minimum scale of 0.5", () => {
    const bigStep: StackingConfig = {
      ...defaultStacking,
      scaleStep: 0.3,
      renderThreshold: 10,
    };
    const result = getStackTransform(3, bigStep);
    expect(result.scale).toBe(0.5);
  });
});

describe("getAnimatedBorderRadius", () => {
  it("returns top corners for bottom panel at depth 0", () => {
    const result = getAnimatedBorderRadius("bottom", 0, defaultStacking);
    expect(result).toEqual({
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    });
  });

  it("returns stacking radius for bottom panel at depth > 0", () => {
    const result = getAnimatedBorderRadius("bottom", 1, defaultStacking);
    expect(result).toEqual({
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    });
  });

  it("returns 0 border radius for right panel at depth 0", () => {
    const result = getAnimatedBorderRadius("right", 0, defaultStacking);
    expect(result).toEqual({ borderRadius: 0 });
  });

  it("returns stacking radius for right panel at depth > 0", () => {
    const result = getAnimatedBorderRadius("right", 1, defaultStacking);
    expect(result).toEqual({ borderRadius: 12 });
  });

  it("returns stacking radius for left panel at depth > 0", () => {
    const result = getAnimatedBorderRadius("left", 2, defaultStacking);
    expect(result).toEqual({ borderRadius: 12 });
  });
});

describe("getSlideFrom", () => {
  it("returns x:100% for right side", () => {
    expect(getSlideFrom("right")).toEqual({ x: "100%" });
  });

  it("returns x:-100% for left side", () => {
    expect(getSlideFrom("left")).toEqual({ x: "-100%" });
  });

  it("returns y:100% for bottom side", () => {
    expect(getSlideFrom("bottom")).toEqual({ y: "100%" });
  });

  it("defaults to right for unknown side", () => {
    expect(getSlideFrom("unknown" as never)).toEqual({ x: "100%" });
  });
});

describe("getSlideTarget", () => {
  it("returns zeroed position", () => {
    expect(getSlideTarget()).toEqual({ x: 0, y: 0 });
  });
});

describe("getStackOffset", () => {
  it("returns empty object for zero offset", () => {
    expect(getStackOffset("right", 0)).toEqual({});
  });

  it("returns negative x for right side", () => {
    expect(getStackOffset("right", 16)).toEqual({ x: -16 });
  });

  it("returns positive x for left side", () => {
    expect(getStackOffset("left", 16)).toEqual({ x: 16 });
  });

  it("returns negative y for bottom side", () => {
    expect(getStackOffset("bottom", 16)).toEqual({ y: -16 });
  });

  it("returns empty for unknown side with offset", () => {
    expect(getStackOffset("unknown" as never, 10)).toEqual({});
  });
});

describe("getPanelStyles", () => {
  const mockConfig = {
    width: 420,
    maxWidth: "90vw",
    zIndex: 100,
  } as ResolvedConfig;

  it("positions bottom panel with left/right/bottom anchors", () => {
    const styles = getPanelStyles("bottom", mockConfig, 0);
    expect(styles.position).toBe("fixed");
    expect(styles.left).toBe(0);
    expect(styles.right).toBe(0);
    expect(styles.bottom).toBe(0);
    expect(styles.maxHeight).toBe("85dvh");
  });

  it("positions right panel with top/right/bottom anchors and width", () => {
    const styles = getPanelStyles("right", mockConfig, 0);
    expect(styles.position).toBe("fixed");
    expect(styles.top).toBe(0);
    expect(styles.right).toBe(0);
    expect(styles.bottom).toBe(0);
    expect(styles.width).toBe(420);
    expect(styles.maxWidth).toBe("90vw");
  });

  it("positions left panel with top/left/bottom anchors and width", () => {
    const styles = getPanelStyles("left", mockConfig, 0);
    expect(styles.position).toBe("fixed");
    expect(styles.top).toBe(0);
    expect(styles.left).toBe(0);
    expect(styles.bottom).toBe(0);
    expect(styles.width).toBe(420);
  });

  it("increments zIndex by index", () => {
    const s0 = getPanelStyles("right", mockConfig, 0);
    const s1 = getPanelStyles("right", mockConfig, 1);
    const s2 = getPanelStyles("right", mockConfig, 2);
    expect(s0.zIndex).toBe(110);
    expect(s1.zIndex).toBe(111);
    expect(s2.zIndex).toBe(112);
  });

  it("sets willChange to transform", () => {
    const styles = getPanelStyles("right", mockConfig, 0);
    expect(styles.willChange).toBe("transform");
  });
});
