import { createContext, useContext, useMemo } from "react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { resolveConfig } from "./config";
import { SheetRenderer } from "./renderer";
import { createSheetStore } from "./store";
import type {
  ResolvedConfig,
  SheetActions,
  SheetProviderProps,
  SheetSnapshot,
  SheetStackConfig,
  SheetStackInstance,
} from "./types";

type StoreState<TMap extends Record<string, unknown>> = SheetSnapshot<TMap> &
  SheetActions<TMap>;

/**
 * Create an isolated sheet stack instance with typed store, hooks, and provider.
 *
 * ```ts
 * const { SheetStackProvider, useSheetStack, useSheetStackState } = createSheetStack<{
 *   "bucket-create": { onCreated?: (b: Bucket) => void };
 *   "bucket-edit": { bucket: Bucket };
 * }>();
 * ```
 */
export function createSheetStack<TMap extends Record<string, unknown>>(
  config?: SheetStackConfig
): SheetStackInstance<TMap> {
  const resolved = resolveConfig(config);
  const { store, componentMap } = createSheetStore<TMap>(resolved);

  // Context for the store — allows multiple instances
  const StoreContext = createContext<{
    store: StoreApi<StoreState<TMap>>;
    config: ResolvedConfig;
  } | null>(null);

  function useStoreContext() {
    const ctx = useContext(StoreContext);
    if (!ctx) {
      throw new Error(
        "useSheetStack/useSheetStackState must be used within <SheetStackProvider>"
      );
    }
    return ctx;
  }

  // ── Provider ────────────────────────────────

  function SheetStackProvider({
    content,
    children,
    classNames,
    renderHeader,
  }: SheetProviderProps<TMap>) {
    const value = useMemo(() => ({ store, config: resolved }), []);
    return (
      <StoreContext.Provider value={value}>
        {children}
        <SheetRenderer<TMap>
          classNames={classNames}
          componentMap={componentMap}
          config={resolved}
          content={content}
          renderHeader={renderHeader}
          store={store}
        />
      </StoreContext.Provider>
    );
  }

  // ── Hooks ───────────────────────────────────

  function useSheetStack(): SheetActions<TMap> {
    const { store: s } = useStoreContext();
    // Actions are stable refs in Zustand v5 — read once, no subscription needed
    return useMemo(() => {
      const state = s.getState();
      return {
        open: state.open,
        push: state.push,
        replace: state.replace,
        navigate: state.navigate,
        setData: state.setData,
        remove: state.remove,
        pop: state.pop,
        close: state.close,
      };
    }, [s]);
  }

  function useSheetStackState(): SheetSnapshot<TMap> {
    const { store: s } = useStoreContext();
    return useStore(
      s,
      useShallow((state) => ({
        stack: state.stack,
        isOpen: state.isOpen,
      }))
    );
  }

  return { SheetStackProvider, useSheetStack, useSheetStackState, store };
}
