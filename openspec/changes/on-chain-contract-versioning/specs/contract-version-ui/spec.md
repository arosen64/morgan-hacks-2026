## ADDED Requirements

### Requirement: Active contract displayed on pool dashboard

The system SHALL display the active contract's fields on the pool dashboard once a contract exists.

#### Scenario: Active contract rendered

- **WHEN** a user views the pool dashboard and the pool status is `active`
- **THEN** the dashboard SHALL display the active contract's name, version number, allowed transaction types, approval rules summary, and budget limits

#### Scenario: No contract yet

- **WHEN** a user views the pool dashboard and pool status is `pre-contract`
- **THEN** the dashboard SHALL show the pre-contract status banner (already implemented) instead of contract fields

### Requirement: Contract creation flow accessible from dashboard

The system SHALL provide a contract creation page reachable from the "Create Contract" CTA on the dashboard.

#### Scenario: Manager navigates to contract creation

- **WHEN** a manager clicks "Create Contract" on the dashboard
- **THEN** the user is taken to a contract creation form

#### Scenario: Contract creation form submits and confirms

- **WHEN** a manager submits the contract creation form with valid input
- **THEN** the contract JSON is hashed, the Solana transaction is signed and sent, Convex is updated, and the user is returned to the dashboard now showing the active contract

### Requirement: Contract version history browsable in UI

The system SHALL provide a contract history view where all versions are listed and each version's full JSON is viewable.

#### Scenario: Version list displayed

- **WHEN** a user navigates to the contract history view
- **THEN** all versions are listed with version number, creation date, and hash (truncated)

#### Scenario: Previous version viewable

- **WHEN** a user selects a previous version from the history list
- **THEN** the full contract JSON for that version is displayed, clearly labeled as a historical (inactive) version

#### Scenario: Active version highlighted

- **WHEN** the version history is displayed
- **THEN** the currently active version SHALL be visually distinguished from historical versions
