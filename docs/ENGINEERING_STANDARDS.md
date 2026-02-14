# Engineering Standards

## Purpose
This document defines how code is implemented and maintained for Window Shoppr. The SRS tracks feature scope; this file tracks engineering execution standards.

## Stack And Architecture
- Use Next.js App Router with TypeScript (`strict: true`).
- Keep domain code in `src/features/*` and shared code in `src/shared/*`.
- Keep product data local-first (JSON now), with explicit backend stubs for later SQL/API wiring.
- Keep static-export compatibility while GitHub Pages is the deployment target.

## CSS And UI Conventions
- Use CSS Modules with BEM-style class naming.
- Keep component-specific styles next to the component.
- Keep `globals.css` limited to global tokens, resets, and truly cross-app rules.
- Use design tokens from global palette variables; avoid hardcoded one-off colors when a token exists.

## File Size And Splitting Rules
- Split TS/TSX files when they exceed `220` lines.
- Split TS/TSX files earlier (around `120+` lines) when they mix multiple concerns (state orchestration + heavy rendering + utilities).
- If a folder exceeds `8` files, introduce subfolders by concern.
- Keep constants in the feature folder when they are feature-only; move to `src/shared/lib/*` only when reused.

## React And State Rules
- One `useEffect` per concern; merge duplicate/overlapping effects.
- No state updates during render.
- Keep SSR-safe logic deterministic to avoid hydration mismatches.
- Prefer derived state via `useMemo` over duplicating source state.

## Comments And Readability
- Add concise comment blocks above components/functions when behavior is non-obvious.
- Keep inline comments short and action-focused.
- Avoid redundant comments that restate obvious syntax.

## Requirement Workflow
- Implement one requirement at a time after initialization.
- Do not edit files outside the active requirement scope unless required for a blocking fix.
- After each completed requirement:
  - Run `npm run lint`.
  - Run `npm run build`.
  - Update `SRS.md` checkboxes and set the next requirement indicator.
  - Commit and push unless explicitly paused.

## Quality Gates
- Preserve existing behavior unless the requirement explicitly changes it.
- Validate desktop and mobile behavior for affected areas.
- Keep accessibility basics intact (keyboard navigation, focus visibility, contrast).

## Git And Safety
- Do not use destructive git commands unless explicitly requested.
- Keep commits scoped to the requirement being completed.
- Document assumptions when a requirement is ambiguous.
