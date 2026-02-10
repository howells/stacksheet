import FocusTrap from "focus-trap-react";
import { AnimatePresence, motion as m } from "motion/react";
import {
  type ComponentType,
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { RemoveScroll } from "react-remove-scroll";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import { useResolvedSide } from "./media";
import {
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
  SheetClassNames,
  SheetItem,
  SheetSnapshot,
  Side,
} from "./types";

// ── Icons (inline SVG — no external dependency) ─

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={16}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={16}
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={16}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={16}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

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

function DefaultHeader({ isNested, onBack, onClose }: HeaderRenderProps) {
  return (
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
  );
}

// ── Resolved classNames ─────────────────────────

type ResolvedClassNames = Required<SheetClassNames>;

const EMPTY_CLASSNAMES: ResolvedClassNames = {
  backdrop: "",
  panel: "",
  header: "",
};

function resolveClassNames(cn?: SheetClassNames): ResolvedClassNames {
  if (!cn) {
    return EMPTY_CLASSNAMES;
  }
  return {
    backdrop: cn.backdrop ?? "",
    panel: cn.panel ?? "",
    header: cn.header ?? "",
  };
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
  Content: ComponentType<{ data: any; onClose: () => void }> | undefined;
  shouldRender: boolean;
  pop: () => void;
  close: () => void;
  renderHeader?: (props: HeaderRenderProps) => React.ReactNode;
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

  // Per-sheet aria-label: check data.__ariaLabel, fall back to config
  const ariaLabel =
    (typeof item.data?.__ariaLabel === "string"
      ? item.data.__ariaLabel
      : undefined) ?? config.ariaLabel;

  // Panel: use className if provided, strip inline background
  const hasPanelClass = classNames.panel !== "";
  const panelStyle: CSSProperties = {
    ...panelStyles,
    boxShadow: isTop ? getShadow(side, false) : getShadow(side, true),
    pointerEvents: isTop ? "auto" : "none",
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
  };

  const panelContent = (
    <m.div
      animate={{
        ...slideTarget,
        ...stackOffset,
        scale: transform.scale,
        opacity: transform.opacity,
        borderRadius: transform.borderRadius,
        transition: isTop ? spring : stackSpring,
      }}
      aria-label={isTop ? ariaLabel : undefined}
      aria-modal={isTop ? "true" : undefined}
      className={classNames.panel || undefined}
      exit={{
        ...slideFrom,
        opacity: 0.6,
        transition: exitSpring,
      }}
      initial={{
        ...slideFrom,
        opacity: 0.8,
      }}
      key={item.id}
      onAnimationComplete={handleAnimationComplete}
      ref={panelRef}
      role={isTop ? "dialog" : undefined}
      style={panelStyle}
      tabIndex={isTop ? -1 : undefined}
      transition={spring}
    >
      {/* Header */}
      {isTop &&
        (renderHeader ? (
          renderHeader(headerProps)
        ) : (
          <DefaultHeader {...headerProps} />
        ))}

      {/* Content */}
      {shouldRender && Content && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          <Content data={item.data} onClose={close} />
        </div>
      )}
    </m.div>
  );

  if (!isTop) {
    return panelContent;
  }

  return (
    <FocusTrap
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
          // If no focusable elements exist, focus the panel container itself
          if (panelRef.current) {
            return panelRef.current;
          }
          // This shouldn't happen, but satisfy the type
          return document.body;
        },
      }}
    >
      {panelContent}
    </FocusTrap>
  );
}

// ── Renderer ────────────────────────────────────

interface SheetRendererProps<TMap extends Record<string, unknown>> {
  store: StoreApi<SheetSnapshot<TMap> & SheetActions<TMap>>;
  config: ResolvedConfig;
  content: ContentMap<TMap>;
  /** Ad-hoc component map (type key → component) */
  // biome-ignore lint/suspicious/noExplicitAny: heterogeneous component storage
  componentMap: Map<string, ComponentType<any>>;
  classNames?: SheetClassNames;
  renderHeader?: (props: HeaderRenderProps) => React.ReactNode;
}

export function SheetRenderer<TMap extends Record<string, unknown>>({
  store,
  config,
  content,
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

  // Focus restoration: capture the element that was focused when the stack opens.
  // When the stack fully closes, return focus to that element.
  const triggerRef = useRef<Element | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Stack just opened — capture the trigger element
      triggerRef.current = document.activeElement;
    } else if (!isOpen && wasOpenRef.current) {
      // Stack just closed — restore focus to trigger
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
    if (!(isOpen && config.closeOnEscape)) {
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
  }, [isOpen, config.closeOnEscape, stack.length, pop, close]);

  const slideFrom = getSlideFrom(side);
  const slideTarget = getSlideTarget();

  // Primary spring — drives the top sheet's entrance slide
  const spring = {
    type: "spring" as const,
    damping: config.spring.damping,
    stiffness: config.spring.stiffness,
    mass: config.spring.mass,
  };

  // Slower spring for underlying sheets contracting/expanding (scale, offset, opacity).
  // ~60% stiffness + higher mass = noticeably lagging behind the incoming sheet.
  const stackSpring = {
    type: "spring" as const,
    damping: config.spring.damping * 1.1,
    stiffness: config.spring.stiffness * 0.6,
    mass: config.spring.mass * 1.4,
  };

  // Softer spring for exit (pop) — less abrupt departure
  const exitSpring = {
    type: "spring" as const,
    damping: config.spring.damping * 0.9,
    stiffness: config.spring.stiffness * 0.5,
    mass: config.spring.mass * 1.2,
  };

  // Backdrop: use className if provided, otherwise inline fallback
  const hasBackdropClass = classNames.backdrop !== "";
  const backdropStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: config.zIndex,
    cursor: config.closeOnBackdrop ? "pointer" : undefined,
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

  // Wrap clip container in RemoveScroll when open + lockScroll
  const shouldLockScroll = isOpen && config.lockScroll;

  return (
    <>
      {/* Backdrop — independent AnimatePresence so it fades on its own */}
      {config.showOverlay && (
        <AnimatePresence>
          {isOpen && (
            <m.div
              animate={{ opacity: 1 }}
              className={classNames.backdrop || undefined}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="stacksheet-backdrop"
              onClick={config.closeOnBackdrop ? close : undefined}
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
              const shouldRender = depth < config.stacking.renderThreshold;

              // Ad-hoc components take priority, then fall back to content map
              const Content = (componentMap.get(item.type) ??
                content[item.type as keyof TMap]) as
                | ComponentType<{
                    data: unknown;
                    onClose: () => void;
                  }>
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
