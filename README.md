# Stacksheet

Typed, animated sheet stacking for React. Powered by Zustand and Motion.

Most sheet libraries are component-scoped — you render `<Sheet open={open}>` and manage state locally. Stacksheet gives you a `useSheet()` hook that can open, push, and navigate sheets from any component. Need to trigger a sheet outside React? The underlying store works in event handlers, API callbacks, and keyboard shortcuts too.

```
npm install @howells/stacksheet
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

---

## Quick start

```tsx
import { createStacksheet } from "@howells/stacksheet";

// 1. Create an instance
const { StacksheetProvider, useSheet } = createStacksheet();

// 2. Write a sheet — it's just a React component
function UserProfile({ userId }: { userId: string }) {
  const { close } = useSheet();
  return (
    <div>
      <h2>User {userId}</h2>
      <button onClick={close}>Done</button>
    </div>
  );
}

// 3. Wrap your app
function App() {
  return (
    <StacksheetProvider>
      <YourApp />
    </StacksheetProvider>
  );
}
```

Open a sheet from any component — pass the component and its props:

```tsx
function SomeButton() {
  const { open } = useSheet();
  return (
    <button onClick={() => open(UserProfile, { userId: "u_abc" })}>
      View Profile
    </button>
  );
}
```

That's it. No registration, no type map, no config object. The sheet slides in from the right on desktop, from the bottom on mobile, with focus trapping, scroll lock, and keyboard navigation built in.

---

## Actions

Use `useSheet()` inside any component to get the full set of actions:

```tsx
function MyComponent() {
  const { open, push, replace, swap, navigate, setData, remove, pop, close } = useSheet();
}
```

#### `open(Component, data)`

Replace the stack with a single sheet and open it. Any existing sheets are removed.

```tsx
const { open } = useSheet();
open(UserProfile, { userId: "u_abc" });

// With explicit id (for later setData/remove)
open(UserProfile, "user-1", { userId: "u_abc" });
```

#### `push(Component, data)`

Push a new sheet onto the stack. The current top sheet scales down with a depth effect. If the stack is at `maxDepth`, replaces the top instead.

```tsx
const { push } = useSheet();
push(SettingsSheet, { tab: "billing" });

// With explicit id
push(SettingsSheet, "settings-1", { tab: "billing" });
```

#### `replace(Component, data)`

Swap the top sheet without changing stack depth. If the stack is empty, opens a new sheet.

```tsx
const { replace } = useSheet();
replace(UserProfile, { userId: "u_xyz" });
```

#### `swap(Component, data)`

Swap the top panel's content in place — no animation. The panel frame stays put, only the inner component and props change. Useful for transitions like Contact → Settings within the same panel position.

```tsx
const { swap } = useSheet();
swap(SettingsSheet, { tab: "general" });
```

If the stack is empty, `swap` is a no-op.

#### `navigate(Component, data)`

Smart routing. Looks at the current stack and decides:

| Stack state | Same component on top? | Result |
|---|---|---|
| Empty | — | `open()` |
| Non-empty | Yes | `replace()` |
| Non-empty | No | `push()` |

```tsx
const { navigate } = useSheet();
navigate(SettingsSheet, { tab: "general" });
```

#### `setData(Component, id, data)`

Update the data on a sheet that's already open, by id. The sheet stays in place with no animation — only the content component re-renders with new props.

```tsx
const { setData } = useSheet();
setData(UserProfile, "user-1", { userId: "u_new" });
```

#### `remove(id)`

Remove a specific sheet from anywhere in the stack by its id. If it was the last sheet, closes the stack.

```tsx
const { remove } = useSheet();
remove("notification-1");
```

#### `pop()`

Remove the top sheet. The sheet below expands back with a spring animation. If it was the last sheet, closes the stack.

```tsx
const { pop } = useSheet();
pop();
```

#### `close()`

Clear the entire stack and close. All sheets exit simultaneously.

```tsx
const { close } = useSheet();
close();
```

---

## Explicit ids

By default, Stacksheet auto-generates an id for each sheet. Pass an id as the second argument if you need to reference it later with `setData` or `remove`:

```tsx
open(ProfileSheet, "profile-1", { userId: "u_abc" });

// Later...
setData(ProfileSheet, "profile-1", { userId: "u_xyz" });
remove("profile-1");
```

---

## Configuration

Pass config to `createStacksheet()`:

```tsx
const { StacksheetProvider, useSheet } = createStacksheet({
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
| `spring` | `SpringPreset \| SpringConfig` | — | Spring animation parameters — preset name or custom config |
| `zIndex` | `number` | 100 | Base z-index. |

### Side

Controls which edge the sheet slides from. A string applies to all viewports. An object lets you set different sides for desktop and mobile (switches at `breakpoint`):

```tsx
// Always right
createStacksheet({ side: "right" });

// Right on desktop, bottom sheet on mobile (default)
createStacksheet({ side: { desktop: "right", mobile: "bottom" } });

// Left sidebar
createStacksheet({ side: "left" });
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
createStacksheet({
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
| `"snappy"` | 400 | 28 | 0.8 | Quick, responsive for interactions |
| **`"stiff"`** | 400 | 40 | 1 | **Default.** Very quick, controlled. Panels, drawers |

```tsx
// Preset
createStacksheet({ spring: "snappy" });

// Custom
createStacksheet({ spring: { stiffness: 300, damping: 25, mass: 0.9 } });
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
<StacksheetProvider
  classNames={{
    backdrop: "my-backdrop",
    panel: "my-panel",
    header: "my-header",
  }}
>
```

**`StacksheetClassNames`:**

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
<StacksheetProvider
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

### Using the store outside React

Need to open a sheet from an event handler, API callback, or keyboard shortcut? Use the `store` directly:

```tsx
import { createStacksheet } from "@howells/stacksheet";

const { StacksheetProvider, useSheet, store } = createStacksheet();

// Call actions from anywhere — no hooks, no context
store.getState().open(ErrorSheet, { message: "Something broke" });

// Read current state
const { stack, isOpen } = store.getState();

// Subscribe to changes
const unsub = store.subscribe((state) => {
  console.log("Stack changed:", state.stack.length);
});
```

```tsx
// api.ts — no React, no hooks, no context
import { store } from "./sheets";
import { ErrorSheet } from "./error-sheet";

export async function deleteItem(id: string) {
  try {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  } catch (err) {
    store.getState().open(ErrorSheet, { message: "Failed to delete item" });
  }
}
```

### Multiple instances

Each `createStacksheet()` call creates a fully isolated instance with its own store, config, and React context. Use this for distinct UI concerns:

```tsx
const {
  StacksheetProvider: MainProvider,
  useSheet: useMainSheet,
} = createStacksheet({ side: "right" });

const {
  StacksheetProvider: SettingsProvider,
  useSheet: useSettingsSheet,
} = createStacksheet({ side: "left", width: 360 });

function App() {
  return (
    <MainProvider>
      <SettingsProvider>
        <YourApp />
      </SettingsProvider>
    </MainProvider>
  );
}
```

They render and animate independently.

### Type registry

For larger apps where you want compile-time type checking on action calls, you can pre-register sheet types in a type map:

```tsx
const { StacksheetProvider, useSheet } = createStacksheet<{
  "user-profile": { userId: string };
  "settings": { tab?: string };
}>();

// TypeScript enforces correct data shapes
const { open } = useSheet();
open("user-profile", "u1", { userId: "abc" }); // OK
open("user-profile", "u1", {}); // Type error: missing userId
open("unknown", "x", {}); // Type error: not a key
```

When using the type registry, pass the component map to the provider:

```tsx
<StacksheetProvider
  sheets={{
    "user-profile": UserProfile,
    "settings": Settings,
  }}
>
  <App />
</StacksheetProvider>
```

The `sheets` prop is fully typed — TypeScript enforces that every key in your type map has a matching component with the correct props.

Type-registry sheets and component-direct sheets can coexist in the same stack.

### `useStacksheetState()`

Hook that returns the reactive sheet state. Re-renders when the stack or open state changes.

```tsx
function SheetIndicator() {
  const { stack, isOpen } = useStacksheetState();
  return <span>{isOpen ? `${stack.length} sheets open` : "closed"}</span>;
}
```

**Returns: `StacksheetSnapshot<TMap>`**

| Prop | Type | Description |
|---|---|---|
| `stack` | `SheetItem[]` | Current sheet stack, ordered bottom to top |
| `isOpen` | `boolean` | Whether any sheets are currently visible |

### Anatomy

When rendered, `StacksheetProvider` produces the following DOM structure:

```
<StacksheetProvider>
  {children}                         <- your app content

  <!-- Backdrop (AnimatePresence) -->
  <motion.div />                     <- overlay, fades in/out

  <!-- Clip container (always rendered) -->
  <div style="fixed; overflow:hidden">
    <AnimatePresence>
      <!-- One per stack item, bottom to top -->
      <motion.div>                   <- panel (slides from side)
        <DefaultHeader />            <- or renderHeader()
        <div>                        <- scrollable content area
          <ContentComponent />       <- your component
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
</StacksheetProvider>
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
  StacksheetClassNames,
  SheetContentComponent,
  SheetItem,
  StacksheetProviderProps,
  StacksheetSnapshot,
  StacksheetConfig,
  StacksheetInstance,
  Side,
  SideConfig,
  SpringConfig,
  StackingConfig,
} from "@howells/stacksheet";
```

| Type | Description |
|---|---|
| `SpringPreset` | Spring preset name (union of preset keys) |
| `ContentMap` | Map of sheet type key to content component |
| `HeaderRenderProps` | Props passed to custom `renderHeader` function |
| `ResolvedConfig` | Fully resolved config (all fields required) |
| `ResponsiveSide` | Per-viewport side configuration `{ desktop, mobile }` |
| `SheetActions` | All sheet actions (open, push, pop, close, etc.) |
| `StacksheetClassNames` | CSS class overrides for backdrop, panel, header |
| `SheetContentComponent` | Component type rendered inside a sheet panel |
| `SheetItem` | Single item in the sheet stack `{ id, type, data }` |
| `StacksheetProviderProps` | Props for the `<StacksheetProvider>` component |
| `StacksheetSnapshot` | Reactive state: `{ stack, isOpen }` |
| `StacksheetConfig` | User-facing config passed to `createStacksheet()` |
| `StacksheetInstance` | Return type of `createStacksheet()` |
| `Side` | Sheet position: `"left"` \| `"right"` \| `"bottom"` |
| `SideConfig` | Side as string or responsive object |
| `SpringConfig` | Spring physics: `{ stiffness, damping, mass }` |
| `StackingConfig` | Depth-stacking visual parameters |

---

## License

MIT
