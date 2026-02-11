import { type RefObject, useCallback, useEffect, useRef } from "react";
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
}

export interface DragState {
  /** Current drag offset in the dismiss direction (px) */
  offset: number;
  /** Whether a drag is currently active */
  isDragging: boolean;
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
 * Returns a ref callback for the drag offset, which the caller
 * uses to apply inline transforms during drag. The hook handles
 * pointer events, gesture discrimination, and velocity-based close.
 */
export function useDrag(
  panelRef: RefObject<HTMLDivElement | null>,
  config: DragConfig,
  onDragUpdate: (state: DragState) => void
) {
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const committedRef = useRef<"drag" | "none" | null>(null);
  const offsetRef = useRef(0);

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

      // For non-handle areas, check if the content is scrolled
      // (don't start drag if user might be scrolling)
      if (!isHandle) {
        const scrollable = target.closest("[data-radix-scroll-area-viewport]");
        if (scrollable && scrollable.scrollTop > 0 && axis === "y") {
          return;
        }
      }

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

      // Commit decision: check if movement direction matches dismiss axis
      if (committedRef.current === null) {
        committedRef.current = classifyGesture(dx, dy, axis, sign);
        if (committedRef.current === "none") {
          startRef.current = null;
          return;
        }
      }

      if (committedRef.current !== "drag") {
        return;
      }

      // Calculate offset in dismiss direction
      const rawOffset = axis === "x" ? dx : dy;
      // Only allow positive offset in dismiss direction (can't drag past resting position)
      const clampedOffset = Math.max(0, rawOffset * sign);

      offsetRef.current = clampedOffset;
      onDragUpdate({ offset: clampedOffset, isDragging: true });

      // Prevent text selection during active drag
      e.preventDefault();
    },
    [axis, sign, onDragUpdate]
  );

  const handlePointerUp = useCallback(
    (_e: PointerEvent) => {
      if (!startRef.current || committedRef.current !== "drag") {
        startRef.current = null;
        committedRef.current = null;
        return;
      }

      const offset = offsetRef.current;
      const elapsed = Date.now() - startRef.current.time;
      const velocity = elapsed > 0 ? offset / elapsed : 0;

      startRef.current = null;
      committedRef.current = null;
      offsetRef.current = 0;

      // Determine panel dimension for threshold calculation
      const panelSize = getPanelDimension(panelRef.current, axis);

      const pastThreshold = offset / panelSize > config.closeThreshold;
      const fastEnough = velocity > config.velocityThreshold;

      if (pastThreshold || fastEnough) {
        // Dismiss
        if (config.isNested) {
          config.onPop();
        } else {
          config.onClose();
        }
        // Reset drag state after dismiss
        onDragUpdate({ offset: 0, isDragging: false });
      } else {
        // Snap back
        onDragUpdate({ offset: 0, isDragging: false });
      }
    },
    [
      panelRef,
      axis,
      config.closeThreshold,
      config.velocityThreshold,
      config.isNested,
      config.onClose,
      config.onPop,
      onDragUpdate,
      config,
    ]
  );

  const handlePointerCancel = useCallback(() => {
    startRef.current = null;
    committedRef.current = null;
    offsetRef.current = 0;
    onDragUpdate({ offset: 0, isDragging: false });
  }, [onDragUpdate]);

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
