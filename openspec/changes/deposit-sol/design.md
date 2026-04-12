## Context

The on-chain treasury program is already deployed to devnet (`GkkgQsMLxjzZ6zxsbSbReyt4pNM8fUBYf98E3KpWvaer`). It exposes `initialize_treasury` and `deposit` instructions. The treasury PDA is seeded with `["treasury", pool_id: [u8;32]]`. The frontend uses `@coral-xyz/anchor ^0.32.1` and Phantom via `@solana/wallet-adapter-react`. The app uses devnet throughout.

## Goals / Non-Goals

**Goals:**

- Let any pool member deposit SOL from their connected Phantom wallet
- Show live wallet balance in the modal so users know their available funds
- Show the treasury on-chain balance on the dashboard
- Record per-member contribution totals in Convex for display in the member list

**Non-Goals:**

- Spending from the treasury (separate feature)
- Supporting wallets other than Phantom
- Multi-step approval for deposits

## Decisions

**Pool ID → 32-byte seed**: SHA-256 hash the UTF-8 bytes of the Convex pool ID string. This gives a deterministic 32-byte value usable as the `pool_id` arg for `initialize_treasury` and as the PDA seed. Stored in `src/lib/treasury.ts`.

**Treasury initialization**: The treasury PDA must exist before `deposit` can be called. On first deposit, call `initialize_treasury` first (with current pool members from Convex), then `deposit`. Both txs are sent sequentially within the same modal flow. Subsequent deposits skip init.

**Balance display**: Use `connection.getBalance(treasuryPda)` polled on mount and after deposit. Treasury PDA address is derived client-side — no need to store it in Convex.

**contributedLamports in Convex**: A `recordDeposit` mutation adds to `contributedLamports` on the member record after the on-chain tx confirms. Eventual consistency is fine — the deposit is confirmed on-chain first.

**Anchor program interaction**: Use `@coral-xyz/anchor` `Program` with the IDL from `src/idl/treasury.json`. Use `sendTransaction` from the wallet adapter to send the transactions (Phantom signs).

## Risks / Trade-offs

- If `initialize_treasury` and `deposit` are two separate txs, a failure between them leaves the treasury initialized but empty. Acceptable since deposit can always be retried.
- `contributedLamports` in Convex may be out of sync if the user closes the modal before recording. The on-chain state is authoritative.
