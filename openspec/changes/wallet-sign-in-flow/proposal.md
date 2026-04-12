## Why

New users opening the app for the first time have no entry point — the app immediately shows a pool creation form with no sign-in context. We need a proper first-time use flow that gates access behind Phantom wallet connection and lands connected users on a home screen that shows all their pools.

## What Changes

- Add a full-screen sign-in prompt shown when no Phantom wallet is connected, with a single "Connect Wallet" call to action
- After wallet connection, route the user to a main menu
- Main menu lists all pools the connected wallet belongs to, showing pool name and the user's role (manager / member) for each
- Main menu has a "Create Pool" button and a "Join Pool" button (navigation not wired — buttons exist as UI only for this issue)
- Each pool row in the list is displayed but does not need to navigate anywhere for this issue
- Wallet disconnection from any screen returns the user to the sign-in screen
- Add a Convex query to fetch all pools for a given wallet address (requires a new `by_wallet` index on the `members` table)

## Capabilities

### New Capabilities

- `wallet-sign-in`: Full-screen sign-in screen that prompts unauthenticated users to connect their Phantom wallet before accessing the app
- `main-menu`: Home screen for connected users listing all their pools (name + role), with "Create Pool" and "Join Pool" buttons present as UI

### Modified Capabilities

<!-- No existing spec-level behavior is changing -->

## Impact

- `convex/schema.ts`: Add `by_wallet` index to `members` table
- `convex/members.ts`: Add `getPoolsByWallet` query
- `src/App.tsx`: Restructure top-level routing — sign-in gate and main menu view
- No new dependencies required; existing `@solana/wallet-adapter-react` and `convex/react` hooks are sufficient
