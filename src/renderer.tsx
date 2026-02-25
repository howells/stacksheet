// CloseWatcher — ambient type for browsers that support it (Chromium 120+)
declare global {
  var CloseWatcher:
    | (new () => { onclose: (() => void) | null; destroy: () => void })
    | undefined;
}

import FocusTrap from "focus-trap-react";
import { AnimatePresence, motion as m, useReducedMotion } from "motion/react";
import {
  type ComponentType,
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RemoveScroll } from "react-remove-scroll";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import { ArrowLeftIcon, XIcon } from "./icons";
import { useResolvedSide } from "./media";
import { SheetPanelContext } from "./panel-context";
import { getSnapOffset, resolveSnapPoints } from "./snap-points";
import {
  getAnimatedBorderRadius,
  getPanelStyles,
  getSlideFrom,
  getSlideTarget,
  getStackOffset,
  getStackTransform,
  type SlideValues,
} from "./stacking";
import type {
  CloseReason,
  ContentMap,
  HeaderRenderProps,
  ResolvedConfig,
  SheetActions,
  SheetItem,
  Side,
  StacksheetClassNames,
  StacksheetSnapshot,
} from "./types";
import { type DragState, useDrag } from "./use-drag";

// ── Default header ──────────────────────────────

function DefaultHeader({
  isNested,
  onBack,
  onClose,
  className,
}: HeaderRenderProps & { className?: string }) {
  return (
    <div
      className={`flex h-14 shrink-0 items-center justify-between border-b px-6 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        {isNested && (
          <button
            aria-label="Back"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-inherit opacity-60 transition-opacity duration-150 hover:opacity-100"
            onClick={onBack}
            type="button"
          >
            <ArrowLeftIcon />
          </button>
        )}
      </div>
      <button
        aria-label="Close"
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-0 text-inherit opacity-60 transition-opacity duration-150 hover:opacity-100"
        onClick={onClose}
        type="button"
      >
        <XIcon />
      </button>
    </div>
  );
}

// ── Resolved classNames ─────────────────────────

type ResolvedClassNames = Required<StacksheetClassNames>;

const EMPTY_CLASSNAMES: ResolvedClassNames = {
  backdrop: "",
  panel: "",
  header: "",
};

function resolveClassNames(cn?: StacksheetClassNames): ResolvedClassNames {
  if (!cn) {
    return EMPTY_CLASSNAMES;
  }
  return {
    backdrop: cn.backdrop ?? "",
    panel: cn.panel ?? "",
    header: cn.header ?? "",
  };
}

// ── Helpers ──────────────────────────────────────

function buildAriaProps(
  isTop: boolean,
  isModal: boolean,
  isComposable: boolean,
  ariaLabel: string,
  panelId: string,
  hasDescription: boolean
): Record<string, string | undefined> {
  if (!isTop) {
    return {};
  }
  const props: Record<string, string | undefined> = { role: "dialog" };
  if (isModal) {
    props["aria-modal"] = "true";
  }
  if (isComposable) {
    props["aria-labelledby"] = `${panelId}-title`;
    if (hasDescription) {
      props["aria-describedby"] = `${panelId}-desc`;
    }
  } else {
    props["aria-label"] = ariaLabel;
  }
  return props;
}

function getDragTransform(
  side: Side,
  offset: number
): { x?: number; y?: number } {
  if (offset === 0) {
    return {};
  }
  switch (side) {
    case "right":
      return { x: offset };
    case "left":
      return { x: -offset };
    case "bottom":
      return { y: offset };
    default:
      return {};
  }
}

/** Shared tween config for non-spring animated properties (border radius, box shadow) */
const VISUAL_TWEEN = {
  type: "tween" as const,
  duration: 0.25,
  ease: "easeOut" as const,
};

// ── Panel helpers (extracted to reduce SheetPanel complexity) ──

/** Measure panel height via ResizeObserver for snap point calculations */
function usePanelHeight(
  panelRef: React.RefObject<HTMLDivElement | null>,
  hasSnapPoints: boolean
): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = panelRef.current;
    if (!(el && hasSnapPoints)) {
      return;
    }
    setHeight(el.offsetHeight);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [panelRef, hasSnapPoints]);

  return height;
}

/** Build the panel's inline style object */
function buildPanelStyle(
  panelStyles: CSSProperties,
  isTop: boolean,
  hasPanelClass: boolean,
  isDragging: boolean
): CSSProperties {
  return {
    ...panelStyles,
    pointerEvents: isTop ? "auto" : "none",
    ...(isTop ? {} : { contain: "layout style paint" }),
    ...(isDragging ? { transition: "none" } : {}),
    ...(hasPanelClass
      ? {}
      : {
          background: "var(--background, #fff)",
          borderColor: "var(--border, transparent)",
        }),
  };
}

/** Build per-property transition config */
function buildPanelTransition(
  isDragging: boolean,
  isTop: boolean,
  spring: Record<string, unknown>,
  stackSpring: Record<string, unknown>
) {
  if (isDragging) {
    return { type: "tween" as const, duration: 0 };
  }

  const base = isTop ? spring : stackSpring;
  return { ...base, borderRadius: VISUAL_TWEEN, boxShadow: VISUAL_TWEEN };
}

/** Compute the Y offset for the current snap point */
function computeSnapYOffset(
  side: Side,
  snapHeights: number[],
  activeSnapIndex: number,
  measuredHeight: number
): number {
  if (side !== "bottom" || snapHeights.length === 0 || measuredHeight <= 0) {
    return 0;
  }
  return getSnapOffset(activeSnapIndex, snapHeights, measuredHeight);
}

function getBottomSlideDistance(measuredHeight: number): number {
  if (measuredHeight > 0) {
    return measuredHeight;
  }
  if (typeof window !== "undefined") {
    return window.innerHeight;
  }
  return 1000;
}

function resolveSlideFrom(
  side: Side,
  slideFrom: SlideValues,
  measuredHeight: number
): SlideValues {
  if (side !== "bottom") {
    return slideFrom;
  }
  return { y: getBottomSlideDistance(measuredHeight) };
}

function buildAnimateTarget(
  slideTarget: SlideValues,
  stackOffset: { x?: number; y?: number },
  dragOffset: { x?: number; y?: number },
  transform: ReturnType<typeof getStackTransform>,
  animatedRadius: Record<string, number>,
  transition: Record<string, unknown>,
  snapYOffset: number,
  isTop: boolean
) {
  const base = {
    ...slideTarget,
    ...stackOffset,
    ...dragOffset,
    scale: transform.scale,
    opacity: transform.opacity,
    ...animatedRadius,
    boxShadow: getShadow(!isTop),
    transition,
  };

  if (snapYOffset > 0) {
    return { ...base, y: (dragOffset.y ?? 0) + snapYOffset };
  }
  return base;
}

// ── Modal focus trap wrapper ────────────────────

/** Wraps children in a focus trap when modal mode is enabled. */
function ModalFocusTrap({
  enabled,
  active,
  fallbackRef,
  children,
}: {
  enabled: boolean;
  active: boolean;
  fallbackRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  if (!enabled) {
    return children;
  }
  return (
    <FocusTrap
      active={active}
      focusTrapOptions={{
        initialFocus: false,
        returnFocusOnDeactivate: true,
        escapeDeactivates: false,
        allowOutsideClick: true,
        checkCanFocusTrap: () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve())
          ),
        fallbackFocus: () => {
          if (fallbackRef.current) {
            return fallbackRef.current;
          }
          return document.body;
        },
      }}
    >
      {children}
    </FocusTrap>
  );
}

// ── SheetPanel ──────────────────────────────────

interface SheetPanelProps {
  item: SheetItem;
  index: number;
  depth: number;
  isTop: boolean;
  isNested: boolean;
  side: Side;
  config: ResolvedConfig;
  classNames: ResolvedClassNames;
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous content component
  Content: ComponentType<any> | undefined;
  shouldRender: boolean;
  pop: () => void;
  close: () => void;
  /** Swipe-specific close — sets reason to "swipe" */
  swipeClose: () => void;
  /** Swipe-specific pop — sets reason to "swipe" */
  swipePop: () => void;
  /** Resolved snap point heights in px (ascending). Empty = no snaps. */
  snapHeights: number[];
  /** Currently active snap index */
  activeSnapIndex: number;
  /** Called when drag release targets a snap point */
  onSnap: (index: number) => void;
  renderHeader?: false | ((props: HeaderRenderProps) => React.ReactNode);
  slideFrom: SlideValues;
  slideTarget: SlideValues;
  spring: Record<string, unknown>;
  stackSpring: Record<string, unknown>;
  /** Whether the user prefers reduced motion */
  prefersReducedMotion: boolean;
}

/** Renders panel inner content — composable mode vs classic (header + scroll) */
function PanelInnerContent({
  isComposable,
  shouldRender,
  Content,
  data,
  renderHeader,
  headerProps,
  headerClassName,
}: {
  isComposable: boolean;
  shouldRender: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous content component
  Content: ComponentType<any> | undefined;
  data: Record<string, unknown>;
  renderHeader?: false | ((props: HeaderRenderProps) => React.ReactNode);
  headerProps: HeaderRenderProps;
  headerClassName: string | undefined;
}) {
  if (isComposable) {
    return shouldRender && Content ? <Content {...data} /> : null;
  }

  return (
    <>
      {renderHeader ? (
        renderHeader(headerProps)
      ) : (
        <DefaultHeader {...headerProps} className={headerClassName} />
      )}
      {shouldRender && Content && (
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          data-stacksheet-no-drag=""
        >
          <Content {...data} />
        </div>
      )}
    </>
  );
}

/** Built-in drag handle for bottom panels — always visible on the top sheet */
function BottomHandle({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <button
      aria-label="Dismiss"
      className="flex w-full shrink-0 cursor-grab touch-none items-center justify-center border-none bg-transparent pt-4 pb-1"
      data-stacksheet-handle=""
      onClick={onDismiss}
      type="button"
    >
      <div aria-hidden="true" className="h-1 w-9 rounded-sm bg-current/25" />
    </button>
  );
}

/** Floating drag handle for left/right side panels */
function SideHandle({
  side,
  isHovered,
  onDismiss,
}: {
  side: Side;
  isHovered: boolean;
  onDismiss?: () => void;
}) {
  const position: CSSProperties =
    side === "right" ? { right: "100%" } : { left: "100%" };

  return (
    <m.div
      animate={{ opacity: isHovered ? 1 : 0 }}
      aria-label="Dismiss"
      className="absolute top-0 bottom-0 flex w-6 cursor-grab touch-none items-center justify-center"
      data-stacksheet-handle=""
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onDismiss?.();
        }
      }}
      role="button"
      style={position}
      tabIndex={0}
      transition={{ duration: isHovered ? 0.15 : 0.4, ease: "easeOut" }}
    >
      <div
        aria-hidden="true"
        className="h-10 w-[5px] rounded-sm bg-current/35 shadow-sm"
      />
    </m.div>
  );
}

const SheetPanel = memo(function SheetPanel({
  item,
  index,
  depth,
  isTop,
  isNested,
  side,
  config,
  classNames,
  Content,
  shouldRender,
  pop,
  close,
  swipeClose,
  swipePop,
  snapHeights,
  activeSnapIndex,
  onSnap,
  renderHeader,
  slideFrom,
  slideTarget,
  spring,
  stackSpring,
  prefersReducedMotion,
}: SheetPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const hasEnteredRef = useRef(false);
  const [dragState, setDragState] = useState<DragState>({
    offset: 0,
    isDragging: false,
  });
  const [isHovered, setIsHovered] = useState(false);

  const measuredHeight = usePanelHeight(panelRef, snapHeights.length > 0);

  const transform = getStackTransform(depth, config.stacking);
  const panelStyles = getPanelStyles(side, config, index);

  // Reset entrance flag when panel moves away from top
  useEffect(() => {
    if (!isTop) {
      hasEnteredRef.current = false;
    }
  }, [isTop]);

  const handleAnimationComplete = useCallback(() => {
    if (isTop && !hasEnteredRef.current) {
      hasEnteredRef.current = true;
      config.onOpenComplete?.();
    }
  }, [isTop, config]);

  // Drag-to-dismiss (only on top panel, disabled when reduced motion is preferred)
  useDrag(
    panelRef,
    {
      enabled:
        isTop && config.drag && config.dismissible && !prefersReducedMotion,
      closeThreshold: config.closeThreshold,
      velocityThreshold: config.velocityThreshold,
      side,
      onClose: swipeClose,
      onPop: swipePop,
      isNested,
      snapHeights,
      activeSnapIndex,
      onSnap,
      sequential: config.snapToSequentialPoints,
    },
    setDragState
  );

  // Per-sheet aria-label: check data.__ariaLabel, fall back to config
  const ariaLabel =
    (typeof item.data?.__ariaLabel === "string"
      ? item.data.__ariaLabel
      : undefined) ?? config.ariaLabel;

  // Panel context for composable parts (Sheet.Close, Sheet.Title, etc.)
  const panelId = `stacksheet-${item.id}`;
  const [hasDescription, setHasDescription] = useState(false);
  const registerDescription = useCallback(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, []);
  const panelContext = useMemo(
    () => ({
      close,
      back: pop,
      isNested,
      isTop,
      panelId,
      side,
      hasDescription,
      registerDescription,
    }),
    [
      close,
      pop,
      isNested,
      isTop,
      panelId,
      side,
      hasDescription,
      registerDescription,
    ]
  );

  const isComposable = renderHeader === false;
  const hasPanelClass = classNames.panel !== "";
  const dragOffset = getDragTransform(side, dragState.offset);
  const panelStyle = buildPanelStyle(
    panelStyles,
    isTop,
    hasPanelClass,
    dragState.isDragging
  );

  const headerProps: HeaderRenderProps = {
    isNested,
    onBack: pop,
    onClose: close,
    side,
  };

  const ariaProps = buildAriaProps(
    isTop,
    config.modal,
    isComposable,
    ariaLabel,
    panelId,
    hasDescription
  );

  const transition = buildPanelTransition(
    dragState.isDragging,
    isTop,
    spring,
    stackSpring
  );

  const animatedRadius = getAnimatedBorderRadius(side, depth, config.stacking);
  const snapYOffset = computeSnapYOffset(
    side,
    snapHeights,
    activeSnapIndex,
    measuredHeight
  );
  const resolvedSlideFrom = resolveSlideFrom(side, slideFrom, measuredHeight);

  // Merge stack offset + drag offset + snap offset into the animate target.
  const stackOffset = getStackOffset(side, transform.offset);
  const animateTarget = buildAnimateTarget(
    slideTarget,
    stackOffset,
    dragOffset,
    transform,
    animatedRadius,
    transition,
    snapYOffset,
    isTop
  );

  const initialRadius = getInitialRadius(side);
  const showSideHandle = isTop && side !== "bottom";
  const showBottomHandle = isTop && side === "bottom";

  const panelContent = (
    <m.div
      animate={animateTarget}
      className={classNames.panel || undefined}
      exit={{
        ...resolvedSlideFrom,
        opacity: 0.6,
        boxShadow: getShadow(false),
        transition: {
          type: "tween",
          duration: prefersReducedMotion ? 0 : 0.24,
          ease: "easeOut",
          boxShadow: VISUAL_TWEEN,
        },
      }}
      initial={{
        ...resolvedSlideFrom,
        opacity: 0.8,
        ...initialRadius,
        boxShadow: getShadow(false),
      }}
      key={item.id}
      onAnimationComplete={handleAnimationComplete}
      onBlur={showSideHandle ? () => setIsHovered(false) : undefined}
      onFocus={showSideHandle ? () => setIsHovered(true) : undefined}
      onMouseEnter={showSideHandle ? () => setIsHovered(true) : undefined}
      onMouseLeave={showSideHandle ? () => setIsHovered(false) : undefined}
      ref={panelRef}
      style={panelStyle}
      tabIndex={isTop ? -1 : undefined}
      {...(isTop ? {} : { "aria-hidden": "true" as const, inert: true })}
      {...ariaProps}
    >
      {showSideHandle && (
        <SideHandle
          isHovered={isHovered}
          onDismiss={isNested ? pop : close}
          side={side}
        />
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
        {showBottomHandle && (
          <BottomHandle onDismiss={isNested ? pop : close} />
        )}
        <PanelInnerContent
          Content={Content}
          data={item.data as Record<string, unknown>}
          headerClassName={classNames.header || undefined}
          headerProps={headerProps}
          isComposable={isComposable}
          renderHeader={renderHeader}
          shouldRender={shouldRender}
        />
      </div>
    </m.div>
  );

  return (
    <SheetPanelContext.Provider value={panelContext}>
      <ModalFocusTrap
        active={isTop}
        enabled={config.modal}
        fallbackRef={panelRef}
      >
        {panelContent}
      </ModalFocusTrap>
    </SheetPanelContext.Provider>
  );
});

// ── Body scale effect ───────────────────────────

function useBodyScale(
  config: ResolvedConfig,
  isOpen: boolean,
  prefersReducedMotion: boolean
) {
  useEffect(() => {
    if (!config.shouldScaleBackground || prefersReducedMotion) {
      return;
    }

    const wrapper = document.querySelector("[data-stacksheet-wrapper]");
    if (!(wrapper && wrapper instanceof HTMLElement)) {
      return;
    }

    if (isOpen) {
      const scale = config.scaleBackgroundAmount;
      wrapper.style.transition =
        "transform 500ms cubic-bezier(0.32, 0.72, 0, 1), border-radius 500ms cubic-bezier(0.32, 0.72, 0, 1)";
      wrapper.style.transform = `scale(${scale})`;
      wrapper.style.borderRadius = "8px";
      wrapper.style.overflow = "hidden";
      wrapper.style.transformOrigin = "center top";
      return;
    }

    wrapper.style.transform = "";
    wrapper.style.borderRadius = "";
    // Clean up after transition completes
    const handleEnd = () => {
      wrapper.style.transition = "";
      wrapper.style.overflow = "";
      wrapper.style.transformOrigin = "";
    };
    wrapper.addEventListener("transitionend", handleEnd, { once: true });
    return () => wrapper.removeEventListener("transitionend", handleEnd);
  }, [
    isOpen,
    config.shouldScaleBackground,
    config.scaleBackgroundAmount,
    prefersReducedMotion,
  ]);
}

// ── Renderer ────────────────────────────────────

interface SheetRendererProps<TMap extends object> {
  store: StoreApi<StacksheetSnapshot<TMap> & SheetActions<TMap>>;
  config: ResolvedConfig;
  sheets: ContentMap<TMap>;
  /** Ad-hoc component map (type key → component) */
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous component storage
  componentMap: Map<string, ComponentType<any>>;
  classNames?: StacksheetClassNames;
  renderHeader?: false | ((props: HeaderRenderProps) => React.ReactNode);
}

/**
 * Root renderer component — manages the backdrop, scroll lock, snap points,
 * close reasons, focus restoration, keyboard/CloseWatcher dismissal, and
 * delegates per-panel rendering to `SheetPanel`.
 *
 * Mounted inside a Portal by `StacksheetProvider`.
 */
export function SheetRenderer<TMap extends object>({
  store,
  config,
  sheets,
  componentMap,
  classNames: classNamesProp,
  renderHeader,
}: SheetRendererProps<TMap>) {
  const isOpen = useStore(store, (s) => s.isOpen);
  const stack = useStore(store, (s) => s.stack);
  const rawClose = useStore(store, (s) => s.close);
  const rawPop = useStore(store, (s) => s.pop);

  const side = useResolvedSide(config);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const classNames = useMemo(
    () => resolveClassNames(classNamesProp),
    [classNamesProp]
  );

  // ── Snap points ──────────────────────────────
  const snapHeights = useMemo(
    () =>
      side === "bottom" && config.snapPoints.length > 0
        ? resolveSnapPoints(
            config.snapPoints,
            typeof window !== "undefined" ? window.innerHeight : 0
          )
        : [],
    [side, config.snapPoints]
  );

  // Default to the last snap point (fully open) when snap points are defined
  const [internalSnapIndex, setInternalSnapIndex] = useState(
    snapHeights.length > 0 ? snapHeights.length - 1 : 0
  );

  // Controlled vs uncontrolled snap index
  const activeSnapIndex = config.snapPointIndex ?? internalSnapIndex;

  const handleSnap = useCallback(
    (index: number) => {
      setInternalSnapIndex(index);
      config.onSnapPointChange?.(index);
    },
    [config.onSnapPointChange, config]
  );

  // Reset snap index when stack opens (start at initial snap point or fully open)
  useEffect(() => {
    if (isOpen && snapHeights.length > 0) {
      const initial = config.snapPointIndex ?? snapHeights.length - 1;
      setInternalSnapIndex(initial);
    }
  }, [isOpen, snapHeights.length, config.snapPointIndex]);

  // Track why the sheet was closed — ref survives until exit animation completes
  const closeReasonRef = useRef<CloseReason>("programmatic");

  const closeWith = useCallback(
    (reason: CloseReason) => {
      closeReasonRef.current = reason;
      rawClose();
    },
    [rawClose]
  );

  const popWith = useCallback(
    (reason: CloseReason) => {
      closeReasonRef.current = reason;
      rawPop();
    },
    [rawPop]
  );

  // Default close/pop (programmatic) for child components
  const close = useCallback(() => closeWith("programmatic"), [closeWith]);
  const pop = useCallback(() => popWith("programmatic"), [popWith]);

  // Body scale effect
  useBodyScale(config, isOpen, prefersReducedMotion);

  // Focus restoration: capture the element that was focused when the stack opens.
  // When the stack fully closes, return focus to that element.
  const triggerRef = useRef<Element | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      triggerRef.current = document.activeElement;
    } else if (!isOpen && wasOpenRef.current) {
      const el = triggerRef.current;
      // Only restore focus to meaningful elements — skip document.body
      // which happens when sheets are opened programmatically.
      if (
        el &&
        el instanceof HTMLElement &&
        el !== document.body &&
        el.tagName !== "BODY"
      ) {
        el.focus();
      }
      triggerRef.current = null;
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Ref for stack length — avoids re-subscribing keyboard/CloseWatcher
  // effects on every push/pop.
  const stackLengthRef = useRef(stack.length);
  useEffect(() => {
    stackLengthRef.current = stack.length;
  }, [stack.length]);

  // Escape key
  useEffect(() => {
    if (!(isOpen && config.closeOnEscape && config.dismissible)) {
      return;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (stackLengthRef.current > 1) {
          popWith("escape");
        } else {
          closeWith("escape");
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, config.closeOnEscape, config.dismissible, popWith, closeWith]);

  // CloseWatcher — handles Android back gesture (progressive enhancement).
  // On browsers without support (Safari, Firefox), this is a no-op.
  useEffect(() => {
    if (
      !(isOpen && config.dismissible) ||
      typeof globalThis.CloseWatcher === "undefined"
    ) {
      return;
    }

    const watcher = new globalThis.CloseWatcher();
    watcher.onclose = () => {
      if (stackLengthRef.current > 1) {
        popWith("escape");
      } else {
        closeWith("escape");
      }
    };

    return () => watcher.destroy();
  }, [isOpen, config.dismissible, popWith, closeWith]);

  const slideFrom = useMemo(() => getSlideFrom(side), [side]);
  const slideTarget = useMemo(() => getSlideTarget(), []);

  // Primary spring — drives the top sheet's entrance slide.
  // When reduced motion is preferred, use instant transitions.
  const spring = useMemo(
    () =>
      prefersReducedMotion
        ? ({ type: "tween" as const, duration: 0 } as const)
        : ({
            type: "spring" as const,
            damping: config.spring.damping,
            stiffness: config.spring.stiffness,
            mass: config.spring.mass,
          } as const),
    [
      prefersReducedMotion,
      config.spring.damping,
      config.spring.stiffness,
      config.spring.mass,
    ]
  );

  // Same spring for stacking transforms
  const stackSpring = spring;

  // Non-modal: skip overlay, skip scroll lock
  const isModal = config.modal;
  const showOverlay = isModal && config.showOverlay;

  // Backdrop: use className if provided, otherwise inline fallback.
  // will-change hints the compositor to properly manage the layer lifecycle.
  const hasBackdropClass = classNames.backdrop !== "";
  const backdropStyle: CSSProperties = {
    zIndex: config.zIndex,
    willChange: "opacity",
    cursor:
      config.closeOnBackdrop && config.dismissible ? "pointer" : undefined,
    ...(hasBackdropClass
      ? {}
      : { background: "var(--overlay, rgba(0, 0, 0, 0.2))" }),
  };

  // Handle exit complete — fire onCloseComplete when stack is fully empty
  const handleExitComplete = useCallback(() => {
    if (stack.length === 0) {
      config.onCloseComplete?.(closeReasonRef.current);
    }
  }, [stack.length, config]);

  // Force WebKit repaint after backdrop exit animation completes.
  // iOS Safari's compositor can retain the visual layer of a fixed-position
  // element after it's removed from the DOM, leaving a ghost tint.
  // A layout recalc via offsetHeight forces the compositor to invalidate
  // stale layers without affecting element positioning.
  const handleBackdropExitComplete = useCallback(() => {
    requestAnimationFrame(() => {
      // Read offsetHeight to force a layout recalc — the value itself is unused.
      // biome-ignore lint/complexity/noVoid: intentional layout recalc for WebKit
      void document.body.offsetHeight;
    });
  }, []);

  // Swipe-specific dismiss callbacks
  const swipeClose = useCallback(() => closeWith("swipe"), [closeWith]);
  const swipePop = useCallback(() => popWith("swipe"), [popWith]);

  // Non-modal: don't lock scroll
  const shouldLockScroll = isOpen && isModal && config.lockScroll;

  return (
    <>
      {/* Backdrop — independent AnimatePresence so it fades on its own.
          onExitComplete forces a WebKit repaint to clear stale compositor layers (iOS Safari). */}
      {showOverlay && (
        <AnimatePresence onExitComplete={handleBackdropExitComplete}>
          {isOpen && (
            <m.div
              animate={{ opacity: 1 }}
              className={`fixed inset-0 ${classNames.backdrop || ""}`}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="stacksheet-backdrop"
              onClick={
                config.closeOnBackdrop && config.dismissible
                  ? () => closeWith("backdrop")
                  : undefined
              }
              style={backdropStyle}
              transition={spring}
            />
          )}
        </AnimatePresence>
      )}

      {/* Panel clip container — always rendered, invisible when empty */}
      <RemoveScroll enabled={shouldLockScroll} forwardProps>
        <div
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{ zIndex: config.zIndex + 1 }}
        >
          <AnimatePresence onExitComplete={handleExitComplete}>
            {stack.map((item, index) => {
              const depth = stack.length - 1 - index;
              const isTop = depth === 0;
              const isNested = index > 0;
              // Keep one extra hidden panel mounted as a warm buffer.
              // Without this, popping from deep stacks can mount content on the
              // same frame it becomes visible, which can cause a reverse jank.
              const shouldRender = depth <= config.stacking.renderThreshold;

              // Ad-hoc components take priority, then fall back to sheets map
              const Content = (componentMap.get(item.type) ??
                sheets[item.type as keyof TMap]) as
                | ComponentType<Record<string, unknown>>
                | undefined;

              return (
                <SheetPanel
                  activeSnapIndex={activeSnapIndex}
                  Content={Content}
                  classNames={classNames}
                  close={close}
                  config={config}
                  depth={depth}
                  index={index}
                  isNested={isNested}
                  isTop={isTop}
                  item={item}
                  key={item.id}
                  onSnap={handleSnap}
                  pop={pop}
                  prefersReducedMotion={prefersReducedMotion}
                  renderHeader={renderHeader}
                  shouldRender={shouldRender}
                  side={side}
                  slideFrom={slideFrom}
                  slideTarget={slideTarget}
                  snapHeights={snapHeights}
                  spring={spring}
                  stackSpring={stackSpring}
                  swipeClose={swipeClose}
                  swipePop={swipePop}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </RemoveScroll>
    </>
  );
}

// ── Helpers ─────────────────────────────────────

function getInitialRadius(side: Side): Record<string, number> {
  if (side === "bottom") {
    return {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    };
  }
  return { borderRadius: 0 };
}

// Collins-style layered shadows — soft, diffused, multi-stop.
const SHADOW_SM =
  "0px 2px 5px 0px rgba(0,0,0,0.11), 0px 9px 9px 0px rgba(0,0,0,0.1), 0px 21px 13px 0px rgba(0,0,0,0.06)";
const SHADOW_LG =
  "0px 23px 52px 0px rgba(0,0,0,0.08), 0px 94px 94px 0px rgba(0,0,0,0.07), 0px 211px 127px 0px rgba(0,0,0,0.04)";

function getShadow(isNested: boolean): string {
  return isNested ? SHADOW_SM : SHADOW_LG;
}
