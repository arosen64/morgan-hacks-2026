## ADDED Requirements

### Requirement: Amendment creates a proposal

Submitting an amendment no longer commits immediately — it creates a pending proposal.

#### Scenario: Proposer vote is auto-cast

- **WHEN** an amendment proposal is created
- **THEN** an approve vote is immediately recorded for the proposer

#### Scenario: Solo pool auto-commits

- **WHEN** the proposer is the only active member
- **THEN** unanimous approval is reached immediately and the contract is committed in the same operation

### Requirement: Unanimous approval triggers commit

The contract version is written only when all active members have voted approve.

#### Scenario: All members approve

- **WHEN** the last remaining member casts an approve vote on an amendment proposal
- **THEN** the proposal status becomes "approved" and the new contract version is committed

#### Scenario: Any member rejects

- **WHEN** any member casts a reject vote and quorum can no longer be reached
- **THEN** the proposal status becomes "rejected" and the contract is unchanged

### Requirement: Pending amendments visible in Contract History

Members can see and vote on pending amendment proposals from the Contract History page.

#### Scenario: Pending proposals appear at top

- **WHEN** there are pending amendment proposals
- **THEN** they appear above committed versions with a "Pending Vote" badge, tally, and approve/reject buttons

#### Scenario: Already-voted member sees their vote

- **WHEN** a member has already voted on a pending amendment
- **THEN** their vote is shown and the voting buttons are disabled
