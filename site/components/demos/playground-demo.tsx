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
  side: "left" | "right" | "bottom";
  spring: SpringPreset;
  showOverlay: boolean;
  closeOnBackdrop: boolean;
  closeOnEscape: boolean;
}

const defaultConfig: PlaygroundConfig = {
  side: "right",
  spring: "stiff",
  showOverlay: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
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
    instanceRef.current = createStacksheet<SheetTypeMap>({
      side: config.side,
      spring: config.spring,
      showOverlay: config.showOverlay,
      closeOnBackdrop: config.closeOnBackdrop,
      closeOnEscape: config.closeOnEscape,
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

  const sides: PlaygroundConfig["side"][] = ["left", "right", "bottom"];

  const toggles: { key: keyof PlaygroundConfig; label: string }[] = [
    { key: "showOverlay", label: "overlay" },
    { key: "closeOnBackdrop", label: "backdrop close" },
    { key: "closeOnEscape", label: "escape close" },
  ];

  return (
    <div className="flex flex-col md:sticky md:top-12">
      <h1 className="text-5xl font-bold tracking-tight leading-none mb-3">
        Stacksheet
      </h1>
      <p className="text-[15px] text-zinc-500 leading-relaxed mb-8">
        A typed, animated sheet stack for React.
      </p>

      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Position
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sides.map((s) => (
              <Pill
                key={s}
                active={config.side === s}
                onClick={() =>
                  onConfigChange({ ...config, side: s })
                }
              >
                {s}
              </Pill>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Spring
          </p>
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

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Options
          </p>
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
      </div>

      <button
        className="inline-flex items-center justify-center h-11 px-7 text-[15px] font-medium rounded-full bg-zinc-950 text-zinc-50 border-none cursor-pointer transition-all duration-150 hover:opacity-85 active:scale-[0.97] mb-4 self-start"
        onClick={handleOpen}
        type="button"
      >
        Open a sheet
      </button>

      <div className="flex items-center gap-3 self-start">
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
    </div>
  );
}

// ── Right Column ───────────────────────────────

function RightColumn({ config }: { config: PlaygroundConfig }) {
  const configParts: string[] = [];
  if (config.side !== "right")
    configParts.push(`side: "${config.side}"`);
  if (config.spring !== "stiff")
    configParts.push(`spring: "${config.spring}"`);
  if (!config.showOverlay) configParts.push("showOverlay: false");
  if (!config.closeOnBackdrop)
    configParts.push("closeOnBackdrop: false");
  if (!config.closeOnEscape) configParts.push("closeOnEscape: false");

  const configCode =
    configParts.length > 0
      ? `createStacksheet({\n  ${configParts.join(",\n  ")}\n})`
      : "createStacksheet()";

  return (
    <div className="flex flex-col gap-4 pt-2">
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
      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8 md:gap-16 max-w-5xl mx-auto p-6 md:p-12 min-h-dvh items-center">
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
