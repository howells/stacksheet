"use client";

import {
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
  useSheetPanel,
} from "@howells/stacksheet";

// ── Type registry ──────────────────────────────

type SheetTypeMap = {
  Contact: { name: string; email: string; role: string; location: string };
  Settings: { section: string; description: string };
  Alert: { title: string; message: string; severity: string };
};

type SheetKey = keyof SheetTypeMap;

// ── Data presets ───────────────────────────────

const presets: Record<SheetKey, SheetTypeMap[SheetKey][]> = {
  Contact: [
    {
      name: "Jane Cooper",
      email: "jane@example.com",
      role: "Product Designer",
      location: "San Francisco, CA",
    },
    {
      name: "Alex Rivera",
      email: "alex@company.io",
      role: "Staff Engineer",
      location: "Austin, TX",
    },
    {
      name: "Sam Chen",
      email: "sam.chen@mail.dev",
      role: "Engineering Manager",
      location: "Seattle, WA",
    },
  ],
  Settings: [
    {
      section: "General",
      description:
        "Language, timezone, and display preferences for your account.",
    },
    {
      section: "Notifications",
      description:
        "Control which emails, push, and in-app alerts you receive.",
    },
    {
      section: "Privacy",
      description:
        "Manage data sharing, visibility, and third-party access.",
    },
  ],
  Alert: [
    {
      title: "Trial expiring",
      message:
        "Your free trial ends in 3 days. Upgrade to keep access to all features.",
      severity: "warning",
    },
    {
      title: "Update available",
      message:
        "Version 2.4 includes performance improvements and bug fixes.",
      severity: "info",
    },
    {
      title: "New team member",
      message: "Jordan Lee has joined the Engineering team.",
      severity: "success",
    },
  ],
};

// ── Playground context ─────────────────────────

type StacksheetReturn = ReturnType<typeof createStacksheet<SheetTypeMap>>;

interface PlaygroundCtx {
  store: StacksheetReturn["store"];
  StacksheetProvider: StacksheetReturn["StacksheetProvider"];
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

// ── Toggle (decorative) ──────────────────────

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

// ── Shared sheet controls ─────────────────────

function SheetControls({ children }: { children: ReactNode }) {
  const actions = useActions();
  const stack = useStack();
  const counterRef = useRef(0);

  function doAction(name: "push" | "navigate" | "replace") {
    const keys: SheetKey[] = ["Contact", "Settings", "Alert"];
    const key = keys[counterRef.current % keys.length];
    const list = presets[key];
    const data = list[counterRef.current % list.length];
    counterRef.current++;
    actions[name](key, `sheet-${Date.now()}`, data as never);
  }

  function doSwap() {
    const keys: SheetKey[] = ["Contact", "Settings", "Alert"];
    const key = keys[counterRef.current % keys.length];
    const list = presets[key];
    const data = list[counterRef.current % list.length];
    counterRef.current++;
    actions.swap(key, data as never);
  }

  const dotColors: Record<string, string> = {
    Contact: "bg-blue-500",
    Settings: "bg-violet-500",
    Alert: "bg-amber-500",
  };

  return (
    <div>
      {children}

      <div className="h-px bg-zinc-100 my-5" />

      <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-2.5">
        Try an action
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(["push", "navigate", "replace"] as const).map((name) => (
          <button
            key={name}
            className="inline-flex items-center h-[30px] px-3 text-xs font-medium border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
            style={{ fontFamily: "var(--font-mono)" }}
            onClick={() => doAction(name)}
            type="button"
          >
            {name}
          </button>
        ))}
        <button
          className="inline-flex items-center h-[30px] px-3 text-xs font-medium border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          style={{ fontFamily: "var(--font-mono)" }}
          onClick={() => doSwap()}
          type="button"
        >
          swap
        </button>
        <button
          className="inline-flex items-center h-[30px] px-3 text-xs font-medium border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          style={{ fontFamily: "var(--font-mono)" }}
          onClick={() => actions.pop()}
          type="button"
        >
          pop
        </button>
        <button
          className="inline-flex items-center h-[30px] px-3 text-xs font-medium border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          style={{ fontFamily: "var(--font-mono)" }}
          onClick={() => actions.close()}
          type="button"
        >
          close
        </button>
      </div>

      <div className="h-px bg-zinc-100 my-5" />

      <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-2.5">
        Stack{" "}
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-zinc-100 rounded-full text-zinc-500 ml-1 align-middle">
          {stack.length}
        </span>
      </p>
      <div className="flex flex-col gap-1">
        {stack.map((item, i) => (
          <button
            className="flex items-center gap-2 py-1.5 px-2.5 border-none rounded-md text-[13px] bg-transparent cursor-pointer w-full text-left transition-colors duration-150 hover:bg-zinc-100 data-[current]:bg-zinc-100 data-[current]:cursor-default data-[current]:hover:bg-zinc-100"
            key={item.id}
            data-current={i === stack.length - 1 || undefined}
            disabled={i === stack.length - 1}
            onClick={() => {
              for (let j = stack.length - 1; j > i; j--) {
                actions.remove(stack[j].id);
              }
            }}
            type="button"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${dotColors[item.type] || "bg-zinc-300"}`}
            />
            <span className="font-medium text-zinc-950">{item.type}</span>
            <span className="text-zinc-400 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
              {item.id.split("-")[0]}
            </span>
            {i === stack.length - 1 && (
              <span className="ml-auto text-[11px] font-medium text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-full">
                current
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Sheet components ───────────────────────────

// Shared header bar used by composable sheets
function HeaderBar({ children }: { children: ReactNode }) {
  return (
    <Sheet.Header
      className="flex items-center justify-between px-5 py-4 border-b border-zinc-100"
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
      className={`h-9 px-4 text-sm font-medium rounded-lg cursor-pointer transition-colors duration-150 ${
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

// ── Contact: Full composable — Header, Body (scrollable), Footer ──

function ContactSheet({
  name,
  email,
  role,
  location,
}: SheetTypeMap["Contact"]) {
  const { close } = useSheetPanel();

  return (
    <>
      <HeaderBar>
        <div className="flex items-center gap-2">
          <Sheet.Back className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
          <Sheet.Title className="text-base font-semibold">Contact</Sheet.Title>
        </div>
        <Sheet.Close className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
      </HeaderBar>
      <Sheet.Body>
        <SheetControls>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-semibold shrink-0">
              {name.charAt(0)}
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-950">{name}</p>
              <p className="text-sm text-zinc-500">{role}</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Email</span>
              <span className="text-sm text-zinc-950">{email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Location</span>
              <span className="text-sm text-zinc-950">{location}</span>
            </div>
          </div>
        </SheetControls>
      </Sheet.Body>
      <FooterBar>
        <FooterButton variant="primary">Send message</FooterButton>
        <FooterButton onClick={close}>Close</FooterButton>
      </FooterBar>
    </>
  );
}

// ── Settings: Handle + Header + Body (toggle list) + Footer ──

function SettingsSheet({
  section,
  description,
}: SheetTypeMap["Settings"]) {
  const { close } = useSheetPanel();
  const [values, setValues] = useState<Record<string, boolean>>({
    feature: true,
    digest: false,
    analytics: true,
    beta: false,
  });

  function toggle(key: string) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const rows = [
    { key: "feature", label: "Enable feature", desc: "Turn on the main feature toggle" },
    { key: "digest", label: "Email digest", desc: "Weekly summary to your inbox" },
    { key: "analytics", label: "Usage analytics", desc: "Help improve the product" },
    { key: "beta", label: "Beta features", desc: "Try experimental functionality" },
  ];

  return (
    <>
      <Sheet.Handle />
      <HeaderBar>
        <div className="flex items-center gap-2">
          <Sheet.Back className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
          <Sheet.Title className="text-base font-semibold">{section}</Sheet.Title>
        </div>
        <Sheet.Close className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 cursor-pointer bg-transparent border-none text-zinc-500" />
      </HeaderBar>
      <Sheet.Body>
        <div className="px-5 pt-4 pb-2">
          <Sheet.Description className="text-sm text-zinc-500 leading-relaxed mb-5">
            {description}
          </Sheet.Description>
          <div className="flex flex-col">
            {rows.map(({ key, label, desc }) => (
              <button
                key={key}
                className="flex items-center justify-between py-3 text-left cursor-pointer bg-transparent border-none border-b border-zinc-100 last:border-b-0 w-full"
                onClick={() => toggle(key)}
                type="button"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-zinc-950">{label}</span>
                  <span className="text-xs text-zinc-400">{desc}</span>
                </div>
                <Toggle on={values[key]} />
              </button>
            ))}
          </div>
        </div>
        <div className="px-5">
          <SheetControls>{null}</SheetControls>
        </div>
      </Sheet.Body>
      <FooterBar>
        <FooterButton variant="primary">Save changes</FooterButton>
        <FooterButton onClick={close}>Cancel</FooterButton>
      </FooterBar>
    </>
  );
}

// ── Alert: Simple — just body content, no header/footer ──

const severityStyles: Record<string, { bg: string; text: string; icon: string }> = {
  warning: { bg: "bg-amber-50", text: "text-amber-700", icon: "⚠" },
  info: { bg: "bg-blue-50", text: "text-blue-700", icon: "ℹ" },
  success: { bg: "bg-green-50", text: "text-green-700", icon: "✓" },
};

function AlertSheet({
  title,
  message,
  severity,
}: SheetTypeMap["Alert"]) {
  const { close } = useSheetPanel();
  const styles = severityStyles[severity] || severityStyles.info;

  return (
    <Sheet.Body>
      <div className="p-5">
        <div className={`${styles.bg} rounded-lg p-4 mb-5`}>
          <div className="flex items-start gap-3">
            <span className={`text-lg ${styles.text}`}>{styles.icon}</span>
            <div>
              <p className={`text-sm font-semibold ${styles.text} mb-1`}>{title}</p>
              <p className={`text-sm ${styles.text} opacity-80 leading-relaxed`}>{message}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mb-5">
          <FooterButton variant="primary" onClick={close}>Dismiss</FooterButton>
        </div>
        <SheetControls>{null}</SheetControls>
      </div>
    </Sheet.Body>
  );
}

const sheetMap = {
  Contact: ContactSheet,
  Settings: SettingsSheet,
  Alert: AlertSheet,
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
  width: 420,
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
    <PlaygroundContext.Provider value={{ store, StacksheetProvider }}>
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
    <label className="flex items-center justify-between text-[13px] py-1.5">
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
    <label className="flex items-center justify-between text-[13px] py-1.5">
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
    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
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
        className="flex items-center gap-2 w-full text-left py-2 cursor-pointer bg-transparent border-none text-[10px] font-medium uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors duration-150"
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
  const counterRef = useRef(0);
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
    const list = presets.Contact;
    const data = list[counterRef.current % list.length];
    counterRef.current++;
    actions.open("Contact", `hero-${Date.now()}`, data as never);
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
      <h1 className="text-[40px] font-semibold tracking-tight leading-none mb-3">
        Stacksheet
      </h1>
      <p className="text-[15px] text-zinc-500 leading-relaxed mb-8">
        A typed, animated sheet stack for React.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-10">
        <button
          className="inline-flex items-center justify-center h-11 px-7 text-[15px] font-medium rounded-full bg-zinc-950 text-zinc-50 border-none cursor-pointer transition-all duration-150 hover:opacity-85 active:scale-[0.97]"
          onClick={handleOpen}
          type="button"
        >
          Open a sheet
        </button>
        <a
          className="inline-flex items-center justify-center h-11 px-7 text-[15px] font-medium rounded-full bg-transparent text-zinc-950 border border-zinc-200 cursor-pointer transition-colors duration-150 hover:bg-zinc-100 no-underline"
          href="/docs"
        >
          Documentation
        </a>
        <a
          className="text-sm text-zinc-500 underline underline-offset-[3px] hover:text-zinc-950 transition-colors duration-150"
          href="https://github.com/howells/stacksheet"
        >
          GitHub
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
              className="flex items-center justify-between py-2.5 text-[13px] text-zinc-950 cursor-pointer bg-transparent border-none border-b border-zinc-100 last:border-b-0 w-full text-left"
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

function RightColumn({ config }: { config: PlaygroundConfig }) {
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

  if (config.width !== 420) configParts.push(`width: ${config.width}`);
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

  const configCode =
    configParts.length > 0
      ? `createStacksheet({\n  ${configParts.join(",\n  ")}\n})`
      : "createStacksheet()";

  return (
    <div className="flex flex-col gap-4 pt-2 md:sticky md:top-16">
      <div className="rounded-xl p-6" style={{ backgroundColor: "#1c1c1e" }}>
        <code className="text-sm text-zinc-300 whitespace-pre" style={{ fontFamily: "var(--font-mono)" }}>
          {configCode}
        </code>
      </div>
      <div className="text-center py-1">
        <code className="text-[13px] text-zinc-400" style={{ fontFamily: "var(--font-mono)" }}>
          npm i @howells/stacksheet
        </code>
      </div>
    </div>
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
      <div
        data-stacksheet-wrapper=""
        className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-12 md:gap-20 max-w-6xl mx-auto p-8 md:p-16 min-h-dvh items-start"
      >
        <LeftColumn config={config} onConfigChange={onConfigChange} />
        <RightColumn config={config} />
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
