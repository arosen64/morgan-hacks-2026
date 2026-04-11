## Why

Without a governing contract, a group treasury has no rules — no defined approval logic, no allowed transaction types, no budget limits. Contracts must be immutable and auditable, so every version must be permanently stored on-chain as a doubly linked list, and no transaction can be proposed until at least one version exists.

## What Changes

- Solana program gains a `ContractVersion` account type that stores a SHA-256 hash of the full contract JSON, plus `prev_version_hash` and `next_version_hash` pointers
- Pool account gains an `active_contract_hash` field pointing to the current head of the linked list
- Transaction proposals are blocked on-chain until the pool has an active contract hash
- The Convex `contracts` table stores the full contract JSON for each version, keyed by hash
- The pool transitions from `pre-contract` → `active` status in Convex when the first contract version is committed
- A new version is appended and linked whenever an amendment is approved
- All previous versions remain accessible — nothing is ever deleted

## Capabilities

### New Capabilities

- `contract-version-account`: Solana on-chain `ContractVersion` account — stores hash, prev/next pointers, and version number
- `pool-contract-gate`: On-chain enforcement that blocks transaction proposals until `active_contract_hash` is set on the pool account
- `contract-convex-storage`: Convex `contracts` table — stores full JSON per version keyed by hash; query to fetch version by hash or list all for a pool
- `contract-version-ui`: Frontend contract history view — browse all versions via the doubly linked list; display active contract fields

### Modified Capabilities

- `member-registry`: Pool `status` transitions from `pre-contract` → `active` when the first contract is committed (requirement change: previously no trigger was defined for the transition)

## Impact

- **Solana program**: new `ContractVersion` account, new `initialize_contract` instruction, new `active_contract_hash` field on `Pool` account; `propose_transaction` instruction must check for non-null `active_contract_hash`
- **Convex DB**: new `contracts` table with fields `poolId`, `hash`, `versionNumber`, `contractJson`, `prevHash`, `nextHash`, `createdAt`; `pools` table gets `activeContractHash` field
- **Frontend**: new contract creation page (plain language input → Gemini → preview → confirm); new contract history page with version navigation
- **Dependencies**: `@coral-xyz/anchor` for Solana program; `crypto` (Node built-in) for SHA-256 hashing in Convex action
