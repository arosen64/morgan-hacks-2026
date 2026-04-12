## 1. Backend — Schema & Query

- [x] 1.1 Add `by_wallet` index on the `wallet` field to the `members` table in `convex/schema.ts`
- [x] 1.2 Add `getPoolsByWallet` query to `convex/members.ts` using the `by_wallet` index, joining each membership with its pool document and returning `{ pool, role }[]`

## 2. UI Setup — shadcn/ui

- [x] 2.1 Initialize shadcn/ui in the project (`npx shadcn@latest init`) if not already present
- [x] 2.2 Add required shadcn/ui components: `Button`, `Card` (`CardHeader`, `CardContent`, `CardTitle`), `Badge`

## 3. Sign-In Screen

- [x] 3.1 Create `src/components/SignInScreen.tsx` using shadcn/ui `Card` and `Button` with a "Connect Wallet" `WalletMultiButton`

## 4. Pool Dashboard Extraction

- [x] 4.1 Create `src/components/PoolDashboard.tsx` by extracting all pool-level logic and views from `App.tsx` (dashboard, add member, create contract, contract history sub-views)

## 5. Main Menu Screen

- [x] 5.1 Create `src/components/MainMenu.tsx` with a pool list, "Create Pool" button, and "Join Pool" button using shadcn/ui components
- [x] 5.2 Use `getPoolsByWallet` query in `MainMenu` to fetch and display the connected wallet's pools
- [x] 5.3 Render each pool as a `Card` row showing pool name and a role `Badge` (manager / member)
- [x] 5.4 Show an empty state message when the wallet has no pool memberships

## 6. App.tsx — Thin Router

- [x] 6.1 Rewrite `App.tsx` as a thin router: `useEffect` to reset `poolId` on disconnect, render `<SignInScreen>` when not connected, `<MainMenu>` when no pool selected, `<PoolDashboard>` when a pool is selected
