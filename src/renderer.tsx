import FocusTrap from "focus-trap-react";
import { AnimatePresence, motion as m } from "motion/react";
import {
  type ComponentType,
  type CSSProperties,
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
import {
  getAnimatedBorderRadius,
  getPanelStyles,
  getSlideFrom,
  getSlideTarget,
  getStackTransform,
  type SlideValues,
} from "./stacking";
import type {
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

const BUTTON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "inherit",
  opacity: 0.5,
  transition: "opacity 150ms",
  padding: 0,
};

const HANDLE_BAR_STYLE: CSSProperties = {
  width: 36,
  height: 4,
  borderRadius: 2,
  background: "var(--muted-foreground, rgba(0, 0, 0, 0.25))",
};

function DefaultHeader({ isNested, onBack, onClose, side }: HeaderRenderProps) {
  return (
    <>
      {side === "bottom" && (
        <div
          data-stacksheet-handle=""
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 0 4px",
            flexShrink: 0,
            cursor: "grab",
            touchAction: "none",
          }}
        >
          <div style={HANDLE_BAR_STYLE} />
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 48,
          flexShrink: 0,
          padding: "0 12px",
          borderBottom: "1px solid var(--border, transparent)",
        }}
      >
        {isNested && (
          <button
            aria-label="Back"
            onClick={onBack}
            style={BUTTON_STYLE}
            type="button"
          >
            <ArrowLeftIcon />
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          aria-label="Close"
          onClick={onClose}
          style={BUTTON_STYLE}
          type="button"
        >
          <XIcon />
        </button>
      </div>
    </>
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

function selectSpring(
  isTop: boolean,
  spring: Record<string, unknown>,
  stackSpring: Record<string, unknown>
): Record<string, unknown> {
  return isTop ? spring : stackSpring;
}

function buildAriaProps(
  isTop: boolean,
  isModal: boolean,
  isComposable: boolean,
  ariaLabel: string,
  panelId: string
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
    props["aria-describedby"] = `${panelId}-desc`;
  } else {
    props["aria-label"] = ariaLabel;
  }
  return props;
}

// ── Drag offset to CSS transform ────────────────

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
  renderHeader?: false | ((props: HeaderRenderProps) => React.ReactNode);
  slideFrom: SlideValues;
  slideTarget: SlideValues;
  spring: Record<string, unknown>;
  stackSpring: Record<string, unknown>;
  exitSpring: Record<string, unknown>;
}

function SheetPanel({
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
  renderHeader,
  slideFrom,
  slideTarget,
  spring,
  stackSpring,
  exitSpring,
}: SheetPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const hasEnteredRef = useRef(false);
  const [dragState, setDragState] = useState<DragState>({
    offset: 0,
    isDragging: false,
  });

  const transform = getStackTransform(depth, config.stacking);
  const panelStyles = getPanelStyles(side, config, depth, index);
  const stackOffset = getStackingOffset(side, transform.offset);

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

  // Drag-to-dismiss (only on top panel)
  useDrag(
    panelRef,
    {
      enabled: isTop && config.drag && config.dismissible,
      closeThreshold: config.closeThreshold,
      velocityThreshold: config.velocityThreshold,
      side,
      onClose: close,
      onPop: pop,
      isNested,
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
  const panelContext = useMemo(
    () => ({ close, back: pop, isNested, isTop, panelId, side }),
    [close, pop, isNested, isTop, panelId, side]
  );

  // Composable mode: renderHeader === false → no auto header, no scroll wrapper
  const isComposable = renderHeader === false;

  // Panel: use className if provided, strip inline background
  const hasPanelClass = classNames.panel !== "";
  const dragOffset = getDragTransform(side, dragState.offset);
  const panelStyle: CSSProperties = {
    ...panelStyles,
    pointerEvents: isTop ? "auto" : "none",
    // During drag, disable spring transition for immediate feedback
    ...(dragState.isDragging ? { transition: "none" } : {}),
    ...(hasPanelClass
      ? {}
      : {
          background: "var(--background, #fff)",
          borderColor: "var(--border, transparent)",
        }),
  };

  const headerProps: HeaderRenderProps = {
    isNested,
    onBack: pop,
    onClose: close,
    side,
  };

  const isModal = config.modal;
  const ariaProps = buildAriaProps(
    isTop,
    isModal,
    isComposable,
    ariaLabel,
    panelId
  );

  // Pick transition: immediate during drag, spring otherwise
  const transition = dragState.isDragging
    ? { type: "tween" as const, duration: 0 }
    : selectSpring(isTop, spring, stackSpring);

  // Explicit radius target to avoid undefined -> value interpolation.
  const _animatedRadius = getAnimatedBorderRadius(side, depth, config.stacking);

  // Merge drag offset into the animate target
  const animateTarget = {
    ...slideTarget,
    ...stackOffset,
    ...dragOffset,
    scale: transform.scale,
    opacity: transform.opacity,
    // ...animatedRadius,
    boxShadow: getShadow(side, !isTop),
    transition,
  };

  const _initialRadius = getInitialRadius(side);

  const panelContent = (
    <m.div
      animate={animateTarget}
      className={classNames.panel || undefined}
      exit={{
        ...slideFrom,
        opacity: 0.6,
        boxShadow: getShadow(side, false),
        transition: exitSpring,
      }}
      initial={{
        ...slideFrom,
        opacity: 0.8,
        // ...initialRadius,
        boxShadow: getShadow(side, false),
      }}
      key={item.id}
      onAnimationComplete={handleAnimationComplete}
      ref={panelRef}
      style={panelStyle}
      tabIndex={isTop ? -1 : undefined}
      {...ariaProps}
    >
      {isComposable ? (
        /* Composable mode: content fills panel directly, uses Sheet.* parts */
        shouldRender &&
        Content && <Content {...(item.data as Record<string, unknown>)} />
      ) : (
        <>
          {/* Classic mode: auto header + scroll wrapper */}
          {renderHeader ? (
            renderHeader(headerProps)
          ) : (
            <DefaultHeader {...headerProps} />
          )}
          {shouldRender && Content && (
            <div
              data-stacksheet-no-drag=""
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overscrollBehavior: "contain",
              }}
            >
              <Content {...(item.data as Record<string, unknown>)} />
            </div>
          )}
        </>
      )}
    </m.div>
  );

  // Non-modal: skip focus trap
  if (!isModal) {
    return (
      <SheetPanelContext.Provider value={panelContext}>
        {panelContent}
      </SheetPanelContext.Provider>
    );
  }

  return (
    <SheetPanelContext.Provider value={panelContext}>
      <FocusTrap
        active={isTop}
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
            if (panelRef.current) {
              return panelRef.current;
            }
            return document.body;
          },
        }}
      >
        {panelContent}
      </FocusTrap>
    </SheetPanelContext.Provider>
  );
}

// ── Body scale effect ───────────────────────────

function useBodyScale(config: ResolvedConfig, isOpen: boolean) {
  useEffect(() => {
    if (!config.shouldScaleBackground) {
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
  }, [isOpen, config.shouldScaleBackground, config.scaleBackgroundAmount]);
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
  const close = useStore(store, (s) => s.close);
  const pop = useStore(store, (s) => s.pop);

  const side = useResolvedSide(config);
  const classNames = resolveClassNames(classNamesProp);

  // Body scale effect
  useBodyScale(config, isOpen);

  // Focus restoration: capture the element that was focused when the stack opens.
  // When the stack fully closes, return focus to that element.
  const triggerRef = useRef<Element | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      triggerRef.current = document.activeElement;
    } else if (!isOpen && wasOpenRef.current) {
      const el = triggerRef.current;
      if (el && el instanceof HTMLElement) {
        el.focus();
      }
      triggerRef.current = null;
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!(isOpen && config.closeOnEscape && config.dismissible)) {
      return;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (stack.length > 1) {
          pop();
        } else {
          close();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    config.closeOnEscape,
    config.dismissible,
    stack.length,
    pop,
    close,
  ]);

  const slideFrom = getSlideFrom(side);
  const slideTarget = getSlideTarget();

  // Primary spring — drives the top sheet's entrance slide
  const spring = {
    type: "spring" as const,
    damping: config.spring.damping,
    stiffness: config.spring.stiffness,
    mass: config.spring.mass,
  };

  // Same spring for stacking transforms (scale, offset, opacity)
  const stackSpring = spring;

  // Same spring for exit (pop)
  const exitSpring = spring;

  // Non-modal: skip overlay, skip scroll lock
  const isModal = config.modal;
  const showOverlay = isModal && config.showOverlay;

  // Backdrop: use className if provided, otherwise inline fallback
  const hasBackdropClass = classNames.backdrop !== "";
  const backdropStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: config.zIndex,
    cursor:
      config.closeOnBackdrop && config.dismissible ? "pointer" : undefined,
    ...(hasBackdropClass
      ? {}
      : { background: "var(--overlay, rgba(0, 0, 0, 0.2))" }),
  };

  // Handle exit complete — fire onCloseComplete when stack is fully empty
  const handleExitComplete = useCallback(() => {
    if (stack.length === 0) {
      config.onCloseComplete?.();
    }
  }, [stack.length, config]);

  // Non-modal: don't lock scroll
  const shouldLockScroll = isOpen && isModal && config.lockScroll;

  return (
    <>
      {/* Backdrop — independent AnimatePresence so it fades on its own */}
      {showOverlay && (
        <AnimatePresence>
          {isOpen && (
            <m.div
              animate={{ opacity: 1 }}
              className={classNames.backdrop || undefined}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="stacksheet-backdrop"
              onClick={
                config.closeOnBackdrop && config.dismissible ? close : undefined
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
          style={{
            position: "fixed",
            inset: 0,
            zIndex: config.zIndex + 1,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <AnimatePresence onExitComplete={handleExitComplete}>
            {stack.map((item, index) => {
              const depth = stack.length - 1 - index;
              const isTop = depth === 0;
              const isNested = stack.length > 1;
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
                  Content={Content}
                  classNames={classNames}
                  close={close}
                  config={config}
                  depth={depth}
                  exitSpring={exitSpring}
                  index={index}
                  isNested={isNested}
                  isTop={isTop}
                  item={item}
                  key={item.id}
                  pop={pop}
                  renderHeader={renderHeader}
                  shouldRender={shouldRender}
                  side={side}
                  slideFrom={slideFrom}
                  slideTarget={slideTarget}
                  spring={spring}
                  stackSpring={stackSpring}
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

function getStackingOffset(side: Side, offset: number): Record<string, number> {
  if (offset === 0) {
    return {};
  }
  switch (side) {
    case "right":
      return { x: -offset };
    case "left":
      return { x: offset };
    case "bottom":
      return { y: -offset };
    default:
      return {};
  }
}

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

function getShadow(side: Side, isNested: boolean): string {
  if (side === "bottom") {
    return isNested
      ? "0 -2px 16px rgba(0,0,0,0.06)"
      : "0 -8px 32px rgba(0,0,0,0.15)";
  }
  // Left/right
  const dir = side === "right" ? -1 : 1;
  return isNested
    ? `${dir * 2}px 0 16px rgba(0,0,0,0.06)`
    : `${dir * 8}px 0 32px rgba(0,0,0,0.15)`;
}
