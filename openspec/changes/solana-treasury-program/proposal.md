## Why

The group treasury app requires a trustless on-chain foundation: funds must only move when the group agrees, enforced by code rather than trust. Without the Solana program, no deposits can be held, no proposals can be tracked, and no approvals can execute — all other features are blocked.

## What Changes

- New Anchor program `treasury` deployed to Solana devnet
- Treasury PDA initialized per group pool; holds SOL and tracks membership + active contract hash
- Contract version doubly-linked-list stored on-chain (each node: hash, prev hash, next hash)
- Treasury is gated: proposals cannot be submitted until a contract has been set
- Members deposit SOL directly into the treasury PDA
- Proposers submit transaction proposals on-chain (amount, recipient, description, category, optional URL flag)
- Each proposal tracks individual approvals and rejections from members
- Execution fires automatically and irreversibly when approval threshold is reached
- Proposer can cancel a proposal at any time before execution
- Program IDL exported and wired into the frontend via `@coral-xyz/anchor`

## Capabilities

### New Capabilities

- `treasury-init`: Initialize a treasury PDA with members, approval threshold, and pool ID
- `treasury-deposit`: Members deposit SOL into the treasury PDA
- `contract-versioning`: Store contract version hashes on-chain in a doubly linked list; gate proposals behind an active contract
- `proposal-lifecycle`: Submit proposals (spending, add-member, amend-contract, switch-contract), cast approval/rejection votes, auto-execute at threshold, cancel before execution
- `wallet-integration`: In-browser demo wallet — deterministic keypair from username, auto-airdrop, localStorage persistence, unified signer interface alongside Phantom

### Modified Capabilities

<!-- None — this is a net-new on-chain layer; no existing specs are affected -->

## Impact

- New directory: `programs/treasury/` (Rust/Anchor program)
- New root files: `Cargo.toml` (workspace), `Anchor.toml` (devnet config)
- Frontend gains `@coral-xyz/anchor` and `@solana/web3.js` dependencies for calling the program
- Convex DB (off-chain) stores full contract JSON per version; on-chain stores only the hash
