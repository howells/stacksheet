import { springs } from "./springs";
import type {
  ResolvedConfig,
  ResponsiveSide,
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

// ── Resolver ────────────────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: config resolution is flat field mapping
export function resolveConfig(config: StacksheetConfig = {}): ResolvedConfig {
  const side: ResponsiveSide =
    typeof config.side === "string"
      ? { desktop: config.side, mobile: config.side }
      : { ...DEFAULT_SIDE, ...config.side };

  const spring =
    typeof config.spring === "string"
      ? springs[config.spring]
      : { ...springs.stiff, ...config.spring };

  return {
    maxDepth: config.maxDepth ?? Number.POSITIVE_INFINITY,
    closeOnEscape: config.closeOnEscape ?? true,
    closeOnBackdrop: config.closeOnBackdrop ?? true,
    showOverlay: config.showOverlay ?? true,
    lockScroll: config.lockScroll ?? true,
    width: config.width ?? 420,
    maxWidth: config.maxWidth ?? "90vw",
    breakpoint: config.breakpoint ?? 768,
    side,
    stacking: { ...DEFAULT_STACKING, ...config.stacking },
    spring,
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
