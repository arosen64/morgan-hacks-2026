## Why

The product is called **Potlock**, yet the UI consistently uses the word "pool" and frames the app around investing — neither of which reflects the product name or its broader purpose. This creates a confusing and off-brand experience for users.

## What Changes

- All user-visible occurrences of "pool" / "Pool" replaced with "pot" / "Pot" across the UI
- The main menu badge updated from "Investment Pools" to "Your Pots"
- The main menu description reworded to remove "invest" / "investment" framing
- The sign-in screen hero copy updated to remove investment-specific language
- Internal variable/prop names (e.g. `poolId`) are **not** changed — only user-visible strings

## Capabilities

### New Capabilities

- `ui-terminology`: Consistent "pot" terminology and neutral (non-investment) copy across all user-facing screens

### Modified Capabilities

<!-- No existing spec-level requirements are changing — this is purely a copy/label change -->

## Impact

- `src/components/MainMenu.tsx` — badge, description, and CTA button labels
- `src/components/CreatePoolFlow.tsx` — step header and input labels
- `src/components/PoolDashboard.tsx` — page heading fallback text
- `src/components/SignInScreen.tsx` — hero tagline and description copy
- No API, data model, or routing changes required
- No new dependencies; uses existing Tailwind and shadcn/ui components
