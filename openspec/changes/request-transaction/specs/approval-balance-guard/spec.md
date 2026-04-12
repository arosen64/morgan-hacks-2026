## ADDED Requirements

### Requirement: Vote resolution checks total treasury balance

When a vote would cause a transaction proposal to reach its approval threshold, the system SHALL fetch the total on-chain treasury PDA balance and reject the proposal if the balance is less than `proposal.amount` (in lamports).

#### Scenario: Treasury has sufficient funds at approval time

- **WHEN** the final approving vote is cast and `treasuryBalance >= proposal.amount`
- **THEN** the proposal status is set to `approved`

#### Scenario: Treasury has insufficient funds at approval time

- **WHEN** the final approving vote is cast and `treasuryBalance < proposal.amount`
- **THEN** the proposal status is set to `rejected` and `rejectionReason` is set to `"insufficient_funds"`

#### Scenario: Balance check only applies to transaction proposals

- **WHEN** the final approving vote is cast on an amendment proposal
- **THEN** no balance check is performed and the proposal is approved normally

### Requirement: Rejection reason visible in UI

When a proposal is rejected due to insufficient funds the transactions list SHALL display a "Insufficient funds" label so members understand why it was rejected.

#### Scenario: Rejected proposal with insufficient_funds reason

- **WHEN** a proposal has `status === "rejected"` and `rejectionReason === "insufficient_funds"`
- **THEN** the transactions list shows "Rejected — insufficient funds" instead of plain "Rejected"
