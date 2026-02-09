export { createSheetStack } from "./create.js";
export { resolveConfig } from "./config.js";
export { getStackTransform, getSlideFrom, getPanelStyles } from "./stacking.js";
export { useIsMobile, useResolvedSide } from "./media.js";

export type {
  // Core types
  SheetItem,
  Side,
  ResponsiveSide,
  SideConfig,
  // Config
  StackingConfig,
  SpringConfig,
  SheetStackConfig,
  ResolvedConfig,
  // Components
  SheetContentComponent,
  ContentMap,
  // Store
  SheetSnapshot,
  SheetActions,
  // Factory
  SheetStackInstance,
} from "./types.js";
