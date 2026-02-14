import { describe, expect, it } from "vitest";
import { resolveConfig } from "./config";
import { createSheetStore } from "./store";

function makeStore(overrides = {}) {
  const config = resolveConfig(overrides);
  return createSheetStore(config);
}

describe("createSheetStore", () => {
  it("starts with empty stack and closed state", () => {
    const { store } = makeStore();
    const state = store.getState();
    expect(state.stack).toEqual([]);
    expect(state.isOpen).toBe(false);
  });

  // ── open ────────────────────────────────────

  describe("open", () => {
    it("opens with a string type", () => {
      const { store } = makeStore();
      store.getState().open("settings", "id1", { theme: "dark" });
      const state = store.getState();
      expect(state.isOpen).toBe(true);
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.type).toBe("settings");
      expect(state.stack[0]?.id).toBe("id1");
      expect(state.stack[0]?.data).toEqual({ theme: "dark" });
    });

    it("replaces the entire stack", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().push("b", "2", {});
      expect(store.getState().stack).toHaveLength(2);

      store.getState().open("c", "3", {});
      expect(store.getState().stack).toHaveLength(1);
      expect(store.getState().stack[0]?.type).toBe("c");
    });

    it("opens with an ad-hoc component", () => {
      const { store } = makeStore();
      const MyComponent = () => null;
      store.getState().open(MyComponent, { title: "Test" });
      const state = store.getState();
      expect(state.isOpen).toBe(true);
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toEqual({ title: "Test" });
    });
  });

  // ── push ────────────────────────────────────

  describe("push", () => {
    it("adds to the stack", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().push("b", "2", {});
      expect(store.getState().stack).toHaveLength(2);
      expect(store.getState().stack[1]?.type).toBe("b");
    });

    it("respects maxDepth by replacing top", () => {
      const { store } = makeStore({ maxDepth: 2 });
      store.getState().open("a", "1", {});
      store.getState().push("b", "2", {});
      store.getState().push("c", "3", {});
      const state = store.getState();
      expect(state.stack).toHaveLength(2);
      expect(state.stack[0]?.type).toBe("a");
      expect(state.stack[1]?.type).toBe("c");
    });
  });

  // ── pop ─────────────────────────────────────

  describe("pop", () => {
    it("removes the top item", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().push("b", "2", {});
      store.getState().pop();
      const state = store.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.type).toBe("a");
      expect(state.isOpen).toBe(true);
    });

    it("closes when popping last item", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().pop();
      expect(store.getState().isOpen).toBe(false);
      expect(store.getState().stack).toHaveLength(0);
    });
  });

  // ── close ───────────────────────────────────

  describe("close", () => {
    it("clears the entire stack", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().push("b", "2", {});
      store.getState().close();
      expect(store.getState().isOpen).toBe(false);
      expect(store.getState().stack).toHaveLength(0);
    });
  });

  // ── replace ─────────────────────────────────

  describe("replace", () => {
    it("swaps the top item", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().push("b", "2", {});
      store.getState().replace("c", "3", {});
      const state = store.getState();
      expect(state.stack).toHaveLength(2);
      expect(state.stack[1]?.type).toBe("c");
    });

    it("acts like open when stack is empty", () => {
      const { store } = makeStore();
      store.getState().replace("a", "1", {});
      expect(store.getState().stack).toHaveLength(1);
    });
  });

  // ── swap ────────────────────────────────────

  describe("swap", () => {
    it("changes content of top item without changing id", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      const originalId = store.getState().stack[0]?.id;
      store.getState().swap("b", { value: 42 });
      const state = store.getState();
      expect(state.stack[0]?.id).toBe(originalId);
      expect(state.stack[0]?.type).toBe("b");
      expect(state.stack[0]?.data).toEqual({ value: 42 });
    });

    it("does nothing when stack is empty", () => {
      const { store } = makeStore();
      store.getState().swap("b", {});
      expect(store.getState().stack).toHaveLength(0);
    });
  });

  // ── navigate ────────────────────────────────

  describe("navigate", () => {
    it("opens when stack is empty", () => {
      const { store } = makeStore();
      store.getState().navigate("a", "1", {});
      expect(store.getState().stack).toHaveLength(1);
    });

    it("replaces when same type is on top", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", { v: 1 });
      store.getState().navigate("a", "2", { v: 2 });
      const state = store.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.data).toEqual({ v: 2 });
    });

    it("pushes when different type is on top", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().navigate("b", "2", {});
      expect(store.getState().stack).toHaveLength(2);
    });
  });

  // ── remove ──────────────────────────────────

  describe("remove", () => {
    it("removes a specific item by id", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().push("b", "2", {});
      store.getState().remove("1");
      const state = store.getState();
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]?.id).toBe("2");
    });

    it("closes when removing the last item", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().remove("1");
      expect(store.getState().isOpen).toBe(false);
    });

    it("does nothing for non-existent id", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", {});
      store.getState().remove("nonexistent");
      expect(store.getState().stack).toHaveLength(1);
    });
  });

  // ── setData ─────────────────────────────────

  describe("setData", () => {
    it("updates data on a specific sheet", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", { v: 1 });
      store.getState().setData("a", "1", { v: 2 });
      expect(store.getState().stack[0]?.data).toEqual({ v: 2 });
    });

    it("does nothing for non-existent id", () => {
      const { store } = makeStore();
      store.getState().open("a", "1", { v: 1 });
      store.getState().setData("a", "999", { v: 2 });
      expect(store.getState().stack[0]?.data).toEqual({ v: 1 });
    });
  });

  // ── Ad-hoc component registry ───────────────

  describe("ad-hoc components", () => {
    it("registers components and deduplicates", () => {
      const { store, componentRegistry } = makeStore();
      const MySheet = () => null;
      store.getState().open(MySheet, { a: 1 });
      store.getState().push(MySheet, { a: 2 });

      // Same component should have same key
      expect(componentRegistry.size).toBe(1);
      expect(store.getState().stack[0]?.type).toBe(
        store.getState().stack[1]?.type
      );
    });

    it("assigns different keys to different components", () => {
      const { store, componentRegistry } = makeStore();
      const SheetA = () => null;
      const SheetB = () => null;
      store.getState().open(SheetA, {});
      store.getState().push(SheetB, {});
      expect(componentRegistry.size).toBe(2);
    });

    it("navigate detects same component type", () => {
      const { store } = makeStore();
      const MySheet = () => null;
      store.getState().open(MySheet, { v: 1 });
      store.getState().navigate(MySheet, { v: 2 });
      // Same type → replace, not push
      expect(store.getState().stack).toHaveLength(1);
      expect(store.getState().stack[0]?.data).toEqual({ v: 2 });
    });
  });
});
