# Design Direction: Playground Demo Page (v2)

## Aesthetic Direction
- **Tone:** Minimal + precise. Clean light surface, tool-like precision. Inspired by Linear's polish but in light mode.
- **Memorable element:** The sheet demo itself — sheets open full-viewport over the light page. The page IS the backdrop; the sheets are the main event.
- **Key UX fix:** Dark code block on the right provides visual weight and contrast. Controls left, code right — cause and effect spatially linked.
- **No chrome:** No header, no footer, no nav. Links to docs/GitHub are inline.

## Typography
- **Font:** Inter (via `next/font/google`)
- **Display:** 3rem / 700 / -0.04em (`text-5xl font-bold tracking-tight`)
- **Body:** 15px / 400 / line-height 1.6 (`text-[15px] text-zinc-500`)
- **Labels:** 11px / 500 / uppercase / 0.05em tracking (`text-[11px] font-medium uppercase tracking-widest text-zinc-400`)
- **Mono:** system monospace stack (`font-mono text-sm`)

## Color Palette

| Role | Tailwind Class | Hex | Usage |
|------|---------------|-----|-------|
| Background | `bg-zinc-50` | #fafafa | Page bg |
| Surface | `bg-white` | #ffffff | Elevated areas |
| Code block bg | `bg-zinc-900` | #18181b | Dark inverted code block — focal point |
| Code text | `text-zinc-300` | #d4d4d8 | Light text on dark code block |
| Text primary | `text-zinc-950` | #09090b | Headings, strong text |
| Text secondary | `text-zinc-500` | #71717a | Body, descriptions, tagline |
| Text tertiary | `text-zinc-400` | #a1a1aa | Labels, hints, metadata |
| Active pill | `bg-zinc-950 text-zinc-50` | #09090b / #fafafa | Selected state (inverted) |
| Inactive pill | shadow border | `rgba(0,0,0,0.08)` | Subtle shadow-based edge |
| Pill hover | `bg-zinc-100` | #f4f4f5 | Hover state |

No accent color. Monochrome page. Sheet badge colors (blue, purple, amber) from the library provide the only color.

## Spacing
- Base unit: 4px
- Left column: 400px fixed
- Right column: flex fill
- Column gap: 64px (`gap-16`)
- Control group gaps: 24px (`gap-6`)
- Page padding: 48px desktop (`p-12`), 24px mobile (`p-6`)
- Code block padding: 20px (`p-5`)
- Section gaps: 32px between control groups (`space-y-8`)

## Motion
- No page-level animation — all motion comes from the library itself
- Pill/button hover: 150ms background transition (`transition-colors duration-150`)
- CTA active: `active:scale-[0.97]` with `transition-transform`
- Code block updates instantly on config change

## Layout

### Desktop (side-by-side, vertically centered)
```
┌────────────────────────────────────────────────────────────────────┐
│                          [zinc-50 bg]                              │
│                          min-h-dvh, items-center                   │
│                                                                    │
│  ┌─── LEFT (sticky) ──────────┐  ┌─── RIGHT ──────────────────┐  │
│  │                             │  │                             │  │
│  │  Stacksheet                 │  │  ┌─ DARK code block ─────┐ │  │
│  │  text-5xl font-bold         │  │  │ bg-zinc-900           │ │  │
│  │  tracking-tight             │  │  │ createStacksheet({    │ │  │
│  │                             │  │  │   side: "left"        │ │  │
│  │  A typed, animated sheet    │  │  │ })                    │ │  │
│  │  stack for React.           │  │  └────────────────────────┘ │  │
│  │  text-[15px] text-zinc-500  │  │                             │  │
│  │                             │  │  npm i @howells/stacksheet  │  │
│  │  POSITION                   │  │  text-zinc-400 font-mono   │  │
│  │  (left) [RIGHT] (bottom)    │  │                             │  │
│  │                             │  │                             │  │
│  │  SPRING                     │  │                             │  │
│  │  [STIFF] (snappy) (natural) │  │                             │  │
│  │  (subtle) (soft)            │  │                             │  │
│  │                             │  │                             │  │
│  │  OPTIONS                    │  │                             │  │
│  │  [OVERLAY] [BACKDROP CLOSE] │  │                             │  │
│  │  [ESCAPE CLOSE]             │  │                             │  │
│  │                             │  │                             │  │
│  │  ╔══════════════════╗       │  │                             │  │
│  │  ║  Open a sheet    ║       │  │                             │  │
│  │  ╚══════════════════╝       │  │                             │  │
│  │  bg-zinc-950 text-zinc-50   │  │                             │  │
│  │  rounded-full               │  │                             │  │
│  │                             │  │                             │  │
│  │  [Documentation]  GitHub    │  │                             │  │
│  │                             │  │                             │  │
│  └─────────────────────────────┘  └─────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px, single column)
```
┌──────────────────────┐
│     [zinc-50 bg]     │
│                      │
│  Stacksheet          │
│  A typed, animated   │
│  sheet stack.        │
│                      │
│  POSITION            │
│  (l) [R] (b)         │
│                      │
│  SPRING              │
│  [STIFF] (snappy)    │
│  (natural) ...       │
│                      │
│  OPTIONS             │
│  [OVERLAY] [BKDP]   │
│  [ESCAPE]            │
│                      │
│  ╔════════════════╗  │
│  ║ Open a sheet   ║  │
│  ╚════════════════╝  │
│                      │
│  ┌─ DARK code ────┐ │
│  │createStack...() │ │
│  └─────────────────┘ │
│                      │
│  [Docs]  GitHub      │
│                      │
└──────────────────────┘
```

## Implementation Notes
- **MUST use Tailwind CSS 4 utility classes** — no custom CSS classes for the playground
- Remove all `.pg-*` CSS from global.css (keep Fumadocs theme overrides + docs demo styles)
- StacksheetProvider wraps the entire page — sheets open full-viewport
- Config changes remount via `key={configVersion}` (existing pattern)
- Inter font: use `next/font/google` (existing)
- Dark code block: `bg-zinc-900 rounded-xl p-5` with subtle shadow
- Pills: shadow-based borders via `shadow-[0_0_0_1px_rgba(0,0,0,0.08)]`
- Active pills: `bg-zinc-950 text-zinc-50` (inverted)
- CTA button: `bg-zinc-950 text-zinc-50 rounded-full` with `active:scale-[0.97]`
- Vertically center both columns: `min-h-dvh items-center`
- Left column sticky: `sticky top-12`
- All sheet panel content styles must also use Tailwind (pg-sheet-* → Tailwind classes)

## Anti-Patterns to Avoid
- No gradient backgrounds anywhere
- No decorative illustrations or SVGs
- No "feature cards" section — the demo IS the feature showcase
- No testimonials, social proof, or marketing copy beyond the one-line tagline
- No footer, no header, no nav bar
- Don't add color to the page chrome — color only comes from the sheets themselves
- No custom CSS classes — Tailwind only
- No purple-to-blue gradients (AI slop)
- No rounded corners on everything — use rounded-xl for code block, rounded-full for pills/buttons
