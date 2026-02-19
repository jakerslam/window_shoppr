# Modal Routing Restoration

## Scope
Restores feed-preserving product modal routing for runtime deployments while keeping static-export compatibility.

## Behavior
- In `runtime` deploy target:
  - Product card click updates URL to `/?product=<slug>`.
  - Home feed stays mounted.
  - Product detail opens in modal overlay.
  - Back navigation closes modal and returns to feed state.
- In `static-export` deploy target:
  - Product card click navigates to `/product/<slug>/` full page.

## Implementation
- Trigger logic: `/src/features/home-feed/HomeFeed.tsx`
- Modal route rendering: `/src/app/page.tsx`
- Modal container: `/src/shared/components/modal/Modal.tsx`

## SEO
Canonical product pages remain available at `/product/<slug>/`.
The runtime modal path is a UX layer, not an SEO replacement.
