# Stacksheet

Typed, animated sheet stacking for React.

Stacksheet gives you a provider and a hook for opening, pushing, replacing, and navigating sheet panels from anywhere in your app. It handles the motion, layering, focus management, scroll locking, and mobile/desktop presentation details for you.

```bash
npm install @howells/stacksheet
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

## What it includes

- Direct-component API: `open(Component, props)`
- Optional type registry for large apps: `open("user-profile", "u1", data)`
- Stacked navigation: `open`, `push`, `replace`, `swap`, `navigate`, `pop`, `close`
- Desktop side panels and mobile bottom sheets from one API
- Built-in focus trapping, Escape handling, scroll lock, and Android back gesture support
- Drag-to-dismiss with configurable snap points
- Classic mode with auto header, or composable mode with `Sheet.*` parts

## Quick start

Create a sheet instance once and use it across your app:

```tsx
import { createStacksheet } from "@howells/stacksheet";
import "@howells/stacksheet/styles.css";

export const { StacksheetProvider, useSheet } = createStacksheet();
```

Wrap your app:

```tsx
import { StacksheetProvider } from "./sheets";

export function App() {
  return (
    <StacksheetProvider>
      <YourRoutes />
    </StacksheetProvider>
  );
}
```

Open a sheet from any component:

```tsx
import { useSheet } from "./sheets";

function UserProfile({ userId }: { userId: string }) {
  const { close } = useSheet();

  return (
    <div>
      <h2>User {userId}</h2>
      <button onClick={close}>Done</button>
    </div>
  );
}

function ViewProfileButton() {
  const { open } = useSheet();

  return (
    <button onClick={() => open(UserProfile, { userId: "u_abc" })}>
      View profile
    </button>
  );
}
```

## Typed registry mode

If your app has a fixed set of known sheet types, you can pre-register them for string-keyed, compile-time checked actions:

```tsx
import { createStacksheet } from "@howells/stacksheet";

const { StacksheetProvider, useSheet } = createStacksheet<{
  "user-profile": { userId: string };
  settings: { tab?: string };
}>();

function UserProfile({ userId }: { userId: string }) {
  return <div>User {userId}</div>;
}

function Settings({ tab }: { tab?: string }) {
  return <div>Settings: {tab}</div>;
}

function App() {
  return (
    <StacksheetProvider
      sheets={{
        "user-profile": UserProfile,
        settings: Settings,
      }}
    >
      <YourRoutes />
    </StacksheetProvider>
  );
}

function OpenSettingsButton() {
  const { open } = useSheet();
  return (
    <button onClick={() => open("settings", "settings-root", { tab: "billing" })}>
      Open settings
    </button>
  );
}
```

## Composable layout

Classic mode is the default: Stacksheet renders the panel chrome and header for you.

If you want full control over the panel structure, use `layout="composable"` and build the panel with exported parts:

```tsx
import { Sheet } from "@howells/stacksheet";

function App() {
  return (
    <StacksheetProvider layout="composable">
      <YourRoutes />
    </StacksheetProvider>
  );
}

function SettingsSheet() {
  return (
    <>
      <Sheet.Handle />
      <Sheet.Header>
        <Sheet.Back />
        <Sheet.Title>Settings</Sheet.Title>
        <Sheet.Close />
      </Sheet.Header>
      <Sheet.Body>
        <div className="p-4">Panel content</div>
      </Sheet.Body>
    </>
  );
}
```

For custom controls and panel metadata inside a sheet, use `useSheetPanel()`.

## Accessibility

The default panel is rendered as a dialog with focus management, keyboard navigation, and focus restoration built in.

You can set a global label:

```tsx
createStacksheet({ ariaLabel: "Settings panel" });
```

Or override it per sheet:

```tsx
const { open } = useSheet();

open(UserProfile, { userId: "u_abc" }, { ariaLabel: "User profile for Jane" });
```

In composable mode, use `Sheet.Title` and `Sheet.Description` so the panel gets `aria-labelledby` and `aria-describedby` automatically.

## Documentation

Full docs, interactive playground, and API reference:

**[stacksheet.danielhowells.com](https://stacksheet.danielhowells.com)**

- [Getting Started](https://stacksheet.danielhowells.com/docs)
- [Hooks](https://stacksheet.danielhowells.com/docs/hooks)
- [Configuration](https://stacksheet.danielhowells.com/docs/config)
- [Composable Parts](https://stacksheet.danielhowells.com/docs/composable-parts)
- [Accessibility](https://stacksheet.danielhowells.com/docs/accessibility)
- [Drag to Dismiss](https://stacksheet.danielhowells.com/docs/drag-to-dismiss)
- [Styling](https://stacksheet.danielhowells.com/docs/styling)
- [Type Registry](https://stacksheet.danielhowells.com/docs/type-registry)

## License

MIT
