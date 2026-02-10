# Stacksheet

Typed, animated sheet stacking for React. Powered by Zustand and Motion.

Most sheet libraries are component-scoped — you render `<Sheet open={open}>` and manage state locally. Stacksheet gives you a `useSheetStack()` hook that can open, push, and navigate sheets from any component. Need to trigger a sheet outside React? The underlying store works in event handlers, API callbacks, and keyboard shortcuts too.

```
npm install @howells/stacksheet
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

---

## Quick start

```tsx
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
```

Open a sheet from any component:

```tsx
function SomeButton() {
  const { open } = sheets.useSheetStack();
  return (
    <button onClick={() => open("user-profile", "user-1", { userId: "u_abc" })}>
      View Profile
    </button>
  );
}
```

---

## Actions

Use `useSheetStack()` inside any component to get the full set of actions:

```tsx
function MyComponent() {
  const { open, push, replace, navigate, setData, remove, pop, close } = sheets.useSheetStack();
}
```

#### `open(type, id, data)`

```ts
open<K extends keyof TMap>(type: K, id: string, data: TMap[K]): void
```

Replace the stack with a single sheet and open it. Any existing sheets are removed.

```tsx
const { open } = useSheetStack();

// Type-map sheet
open("user-profile", "user-1", { userId: "u_abc" });

// Ad-hoc component (auto-generated id)
open(UserProfile, { userId: "u_abc" });

// Ad-hoc component (explicit id)
open(UserProfile, "user-1", { userId: "u_abc" });
```

#### `push(type, id, data)`

```ts
push<K extends keyof TMap>(type: K, id: string, data: TMap[K]): void
```

Push a new sheet onto the stack. The current top sheet scales down with a depth effect. If the stack is at `maxDepth`, replaces the top instead.

```tsx
const { push } = useSheetStack();

// Type-map sheet
push("settings", "settings-1", { tab: "billing" });

// Ad-hoc component (auto-generated id)
push(SettingsSheet, { tab: "billing" });

// Ad-hoc component (explicit id for later setData/remove)
push(SettingsSheet, "settings-1", { tab: "billing" });
```

#### `replace(type, id, data)`

```ts
replace<K extends keyof TMap>(type: K, id: string, data: TMap[K]): void
```

Swap the top sheet without changing stack depth. If the stack is empty, opens a new sheet.

```tsx
const { replace } = useSheetStack();

// Type-map sheet
replace("user-profile", "user-2", { userId: "u_xyz" });

// Ad-hoc component
replace(UserProfile, { userId: "u_xyz" });
```

#### `navigate(type, id, data)`

```ts
navigate<K extends keyof TMap>(type: K, id: string, data: TMap[K]): void
```

Smart routing. Looks at the current stack and decides:

| Stack state | Same type on top? | Result |
|---|---|---|
| Empty | — | `open()` |
| Non-empty | Yes | `replace()` |
| Non-empty | No | `push()` |

For ad-hoc components, "same type" means the same component reference.

```tsx
const { navigate } = useSheetStack();

// Type-map sheet
navigate("settings", "s-1", { tab: "general" });

// Ad-hoc component
navigate(SettingsSheet, { tab: "general" });
```

#### `setData(type, id, data)`

```ts
setData<K extends keyof TMap>(type: K, id: string, data: TMap[K]): void
```

Update the data on a sheet that's already open, by id. The sheet stays in place with no animation — only the content component re-renders with new props.

```tsx
const { setData } = useSheetStack();

// Type-map sheet
setData("user-profile", "user-1", { userId: "u_new" });

// Ad-hoc component (requires explicit id)
setData(UserProfile, "user-1", { userId: "u_new" });
```

#### `remove(id)`

```ts
remove(id: string): void
```

Remove a specific sheet from anywhere in the stack by its id. If it was the last sheet, closes the stack. Useful for dismissing buried sheets like notifications.

```tsx
const { remove } = useSheetStack();
remove("notification-1");
```

#### `pop()`

```ts
pop(): void
```

Remove the top sheet. The sheet below expands back with a spring animation. If it was the last sheet, closes the stack.

```tsx
const { pop } = useSheetStack();
pop();
```

#### `close()`

```ts
close(): void
```

Clear the entire stack and close. All sheets exit simultaneously.

```tsx
const { close } = useSheetStack();
close();
```

---

## Ad-hoc component push

Every action that takes a type key also accepts a component directly. No need to register it in the type map — just pass the component and its data:

```tsx
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
```

### With explicit id

Pass an id as the second argument to reference the sheet later with `setData` or `remove`:

```tsx
push(ProfileSheet, "profile-1", { userId: "u_abc" });

// Later...
setData(ProfileSheet, "profile-1", { userId: "u_xyz" });
remove("profile-1");
```

### How it works

A side-car `Map` lives next to the Zustand store. When you pass a component:

1. A type key like `"__adhoc_0"` is generated (reused if the same component is pushed again)
2. The component is stashed in the Map
3. The store receives `{ type: "__adhoc_0", id, data }` — plain serializable data
4. The renderer resolves the type key back to the component at render time

The store stays fully serializable. Devtools and persistence work unchanged. Type-map sheets and ad-hoc sheets can coexist in the same stack.

---

## Content components

Each sheet type in your `TMap` maps to a React component. The component receives typed `data` and an `onClose` callback:

```tsx
type SheetContentComponent<TData> = ComponentType<{
  data: TData;
  onClose: () => void;
}>;
```

| Prop | Type | Description |
|---|---|---|
| `data` | `TData` | The data payload passed when opening the sheet, typed per sheet type |
| `onClose` | `() => void` | Closes the entire sheet stack |

```tsx
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
```

The content map is fully typed — TypeScript will enforce that every key in your `TMap` has a matching component, and that each component receives the correct `data` shape.

---

## Configuration

Pass config to `createSheetStack()`:

```tsx
const sheets = createSheetStack<MySheetMap>({
  side: "right",
  width: 480,
  spring: "snappy",
  closeOnEscape: true,
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `maxDepth` | `number` | Infinity (unlimited) | Maximum stack depth. |
| `closeOnEscape` | `boolean` | true | Close on ESC key. |
| `closeOnBackdrop` | `boolean` | true | Close on backdrop click. |
| `lockScroll` | `boolean` | true | Lock body scroll when open. |
| `width` | `number` | 420 | Panel width in px. |
| `maxWidth` | `string` | "90vw" | Maximum panel width as CSS value. |
| `breakpoint` | `number` | 768 | Mobile breakpoint in px. |
| `side` | `SideConfig` | { desktop: "right", mobile: "bottom" } | Sheet slide-from side. |
| `stacking` | `StackingConfig` | — | Stacking visual parameters |
| `spring` | `SpringPreset | SpringConfig` | — | Spring animation parameters — preset name or custom config |
| `zIndex` | `number` | 100 | Base z-index. |

### Side

Controls which edge the sheet slides from. A string applies to all viewports. An object lets you set different sides for desktop and mobile (switches at `breakpoint`):

```tsx
// Always right
createSheetStack({ side: "right" });

// Right on desktop, bottom sheet on mobile (default)
createSheetStack({ side: { desktop: "right", mobile: "bottom" } });

// Left sidebar
createSheetStack({ side: "left" });
```

Available sides: `"left"` | `"right"` | `"bottom"`

### Stacking

Controls the Apple-style depth effect when sheets are stacked. Behind-sheets scale down, shift away, and can optionally fade:

| Option | Default | Description |
|---|---|---|
| `scaleStep` | `0.04` | Scale reduction per depth level |
| `offsetStep` | `36` | Horizontal/vertical offset per depth level in px |
| `opacityStep` | `0` | Opacity reduction per depth level |
| `radius` | `12` | Border radius applied to stacked panels in px |
| `renderThreshold` | `5` | Max depth before content stops rendering |

```tsx
createSheetStack({
  stacking: { scaleStep: 0.06, offsetStep: 48 },
});
```

### Springs

Spring presets control animation feel. Pass a preset name or a custom `SpringConfig` object:

| Preset | Stiffness | Damping | Mass | Feel |
|---|---|---|---|---|
| `"soft"` | 120 | 18 | 1 | Very gentle, slow settle. Loaders, radial pickers |
| `"subtle"` | 300 | 30 | 1 | Barely noticeable bounce, professional |
| `"natural"` | 200 | 20 | 1 | Balanced, general-purpose default |
| `"playful"` | 170 | 15 | 1 | Character with bounce |
| `"bouncy"` | 260 | 12 | 1 | Visible bounce, energetic. Popovers, hints |
| `"snappy"` | 400 | 28 | 0.8 | Quick, responsive for interactions |
| **`"stiff"`** | 400 | 40 | 1 | **Default.** Very quick, controlled. Panels, drawers |

```tsx
// Preset
createSheetStack({ spring: "bouncy" });

// Custom
createSheetStack({ spring: { stiffness: 300, damping: 25, mass: 0.9 } });
```

**`SpringConfig`:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `damping` | `number` | Yes | Damping — higher = less oscillation (default: 30) |
| `stiffness` | `number` | Yes | Stiffness — higher = snappier (default: 170) |
| `mass` | `number` | Yes | Mass — higher = more momentum (default: 0.8) |

The renderer derives three spring variants from your config:

| Spring | Purpose | Derived from |
|---|---|---|
| **primary** | Top sheet entrance/exit slide | Your config directly |
| **stack** | Behind-sheets contracting/expanding | 60% stiffness, 140% mass (lagging feel) |
| **exit** | Pop/close exit animation | 50% stiffness, 120% mass (softer departure) |

---

## Styling

Stacksheet renders with sensible inline defaults (white background, subtle shadow, backdrop overlay). Override with CSS classes:

```tsx
<sheets.SheetStackProvider
  content={contentMap}
  classNames={{
    backdrop: "my-backdrop",
    panel: "my-panel",
    header: "my-header",
  }}
>
```

**`SheetClassNames`:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `backdrop` | `string` | No | Applied to backdrop overlay |
| `panel` | `string` | No | Applied to each panel container |
| `header` | `string` | No | Applied to the header bar |

When a class is provided, the corresponding inline background/border styles are removed so your CSS has full control. The library exposes CSS custom properties as fallbacks:

| Property | Default | Used on |
|---|---|---|
| `--background` | `#fff` | Panel background |
| `--border` | `transparent` | Panel border, header border |
| `--overlay` | `rgba(0,0,0,0.2)` | Backdrop |

```css
.my-panel {
  background: var(--surface);
  border-left: 1px solid var(--border);
  border-radius: 0;
}

.my-backdrop {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}
```

### Custom header

Replace the default back/close header entirely with the `renderHeader` prop:

```tsx
<sheets.SheetStackProvider
  content={contentMap}
  renderHeader={({ isNested, onBack, onClose }) => (
    <header className="my-header">
      {isNested && <button onClick={onBack}>Back</button>}
      <button onClick={onClose}>Close</button>
    </header>
  )}
>
```

**`HeaderRenderProps`:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `isNested` | `boolean` | Yes | `true` when the stack has more than one sheet |
| `onBack` | `() => void` | Yes | Pop the top sheet (go back one level) |
| `onClose` | `() => void` | Yes | Close the entire sheet stack |

The default header is a 48px bar with icon buttons — a back arrow (shown when nested) and a close X.

---

## Advanced

### `createSheetStack()` deep dive

Factory function that creates an isolated sheet stack instance. Each call produces its own Zustand store, React context, and typed hooks.

```tsx
import { createSheetStack } from "@howells/stacksheet";

const sheets = createSheetStack<{
  "user-profile": { userId: string };
  "settings": { tab?: string };
}>({
  side: "right",
  width: 420,
  spring: "stiff",
});
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `TMap` | generic | Yes | Map of sheet type names → data shapes |
| `config` | `SheetStackConfig` | No | Configuration options (see [Configuration](#configuration)) |

**Returns: `SheetStackInstance<TMap>`**

| Property | Type | Description |
|---|---|---|
| `SheetStackProvider` | `ComponentType<SheetProviderProps<TMap>>` | Provider component — wrap your app and pass the content map |
| `useSheetStack` | `() => SheetActions<TMap>` | Hook returning all sheet actions |
| `useSheetStackState` | `() => SheetSnapshot<TMap>` | Hook returning reactive state (stack, isOpen) |
| `store` | `StoreApi<SheetSnapshot<TMap> & SheetActions<TMap>>` | Raw Zustand store for use outside React |

#### `<SheetStackProvider>`

Provider component returned by `createSheetStack()`. Renders the sheet stack UI and provides context for hooks.

```tsx
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
```

**Props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `content` | `ContentMap<TMap>` | Yes | Map of sheet type keys to content components |
| `children` | `ReactNode` | Yes | Your application content |
| `classNames` | `SheetClassNames` | No | CSS class overrides for backdrop, panel, and header |
| `renderHeader` | `(props: HeaderRenderProps) => ReactNode` | No | Custom header renderer — replaces the default back/close buttons |

#### `useSheetStackState()`

Hook that returns the reactive sheet state. Must be used within `<SheetStackProvider>`. Re-renders when the stack or open state changes.

```tsx
function SheetIndicator() {
  const { stack, isOpen } = sheets.useSheetStackState();
  return <span>{isOpen ? \`\${stack.length} sheets open\` : "closed"}</span>;
}
```

**Returns: `SheetSnapshot<TMap>`**

| Prop | Type | Required | Description |
|---|---|---|---|
| `stack` | `SheetItem<Extract<keyof TMap, string>>[]` | Yes | Current sheet stack, ordered bottom to top |
| `isOpen` | `boolean` | Yes | Whether any sheets are currently visible |

Each item in `stack` is a `SheetItem`:

| Prop | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier for this sheet instance |
| `type` | `TType` | Yes | Sheet type key from the TMap |
| `data` | `Record<string, unknown>` | Yes | Data payload passed when opening the sheet |

### Using the store outside React

Need to open a sheet from an event handler, API callback, or keyboard shortcut? Use the `store` directly:

```tsx
// Read current state (non-reactive)
const state = sheets.store.getState();
console.log(state.stack.length, state.isOpen);

// Call actions from anywhere
sheets.store.getState().open("error", "err-1", { message: "Something broke" });

// Subscribe to changes
const unsub = sheets.store.subscribe((state) => {
  console.log("Stack changed:", state.stack.length);
});
```

The store has the full `SheetSnapshot<TMap> & SheetActions<TMap>` shape — all state and actions in one object.

```tsx
// sheets.ts — shared instance
export const sheets = createSheetStack<{
  "confirm-delete": { itemId: string; onConfirm: () => void };
  "error": { message: string };
}>();
```

```tsx
// api.ts — no React, no hooks, no context
import { sheets } from "./sheets";

export async function deleteItem(id: string) {
  try {
    await fetch(\`/api/items/\${id}\`, { method: "DELETE" });
  } catch (err) {
    sheets.store.getState().open("error", "api-error", {
      message: "Failed to delete item",
    });
  }
}
```

```tsx
// keyboard.ts — global keyboard shortcut
import { sheets } from "./sheets";

document.addEventListener("keydown", (e) => {
  if (e.key === "," && e.metaKey) {
    sheets.store.getState().open("settings", "settings", { tab: "general" });
  }
});
```

### Multiple instances

Each `createSheetStack()` call creates a fully isolated instance with its own store, config, type map, and React context. Use this for distinct UI concerns:

```tsx
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
```

They render and animate independently.

### Anatomy

When rendered, `SheetStackProvider` produces the following DOM structure:

```
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
```

**Key structural details:**

- The **backdrop** and **panels** use independent `AnimatePresence` scopes so each can animate exit independently
- Panels are rendered inside a fixed clip container with `overflow: hidden` — this prevents partially-offscreen sheets from overflowing during animations
- The clip container uses `pointer-events: none`; only the **top panel** has `pointer-events: auto`
- Each panel has `role="dialog"` and `aria-modal="true"` (top panel only)
- The **content area** uses `overscroll-behavior: contain` to prevent scroll bleed to the page body
- Sheets below the `renderThreshold` depth don't render their content component (performance optimization)
- The **header** is only rendered on the top panel

---

## TypeScript

The type map generic enforces that every `open()`, `push()`, `navigate()`, and `replace()` call passes the correct data shape:

```tsx
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
```

### Exported types

All types are importable from the package entry point:

```tsx
import type {
  SpringPreset,
  ContentMap,
  HeaderRenderProps,
  ResolvedConfig,
  ResponsiveSide,
  SheetActions,
  SheetClassNames,
  SheetComponentProps,
  SheetContentComponent,
  SheetItem,
  SheetProviderProps,
  SheetSnapshot,
  SheetStackConfig,
  SheetStackInstance,
  Side,
  SideConfig,
  SpringConfig,
  StackingConfig,
} from "@howells/stacksheet";
```

| Type | Description |
|---|---|
| `SpringPreset` | Spring preset name (union of preset keys) |
| `ContentMap` | Map of sheet type key → content component |
| `HeaderRenderProps` | Props passed to custom `renderHeader` function |
| `ResolvedConfig` | Fully resolved config (all fields required) |
| `ResponsiveSide` | Per-viewport side configuration `{ desktop, mobile }` |
| `SheetActions` | All sheet actions (open, push, pop, close, etc.) |
| `SheetClassNames` | CSS class overrides for backdrop, panel, header |
| `SheetComponentProps` | Props shape for ad-hoc sheet components `{ data, onClose }` |
| `SheetContentComponent` | Component type rendered inside a sheet panel |
| `SheetItem` | Single item in the sheet stack `{ id, type, data }` |
| `SheetProviderProps` | Props for the `<SheetStackProvider>` component |
| `SheetSnapshot` | Reactive state: `{ stack, isOpen }` |
| `SheetStackConfig` | User-facing config passed to `createSheetStack()` |
| `SheetStackInstance` | Return type of `createSheetStack()` |
| `Side` | Sheet position: `"left"` | `"right"` | `"bottom"` |
| `SideConfig` | Side as string or responsive object |
| `SpringConfig` | Spring physics: `{ stiffness, damping, mass }` |
| `StackingConfig` | Depth-stacking visual parameters |

---

## License

MIT
