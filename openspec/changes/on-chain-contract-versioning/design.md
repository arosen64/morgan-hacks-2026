## Context

The pool and member registry are in place. The next foundational layer is the contract system — the mechanism that makes the treasury trustless. The design spans two systems: a Solana Anchor program (on-chain state and enforcement) and Convex (off-chain storage and UI data). The key invariant: the SHA-256 hash of the contract JSON stored in Convex must match the hash stored on-chain at all times.

Current state:

- `pools` table exists in Convex with `status: "pre-contract" | "active"`
- `members` table exists; `getMembersForContract` returns the member array for contract JSON
- No Anchor program exists yet — this change creates it

## Goals / Non-Goals

**Goals:**

- Define and deploy the Anchor program's `Pool` and `ContractVersion` accounts
- Store contract version hash + doubly linked list pointers on-chain
- Store full contract JSON in Convex, queryable by hash or pool
- Block transaction proposals on-chain until a contract hash is set
- Transition pool status to `active` in Convex when the first contract is committed
- Provide UI to view the active contract and navigate version history

**Non-Goals:**

- Contract content validation (that's Gemini's job — issue #6)
- Amendment voting flow (issue #12)
- Transaction proposal UI (issue #8)
- Wallet-signed amendment approval (future)

## Decisions

**Decision 1: Hash is SHA-256 of the canonical JSON string**

- The contract JSON is canonicalized (keys sorted, no extra whitespace) before hashing
- Hash is computed in the Convex action before submitting to Solana
- Stored on-chain as a 32-byte array
- Rationale: deterministic — the same contract always produces the same hash regardless of who computes it; any client can verify by re-hashing the Convex JSON

**Decision 2: `ContractVersion` is a separate Solana account per version, not an array on the Pool**

- Each version is its own PDA, seeded by `[pool_pubkey, version_number_as_u32_bytes]`
- The `Pool` account stores only `active_contract_hash` (32 bytes) and `version_count` (u32)
- Each `ContractVersion` account stores: `hash` (32 bytes), `prev_hash` (32 bytes, zero if none), `next_hash` (32 bytes, zero if none), `version_number` (u32)
- Rationale: Solana accounts have a fixed size at creation. Storing an unbounded list of hashes in the Pool account would require reallocation. Separate PDAs are the standard pattern.
- Alternative considered: store hashes as a vector in the Pool account — rejected due to reallocation complexity and account size limits

**Decision 3: `initialize_contract` instruction writes the first version and sets `active_contract_hash` on Pool**

- A single Anchor instruction handles: create `ContractVersion` PDA, set hash + prev/next pointers, update `Pool.active_contract_hash`, increment `Pool.version_count`
- Callable once per pool (enforced by checking `version_count == 0`)
- Rationale: atomic — the pool can never be in a state where a ContractVersion exists but the pool's active hash isn't updated

**Decision 4: `append_contract_version` instruction handles amendments**

- Separate instruction from `initialize_contract`
- Takes: new hash, old (current active) version PDA — updates old version's `next_hash`, creates new version PDA, updates `Pool.active_contract_hash`
- Must be called by a manager wallet (enforced via account constraint)
- Rationale: separating init from append makes the first-version case explicit and avoids conditional logic in a single instruction

**Decision 5: Convex mirrors the on-chain linked list in the `contracts` table**

- `contracts` table: `poolId`, `hash`, `versionNumber`, `contractJson`, `prevHash`, `nextHash`, `createdAt`
- Convex is the source of truth for the JSON; on-chain is the source of truth for the hash and order
- The UI traverses the list using Convex queries (cheaper than on-chain RPC calls for each node)
- Rationale: browsing history is a read-heavy UI operation; Convex reactive queries are better suited than repeated Solana RPC calls

**Decision 6: Pool `activeContractHash` field added to Convex `pools` table**

- Mirrors the on-chain value; updated by the same Convex action that submits the Solana transaction
- Used to gate the "Create Contract" CTA — once set, the banner disappears and `status` transitions to `active`
- Rationale: avoids polling Solana for pool status; Convex is already the reactive data layer for the UI

## Risks / Trade-offs

- **Hash mismatch between Convex and on-chain** → If the Convex write succeeds but the Solana tx fails, Convex has a record with no on-chain counterpart. Mitigation: write to Convex only after the Solana transaction confirms; use a `pendingHash` field during the in-flight window.
- **Account size limits** → Each `ContractVersion` PDA is fixed-size at init. 32+32+32+4 = 100 bytes of data plus Anchor discriminator. No resizing needed — this is safe.
- **Version traversal cost** → Browsing full history requires a single Convex query filtered by poolId. For hackathon scale this is fine.
- **Manager-only enforcement** → The `append_contract_version` instruction checks the signer is a manager wallet. Manager wallets are stored in Convex, not on-chain. This means the on-chain check relies on a passed-in account that we verify matches a Convex manager — a trust assumption acceptable for hackathon scope.

## Migration Plan

Greenfield — no existing Solana program or contracts data. Steps:

1. Initialize Anchor workspace under `program/`
2. Define accounts and instructions
3. Build and deploy to devnet (`anchor deploy`)
4. Add Convex `contracts` table and actions
5. Wire frontend

## Open Questions

- Should the Convex action that submits the Solana transaction be a server-side action or use the browser wallet directly?
  - **Resolved**: browser wallet signs the transaction client-side; Convex action is used only for the off-chain writes (storing JSON, updating pool status).
