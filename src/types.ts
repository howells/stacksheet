import type { ComponentType } from "react";

// ── Sheet item ──────────────────────────────────

export interface SheetItem<TType extends string = string> {
  id: string;
  type: TType;
  data: Record<string, unknown>;
}

// ── Side configuration ──────────────────────────

export type Side = "left" | "right" | "bottom";

export interface ResponsiveSide {
  desktop: Side;
  mobile: Side;
}

export type SideConfig = Side | ResponsiveSide;

// ── Visual config ───────────────────────────────

export interface StackingConfig {
  /** Scale reduction per depth level (default: 0.04) */
  scaleStep: number;
  /** Horizontal/vertical offset per depth level in px (default: 24) */
  offsetStep: number;
  /** Opacity reduction per depth level (default: 0.15) */
  opacityStep: number;
  /** Border radius applied to stacked panels in px (default: 12) */
  radius: number;
  /** Max depth before content stops rendering (default: 5) */
  renderThreshold: number;
}

export interface SpringConfig {
  /** Damping — higher = less oscillation (default: 30) */
  damping: number;
  /** Stiffness — higher = snappier (default: 170) */
  stiffness: number;
  /** Mass — higher = more momentum (default: 0.8) */
  mass: number;
}

// ── Main config ─────────────────────────────────

export interface SheetStackConfig {
  /** Maximum stack depth. Default: Infinity (unlimited) */
  maxDepth?: number;
  /** Close on ESC key. Default: true */
  closeOnEscape?: boolean;
  /** Close on backdrop click. Default: true */
  closeOnBackdrop?: boolean;
  /** Lock body scroll when open. Default: true */
  lockScroll?: boolean;
  /** Panel width in px. Default: 420 */
  width?: number;
  /** Maximum panel width as CSS value. Default: "90vw" */
  maxWidth?: string;
  /** Mobile breakpoint in px. Default: 768 */
  breakpoint?: number;
  /** Sheet slide-from side. Default: { desktop: "right", mobile: "bottom" } */
  side?: SideConfig;
  /** Stacking visual parameters */
  stacking?: Partial<StackingConfig>;
  /** Spring animation parameters */
  spring?: Partial<SpringConfig>;
  /** Base z-index. Default: 100 */
  zIndex?: number;
}

/** Fully resolved config — all fields required */
export interface ResolvedConfig {
  maxDepth: number;
  closeOnEscape: boolean;
  closeOnBackdrop: boolean;
  lockScroll: boolean;
  width: number;
  maxWidth: string;
  breakpoint: number;
  side: ResponsiveSide;
  stacking: StackingConfig;
  spring: SpringConfig;
  zIndex: number;
}

// ── Content component types ─────────────────────

/** Component rendered inside a sheet panel */
export type SheetContentComponent<TData = unknown> = ComponentType<{
  data: TData;
  onClose: () => void;
}>;

/** Map of sheet type → content component */
export type ContentMap<TMap extends Record<string, unknown>> = {
  [K in keyof TMap]: SheetContentComponent<TMap[K]>;
};

// ── Store state + actions ───────────────────────

export interface SheetSnapshot<TMap extends Record<string, unknown>> {
  stack: SheetItem<Extract<keyof TMap, string>>[];
  isOpen: boolean;
}

export interface SheetActions<TMap extends Record<string, unknown>> {
  /** Replace stack with a single item */
  open<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Push onto stack (replaces top at maxDepth) */
  push<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Swap the top item */
  replace<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Smart: empty→open, same type on top→replace, different→push */
  navigate<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Pop top item; close if last */
  pop(): void;
  /** Clear entire stack */
  close(): void;
}

// ── Factory return type ─────────────────────────

export interface SheetStackInstance<TMap extends Record<string, unknown>> {
  /** Provider component — wrap your app, pass content map */
  SheetProvider: ComponentType<{
    content: ContentMap<TMap>;
    children: React.ReactNode;
  }>;
  /** Hook returning sheet actions */
  useSheet: () => SheetActions<TMap>;
  /** Hook returning sheet state (stack, isOpen) */
  useSheetState: () => SheetSnapshot<TMap>;
  /** Raw Zustand store for advanced use */
  store: import("zustand").StoreApi<SheetSnapshot<TMap> & SheetActions<TMap>>;
}
