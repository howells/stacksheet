# Audit Report: full codebase

**Date:** 2026-04-04
**Reviewers:** security-engineer, performance-engineer, architecture-engineer, organization-engineer, lee-nextjs-engineer, daniel-product-engineer
**Scope:** full codebase
**Project Type:** pnpm workspace with a published TypeScript library in `src/` and a Next.js docs app in `site/`
**Project Stage:** development

> Severity ratings have been calibrated for the **development** stage.

## Executive Summary

This audit was run after a full dependency refresh (`pnpm up -r --latest`) and a TypeScript 6 compatibility follow-up in the root and docs-app `tsconfig.json` files. The refreshed workspace is currently green on `pnpm build`, `pnpm typecheck`, `pnpm test`, and `pnpm --filter stacksheet-docs build`, with no high/critical `pnpm audit` findings.

The main risks are not security-related. The strongest issues are user-facing correctness gaps in the sheet runtime and resilience gaps in the docs app. The rest of the findings are low-severity structural and performance concerns concentrated around the docs site's hydration strategy, stale package tooling, and API shape drift between the library and its examples.

- **Critical:** 0 issues
- **High:** 0 issues
- **Medium:** 2 issues
- **Low:** 11 issues

## Must Fix

None.

## Should Consider

> Real user-facing issues in the current development stage.

### Snap Points Go Stale After Viewport Height Changes
**File:** `src/renderer.tsx:781`
**Flagged by:** daniel-product-engineer
**Description:** `snapHeights` are resolved from a one-time `window.innerHeight` read and are only recomputed when `side` or `config.snapPoints` change. Orientation changes and mobile browser chrome height changes can therefore leave a bottom sheet snapping to visibly wrong positions until the renderer remounts.
**Recommendation:** Resolve snap points from reactive viewport height state instead of a static `window.innerHeight` read. A shared viewport hook or `resize` / `visualViewport` listener would keep positions correct while a sheet is open.

### Docs Segment Has No App Router Error Boundary
**File:** `site/app/docs/[[...slug]]/page.tsx:13`
**Flagged by:** lee-nextjs-engineer
**Description:** The docs route renders generated MDX through Fumadocs, but `site/app` has no `error.tsx` or `global-error.tsx`. A bad MDX file or runtime error in docs rendering currently takes down the whole segment instead of failing inside a contained boundary.
**Recommendation:** Add `site/app/docs/error.tsx` at minimum, and consider `site/app/global-error.tsx` for whole-app failures.

## Worth Noting

> Useful improvements that would tighten the product and codebase.

### Docs Infrastructure Is Mounted Above the Entire App
**File:** `site/app/layout.tsx:1`
**Flagged by:** performance-engineer, lee-nextjs-engineer
**Description:** `RootProvider` from Fumadocs wraps the entire app tree at the root layout, so non-doc routes also pay for docs/search/theme client infrastructure. This aligns with the large first-load JS sizes observed during the production build output.
**Recommendation:** Move docs-only providers into a docs route layout or route group so the homepage keeps a narrower server-first boundary.

### Homepage Eagerly Loads the Full Playground Bundle
**File:** `site/app/page.tsx:2`
**Flagged by:** performance-engineer, lee-nextjs-engineer, organization-engineer
**Description:** The homepage imports `PlaygroundDemo` directly, making the landing page pay for a large client component and its supporting demo runtime up front.
**Recommendation:** Keep the page shell server-first and lazy-load or defer the interactive playground, or move it onto a dedicated route.

### Docs Pages Eagerly Bundle Interactive Demos
**File:** `site/content/docs/index.mdx:6`
**Flagged by:** performance-engineer
**Description:** The docs route statically imports interactive demo components from MDX. That keeps mostly textual docs pages tied to a large client bundle.
**Recommendation:** Defer heavier demos until visible or load them lazily so the docs route stays primarily static.

### Drag Updates Currently Flow Through React State
**File:** `src/use-drag.ts:312`
**Flagged by:** performance-engineer
**Description:** Pointer-move drag updates drive React reconciliation through panel state on the hot path. On heavier sheet content this can make drag smoothness depend on render cost instead of compositor transforms.
**Recommendation:** Keep live drag offset out of React state, or isolate drag-sensitive chrome from the rest of the sheet content.

### `Sheet.Close` Behaves Like `Sheet.Back` in Nested Composable Sheets
**File:** `src/parts.tsx:220`
**Flagged by:** daniel-product-engineer
**Description:** In nested composable sheets, `Sheet.Close` calls `back` instead of `close`, which conflicts with its label and with the docs contract in `site/content/docs/composable-parts.mdx`.
**Recommendation:** Keep `Sheet.Close` wired to `close()` and reserve one-level navigation for `Sheet.Back`.

### Playground Snippets Teach a Non-Existent `useSheet().actions` API
**File:** `site/components/demos/playground-demo.tsx:1483`
**Flagged by:** daniel-product-engineer
**Description:** The playground examples destructure `{ actions } = useSheet()`, but `useSheet()` actually returns the action object directly. Copy-pasting the sample code would fail.
**Recommendation:** Update snippets to `const actions = useSheet()` or direct destructuring so they match the real hook contract.

## Low Priority / Suggestions

> Structural cleanup and API refinement worth tracking.

### Stale `docs` Script Points to a Deleted Generator
**File:** `package.json:43`
**Flagged by:** organization-engineer
**Description:** `pnpm run docs` currently fails because `scripts/generate-docs.ts` no longer exists.
**Recommendation:** Restore the generator or remove the script and any related tool assumptions.

### Docs App Carries Verified Unused Dependencies
**File:** `site/package.json:17`
**Flagged by:** organization-engineer
**Description:** `@radix-ui/react-toggle-group` and `react-remove-scroll` are declared in the docs app but are not imported by the app code.
**Recommendation:** Remove the unused dependencies and rerun `pnpm knip`.

### `renderHeader` Multiplexes Too Many Modes Behind One Prop
**File:** `src/types.ts:315`
**Flagged by:** architecture-engineer
**Description:** `renderHeader` currently doubles as a header override, a layout mode switch, and an accessibility behavior toggle when set to `false`.
**Recommendation:** Split this into explicit configuration concerns, such as a layout mode plus a separate header render callback.

### Internal `__ariaLabel` Metadata Shares the Consumer Data Namespace
**File:** `src/renderer.tsx:529`
**Flagged by:** architecture-engineer
**Description:** Accessibility metadata is being read from `item.data`, which blurs the boundary between user payloads and renderer internals.
**Recommendation:** Move per-sheet metadata out of the typed data payload or add a separate options channel.

### `SheetRenderer` Has Become a Large Multi-Concern Integration Hub
**File:** `src/renderer.tsx:760`
**Flagged by:** architecture-engineer
**Description:** The renderer owns snap logic, dismissal, focus restoration, keyboard and `CloseWatcher` handling, scaling, and orchestration in one module.
**Recommendation:** Split lifecycle, focus, and animation responsibilities into smaller modules before adding more features.

### `PlaygroundDemo` Is a 1,800+ Line Client-Side Monolith
**File:** `site/components/demos/playground-demo.tsx:1`
**Flagged by:** organization-engineer
**Description:** The homepage demo mixes model setup, controls, theme handling, snippets, and page composition in one file.
**Recommendation:** Break it into smaller concern-based modules so demo changes are easier to reason about.

---

## Task Clusters

> Findings grouped by what you would actually tackle together.

### 1. Runtime Interaction Correctness

**Why:** These issues can produce visible runtime bugs or incorrect example behavior in the public API surface.

| # | Severity | File | Issue | Flagged by |
|---|----------|------|-------|------------|
| 1 | Medium | `src/renderer.tsx:781` | Snap points do not recompute on viewport height changes | daniel-product-engineer |
| 2 | Low | `src/parts.tsx:220` | `Sheet.Close` acts like `Sheet.Back` for nested sheets | daniel-product-engineer |
| 3 | Low | `site/components/demos/playground-demo.tsx:1483` | Playground snippets document a nonexistent `useSheet().actions` shape | daniel-product-engineer |

**Suggested approach:** Fix the runtime semantics first, then align the examples and docs to the corrected behavior. This is a good candidate for a focused follow-up patch because all three items touch user expectations.

### 2. Docs App Resilience And Hydration

**Why:** The docs site is carrying more client infrastructure than it needs and has no contained failure boundary around the MDX route.

| # | Severity | File | Issue | Flagged by |
|---|----------|------|-------|------------|
| 1 | Medium | `site/app/docs/[[...slug]]/page.tsx:13` | No route-level error boundary for docs rendering | lee-nextjs-engineer |
| 2 | Low | `site/app/layout.tsx:1` | Fumadocs provider is mounted above the whole app | performance-engineer, lee-nextjs-engineer |
| 3 | Low | `site/app/page.tsx:2` | Homepage eagerly loads the full playground bundle | performance-engineer, lee-nextjs-engineer, organization-engineer |
| 4 | Low | `site/content/docs/index.mdx:6` | Docs pages eagerly bundle interactive demos | performance-engineer |

**Suggested approach:** Add the error boundary first, then split docs-only providers and defer the heavier playground/demo client code. That gives both a reliability win and a clear path to lower first-load JS.

### 3. Package And Tooling Hygiene

**Why:** These are small but real maintenance traps in the workspace manifest layer.

| # | Severity | File | Issue | Flagged by |
|---|----------|------|-------|------------|
| 1 | Low | `package.json:43` | Broken `docs` script points to a missing file | organization-engineer |
| 2 | Low | `site/package.json:17` | Docs app declares verified unused dependencies | organization-engineer |

**Suggested approach:** Clean these up together, then rerun `pnpm knip` so the workspace manifest state matches reality after the dependency upgrade.

### 4. Public API And Boundary Clarity

**Why:** These findings are low severity today, but they are the kinds of contract mismatches that get harder to untangle once more consumers depend on them.

| # | Severity | File | Issue | Flagged by |
|---|----------|------|-------|------------|
| 1 | Low | `src/types.ts:315` | `renderHeader` combines multiple concerns behind one prop | architecture-engineer |
| 2 | Low | `src/renderer.tsx:529` | `__ariaLabel` internal metadata lives in consumer payloads | architecture-engineer |
| 3 | Low | `src/renderer.tsx:760` | `SheetRenderer` centralizes too many unrelated responsibilities | architecture-engineer |

**Suggested approach:** Treat this as one API-shaping pass. Clarify the public contract first, then split renderer responsibilities behind that cleaner surface.

### 5. Performance And Maintainability Pressure

**Why:** These are not release blockers at the current stage, but they are the areas most likely to create sluggishness or change friction as the project grows.

| # | Severity | File | Issue | Flagged by |
|---|----------|------|-------|------------|
| 1 | Low | `src/use-drag.ts:312` | Drag updates currently force React work on the hot path | performance-engineer |
| 2 | Low | `site/components/demos/playground-demo.tsx:1` | Homepage demo is a large monolithic client file | organization-engineer |

**Suggested approach:** If you decide to invest in polish/perf next, break up the playground file and use that refactor to reduce unnecessary drag-related React work at the same time.

---

<details>
<summary>Dismissed findings (0 items)</summary>

No findings were dismissed after consolidation. Overlapping provider/homepage bundle findings were merged instead of duplicated.

</details>

---

## Next Steps

1. Fix the `src/renderer.tsx` viewport snap-point bug and align `Sheet.Close` semantics with the documented API.
2. Add a docs route error boundary and split docs-only providers out of `site/app/layout.tsx`.
3. Remove the broken `docs` script or restore its generator, then prune verified unused dependencies from `site/package.json`.
