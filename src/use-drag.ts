import type { MotionValue } from "motion/react";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import { findSnapTarget } from "./snap-points";
import type { Side } from "./types";

export interface DragConfig {
  /** Enable drag-to-dismiss. Default: true */
  enabled: boolean;
  /** Fraction of panel dimension to trigger close (0-1). Default: 0.25 */
  closeThreshold: number;
  /** Velocity threshold (px/ms) to trigger close. Default: 0.5 */
  velocityThreshold: number;
  /** Side the panel is on — determines drag direction */
  side: Side;
  /** Callback when drag ends and close should fire */
  onClose: () => void;
  /** Callback when drag ends and pop should fire */
  onPop: () => void;
  /** Whether the stack has >1 sheet (swipe pops instead of closing) */
  isNested: boolean;
  /** Resolved snap point heights in px (sorted ascending). Empty = no snap points. */
  snapHeights: number[];
  /** Current active snap point index */
  activeSnapIndex: number;
  /** Called when snap target changes on release */
  onSnap: (index: number) => void;
  /** When true, can't skip intermediate snap points */
  sequential: boolean;
}

export interface DragCallbacks {
  /** MotionValue to update with the drag offset (bypasses React rendering) */
  dragOffset: MotionValue<number>;
  /** Called when a drag gesture starts */
  onDragStart: () => void;
  /** Called when a drag gesture ends */
  onDragEnd: () => void;
}

/** Elements that should never initiate a drag */
const INTERACTIVE_TAGS = new Set([
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "BUTTON",
  "A",
]);

function isInteractiveElement(el: Element): boolean {
  if (INTERACTIVE_TAGS.has(el.tagName)) {
    return true;
  }
  if ((el as HTMLElement).isContentEditable) {
    return true;
  }
  // Children of interactive elements (e.g. SVG inside button, span inside link)
  if (el.closest("button, a, input, textarea, select, [contenteditable]")) {
    return true;
  }
  if (el.closest("[data-stacksheet-no-drag]")) {
    return true;
  }
  return false;
}

/**
 * Walk up from `el` to find the nearest scrollable ancestor.
 * Returns null if nothing is scrollable in the dismiss axis.
 */
function findScrollableAncestor(el: Element, axis: "x" | "y"): Element | null {
  let current: Element | null = el;
  while (current) {
    if (current instanceof HTMLElement) {
      const style = getComputedStyle(current);
      const overflow = axis === "y" ? style.overflowY : style.overflowX;
      if (overflow === "auto" || overflow === "scroll") {
        const scrollable =
          axis === "y"
            ? current.scrollHeight > current.clientHeight
            : current.scrollWidth > current.clientWidth;
        if (scrollable) {
          return current;
        }
      }
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Check if a scrollable element is at its edge in the dismiss direction.
 * For bottom sheets (sign=1, axis=y), "at edge" means scrolled to top.
 * For left panels (sign=-1, axis=x), "at edge" means scrolled to right end.
 */
function isAtScrollEdge(el: Element, axis: "x" | "y", sign: 1 | -1): boolean {
  if (axis === "y") {
    // Dismiss down (sign=1): at edge when scrollTop ≈ 0
    // Dismiss up (sign=-1): at edge when scrolled to bottom
    return sign === 1
      ? el.scrollTop <= 0
      : el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  }
  return sign === 1
    ? el.scrollLeft <= 0
    : el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
}

/**
 * Get the dismiss direction axis and sign for a given side.
 * - right panel → dismiss by dragging right (+x)
 * - left panel → dismiss by dragging left (-x)
 * - bottom panel → dismiss by dragging down (+y)
 */
function getDismissAxis(side: Side): {
  axis: "x" | "y";
  sign: 1 | -1;
} {
  switch (side) {
    case "right":
      return { axis: "x", sign: 1 };
    case "left":
      return { axis: "x", sign: -1 };
    case "bottom":
      return { axis: "y", sign: 1 };
    default:
      return { axis: "x", sign: 1 };
  }
}

/** Dead zone in px before committing to drag vs text selection */
const DEAD_ZONE = 10;

/** Max angle (degrees) from dismiss axis to qualify as drag intent */
const MAX_ANGLE_DEG = 35;

/** Rubber-band resistance factor for dragging past resting position */
const RUBBER_BAND_FACTOR = 0.6;

/**
 * Decide whether a gesture past the dead zone qualifies as a dismiss drag.
 * Returns "drag" if it's a valid dismiss gesture, "none" if it's off-axis
 * or moving in the wrong direction.
 */
function classifyGesture(
  dx: number,
  dy: number,
  axis: "x" | "y",
  sign: 1 | -1
): "drag" | "none" {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Compute angle between movement vector and dismiss axis
  let angleDeg: number;
  if (axis === "y") {
    angleDeg = absDy === 0 ? 90 : (Math.atan(absDx / absDy) * 180) / Math.PI;
  } else {
    angleDeg = absDx === 0 ? 90 : (Math.atan(absDy / absDx) * 180) / Math.PI;
  }

  if (angleDeg > MAX_ANGLE_DEG) {
    return "none";
  }

  // Must be moving in the dismiss direction
  const moveInAxis = axis === "x" ? dx : dy;
  if (moveInAxis * sign < 0) {
    return "none";
  }

  return "drag";
}

/** Decide whether a pointer gesture commits as a drag or should be ignored. */
function commitGesture(
  dx: number,
  dy: number,
  axis: "x" | "y",
  sign: 1 | -1,
  scrollEl: Element | null
): "drag" | "none" {
  const gesture = classifyGesture(dx, dy, axis, sign);
  if (gesture === "none") {
    return "none";
  }
  if (scrollEl && !isAtScrollEdge(scrollEl, axis, sign)) {
    return "none";
  }
  return "drag";
}

function getPanelDimension(
  panel: HTMLDivElement | null,
  axis: "x" | "y"
): number {
  if (!panel) {
    return 300;
  }
  return axis === "x" ? panel.offsetWidth : panel.offsetHeight;
}

/**
 * Hook that manages drag-to-dismiss for a sheet panel.
 *
 * Gesture pipeline:
 * 1. Dead zone (10px) — ignores micro-movements
 * 2. Angle check (35°) — must be roughly aligned with dismiss axis
 * 3. Scroll conflict — yields to scrollable containers not at edge
 * 4. Commit — drag is active, applies offset via `onDragUpdate`
 * 5. Release — velocity + threshold determine close/snap/bounce-back
 *
 * Opposite-direction drag uses √(offset) damping for elastic
 * rubber-band resistance (same physics as iOS over-scroll).
 *
 * When `snapHeights` is provided, release targeting uses
 * `findSnapTarget()` instead of the simple threshold check.
 */
export function useDrag(
  panelRef: RefObject<HTMLDivElement | null>,
  config: DragConfig,
  callbacks: DragCallbacks
) {
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const committedRef = useRef<"drag" | "none" | null>(null);
  const offsetRef = useRef(0);
  const isDraggingRef = useRef(false);
  const scrollTargetRef = useRef<Element | null>(null);

  const { axis, sign } = getDismissAxis(config.side);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (!config.enabled) {
        return;
      }
      // Only primary button
      if (e.button !== 0) {
        return;
      }
      // Check target element
      const target = e.target as Element;
      if (!target) {
        return;
      }

      // Allow drag from handle elements always
      const isHandle = !!target.closest("[data-stacksheet-handle]");

      // For non-handle areas, check if the target is interactive
      if (!isHandle && isInteractiveElement(target)) {
        return;
      }

      // Track nearest scrollable ancestor — checked at commit time
      scrollTargetRef.current = isHandle
        ? null
        : findScrollableAncestor(target, axis);

      startRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      committedRef.current = null;
      offsetRef.current = 0;

      // Capture pointer for reliable move/up outside the element
      (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
    },
    [config.enabled, axis]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!startRef.current) {
        return;
      }

      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Still in dead zone — don't commit yet
      if (committedRef.current === null && dist < DEAD_ZONE) {
        return;
      }

      // Commit decision: check direction + scroll state
      if (committedRef.current === null) {
        committedRef.current = commitGesture(
          dx,
          dy,
          axis,
          sign,
          scrollTargetRef.current
        );
        if (committedRef.current !== "drag") {
          startRef.current = null;
          return;
        }
      }

      if (committedRef.current !== "drag") {
        return;
      }

      // Calculate offset in dismiss direction
      const rawOffset = axis === "x" ? dx : dy;
      const directional = rawOffset * sign;

      // Dismiss direction: linear movement. Opposite direction: √ damping
      // for elastic rubber-band resistance (same math as iOS over-scroll).
      const clampedOffset =
        directional >= 0
          ? directional
          : -Math.sqrt(Math.abs(directional)) * RUBBER_BAND_FACTOR;

      offsetRef.current = clampedOffset;
      callbacks.dragOffset.set(clampedOffset);
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        callbacks.onDragStart();
      }

      // Prevent text selection during active drag
      e.preventDefault();
    },
    [axis, sign, callbacks]
  );

  const dismiss = useCallback(() => {
    if (config.isNested) {
      config.onPop();
    } else {
      config.onClose();
    }
    callbacks.dragOffset.set(0);
    isDraggingRef.current = false;
    callbacks.onDragEnd();
  }, [config, callbacks]);

  const handlePointerUp = useCallback(
    (_e: PointerEvent) => {
      if (!startRef.current || committedRef.current !== "drag") {
        startRef.current = null;
        committedRef.current = null;
        scrollTargetRef.current = null;
        return;
      }

      const offset = Math.max(0, offsetRef.current);
      const elapsed = Date.now() - startRef.current.time;
      const velocity = elapsed > 0 ? offset / elapsed : 0;

      startRef.current = null;
      committedRef.current = null;
      offsetRef.current = 0;
      scrollTargetRef.current = null;

      const panelSize = getPanelDimension(panelRef.current, axis);

      // Snap points mode
      if (config.snapHeights.length > 0) {
        const targetIndex = findSnapTarget(
          offset,
          panelSize,
          config.snapHeights,
          velocity,
          config.activeSnapIndex,
          config.sequential
        );
        if (targetIndex === -1) {
          dismiss();
        } else {
          config.onSnap(targetIndex);
          callbacks.dragOffset.set(0);
          isDraggingRef.current = false;
          callbacks.onDragEnd();
        }
        return;
      }

      // Standard mode: threshold-based close
      const pastThreshold = offset / panelSize > config.closeThreshold;
      const fastEnough = velocity > config.velocityThreshold;
      if (pastThreshold || fastEnough) {
        dismiss();
      } else {
        callbacks.dragOffset.set(0);
        isDraggingRef.current = false;
        callbacks.onDragEnd();
      }
    },
    [panelRef, axis, config, callbacks, dismiss]
  );

  const handlePointerCancel = useCallback(() => {
    startRef.current = null;
    committedRef.current = null;
    offsetRef.current = 0;
    scrollTargetRef.current = null;
    callbacks.dragOffset.set(0);
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      callbacks.onDragEnd();
    }
  }, [callbacks]);

  // Attach pointer events to the panel element
  useEffect(() => {
    const el = panelRef.current;
    if (!(el && config.enabled)) {
      return;
    }

    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerup", handlePointerUp);
      el.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [
    panelRef,
    config.enabled,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  ]);
}
