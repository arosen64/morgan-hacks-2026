## ADDED Requirements

### Requirement: Active contract rendered read-only

The system SHALL render the active contract version as a read-only rich text view (Tiptap read-only mode) on the contract history page.

#### Scenario: Active contract displayed

- **WHEN** a user navigates to the contract history page for a pool with an existing contract
- **THEN** the active contract's Tiptap JSON content is rendered in read-only mode
- **THEN** the current version number and version hash are displayed

#### Scenario: No contract exists

- **WHEN** a user navigates to the contract history page for a pool with no contract
- **THEN** a message is shown indicating no contract exists, with a link to create one

### Requirement: Navigate to previous version

The system SHALL allow a user to navigate to the previous contract version via a "Previous version" control, if one exists.

#### Scenario: Previous version available

- **WHEN** the displayed version has a non-null `prevVersionHash`
- **THEN** a "Previous version" button is shown
- **WHEN** the user clicks "Previous version"
- **THEN** the record matching `prevVersionHash` is fetched and rendered

#### Scenario: No previous version

- **WHEN** the displayed version has `prevVersionHash: null` (v1)
- **THEN** the "Previous version" button is disabled or hidden

### Requirement: Navigate to next version

The system SHALL allow a user to navigate to the next contract version via a "Next version" control, if one exists.

#### Scenario: Next version available

- **WHEN** the displayed version has a non-null `nextVersionHash`
- **THEN** a "Next version" button is shown
- **WHEN** the user clicks "Next version"
- **THEN** the record matching `nextVersionHash` is fetched and rendered

#### Scenario: No next version (active)

- **WHEN** the displayed version has `nextVersionHash: null` (active/latest)
- **THEN** the "Next version" button is disabled or hidden
- **THEN** the version is labeled as "Active"

### Requirement: Version metadata displayed

The system SHALL display version metadata alongside the contract content for each version viewed.

#### Scenario: Metadata shown

- **WHEN** any contract version is rendered in the history view
- **THEN** the version number, version hash, and creation timestamp are visible
