## MODIFIED Requirements

### Requirement: Pool status tracks contract readiness

The system SHALL track whether a pool has an active contract via a `status` field (`pre-contract` | `active`) AND an `activeContractHash` field. Transactions SHALL be blocked on pools in `pre-contract` status.

#### Scenario: New pool starts in pre-contract status

- **WHEN** a pool is created
- **THEN** its status SHALL be `pre-contract` and `activeContractHash` SHALL be null

#### Scenario: Pool transitions to active after contract creation

- **WHEN** a contract is successfully committed for a pool (on-chain confirmed + Convex updated)
- **THEN** the pool's `status` SHALL transition to `active` and `activeContractHash` SHALL be set to the new contract hash

#### Scenario: Pool activeContractHash updated on amendment

- **WHEN** a new contract version is appended via amendment
- **THEN** `activeContractHash` SHALL be updated to the new version's hash while `status` remains `active`
