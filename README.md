# Stacksheet

A typed, animated sheet stack for React. Powered by Zustand and Motion.

```
npm install @howells/stacksheet
```

Peer dependencies: `react >= 18`, `react-dom >= 18`.

## Quick start

```tsx
import { createStacksheet } from "@howells/stacksheet";
import "@howells/stacksheet/styles.css";

const { StacksheetProvider, useSheet } = createStacksheet();

function UserProfile({ userId }: { userId: string }) {
  const { close } = useSheet();
  return (
    <div>
      <h2>User {userId}</h2>
      <button onClick={close}>Done</button>
    </div>
  );
}

function App() {
  return (
    <StacksheetProvider>
      <YourApp />
    </StacksheetProvider>
  );
}
```

Open a sheet from any component:

```tsx
const { open } = useSheet();
open(UserProfile, { userId: "u_abc" });
```

No registration, no type map, no config. The sheet slides in from the right on desktop, bottom on mobile, with focus trapping, scroll lock, drag-to-dismiss, and keyboard navigation built in.

## Documentation

Full docs, interactive playground, and API reference:

**[stacksheet.danielhowells.com](https://stacksheet.danielhowells.com)**

- [Getting Started](https://stacksheet.danielhowells.com/docs)
- [Configuration](https://stacksheet.danielhowells.com/docs/config)
- [Composable Parts](https://stacksheet.danielhowells.com/docs/composable-parts)
- [Drag to Dismiss](https://stacksheet.danielhowells.com/docs/drag-to-dismiss)
- [Styling](https://stacksheet.danielhowells.com/docs/styling)
- [Type Registry](https://stacksheet.danielhowells.com/docs/type-registry)

## License

MIT
