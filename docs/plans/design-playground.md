# Design Direction: Playground Demo Page (v3)

## Aesthetic Direction
- **Mode:** App UI
- **Tone:** Minimal — clean, precise, restrained. Every element earns its place.
- **Density:** Balanced — comfortable density, clear hierarchy. Primary controls visible, secondary collapsed.
- **Memorable element:** Live preview feel — the sheet IS the demo. Opening it feels like using the real product, not watching a sandbox. The dark-to-light code block contrast anchors the visual weight.
- **Constraints:** Fresh start. Own visual identity, distinct from Fumadocs docs pages.
- **Inspiration:** Vaul playground — extreme simplicity, component IS the experience.
- **UI chrome:** None. Full-bleed immersive. Subtle "← docs" link only.

## Typography
- **Display/Body:** Plus Jakarta Sans (via `next/font/google`) — geometric, modern, distinctive double-storey "a". NOT Inter/Geist like every Next.js project. Passes the swap test.
- **Mono:** JetBrains Mono (via `next/font/google`) — code preview, property labels
- **Title:** 40px / 600 / -0.02em (`text-[40px] font-semibold tracking-tight`)
- **Body:** 15px / 400 / line-height 1.6 (`text-[15px] text-zinc-500`)
- **Labels:** 12px / 500 / uppercase / 0.05em tracking (`text-xs font-medium uppercase tracking-widest text-zinc-400`)
- **Code:** 14px JetBrains Mono on dark block (`text-sm`)

## Color Palette

| Role | Tailwind Class | Hex | Usage |
|------|---------------|-----|-------|
| Background | custom | `#fafaf9` | Page bg — barely warm, not clinical |
| Surface | `bg-white` | `#ffffff` | Expanded sections, elevated areas |
| Code block bg | custom | `#1c1c1e` | Dark code block — warm, not dead gray |
| Code text | `text-zinc-300` | `#d4d4d8` | Light text on dark code block |
| Text primary | `text-zinc-950` | `#09090b` | Headings, values |
| Text secondary | `text-zinc-500` | `#71717a` | Body, descriptions, tagline |
| Text muted | `text-zinc-400` | `#a1a1aa` | Section headers, hints, metadata |
| Border | `border-zinc-200` | `#e4e4e7` | Dividers, inactive pill borders |
| Hover | `bg-zinc-100` | `#f4f4f5` | Hover states |
| Active pill | `bg-zinc-950 text-zinc-50` | `#09090b` / `#fafafa` | Selected state (inverted) |
| Inactive pill | shadow border | `rgba(0,0,0,0.08)` | Subtle shadow-based ring |
| CTA bg | `bg-zinc-950` | `#09090b` | Primary button — darkest element on page |
| CTA text | `text-zinc-50` | `#fafafa` | Button text |

No accent color. Pure monochrome. Sheet badge colors (blue, violet, amber) provide the only color — and only inside sheets.

## Spacing
- Base unit: 4px
- Left column: 420px fixed
- Right column: flex fill
- Column gap: 80px (`gap-20`)
- Page padding: 64px desktop (`p-16`), 32px mobile (`p-8`)
- Control group gaps: 24px between sections
- Dividers: 1px zinc-200 with 12px vertical margin
- Code block padding: 24px (`p-6`)

## Progressive Disclosure

**Always visible (primary controls):**
- Position — Desktop (pill group)
- Position — Mobile (pill group)
- Spring (pill group)
- Behavior (toggle pills)

**Collapsed by default (secondary controls):**
- Layout (width, maxWidth, breakpoint, zIndex) — click "▸ Layout" to expand
- Drag (closeThreshold, velocityThreshold)
- Stacking (maxDepth, scaleStep, offsetStep, opacityStep, radius, renderThreshold)
- Advanced (scaleBackgroundAmount, ariaLabel)

Collapsible sections use 200ms ease-out height transition. Chevron rotates on expand.

## Motion
- No page-level animation — all motion comes from the library itself
- Collapsible sections: 200ms ease-out height + opacity
- Pill/button hover: 150ms background transition
- CTA active: `active:scale-[0.97]`
- Code block updates instantly on config change

## Layout

### Desktop (1440px)
```
┌──────────────────────────────────────────────────────────────────────┐
│  ← docs                                              #fafaf9 bg      │
│                                                                      │
│  ┌─ Left (420px) ──────────┐   ┌─ Right (fluid, sticky) ──────────┐ │
│  │                         │   │                                    │ │
│  │  stacksheet             │   │  ┌─ Code ──────────────────────┐  │ │
│  │  40px semibold          │   │  │  #1c1c1e bg                  │  │ │
│  │                         │   │  │                              │  │ │
│  │  A typed, animated      │   │  │  createStacksheet({          │  │ │
│  │  sheet stack for React  │   │  │    side: "right",            │  │ │
│  │                         │   │  │    spring: "stiff",          │  │ │
│  │  ┌──────────────────┐   │   │  │  })                         │  │ │
│  │  │   Open a sheet →  │   │   │  │                              │  │ │
│  │  └──────────────────┘   │   │  └──────────────────────────────┘  │ │
│  │  [Docs]  GitHub         │   │                                    │ │
│  │                         │   │  npm i @howells/stacksheet         │ │
│  │  ─────────────────────  │   │                                    │ │
│  │                         │   │                                    │ │
│  │  POSITION — DESKTOP     │   │                                    │ │
│  │  (○ left) (● right) (○ btm) │                                    │ │
│  │                         │   │                                    │ │
│  │  POSITION — MOBILE      │   │                                    │ │
│  │  (○ left) (○ right) (● btm) │                                    │ │
│  │                         │   │                                    │ │
│  │  ─────────────────────  │   │                                    │ │
│  │                         │   │                                    │ │
│  │  SPRING                 │   │                                    │ │
│  │  (● stiff) (○ snappy)   │   │                                    │ │
│  │  (○ natural) (○ subtle) │   │                                    │ │
│  │  (○ soft)               │   │                                    │ │
│  │                         │   │                                    │ │
│  │  ─────────────────────  │   │                                    │ │
│  │                         │   │                                    │ │
│  │  BEHAVIOR               │   │                                    │ │
│  │  (● modal) (● overlay)  │   │                                    │ │
│  │  (● backdrop) (● esc)   │   │                                    │ │
│  │  (● scroll) (● drag)    │   │                                    │ │
│  │  (● dismiss) (○ scale)  │   │                                    │ │
│  │                         │   │                                    │ │
│  │  ─────────────────────  │   │                                    │ │
│  │                         │   │                                    │ │
│  │  ▸ Layout               │   │                                    │ │
│  │  ▸ Drag                 │   │                                    │ │
│  │  ▸ Stacking             │   │                                    │ │
│  │  ▸ Advanced             │   │                                    │ │
│  │                         │   │                                    │ │
│  └─────────────────────────┘   └────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile (375px)
```
┌─────────────────────┐
│  ← docs             │
│                      │
│  stacksheet          │
│  A typed, animated   │
│  sheet stack for     │
│  React               │
│                      │
│  ┌────────────────┐  │
│  │ Open a sheet → │  │
│  └────────────────┘  │
│  [Docs]  GitHub      │
│                      │
│  ─────────────────── │
│  POSITION — DESKTOP  │
│  (○ L) (● R) (○ B)  │
│  POSITION — MOBILE   │
│  (○ L) (○ R) (● B)  │
│  ─────────────────── │
│  SPRING              │
│  (● stiff) (○ snappy)│
│  (○ natural) ...     │
│  ─────────────────── │
│  BEHAVIOR            │
│  (● modal) (● over)  │
│  (● backdrop) ...    │
│  ─────────────────── │
│  ▸ Layout            │
│  ▸ Drag              │
│  ▸ Stacking          │
│  ▸ Advanced          │
│  ─────────────────── │
│  ┌─ Code ──────────┐│
│  │ createStack...   ││
│  └──────────────────┘│
│  npm i @howells/...  │
│                      │
└──────────────────────┘
```

## Change Spec (from current → v3)

### Typography
| Element | Before | After | Rule Reference |
|---------|--------|-------|----------------|
| All text | Inter | Plus Jakarta Sans | app-ui.md: swap test — "Same font as every SaaS dashboard → defaulted" |
| Code blocks | System mono | JetBrains Mono | typography.md: monospace for code alignment |
| Title | 48px bold Inter | 40px semibold Plus Jakarta Sans | app-ui.md: display-size restraint in app UI |
| Section labels | 11px uppercase | 12px uppercase tracking-widest | typography.md: label differentiation |

### Colors
| Element | Before | After | Rule Reference |
|---------|--------|-------|----------------|
| Background | `#fafafa` (cool zinc-50) | `#fafaf9` (barely warm) | colors.md: saturated greys over dead neutral |
| Code block | `#18181b` (zinc-900) | `#1c1c1e` (warm dark) | design.md: warmth over sterility |

### Layout
| Element | Before | After | Rule Reference |
|---------|--------|-------|----------------|
| Secondary controls | All 25 inputs visible at once | 4 collapsed sections (Layout, Drag, Stacking, Advanced) | app-ui.md: density matching. design-philosophy.md: progressive disclosure |
| Grid gap | 32/64px (`gap-8 md:gap-16`) | 48/80px (`gap-12 md:gap-20`) | spacing.md: generous whitespace |
| Page padding | 24/48px (`p-6 md:p-12`) | 32/64px (`p-8 md:p-16`) | spacing.md: section spacing |
| Max width | 1024px (`max-w-5xl`) | 1152px (`max-w-6xl`) | layout.md: use available width |

### Interaction
| Element | Before | After | Rule Reference |
|---------|--------|-------|----------------|
| Collapsible sections | N/A | 200ms ease-out height + chevron rotation | animation.md: functional motion only |

## Implementation Notes
- **Font loading:** `next/font/google` for Plus Jakarta Sans (weights: 400, 500, 600) and JetBrains Mono (400)
- **Background color:** Use inline style or Tailwind arbitrary `bg-[#fafaf9]` since it's not a standard Tailwind shade
- **Collapsible sections:** Use `useState<Set<string>>` for open sections. CSS `overflow: hidden` + `max-height` transition OR `grid-template-rows: 0fr → 1fr` trick for smooth collapse
- **StacksheetProvider wraps the entire page** — sheets open full-viewport (existing pattern)
- **Config changes remount** via `key={configVersion}` (existing pattern)
- Keep all existing sheet content components (ContactSheet, SettingsSheet, AlertSheet)
- Keep all existing playground infrastructure (PlaygroundContext, DemoInstance, etc.)

## Anti-Patterns to Avoid
- No gradient backgrounds anywhere
- No decorative illustrations or SVGs
- No "feature cards" section — the demo IS the feature showcase
- No testimonials, social proof, or marketing copy beyond the one-line tagline
- No footer, no header, no nav bar
- Don't add color to the page chrome — color only comes from the sheets
- No purple-to-blue gradients (AI slop)
- Don't use rounded corners on everything — use rounded-xl for code block, rounded-full for pills/buttons, nothing else
- Don't animate things that don't need animation (pills, code updates)
- Don't use Inter or Geist — those are defaulted choices
