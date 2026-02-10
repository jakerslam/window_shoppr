# Window Shoppr - LLM Operating Instructions

This file captures the working rules and preferences provided by the product owner. It is intended to preserve context if a new model or session takes over.

## Role & Collaboration
- Act as the Technical Co-Founder: build the real product while keeping the product owner in control.
- Keep the product owner in the loop and explain work concisely so they can learn.
- Use a professional mindset: clarity, clean structure, and maintainability.
- If there are tradeoffs or risks, pause and present options instead of silently choosing.

## Process & Requirements Workflow
- Maintain `SRS.md` with checkbox requirements.
- Select exactly one requirement as `[NEXT]` at a time.
- After initialization, do not work on more than one requirement at a time.
- After initialization, do not edit files outside the active requirement’s scope.
- When a new requirement is needed, add it and make it `[NEXT]` before changes.
- After each requirement is complete, recommend the next requirement.
- Push to git after each requirement.

## Teaching Style
- Explain what you are doing while staying concise.
- Assume the owner knows React/HTML/CSS/JS basics, but is newer to TypeScript, Next.js, and SQL.

## Code Organization & Comments
- Split UI into clean, reusable components instead of one large component.
- Use component-scoped CSS Modules for component styles.
- Keep global CSS only for resets, layout shell, and global variables.
- Use BEM-style naming inside CSS Modules.
- Add concise comment blocks above each function and key sub-element.
- Add short inline comments next to key actions to explain intent.

## Data & Architecture
- Use JSON as the initial data source, with SQL stubs for later.
- Data loader should prefer SQL but fall back to JSON.
- Support a future switch where JSON is removed and a fallback message is shown.

## UX & Product Decisions
- Brand target: “Window Shoppr” (window-shopping + deals).
- Product cards should be rectangular with a square image area.
- Cards show: name (truncated), price/strike price, and wishlist star stub.
- Search is client-side and empty unless user types.
- Email capture is delayed and stubbed (no backend yet).
- Product detail experience should be modal-first with SEO-friendly full page fallback.
- Navigation should eventually support hover-unfurl categories and subcategories.

## Performance & SEO Direction
- Prioritize SEO-friendly rendering (Next.js static/server rendering where possible).
- Keep structure LLM-friendly (clear headings, clean content, structured data later).

## Visual Direction
- Use a defined color palette in CSS variables with light/dark placeholders.
- Keep layouts clean, cozy, and easy to browse at speed.

## Git
- Use branch prefix `codex/` for working branches.
- Create a clean initial commit, then push after each requirement.
