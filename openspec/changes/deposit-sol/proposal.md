## Why

Pool members need a way to contribute SOL to their group treasury. The "Add Money" button exists in the dashboard but is a no-op. This wires it to a real Solana deposit via the on-chain treasury program (already deployed to devnet at `GkkgQsMLxjzZ6zxsbSbReyt4pNM8fUBYf98E3KpWvaer`).

## What Changes

- "Add Money" opens a modal with a SOL amount input and the user's live Phantom wallet balance
- Submitting calls the on-chain `initialize_treasury` (if first deposit) then `deposit` instruction via the Anchor program
- Treasury PDA is derived deterministically from the Convex pool ID (SHA-256 → 32-byte seed)
- On confirmed Solana transaction, a Convex mutation records `contributedLamports` on the member record
- Treasury balance (on-chain SOL) and per-member contribution totals are shown in the dashboard

## Capabilities

### New Capabilities

- `deposit-sol`: Modal flow for depositing SOL from Phantom wallet into the pool's on-chain treasury PDA, with treasury auto-initialization on first deposit and Convex contribution tracking

### Modified Capabilities

## Impact

- `convex/schema.ts` — add `contributedLamports: v.optional(v.number())` to `members` table
- `convex/members.ts` — add `recordDeposit` mutation
- `src/components/AddMoneyModal.tsx` — new modal component
- `src/components/PoolDashboard.tsx` — wire "Add Money" button, show treasury balance
- `src/lib/treasury.ts` — new utility: PDA derivation and Anchor program helpers
