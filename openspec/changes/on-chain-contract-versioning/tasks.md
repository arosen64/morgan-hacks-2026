## 1. Anchor Program Setup

- [x] 1.1 Initialize Anchor workspace under `program/` (`anchor init group-treasury`)
- [x] 1.2 Add `@coral-xyz/anchor` and `@solana/web3.js` as frontend dependencies
- [x] 1.3 Define `Pool` account struct: `active_contract_hash: [u8; 32]`, `version_count: u32`, `bump: u8`
- [x] 1.4 Define `ContractVersion` account struct: `hash: [u8; 32]`, `prev_hash: [u8; 32]`, `next_hash: [u8; 32]`, `version_number: u32`, `bump: u8`
- [x] 1.5 Define PDA seeds: Pool seeded by `[b"pool", pool_id_bytes]`; ContractVersion seeded by `[b"contract_version", pool_pubkey, version_number_le_bytes]`

## 2. Anchor Instructions

- [x] 2.1 Implement `initialize_pool` instruction — creates Pool PDA with zeroed `active_contract_hash` and `version_count: 0`
- [x] 2.2 Implement `initialize_contract` instruction — creates first ContractVersion PDA, sets hash, sets `prev_hash`/`next_hash` to zero, updates Pool `active_contract_hash` and `version_count`; errors if `version_count > 0`
- [x] 2.3 Implement `append_contract_version` instruction — creates new ContractVersion PDA, updates old version's `next_hash`, updates Pool `active_contract_hash` and increments `version_count`
- [x] 2.4 Add `propose_transaction` stub instruction that errors with `ContractRequired` if `Pool.active_contract_hash` is all zeros
- [x] 2.5 Build and deploy program to devnet (`anchor build && anchor deploy`)

## 3. Convex Schema & Backend

- [x] 3.1 Add `contracts` table to Convex schema: `poolId`, `hash`, `versionNumber`, `contractJson`, `prevHash`, `nextHash`, `createdAt`
- [x] 3.2 Add index on `contracts` by `poolId` for version history queries
- [x] 3.3 Add index on `contracts` by `hash` for fetch-by-hash queries
- [x] 3.4 Add `activeContractHash` field (optional string) to `pools` table in schema
- [x] 3.5 Implement `commitContract` Convex mutation — inserts contract record, updates pool `activeContractHash` and `status` to `active`
- [x] 3.6 Implement `getContractVersions` Convex query — returns all versions for a pool ordered by `versionNumber`
- [x] 3.7 Implement `getContractByHash` Convex query — returns contract record by hash
- [x] 3.8 Implement `canonicalizeAndHash` utility function — sorts JSON keys, stringifies, returns SHA-256 hex string (used client-side before signing)

## 4. Contract Creation UI

- [x] 4.1 Create `ContractCreationPage` — plain text input for rules description; "Preview Contract" button (Gemini call placeholder for now)
- [x] 4.2 Show contract JSON preview before submission with field-by-field breakdown
- [x] 4.3 "Confirm & Sign" button — calls `canonicalizeAndHash`, builds Anchor instruction, requests wallet signature, submits transaction
- [x] 4.4 On Solana transaction confirmation, call `commitContract` Convex mutation
- [x] 4.5 Redirect to pool dashboard on success; pool status banner disappears and active contract is shown

## 5. Contract History UI

- [x] 5.1 Create `ContractHistoryPage` — lists all versions from `getContractVersions` query with version number, date, and truncated hash
- [x] 5.2 Highlight the active version (matching `pool.activeContractHash`)
- [x] 5.3 Click on any version to expand and view full contract JSON rendered field-by-field
- [x] 5.4 Add "View History" link from pool dashboard to contract history page

## 6. Dashboard Integration

- [x] 6.1 Wire "Create Contract" CTA in `PoolStatusBanner` to navigate to `ContractCreationPage`
- [x] 6.2 Display active contract summary on pool dashboard (name, version number, allowed types, approval rules) once `pool.status === "active"`
