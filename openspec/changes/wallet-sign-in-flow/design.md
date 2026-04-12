## Context

The app currently shows a pool-creation form immediately on load, with a wallet connect button embedded in the form. There is no dedicated sign-in screen and no concept of a "home" view that aggregates all pools a user belongs to. The `members` table already stores wallet addresses but has no index on `wallet`, making per-wallet lookups a full table scan.

Existing UI is a mix of raw Tailwind utility classes with no consistent component library. This change introduces shadcn/ui as the standard component layer going forward.

## Goals / Non-Goals

**Goals:**

- Gate the entire app behind Phantom wallet connection with a dedicated full-screen sign-in screen
- Show a main menu after connection that lists all pools the wallet belongs to (fetched live from Convex)
- Surface "Create Pool" and "Join Pool" as visible actions on the main menu (not wired to navigation)
- Return the user to sign-in if the wallet disconnects
- Build all new UI using shadcn/ui components (`Button`, `Card`, `Badge`, etc.) styled with Tailwind

**Non-Goals:**

- Wiring "Create Pool", "Join Pool", or individual pool rows to navigate anywhere (future issue)
- Any form of server-side authentication (JWT, sessions) — wallet address is the identity for now
- Pagination of the pool list
- Migrating existing screens to shadcn/ui (only new screens built in this change)

## Decisions

### Use shadcn/ui + Tailwind for all new UI

All new components (`SignInScreen`, `MainMenu`, pool list rows) must use shadcn/ui primitives (`Button`, `Card`, `CardHeader`, `CardContent`, `Badge`) styled with Tailwind utility classes. Raw `<button>` or `<div>` elements should not be used where a shadcn/ui equivalent exists.

_Alternative_: Continue with raw Tailwind only — rejected to establish a consistent, reusable design system across the app.

### Index on `members.wallet`

Add a `by_wallet` index to the `members` table so `getPoolsByWallet` can look up memberships efficiently without a full table scan.

_Alternative_: Filter in-memory on the client — rejected because it reads every member document regardless of wallet.

### New `getPoolsByWallet` Convex query

A single query in `members.ts` that fetches all member rows for a wallet, then joins each with its pool document and returns `{ pool, role }` pairs. Wallet address is passed as an argument (not derived from auth) because the app uses Solana wallet adapter, not Convex JWT auth.

_Alternative_: Two separate queries (members then pools) on the client — rejected to keep fetch logic server-side and avoid waterfall round-trips.

### Modular component structure

`App.tsx` becomes a thin top-level router that delegates to three focused components:

- `<SignInScreen>` — rendered when wallet is not connected
- `<MainMenu walletAddress onSelectPool>` — rendered when connected, no pool selected
- `<PoolDashboard poolId walletAddress onBack>` — extracted from the current monolithic `App.tsx`; owns all pool-level sub-views (dashboard, add member, create contract, contract history)

All pool-level state (`view`, `founderName`, `poolName`, `creating`, `error`) moves into `PoolDashboard`. `App.tsx` retains only `poolId`, `connected`, and the `useEffect` disconnect reset.

_Alternative_: React Router — overkill for the current flat view hierarchy; simple state is sufficient.

## Risks / Trade-offs

- [shadcn/ui not yet installed] shadcn/ui must be initialized and required components added before implementing UI. → Run `npx shadcn@latest init` and add `Button`, `Card`, `Badge` before coding.
- [Wallet address as identity] Wallet addresses are not authenticated by Convex — any caller who knows an address can query its pools. → Acceptable for this hackathon stage; add JWT auth in a later iteration.
- [`.take(100)` cap] `getPoolsByWallet` bounds results at 100 pools per wallet. → Acceptable given expected usage scale.

## Migration Plan

1. Initialize shadcn/ui and add required components (`Button`, `Card`, `Badge`).
2. Add `by_wallet` index to schema — Convex will backfill the index on deploy with no downtime.
3. Deploy updated `members.ts` with the new `getPoolsByWallet` query.
4. Deploy updated `App.tsx` with sign-in screen and main menu.

No data is deleted or transformed; no rollback complexity.
