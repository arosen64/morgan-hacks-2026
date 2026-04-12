## Why

The app currently displays a violet square placeholder wherever the Potlock brand identity should appear. Replacing it with the real logo gives the product a polished, professional look and correctly represents the Potlock brand to users.

## What Changes

- A logo image file (SVG preferred, PNG acceptable) is added to `src/assets/`
- A reusable `<Logo>` component is introduced that wraps the image with size variants
- The violet square placeholder (`<div className="size-7 rounded-lg bg-violet-500" />`) is replaced with `<Logo>` in all four locations:
  - `src/components/MainMenu.tsx` — top nav bar and hero section
  - `src/components/PoolDashboard.tsx` — top nav bar inside a pot
  - `src/components/SignInScreen.tsx` — sign-in hero and header

## Capabilities

### New Capabilities

- `brand-logo`: Reusable Logo component that renders the Potlock brand image at nav-bar size (28–32 px height) and hero/splash size (large, prominent)

### Modified Capabilities

<!-- No existing spec-level requirements are changing -->

## Impact

- `src/assets/` — new logo file added
- `src/components/Logo.tsx` — new component (Tailwind + shadcn/ui conventions)
- `src/components/MainMenu.tsx` — placeholder replaced in two locations
- `src/components/PoolDashboard.tsx` — placeholder replaced in one location
- `src/components/SignInScreen.tsx` — placeholder replaced in two locations
- No API, backend, or routing changes
