import type { SpringPreset } from "./springs";
import { springs } from "./springs";
import type {
  ResolvedConfig,
  ResponsiveSide,
  SideConfig,
  SpringConfig,
  StackingConfig,
  StacksheetConfig,
} from "./types";

// ── Defaults ────────────────────────────────────

const DEFAULT_STACKING: StackingConfig = {
  scaleStep: 0.04,
  offsetStep: 16,
  opacityStep: 0,
  radius: 12,
  renderThreshold: 3,
};

const DEFAULT_SIDE: ResponsiveSide = {
  desktop: "right",
  mobile: "bottom",
};

// ── Helpers ─────────────────────────────────────

/** Normalize a string side to a responsive object, merging with defaults. */
function resolveSide(side: SideConfig | undefined): ResponsiveSide {
  if (typeof side === "string") {
    return { desktop: side, mobile: side };
  }
  return { ...DEFAULT_SIDE, ...side };
}

/** Resolve a preset name to a SpringConfig, or merge partial config with defaults. */
function resolveSpring(
  spring: SpringPreset | Partial<SpringConfig> | undefined
): SpringConfig {
  if (typeof spring === "string") {
    return springs[spring];
  }
  return { ...springs.stiff, ...spring };
}

// ── Resolver ────────────────────────────────────

/** Merge user-provided config with defaults. Resolves union types (side, spring) to concrete values. */
export function resolveConfig(config: StacksheetConfig = {}): ResolvedConfig {
  return {
    maxDepth: config.maxDepth ?? Number.POSITIVE_INFINITY,
    closeOnEscape: config.closeOnEscape ?? true,
    closeOnBackdrop: config.closeOnBackdrop ?? true,
    showOverlay: config.showOverlay ?? true,
    lockScroll: config.lockScroll ?? true,
    width: config.width ?? 420,
    maxWidth: config.maxWidth ?? "90vw",
    breakpoint: config.breakpoint ?? 768,
    side: resolveSide(config.side),
    stacking: { ...DEFAULT_STACKING, ...config.stacking },
    spring: resolveSpring(config.spring),
    zIndex: config.zIndex ?? 100,
    ariaLabel: config.ariaLabel ?? "Sheet dialog",
    onOpenComplete: config.onOpenComplete,
    onCloseComplete: config.onCloseComplete,
    snapPoints: config.snapPoints ?? [],
    snapPointIndex: config.snapPointIndex,
    onSnapPointChange: config.onSnapPointChange,
    snapToSequentialPoints: config.snapToSequentialPoints ?? false,
    drag: config.drag ?? true,
    closeThreshold: config.closeThreshold ?? 0.25,
    velocityThreshold: config.velocityThreshold ?? 0.5,
    dismissible: config.dismissible ?? true,
    modal: config.modal ?? true,
    shouldScaleBackground: config.shouldScaleBackground ?? false,
    scaleBackgroundAmount: config.scaleBackgroundAmount ?? 0.97,
  };
}
