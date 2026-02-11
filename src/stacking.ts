import type { CSSProperties } from "react";
import type { ResolvedConfig, Side, StackingConfig } from "./types";

// ── Depth transforms ────────────────────────────

export interface StackTransform {
  scale: number;
  offset: number;
  opacity: number;
  borderRadius: number;
}

/**
 * Compute visual transforms for a panel at a given depth.
 * depth=0 is the top (foreground) panel.
 * Panels beyond renderThreshold are clamped to the edge position and faded out.
 */
export function getStackTransform(
  depth: number,
  stacking: StackingConfig
): StackTransform {
  if (depth <= 0) {
    return { scale: 1, offset: 0, opacity: 1, borderRadius: 0 };
  }

  const beyondThreshold = depth >= stacking.renderThreshold;
  // Clamp visual depth so panels beyond threshold stay at the edge position
  const visualDepth = beyondThreshold ? stacking.renderThreshold - 1 : depth;

  return {
    scale: Math.max(0.5, 1 - visualDepth * stacking.scaleStep),
    offset: visualDepth * stacking.offsetStep,
    opacity: beyondThreshold
      ? 0
      : Math.max(0, 1 - visualDepth * stacking.opacityStep),
    borderRadius: stacking.radius,
  };
}

/**
 * Border radius values for the animate target.
 * Must be animated (not static CSS) so Motion applies scale correction
 * when panels are scaled. See: https://motion.dev/docs/react-layout-animations#scale-correction
 */
export function getAnimatedBorderRadius(
  side: Side,
  depth: number,
  stacking: StackingConfig
): Record<string, number> {
  if (side === "bottom") {
    const radius = depth > 0 ? stacking.radius : 16;
    return {
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    };
  }

  // Left/right panels: stacked panels get uniform radius, top panel gets none
  if (depth > 0) {
    return { borderRadius: stacking.radius };
  }
  return { borderRadius: 0 };
}

// ── Slide directions ────────────────────────────

export interface SlideValues {
  x?: string | number;
  y?: string | number;
}

/** Motion initial/exit values for sliding from the given side. */
export function getSlideFrom(side: Side): SlideValues {
  switch (side) {
    case "right":
      return { x: "100%" };
    case "left":
      return { x: "-100%" };
    case "bottom":
      return { y: "100%" };
    default:
      return { x: "100%" };
  }
}

/** Motion animate target — the resting position. */
export function getSlideTarget(): SlideValues {
  return { x: 0, y: 0 };
}

// ── Panel positioning ───────────────────────────

/**
 * Fixed-position styles for a panel, accounting for side, width, and depth.
 */
export function getPanelStyles(
  side: Side,
  config: ResolvedConfig,
  _depth: number,
  index: number
): CSSProperties {
  const { width, maxWidth, zIndex } = config;
  const base: CSSProperties = {
    position: "fixed",
    zIndex: zIndex + 10 + index,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    willChange: "transform",
    transformOrigin: side === "bottom" ? "center bottom" : `${side} center`,
  };

  if (side === "bottom") {
    return {
      ...base,
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: "85vh",
      // borderRadius is animated via Motion's animate prop for scale correction
    };
  }

  // Left or right side panel
  const sideStyles: CSSProperties =
    side === "right"
      ? { top: 0, right: 0, bottom: 0 }
      : { top: 0, left: 0, bottom: 0 };

  return {
    ...base,
    ...sideStyles,
    width,
    maxWidth,
  };
}
