# Stacksheet Demo Site

## Vision

A minimal Vite + React demo app modeled after [vaul.emilkowal.ski](https://vaul.emilkowal.ski/) — clean, single-purpose site that showcases the `@howells/stacksheet` component with interactive demos for each major prop/feature.

## Structure

```
site/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app.css              # Global styles (minimal, no Tailwind)
│   ├── components/
│   │   └── DemoSection.tsx   # Reusable demo container (gray preview box)
│   └── demos/
│       ├── DefaultDemo.tsx        # Basic open/close
│       ├── StackingDemo.tsx       # Push multiple sheets, see depth stacking
│       ├── SideDemo.tsx           # left / right / bottom positioning
│       ├── NavigateDemo.tsx       # Smart navigate() behavior
│       └── ConfigDemo.tsx         # Custom spring, stacking, width
```

## Page Layout (Single Page, No Router)

Mirrors vaul's approach — a single scrollable page:

### Hero Section
- Large title: **Stacksheet**
- Subtitle: "Typed, animated sheet stack system for React."
- Two buttons: **"Open Sheet"** (triggers default demo) | **GitHub →**
- Link: npm package

### Demo Sections (scrolls below hero)

Each section has:
- **Heading** (e.g. "Default", "Stacking", "Side Position")
- **Short description** of the feature/prop being demonstrated
- **Gray preview box** with a centered trigger button (matches vaul's Preview tab style)
- No code tabs (keep it simpler than vaul — this is a demo, not docs)

#### 1. Default
- "The simplest setup — open and close a single sheet."
- Button: "Open Sheet" → opens a sheet with placeholder content

#### 2. Stacking
- "Push multiple sheets onto the stack with Apple-style depth animations."
- Button: "Start Stack" → opens a sheet whose content has a "Push Another" button
- Demonstrates the visual depth stacking (scale, offset, opacity)

#### 3. Side Position
- "Sheets can slide from the right, left, or bottom."
- Three buttons in a row: **Right** | **Left** | **Bottom**
- Each creates a separate `createSheetStack` instance with different `side` config

#### 4. Navigate
- "Smart navigation — opens, pushes, or replaces depending on stack state."
- Two buttons: "Navigate to A" | "Navigate to B"
- Shows how navigate() intelligently manages the stack

#### 5. Configuration
- "Customize width, spring physics, and stacking depth effects."
- Button: "Open Custom Sheet"
- Uses custom config: wider width (520px), bouncier spring, exaggerated stacking

## Visual Design

Inspired by vaul's aesthetic:

- **Background:** White (`#fff`) with faint gray grid lines (like vaul's hero)
- **Typography:** System font stack, large bold headings
- **Demo boxes:** Light gray background (`#f4f4f5`), subtle border, rounded corners
- **Buttons:** Pill-shaped with subtle border (like vaul's "Open Drawer" button)
- **Spacing:** Generous vertical spacing between sections
- **Theme:** Light only (no dark mode — keep it minimal)

## Technical Decisions

- **No Tailwind** — plain CSS with CSS custom properties. Keeps dependencies minimal and avoids build complexity.
- **No router** — single page with anchor sections
- **Separate `createSheetStack` per demo** — each demo section creates its own isolated instance so they don't interfere. This also demonstrates the multi-instance pattern.
- **Links to source package** via `file:..` or workspace, so the demo uses the actual built component.

## Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@howells/stacksheet": "workspace:*"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

## Content Inside Sheets

Keep sheet content simple and focused on demonstrating the component behavior:

- **Default sheet:** Title, paragraph of text, a close button
- **Stacking sheets:** Title with depth number, "Push Another" button, "Pop" button, and "Close All" button
- **Side sheets:** Title showing which side, brief content
- **Navigate sheets:** Title showing type (A or B), content explaining what navigate() did
- **Config sheet:** Shows the custom config values being used

## File Count

Total new files: ~12 (vite config, package.json, tsconfig, index.html, main, App, CSS, DemoSection, 5 demo files)

## What This Does NOT Include

- No documentation / API reference (that's a separate concern)
- No code preview tabs (vaul has these but they add complexity — keep this as a pure interactive demo)
- No sidebar navigation (single scrollable page is enough for 5 demos)
- No dark mode
- No SSR
