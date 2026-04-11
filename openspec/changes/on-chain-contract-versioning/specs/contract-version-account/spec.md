## ADDED Requirements

### Requirement: ContractVersion PDA stores hash and linked list pointers

The Solana program SHALL define a `ContractVersion` account type (PDA) that stores the SHA-256 hash of the contract JSON, the previous version hash, the next version hash, and the version number.

#### Scenario: First version created

- **WHEN** `initialize_contract` is called with a valid hash for a pool with no existing contract
- **THEN** a `ContractVersion` PDA is created with `prev_hash` set to zero bytes, `next_hash` set to zero bytes, and `version_number` set to 1

#### Scenario: Subsequent version appended

- **WHEN** `append_contract_version` is called with a new hash
- **THEN** a new `ContractVersion` PDA is created with `prev_hash` pointing to the previously active version's hash and `next_hash` set to zero bytes

#### Scenario: Previous version linked forward

- **WHEN** `append_contract_version` is called
- **THEN** the previously active `ContractVersion` account SHALL have its `next_hash` updated to point to the new version's hash

### Requirement: Pool account tracks active contract hash and version count

The Solana `Pool` account SHALL store `active_contract_hash` (32 bytes) and `version_count` (u32).

#### Scenario: Active hash updated on initialize

- **WHEN** `initialize_contract` is called successfully
- **THEN** `Pool.active_contract_hash` is set to the new version's hash and `Pool.version_count` is incremented to 1

#### Scenario: Active hash updated on amendment

- **WHEN** `append_contract_version` is called successfully
- **THEN** `Pool.active_contract_hash` is updated to the new version's hash and `Pool.version_count` is incremented

### Requirement: ContractVersion PDA is deterministically addressed

Each `ContractVersion` PDA SHALL be seeded by the pool public key and the version number, making it deterministically locatable by any client.

#### Scenario: PDA derived from pool and version number

- **WHEN** a client wants to fetch version N of a pool's contract
- **THEN** the PDA address SHALL be derivable using `[pool_pubkey, version_number_as_le_bytes]` as seeds
