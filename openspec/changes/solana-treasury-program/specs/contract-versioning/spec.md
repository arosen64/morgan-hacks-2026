## ADDED Requirements

### Requirement: Set initial contract

The program SHALL allow any treasury member to set the first contract version by calling `set_contract` with a 32-byte hash (SHA-256 of the full contract JSON stored in Convex). This creates a `ContractNode` PDA and marks `has_contract = true` on the treasury. Before `has_contract` is `true`, no spending proposals may be submitted.

#### Scenario: Member sets first contract

- **WHEN** any treasury member calls `set_contract` with a valid 32-byte hash and `has_contract` is currently `false`
- **THEN** a `ContractNode` PDA is created at version 1, the treasury's `active_contract_hash` and `active_version` are updated, `contract_count` becomes 1, and `has_contract` becomes `true`

#### Scenario: Contract already set

- **WHEN** `set_contract` is called and `has_contract` is already `true`
- **THEN** the instruction fails with `ContractAlreadySet`

#### Scenario: Non-member caller rejected

- **WHEN** a signer not in the treasury's members list calls `set_contract`
- **THEN** the instruction fails with `Unauthorized`

### Requirement: Contract version doubly linked list

Each contract version SHALL be stored as a separate `ContractNode` PDA seeded by `["contract", treasury_pubkey, version_as_u64_le]`. Each node SHALL store: its version number, the 32-byte hash, the previous version number (`prev_version`, `0` if head), the next version number (`next_version`, `0` if tail), and boolean flags `has_prev` / `has_next`. The treasury stores `contract_count` (total versions ever created), `active_version` (currently governing version), and `active_contract_hash`.

#### Scenario: Linked list structure after first version

- **WHEN** the first contract is set
- **THEN** `ContractNode` v1 has `has_prev = false`, `has_next = false`, `prev_version = 0`, `next_version = 0`

#### Scenario: Linked list structure after new version appended

- **WHEN** a second contract version is appended
- **THEN** `ContractNode` v1 has `has_next = true`, `next_version = 2`; `ContractNode` v2 has `has_prev = true`, `prev_version = 1`, `has_next = false`

### Requirement: Contract amendment (new version)

The program SHALL allow any treasury member to propose appending a new contract version by submitting a `ProposalType::AmendContract { new_hash: [u8; 32] }` proposal. The proposal follows the treasury's approval threshold via the standard proposal lifecycle. When the threshold is reached, a new `ContractNode` PDA is created, the previous tail node's `next_version` pointer is updated, and the treasury's `active_contract_hash` and `active_version` are updated. All prior versions remain accessible. Requires `has_contract = true`.

#### Scenario: Amendment proposal approved

- **WHEN** an `AmendContract` proposal reaches the approval threshold
- **THEN** a new `ContractNode` is appended, the previous tail's `has_next` and `next_version` are updated, and `active_version` and `active_contract_hash` on the treasury reflect the new version

#### Scenario: Amendment without initial contract

- **WHEN** an `AmendContract` proposal is submitted and `has_contract` is `false`
- **THEN** the instruction fails with `ContractNotSet`

### Requirement: Switch active contract version

The program SHALL allow any treasury member to propose switching the active contract to any existing version (forward or backward in the linked list) by submitting a `ProposalType::SwitchContract { target_version: u64 }` proposal. The proposal follows the treasury's approval threshold. When approved, `treasury.active_version` and `treasury.active_contract_hash` are updated to the target version's values. No nodes are added or removed from the linked list. Requires `has_contract = true`.

#### Scenario: Switch to previous version approved

- **WHEN** a `SwitchContract` proposal targeting an earlier version reaches the approval threshold
- **THEN** `active_version` is set to the target version number and `active_contract_hash` is set to that node's hash

#### Scenario: Switch to non-existent version rejected

- **WHEN** a `SwitchContract` proposal targets a version number outside `[1, contract_count]`
- **THEN** the instruction fails with `InvalidContractVersion`

#### Scenario: Any member can propose a switch

- **WHEN** any treasury member submits a `SwitchContract` proposal
- **THEN** the proposal is created and enters the standard approval flow

### Requirement: Proposal gated by active contract

The program SHALL reject any spending proposal submitted when `has_contract = false` on the treasury.

#### Scenario: Proposal blocked without contract

- **WHEN** a member calls `propose_transaction` and `has_contract = false`
- **THEN** the instruction fails with `ContractNotSet`

#### Scenario: Proposal allowed with contract

- **WHEN** a member calls `propose_transaction` and `has_contract = true`
- **THEN** the proposal proceeds normally
