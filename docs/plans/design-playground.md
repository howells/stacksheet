# Design Direction: Playground Demo Page

## Aesthetic Direction
- **Tone:** Minimal + precise. The library is a tool — the page should feel like a well-made instrument, not a marketing brochure.
- **Memorable element:** The live preview frame — a contained viewport on the right side where sheets animate in real-time as you toggle config options.
- **Key UX fix:** Side-by-side layout connects config controls (left) to their visual result (right). Cause and effect are spatially linked.

## Typography
- **Font:** Inter (all weights, via `next/font/google` or CDN)
- **Display:** 2.5rem / 700 / -0.04em (hero title only)
- **Body:** 0.9375rem / 400 / line-height 1.6
- **Labels:** 0.6875rem / 500 / uppercase / 0.05em letter-spacing
- **Mono:** system monospace stack (code blocks, action buttons in sheets)

## Color Palette
| Role | Value | Usage |
|------|-------|-------|
| Background | #fafafa | Page bg — warm off-white |
| Surface | #fff | Preview frame, elevated cards |
| Border | #e8e8e8 | Subtle dividers only where needed |
| Text primary | #111 | Headings, strong text |
| Text secondary | #6b6b6b | Body, descriptions |
| Text tertiary | #999 | Labels, hints, metadata |
| Muted fill | #f2f2f2 | Pill bg, code blocks |
| Active | #111 bg / #fff text | Selected pills |
| Preview bg | #f0f0f0 | "App viewport" inside preview frame |

No accent color. Monochrome page. Sheet badge colors (blue, purple, amber) from the library provide the only color.

## Spacing
- Base unit: 4px
- Left column: ~400px fixed
- Right column: flex fill
- Column gap: 48px
- Section gaps (left column): 32px
- Page padding: 48px horizontal (desktop), 20px (mobile)
- Preview frame: 16px inner padding, 12px border-radius

## Motion
- No page-level animation — all motion comes from the library itself
- Pill/button hover: 150ms background transition
- Code block updates instantly on config change

## Layout

### Desktop (side-by-side)
```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  LEFT COLUMN (400px)          │  RIGHT COLUMN (flex)                 │
│                               │                                      │
│  Title + tagline              │  Preview frame                       │
│  Config controls              │  (StacksheetProvider renders here)   │
│  Code preview                 │  Sheets animate inside this box      │
│  [Open a sheet] button        │                                      │
│                               │  npm install command                 │
│  [Docs]  [GitHub]             │                                      │
│                               │                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile (single column)
- Preview frame hidden (sheets open natively from bottom)
- Hero + controls stack vertically
- Full-width layout

## Preview Frame Spec
- Background: #fff
- Border-radius: 12px
- Shadow: `0 0 0 1px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)`
- Inner viewport: #f0f0f0 background, 8px border-radius
- Min-height: 480px
- Contains its own StacksheetProvider — sheets render inside, not full-page
- Aspect ratio roughly 4:3

## Implementation Notes
- The preview frame needs its own StacksheetProvider instance scoped to a container
- Use CSS `position: relative` + `overflow: hidden` on the preview to contain sheets
- The library already supports custom width/maxWidth — set these relative to the preview frame
- Config changes should remount the instance (already handled via `key={configVersion}`)
- On mobile (< 768px), hide the preview frame entirely and let sheets open in the normal full-viewport way
- Inter font: use `next/font/google` for self-hosting and automatic optimization

## Anti-Patterns to Avoid
- No gradient backgrounds anywhere
- No decorative illustrations or SVGs
- No "feature cards" section — the demo IS the feature showcase
- No testimonials, social proof, or marketing copy beyond the one-line tagline
- No footer (unnecessary for a single-page demo)
- Don't add color to the page chrome — color only comes from the sheets themselves
