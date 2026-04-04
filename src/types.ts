import type { ComponentType, ReactNode } from "react";

// ── Close reason ────────────────────────────────

/** Why the sheet stack was closed or popped */
export type CloseReason = "escape" | "backdrop" | "swipe" | "programmatic";

// ── Snap points ─────────────────────────────────

/**
 * A snap point for bottom sheets.
 * - `number` 0-1: fraction of viewport height (e.g. 0.5 = 50vh)
 * - `number` > 1: pixel value (e.g. 300 = 300px)
 * - `string`: CSS length (e.g. "148px", "30rem")
 */
export type SnapPoint = number | string;

// ── Theming ─────────────────────────────────────

export interface StacksheetClassNames {
  /** Applied to backdrop overlay */
  backdrop?: string;
  /** Applied to the header bar */
  header?: string;
  /** Applied to each panel container */
  panel?: string;
}

export interface HeaderRenderProps {
  /** `true` when the stack has more than one sheet */
  isNested: boolean;
  /** Pop the top sheet (go back one level) */
  onBack: () => void;
  /** Close the entire sheet stack */
  onClose: () => void;
  /** Current resolved side (left/right/bottom) */
  side: import("./types").Side;
}

export interface SheetPresentationOptions {
  /** Override the dialog aria-label for this specific sheet instance. */
  ariaLabel?: string;
}

// ── Sheet item ──────────────────────────────────

export interface SheetItem<TType extends string = string> {
  /** Optional per-sheet presentation metadata */
  ariaLabel?: string;
  /** Data payload passed when opening the sheet */
  data: Record<string, unknown>;
  /** Unique identifier for this sheet instance */
  id: string;
  /** Sheet type key from the TMap */
  type: TType;
}

// ── Side configuration ──────────────────────────

export type Side = "left" | "right" | "bottom";
export type StacksheetLayout = "classic" | "composable";

export interface ResponsiveSide {
  desktop: Side;
  mobile: Side;
}

export type SideConfig = Side | ResponsiveSide;

// ── Visual config ───────────────────────────────

export interface StackingConfig {
  /** Pixel offset per depth level — shifts panels away from the stack edge (default: 16) */
  offsetStep: number;
  /** Opacity reduction per depth level (default: 0) */
  opacityStep: number;
  /** Border radius applied to stacked panels in px (default: 12) */
  radius: number;
  /** Max depth before content stops rendering (default: 3) */
  renderThreshold: number;
  /** Scale reduction per depth level (default: 0.04) */
  scaleStep: number;
}

export interface SpringConfig {
  /** Damping — higher = less oscillation (default: 30) */
  damping: number;
  /** Mass — higher = more momentum (default: 0.8) */
  mass: number;
  /** Stiffness — higher = snappier (default: 170) */
  stiffness: number;
}

// ── Main config ─────────────────────────────────

export interface StacksheetConfig {
  /** Default aria-label for dialog panels. Default: "Sheet dialog" */
  ariaLabel?: string;
  /** Mobile breakpoint in px. Default: 768 */
  breakpoint?: number;
  /** Close on backdrop click. Default: true */
  closeOnBackdrop?: boolean;
  /** Close on ESC key. Default: true */
  closeOnEscape?: boolean;
  /** Fraction of panel dimension to trigger close (0-1). Default: 0.25 */
  closeThreshold?: number;
  /** Allow any form of dismissal (drag, backdrop, escape). Default: true */
  dismissible?: boolean;

  // ── Drag-to-dismiss ─────────────────────────

  /** Enable drag-to-dismiss. Default: true */
  drag?: boolean;
  /** Lock body scroll when open. Default: true */
  lockScroll?: boolean;
  /** Maximum stack depth. Default: Infinity (unlimited) */
  maxDepth?: number;
  /** Maximum panel width as CSS value. Default: "90vw" */
  maxWidth?: string;

  // ── Modal behavior ──────────────────────────

  /** Modal mode — overlay + scroll lock + focus trap. Default: true */
  modal?: boolean;
  /** Called when the last panel's exit animation completes (stack fully closed) */
  onCloseComplete?: (reason: CloseReason) => void;
  /** Called when the top panel's entrance animation completes */
  onOpenComplete?: () => void;
  /** Called when the active snap point changes. */
  onSnapPointChange?: (index: number) => void;
  /** Scale factor applied to background (0-1). Default: 0.97 */
  scaleBackgroundAmount?: number;

  // ── Body scale effect ───────────────────────

  /** Scale down [data-stacksheet-wrapper] when sheets open. Default: false */
  shouldScaleBackground?: boolean;
  /** Show backdrop overlay when open. Default: true */
  showOverlay?: boolean;
  /** Sheet slide-from side. Default: { desktop: "right", mobile: "bottom" } */
  side?: SideConfig;
  /** Currently active snap point index (controlled). */
  snapPointIndex?: number;

  // ── Snap points (bottom sheets only) ────────

  /** Snap positions for bottom sheets. Numbers 0-1 = viewport fraction, >1 = px, strings = CSS lengths. */
  snapPoints?: SnapPoint[];
  /** When true, velocity can't skip intermediate snap points. Default: false */
  snapToSequentialPoints?: boolean;
  /** Spring animation parameters — preset name or custom config */
  spring?: import("./springs").SpringPreset | Partial<SpringConfig>;
  /** Stacking visual parameters */
  stacking?: Partial<StackingConfig>;
  /** Velocity threshold (px/ms) to trigger close. Default: 0.5 */
  velocityThreshold?: number;
  /** Panel width in px. Default: 420 */
  width?: number;
  /** Base z-index. Default: 100 */
  zIndex?: number;
}

/** Fully resolved config — all fields required */
export interface ResolvedConfig {
  ariaLabel: string;
  breakpoint: number;
  closeOnBackdrop: boolean;
  closeOnEscape: boolean;
  closeThreshold: number;
  dismissible: boolean;
  drag: boolean;
  lockScroll: boolean;
  maxDepth: number;
  maxWidth: string;
  modal: boolean;
  onCloseComplete?: (reason: CloseReason) => void;
  onOpenComplete?: () => void;
  onSnapPointChange?: (index: number) => void;
  scaleBackgroundAmount: number;
  shouldScaleBackground: boolean;
  showOverlay: boolean;
  side: ResponsiveSide;
  snapPointIndex?: number;
  snapPoints: SnapPoint[];
  snapToSequentialPoints: boolean;
  spring: SpringConfig;
  stacking: StackingConfig;
  velocityThreshold: number;
  width: number;
  zIndex: number;
}

// ── Content component types ─────────────────────

/** Component rendered inside a sheet panel — receives data as spread props */
export type SheetContentComponent<TData = unknown> = ComponentType<
  TData extends Record<string, unknown> ? TData : Record<string, unknown>
>;

/** Map of sheet type → content component */
export type ContentMap<TMap extends object> = {
  [K in keyof TMap]: SheetContentComponent<TMap[K]>;
};

// ── Store state + actions ───────────────────────

export interface StacksheetSnapshot<TMap extends object> {
  /** Whether any sheets are currently visible */
  isOpen: boolean;
  /** Current sheet stack, ordered bottom to top */
  stack: SheetItem<Extract<keyof TMap, string>>[];
}

export interface SheetActions<TMap extends object> {
  /** Clear entire stack */
  close(): void;

  /** Smart: empty→open, same type on top→replace, different→push */
  navigate<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K],
    options?: SheetPresentationOptions
  ): void;
  /** Smart navigate with an ad-hoc component */
  navigate<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    data: TData,
    options?: SheetPresentationOptions
  ): void;
  /** Smart navigate with an ad-hoc component (explicit id) */
  navigate<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    id: string,
    data: TData,
    options?: SheetPresentationOptions
  ): void;
  /** Replace stack with a single item */
  open<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K],
    options?: SheetPresentationOptions
  ): void;
  /** Replace stack with an ad-hoc component */
  open<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    data: TData,
    options?: SheetPresentationOptions
  ): void;
  /** Replace stack with an ad-hoc component (explicit id) */
  open<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    id: string,
    data: TData,
    options?: SheetPresentationOptions
  ): void;
  /** Pop top item; close if last */
  pop(): void;

  /** Push onto stack (replaces top at maxDepth) */
  push<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K],
    options?: SheetPresentationOptions
  ): void;
  /** Push an ad-hoc component onto the stack */
  push<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    data: TData,
    options?: SheetPresentationOptions
  ): void;
  /** Push an ad-hoc component onto the stack (explicit id) */
  push<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    id: string,
    data: TData,
    options?: SheetPresentationOptions
  ): void;

  /** Remove a specific sheet by id; close if last */
  remove(id: string): void;

  /** Swap the top item */
  replace<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K],
    options?: SheetPresentationOptions
  ): void;
  /** Swap the top item with an ad-hoc component */
  replace<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    data: TData,
    options?: SheetPresentationOptions
  ): void;
  /** Swap the top item with an ad-hoc component (explicit id) */
  replace<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    id: string,
    data: TData,
    options?: SheetPresentationOptions
  ): void;

  /** Update data on a sheet by id (no animation) */
  setData<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Update data on an ad-hoc sheet by id */
  setData<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    id: string,
    data: TData
  ): void;

  /** Swap the top item's content in place (no animation) */
  swap<K extends Extract<keyof TMap, string>>(
    type: K,
    data: TMap[K],
    options?: SheetPresentationOptions
  ): void;
  /** Swap the top item's content with an ad-hoc component (no animation) */
  swap<TData extends Record<string, unknown>>(
    component: ComponentType<TData>,
    data: TData,
    options?: SheetPresentationOptions
  ): void;
}

// ── Factory return type ─────────────────────────

export interface StacksheetProviderProps<TMap extends object> {
  /** Your application content */
  children: ReactNode;
  /** CSS class overrides for backdrop, panel, and header */
  classNames?: StacksheetClassNames;
  /** Panel layout mode. `composable` disables the auto header and scroll wrapper. */
  layout?: StacksheetLayout;
  /**
   * Controls the classic-mode header rendering.
   * - `undefined` — renders the default close/back header (classic mode)
   * - `function` — custom header renderer (classic mode with custom header)
   * - `false` — legacy alias for composable mode. Prefer `layout="composable"`.
   */
  renderHeader?: false | ((props: HeaderRenderProps) => ReactNode);
  /** Map of sheet type keys to content components (optional — only needed for type registry pattern) */
  sheets?: ContentMap<TMap>;
}

export interface StacksheetInstance<TMap extends object> {
  /** Provider component — wrap your app, pass sheets map */
  StacksheetProvider: ComponentType<StacksheetProviderProps<TMap>>;
  /** Raw Zustand store for advanced use */
  store: import("zustand").StoreApi<
    StacksheetSnapshot<TMap> & SheetActions<TMap>
  >;
  /** Hook returning sheet actions */
  useSheet: () => SheetActions<TMap>;
  /** Hook returning sheet state (stack, isOpen) */
  useStacksheetState: () => StacksheetSnapshot<TMap>;
}
