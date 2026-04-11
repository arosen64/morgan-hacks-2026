## ADDED Requirements

### Requirement: Join pool form

The system SHALL provide a UI form that allows a user to join a pool by entering their name and confirming their connected wallet address.

#### Scenario: Wallet pre-filled from adapter

- **WHEN** a user opens the join pool form with a wallet connected
- **THEN** the wallet address field SHALL be pre-filled with the connected wallet address

#### Scenario: Successful join via form

- **WHEN** a user submits the form with a valid name and the wallet address is confirmed
- **THEN** the member is registered and the user is redirected to the pool dashboard

#### Scenario: Join form shows validation error

- **WHEN** a user submits the form and the server rejects it (duplicate name or wallet)
- **THEN** the form SHALL display the error message inline without losing the user's input

#### Scenario: No wallet connected

- **WHEN** a user opens the join pool form without a wallet connected
- **THEN** the form SHALL prompt the user to connect their wallet before proceeding

### Requirement: Member list on pool dashboard

The system SHALL display all members of the pool on the pool dashboard, showing each member's name, role, and abbreviated wallet address.

#### Scenario: Member list renders

- **WHEN** a user views the pool dashboard
- **THEN** the member list SHALL show all registered members with name, role badge, and truncated wallet address

#### Scenario: Empty member list

- **WHEN** a pool has no members other than the auto-registered founder
- **THEN** only the founder is shown in the member list

### Requirement: Pool status indicator on dashboard

The dashboard SHALL display the pool's current status (`pre-contract` or `active`) so members know whether the pool is ready for transactions.

#### Scenario: Pre-contract status shown

- **WHEN** a user views a pool dashboard with status `pre-contract`
- **THEN** the dashboard SHALL display a visible indicator that no contract exists yet and transactions are not available

#### Scenario: Active status shown

- **WHEN** a user views a pool dashboard with status `active`
- **THEN** the dashboard SHALL display that the pool is active and transactions are available

### Requirement: Pre-contract call-to-action

When a pool is in `pre-contract` status, the dashboard SHALL prompt the manager to create a contract, providing a clear entry point into the contract creation flow.

#### Scenario: Manager sees create contract CTA

- **WHEN** a manager views the pool dashboard and the pool status is `pre-contract`
- **THEN** the dashboard SHALL show a prominent call-to-action to create the governing contract

#### Scenario: Non-manager sees waiting state

- **WHEN** a non-manager member views the pool dashboard and the pool status is `pre-contract`
- **THEN** the dashboard SHALL inform them that the pool is awaiting contract creation by a manager
