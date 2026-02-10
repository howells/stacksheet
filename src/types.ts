import type { ComponentType, ReactNode } from "react";

// ── Ad-hoc component push ──────────────────────

/** Props shape for a sheet content component */
export interface SheetComponentProps<TData = Record<string, unknown>> {
  data: TData;
  onClose: () => void;
}

// ── Theming ─────────────────────────────────────

export interface SheetClassNames {
  /** Applied to backdrop overlay */
  backdrop?: string;
  /** Applied to each panel container */
  panel?: string;
  /** Applied to the header bar */
  header?: string;
}

export interface HeaderRenderProps {
  /** `true` when the stack has more than one sheet */
  isNested: boolean;
  /** Pop the top sheet (go back one level) */
  onBack: () => void;
  /** Close the entire sheet stack */
  onClose: () => void;
}

// ── Sheet item ──────────────────────────────────

export interface SheetItem<TType extends string = string> {
  /** Unique identifier for this sheet instance */
  id: string;
  /** Sheet type key from the TMap */
  type: TType;
  /** Data payload passed when opening the sheet */
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
  /** Opacity reduction per depth level (default: 0) */
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
  /** Show backdrop overlay when open. Default: true */
  showOverlay?: boolean;
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
  /** Spring animation parameters — preset name or custom config */
  spring?: import("./springs").SpringPreset | Partial<SpringConfig>;
  /** Base z-index. Default: 100 */
  zIndex?: number;
  /** Default aria-label for dialog panels. Default: "Sheet dialog" */
  ariaLabel?: string;
  /** Called when the top panel's entrance animation completes */
  onOpenComplete?: () => void;
  /** Called when the last panel's exit animation completes (stack fully closed) */
  onCloseComplete?: () => void;
}

/** Fully resolved config — all fields required */
export interface ResolvedConfig {
  maxDepth: number;
  closeOnEscape: boolean;
  closeOnBackdrop: boolean;
  showOverlay: boolean;
  lockScroll: boolean;
  width: number;
  maxWidth: string;
  breakpoint: number;
  side: ResponsiveSide;
  stacking: StackingConfig;
  spring: SpringConfig;
  zIndex: number;
  ariaLabel: string;
  onOpenComplete?: () => void;
  onCloseComplete?: () => void;
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
  /** Current sheet stack, ordered bottom to top */
  stack: SheetItem<Extract<keyof TMap, string>>[];
  /** Whether any sheets are currently visible */
  isOpen: boolean;
}

export interface SheetActions<TMap extends Record<string, unknown>> {
  /** Replace stack with a single item */
  open<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Replace stack with an ad-hoc component */
  open<TData extends Record<string, unknown>>(
    component: ComponentType<SheetComponentProps<TData>>,
    data: TData
  ): void;
  /** Replace stack with an ad-hoc component (explicit id) */
  open<TData extends Record<string, unknown>>(
    component: ComponentType<SheetComponentProps<TData>>,
    id: string,
    data: TData
  ): void;

  /** Push onto stack (replaces top at maxDepth) */
  push<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Push an ad-hoc component onto the stack */
  push<TData extends Record<string, unknown>>(
    component: ComponentType<SheetComponentProps<TData>>,
    data: TData
  ): void;
  /** Push an ad-hoc component onto the stack (explicit id) */
  push<TData extends Record<string, unknown>>(
    component: ComponentType<SheetComponentProps<TData>>,
    id: string,
    data: TData
  ): void;

  /** Swap the top item */
  replace<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Swap the top item with an ad-hoc component */
  replace<TData extends Record<string, unknown>>(
    component: ComponentType<SheetComponentProps<TData>>,
    data: TData
  ): void;
  /** Swap the top item with an ad-hoc component (explicit id) */
  replace<TData extends Record<string, unknown>>(
    component: ComponentType<SheetComponentProps<TData>>,
    id: string,
    data: TData
  ): void;

  /** Smart: empty→open, same type on top→replace, different→push */
  navigate<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Smart navigate with an ad-hoc component */
  navigate<TData extends Record<string, unknown>>(
    component: ComponentType<SheetComponentProps<TData>>,
    data: TData
  ): void;
  /** Smart navigate with an ad-hoc component (explicit id) */
  navigate<TData extends Record<string, unknown>>(
    component: ComponentType<SheetComponentProps<TData>>,
    id: string,
    data: TData
  ): void;

  /** Update data on a sheet by id (no animation) */
  setData<K extends Extract<keyof TMap, string>>(
    type: K,
    id: string,
    data: TMap[K]
  ): void;
  /** Update data on an ad-hoc sheet by id */
  setData<TData extends Record<string, unknown>>(
    component: ComponentType<SheetComponentProps<TData>>,
    id: string,
    data: TData
  ): void;

  /** Remove a specific sheet by id; close if last */
  remove(id: string): void;
  /** Pop top item; close if last */
  pop(): void;
  /** Clear entire stack */
  close(): void;
}

// ── Factory return type ─────────────────────────

export interface SheetProviderProps<TMap extends Record<string, unknown>> {
  /** Map of sheet type keys to content components */
  content: ContentMap<TMap>;
  /** Your application content */
  children: ReactNode;
  /** CSS class overrides for backdrop, panel, and header */
  classNames?: SheetClassNames;
  /** Custom header renderer — replaces the default back/close buttons */
  renderHeader?: (props: HeaderRenderProps) => ReactNode;
}

export interface SheetStackInstance<TMap extends Record<string, unknown>> {
  /** Provider component — wrap your app, pass content map */
  SheetStackProvider: ComponentType<SheetProviderProps<TMap>>;
  /** Hook returning sheet actions */
  useSheetStack: () => SheetActions<TMap>;
  /** Hook returning sheet state (stack, isOpen) */
  useSheetStackState: () => SheetSnapshot<TMap>;
  /** Raw Zustand store for advanced use */
  store: import("zustand").StoreApi<SheetSnapshot<TMap> & SheetActions<TMap>>;
}
