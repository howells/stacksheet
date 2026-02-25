import type { SnapPoint } from "./types";

const SNAP_POINT_RE = /^(\d+(?:\.\d+)?)(px|rem|em|vh|%)$/;

/**
 * Resolve a snap point value to pixels given the viewport height.
 * - number 0-1: fraction of viewport (0.5 → 50% of vh)
 * - number > 1: pixel value (300 → 300px)
 * - string: parsed via regex for CSS unit support
 */
function resolveSnapPointPx(point: SnapPoint, viewportHeight: number): number {
  if (typeof point === "number") {
    return point <= 1 ? point * viewportHeight : point;
  }

  if (typeof point === "string") {
    const match = point.match(SNAP_POINT_RE);
    if (!match?.[1]) {
      return 0;
    }
    const value = Number.parseFloat(match[1]);
    const unit = match[2];
    switch (unit) {
      case "px":
        return value;
      case "rem":
      case "em": {
        const fontSize =
          typeof document !== "undefined"
            ? Number.parseFloat(
                getComputedStyle(document.documentElement).fontSize
              )
            : 16;
        return value * fontSize;
      }
      case "vh":
      case "%":
        return (value / 100) * viewportHeight;
      default:
        return 0;
    }
  }

  return 0;
}

/**
 * Resolve all snap points to sorted pixel heights (ascending).
 * Returns an array of heights in px that the drawer should snap to.
 */
export function resolveSnapPoints(
  points: SnapPoint[],
  viewportHeight: number
): number[] {
  if (points.length === 0) {
    return [];
  }

  const resolved = points
    .map((p) => resolveSnapPointPx(p, viewportHeight))
    .filter((px) => px > 0);

  // Sort ascending (smallest snap point first)
  resolved.sort((a, b) => a - b);

  // Deduplicate (1px tolerance)
  const deduped: number[] = [];
  for (const px of resolved) {
    const last = deduped.at(-1);
    if (last === undefined || Math.abs(px - last) > 1) {
      deduped.push(px);
    }
  }

  return deduped;
}

/** Velocity threshold (px/ms) for skipping intermediate snap points */
const SNAP_VELOCITY_THRESHOLD = 0.4;

/** Max velocity to consider for snap offset calculation */
const MAX_SNAP_VELOCITY = 2;

/** Multiplier to convert velocity to pixel offset for snap target */
const SNAP_VELOCITY_MULTIPLIER = 150;

/**
 * Given the current drag offset (from fully open), resolved snap heights,
 * the panel height, and release velocity, find the best snap point index.
 *
 * `dragOffset` is positive in the dismiss direction (downward for bottom sheets).
 * Snap heights are "how tall the drawer should be" (ascending order).
 *
 * Returns -1 if the gesture indicates full dismissal.
 */
export function findSnapTarget(
  dragOffset: number,
  panelHeight: number,
  snapHeights: number[],
  velocity: number,
  currentIndex: number,
  sequential: boolean
): number {
  if (snapHeights.length === 0) {
    return -1;
  }

  // Convert snap heights to offsets from fully open (panelHeight = 0 offset)
  // A smaller snap height = larger offset from top = more closed
  const snapOffsets = snapHeights.map((h) => panelHeight - h);

  // Current position = dragOffset from fully open
  const currentPos = dragOffset;

  if (sequential) {
    // Sequential mode: only snap to adjacent points
    const direction = velocity > 0 ? 1 : -1; // positive = dismissing
    const nextIndex = currentIndex - direction; // snap heights are ascending, so -1 = more closed
    if (nextIndex < 0) {
      return -1; // dismiss
    }
    if (nextIndex >= snapHeights.length) {
      return snapHeights.length - 1; // fully open
    }
    return nextIndex;
  }

  // Velocity-based: project position forward based on velocity
  const velocityOffset =
    Math.abs(velocity) >= SNAP_VELOCITY_THRESHOLD
      ? Math.min(Math.max(velocity, -MAX_SNAP_VELOCITY), MAX_SNAP_VELOCITY) *
        SNAP_VELOCITY_MULTIPLIER
      : 0;

  const projectedPos = currentPos + velocityOffset;

  // Find nearest snap offset to projected position
  const first = snapOffsets[0] ?? 0;
  let bestIndex = 0;
  let bestDist = Math.abs(projectedPos - first);

  for (let i = 1; i < snapOffsets.length; i++) {
    const offset = snapOffsets[i] ?? 0;
    const dist = Math.abs(projectedPos - offset);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }

  // Check if dismissal is closer than (or equal to) any snap point.
  // Ties favor dismiss — the user dragged past the last snap point.
  const dismissDist = Math.abs(projectedPos - panelHeight);
  if (dismissDist <= bestDist) {
    return -1;
  }

  return bestIndex;
}

/**
 * Get the Y offset for a snap point relative to fully open (0 offset).
 * Returns the number of pixels the drawer should be translated down from fully open.
 */
export function getSnapOffset(
  snapIndex: number,
  snapHeights: number[],
  panelHeight: number
): number {
  if (snapIndex < 0 || snapIndex >= snapHeights.length) {
    return 0;
  }
  const targetHeight = snapHeights[snapIndex] ?? 0;
  return panelHeight - targetHeight;
}
