## ADDED Requirements

### Requirement: Form includes recipient wallet and optional URL

The form SHALL include a required recipient wallet address field and an optional URL/note field in addition to the existing description, category, and amount fields.

#### Scenario: Recipient wallet required

- **WHEN** user submits without a recipient wallet address
- **THEN** the Validate button remains disabled and an inline error is shown

#### Scenario: URL is optional

- **WHEN** user submits without filling in the URL field
- **THEN** the proposal is submitted successfully with `url` absent from the record

### Requirement: Submit-time pool balance guard

Before sending the Anchor transaction the form SHALL fetch the total on-chain treasury balance and block submission if the requested amount (in lamports) exceeds it.

#### Scenario: Amount exceeds treasury balance

- **WHEN** user enters an amount greater than the current treasury balance
- **THEN** an inline error "Insufficient treasury funds" is shown and the submit button is disabled

#### Scenario: Amount within treasury balance

- **WHEN** user enters an amount less than or equal to the treasury balance
- **THEN** no balance error is shown and submission is allowed

### Requirement: On-chain create_proposal instruction

After passing the balance guard the form SHALL build and send the Anchor `create_proposal` instruction and wait for confirmation before calling the Convex `createProposal` mutation.

#### Scenario: Anchor tx succeeds

- **WHEN** the Anchor `create_proposal` transaction confirms
- **THEN** the Convex `createProposal` mutation is called and the user is navigated to the transactions page

#### Scenario: Anchor tx fails

- **WHEN** the Anchor `create_proposal` transaction is rejected or errors
- **THEN** the Convex mutation is NOT called and an inline error is displayed

### Requirement: Disabled state when no active contract

The form SHALL be disabled and show an explanatory message when the pool has no active contract.

#### Scenario: No active contract

- **WHEN** the pool status is not "active"
- **THEN** the Validate button is disabled and a message explains that a contract is required
