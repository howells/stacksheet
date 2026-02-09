import { AnimatePresence, m } from "motion/react";
import {
  type ComponentType,
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import { useResolvedSide } from "./media.js";
import {
  getSlideFrom,
  getSlideTarget,
  getStackTransform,
  getPanelStyles,
} from "./stacking.js";
import type {
  ContentMap,
  ResolvedConfig,
  SheetActions,
  SheetItem,
  SheetSnapshot,
  Side,
} from "./types.js";

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

// ── Header button ───────────────────────────────

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

// ── Renderer ────────────────────────────────────

interface SheetRendererProps<TMap extends Record<string, unknown>> {
  store: StoreApi<SheetSnapshot<TMap> & SheetActions<TMap>>;
  config: ResolvedConfig;
  content: ContentMap<TMap>;
}

export function SheetRenderer<TMap extends Record<string, unknown>>({
  store,
  config,
  content,
}: SheetRendererProps<TMap>) {
  const isOpen = useStore(store, (s) => s.isOpen);
  const stack = useStore(store, (s) => s.stack);
  const close = useStore(store, (s) => s.close);
  const pop = useStore(store, (s) => s.pop);

  const side = useResolvedSide(config);

  // Display stack — keep items during exit animation
  const [displayStack, setDisplayStack] = useState<
    SheetItem<Extract<keyof TMap, string>>[]
  >([]);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (stack.length > 0) {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setDisplayStack(stack);
    } else {
      // Delay clearing so exit animations complete
      clearTimerRef.current = setTimeout(() => {
        setDisplayStack([]);
      }, 500);
    }
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, [stack]);

  // Scroll lock
  useEffect(() => {
    if (!isOpen || !config.lockScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, config.lockScroll]);

  // Escape key
  useEffect(() => {
    if (!isOpen || !config.closeOnEscape) return;

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
  const spring = {
    type: "spring" as const,
    damping: config.spring.damping,
    stiffness: config.spring.stiffness,
    mass: config.spring.mass,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key="stacksheet-backdrop"
            onClick={config.closeOnBackdrop ? close : undefined}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: config.zIndex,
              background: "rgba(0, 0, 0, 0.2)",
              cursor: config.closeOnBackdrop ? "pointer" : undefined,
            }}
            transition={{ duration: 0.2 }}
          />

          {/* Panels */}
          {displayStack.map((item, index) => {
            const depth = displayStack.length - 1 - index;
            const isTop = depth === 0;
            const isNested = displayStack.length > 1;
            const transform = getStackTransform(depth, config.stacking);
            const panelStyles = getPanelStyles(side, config, depth, index);
            const shouldRender = depth < config.stacking.renderThreshold;

            // Compute stacking offset for animate
            const stackOffset = getStackingOffset(side, transform.offset);

            const Content = content[item.type as keyof TMap] as
              | ComponentType<{
                  data: unknown;
                  onClose: () => void;
                }>
              | undefined;

            return (
              <m.div
                animate={{
                  ...slideTarget,
                  ...stackOffset,
                  scale: transform.scale,
                  opacity: transform.opacity,
                  borderRadius: transform.borderRadius,
                }}
                aria-modal={isTop ? "true" : undefined}
                exit={{
                  ...slideFrom,
                  opacity: 0.6,
                }}
                initial={{
                  ...slideFrom,
                  opacity: 0.8,
                }}
                key={item.id}
                role={isTop ? "dialog" : undefined}
                style={{
                  ...panelStyles,
                  boxShadow: isTop
                    ? getShadow(side, false)
                    : getShadow(side, true),
                  pointerEvents: isTop ? "auto" : "none",
                }}
                transition={spring}
              >
                {/* Header */}
                {isTop && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: 48,
                      flexShrink: 0,
                      padding: "0 12px",
                      borderBottom: "1px solid transparent",
                    }}
                  >
                    {isNested && (
                      <button
                        aria-label="Back"
                        onClick={pop}
                        style={BUTTON_STYLE}
                        type="button"
                      >
                        <ArrowLeftIcon />
                      </button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button
                      aria-label="Close"
                      onClick={close}
                      style={BUTTON_STYLE}
                      type="button"
                    >
                      <XIcon />
                    </button>
                  </div>
                )}

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
          })}
        </>
      )}
    </AnimatePresence>
  );
}

// ── Helpers ─────────────────────────────────────

function getStackingOffset(side: Side, offset: number): Record<string, number> {
  if (offset === 0) return {};
  switch (side) {
    case "right":
      return { x: -offset };
    case "left":
      return { x: offset };
    case "bottom":
      return { y: -offset };
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
