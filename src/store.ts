declare const process: undefined | { env?: { NODE_ENV?: string } };

import type { ComponentType } from "react";
import { createStore, type StoreApi } from "zustand";
import type {
  ResolvedConfig,
  SheetActions,
  SheetItem,
  StacksheetSnapshot,
} from "./types";

// biome-ignore lint/suspicious/noExplicitAny: maps store heterogeneous components — type safety is at the call site
type AnyComponent = ComponentType<any>;

type StoreState<TMap extends object> = StacksheetSnapshot<TMap> &
  SheetActions<TMap>;

/** Return type of createSheetStore — store plus ad-hoc component maps */
export interface SheetStoreBundle<TMap extends object> {
  store: StoreApi<StoreState<TMap>>;
  /** Component → generated type key (dedup) */
  componentRegistry: Map<AnyComponent, string>;
  /** Generated type key → Component (for renderer lookup) */
  componentMap: Map<string, AnyComponent>;
}

// ── Ad-hoc helpers ──────────────────────────────

/**
 * Dev-mode warning: detect likely inline arrow functions passed as ad-hoc components.
 * When a new component reference has the same displayName/name as an existing one,
 * it's almost always an inline arrow being re-created every render.
 */
function warnInlineComponent(
  component: AnyComponent,
  componentRegistry: Map<AnyComponent, string>,
  warnedNames: Set<string>
): void {
  if (
    typeof process === "undefined" ||
    process?.env?.NODE_ENV === "production"
  ) {
    return;
  }

  const name = component.displayName || component.name;
  if (!name) {
    return;
  }
  if (warnedNames.has(name)) {
    return;
  }

  for (const [existing, key] of componentRegistry) {
    const existingName = existing.displayName || existing.name;
    if (existingName === name) {
      warnedNames.add(name);
      console.warn(
        `[stacksheet] A new component reference with name "${name}" was registered ` +
          `(key: ${key}), but a different reference with the same name already exists. ` +
          `This usually means you're passing an inline arrow function (e.g. ` +
          "open(() => <MySheet />)). Define the component outside of render to avoid " +
          "memory leaks and broken navigate() same-type detection."
      );
      return;
    }
  }
}

/**
 * If `first` is a function (component), register it and return { type, id, data }.
 * Otherwise, pass through the string-based (type, id, data) args unchanged.
 */
function resolveArgs(
  componentRegistry: Map<AnyComponent, string>,
  componentMap: Map<string, AnyComponent>,
  getNextKey: () => string,
  warnedNames: Set<string>,
  first: unknown,
  second: unknown,
  third: unknown
): { type: string; id: string; data: Record<string, unknown> } {
  if (typeof first === "function") {
    const component = first as AnyComponent;

    let typeKey = componentRegistry.get(component);
    if (!typeKey) {
      warnInlineComponent(component, componentRegistry, warnedNames);
      typeKey = getNextKey();
      componentRegistry.set(component, typeKey);
      componentMap.set(typeKey, component);
    }

    if (typeof second === "string") {
      return {
        type: typeKey,
        id: second,
        data: (third ?? {}) as Record<string, unknown>,
      };
    }
    return {
      type: typeKey,
      id: crypto.randomUUID(),
      data: (second ?? {}) as Record<string, unknown>,
    };
  }

  return {
    type: first as string,
    id: second as string,
    data: (third ?? {}) as Record<string, unknown>,
  };
}

/** Pre-resolved args — skips resolveArgs entirely */
interface ResolvedItem {
  type: string;
  id: string;
  data: Record<string, unknown>;
}

/**
 * Create an isolated Zustand store for a sheet stack instance.
 */
export function createSheetStore<TMap extends object>(
  config: ResolvedConfig
): SheetStoreBundle<TMap> {
  type Item = SheetItem<Extract<keyof TMap, string>>;

  const componentRegistry = new Map<AnyComponent, string>();
  const componentMap = new Map<string, AnyComponent>();

  // Per-instance counter (not module-level) — prevents identity leaks across instances/tests
  let adhocCounter = 0;
  function getNextKey() {
    return `__adhoc_${adhocCounter++}`;
  }

  // Set of component names already warned about (avoid log spam)
  const warnedNames = new Set<string>();

  function resolve(first: unknown, second: unknown, third: unknown) {
    return resolveArgs(
      componentRegistry,
      componentMap,
      getNextKey,
      warnedNames,
      first,
      second,
      third
    );
  }

  const store = createStore<StoreState<TMap>>()((set, get) => {
    // ── Internal resolved methods (no double-resolution) ──

    function _openResolved({ type, id, data }: ResolvedItem) {
      set({
        stack: [{ id, type, data } as Item],
        isOpen: true,
      });
    }

    function _pushResolved({ type, id, data }: ResolvedItem) {
      set((state) => {
        const item = { id, type, data } as Item;
        if (
          Number.isFinite(config.maxDepth) &&
          state.stack.length >= config.maxDepth
        ) {
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
    }

    function _replaceResolved({ type, id, data }: ResolvedItem) {
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
    }

    return {
      stack: [],
      isOpen: false,

      open(first: unknown, second?: unknown, third?: unknown) {
        _openResolved(resolve(first, second, third));
      },

      push(first: unknown, second?: unknown, third?: unknown) {
        _pushResolved(resolve(first, second, third));
      },

      replace(first: unknown, second?: unknown, third?: unknown) {
        _replaceResolved(resolve(first, second, third));
      },

      swap(first: unknown, second?: unknown) {
        let type: string;
        let data: Record<string, unknown>;

        if (typeof first === "function") {
          const component = first as AnyComponent;
          let typeKey = componentRegistry.get(component);
          if (!typeKey) {
            warnInlineComponent(component, componentRegistry, warnedNames);
            typeKey = getNextKey();
            componentRegistry.set(component, typeKey);
            componentMap.set(typeKey, component);
          }
          type = typeKey;
          data = (second ?? {}) as Record<string, unknown>;
        } else {
          type = first as string;
          data = (second ?? {}) as Record<string, unknown>;
        }

        set((state) => {
          const top = state.stack.at(-1);
          if (!top) {
            return state;
          }
          const newStack = [...state.stack];
          newStack[newStack.length - 1] = { id: top.id, type, data } as Item;
          return { stack: newStack };
        });
      },

      navigate(first: unknown, second?: unknown, third?: unknown) {
        const resolved = resolve(first, second, third);
        const { stack } = get();
        const top = stack.at(-1);

        if (stack.length === 0) {
          _openResolved(resolved);
          return;
        }

        // For ad-hoc components, check if the top item's type maps to the same
        // component in the registry. For string types, compare directly.
        let isSameType = top?.type === resolved.type;
        if (!isSameType && typeof first === "function") {
          const topComponent = componentMap.get(top?.type ?? "");
          isSameType = topComponent === first;
        }

        if (isSameType) {
          _replaceResolved(resolved);
          return;
        }

        _pushResolved(resolved);
      },

      setData(first: unknown, second?: unknown, third?: unknown) {
        // setData always has an id: (type, id, data) or (Component, id, data)
        const { id, data } = resolve(first, second, third);
        set((state) => {
          const idx = state.stack.findIndex((item) => item.id === id);
          if (idx === -1) {
            return state;
          }
          const updated = [...state.stack];
          updated[idx] = { ...updated[idx], data } as Item;
          return { stack: updated };
        });
      },

      remove(id) {
        set((state) => {
          const next = state.stack.filter((item) => item.id !== id);
          if (next.length === state.stack.length) {
            return state;
          }
          if (next.length === 0) {
            return { stack: [], isOpen: false };
          }
          return { stack: next };
        });
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
    };
  });

  return { store, componentRegistry, componentMap };
}
