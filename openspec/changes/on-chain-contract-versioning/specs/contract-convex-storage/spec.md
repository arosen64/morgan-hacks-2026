## ADDED Requirements

### Requirement: Convex stores full contract JSON keyed by hash

The system SHALL maintain a `contracts` table in Convex DB that stores the full contract JSON for each version, keyed by its SHA-256 hash, along with linked list pointers mirroring the on-chain structure.

#### Scenario: Contract record created on initialization

- **WHEN** the first contract version is committed on-chain
- **THEN** a record SHALL be inserted into Convex `contracts` with `poolId`, `hash`, `versionNumber: 1`, `contractJson`, `prevHash: null`, `nextHash: null`, and `createdAt`

#### Scenario: Contract record created on amendment

- **WHEN** a new contract version is appended on-chain
- **THEN** a new record SHALL be inserted into Convex `contracts` and the previous version's `nextHash` field SHALL be updated to point to the new hash

### Requirement: Contract JSON retrievable by hash

The system SHALL provide a Convex query to fetch a contract version's full JSON by its hash.

#### Scenario: Fetch by hash succeeds

- **WHEN** a client queries for a contract version by hash
- **THEN** the system SHALL return the full `contractJson` and metadata for that version

#### Scenario: Unknown hash returns null

- **WHEN** a hash is queried that does not exist in Convex
- **THEN** the system SHALL return null

### Requirement: All contract versions for a pool are queryable

The system SHALL provide a Convex query that returns all contract versions for a given pool, ordered by version number.

#### Scenario: Version history listed

- **WHEN** a client queries contract versions for a pool
- **THEN** the system SHALL return all versions in ascending version number order with hash, versionNumber, prevHash, nextHash, and createdAt

### Requirement: Pool activeContractHash kept in sync in Convex

The Convex `pools` table SHALL gain an `activeContractHash` field that is updated whenever a new contract version is committed, so the UI can reactively reflect the current contract without polling Solana.

#### Scenario: activeContractHash set on first contract

- **WHEN** the first contract is committed
- **THEN** `pools.activeContractHash` SHALL be set to the new hash and `pools.status` SHALL transition to `active`

#### Scenario: activeContractHash updated on amendment

- **WHEN** a new contract version is appended
- **THEN** `pools.activeContractHash` SHALL be updated to the new hash

### Requirement: Contract JSON is canonicalized before hashing

The system SHALL canonicalize the contract JSON (alphabetically sorted keys, no extra whitespace) before computing the SHA-256 hash, ensuring the same logical contract always produces the same hash.

#### Scenario: Canonical hash is deterministic

- **WHEN** the same contract object is hashed twice (with keys in different orders)
- **THEN** both hashes SHALL be identical
