"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import {
  type SheetActions,
  type SpringPreset,
  type StacksheetConfig,
  type StacksheetSnapshot,
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
      description: "Language, timezone, and display preferences for your account.",
    },
    {
      section: "Notifications",
      description: "Control which emails, push, and in-app alerts you receive.",
    },
    {
      section: "Privacy",
      description: "Manage data sharing, visibility, and third-party access.",
    },
  ],
  Alert: [
    {
      title: "Trial expiring",
      message:
        "Your free trial ends in 3 days. Upgrade to keep access to all features including analytics and team collaboration.",
      severity: "warning",
    },
    {
      title: "Update available",
      message:
        "Version 2.4 includes performance improvements, bug fixes, and a redesigned settings panel.",
      severity: "info",
    },
    {
      title: "New team member",
      message:
        "Jordan Lee has joined the Engineering team. They'll have access to shared projects and dashboards.",
      severity: "success",
    },
  ],
};

// ── Playground context ─────────────────────────

interface PlaygroundCtx {
  useSheet: () => SheetActions<SheetTypeMap>;
  useStacksheetState: () => StacksheetSnapshot<SheetTypeMap>;
}

const PlaygroundContext = createContext<PlaygroundCtx | null>(null);

function usePlayground() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error("Missing PlaygroundContext");
  return ctx;
}

// ── Shared sheet controls ─────────────────────

function SheetControls({ children }: { children: ReactNode }) {
  const { useSheet, useStacksheetState } = usePlayground();
  const actions = useSheet();
  const { stack } = useStacksheetState();
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
              // Remove everything above this item to make it the top
              for (let j = stack.length - 1; j > i; j--) {
                actions.remove(stack[j].id);
              }
            }}
            type="button"
          >
            <span className={`pg-stack-dot ${badgeColors[item.type] || ""}`} />
            <span className="pg-stack-type">{item.type}</span>
            <span className="pg-stack-id">{item.id.split("-")[0]}</span>
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

function ContactSheet({ name, email, role, location }: SheetTypeMap["Contact"]) {
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

function SettingsSheet({ section, description }: SheetTypeMap["Settings"]) {
  return (
    <SheetControls>
      <span className="pg-sheet-badge pg-sheet-badge--purple">Settings</span>
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

function AlertSheet({ title, message, severity }: SheetTypeMap["Alert"]) {
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
  width: number;
  spring: SpringPreset;
  maxDepth: number;
  showOverlay: boolean;
  closeOnBackdrop: boolean;
  closeOnEscape: boolean;
}

const defaultConfig: PlaygroundConfig = {
  side: "right",
  width: 420,
  spring: "stiff",
  maxDepth: Number.POSITIVE_INFINITY,
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
  const instanceRef = useRef<ReturnType<
    typeof createStacksheet<SheetTypeMap>
  > | null>(null);
  if (!instanceRef.current) {
    const stacksheetConfig: StacksheetConfig = {
      side: config.side,
      width: config.width,
      spring: config.spring,
      maxDepth: config.maxDepth,
      showOverlay: config.showOverlay,
      closeOnBackdrop: config.closeOnBackdrop,
      closeOnEscape: config.closeOnEscape,
    };
    instanceRef.current = createStacksheet<SheetTypeMap>(stacksheetConfig);
  }

  const { StacksheetProvider, useSheet, useStacksheetState } =
    instanceRef.current;

  return (
    <PlaygroundContext.Provider value={{ useSheet, useStacksheetState }}>
      <StacksheetProvider sheets={sheetMap}>{children}</StacksheetProvider>
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

// ── Code block ─────────────────────────────────

function Code({ children }: { children: string }) {
  return (
    <div className="pg-code">
      <code>{children}</code>
    </div>
  );
}

// ── Hero section ───────────────────────────────

function HeroSection() {
  const { useSheet } = usePlayground();
  const actions = useSheet();
  const counterRef = useRef(0);

  function handleOpen() {
    const list = presets.Contact;
    const data = list[counterRef.current % list.length];
    counterRef.current++;
    actions.open("Contact", `hero-${Date.now()}`, data as never);
  }

  return (
    <section className="pg-hero">
      <h1 className="pg-hero-title">Stacksheet</h1>
      <p className="pg-hero-tagline">
        A typed, animated sheet stack for React.
      </p>
      <div className="pg-hero-actions">
        <button className="pg-btn pg-btn--primary" onClick={handleOpen} type="button">
          Open a sheet
        </button>
        <a className="pg-btn pg-btn--secondary" href="/docs">
          Documentation
        </a>
      </div>
      <a className="pg-hero-gh" href="https://github.com/howells/stacksheet">
        GitHub
      </a>
    </section>
  );
}

// ── Position section ───────────────────────────

function PositionSection({
  config,
  onConfigChange,
}: {
  config: PlaygroundConfig;
  onConfigChange: (c: PlaygroundConfig) => void;
}) {
  const sides: PlaygroundConfig["side"][] = ["left", "right", "bottom"];

  return (
    <section className="pg-section">
      <h2 className="pg-section-title">Position</h2>
      <p className="pg-section-desc">
        Panels slide in from the side you choose. Bottom is default on mobile.
      </p>
      <div className="pg-pills">
        {sides.map((s) => (
          <Pill
            key={s}
            active={config.side === s}
            onClick={() => onConfigChange({ ...config, side: s })}
          >
            {s}
          </Pill>
        ))}
      </div>
      <Code>{`createStacksheet({ side: "${config.side}" })`}</Code>
    </section>
  );
}

// ── Spring section ─────────────────────────────

function SpringSection({
  config,
  onConfigChange,
}: {
  config: PlaygroundConfig;
  onConfigChange: (c: PlaygroundConfig) => void;
}) {
  return (
    <section className="pg-section">
      <h2 className="pg-section-title">Spring</h2>
      <p className="pg-section-desc">
        Seven spring presets from gentle to snappy. Open a sheet to feel the
        difference.
      </p>
      <div className="pg-pills">
        {springPresets.map((p) => (
          <Pill
            key={p}
            active={config.spring === p}
            onClick={() => onConfigChange({ ...config, spring: p })}
          >
            {p}
          </Pill>
        ))}
      </div>
      <Code>{`createStacksheet({ spring: "${config.spring}" })`}</Code>
    </section>
  );
}

// ── Config section ─────────────────────────────

function ConfigSection({
  config,
  onConfigChange,
}: {
  config: PlaygroundConfig;
  onConfigChange: (c: PlaygroundConfig) => void;
}) {
  const toggles: { key: keyof PlaygroundConfig; label: string }[] = [
    { key: "showOverlay", label: "overlay" },
    { key: "closeOnBackdrop", label: "backdrop close" },
    { key: "closeOnEscape", label: "escape close" },
  ];

  return (
    <section className="pg-section">
      <h2 className="pg-section-title">Other</h2>
      <p className="pg-section-desc">
        Toggle overlay, backdrop close, and escape close behaviors.
      </p>
      <div className="pg-pills">
        {toggles.map(({ key, label }) => (
          <Pill
            key={key}
            active={config[key] as boolean}
            onClick={() =>
              onConfigChange({ ...config, [key]: !config[key] })
            }
          >
            {label}
          </Pill>
        ))}
      </div>
    </section>
  );
}

// ── PlaygroundDemo (root) ──────────────────────

export function PlaygroundDemo() {
  const [config, setConfig] = useState<PlaygroundConfig>(defaultConfig);
  const [configVersion, setConfigVersion] = useState(0);

  function handleConfigChange(next: PlaygroundConfig) {
    setConfig(next);
    setConfigVersion((v) => v + 1);
  }

  return (
    <DemoInstance key={configVersion} config={config}>
      <HeroSection />
      <div className="pg-sections">
        <PositionSection config={config} onConfigChange={handleConfigChange} />
        <SpringSection config={config} onConfigChange={handleConfigChange} />
        <ConfigSection config={config} onConfigChange={handleConfigChange} />
      </div>
    </DemoInstance>
  );
}
