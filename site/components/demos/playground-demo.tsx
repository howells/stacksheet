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

  const badgeColors: Record<string, string> = {
    Contact: "pg-stack-dot--blue",
    Settings: "pg-stack-dot--purple",
    Alert: "pg-stack-dot--amber",
  };

  return (
    <div className="pg-sheet">
      {children}

      <div className="pg-sheet-divider" />

      <p className="pg-sheet-label">Try an action</p>
      <div className="pg-sheet-actions">
        <button
          className="pg-sheet-action-btn"
          onClick={() => doAction("push")}
          type="button"
        >
          push
        </button>
        <button
          className="pg-sheet-action-btn"
          onClick={() => doAction("navigate")}
          type="button"
        >
          navigate
        </button>
        <button
          className="pg-sheet-action-btn"
          onClick={() => doAction("replace")}
          type="button"
        >
          replace
        </button>
        <button
          className="pg-sheet-action-btn"
          onClick={() => doSwap()}
          type="button"
        >
          swap
        </button>
        <button
          className="pg-sheet-action-btn"
          onClick={() => actions.pop()}
          type="button"
        >
          pop
        </button>
        <button
          className="pg-sheet-action-btn"
          onClick={() => actions.close()}
          type="button"
        >
          close
        </button>
      </div>

      <div className="pg-sheet-divider" />

      <p className="pg-sheet-label">
        Stack <span className="pg-sheet-label-count">{stack.length}</span>
      </p>
      <div className="pg-stack">
        {stack.map((item, i) => (
          <button
            className="pg-stack-item"
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
              className={`pg-stack-dot ${badgeColors[item.type] || ""}`}
            />
            <span className="pg-stack-type">{item.type}</span>
            <span className="pg-stack-id">
              {item.id.split("-")[0]}
            </span>
            {i === stack.length - 1 && (
              <span className="pg-stack-current">current</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Sheet components ───────────────────────────

function ContactSheet({
  name,
  email,
  role,
  location,
}: SheetTypeMap["Contact"]) {
  return (
    <SheetControls>
      <span className="pg-sheet-badge pg-sheet-badge--blue">Contact</span>
      <h3 className="pg-sheet-title">{name}</h3>
      <p className="pg-sheet-subtitle">{role}</p>
      <div className="pg-sheet-fields">
        <div className="pg-sheet-field">
          <span className="pg-sheet-field-label">Email</span>
          <span className="pg-sheet-field-value">{email}</span>
        </div>
        <div className="pg-sheet-field">
          <span className="pg-sheet-field-label">Location</span>
          <span className="pg-sheet-field-value">{location}</span>
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
      <span className="pg-sheet-badge pg-sheet-badge--purple">
        Settings
      </span>
      <h3 className="pg-sheet-title">{section}</h3>
      <p className="pg-sheet-text">{description}</p>
      <div className="pg-sheet-fields">
        <div className="pg-sheet-toggle-row">
          <span>Enable feature</span>
          <span className="pg-sheet-toggle" data-on />
        </div>
        <div className="pg-sheet-toggle-row">
          <span>Send digest</span>
          <span className="pg-sheet-toggle" />
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
      ? "pg-sheet-badge--amber"
      : severity === "success"
        ? "pg-sheet-badge--green"
        : "pg-sheet-badge--blue";

  return (
    <SheetControls>
      <span className={`pg-sheet-badge ${variant}`}>{severity}</span>
      <h3 className="pg-sheet-title">{title}</h3>
      <p className="pg-sheet-text">{message}</p>
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
      className="pg-pill"
      data-active={active || undefined}
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
    <div className="pg-left">
      <h1 className="pg-title">Stacksheet</h1>
      <p className="pg-tagline">
        A typed, animated sheet stack for React.
      </p>

      <div className="pg-controls">
        <div className="pg-control-group">
          <p className="pg-label">Position</p>
          <div className="pg-pills">
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

        <div className="pg-control-group">
          <p className="pg-label">Spring</p>
          <div className="pg-pills">
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

        <div className="pg-control-group">
          <p className="pg-label">Options</p>
          <div className="pg-pills">
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
        className="pg-btn pg-btn--primary"
        onClick={handleOpen}
        type="button"
      >
        Open a sheet
      </button>

      <div className="pg-links">
        <a className="pg-btn pg-btn--secondary" href="/docs">
          Documentation
        </a>
        <a
          className="pg-link"
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
  // Build config code string
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
    <div className="pg-right">
      <div className="pg-code">
        <code>{configCode}</code>
      </div>
      <div className="pg-install">
        <code>npm i @howells/stacksheet</code>
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
      <div className="pg-layout">
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
