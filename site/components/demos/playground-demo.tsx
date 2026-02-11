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
  type SheetActions,
  type Side,
  type SpringPreset,
  createStacksheet,
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
      className={`inline-block w-9 h-5 rounded-full relative ${on ? "bg-zinc-950" : "bg-zinc-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-150 ${on ? "translate-x-4" : ""}`}
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
    <div className="p-6">
      {children}

      <div className="h-px bg-zinc-100 my-5" />

      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2.5">
        Try an action
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          className="inline-flex items-center h-[30px] px-3 text-xs font-medium font-mono border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          onClick={() => doAction("push")}
          type="button"
        >
          push
        </button>
        <button
          className="inline-flex items-center h-[30px] px-3 text-xs font-medium font-mono border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          onClick={() => doAction("navigate")}
          type="button"
        >
          navigate
        </button>
        <button
          className="inline-flex items-center h-[30px] px-3 text-xs font-medium font-mono border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          onClick={() => doAction("replace")}
          type="button"
        >
          replace
        </button>
        <button
          className="inline-flex items-center h-[30px] px-3 text-xs font-medium font-mono border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          onClick={() => doSwap()}
          type="button"
        >
          swap
        </button>
        <button
          className="inline-flex items-center h-[30px] px-3 text-xs font-medium font-mono border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          onClick={() => actions.pop()}
          type="button"
        >
          pop
        </button>
        <button
          className="inline-flex items-center h-[30px] px-3 text-xs font-medium font-mono border border-zinc-200 rounded-full bg-white text-zinc-950 cursor-pointer transition-colors duration-150 hover:bg-zinc-50 hover:border-zinc-300"
          onClick={() => actions.close()}
          type="button"
        >
          close
        </button>
      </div>

      <div className="h-px bg-zinc-100 my-5" />

      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2.5">
        Stack{" "}
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-zinc-100 rounded-full text-zinc-500 ml-1 align-middle">
          {stack.length}
        </span>
      </p>
      <div className="flex flex-col gap-1">
        {stack.map((item, i) => (
          <button
            className="flex items-center gap-2 py-1.5 px-2.5 border-none rounded-md text-[13px] font-inherit bg-transparent cursor-pointer w-full text-left transition-colors duration-150 hover:bg-zinc-100 data-[current]:bg-zinc-100 data-[current]:cursor-default data-[current]:hover:bg-zinc-100"
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
            <span className="text-zinc-400 text-xs font-mono">
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

const badgeVariants: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
};

function Badge({
  variant,
  children,
}: { variant: string; children: ReactNode }) {
  return (
    <span
      className={`inline-block text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full mb-3 ${badgeVariants[variant] || badgeVariants.blue}`}
    >
      {children}
    </span>
  );
}

function ContactSheet({
  name,
  email,
  role,
  location,
}: SheetTypeMap["Contact"]) {
  return (
    <SheetControls>
      <Badge variant="blue">Contact</Badge>
      <h3 className="text-lg font-semibold mb-1">{name}</h3>
      <p className="text-sm text-zinc-500 mb-4">{role}</p>
      <div className="flex flex-col gap-3 mb-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Email
          </span>
          <span className="text-sm text-zinc-950">{email}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Location
          </span>
          <span className="text-sm text-zinc-950">{location}</span>
        </div>
      </div>
    </SheetControls>
  );
}

function SettingsSheet({
  section,
  description,
}: SheetTypeMap["Settings"]) {
  return (
    <SheetControls>
      <Badge variant="purple">Settings</Badge>
      <h3 className="text-lg font-semibold mb-1">{section}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed mb-4">
        {description}
      </p>
      <div className="flex flex-col gap-3 mb-1">
        <div className="flex items-center justify-between text-sm text-zinc-950 py-2">
          <span>Enable feature</span>
          <Toggle on />
        </div>
        <div className="flex items-center justify-between text-sm text-zinc-950 py-2 border-t border-zinc-100">
          <span>Send digest</span>
          <Toggle />
        </div>
      </div>
    </SheetControls>
  );
}

function AlertSheet({
  title,
  message,
  severity,
}: SheetTypeMap["Alert"]) {
  const variant =
    severity === "warning"
      ? "amber"
      : severity === "success"
        ? "green"
        : "blue";

  return (
    <SheetControls>
      <Badge variant={variant}>{severity}</Badge>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed mb-4">{message}</p>
    </SheetControls>
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
  // Position (responsive)
  desktopSide: Side;
  mobileSide: Side;
  // Spring
  spring: SpringPreset;
  // Behavior toggles
  showOverlay: boolean;
  closeOnBackdrop: boolean;
  closeOnEscape: boolean;
  lockScroll: boolean;
  drag: boolean;
  dismissible: boolean;
  modal: boolean;
  shouldScaleBackground: boolean;
  // Layout
  width: number;
  maxWidth: string;
  breakpoint: number;
  zIndex: number;
  // Drag tuning
  closeThreshold: number;
  velocityThreshold: number;
  // Limits & stacking
  maxDepth: number; // 0 = Infinity (unlimited)
  stackScaleStep: number;
  stackOffsetStep: number;
  stackOpacityStep: number;
  stackRadius: number;
  stackRenderThreshold: number;
  // Body scale
  scaleBackgroundAmount: number;
  // Accessibility
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
      className={`inline-flex items-center h-[34px] px-4 text-[13px] font-medium rounded-full cursor-pointer transition-colors duration-150 ${
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
    <label className="flex items-center justify-between text-[13px] py-1">
      <span className="text-zinc-500">{label}</span>
      <input
        className="w-20 h-7 px-2 text-right text-[13px] font-mono bg-zinc-50 border border-zinc-200 rounded-md text-zinc-950 outline-none focus:ring-1 focus:ring-zinc-400"
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
    <label className="flex items-center justify-between text-[13px] py-1">
      <span className="text-zinc-500">{label}</span>
      <input
        className="w-24 h-7 px-2 text-right text-[13px] font-mono bg-zinc-50 border border-zinc-200 rounded-md text-zinc-950 outline-none focus:ring-1 focus:ring-zinc-400"
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
      <h1 className="text-5xl font-bold tracking-tight leading-none mb-3">
        Stacksheet
      </h1>
      <p className="text-[15px] text-zinc-500 leading-relaxed mb-6">
        A typed, animated sheet stack for React.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-8">
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
          className="text-sm text-zinc-500 underline underline-offset-[3px] hover:text-zinc-950"
          href="https://github.com/howells/stacksheet"
        >
          GitHub
        </a>
      </div>

      {/* ── Position ────────────────────────── */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-col gap-2">
          <SectionHeader>Position — Desktop</SectionHeader>
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
          <SectionHeader>Position — Mobile</SectionHeader>
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

      <div className="h-px bg-zinc-100 my-3" />

      {/* ── Spring ──────────────────────────── */}
      <div className="flex flex-col gap-2 mb-5">
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

      <div className="h-px bg-zinc-100 my-3" />

      {/* ── Behavior ────────────────────────── */}
      <div className="flex flex-col gap-2 mb-5">
        <SectionHeader>Behavior</SectionHeader>
        <div className="flex flex-wrap gap-1.5">
          {toggles.map(({ key, label }) => (
            <Pill
              key={key}
              active={config[key] as boolean}
              onClick={() =>
                onConfigChange({
                  ...config,
                  [key]: !config[key],
                })
              }
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="h-px bg-zinc-100 my-3" />

      {/* ── Layout ──────────────────────────── */}
      <div className="flex flex-col gap-1 mb-5">
        <SectionHeader>Layout</SectionHeader>
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
      </div>

      <div className="h-px bg-zinc-100 my-3" />

      {/* ── Drag tuning ─────────────────────── */}
      <div className="flex flex-col gap-1 mb-5">
        <SectionHeader>Drag</SectionHeader>
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
      </div>

      <div className="h-px bg-zinc-100 my-3" />

      {/* ── Stacking ────────────────────────── */}
      <div className="flex flex-col gap-1 mb-5">
        <SectionHeader>Stacking</SectionHeader>
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
      </div>

      <div className="h-px bg-zinc-100 my-3" />

      {/* ── Advanced ────────────────────────── */}
      <div className="flex flex-col gap-1">
        <SectionHeader>Advanced</SectionHeader>
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
      </div>
    </div>
  );
}

// ── Right Column ───────────────────────────────

function RightColumn({ config }: { config: PlaygroundConfig }) {
  const configParts: string[] = [];

  // Side — only show when different from library default { desktop: "right", mobile: "bottom" }
  if (config.desktopSide !== "right" || config.mobileSide !== "bottom") {
    if (config.desktopSide === config.mobileSide) {
      configParts.push(`side: "${config.desktopSide}"`);
    } else {
      configParts.push(
        `side: { desktop: "${config.desktopSide}", mobile: "${config.mobileSide}" }`
      );
    }
  }

  // Spring
  if (config.spring !== "stiff") configParts.push(`spring: "${config.spring}"`);

  // Booleans (show when different from default)
  if (!config.showOverlay) configParts.push("showOverlay: false");
  if (!config.closeOnBackdrop) configParts.push("closeOnBackdrop: false");
  if (!config.closeOnEscape) configParts.push("closeOnEscape: false");
  if (!config.lockScroll) configParts.push("lockScroll: false");
  if (!config.drag) configParts.push("drag: false");
  if (!config.dismissible) configParts.push("dismissible: false");
  if (!config.modal) configParts.push("modal: false");
  if (config.shouldScaleBackground)
    configParts.push("shouldScaleBackground: true");

  // Layout
  if (config.width !== 420) configParts.push(`width: ${config.width}`);
  if (config.maxWidth !== "90vw")
    configParts.push(`maxWidth: "${config.maxWidth}"`);
  if (config.breakpoint !== 768)
    configParts.push(`breakpoint: ${config.breakpoint}`);
  if (config.zIndex !== 100) configParts.push(`zIndex: ${config.zIndex}`);

  // Drag
  if (config.closeThreshold !== 0.25)
    configParts.push(`closeThreshold: ${config.closeThreshold}`);
  if (config.velocityThreshold !== 0.5)
    configParts.push(`velocityThreshold: ${config.velocityThreshold}`);

  // Max depth
  if (config.maxDepth > 0) configParts.push(`maxDepth: ${config.maxDepth}`);

  // Body scale amount
  if (config.scaleBackgroundAmount !== 0.97)
    configParts.push(`scaleBackgroundAmount: ${config.scaleBackgroundAmount}`);

  // Aria label
  if (config.ariaLabel !== "Sheet dialog")
    configParts.push(`ariaLabel: "${config.ariaLabel}"`);

  // Stacking sub-config
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
    <div className="flex flex-col gap-4 pt-2 md:sticky md:top-12">
      <div className="bg-zinc-900 rounded-xl p-5">
        <code className="text-sm font-mono text-zinc-300 whitespace-pre">
          {configCode}
        </code>
      </div>
      <div className="text-center py-1">
        <code className="text-[13px] font-mono text-zinc-400">
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
    <StacksheetProvider sheets={sheetMap}>
      <div
        data-stacksheet-wrapper=""
        className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8 md:gap-16 max-w-5xl mx-auto p-6 md:p-12 min-h-dvh items-start"
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
