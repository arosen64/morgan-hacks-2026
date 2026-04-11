## ADDED Requirements

### Requirement: Member can join a pool

The system SHALL allow a user to register as a member of a pool by providing a unique name and a Solana wallet address. The member SHALL be assigned a role of `manager` or `member`.

#### Scenario: Successful member join

- **WHEN** a user submits a valid name and wallet address for a pool they are not yet a member of
- **THEN** a new member record is created in Convex with the name, wallet, role, and pool association

#### Scenario: Duplicate name rejected

- **WHEN** a user submits a name that already exists within the same pool
- **THEN** the system SHALL reject the request with an error indicating the name is taken

#### Scenario: Duplicate wallet rejected

- **WHEN** a user submits a wallet address that is already registered in the same pool
- **THEN** the system SHALL reject the request with an error indicating the wallet is already a member

### Requirement: Pool creator is auto-registered as manager

The system SHALL automatically add the pool creator as a member with role `manager` using their connected wallet address when a pool is created.

#### Scenario: Pool creation auto-registers founder

- **WHEN** a user creates a new pool
- **THEN** they are automatically added to the pool's member registry as `manager` with their connected wallet

### Requirement: Name-to-wallet resolution

The system SHALL provide a lookup function that resolves a member name to their wallet address within a given pool.

#### Scenario: Name resolves to wallet

- **WHEN** an approval rule engine requests the wallet for a given member name in a pool
- **THEN** the system SHALL return the corresponding wallet address

#### Scenario: Unknown name returns error

- **WHEN** a name that does not exist in the pool's member registry is looked up
- **THEN** the system SHALL return an error indicating the member was not found

### Requirement: Member list query

The system SHALL expose a Convex query to retrieve all members of a given pool.

#### Scenario: Members listed for a pool

- **WHEN** a client queries members for a pool
- **THEN** the system SHALL return all members with their name, wallet, and role

### Requirement: Member data available for contract JSON generation

The system SHALL provide the current member list in the format required by the contract JSON schema so that it can be passed to Gemini when the contract is formalized.

#### Scenario: Member list provided for contract creation

- **WHEN** the contract creation flow requests the pool's member list
- **THEN** the system SHALL return members as an array of `{name, wallet, role}` objects matching the contract JSON schema

#### Scenario: Contract creation blocked with no members

- **WHEN** a pool has no registered members (other than the auto-added founder)
- **THEN** contract creation MAY proceed (founder alone is sufficient to start)

### Requirement: Pool status tracks contract readiness

The system SHALL track whether a pool has an active contract via a `status` field (`pre-contract` | `active`). Transactions SHALL be blocked on pools in `pre-contract` status.

#### Scenario: New pool starts in pre-contract status

- **WHEN** a pool is created
- **THEN** its status SHALL be `pre-contract`

#### Scenario: Pool transitions to active after contract creation

- **WHEN** a contract is successfully created for a pool
- **THEN** the pool's status SHALL transition to `active`
