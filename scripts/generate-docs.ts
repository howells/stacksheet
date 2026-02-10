/**
 * Generate README.md from source code.
 *
 * Run: npx tsx scripts/generate-docs.ts
 *
 * Reads springs.ts, types.ts, config.ts, renderer.tsx, create.tsx, and index.ts
 * to produce tables and reference sections that stay in sync with the implementation.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(ROOT, "src");

// ── Readers ──────────────────────────────────────

function read(file: string) {
  return readFileSync(resolve(SRC, file), "utf-8");
}

// ── Extract spring presets from springs.ts ───────

interface SpringRow {
  name: string;
  stiffness: number;
  damping: number;
  mass: number;
  description: string;
}

function extractSprings(): SpringRow[] {
  const src = read("springs.ts");

  const descMap = new Map<string, string>();
  const descRe = /\* - `(\w+)` — (.+?)\.?\s*(?:\*\*\(default\)\*\*)?$/gm;
  for (const m of src.matchAll(descRe)) {
    descMap.set(m[1], m[2].replace(/\s*\*\*\(default\)\*\*/, "").trim());
  }

  const rows: SpringRow[] = [];
  const valRe =
    /(\w+):\s*\{\s*stiffness:\s*(\d+),\s*damping:\s*(\d+),\s*mass:\s*([\d.]+)\s*\}/g;
  for (const m of src.matchAll(valRe)) {
    rows.push({
      name: m[1],
      stiffness: Number(m[2]),
      damping: Number(m[3]),
      mass: Number(m[4]),
      description: descMap.get(m[1]) ?? "",
    });
  }
  return rows;
}

function springTable(rows: SpringRow[]): string {
  const lines = [
    "| Preset | Stiffness | Damping | Mass | Feel |",
    "|---|---|---|---|---|",
  ];
  for (const r of rows) {
    const isDefault = r.name === "stiff";
    const name = isDefault ? `**\`"${r.name}"\`**` : `\`"${r.name}"\``;
    const desc = isDefault
      ? `**Default.** ${r.description}`
      : r.description;
    lines.push(`| ${name} | ${r.stiffness} | ${r.damping} | ${r.mass} | ${desc} |`);
  }
  return lines.join("\n");
}

// ── Extract stacking defaults from config.ts ─────

interface StackingRow {
  name: string;
  default: string;
  description: string;
}

function extractStackingDefaults(): StackingRow[] {
  const configSrc = read("config.ts");
  const typesSrc = read("types.ts");

  const defaults = new Map<string, string>();
  const defRe = /(\w+):\s*([^,]+)/g;
  const block = configSrc.match(
    /DEFAULT_STACKING:\s*StackingConfig\s*=\s*\{([^}]+)\}/
  );
  if (block) {
    for (const m of block[1].matchAll(defRe)) {
      defaults.set(m[1], m[2].trim());
    }
  }

  const descriptions = new Map<string, string>();
  const jsdocRe = /\/\*\*\s*(.+?)\s*\*\/\s*\n\s*(\w+):/g;
  const stackBlock = typesSrc.match(
    /export interface StackingConfig\s*\{([\s\S]*?)\}/
  );
  if (stackBlock) {
    for (const m of stackBlock[1].matchAll(jsdocRe)) {
      const desc = m[1]
        .replace(/\(default:\s*[\d.]+\)/, "")
        .trim();
      descriptions.set(m[2], desc);
    }
  }

  const rows: StackingRow[] = [];
  for (const [name, val] of defaults) {
    rows.push({
      name,
      default: val,
      description: descriptions.get(name) ?? "",
    });
  }
  return rows;
}

function stackingTable(rows: StackingRow[]): string {
  const lines = [
    "| Option | Default | Description |",
    "|---|---|---|",
  ];
  for (const r of rows) {
    lines.push(`| \`${r.name}\` | \`${r.default}\` | ${r.description} |`);
  }
  return lines.join("\n");
}

// ── Extract config defaults from types.ts ────────

interface ConfigRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

function extractConfigDefaults(): ConfigRow[] {
  const typesSrc = read("types.ts");

  const block = typesSrc.match(
    /export interface SheetStackConfig\s*\{([\s\S]*?)\n\}/
  );
  if (!block) return [];

  const rows: ConfigRow[] = [];
  const fieldRe =
    /\/\*\*\s*(.+?)\s*\*\/\s*\n\s*(\w+)\?:\s*(.+?);/g;
  for (const m of block[1].matchAll(fieldRe)) {
    const description = m[1]
      .replace(/Default:\s*.+$/, "")
      .trim();
    const defaultMatch = m[1].match(/Default:\s*(.+?)$/);
    rows.push({
      name: m[2],
      type: cleanType(m[3].trim()),
      default: defaultMatch ? defaultMatch[1].trim() : "—",
      description,
    });
  }
  return rows;
}

function cleanType(t: string): string {
  return t
    .replace(/import\(.+?\)\./, "")
    .replace(/Partial<(\w+)>/, "$1");
}

function configTable(rows: ConfigRow[]): string {
  const lines = [
    "| Option | Type | Default | Description |",
    "|---|---|---|---|",
  ];
  for (const r of rows) {
    lines.push(
      `| \`${r.name}\` | \`${r.type}\` | ${r.default} | ${r.description} |`
    );
  }
  return lines.join("\n");
}

// ── Extract actions from types.ts ────────────────

interface ActionRow {
  name: string;
  signature: string;
  fullSignature: string;
  jsdoc: string;
}

function extractActions(): ActionRow[] {
  const src = read("types.ts");
  const block = src.match(
    /export interface SheetActions[\s\S]*?\{([\s\S]*?)\n\}/
  );
  if (!block) return [];

  const rows: ActionRow[] = [];
  const seen = new Set<string>();
  const actionRe =
    /\/\*\*\s*(.+?)\s*\*\/\s*\n\s*(\w+)(<.+?>)?\(([^)]*)\):\s*(\w+);/g;
  for (const m of block[1].matchAll(actionRe)) {
    const jsdoc = m[1].trim();
    const name = m[2];
    // Skip overloads — only document the first (primary) signature per action
    if (seen.has(name)) continue;
    seen.add(name);
    const generic = m[3] ?? "";
    const rawParams = m[4]
      .replace(/\n\s*/g, " ")
      .replace(/,\s*$/g, "")
      .trim();
    const simplified = rawParams
      ? rawParams
          .split(",")
          .map((p) => p.replace(/<.+?>/g, "").trim().split(":")[0].trim())
          .join(", ")
      : "";

    // Build full typed signature
    const typedParams = rawParams
      ? rawParams
          .split(",")
          .map((p) => {
            const clean = p.replace(/<.+?>/g, "").trim();
            return clean
              .replace(/Extract<keyof TMap\s*,\s*string>/g, "keyof TMap")
              .replace(/TMap\[K\]/g, "TMap[K]");
          })
          .join(", ")
      : "";

    rows.push({
      name,
      signature: simplified ? `${name}(${simplified})` : `${name}()`,
      fullSignature: typedParams
        ? `${name}${generic.replace(/Extract<keyof TMap\s*,\s*string>/g, "keyof TMap")}(${typedParams}): void`
        : `${name}(): void`,
      jsdoc,
    });
  }
  return rows;
}

// ── Rich action docs (keyed by action name) ──────

const ACTION_DOCS: Record<string, { body: string; example: string }> = {
  open: {
    body: "Replace the stack with a single sheet and open it. Any existing sheets are removed.",
    example: `const { open } = useSheetStack();

// Type-map sheet
open("user-profile", "user-1", { userId: "u_abc" });

// Ad-hoc component (auto-generated id)
open(UserProfile, { userId: "u_abc" });

// Ad-hoc component (explicit id)
open(UserProfile, "user-1", { userId: "u_abc" });`,
  },
  push: {
    body: "Push a new sheet onto the stack. The current top sheet scales down with a depth effect. If the stack is at `maxDepth`, replaces the top instead.",
    example: `const { push } = useSheetStack();

// Type-map sheet
push("settings", "settings-1", { tab: "billing" });

// Ad-hoc component (auto-generated id)
push(SettingsSheet, { tab: "billing" });

// Ad-hoc component (explicit id for later setData/remove)
push(SettingsSheet, "settings-1", { tab: "billing" });`,
  },
  replace: {
    body: "Swap the top sheet without changing stack depth. If the stack is empty, opens a new sheet.",
    example: `const { replace } = useSheetStack();

// Type-map sheet
replace("user-profile", "user-2", { userId: "u_xyz" });

// Ad-hoc component
replace(UserProfile, { userId: "u_xyz" });`,
  },
  navigate: {
    body: `Smart routing. Looks at the current stack and decides:

| Stack state | Same type on top? | Result |
|---|---|---|
| Empty | — | \`open()\` |
| Non-empty | Yes | \`replace()\` |
| Non-empty | No | \`push()\` |

For ad-hoc components, "same type" means the same component reference.`,
    example: `const { navigate } = useSheetStack();

// Type-map sheet
navigate("settings", "s-1", { tab: "general" });

// Ad-hoc component
navigate(SettingsSheet, { tab: "general" });`,
  },
  setData: {
    body: "Update the data on a sheet that's already open, by id. The sheet stays in place with no animation — only the content component re-renders with new props.",
    example: `const { setData } = useSheetStack();

// Type-map sheet
setData("user-profile", "user-1", { userId: "u_new" });

// Ad-hoc component (requires explicit id)
setData(UserProfile, "user-1", { userId: "u_new" });`,
  },
  remove: {
    body: "Remove a specific sheet from anywhere in the stack by its id. If it was the last sheet, closes the stack. Useful for dismissing buried sheets like notifications.",
    example: `const { remove } = useSheetStack();
remove("notification-1");`,
  },
  pop: {
    body: "Remove the top sheet. The sheet below expands back with a spring animation. If it was the last sheet, closes the stack.",
    example: `const { pop } = useSheetStack();
pop();`,
  },
  close: {
    body: "Clear the entire stack and close. All sheets exit simultaneously.",
    example: `const { close } = useSheetStack();
close();`,
  },
};

function actionSection(actions: ActionRow[]): string {
  return actions
    .map((a) => {
      const docs = ACTION_DOCS[a.name];
      const body = docs?.body ?? `${a.jsdoc}.`;
      const example = docs?.example ?? "";
      return `#### \`${a.signature}\`

\`\`\`ts
${a.fullSignature}
\`\`\`

${body}

\`\`\`tsx
${example}
\`\`\``;
    })
    .join("\n\n");
}

// ── Extract interface fields from types.ts ───────

interface InterfaceField {
  name: string;
  type: string;
  optional: boolean;
  jsdoc: string;
}

function extractInterface(interfaceName: string): InterfaceField[] {
  const src = read("types.ts");
  const re = new RegExp(
    `export (?:interface|type) ${interfaceName}[^{]*\\{([\\s\\S]*?)\\n\\}`,
  );
  const block = src.match(re);
  if (!block) return [];

  const fields: InterfaceField[] = [];
  // Match fields with optional JSDoc, handling both single-line and multi-line generics
  const fieldRe =
    /(?:\/\*\*\s*(.+?)\s*\*\/\s*\n\s*)?(\w+)(\?)?:\s*(.+?);/g;
  for (const m of block[1].matchAll(fieldRe)) {
    const jsdoc = m[1]?.trim() ?? "";
    const name = m[2];
    const optional = m[3] === "?";
    let type = m[4].trim();

    // Clean up import() references
    type = type.replace(/import\(.+?\)\./g, "");
    // Collapse whitespace
    type = type.replace(/\s+/g, " ");

    fields.push({ name, type, optional, jsdoc });
  }
  return fields;
}

function interfaceTable(fields: InterfaceField[]): string {
  const lines = [
    "| Prop | Type | Required | Description |",
    "|---|---|---|---|",
  ];
  for (const f of fields) {
    const required = f.optional ? "No" : "Yes";
    const desc = f.jsdoc.replace(/Default:\s*.+$/, "").trim() || "—";
    lines.push(`| \`${f.name}\` | \`${f.type}\` | ${required} | ${desc} |`);
  }
  return lines.join("\n");
}

// ── Extract exported types from index.ts ─────────

function extractExportedTypes(): string[] {
  const src = read("index.ts");
  const types: string[] = [];
  // Match all export type { ... } blocks (including multi-line)
  const re = /export type\s*\{([^}]+)\}/g;
  for (const block of src.matchAll(re)) {
    for (const line of block[1].split(",")) {
      const name = line.replace(/\/\/.*/g, "").trim();
      if (name) types.push(name);
    }
  }
  return types;
}

// ── Extract exported values from index.ts ────────

function extractExportedValues(): { name: string; from: string }[] {
  const src = read("index.ts");
  const values: { name: string; from: string }[] = [];
  // Match named exports (not type exports)
  const re = /export \{([^}]+)\} from "\.\/(\w+)"/g;
  for (const m of src.matchAll(re)) {
    const names = m[1].split(",").map((n) => n.trim()).filter(Boolean);
    for (const name of names) {
      values.push({ name, from: m[2] });
    }
  }
  return values;
}

// ── Type descriptions for exports table ──────────

const TYPE_DESCRIPTIONS: Record<string, string> = {
  ContentMap: "Map of sheet type key → content component",
  HeaderRenderProps: "Props passed to custom `renderHeader` function",
  ResolvedConfig: "Fully resolved config (all fields required)",
  ResponsiveSide: "Per-viewport side configuration `{ desktop, mobile }`",
  SheetActions: "All sheet actions (open, push, pop, close, etc.)",
  SheetClassNames: "CSS class overrides for backdrop, panel, header",
  SheetComponentProps: "Props shape for ad-hoc sheet components `{ data, onClose }`",
  SheetContentComponent: "Component type rendered inside a sheet panel",
  SheetItem: "Single item in the sheet stack `{ id, type, data }`",
  SheetProviderProps: "Props for the `<SheetStackProvider>` component",
  SheetSnapshot: "Reactive state: `{ stack, isOpen }`",
  SheetStackConfig: "User-facing config passed to `createSheetStack()`",
  SheetStackInstance: "Return type of `createSheetStack()`",
  Side: 'Sheet position: `"left"` | `"right"` | `"bottom"`',
  SideConfig: "Side as string or responsive object",
  SpringConfig: "Spring physics: `{ stiffness, damping, mass }`",
  SpringPreset: "Spring preset name (union of preset keys)",
  StackingConfig: "Depth-stacking visual parameters",
};

// ── Assemble README ──────────────────────────────

function generate(): string {
  const springs = extractSprings();
  const stacking = extractStackingDefaults();
  const config = extractConfigDefaults();
  const actions = extractActions();
  const exportedTypes = extractExportedTypes();

  // Extract interface fields for documentation
  const sheetProviderFields = extractInterface("SheetProviderProps");
  const sheetClassNameFields = extractInterface("SheetClassNames");
  const headerRenderFields = extractInterface("HeaderRenderProps");
  const sheetItemFields = extractInterface("SheetItem");
  const sheetSnapshotFields = extractInterface("SheetSnapshot");
  const springConfigFields = extractInterface("SpringConfig");

  return `# Stacksheet

Typed, animated sheet stacking for React. Powered by Zustand and Motion.

Most sheet libraries are component-scoped — you render \`<Sheet open={open}>\` and manage state locally. Stacksheet gives you a \`useSheetStack()\` hook that can open, push, and navigate sheets from any component. Need to trigger a sheet outside React? The underlying store works in event handlers, API callbacks, and keyboard shortcuts too.

\`\`\`
npm install @howells/stacksheet
\`\`\`

Peer dependencies: \`react >= 18\`, \`react-dom >= 18\`.

---

## Quick start

\`\`\`tsx
import { createSheetStack } from "@howells/stacksheet";

// 1. Create an instance with your sheet types
const sheets = createSheetStack<{
  "user-profile": { userId: string };
}>();

// 2. Write a content component
function UserProfile({ data, onClose }: { data: { userId: string }; onClose: () => void }) {
  return (
    <div>
      <h2>User {data.userId}</h2>
      <button onClick={onClose}>Done</button>
    </div>
  );
}

// 3. Wrap your app with the provider
function App() {
  return (
    <sheets.SheetStackProvider content={{ "user-profile": UserProfile }}>
      <YourApp />
    </sheets.SheetStackProvider>
  );
}
\`\`\`

Open a sheet from any component:

\`\`\`tsx
function SomeButton() {
  const { open } = sheets.useSheetStack();
  return (
    <button onClick={() => open("user-profile", "user-1", { userId: "u_abc" })}>
      View Profile
    </button>
  );
}
\`\`\`

---

## Actions

Use \`useSheetStack()\` inside any component to get the full set of actions:

\`\`\`tsx
function MyComponent() {
  const { open, push, replace, navigate, setData, remove, pop, close } = sheets.useSheetStack();
}
\`\`\`

${actionSection(actions)}

---

## Ad-hoc component push

Every action that takes a type key also accepts a component directly. No need to register it in the type map — just pass the component and its data:

\`\`\`tsx
import { createSheetStack } from "@howells/stacksheet";

const sheets = createSheetStack();

function ProfileSheet({ data, onClose }: { data: { userId: string }; onClose: () => void }) {
  return <div>User {data.userId} <button onClick={onClose}>Close</button></div>;
}

function App() {
  return (
    <sheets.SheetStackProvider content={{}}>
      <MyApp />
    </sheets.SheetStackProvider>
  );
}

function MyApp() {
  const { push } = sheets.useSheetStack();
  return (
    <button onClick={() => push(ProfileSheet, { userId: "u_abc" })}>
      View Profile
    </button>
  );
}
\`\`\`

### With explicit id

Pass an id as the second argument to reference the sheet later with \`setData\` or \`remove\`:

\`\`\`tsx
push(ProfileSheet, "profile-1", { userId: "u_abc" });

// Later...
setData(ProfileSheet, "profile-1", { userId: "u_xyz" });
remove("profile-1");
\`\`\`

### How it works

A side-car \`Map\` lives next to the Zustand store. When you pass a component:

1. A type key like \`"__adhoc_0"\` is generated (reused if the same component is pushed again)
2. The component is stashed in the Map
3. The store receives \`{ type: "__adhoc_0", id, data }\` — plain serializable data
4. The renderer resolves the type key back to the component at render time

The store stays fully serializable. Devtools and persistence work unchanged. Type-map sheets and ad-hoc sheets can coexist in the same stack.

---

## Content components

Each sheet type in your \`TMap\` maps to a React component. The component receives typed \`data\` and an \`onClose\` callback:

\`\`\`tsx
type SheetContentComponent<TData> = ComponentType<{
  data: TData;
  onClose: () => void;
}>;
\`\`\`

| Prop | Type | Description |
|---|---|---|
| \`data\` | \`TData\` | The data payload passed when opening the sheet, typed per sheet type |
| \`onClose\` | \`() => void\` | Closes the entire sheet stack |

\`\`\`tsx
const sheets = createSheetStack<{
  "bucket-editor": { bucket: Bucket };
}>();

function BucketEditor({
  data,
  onClose,
}: {
  data: { bucket: Bucket };
  onClose: () => void;
}) {
  return (
    <form onSubmit={() => { save(data.bucket); onClose(); }}>
      {/* fields */}
    </form>
  );
}

// Pass in SheetStackProvider
<sheets.SheetStackProvider content={{ "bucket-editor": BucketEditor }}>
\`\`\`

The content map is fully typed — TypeScript will enforce that every key in your \`TMap\` has a matching component, and that each component receives the correct \`data\` shape.

---

## Configuration

Pass config to \`createSheetStack()\`:

\`\`\`tsx
const sheets = createSheetStack<MySheetMap>({
  side: "right",
  width: 480,
  spring: "snappy",
  closeOnEscape: true,
});
\`\`\`

${configTable(config)}

### Side

Controls which edge the sheet slides from. A string applies to all viewports. An object lets you set different sides for desktop and mobile (switches at \`breakpoint\`):

\`\`\`tsx
// Always right
createSheetStack({ side: "right" });

// Right on desktop, bottom sheet on mobile (default)
createSheetStack({ side: { desktop: "right", mobile: "bottom" } });

// Left sidebar
createSheetStack({ side: "left" });
\`\`\`

Available sides: \`"left"\` | \`"right"\` | \`"bottom"\`

### Stacking

Controls the Apple-style depth effect when sheets are stacked. Behind-sheets scale down, shift away, and can optionally fade:

${stackingTable(stacking)}

\`\`\`tsx
createSheetStack({
  stacking: { scaleStep: 0.06, offsetStep: 48 },
});
\`\`\`

### Springs

Spring presets control animation feel. Pass a preset name or a custom \`SpringConfig\` object:

${springTable(springs)}

\`\`\`tsx
// Preset
createSheetStack({ spring: "bouncy" });

// Custom
createSheetStack({ spring: { stiffness: 300, damping: 25, mass: 0.9 } });
\`\`\`

**\`SpringConfig\`:**

${interfaceTable(springConfigFields)}

The renderer derives three spring variants from your config:

| Spring | Purpose | Derived from |
|---|---|---|
| **primary** | Top sheet entrance/exit slide | Your config directly |
| **stack** | Behind-sheets contracting/expanding | 60% stiffness, 140% mass (lagging feel) |
| **exit** | Pop/close exit animation | 50% stiffness, 120% mass (softer departure) |

---

## Styling

Stacksheet renders with sensible inline defaults (white background, subtle shadow, backdrop overlay). Override with CSS classes:

\`\`\`tsx
<sheets.SheetStackProvider
  content={contentMap}
  classNames={{
    backdrop: "my-backdrop",
    panel: "my-panel",
    header: "my-header",
  }}
>
\`\`\`

**\`SheetClassNames\`:**

${interfaceTable(sheetClassNameFields)}

When a class is provided, the corresponding inline background/border styles are removed so your CSS has full control. The library exposes CSS custom properties as fallbacks:

| Property | Default | Used on |
|---|---|---|
| \`--background\` | \`#fff\` | Panel background |
| \`--border\` | \`transparent\` | Panel border, header border |
| \`--overlay\` | \`rgba(0,0,0,0.2)\` | Backdrop |

\`\`\`css
.my-panel {
  background: var(--surface);
  border-left: 1px solid var(--border);
  border-radius: 0;
}

.my-backdrop {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}
\`\`\`

### Custom header

Replace the default back/close header entirely with the \`renderHeader\` prop:

\`\`\`tsx
<sheets.SheetStackProvider
  content={contentMap}
  renderHeader={({ isNested, onBack, onClose }) => (
    <header className="my-header">
      {isNested && <button onClick={onBack}>Back</button>}
      <button onClick={onClose}>Close</button>
    </header>
  )}
>
\`\`\`

**\`HeaderRenderProps\`:**

${interfaceTable(headerRenderFields)}

The default header is a 48px bar with icon buttons — a back arrow (shown when nested) and a close X.

---

## Advanced

### \`createSheetStack()\` deep dive

Factory function that creates an isolated sheet stack instance. Each call produces its own Zustand store, React context, and typed hooks.

\`\`\`tsx
import { createSheetStack } from "@howells/stacksheet";

const sheets = createSheetStack<{
  "user-profile": { userId: string };
  "settings": { tab?: string };
}>({
  side: "right",
  width: 420,
  spring: "stiff",
});
\`\`\`

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| \`TMap\` | generic | Yes | Map of sheet type names → data shapes |
| \`config\` | \`SheetStackConfig\` | No | Configuration options (see [Configuration](#configuration)) |

**Returns: \`SheetStackInstance<TMap>\`**

| Property | Type | Description |
|---|---|---|
| \`SheetStackProvider\` | \`ComponentType<SheetProviderProps<TMap>>\` | Provider component — wrap your app and pass the content map |
| \`useSheetStack\` | \`() => SheetActions<TMap>\` | Hook returning all sheet actions |
| \`useSheetStackState\` | \`() => SheetSnapshot<TMap>\` | Hook returning reactive state (stack, isOpen) |
| \`store\` | \`StoreApi<SheetSnapshot<TMap> & SheetActions<TMap>>\` | Raw Zustand store for use outside React |

#### \`<SheetStackProvider>\`

Provider component returned by \`createSheetStack()\`. Renders the sheet stack UI and provides context for hooks.

\`\`\`tsx
<sheets.SheetStackProvider
  content={{
    "user-profile": UserProfile,
    "settings": Settings,
  }}
  classNames={{
    backdrop: "my-backdrop",
    panel: "my-panel",
    header: "my-header",
  }}
  renderHeader={({ isNested, onBack, onClose }) => (
    <MyCustomHeader isNested={isNested} onBack={onBack} onClose={onClose} />
  )}
>
  <App />
</sheets.SheetStackProvider>
\`\`\`

**Props:**

${interfaceTable(sheetProviderFields)}

#### \`useSheetStackState()\`

Hook that returns the reactive sheet state. Must be used within \`<SheetStackProvider>\`. Re-renders when the stack or open state changes.

\`\`\`tsx
function SheetIndicator() {
  const { stack, isOpen } = sheets.useSheetStackState();
  return <span>{isOpen ? \\\`\\\${stack.length} sheets open\\\` : "closed"}</span>;
}
\`\`\`

**Returns: \`SheetSnapshot<TMap>\`**

${interfaceTable(sheetSnapshotFields)}

Each item in \`stack\` is a \`SheetItem\`:

${interfaceTable(sheetItemFields)}

### Using the store outside React

Need to open a sheet from an event handler, API callback, or keyboard shortcut? Use the \`store\` directly:

\`\`\`tsx
// Read current state (non-reactive)
const state = sheets.store.getState();
console.log(state.stack.length, state.isOpen);

// Call actions from anywhere
sheets.store.getState().open("error", "err-1", { message: "Something broke" });

// Subscribe to changes
const unsub = sheets.store.subscribe((state) => {
  console.log("Stack changed:", state.stack.length);
});
\`\`\`

The store has the full \`SheetSnapshot<TMap> & SheetActions<TMap>\` shape — all state and actions in one object.

\`\`\`tsx
// sheets.ts — shared instance
export const sheets = createSheetStack<{
  "confirm-delete": { itemId: string; onConfirm: () => void };
  "error": { message: string };
}>();
\`\`\`

\`\`\`tsx
// api.ts — no React, no hooks, no context
import { sheets } from "./sheets";

export async function deleteItem(id: string) {
  try {
    await fetch(\\\`/api/items/\\\${id}\\\`, { method: "DELETE" });
  } catch (err) {
    sheets.store.getState().open("error", "api-error", {
      message: "Failed to delete item",
    });
  }
}
\`\`\`

\`\`\`tsx
// keyboard.ts — global keyboard shortcut
import { sheets } from "./sheets";

document.addEventListener("keydown", (e) => {
  if (e.key === "," && e.metaKey) {
    sheets.store.getState().open("settings", "settings", { tab: "general" });
  }
});
\`\`\`

### Multiple instances

Each \`createSheetStack()\` call creates a fully isolated instance with its own store, config, type map, and React context. Use this for distinct UI concerns:

\`\`\`tsx
const mainSheets = createSheetStack<{
  "user-profile": { userId: string };
}>({ side: "right" });

const settingsSheets = createSheetStack<{
  "preferences": { section: string };
}>({ side: "left", width: 360 });

function App() {
  return (
    <mainSheets.SheetStackProvider content={{ "user-profile": UserProfile }}>
      <settingsSheets.SheetStackProvider content={{ "preferences": Preferences }}>
        <YourApp />
      </settingsSheets.SheetStackProvider>
    </mainSheets.SheetStackProvider>
  );
}
\`\`\`

They render and animate independently.

### Anatomy

When rendered, \`SheetStackProvider\` produces the following DOM structure:

\`\`\`
<SheetStackProvider>
  {children}                         ← your app content

  <!-- Backdrop (AnimatePresence) -->
  <motion.div />                     ← overlay, fades in/out

  <!-- Clip container (always rendered) -->
  <div style="fixed; overflow:hidden">
    <AnimatePresence>
      <!-- One per stack item, bottom to top -->
      <motion.div>                   ← panel (slides from side)
        <DefaultHeader />            ← or renderHeader()
        <div>                        ← scrollable content area
          <ContentComponent />       ← your component
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</SheetStackProvider>
\`\`\`

**Key structural details:**

- The **backdrop** and **panels** use independent \`AnimatePresence\` scopes so each can animate exit independently
- Panels are rendered inside a fixed clip container with \`overflow: hidden\` — this prevents partially-offscreen sheets from overflowing during animations
- The clip container uses \`pointer-events: none\`; only the **top panel** has \`pointer-events: auto\`
- Each panel has \`role="dialog"\` and \`aria-modal="true"\` (top panel only)
- The **content area** uses \`overscroll-behavior: contain\` to prevent scroll bleed to the page body
- Sheets below the \`renderThreshold\` depth don't render their content component (performance optimization)
- The **header** is only rendered on the top panel

---

## TypeScript

The type map generic enforces that every \`open()\`, \`push()\`, \`navigate()\`, and \`replace()\` call passes the correct data shape:

\`\`\`tsx
const sheets = createSheetStack<{
  "user-profile": { userId: string };
  "settings": { tab?: string };
}>();

const { open } = sheets.useSheetStack();

// ✓ Correct
open("user-profile", "u1", { userId: "abc" });

// ✗ Type error: missing userId
open("user-profile", "u1", {});

// ✗ Type error: "unknown-type" is not a key
open("unknown-type", "x", {});
\`\`\`

### Exported types

All types are importable from the package entry point:

\`\`\`tsx
import type {
${exportedTypes.map((t) => `  ${t},`).join("\n")}
} from "@howells/stacksheet";
\`\`\`

| Type | Description |
|---|---|
${exportedTypes.map((t) => `| \`${t}\` | ${TYPE_DESCRIPTIONS[t] ?? "—"} |`).join("\n")}

---

## License

MIT
`;
}

// ── Main ─────────────────────────────────────────

const readme = generate();
writeFileSync(resolve(ROOT, "README.md"), readme);
console.log("README.md generated from source.");
