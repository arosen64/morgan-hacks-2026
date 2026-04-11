## ADDED Requirements

### Requirement: Contract version persisted in Convex

The system SHALL store a contract version record in Convex whenever a new contract version is created. Each record SHALL include the full Tiptap JSON content, a version hash string, the previous version hash (or null for v1), the next version hash (null until superseded), a pool ID, a version number, and a creation timestamp.

#### Scenario: First contract version stored

- **WHEN** `storeContractVersion` is called with Tiptap JSON content and no previous version
- **THEN** a new record is created in `contractVersions` with `version: 1`, `prevVersionHash: null`, `nextVersionHash: null`, and a generated `versionHash`

#### Scenario: Subsequent contract version stored

- **WHEN** `storeContractVersion` is called with Tiptap JSON content and a `prevVersionHash`
- **THEN** a new record is created with `version` incremented by 1, `prevVersionHash` set to the provided hash, and `nextVersionHash: null`
- **THEN** the previous version record's `nextVersionHash` is updated to the new record's `versionHash`

### Requirement: Version hash is a unique opaque string

The system SHALL assign each contract version a `versionHash` string that uniquely identifies it. During development (before Solana integration), this SHALL be generated as a UUID via `crypto.randomUUID()`.

#### Scenario: Hash generated on store

- **WHEN** `storeContractVersion` is called
- **THEN** the stored record has a non-empty `versionHash` string

### Requirement: Active version queryable

The system SHALL provide a query `getActiveContractVersion(poolId)` that returns the contract version with `nextVersionHash: null` for the given pool (the latest version).

#### Scenario: Active version returned

- **WHEN** `getActiveContractVersion` is called with a valid poolId
- **THEN** the record with `nextVersionHash: null` for that pool is returned

#### Scenario: No contract exists

- **WHEN** `getActiveContractVersion` is called for a pool with no contract
- **THEN** null is returned

### Requirement: Version lookup by hash

The system SHALL provide a query `getContractVersionByHash(versionHash)` that returns the contract version record matching the given hash.

#### Scenario: Existing hash lookup

- **WHEN** `getContractVersionByHash` is called with a valid hash
- **THEN** the matching record is returned

#### Scenario: Unknown hash lookup

- **WHEN** `getContractVersionByHash` is called with a hash that does not exist
- **THEN** null is returned

### Requirement: All versions listable by pool

The system SHALL provide a query `listContractVersions(poolId)` that returns all contract versions for a pool ordered by version number ascending.

#### Scenario: Multiple versions listed

- **WHEN** `listContractVersions` is called for a pool with 3 versions
- **THEN** all 3 records are returned in ascending version order
