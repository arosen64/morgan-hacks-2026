## Why

After the main menu (issue #21) was shipped, clicking a pool takes the user to an old prototype `PoolDashboard` that doesn't match the Potlock design system. Issue #24 replaces it with a properly designed pool home page that is consistent with the sign-in and main menu screens.

## What Changes

- Replace the body of `src/components/PoolDashboard.tsx` with a redesigned pool home page that matches the Potlock UI (violet accent, same top nav, Card layout)
- Display pool name and the user's role badge in the page header
- Show a treasury SOL balance section
- Show a member list with each member's name, truncated wallet, and contributed SOL
- Render five action buttons as stubs: "Request Transaction", "Contract", "All Transactions", "Add Money", "Invite Members"
- Keep the same props interface (`poolId`, `walletAddress`, `onBack`) so `App.tsx` requires no changes

## Capabilities

### New Capabilities

- `pool-home-page`: The redesigned pool home page — header with pool name + role badge, treasury balance card, member contribution list, action button grid

### Modified Capabilities

_None._

## Impact

- `src/components/PoolDashboard.tsx` — full rewrite (existing file, same export name and props)
- Consumes existing Convex queries: `api.pools.getPool`, `api.members.getMembers`
- Uses existing shadcn components: Card, CardContent, CardHeader, Badge, Button, Skeleton
- No schema changes, no new dependencies
