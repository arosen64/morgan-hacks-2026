## ADDED Requirements

### Requirement: Transaction proposals blocked until active contract exists

The Solana program SHALL reject any `propose_transaction` instruction if `Pool.active_contract_hash` is all zero bytes (i.e., no contract has been initialized).

#### Scenario: Proposal blocked on pre-contract pool

- **WHEN** `propose_transaction` is called on a pool where `active_contract_hash` is zero
- **THEN** the instruction SHALL return an error and the proposal SHALL NOT be created

#### Scenario: Proposal allowed after contract initialized

- **WHEN** `propose_transaction` is called on a pool where `active_contract_hash` is non-zero
- **THEN** the instruction SHALL proceed normally

### Requirement: initialize_contract callable only once per pool

The `initialize_contract` instruction SHALL only succeed if `Pool.version_count` is 0, preventing accidental re-initialization.

#### Scenario: Second initialize rejected

- **WHEN** `initialize_contract` is called on a pool that already has `version_count > 0`
- **THEN** the instruction SHALL return an error

### Requirement: append_contract_version restricted to managers

The `append_contract_version` instruction SHALL only succeed if the transaction signer's public key matches a manager wallet registered for that pool.

#### Scenario: Non-manager append rejected

- **WHEN** `append_contract_version` is called by a wallet that is not a registered manager
- **THEN** the instruction SHALL return an error

#### Scenario: Manager append succeeds

- **WHEN** `append_contract_version` is called by a registered manager wallet
- **THEN** the instruction SHALL succeed and the new version SHALL be linked
