## 1. Rewrite PoolDashboard Component

- [x] 1.1 Replace the entire body of `src/components/PoolDashboard.tsx` keeping the same export name and props signature: `{ poolId: Id<"pools">, walletAddress: string, onBack: () => void }`
- [x] 1.2 Add the Potlock top nav (violet logo square + "Potlock" text left, `useWallet().disconnect` ghost Button right) — copy exact structure from `MainMenu.tsx`
- [x] 1.3 Add a back control (`← Back`) below the nav that calls `onBack()`
- [x] 1.4 Fetch pool with `useQuery(api.pools.getPool, { poolId })` and fetch members with `useQuery(api.members.getMembers, { poolId })`
- [x] 1.5 Derive user role by finding the member whose `wallet` matches `walletAddress`; default to `"member"` if not found

## 2. Pool Name + Role Header

- [x] 2.1 Display pool name as a large heading (`text-3xl font-bold tracking-tight`) with a Skeleton placeholder while the query is loading
- [x] 2.2 Render a `Badge` next to the name: violet (`bg-violet-600 hover:bg-violet-600`) for "manager", default secondary for "member"

## 3. Treasury Balance Card

- [x] 3.1 Render a `Card` with title "Treasury Balance"
- [x] 3.2 Display "—" as the balance value with a small `text-muted-foreground` note: "Live balance available once Add Money is set up."

## 4. Member Contribution List Card

- [x] 4.1 Render a `Card` with title "Members"
- [x] 4.2 While members query is loading, show two `Skeleton` rows
- [x] 4.3 When loaded and empty, show "No members yet." in `text-muted-foreground`
- [x] 4.4 For each member render a row: display name (font-medium), truncated wallet (`${w.slice(0,4)}…${w.slice(-4)}` in `font-mono text-muted-foreground`), contributed SOL (`contributedLamports / 1e9` or "0 SOL"), and role `Badge`

## 5. Action Buttons Grid

- [x] 5.1 Render a `Card` with title "Actions"
- [x] 5.2 Inside a `grid grid-cols-2 gap-3` render five `variant="outline"` Buttons: "Request Transaction", "Contract", "All Transactions", "Add Money", "Invite Members" — each with a no-op `onClick`
