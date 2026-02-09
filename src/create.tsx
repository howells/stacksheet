import { createContext, useContext, useMemo } from "react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import { resolveConfig } from "./config.js";
import { SheetRenderer } from "./renderer.js";
import { createSheetStore } from "./store.js";
import type {
  ContentMap,
  ResolvedConfig,
  SheetActions,
  SheetSnapshot,
  SheetStackConfig,
  SheetStackInstance,
} from "./types.js";

type StoreState<TMap extends Record<string, unknown>> = SheetSnapshot<TMap> &
  SheetActions<TMap>;

/**
 * Create an isolated sheet stack instance with typed store, hooks, and provider.
 *
 * ```ts
 * const { SheetProvider, useSheet, useSheetState } = createSheetStack<{
 *   "bucket-create": { onCreated?: (b: Bucket) => void };
 *   "bucket-edit": { bucket: Bucket };
 * }>();
 * ```
 */
export function createSheetStack<TMap extends Record<string, unknown>>(
  config?: SheetStackConfig
): SheetStackInstance<TMap> {
  const resolved = resolveConfig(config);
  const store = createSheetStore<TMap>(resolved);

  // Context for the store — allows multiple instances
  const StoreContext = createContext<{
    store: StoreApi<StoreState<TMap>>;
    config: ResolvedConfig;
  } | null>(null);

  function useStoreContext() {
    const ctx = useContext(StoreContext);
    if (!ctx) {
      throw new Error(
        "useSheet/useSheetState must be used within <SheetProvider>"
      );
    }
    return ctx;
  }

  // ── Provider ────────────────────────────────

  function SheetProvider({
    content,
    children,
  }: {
    content: ContentMap<TMap>;
    children: React.ReactNode;
  }) {
    const value = useMemo(() => ({ store, config: resolved }), []);
    return (
      <StoreContext.Provider value={value}>
        {children}
        <SheetRenderer<TMap>
          config={resolved}
          content={content}
          store={store}
        />
      </StoreContext.Provider>
    );
  }

  // ── Hooks ───────────────────────────────────

  function useSheet(): SheetActions<TMap> {
    const { store: s } = useStoreContext();
    return useStore(s, (state) => ({
      open: state.open,
      push: state.push,
      replace: state.replace,
      navigate: state.navigate,
      pop: state.pop,
      close: state.close,
    }));
  }

  function useSheetState(): SheetSnapshot<TMap> {
    const { store: s } = useStoreContext();
    return useStore(s, (state) => ({
      stack: state.stack,
      isOpen: state.isOpen,
    }));
  }

  return { SheetProvider, useSheet, useSheetState, store };
}
