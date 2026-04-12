## 1. Schema & Backend

- [x] 1.1 Add `contributedLamports: v.optional(v.number())` to `members` table in `convex/schema.ts`
- [x] 1.2 Add `recordDeposit` mutation in `convex/members.ts` — reads wallet from auth, finds member by poolId+wallet, increments `contributedLamports`

## 2. On-chain Utilities

- [x] 2.1 Create `src/lib/treasury.ts` with `poolIdToBytes(poolId: string): Uint8Array` (SHA-256 of UTF-8 pool ID) and `getTreasuryPda(poolId: string): PublicKey`
- [x] 2.2 Add `isTreasuryInitialized(connection, poolId): Promise<boolean>` to check on-chain account existence

## 3. Add Money Modal

- [x] 3.1 Create `src/components/AddMoneyModal.tsx` with amount input, wallet balance display, loading/error states
- [x] 3.2 Wire deposit logic: check treasury init → `initialize_treasury` if needed → `deposit` → `recordDeposit` mutation
- [x] 3.3 Emit `onSuccess(lamports)` callback on confirmed deposit

## 4. Dashboard Integration

- [x] 4.1 Add `useTreasuryBalance(poolId)` hook that polls `connection.getBalance(treasuryPda)` and refreshes on demand
- [x] 4.2 Wire "Add Money" button in `PoolDashboard` to open `AddMoneyModal`
- [x] 4.3 Show treasury balance (SOL) in the Treasury Balance card, replacing the `—` placeholder
- [x] 4.4 Show per-member `contributedLamports` in the member list (already scaffolded in the dashboard)
