## Context

The app is a group treasury governed by an on-chain contract. No existing Solana program exists — this is greenfield. The frontend is a React/Vite app; the backend is Convex. The on-chain layer must store only what needs to be trustless (fund custody, approval counts, contract hashes, execution). Everything else (contract JSON, member names, transaction metadata) lives in Convex.

The Anchor framework (Rust) is used for the Solana program. Devnet is the target for the hackathon. A local playground keypair (`playground-keypair.json`) is generated and used as the deploy authority / payer for devnet.

## Goals / Non-Goals

**Goals:**

- Treasury PDA holds SOL and enforces approval-gated spending
- Contract versioning stored on-chain as a doubly linked list of hashes
- Proposals track votes; auto-execute when threshold is met
- Proposer (and only the proposer) can cancel before threshold
- Members can be added to the treasury after initialization
- IDL generated and usable from frontend
- Playground wallet keypair set up for devnet deployment and testing

**Non-Goals:**

- Full approval rule engine on-chain (role-based, tiered rules evaluated in Rust) — the threshold is a simple `u32`; complex rule evaluation lives off-chain in Convex/frontend
- Token support (SOL only for v1)
- Mainnet deployment
- Anchor test suite (time constraint)

## Decisions

### D1: Single-file program (`lib.rs`) vs. module split

**Decision:** Single `lib.rs` for the hackathon.  
**Rationale:** Anchor programs are small enough that a single file is readable. Splitting into modules adds scaffolding overhead without benefit at this stage.  
**Alternative:** `instructions/`, `state/`, `error.rs` modules — deferred post-hackathon.

### D2: Contract versioning — doubly linked list of PDAs vs. single account with Vec

**Decision:** Each contract version is a separate `ContractNode` PDA seeded by `[b"contract", treasury_pubkey, version_number_as_le_bytes]`.  
**Rationale:** Solana accounts have a 10 MB max; a Vec of hashes would grow unboundedly. PDAs are composable and browsable independently. The treasury stores only `active_version` (u64) and `contract_count` (u64) as the list head/tail pointers.  
**Alternative:** Single account with `Vec<[u8;32]>` — ruled out due to growth limits and reallocation cost.

### D3: Auto-execute on final approval vs. separate `execute` instruction

**Decision:** Auto-execute inside `approve_proposal` when approval count reaches threshold.  
**Rationale:** The spec requires "funds transfer immediately and irreversibly" once threshold is met. A separate instruction introduces a window where execution could be delayed or front-run.  
**Trade-off:** The `approve_proposal` instruction must receive the `recipient` account (needed for the SOL transfer). This is fine since the recipient is stored on the proposal.

### D4: SOL transfer from PDA — lamport manipulation vs. system_program::transfer

**Decision:** Direct lamport manipulation (`treasury.sub_lamports(amount)` / `recipient.add_lamports(amount)`) for the PDA → external transfer.  
**Rationale:** `system_program::transfer` with `invoke_signed` requires the treasury PDA to be a `system_program`-owned account. PDAs that hold SOL and data must retain their Anchor discriminator; direct lamport mutation is the standard Anchor pattern for this.

### D5: Approval threshold storage

**Decision:** `approval_threshold: u32` stored on the `Treasury` account, set at initialization.  
**Rationale:** Complex rule evaluation (role-based, tiered) requires the full contract JSON which lives in Convex. For the on-chain enforcement layer, a numeric threshold is sufficient. The off-chain layer validates proposals against the contract before they reach the chain.

### D6: Member list — dynamic with realloc

**Decision:** `members: Vec<Pubkey>` on the `Treasury` account using Anchor's `realloc` constraint when adding members.  
**Rationale:** Members must always be addable post-initialization (e.g., when a new person joins the group). Using `realloc` allows the account to grow without creating a separate members PDA, keeping reads simple.

### D7: Cancel proposal authorization

**Decision:** Only the original proposer can cancel a proposal.  
**Rationale:** The spec explicitly grants cancellation rights to the proposer. Allowing the treasury authority to cancel would undermine the trustless nature of the system — no single party should be able to unilaterally block a proposal that members are actively voting on.

### D8: Playground wallet for devnet

**Decision:** Generate a local keypair file (`playground-keypair.json`, gitignored) used as the Anchor wallet for devnet deployment and as the payer in development.  
**Rationale:** Gives the team a shared, reproducible devnet identity for deploying and testing the program without requiring individual wallet configuration. Airdrop SOL to this address for deploy fees.

## Risks / Trade-offs

- **Auto-execute couples voting and fund transfer** → The `approve_proposal` context must include the `recipient` account. If recipient is wrong at proposal time it can't be corrected after threshold.  
  _Mitigation:_ Proposer can cancel before threshold; recipient is validated against the stored pubkey at execution time.

- **Realloc on add_member** → Each member addition requires a realloc CPI and the payer to cover rent. Caller must pass enough lamports.  
  _Mitigation:_ Anchor's `realloc` + `realloc_payer` handles this automatically; document the requirement in the frontend integration.

- **Lamport manipulation bypasses system program ownership check** → This is intentional and safe for Anchor PDAs that own themselves, but requires the treasury never to be reassigned.

- **No rejection threshold** → Proposals can sit `Pending` indefinitely if the group never votes. Only the proposer can cancel.  
  _Mitigation:_ Off-chain Convex layer can surface stale proposals. Future work: expiry via clock sysvar.

## Migration Plan

1. Generate playground keypair: `solana-keygen new -o playground-keypair.json`
2. Airdrop devnet SOL: `solana airdrop 2 <pubkey> --url devnet`
3. `anchor build` → generates IDL at `target/idl/treasury.json`
4. `anchor deploy --provider.cluster devnet` → records Program ID
5. Update `Anchor.toml` and frontend env (`VITE_PROGRAM_ID`) with the deployed Program ID
6. No data migration (net-new program)

**Rollback:** Deploy a new program version; old proposals on the old program ID are inert.

## Open Questions

- None outstanding — all decisions above are settled for v1 scope.
