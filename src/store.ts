import { createStore, type StoreApi } from "zustand";
import type {
  ResolvedConfig,
  SheetActions,
  SheetItem,
  SheetSnapshot,
} from "./types.js";

type StoreState<TMap extends Record<string, unknown>> = SheetSnapshot<TMap> &
  SheetActions<TMap>;

/**
 * Create an isolated Zustand store for a sheet stack instance.
 */
export function createSheetStore<TMap extends Record<string, unknown>>(
  config: ResolvedConfig
): StoreApi<StoreState<TMap>> {
  type Item = SheetItem<Extract<keyof TMap, string>>;

  return createStore<StoreState<TMap>>()((set, get) => ({
    stack: [],
    isOpen: false,

    open(type, id, data) {
      set({
        stack: [{ id, type, data } as Item],
        isOpen: true,
      });
    },

    push(type, id, data) {
      set((state) => {
        const item = { id, type, data } as Item;
        if (
          Number.isFinite(config.maxDepth) &&
          state.stack.length >= config.maxDepth
        ) {
          // Replace top at max depth
          return {
            stack: [...state.stack.slice(0, -1), item],
            isOpen: true,
          };
        }
        return {
          stack: [...state.stack, item],
          isOpen: true,
        };
      });
    },

    replace(type, id, data) {
      set((state) => {
        const item = { id, type, data } as Item;
        if (state.stack.length === 0) {
          return { stack: [item], isOpen: true };
        }
        return {
          stack: [...state.stack.slice(0, -1), item],
          isOpen: true,
        };
      });
    },

    navigate(type, id, data) {
      const { stack } = get();
      const top = stack.at(-1);

      // Empty → open
      if (stack.length === 0) {
        get().open(type, id, data);
        return;
      }

      // Same type on top → replace
      if (top?.type === type) {
        get().replace(type, id, data);
        return;
      }

      // Different type → push
      get().push(type, id, data);
    },

    pop() {
      set((state) => {
        if (state.stack.length <= 1) {
          return { stack: [], isOpen: false };
        }
        return { stack: state.stack.slice(0, -1), isOpen: true };
      });
    },

    close() {
      set({ stack: [], isOpen: false });
    },
  }));
}
