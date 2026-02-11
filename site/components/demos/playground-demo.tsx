"use client";

import {
  type MutableRefObject,
  type ReactNode,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Sheet,
  type SheetActions,
  type Side,
  type SpringPreset,
  createStacksheet,
} from "@howells/stacksheet";

// ── Type registry ──────────────────────────────

type SheetTypeMap = {
  Push: { description: string };
  Navigate: { description: string };
  Replace: { description: string };
  Swap: { description: string };
  Pop: { description: string };
  Close: { description: string };
  Composable: { variant: string; parts: string[] };
  Stacking: { description: string };
  Config: { category: string; description: string };
};

type SheetKey = keyof SheetTypeMap;

// ── Tour order ─────────────────────────────────

const tourOrder: SheetKey[] = [
  "Push", "Navigate", "Replace", "Swap", "Pop", "Close",
  "Composable", "Stacking", "Config",
];

// ── Data presets ───────────────────────────────

const presets: Record<SheetKey, SheetTypeMap[SheetKey][]> = {
  Push: [{ description: "Adds a sheet on top of the stack." }],
  Navigate: [{ description: "Replaces the stack above the current sheet." }],
  Replace: [{ description: "Swaps the current sheet in-place." }],
  Swap: [{ description: "Changes the type and data of the current sheet." }],
  Pop: [{ description: "Removes the topmost sheet from the stack." }],
  Close: [{ description: "Clears the entire stack." }],
  Composable: [
    { variant: "Full layout", parts: ["Handle", "Back", "Title", "Close", "Body", "Footer"] },
    { variant: "Minimal", parts: ["Title", "Close", "Body"] },
    { variant: "With footer", parts: ["Back", "Title", "Close", "Body", "Footer"] },
  ],
  Stacking: [{ description: "Depth-aware stack behavior." }],
  Config: [
    { category: "Position", description: "Side placement, breakpoints, and responsive behavior." },
    { category: "Animation", description: "Spring presets, drag thresholds, and velocity." },
    { category: "Behavior", description: "Overlay, scroll lock, escape close, and modal mode." },
  ],
};

// ── Dot colors ─────────────────────────────────

const dotColors: Record<string, string> = {
  Push: "bg-blue-500",
  Navigate: "bg-blue-500",
  Replace: "bg-blue-500",
  Swap: "bg-blue-500",
  Pop: "bg-blue-500",
  Close: "bg-blue-500",
  Composable: "bg-violet-500",
  Stacking: "bg-amber-500",
  Config: "bg-emerald-500",
};

// ── Playground context ─────────────────────────

type StacksheetReturn = ReturnType<typeof createStacksheet<SheetTypeMap>>;

interface PlaygroundCtx {
  store: StacksheetReturn["store"];
  StacksheetProvider: StacksheetReturn["StacksheetProvider"];
  visitedRef: MutableRefObject<Set<string>>;
}

const PlaygroundContext = createContext<PlaygroundCtx | null>(null);

function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error("Missing PlaygroundContext");
  return ctx;
}

function useActions(): SheetActions<SheetTypeMap> {
  const { store } = usePlayground();
  return useMemo(() => {
    const s = store.getState();
    return {
      open: s.open,
      push: s.push,
      replace: s.replace,
      swap: s.swap,
      navigate: s.navigate,
      setData: s.setData,
      remove: s.remove,
      pop: s.pop,
      close: s.close,
    };
  }, [store]);
}

function useStack() {
  const { store } = usePlayground();
  return useSyncExternalStore(
    store.subscribe,
    () => store.getState().stack,
    () => store.getState().stack,
  );
}

// ── useNextSheet hook ──────────────────────────

function useNextSheet(): { nextKey: string | null; goNext: () => void } | null {
  const stack = useStack();
  const actions = useActions();
  if (stack.length === 0) return null;
  const currentType = stack[stack.length - 1].type as SheetKey;
  const idx = tourOrder.indexOf(currentType);
  if (idx === -1) return null;
  if (idx === tourOrder.length - 1) {
    return { nextKey: null, goNext: () => actions.close() };
  }
  const nextKey = tourOrder[idx + 1];
  const data = presets[nextKey][0];
  return {
    nextKey,
    goNext: () => actions.push(nextKey, `tour-${Date.now()}`, data as never),
  };
}

// ── Toggle (config panel) ────────────────────

function Toggle({ on }: { on?: boolean }) {
  return (
    <span
      className={`inline-block w-9 h-5 rounded-full relative transition-colors duration-150 ${on ? "bg-zinc-950" : "bg-zinc-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${on ? "translate-x-3.5" : ""}`}
      />
    </span>
  );
}

// ── Scroll area (native) ─────────────────────

const scrollLight = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(161,161,170,0.5) transparent",
} as const;

const scrollDark = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(82,82,91,0.4) transparent",
} as const;

// ── Shared sheet controls ─────────────────────

function SheetControls({ children }: { children: ReactNode }) {
  const actions = useActions();
  const stack = useStack();
  const { visitedRef } = usePlayground();
  const counterRef = useRef(0);

  // Mark current type as visited
  if (stack.length > 0) {
    visitedRef.current.add(stack[stack.length - 1].type);
  }

  function doAction(name: "push" | "navigate" | "replace") {
    const key = tourOrder[counterRef.current % tourOrder.length];
    const list = presets[key];
    const data = list[counterRef.current % list.length];
    counterRef.current++;
    actions[name](key, `sheet-${Date.now()}`, data as never);
  }

  function doSwap() {
    const key = tourOrder[counterRef.current % tourOrder.length];
    const list = presets[key];
    const data = list[counterRef.current % list.length];
    counterRef.current++;
    actions.swap(key, data as never);
  }

  return (
    <div>
      {children}

      <div className="h-px bg-zinc-100 my-5" />

      <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2.5">
        Try an action
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(["push", "navigate", "replace"] as const).map((name) => (
          <button
            key={name}
            className="inline-flex items-center h-7 px-3 text-xs font-medium border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
            style={{ fontFamily: "var(--font-mono)" }}
            onClick={() => doAction(name)}
            type="button"
          >
            {name}
          </button>
        ))}
        <button
          className="inline-flex items-center h-7 px-3 text-xs font-medium border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          style={{ fontFamily: "var(--font-mono)" }}
          onClick={() => doSwap()}
          type="button"
        >
          swap
        </button>
        <button
          className="inline-flex items-center h-7 px-3 text-xs font-medium border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          style={{ fontFamily: "var(--font-mono)" }}
          onClick={() => actions.pop()}
          type="button"
        >
          pop
        </button>
        <button
          className="inline-flex items-center h-7 px-3 text-xs font-medium border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          style={{ fontFamily: "var(--font-mono)" }}
          onClick={() => actions.close()}
          type="button"
        >
          close
        </button>
      </div>

      <div className="h-px bg-zinc-100 my-5" />

      <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2.5">
        Contents
      </p>
      <div className="flex flex-col gap-0.5">
        {tourOrder.map((type) => {
          const isCurrent = stack.length > 0 && stack[stack.length - 1].type === type;
          const isVisited = !isCurrent && visitedRef.current.has(type);
          const isLocked = !isCurrent && !isVisited;

          return (
            <button
              key={type}
              className={`flex items-center gap-2 py-1.5 px-2.5 border-none rounded-md text-sm w-full text-left transition-colors duration-150 ${
                isCurrent
                  ? "bg-zinc-100 cursor-default"
                  : isVisited
                    ? "bg-transparent cursor-pointer hover:bg-zinc-50"
                    : "bg-transparent cursor-default"
              }`}
              disabled={isCurrent || isLocked}
              onClick={() => {
                if (isVisited) {
                  const list = presets[type];
                  actions.open(type, `revisit-${Date.now()}`, list[0] as never);
                }
              }}
              type="button"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${isCurrent || isVisited ? dotColors[type] : "bg-zinc-200"}`}
              />
              <span className={`font-medium ${isLocked ? "text-zinc-300" : "text-zinc-950"}`}>
                {type}
              </span>
              {isCurrent && (
                <span className="ml-auto text-[11px] font-medium text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-full">
                  current
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sheet components ───────────────────────────

// Shared header bar used by composable sheets
function HeaderBar({ children }: { children: ReactNode }) {
  return (
    <Sheet.Header
      className="flex items-center justify-between h-14 px-5 border-b border-zinc-100"
    >
      {children}
    </Sheet.Header>
  );
}

// Shared footer bar
function FooterBar({ children }: { children: ReactNode }) {
  return (
    <Sheet.Footer className="flex items-center gap-2 px-5 py-4 border-t border-zinc-100">
      {children}
    </Sheet.Footer>
  );
}

function FooterButton({
  children,
  variant = "secondary",
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}) {
  return (
    <button
      className={`h-9 px-4 text-sm font-medium rounded-full cursor-pointer transition-colors duration-150 ${
        variant === "primary"
          ? "bg-zinc-950 text-white hover:bg-zinc-800"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

// ── Syntax highlighting ──────────────────────────

const syntaxColors = {
  keyword: "#87a083",   // sage green
  string: "#c9a87c",    // warm sand
  comment: "#5a5a62",   // dim stone
  component: "#8aacbd", // dusty blue
  boolean: "#b89cb0",   // muted mauve
  number: "#b89cb0",    // muted mauve
  plain: "#9a9aa2",     // neutral base
} as const;

const SYNTAX_RE =
  /(\/\/[^\n]*)|(["'][^"']*["'])|(`[^`]*`)|(\b(?:import|from|const|function|return|export|type)\b)|(\b(?:true|false|undefined|null)\b)|(<\/?[A-Z]\w*)|(\b\d+\.?\d*\b)/g;

function highlightCode(code: string) {
  const parts: { text: string; color: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  SYNTAX_RE.lastIndex = 0;
  while ((match = SYNTAX_RE.exec(code)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: code.slice(lastIndex, match.index), color: syntaxColors.plain });
    }
    const color = match[1]
      ? syntaxColors.comment
      : match[2] || match[3]
        ? syntaxColors.string
        : match[4]
          ? syntaxColors.keyword
          : match[5]
            ? syntaxColors.boolean
            : match[6]
              ? syntaxColors.component
              : match[7]
                ? syntaxColors.number
                : syntaxColors.plain;
    parts.push({ text: match[0], color });
    lastIndex = SYNTAX_RE.lastIndex;
  }
  if (lastIndex < code.length) {
    parts.push({ text: code.slice(lastIndex), color: syntaxColors.plain });
  }
  return parts;
}

function SyntaxHighlight({ code, className = "text-[13px]" }: { code: string; className?: string }) {
  const parts = highlightCode(code);
  return (
    <code className={`${className} whitespace-pre`} style={{ fontFamily: "var(--font-mono)" }}>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.color }}>{p.text}</span>
      ))}
    </code>
  );
}

// ── CodeBlock ─────────────────────────────────

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="rounded-lg p-3.5 text-xs leading-relaxed whitespace-pre overflow-x-auto" style={{ backgroundColor: "#1c1c1e", fontFamily: "var(--font-mono)" }}>
      <SyntaxHighlight code={children} className="text-xs" />
    </div>
  );
}

// ── NextFooter ────────────────────────────────

function NextFooter() {
  const next = useNextSheet();
  if (!next) return null;
  return (
    <FooterBar>
      <FooterButton variant="primary" onClick={next.goNext}>
        {next.nextKey ? `Next: ${next.nextKey} \u2192` : "Finish"}
      </FooterButton>
    </FooterBar>
  );
}

// ── Action content ────────────────────────────

const actionContent: Record<string, {
  snippet: string;
  explanation: string;
  related: { name: string; detail: string }[];
}> = {
  Push: {
    snippet: `// Push adds a new sheet on top
actions.push("Settings", {
  category: "Position"
})`,
    explanation: "Push adds a new sheet to the top of the stack. The stack grows by one \u2014 use it to show additional detail without losing the current view.",
    related: [
      { name: "push", detail: "Add a sheet on top of the stack" },
      { name: "pop", detail: "Remove the top sheet" },
      { name: "close", detail: "Clear the entire stack" },
    ],
  },
  Navigate: {
    snippet: `// Navigate replaces everything above
actions.navigate("Profile", {
  userId: "abc-123"
})`,
    explanation: "Navigate replaces the entire stack above the current sheet with a new one. Like push, but clears anything stacked on top first.",
    related: [
      { name: "navigate", detail: "Replace everything above current" },
      { name: "open", detail: "Clear stack, open fresh" },
      { name: "remove", detail: "Remove a sheet by ID" },
    ],
  },
  Replace: {
    snippet: `// Replace swaps the current sheet
actions.replace("Confirm", {
  action: "delete"
})`,
    explanation: "Replace swaps the current sheet with a new one in-place. The stack depth stays the same \u2014 the old sheet is removed and the new one takes its position.",
    related: [
      { name: "replace", detail: "Swap current sheet in-place" },
      { name: "swap", detail: "Change type & data of current" },
      { name: "setData", detail: "Update data without replacing" },
    ],
  },
  Swap: {
    snippet: `// Swap changes type and data in-place
actions.swap("Alert", {
  message: "Saved!"
})`,
    explanation: "Swap changes the type and data of the current sheet without replacing it. The sheet ID stays the same \u2014 a lighter-weight alternative to replace.",
    related: [
      { name: "swap", detail: "Change type & data of current" },
      { name: "replace", detail: "Swap current sheet entirely" },
      { name: "setData", detail: "Update data only" },
    ],
  },
  Pop: {
    snippet: `// Pop removes the top sheet
actions.pop()`,
    explanation: "Pop removes the topmost sheet from the stack, revealing the one beneath it. If only one sheet remains, pop closes everything.",
    related: [
      { name: "pop", detail: "Remove the top sheet" },
      { name: "remove", detail: "Remove a specific sheet by ID" },
      { name: "close", detail: "Clear the entire stack" },
    ],
  },
  Close: {
    snippet: `// Close clears the entire stack
actions.close()`,
    explanation: "Close removes all sheets from the stack at once. The panel animates out completely \u2014 use it when the user is done with the entire flow.",
    related: [
      { name: "close", detail: "Clear the entire stack" },
      { name: "pop", detail: "Remove just the top sheet" },
      { name: "open", detail: "Clear and open a fresh sheet" },
    ],
  },
};

// ── Action sheet ──────────────────────────────

function ActionSheet(_props: { description: string }) {
  const stack = useStack();
  const currentType = stack.length > 0 ? (stack[stack.length - 1].type as string) : "Push";
  const content = actionContent[currentType] || actionContent.Push;
  const highlight = currentType.toLowerCase();

  return (
    <>
      <HeaderBar>
        <div className="flex items-center gap-2">
          <Sheet.Back className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
          <Sheet.Title className="text-sm font-semibold">{currentType}</Sheet.Title>
        </div>
        <Sheet.Close className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
      </HeaderBar>
      <Sheet.Body>
        <div className="px-5 py-4">
          <SheetControls>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              {content.explanation}
            </p>

            <div className="flex flex-col mb-4">
              {content.related.map(({ name, detail }) => (
                <div
                  key={name}
                  className={`flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-b-0 ${name === highlight ? "bg-blue-50 -mx-2 px-2 rounded-md border-transparent" : ""}`}
                >
                  <code className={`text-[13px] font-medium ${name === highlight ? "text-blue-600" : "text-zinc-950"}`} style={{ fontFamily: "var(--font-mono)" }}>
                    {name}
                  </code>
                  <span className="text-xs text-zinc-500">{detail}</span>
                </div>
              ))}
            </div>

            <CodeBlock>{content.snippet}</CodeBlock>
          </SheetControls>
        </div>
      </Sheet.Body>
      <NextFooter />
    </>
  );
}

// ── Composable sheet ──────────────────────────

function ComposableSheet({ variant, parts }: SheetTypeMap["Composable"]) {
  const hasPart = (p: string) => parts.includes(p);

  return (
    <>
      {hasPart("Handle") && <Sheet.Handle />}
      <HeaderBar>
        <div className="flex items-center gap-2">
          {hasPart("Back") && (
            <Sheet.Back className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
          )}
          {hasPart("Title") && (
            <Sheet.Title className="text-sm font-semibold">Composable</Sheet.Title>
          )}
        </div>
        {hasPart("Close") && (
          <Sheet.Close className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
        )}
      </HeaderBar>
      <Sheet.Body>
        <div className="px-5 py-4">
          <SheetControls>
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-1">
              {variant}
            </p>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              Compose sheets from <code className="text-zinc-700" style={{ fontFamily: "var(--font-mono)" }}>Sheet.*</code> parts.
              Each part reads from the central store to know its context.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {["Handle", "Back", "Title", "Close", "Body", "Footer"].map((p) => (
                <span
                  key={p}
                  className={`inline-flex items-center h-7 px-3 text-xs font-medium rounded-full ${
                    hasPart(p)
                      ? "bg-violet-100 text-violet-700"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Sheet.{p}
                </span>
              ))}
            </div>

            <CodeBlock>{`<Sheet.Header>\n  <Sheet.Back />\n  <Sheet.Title>Title</Sheet.Title>\n  <Sheet.Close />\n</Sheet.Header>\n<Sheet.Body>\n  {/* Your content */}\n</Sheet.Body>${hasPart("Footer") ? "\n<Sheet.Footer>\n  {/* Actions */}\n</Sheet.Footer>" : ""}`}</CodeBlock>
          </SheetControls>
        </div>
      </Sheet.Body>
      <NextFooter />
    </>
  );
}

// ── Stacking sheet ────────────────────────────

function StackingSheet({ description }: SheetTypeMap["Stacking"]) {
  const stack = useStack();
  const actualDepth = stack.length;

  return (
    <>
      <HeaderBar>
        <div className="flex items-center gap-2">
          <Sheet.Back className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
          <Sheet.Title className="text-sm font-semibold">Stacking</Sheet.Title>
        </div>
        <Sheet.Close className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
      </HeaderBar>
      <Sheet.Body>
        <div className="px-5 py-4">
          <SheetControls>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700 text-lg font-bold">
                {actualDepth}
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-950">
                  {actualDepth === 1 ? "Root sheet" : `${actualDepth} sheets deep`}
                </p>
                <p className="text-xs text-zinc-500">
                  {description}
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              The stack is the store. Every sheet knows its position,
              and the visualization below is a direct read of store state.
            </p>

            <CodeBlock>{`// Stack config\ncreateStacksheet({\n  stacking: {\n    scaleStep: 0.04,\n    offsetStep: 36,\n    radius: 12,\n  }\n})`}</CodeBlock>
          </SheetControls>
        </div>
      </Sheet.Body>
      <NextFooter />
    </>
  );
}

// ── Config sheet ──────────────────────────────

const configSnippets: Record<string, string> = {
  Position: `createStacksheet({\n  side: { desktop: "right", mobile: "bottom" },\n  width: 420,\n  breakpoint: 768,\n})`,
  Animation: `createStacksheet({\n  spring: "stiff",\n  closeThreshold: 0.25,\n  velocityThreshold: 0.5,\n})`,
  Behavior: `createStacksheet({\n  modal: true,\n  closeOnBackdrop: true,\n  closeOnEscape: true,\n  lockScroll: true,\n})`,
};

const configRows: Record<string, { key: string; value: string }[]> = {
  Position: [
    { key: "side", value: '"right" | "left" | "bottom"' },
    { key: "width", value: "420" },
    { key: "breakpoint", value: "768" },
    { key: "maxWidth", value: '"90vw"' },
  ],
  Animation: [
    { key: "spring", value: '"stiff" | "snappy" | "natural" | ...' },
    { key: "closeThreshold", value: "0.25" },
    { key: "velocityThreshold", value: "0.5" },
  ],
  Behavior: [
    { key: "modal", value: "true" },
    { key: "closeOnBackdrop", value: "true" },
    { key: "closeOnEscape", value: "true" },
    { key: "lockScroll", value: "true" },
  ],
};

function ConfigSheet({ category, description }: SheetTypeMap["Config"]) {
  const snippet = configSnippets[category] || configSnippets.Position;
  const rows = configRows[category] || configRows.Position;

  return (
    <>
      <Sheet.Body>
        <div className="p-5">
          <SheetControls>
            <div className="rounded-lg bg-emerald-50 p-4 mb-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-emerald-600 mb-1">
                {category}
              </p>
              <p className="text-sm text-emerald-700 leading-relaxed">
                {description}
              </p>
            </div>

            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              Config is set once when creating the store. Every sheet inherits it — no per-sheet overrides needed.
            </p>

            <div className="flex flex-col mb-4">
              {rows.map(({ key, value }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-b-0">
                  <code className="text-[13px] font-medium text-zinc-950" style={{ fontFamily: "var(--font-mono)" }}>{key}</code>
                  <code className="text-[13px] text-zinc-500" style={{ fontFamily: "var(--font-mono)" }}>{value}</code>
                </div>
              ))}
            </div>

            <CodeBlock>{snippet}</CodeBlock>
          </SheetControls>
        </div>
      </Sheet.Body>
      <NextFooter />
    </>
  );
}

const sheetMap = {
  Push: ActionSheet,
  Navigate: ActionSheet,
  Replace: ActionSheet,
  Swap: ActionSheet,
  Pop: ActionSheet,
  Close: ActionSheet,
  Composable: ComposableSheet,
  Stacking: StackingSheet,
  Config: ConfigSheet,
} as const;

// ── Spring presets ─────────────────────────────

const springPresets: SpringPreset[] = [
  "stiff",
  "snappy",
  "natural",
  "subtle",
  "soft",
];

// ── Config state ───────────────────────────────

interface PlaygroundConfig {
  desktopSide: Side;
  mobileSide: Side;
  spring: SpringPreset;
  showOverlay: boolean;
  closeOnBackdrop: boolean;
  closeOnEscape: boolean;
  lockScroll: boolean;
  drag: boolean;
  dismissible: boolean;
  modal: boolean;
  shouldScaleBackground: boolean;
  width: number;
  maxWidth: string;
  breakpoint: number;
  zIndex: number;
  closeThreshold: number;
  velocityThreshold: number;
  maxDepth: number;
  stackScaleStep: number;
  stackOffsetStep: number;
  stackOpacityStep: number;
  stackRadius: number;
  stackRenderThreshold: number;
  scaleBackgroundAmount: number;
  ariaLabel: string;
}

const defaultConfig: PlaygroundConfig = {
  desktopSide: "right",
  mobileSide: "bottom",
  spring: "stiff",
  showOverlay: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  lockScroll: true,
  drag: true,
  dismissible: true,
  modal: true,
  shouldScaleBackground: false,
  width: 480,
  maxWidth: "90vw",
  breakpoint: 768,
  zIndex: 100,
  closeThreshold: 0.25,
  velocityThreshold: 0.5,
  maxDepth: 0,
  stackScaleStep: 0.04,
  stackOffsetStep: 36,
  stackOpacityStep: 0,
  stackRadius: 12,
  stackRenderThreshold: 3,
  scaleBackgroundAmount: 0.97,
  ariaLabel: "Sheet dialog",
};

// ── DemoInstance ────────────────────────────────

function DemoInstance({
  config,
  children,
}: {
  config: PlaygroundConfig;
  children: ReactNode;
}) {
  const instanceRef = useRef<StacksheetReturn | null>(null);
  const visitedRef = useRef(new Set<string>());
  if (!instanceRef.current) {
    const sideConfig =
      config.desktopSide === config.mobileSide
        ? config.desktopSide
        : { desktop: config.desktopSide, mobile: config.mobileSide };

    instanceRef.current = createStacksheet<SheetTypeMap>({
      side: sideConfig,
      spring: config.spring,
      showOverlay: config.showOverlay,
      closeOnBackdrop: config.closeOnBackdrop,
      closeOnEscape: config.closeOnEscape,
      lockScroll: config.lockScroll,
      drag: config.drag,
      dismissible: config.dismissible,
      modal: config.modal,
      shouldScaleBackground: config.shouldScaleBackground,
      width: config.width,
      maxWidth: config.maxWidth,
      breakpoint: config.breakpoint,
      zIndex: config.zIndex,
      closeThreshold: config.closeThreshold,
      velocityThreshold: config.velocityThreshold,
      maxDepth: config.maxDepth === 0 ? undefined : config.maxDepth,
      scaleBackgroundAmount: config.scaleBackgroundAmount,
      ariaLabel: config.ariaLabel,
      stacking: {
        scaleStep: config.stackScaleStep,
        offsetStep: config.stackOffsetStep,
        opacityStep: config.stackOpacityStep,
        radius: config.stackRadius,
        renderThreshold: config.stackRenderThreshold,
      },
    });
  }

  const { StacksheetProvider, store } = instanceRef.current;

  return (
    <PlaygroundContext.Provider value={{ store, StacksheetProvider, visitedRef }}>
      {children}
    </PlaygroundContext.Provider>
  );
}

// ── Pill button ────────────────────────────────

function Pill({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex items-center h-7 px-3 text-xs font-medium rounded-full cursor-pointer transition-colors duration-150 ${
        active
          ? "bg-zinc-950 text-zinc-50"
          : "shadow-[0_0_0_1px_rgba(0,0,0,0.08)] text-zinc-950 hover:bg-zinc-100"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

// ── Compact input components ───────────────────

function NumInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  placeholder?: string;
}) {
  return (
    <label className="flex items-center justify-between text-sm py-1.5">
      <span className="text-zinc-500">{label}</span>
      <input
        className="w-20 h-7 px-2 text-right text-[13px] bg-zinc-50 border border-zinc-200 rounded-md text-zinc-950 outline-none focus:ring-1 focus:ring-zinc-400"
        style={{ fontFamily: "var(--font-mono)" }}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        step={step}
        type="number"
        value={value === 0 && placeholder ? "" : value}
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between text-sm py-1.5">
      <span className="text-zinc-500">{label}</span>
      <input
        className="w-24 h-7 px-2 text-right text-[13px] bg-zinc-50 border border-zinc-200 rounded-md text-zinc-950 outline-none focus:ring-1 focus:ring-zinc-400"
        style={{ fontFamily: "var(--font-mono)" }}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        value={value}
      />
    </label>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
      {children}
    </p>
  );
}

// ── Collapsible section ────────────────────────

function Collapsible({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        className="flex items-center gap-2 w-full text-left py-2 cursor-pointer bg-transparent border-none text-[11px] font-medium uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors duration-150"
        onClick={onToggle}
        type="button"
      >
        <svg
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
        >
          <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-0.5 pb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Left Column ────────────────────────────────

function LeftColumn({
  config,
  onConfigChange,
}: {
  config: PlaygroundConfig;
  onConfigChange: (c: PlaygroundConfig) => void;
}) {
  const actions = useActions();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleOpen() {
    actions.open("Push", `tour-${Date.now()}`, presets.Push[0] as never);
  }

  const sides: Side[] = ["left", "right", "bottom"];

  const toggles: { key: keyof PlaygroundConfig; label: string }[] = [
    { key: "modal", label: "modal" },
    { key: "showOverlay", label: "overlay" },
    { key: "closeOnBackdrop", label: "backdrop close" },
    { key: "closeOnEscape", label: "escape close" },
    { key: "lockScroll", label: "lock scroll" },
    { key: "drag", label: "drag" },
    { key: "dismissible", label: "dismissible" },
    { key: "shouldScaleBackground", label: "body scale" },
  ];

  return (
    <div className="flex flex-col">
      <p className="text-sm text-zinc-500 leading-relaxed mb-6">
        A single store manages every sheet in your app. Fully typed, stack-based, composable. Powered by{" "}
        <a className="text-zinc-500 underline underline-offset-2 hover:text-zinc-950 transition-colors" href="https://zustand.docs.pmnd.rs">Zustand</a>,{" "}
        <a className="text-zinc-500 underline underline-offset-2 hover:text-zinc-950 transition-colors" href="https://motion.dev">Motion</a>,
        and a bit of <a className="text-zinc-500 underline underline-offset-2 hover:text-zinc-950 transition-colors" href="https://www.radix-ui.com">Radix</a>. All wired up.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-10">
        <button
          className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium rounded-full bg-zinc-950 text-zinc-50 border-none cursor-pointer transition-all duration-150 hover:opacity-85 active:scale-[0.97]"
          onClick={handleOpen}
          type="button"
        >
          Open a sheet
        </button>
        <a
          className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium rounded-full bg-transparent text-zinc-950 border border-zinc-200 cursor-pointer transition-colors duration-150 hover:bg-zinc-100 no-underline"
          href="/docs"
        >
          Documentation
        </a>
      </div>

      {/* ── Position ────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <SectionHeader>Desktop</SectionHeader>
          <div className="flex flex-wrap gap-1.5">
            {sides.map((s) => (
              <Pill
                key={s}
                active={config.desktopSide === s}
                onClick={() =>
                  onConfigChange({ ...config, desktopSide: s })
                }
              >
                {s}
              </Pill>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <SectionHeader>Mobile</SectionHeader>
          <div className="flex flex-wrap gap-1.5">
            {sides.map((s) => (
              <Pill
                key={s}
                active={config.mobileSide === s}
                onClick={() =>
                  onConfigChange({ ...config, mobileSide: s })
                }
              >
                {s}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-200 my-3" />

      {/* ── Spring ──────────────────────────── */}
      <div className="flex flex-col gap-2 mb-6">
        <SectionHeader>Spring</SectionHeader>
        <div className="flex flex-wrap gap-1.5">
          {springPresets.map((p) => (
            <Pill
              key={p}
              active={config.spring === p}
              onClick={() =>
                onConfigChange({ ...config, spring: p })
              }
            >
              {p}
            </Pill>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-200 my-3" />

      {/* ── Behavior ────────────────────────── */}
      <div className="flex flex-col gap-0 mb-6">
        <SectionHeader>Behavior</SectionHeader>
        <div className="flex flex-col">
          {toggles.map(({ key, label }) => (
            <button
              key={key}
              className="flex items-center justify-between py-2.5 text-sm text-zinc-950 cursor-pointer bg-transparent border-none border-b border-zinc-100 last:border-b-0 w-full text-left"
              onClick={() =>
                onConfigChange({
                  ...config,
                  [key]: !config[key],
                })
              }
              type="button"
            >
              <span>{label}</span>
              <Toggle on={config[key] as boolean} />
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-200 my-3" />

      {/* ── Collapsible sections ─────────────── */}
      <div className="flex flex-col gap-1">
        <Collapsible
          label="Layout"
          open={openSections.has("layout")}
          onToggle={() => toggleSection("layout")}
        >
          <NumInput
            label="width"
            min={100}
            onChange={(v) => onConfigChange({ ...config, width: v })}
            step={10}
            value={config.width}
          />
          <TextInput
            label="maxWidth"
            onChange={(v) => onConfigChange({ ...config, maxWidth: v })}
            value={config.maxWidth}
          />
          <NumInput
            label="breakpoint"
            min={0}
            onChange={(v) => onConfigChange({ ...config, breakpoint: v })}
            value={config.breakpoint}
          />
          <NumInput
            label="zIndex"
            min={0}
            onChange={(v) => onConfigChange({ ...config, zIndex: v })}
            value={config.zIndex}
          />
        </Collapsible>

        <Collapsible
          label="Drag"
          open={openSections.has("drag")}
          onToggle={() => toggleSection("drag")}
        >
          <NumInput
            label="closeThreshold"
            min={0}
            onChange={(v) => onConfigChange({ ...config, closeThreshold: v })}
            step={0.05}
            value={config.closeThreshold}
          />
          <NumInput
            label="velocityThreshold"
            min={0}
            onChange={(v) => onConfigChange({ ...config, velocityThreshold: v })}
            step={0.1}
            value={config.velocityThreshold}
          />
        </Collapsible>

        <Collapsible
          label="Stacking"
          open={openSections.has("stacking")}
          onToggle={() => toggleSection("stacking")}
        >
          <NumInput
            label="maxDepth"
            min={0}
            onChange={(v) => onConfigChange({ ...config, maxDepth: v })}
            placeholder="∞"
            value={config.maxDepth}
          />
          <NumInput
            label="scaleStep"
            min={0}
            onChange={(v) => onConfigChange({ ...config, stackScaleStep: v })}
            step={0.01}
            value={config.stackScaleStep}
          />
          <NumInput
            label="offsetStep"
            min={0}
            onChange={(v) => onConfigChange({ ...config, stackOffsetStep: v })}
            value={config.stackOffsetStep}
          />
          <NumInput
            label="opacityStep"
            min={0}
            onChange={(v) => onConfigChange({ ...config, stackOpacityStep: v })}
            step={0.1}
            value={config.stackOpacityStep}
          />
          <NumInput
            label="radius"
            min={0}
            onChange={(v) => onConfigChange({ ...config, stackRadius: v })}
            value={config.stackRadius}
          />
          <NumInput
            label="renderThreshold"
            min={1}
            onChange={(v) => onConfigChange({ ...config, stackRenderThreshold: v })}
            value={config.stackRenderThreshold}
          />
        </Collapsible>

        <Collapsible
          label="Advanced"
          open={openSections.has("advanced")}
          onToggle={() => toggleSection("advanced")}
        >
          <NumInput
            label="scaleBackgroundAmount"
            min={0}
            onChange={(v) => onConfigChange({ ...config, scaleBackgroundAmount: v })}
            step={0.01}
            value={config.scaleBackgroundAmount}
          />
          <TextInput
            label="ariaLabel"
            onChange={(v) => onConfigChange({ ...config, ariaLabel: v })}
            value={config.ariaLabel}
          />
        </Collapsible>
      </div>
    </div>
  );
}

// ── Right Column ───────────────────────────────

// ── Action snippets for USE ACTIONS panel ────

const actionSnippets: Record<string, string> = {
  push: `const { actions } = useSheet()\n\nactions.push("Settings", {\n  category: "Position"\n})`,
  navigate: `const { actions } = useSheet()\n\nactions.navigate("Profile", {\n  userId: "abc-123"\n})`,
  replace: `const { actions } = useSheet()\n\nactions.replace("Confirm", {\n  action: "delete"\n})`,
  swap: `const { actions } = useSheet()\n\nactions.swap("Alert", {\n  message: "Saved!"\n})`,
  pop: `const { actions } = useSheet()\n\nactions.pop()`,
  close: `const { actions } = useSheet()\n\nactions.close()`,
};

const actionKeys = ["push", "navigate", "replace", "swap", "pop", "close"] as const;

function useConfigCode(config: PlaygroundConfig): string {
  const configParts: string[] = [];

  if (config.desktopSide !== "right" || config.mobileSide !== "bottom") {
    if (config.desktopSide === config.mobileSide) {
      configParts.push(`side: "${config.desktopSide}"`);
    } else {
      configParts.push(
        `side: { desktop: "${config.desktopSide}", mobile: "${config.mobileSide}" }`
      );
    }
  }

  if (config.spring !== "stiff") configParts.push(`spring: "${config.spring}"`);

  if (!config.showOverlay) configParts.push("showOverlay: false");
  if (!config.closeOnBackdrop) configParts.push("closeOnBackdrop: false");
  if (!config.closeOnEscape) configParts.push("closeOnEscape: false");
  if (!config.lockScroll) configParts.push("lockScroll: false");
  if (!config.drag) configParts.push("drag: false");
  if (!config.dismissible) configParts.push("dismissible: false");
  if (!config.modal) configParts.push("modal: false");
  if (config.shouldScaleBackground)
    configParts.push("shouldScaleBackground: true");

  if (config.width !== 480) configParts.push(`width: ${config.width}`);
  if (config.maxWidth !== "90vw")
    configParts.push(`maxWidth: "${config.maxWidth}"`);
  if (config.breakpoint !== 768)
    configParts.push(`breakpoint: ${config.breakpoint}`);
  if (config.zIndex !== 100) configParts.push(`zIndex: ${config.zIndex}`);

  if (config.closeThreshold !== 0.25)
    configParts.push(`closeThreshold: ${config.closeThreshold}`);
  if (config.velocityThreshold !== 0.5)
    configParts.push(`velocityThreshold: ${config.velocityThreshold}`);

  if (config.maxDepth > 0) configParts.push(`maxDepth: ${config.maxDepth}`);

  if (config.scaleBackgroundAmount !== 0.97)
    configParts.push(`scaleBackgroundAmount: ${config.scaleBackgroundAmount}`);

  if (config.ariaLabel !== "Sheet dialog")
    configParts.push(`ariaLabel: "${config.ariaLabel}"`);

  const stackingParts: string[] = [];
  if (config.stackScaleStep !== 0.04)
    stackingParts.push(`scaleStep: ${config.stackScaleStep}`);
  if (config.stackOffsetStep !== 36)
    stackingParts.push(`offsetStep: ${config.stackOffsetStep}`);
  if (config.stackOpacityStep !== 0)
    stackingParts.push(`opacityStep: ${config.stackOpacityStep}`);
  if (config.stackRadius !== 12)
    stackingParts.push(`radius: ${config.stackRadius}`);
  if (config.stackRenderThreshold !== 3)
    stackingParts.push(`renderThreshold: ${config.stackRenderThreshold}`);
  if (stackingParts.length > 0) {
    configParts.push(
      `stacking: {\n    ${stackingParts.join(",\n    ")}\n  }`
    );
  }

  const call = configParts.length > 0
    ? `createStacksheet({\n  ${configParts.join(",\n  ")}\n})`
    : "createStacksheet()";

  return `import { createStacksheet } from "@howells/stacksheet"\n\nconst {\n  StacksheetProvider,\n  useSheet,\n} = ${call}`;
}

const defineCode = `import { Sheet } from "@howells/stacksheet"

function SettingsSheet({ category }) {
  const { close } = useSheet()

  return (
    <>
      <Sheet.Header>
        <Sheet.Title>{category}</Sheet.Title>
        <Sheet.Close />
      </Sheet.Header>
      <Sheet.Body>
        {/* Your content */}
      </Sheet.Body>
    </>
  )
}`;

const provideCode = `<StacksheetProvider
  sheets={{
    Settings: SettingsSheet,
    Profile: ProfileSheet,
  }}
>
  <App />
</StacksheetProvider>`;

function CodePanel({
  label,
  code,
  toolbar,
}: {
  label?: string;
  code: string;
  toolbar?: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-2 shrink-0">
        {label}
      </p>
      <div
        className="flex-1 flex flex-col rounded-xl overflow-y-auto"
        style={{ backgroundColor: "#1c1c1e", ...scrollDark }}
      >
        {toolbar && <div className="px-5 pt-4 pb-2 shrink-0">{toolbar}</div>}
        <div className="px-5 pb-5" style={toolbar ? undefined : { paddingTop: "1.25rem" }}>
          <SyntaxHighlight code={code} />
        </div>
      </div>
    </div>
  );
}

function RightColumn({ config }: { config: PlaygroundConfig }) {
  const [activeAction, setActiveAction] = useState<typeof actionKeys[number]>("push");
  const configCode = useConfigCode(config);

  return (
    <div className="grid grid-cols-1 @min-[1080px]:grid-cols-2 @min-[1080px]:grid-rows-2 @min-[1080px]:h-full gap-3 p-8">
      <CodePanel label="Create" code={configCode} />
      <CodePanel label="Define" code={defineCode} />
      <CodePanel label="Provide" code={provideCode} />
      <CodePanel
        label="Use"
        code={actionSnippets[activeAction]}
        toolbar={
          <div className="flex flex-wrap gap-1">
            {actionKeys.map((key) => (
              <button
                key={key}
                className={`inline-flex items-center h-6 px-2.5 text-[11px] font-medium rounded-full cursor-pointer transition-colors duration-150 ${
                  activeAction === key
                    ? "bg-white/15 text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
                onClick={() => setActiveAction(key)}
                type="button"
              >
                {key}
              </button>
            ))}
          </div>
        }
      />
    </div>
  );
}

// ── Page Content ───────────────────────────────

// ── Header ──────────────────────────────────────

function PageHeader() {
  return (
    <header className="flex items-center justify-between h-14 px-8 border-b border-zinc-200">
      <span className="text-xl font-semibold tracking-tight">Stacksheet</span>
      <nav className="flex items-center gap-6">
        <a
          className="text-sm text-zinc-500 no-underline hover:text-zinc-950 transition-colors duration-150"
          href="/docs"
        >
          Docs
        </a>
        <a
          className="text-sm text-zinc-500 no-underline hover:text-zinc-950 transition-colors duration-150"
          href="https://github.com/howells/stacksheet"
        >
          GitHub
        </a>
        <a
          className="text-sm text-zinc-400 no-underline hover:text-zinc-950 transition-colors duration-150"
          href="https://danielhowells.com"
        >
          by Howells
        </a>
      </nav>
    </header>
  );
}

// ── Page Content ───────────────────────────────

function PageContent({
  config,
  onConfigChange,
}: {
  config: PlaygroundConfig;
  onConfigChange: (c: PlaygroundConfig) => void;
}) {
  const { StacksheetProvider } = usePlayground();

  return (
    <StacksheetProvider sheets={sheetMap} renderHeader={false}>
      <div data-stacksheet-wrapper="" className="flex flex-col h-dvh overflow-hidden">
        <PageHeader />
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[420px_1fr] grid-rows-[1fr]">
          <div
            className="border-r border-zinc-200 overflow-y-auto p-8"
            style={scrollLight}
          >
            <LeftColumn config={config} onConfigChange={onConfigChange} />
          </div>
          <div className="@container min-h-0 overflow-y-auto" style={scrollLight}>
            <RightColumn config={config} />
          </div>
        </div>
      </div>
    </StacksheetProvider>
  );
}

// ── PlaygroundDemo (root) ──────────────────────

export function PlaygroundDemo() {
  const [config, setConfig] =
    useState<PlaygroundConfig>(defaultConfig);
  const [configVersion, setConfigVersion] = useState(0);

  function handleConfigChange(next: PlaygroundConfig) {
    setConfig(next);
    setConfigVersion((v) => v + 1);
  }

  return (
    <DemoInstance key={configVersion} config={config}>
      <PageContent config={config} onConfigChange={handleConfigChange} />
    </DemoInstance>
  );
}
