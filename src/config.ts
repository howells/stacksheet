import type {
  ResolvedConfig,
  ResponsiveSide,
  SheetStackConfig,
  StackingConfig,
  SpringConfig,
} from "./types.js";

// ── Defaults ────────────────────────────────────

const DEFAULT_STACKING: StackingConfig = {
  scaleStep: 0.04,
  offsetStep: 24,
  opacityStep: 0.15,
  radius: 12,
  renderThreshold: 5,
};

const DEFAULT_SPRING: SpringConfig = {
  damping: 30,
  stiffness: 170,
  mass: 0.8,
};

const DEFAULT_SIDE: ResponsiveSide = {
  desktop: "right",
  mobile: "bottom",
};

// ── Resolver ────────────────────────────────────

export function resolveConfig(config: SheetStackConfig = {}): ResolvedConfig {
  const side: ResponsiveSide =
    typeof config.side === "string"
      ? { desktop: config.side, mobile: config.side }
      : { ...DEFAULT_SIDE, ...config.side };

  return {
    maxDepth: config.maxDepth ?? Infinity,
    closeOnEscape: config.closeOnEscape ?? true,
    closeOnBackdrop: config.closeOnBackdrop ?? true,
    lockScroll: config.lockScroll ?? true,
    width: config.width ?? 420,
    maxWidth: config.maxWidth ?? "90vw",
    breakpoint: config.breakpoint ?? 768,
    side,
    stacking: { ...DEFAULT_STACKING, ...config.stacking },
    spring: { ...DEFAULT_SPRING, ...config.spring },
    zIndex: config.zIndex ?? 100,
  };
}
