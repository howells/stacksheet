"use client";

import {
  createStacksheet,
  Sheet,
  type SheetActions,
  type Side,
  type SpringPreset,
} from "@howells/stacksheet";
import {
  Content as CollapsibleContent,
  Root as CollapsibleRoot,
  Trigger as CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import {
  Root as ScrollAreaRoot,
  Scrollbar as ScrollAreaScrollbar,
  Thumb as ScrollAreaThumb,
  Viewport as ScrollAreaViewport,
} from "@radix-ui/react-scroll-area";
import {
  Root as SwitchRoot,
  Thumb as SwitchThumb,
} from "@radix-ui/react-switch";
import { Content as TabsContent, Root as TabsRoot } from "@radix-ui/react-tabs";
import { motion as m } from "motion/react";
import { useTheme } from "next-themes";
import {
  createContext,
  type MutableRefObject,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Wordmark } from "@/components/brand/wordmark";

// ── Type registry ──────────────────────────────

interface SheetTypeMap {
  Push: { description: string };
  Navigate: { description: string };
  Replace: { description: string };
  Swap: { description: string };
  Pop: { description: string };
  Close: { description: string };
  Composable: { variant: string; parts: string[] };
  Stacking: { description: string };
  Config: { category: string; description: string };
}

type SheetKey = keyof SheetTypeMap;

// ── Tour order ─────────────────────────────────

const tourOrder: SheetKey[] = [
  "Push",
  "Navigate",
  "Replace",
  "Swap",
  "Pop",
  "Close",
  "Composable",
  "Stacking",
  "Config",
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
    { variant: "Minimal", parts: ["Title", "Close", "Body"] },
    {
      variant: "With footer",
      parts: ["Back", "Title", "Close", "Body", "Footer"],
    },
  ],
  Stacking: [{ description: "Depth-aware stack behavior." }],
  Config: [
    {
      category: "Position",
      description: "Side placement, breakpoints, and responsive behavior.",
    },
    {
      category: "Animation",
      description: "Spring presets, drag thresholds, and velocity.",
    },
    {
      category: "Behavior",
      description: "Overlay, scroll lock, escape close, and modal mode.",
    },
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
  if (!ctx) {
    throw new Error("Missing PlaygroundContext");
  }
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
    () => store.getState().stack
  );
}

// ── useNextSheet hook ──────────────────────────

function useNextSheet(
  sheetType: SheetKey
): { nextKey: string | null; goNext: () => void } | null {
  const actions = useActions();
  const idx = tourOrder.indexOf(sheetType);
  if (idx === -1) {
    return null;
  }
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

function Toggle({
  id,
  on,
  onToggle,
}: {
  id: string;
  on: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <SwitchRoot
      checked={on}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full bg-zinc-300 transition-colors duration-150 data-[state=checked]:bg-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 dark:bg-zinc-600 dark:data-[state=checked]:bg-zinc-400"
      id={id}
      onCheckedChange={onToggle}
    >
      <SwitchThumb className="pointer-events-none absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 will-change-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 dark:bg-zinc-900" />
    </SwitchRoot>
  );
}

// ── Scroll area blocks ───────────────────────

function BlockScrollArea({
  children,
  className,
  thumbClassName = "bg-zinc-300/70 dark:bg-zinc-600/70",
  viewportClassName,
  scrollbarClassName,
}: {
  children: ReactNode;
  className?: string;
  thumbClassName?: string;
  viewportClassName?: string;
  scrollbarClassName?: string;
}) {
  return (
    <ScrollAreaRoot className={`min-h-0 overflow-hidden ${className ?? ""}`}>
      <ScrollAreaViewport
        className={`h-full w-full overscroll-contain ${viewportClassName ?? ""}`}
      >
        {children}
      </ScrollAreaViewport>
      <ScrollAreaScrollbar
        className={`flex w-2 touch-none select-none ${scrollbarClassName ?? ""}`}
        orientation="vertical"
      >
        <ScrollAreaThumb
          className={`relative flex-1 rounded-full ${thumbClassName}`}
        />
      </ScrollAreaScrollbar>
    </ScrollAreaRoot>
  );
}

// ── Shared sheet controls ─────────────────────

function SheetControls({
  sheetType,
  children,
}: {
  sheetType: SheetKey;
  children: ReactNode;
}) {
  const actions = useActions();
  const { visitedRef } = usePlayground();

  visitedRef.current.add(sheetType);

  return (
    <div>
      {children}

      <div className="my-5 h-px bg-zinc-100 dark:bg-zinc-800" />

      <p className="mb-2.5 text-[11px] text-zinc-400 uppercase tracking-widest dark:text-zinc-500">
        Contents
      </p>
      <div className="flex flex-col gap-0.5">
        {tourOrder.map((type) => {
          const isCurrent = type === sheetType;
          const isVisited = !isCurrent && visitedRef.current.has(type);
          const isLocked = !(isCurrent || isVisited);

          return (
            <button
              className={`flex w-full items-center gap-2 rounded-md border-none px-2.5 py-1.5 text-left text-sm transition-colors duration-150 ${
                isCurrent
                  ? "cursor-default bg-zinc-100 dark:bg-zinc-800"
                  : isVisited
                    ? "cursor-pointer bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    : "cursor-default bg-transparent"
              }`}
              disabled={isCurrent || isLocked}
              key={type}
              onClick={() => {
                if (isVisited) {
                  const list = presets[type];
                  actions.open(type, `revisit-${Date.now()}`, list[0] as never);
                }
              }}
              type="button"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${isCurrent || isVisited ? dotColors[type] : "bg-zinc-200 dark:bg-zinc-700"}`}
              />
              <span
                className={`${isLocked ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-950 dark:text-zinc-100"}`}
              >
                {type}
              </span>
              {isCurrent && (
                <span className="ml-auto rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
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

function Button({
  children,
  variant = "secondary",
  onClick,
  href,
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center h-10 px-6 text-sm rounded-full cursor-pointer transition-all duration-150 active:scale-[0.97] ${
    variant === "primary"
      ? "bg-zinc-950 text-zinc-50 border-none hover:opacity-85 dark:bg-zinc-50 dark:text-zinc-950"
      : "bg-transparent text-zinc-950 border border-zinc-200 hover:bg-zinc-100 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
  } ${className ?? ""}`;

  if (href) {
    return (
      <a className={`${cls} no-underline`} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={cls} onClick={onClick} type="button">
      {children}
    </button>
  );
}

// ── Syntax highlighting ──────────────────────────

const syntaxColors = {
  keyword: "#87a083", // sage green
  string: "#c9a87c", // warm sand
  comment: "#5a5a62", // dim stone
  component: "#8aacbd", // dusty blue
  boolean: "#b89cb0", // muted mauve
  number: "#b89cb0", // muted mauve
  plain: "#9a9aa2", // neutral base
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
      parts.push({
        text: code.slice(lastIndex, match.index),
        color: syntaxColors.plain,
      });
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

function SyntaxHighlight({
  code,
  className = "text-sm",
}: {
  code: string;
  className?: string;
}) {
  const parts = highlightCode(code);
  return (
    <code
      className={`${className} whitespace-pre`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.color }}>
          {p.text}
        </span>
      ))}
    </code>
  );
}

// ── CodeBlock ─────────────────────────────────

function CodeBlock({ children }: { children: string }) {
  return (
    <div
      className="overflow-x-auto whitespace-pre rounded-lg p-3.5 text-sm leading-relaxed"
      style={{ backgroundColor: "#1c1c1e", fontFamily: "var(--font-mono)" }}
    >
      <SyntaxHighlight className="text-sm" code={children} />
    </div>
  );
}

// ── NextFooter ────────────────────────────────

function NextFooter({ sheetType }: { sheetType: SheetKey }) {
  const next = useNextSheet(sheetType);
  if (!next) {
    return null;
  }
  return (
    <Sheet.Footer>
      <Button onClick={next.goNext} variant="primary">
        {next.nextKey ? `Next: ${next.nextKey} \u2192` : "Finish"}
      </Button>
    </Sheet.Footer>
  );
}

// ── Action content ────────────────────────────

const actionContent: Record<
  string,
  {
    snippet: string;
    explanation: string;
    related: { name: string; detail: string }[];
  }
> = {
  Push: {
    snippet: `// Push adds a new sheet on top
actions.push("Settings", {
  category: "Position"
})`,
    explanation:
      "Push adds a new sheet to the top of the stack. The stack grows by one \u2014 use it to show additional detail without losing the current view.",
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
    explanation:
      "Navigate replaces the entire stack above the current sheet with a new one. Like push, but clears anything stacked on top first.",
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
    explanation:
      "Replace swaps the current sheet with a new one in-place. The stack depth stays the same \u2014 the old sheet is removed and the new one takes its position.",
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
    explanation:
      "Swap changes the type and data of the current sheet without replacing it. The sheet ID stays the same \u2014 a lighter-weight alternative to replace.",
    related: [
      { name: "swap", detail: "Change type & data of current" },
      { name: "replace", detail: "Swap current sheet entirely" },
      { name: "setData", detail: "Update data only" },
    ],
  },
  Pop: {
    snippet: `// Pop removes the top sheet
actions.pop()`,
    explanation:
      "Pop removes the topmost sheet from the stack, revealing the one beneath it. If only one sheet remains, pop closes everything.",
    related: [
      { name: "pop", detail: "Remove the top sheet" },
      { name: "remove", detail: "Remove a specific sheet by ID" },
      { name: "close", detail: "Clear the entire stack" },
    ],
  },
  Close: {
    snippet: `// Close clears the entire stack
actions.close()`,
    explanation:
      "Close removes all sheets from the stack at once. The panel animates out completely \u2014 use it when the user is done with the entire flow.",
    related: [
      { name: "close", detail: "Clear the entire stack" },
      { name: "pop", detail: "Remove just the top sheet" },
      { name: "open", detail: "Clear and open a fresh sheet" },
    ],
  },
};

// ── Action sheet ──────────────────────────────

function ActionSheet(_props: { description: string }) {
  const { store } = usePlayground();
  // Capture own type at mount — stable even when other sheets push on top
  const ownTypeRef = useRef<SheetKey | null>(null);
  if (ownTypeRef.current === null) {
    const s = store.getState().stack;
    ownTypeRef.current = s.length > 0 ? (s.at(-1)?.type as SheetKey) : "Push";
  }
  const currentType = ownTypeRef.current;
  const content = actionContent[currentType] || actionContent.Push;
  const highlight = currentType.toLowerCase();

  return (
    <>
      <Sheet.Header>
        <div className="flex items-center gap-2">
          <Sheet.Back />
          <Sheet.Title>{currentType}</Sheet.Title>
        </div>
        <Sheet.Close />
      </Sheet.Header>
      <Sheet.Body>
        <div className="px-6 py-6">
          <SheetControls sheetType={currentType}>
            <p className="mb-4 text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
              {content.explanation}
            </p>

            <div className="mb-4 flex flex-col">
              {content.related.map(({ name, detail }) => (
                <div
                  className={`flex items-center justify-between border-zinc-100 border-b py-2.5 last:border-b-0 dark:border-zinc-800 ${name === highlight ? "-mx-2 rounded-md border-transparent bg-blue-50 px-2 dark:bg-blue-500/10" : ""}`}
                  key={name}
                >
                  <code
                    className={`text-sm ${name === highlight ? "text-blue-600 dark:text-blue-400" : "text-zinc-950 dark:text-zinc-100"}`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {name}
                  </code>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {detail}
                  </span>
                </div>
              ))}
            </div>

            <CodeBlock>{content.snippet}</CodeBlock>
          </SheetControls>
        </div>
      </Sheet.Body>
      <NextFooter sheetType={currentType} />
    </>
  );
}

// ── Composable sheet ──────────────────────────

function ComposableSheet({ variant, parts }: SheetTypeMap["Composable"]) {
  const hasPart = (p: string) => parts.includes(p);

  return (
    <>
      {hasPart("Handle") && <Sheet.Handle />}
      <Sheet.Header>
        <div className="flex items-center gap-2">
          {hasPart("Back") && <Sheet.Back />}
          {hasPart("Title") && <Sheet.Title>Composable</Sheet.Title>}
        </div>
        {hasPart("Close") && <Sheet.Close />}
      </Sheet.Header>
      <Sheet.Body>
        <div className="px-6 py-6">
          <SheetControls sheetType="Composable">
            <p className="mb-1 text-[11px] text-zinc-400 uppercase tracking-widest dark:text-zinc-500">
              {variant}
            </p>
            <p className="mb-4 text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
              Compose sheets from{" "}
              <code
                className="text-zinc-700 dark:text-zinc-300"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Sheet.*
              </code>{" "}
              parts. Each part reads from the central store to know its context.
            </p>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {["Handle", "Back", "Title", "Close", "Body", "Footer"].map(
                (p) => (
                  <span
                    className={`inline-flex h-7 items-center rounded-full px-3 text-sm ${
                      hasPart(p)
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                    }`}
                    key={p}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Sheet.{p}
                  </span>
                )
              )}
            </div>

            <CodeBlock>{`<Sheet.Header>\n  <Sheet.Back />\n  <Sheet.Title>Title</Sheet.Title>\n  <Sheet.Close />\n</Sheet.Header>\n<Sheet.Body>\n  {/* Your content */}\n</Sheet.Body>${hasPart("Footer") ? "\n<Sheet.Footer>\n  {/* Actions */}\n</Sheet.Footer>" : ""}`}</CodeBlock>
          </SheetControls>
        </div>
      </Sheet.Body>
      <NextFooter sheetType="Composable" />
    </>
  );
}

// ── Stacking sheet ────────────────────────────

function StackingSheet({ description }: SheetTypeMap["Stacking"]) {
  const stack = useStack();
  const actualDepth = stack.length;

  return (
    <>
      <Sheet.Header>
        <div className="flex items-center gap-2">
          <Sheet.Back />
          <Sheet.Title>Stacking</Sheet.Title>
        </div>
        <Sheet.Close />
      </Sheet.Header>
      <Sheet.Body>
        <div className="px-6 py-6">
          <SheetControls sheetType="Stacking">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-lg dark:bg-amber-500/10 dark:text-amber-400">
                {actualDepth}
              </span>
              <div>
                <p className="text-sm text-zinc-950 dark:text-zinc-100">
                  {actualDepth === 1
                    ? "Root sheet"
                    : `${actualDepth} sheets deep`}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {description}
                </p>
              </div>
            </div>

            <p className="mb-4 text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
              The stack is the store. Every sheet knows its position, and the
              visualization below is a direct read of store state.
            </p>

            <CodeBlock>
              {
                "// Stack config\ncreateStacksheet({\n  stacking: {\n    scaleStep: 0.04,\n    opacityStep: 0,\n    radius: 12,\n  }\n})"
              }
            </CodeBlock>
          </SheetControls>
        </div>
      </Sheet.Body>
      <NextFooter sheetType="Stacking" />
    </>
  );
}

// ── Config sheet ──────────────────────────────

const configSnippets: Record<string, string> = {
  Position: `createStacksheet({\n  side: { desktop: "right", mobile: "bottom" },\n  width: 420,\n  breakpoint: 768,\n})`,
  Animation: `createStacksheet({\n  spring: "stiff",\n  closeThreshold: 0.25,\n  velocityThreshold: 0.5,\n})`,
  Behavior:
    "createStacksheet({\n  modal: true,\n  closeOnBackdrop: true,\n  closeOnEscape: true,\n  lockScroll: true,\n})",
};

const configRows: Record<string, { key: string; value: string }[]> = {
  Position: [
    { key: "side", value: '"right" | "left" | "bottom"' },
    { key: "width", value: "420" },
    { key: "breakpoint", value: "768" },
    { key: "maxWidth", value: '"90vw"' },
  ],
  Animation: [
    { key: "spring", value: '"stiff" | "snappy" | "subtle"' },
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
      <Sheet.Header>
        <div className="flex items-center gap-2">
          <Sheet.Back />
          <Sheet.Title>Config</Sheet.Title>
        </div>
        <Sheet.Close />
      </Sheet.Header>
      <Sheet.Body>
        <div className="px-6 py-6">
          <SheetControls sheetType="Config">
            <p className="mb-1 text-[11px] text-zinc-400 uppercase tracking-widest dark:text-zinc-500">
              {category}
            </p>
            <p className="mb-4 text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
              {description}
            </p>

            <div className="mb-4 flex flex-col">
              {rows.map(({ key, value }) => (
                <div
                  className="flex items-center justify-between border-zinc-100 border-b py-2 last:border-b-0 dark:border-zinc-800"
                  key={key}
                >
                  <code
                    className="text-sm text-zinc-950 dark:text-zinc-100"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {key}
                  </code>
                  <code
                    className="text-sm text-zinc-500 dark:text-zinc-400"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {value}
                  </code>
                </div>
              ))}
            </div>

            <CodeBlock>{snippet}</CodeBlock>
          </SheetControls>
        </div>
      </Sheet.Body>
      <NextFooter sheetType="Config" />
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

const springPresets: SpringPreset[] = ["stiff", "snappy", "subtle"];

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
  stackOpacityStep: 0,
  stackRadius: 12,
  stackRenderThreshold: 3,
  scaleBackgroundAmount: 0.97,
  ariaLabel: "Sheet dialog",
};

// ── DemoInstance ────────────────────────────────

function DemoInstance({
  config,
  storeRef,
  children,
}: {
  config: PlaygroundConfig;
  storeRef: MutableRefObject<StacksheetReturn["store"] | null>;
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
        opacityStep: config.stackOpacityStep,
        radius: config.stackRadius,
        renderThreshold: config.stackRenderThreshold,
      },
    });
  }

  const { StacksheetProvider, store } = instanceRef.current;
  storeRef.current = store;

  return (
    <PlaygroundContext.Provider
      value={{ store, StacksheetProvider, visitedRef }}
    >
      <StacksheetProvider renderHeader={false} sheets={sheetMap}>
        {children}
      </StacksheetProvider>
    </PlaygroundContext.Provider>
  );
}

// ── Pill button ────────────────────────────────

function _Pill({
  children,
  active,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`inline-flex h-7 cursor-pointer items-center rounded-full border px-3 text-xs transition-colors duration-150 ${
        active
          ? "border-zinc-300 bg-zinc-200 text-zinc-900 hover:bg-zinc-300"
          : "border-zinc-200 bg-transparent text-zinc-950 hover:bg-zinc-100"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

// ── Segmented control ────────────────────────────

const segmentedSpring = {
  type: "spring",
  damping: 30,
  stiffness: 400,
} as const;

const segmentedVariants = {
  light: {
    container:
      "inline-flex rounded-full bg-zinc-100/80 p-[3px] dark:bg-zinc-800/80",
    button:
      "px-3 py-1 text-xs text-zinc-400 [&[data-active=true]]:text-zinc-900 dark:text-zinc-500 dark:[&[data-active=true]]:text-zinc-100",
    pill: "rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
  },
  dark: {
    container: "flex flex-wrap gap-1",
    button:
      "px-2.5 py-1 text-sm text-zinc-500 hover:text-zinc-300 [&[data-active=true]]:text-zinc-200",
    pill: "rounded-full bg-white/15",
  },
} as const;

function SegmentedControl({
  id,
  value,
  options,
  onChange,
  variant = "light",
  mono,
  className,
}: {
  id: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  variant?: "light" | "dark";
  mono?: boolean;
  className?: string;
}) {
  const styles = segmentedVariants[variant];
  return (
    <div className={`relative ${styles.container} ${className ?? ""}`}>
      {options.map((opt) => (
        <button
          className={`relative flex cursor-pointer items-center rounded-full border-none bg-transparent outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-zinc-400/50 ${styles.button}`}
          data-active={value === opt}
          key={opt}
          onClick={() => onChange(opt)}
          style={mono ? { fontFamily: "var(--font-mono)" } : undefined}
          type="button"
        >
          {value === opt && (
            <m.div
              className={`absolute inset-0 ${styles.pill}`}
              layoutId={`segmented-${id}`}
              transition={segmentedSpring}
            />
          )}
          <span className="relative">{opt}</span>
        </button>
      ))}
    </div>
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
    <label className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <input
        className="h-7 w-20 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-right text-sm text-zinc-950 outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        step={step}
        style={{ fontFamily: "var(--font-mono)" }}
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
    <label className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <input
        className="h-7 w-24 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-right text-sm text-zinc-950 outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: "var(--font-mono)" }}
        type="text"
        value={value}
      />
    </label>
  );
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] text-zinc-400 uppercase tracking-widest dark:text-zinc-500">
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
    <CollapsibleRoot onOpenChange={() => onToggle()} open={open}>
      <CollapsibleTrigger asChild>
        <button
          className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-2 text-left text-[11px] text-zinc-400 uppercase tracking-widest transition-colors duration-150 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          type="button"
        >
          <svg
            className="transition-transform duration-200"
            fill="none"
            height="10"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
            viewBox="0 0 10 10"
            width="10"
          >
            <path
              d="M3 1.5L7 5L3 8.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
          {label}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden">
        <div
          className="grid transition-[grid-template-rows] duration-200 ease-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="flex flex-col gap-0.5 pb-2">{children}</div>
        </div>
      </CollapsibleContent>
    </CollapsibleRoot>
  );
}

// ── Install data ───────────────────────────────

const pmOptions = ["pnpm", "npm", "yarn", "bun"] as const;

const installCommands: Record<string, string> = {
  pnpm: "pnpm add @howells/stacksheet",
  npm: "npm install @howells/stacksheet",
  yarn: "yarn add @howells/stacksheet",
  bun: "bun add @howells/stacksheet",
};

// ── Left Column ────────────────────────────────

function LeftColumn({
  config,
  onConfigChange,
  onOpen,
}: {
  config: PlaygroundConfig;
  onConfigChange: (c: PlaygroundConfig) => void;
  onOpen: () => void;
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["behavior"])
  );
  const [pm, setPm] = useState("pnpm");

  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
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
    <div className="grid grid-rows-[auto_auto_auto] lg:h-full lg:min-h-0 lg:grid-rows-[auto_auto_minmax(0,1fr)]">
      <section className="ss-shell-pad border-zinc-200 border-b pt-6 pb-5 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
          A single store manages every sheet in your app. Fully typed,
          stack-based, composable. Powered by{" "}
          <a
            className="text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            href="https://zustand.docs.pmnd.rs"
          >
            Zustand
          </a>
          ,{" "}
          <a
            className="text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            href="https://motion.dev"
          >
            Motion
          </a>
          , and a bit of{" "}
          <a
            className="text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            href="https://www.radix-ui.com"
          >
            Radix
          </a>
          . All wired up.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button className="w-full" onClick={onOpen} variant="primary">
            Open a sheet
          </Button>
          <Button className="w-full" href="/docs">
            Documentation
          </Button>
        </div>
      </section>

      <section className="ss-shell-pad border-zinc-200 border-b py-5 dark:border-zinc-800">
        <TabsRoot onValueChange={setPm} value={pm}>
          <div className="mb-3 flex items-center justify-between">
            <SectionHeader>Install</SectionHeader>
            <SegmentedControl
              id="pm"
              onChange={setPm}
              options={pmOptions}
              value={pm}
            />
          </div>
          {pmOptions.map((option) => (
            <TabsContent key={option} value={option}>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-100/70 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/70">
                <code
                  className="text-sm text-zinc-700 dark:text-zinc-300"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {installCommands[option]}
                </code>
                <button
                  aria-label="Copy install command"
                  className="ml-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-zinc-400 transition-colors duration-150 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  onClick={() =>
                    navigator.clipboard.writeText(installCommands[option])
                  }
                  type="button"
                >
                  <svg
                    fill="none"
                    height="14"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
              </div>
            </TabsContent>
          ))}
        </TabsRoot>
      </section>

      <section className="grid pr-0 pl-8 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)]">
        <BlockScrollArea className="min-h-0" viewportClassName="pr-8">
          <div className="pt-5 pr-3 pb-8">
            <div className="mb-4 flex flex-col gap-2.5">
              <SectionHeader>Position</SectionHeader>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Desktop
                </span>
                <SegmentedControl
                  id="desktop-side"
                  onChange={(s) =>
                    onConfigChange({ ...config, desktopSide: s as Side })
                  }
                  options={sides}
                  value={config.desktopSide}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Mobile
                </span>
                <SegmentedControl
                  id="mobile-side"
                  onChange={(s) =>
                    onConfigChange({ ...config, mobileSide: s as Side })
                  }
                  options={sides}
                  value={config.mobileSide}
                />
              </div>
            </div>

            <div className="my-3 h-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="mb-4 flex flex-col gap-2.5">
              <SectionHeader>Spring</SectionHeader>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Preset
                </span>
                <SegmentedControl
                  id="spring-preset"
                  onChange={(s) =>
                    onConfigChange({ ...config, spring: s as SpringPreset })
                  }
                  options={springPresets}
                  value={config.spring}
                />
              </div>
            </div>

            <div className="my-3 h-px bg-zinc-200 dark:bg-zinc-800" />

            <Collapsible
              label="Behavior"
              onToggle={() => toggleSection("behavior")}
              open={openSections.has("behavior")}
            >
              {toggles.map(({ key, label }) => (
                <div
                  className="flex items-center justify-between border-zinc-100 border-b py-2.5 text-sm text-zinc-950 last:border-b-0 dark:border-zinc-800 dark:text-zinc-100"
                  key={key}
                >
                  <label className="cursor-pointer" htmlFor={`behavior-${key}`}>
                    {label}
                  </label>
                  <Toggle
                    id={`behavior-${key}`}
                    on={config[key] as boolean}
                    onToggle={(checked) =>
                      onConfigChange({
                        ...config,
                        [key]: checked,
                      })
                    }
                  />
                </div>
              ))}
            </Collapsible>

            <div className="flex flex-col gap-1">
              <Collapsible
                label="Layout"
                onToggle={() => toggleSection("layout")}
                open={openSections.has("layout")}
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
                onToggle={() => toggleSection("drag")}
                open={openSections.has("drag")}
              >
                <NumInput
                  label="closeThreshold"
                  min={0}
                  onChange={(v) =>
                    onConfigChange({ ...config, closeThreshold: v })
                  }
                  step={0.05}
                  value={config.closeThreshold}
                />
                <NumInput
                  label="velocityThreshold"
                  min={0}
                  onChange={(v) =>
                    onConfigChange({ ...config, velocityThreshold: v })
                  }
                  step={0.1}
                  value={config.velocityThreshold}
                />
              </Collapsible>

              <Collapsible
                label="Stacking"
                onToggle={() => toggleSection("stacking")}
                open={openSections.has("stacking")}
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
                  onChange={(v) =>
                    onConfigChange({ ...config, stackScaleStep: v })
                  }
                  step={0.01}
                  value={config.stackScaleStep}
                />
                <NumInput
                  label="opacityStep"
                  min={0}
                  onChange={(v) =>
                    onConfigChange({ ...config, stackOpacityStep: v })
                  }
                  step={0.1}
                  value={config.stackOpacityStep}
                />
                <NumInput
                  label="radius"
                  min={0}
                  onChange={(v) =>
                    onConfigChange({ ...config, stackRadius: v })
                  }
                  value={config.stackRadius}
                />
                <NumInput
                  label="renderThreshold"
                  min={1}
                  onChange={(v) =>
                    onConfigChange({ ...config, stackRenderThreshold: v })
                  }
                  value={config.stackRenderThreshold}
                />
              </Collapsible>

              <Collapsible
                label="Advanced"
                onToggle={() => toggleSection("advanced")}
                open={openSections.has("advanced")}
              >
                <NumInput
                  label="scaleBackgroundAmount"
                  min={0}
                  onChange={(v) =>
                    onConfigChange({ ...config, scaleBackgroundAmount: v })
                  }
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
        </BlockScrollArea>
      </section>
    </div>
  );
}

// ── Right Column ───────────────────────────────

// ── Action snippets for USE ACTIONS panel ────

const actionSnippets: Record<string, string> = {
  push: `const { actions } = useSheet()

// "settings" matches the key in your sheets map.
// { heading } is spread as props onto SettingsSheet.
actions.push("settings", {
  heading: "position"
})`,
  navigate: `const { actions } = useSheet()

// Clears the stack above, opens ProfileSheet.
actions.navigate("profile", {
  userId: "abc-123"
})`,
  replace: `const { actions } = useSheet()

// Swaps the current sheet in-place.
actions.replace("confirm", {
  action: "delete"
})`,
  swap: `const { actions } = useSheet()

// Same sheet slot, different type and props.
actions.swap("alert", {
  message: "Saved!"
})`,
  pop: `const { actions } = useSheet()

// Removes the top sheet from the stack.
actions.pop()`,
  close: `const { actions } = useSheet()

// Closes the entire stack.
actions.close()`,
};

const actionKeys = [
  "push",
  "navigate",
  "replace",
  "swap",
  "pop",
  "close",
] as const;

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

  if (config.spring !== "stiff") {
    configParts.push(`spring: "${config.spring}"`);
  }

  if (!config.showOverlay) {
    configParts.push("showOverlay: false");
  }
  if (!config.closeOnBackdrop) {
    configParts.push("closeOnBackdrop: false");
  }
  if (!config.closeOnEscape) {
    configParts.push("closeOnEscape: false");
  }
  if (!config.lockScroll) {
    configParts.push("lockScroll: false");
  }
  if (!config.drag) {
    configParts.push("drag: false");
  }
  if (!config.dismissible) {
    configParts.push("dismissible: false");
  }
  if (!config.modal) {
    configParts.push("modal: false");
  }
  if (config.shouldScaleBackground) {
    configParts.push("shouldScaleBackground: true");
  }

  if (config.width !== 480) {
    configParts.push(`width: ${config.width}`);
  }
  if (config.maxWidth !== "90vw") {
    configParts.push(`maxWidth: "${config.maxWidth}"`);
  }
  if (config.breakpoint !== 768) {
    configParts.push(`breakpoint: ${config.breakpoint}`);
  }
  if (config.zIndex !== 100) {
    configParts.push(`zIndex: ${config.zIndex}`);
  }

  if (config.closeThreshold !== 0.25) {
    configParts.push(`closeThreshold: ${config.closeThreshold}`);
  }
  if (config.velocityThreshold !== 0.5) {
    configParts.push(`velocityThreshold: ${config.velocityThreshold}`);
  }

  if (config.maxDepth > 0) {
    configParts.push(`maxDepth: ${config.maxDepth}`);
  }

  if (config.scaleBackgroundAmount !== 0.97) {
    configParts.push(`scaleBackgroundAmount: ${config.scaleBackgroundAmount}`);
  }

  if (config.ariaLabel !== "Sheet dialog") {
    configParts.push(`ariaLabel: "${config.ariaLabel}"`);
  }

  const stackingParts: string[] = [];
  if (config.stackScaleStep !== 0.04) {
    stackingParts.push(`scaleStep: ${config.stackScaleStep}`);
  }
  if (config.stackOpacityStep !== 0) {
    stackingParts.push(`opacityStep: ${config.stackOpacityStep}`);
  }
  if (config.stackRadius !== 12) {
    stackingParts.push(`radius: ${config.stackRadius}`);
  }
  if (config.stackRenderThreshold !== 3) {
    stackingParts.push(`renderThreshold: ${config.stackRenderThreshold}`);
  }
  if (stackingParts.length > 0) {
    configParts.push(`stacking: {\n    ${stackingParts.join(",\n    ")}\n  }`);
  }

  const _call =
    configParts.length > 0
      ? `createStacksheet({\n  ${configParts.join(",\n  ")}\n})`
      : "createStacksheet()";

  const generic =
    configParts.length > 0
      ? `createStacksheet<Sheets>({\n  ${configParts.join(",\n  ")}\n})`
      : "createStacksheet<Sheets>()";

  return `import { createStacksheet } from "@howells/stacksheet"

// Optional: type your sheets for autocomplete.
type Sheets = {
  settings: { heading: string }
  profile: { userId: string }
}

const {
  StacksheetProvider,
  useSheet,
} = ${generic}`;
}

const defineCode = `import { Sheet } from "@howells/stacksheet"

// Props are spread directly from the action call.
function SettingsSheet({ heading }) {
  return (
    <>
      <Sheet.Header>
        <Sheet.Title>{heading}</Sheet.Title>
        <Sheet.Close />
      </Sheet.Header>
      <Sheet.Body>
        {/* Your content */}
      </Sheet.Body>
    </>
  )
}`;

const provideCode = `import { StacksheetProvider } from "./stacksheet"
import { SettingsSheet } from "./sheets/settings"

// sheets is optional — you can also push
// components directly without registering them.
export default function Layout({ children }) {
  return (
    <StacksheetProvider
      sheets={{ settings: SettingsSheet }}
    >
      {children}
    </StacksheetProvider>
  )
}

// Ad-hoc: no registration needed.
actions.push(ProfileSheet, { userId: "abc" })`;

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
    <div className="flex min-h-[200px] min-w-0 flex-col lg:min-h-0">
      <p className="mb-2 shrink-0 text-[11px] text-zinc-400 uppercase tracking-widest dark:text-zinc-500">
        {label}
      </p>
      <div
        className="grid min-h-0 flex-1 overflow-hidden rounded-xl"
        style={{
          backgroundColor: "#1c1c1e",
          gridTemplateRows: toolbar ? "auto minmax(0,1fr)" : "minmax(0,1fr)",
        }}
      >
        {toolbar && <div className="shrink-0 px-5 pt-4 pb-2">{toolbar}</div>}
        <BlockScrollArea
          className="min-h-0"
          thumbClassName="bg-zinc-600/60"
          viewportClassName="px-5 pb-5"
        >
          <div
            className="min-w-max"
            style={{ paddingTop: toolbar ? "0.5rem" : "1.25rem" }}
          >
            <SyntaxHighlight code={code} />
          </div>
        </BlockScrollArea>
      </div>
    </div>
  );
}

function RightColumn({ config }: { config: PlaygroundConfig }) {
  const [activeAction, setActiveAction] =
    useState<(typeof actionKeys)[number]>("push");
  const configCode = useConfigCode(config);

  return (
    <section className="ss-shell-pad grid py-6 lg:h-full lg:min-h-0 lg:grid-rows-[minmax(0,1fr)]">
      <div className="grid grid-cols-1 gap-3 lg:min-h-0 lg:grid-cols-2 lg:grid-rows-2">
        <CodePanel code={configCode} label="Create" />
        <CodePanel code={defineCode} label="Define" />
        <CodePanel code={provideCode} label="Provide" />
        <CodePanel
          code={actionSnippets[activeAction]}
          label="Use"
          toolbar={
            <SegmentedControl
              id="action-toolbar"
              mono
              onChange={(v) =>
                setActiveAction(v as (typeof actionKeys)[number])
              }
              options={actionKeys}
              value={activeAction}
              variant="dark"
            />
          }
        />
      </div>
    </section>
  );
}

// ── Page Content ───────────────────────────────

// ── Theme toggle ────────────────────────────────

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      aria-label="Toggle theme"
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-zinc-400 transition-colors duration-150 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      type="button"
    >
      <svg
        className="hidden h-4 w-4 dark:block"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" x2="12" y1="1" y2="3" />
        <line x1="12" x2="12" y1="21" y2="23" />
        <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
        <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
        <line x1="1" x2="3" y1="12" y2="12" />
        <line x1="21" x2="23" y1="12" y2="12" />
        <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
        <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
      </svg>
      <svg
        className="block h-4 w-4 dark:hidden"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    </button>
  );
}

// ── Header ──────────────────────────────────────

function PageHeader() {
  return (
    <header className="ss-shell-pad flex h-14 items-center justify-between border-zinc-200 border-b dark:border-zinc-800">
      <Wordmark />
      <nav className="flex items-center gap-6">
        <a
          className="text-sm text-zinc-500 no-underline transition-colors duration-150 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
          href="/docs"
        >
          Docs
        </a>
        <a
          className="text-zinc-500 no-underline transition-colors duration-150 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
          href="https://github.com/howells/stacksheet"
          aria-label="GitHub"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
        <a
          className="whitespace-nowrap text-sm text-zinc-400 no-underline transition-colors duration-150 hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-zinc-100"
          href="https://danielhowells.com"
        >
          by Howells
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}

// ── PlaygroundDemo (root) ──────────────────────

export function PlaygroundDemo() {
  const [config, setConfig] = useState<PlaygroundConfig>(defaultConfig);
  const [configVersion, setConfigVersion] = useState(0);
  const storeRef = useRef<StacksheetReturn["store"] | null>(null);

  function handleConfigChange(next: PlaygroundConfig) {
    setConfig(next);
    setConfigVersion((v) => v + 1);
  }

  function handleOpen() {
    storeRef.current
      ?.getState()
      .open("Push", `tour-${Date.now()}`, presets.Push[0] as never);
  }

  return (
    <div
      className="grid min-h-dvh grid-rows-[auto_1fr] lg:h-dvh lg:grid-rows-[auto_minmax(0,1fr)] lg:overflow-hidden"
      data-stacksheet-wrapper=""
    >
      <PageHeader />
      <div className="grid grid-cols-1 lg:min-h-0 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="border-zinc-200 border-b lg:min-h-0 lg:border-r lg:border-b-0 dark:border-zinc-800">
          <LeftColumn
            config={config}
            onConfigChange={handleConfigChange}
            onOpen={handleOpen}
          />
        </div>
        <div className="@container lg:min-h-0 lg:overflow-hidden">
          <DemoInstance config={config} key={configVersion} storeRef={storeRef}>
            <RightColumn config={config} />
          </DemoInstance>
        </div>
      </div>
    </div>
  );
}
