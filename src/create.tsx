import { Portal } from "@radix-ui/react-portal";
import { createContext, useContext, useMemo } from "react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { resolveConfig } from "./config";
import { SheetRenderer } from "./renderer";
import { createSheetStore } from "./store";
import type {
  ContentMap,
  ResolvedConfig,
  SheetActions,
  StacksheetConfig,
  StacksheetInstance,
  StacksheetProviderProps,
  StacksheetSnapshot,
} from "./types";

type StoreState<TMap extends object> = StacksheetSnapshot<TMap> &
  SheetActions<TMap>;

/**
 * Create an isolated sheet stack instance with typed store, hooks, and provider.
 *
 * Works with both `interface` and `type` definitions:
 *
 * ```ts
 * // Using an interface
 * interface SheetDataMap {
 *   "bucket-create": { onCreated?: (b: Bucket) => void };
 *   "bucket-edit": { bucket: Bucket };
 * }
 *
 * // Using a type alias
 * type SheetDataMap = {
 *   "bucket-create": { onCreated?: (b: Bucket) => void };
 *   "bucket-edit": { bucket: Bucket };
 * };
 *
 * const { StacksheetProvider, useSheet, useStacksheetState } =
 *   createStacksheet<SheetDataMap>();
 * ```
 *
 * Sheet content components receive their data as **spread props**:
 * ```ts
 * // Data map defines: "bucket-edit": { bucket: Bucket }
 * // Component receives:  ({ bucket }: { bucket: Bucket }) => JSX.Element
 * ```
 *
 * Use `useSheetPanel()` inside content components to access `close()` and `back()`.
 */
export function createStacksheet<TMap extends object>(
  config?: StacksheetConfig
): StacksheetInstance<TMap> {
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
        "useSheet/useStacksheetState must be used within <StacksheetProvider>"
      );
    }
    return ctx;
  }

  // ── Provider ────────────────────────────────

  const EMPTY_SHEETS = {} as ContentMap<TMap>;

  function StacksheetProvider({
    sheets = EMPTY_SHEETS,
    children,
    classNames,
    renderHeader,
  }: StacksheetProviderProps<TMap>) {
    const value = useMemo(() => ({ store, config: resolved }), []);
    return (
      <StoreContext.Provider value={value}>
        {children}
        <Portal asChild={false}>
          <SheetRenderer<TMap>
            classNames={classNames}
            componentMap={componentMap}
            config={resolved}
            renderHeader={renderHeader}
            sheets={sheets}
            store={store}
          />
        </Portal>
      </StoreContext.Provider>
    );
  }

  // ── Hooks ───────────────────────────────────

  function useSheet(): SheetActions<TMap> {
    const { store: s } = useStoreContext();
    // Actions are stable refs in Zustand v5 — read once, no subscription needed
    return useMemo(() => {
      const state = s.getState();
      return {
        open: state.open,
        push: state.push,
        replace: state.replace,
        swap: state.swap,
        navigate: state.navigate,
        setData: state.setData,
        remove: state.remove,
        pop: state.pop,
        close: state.close,
      };
    }, [s]);
  }

  function useStacksheetState(): StacksheetSnapshot<TMap> {
    const { store: s } = useStoreContext();
    return useStore(
      s,
      useShallow((state) => ({
        stack: state.stack,
        isOpen: state.isOpen,
      }))
    );
  }

  return { StacksheetProvider, useSheet, useStacksheetState, store };
}
