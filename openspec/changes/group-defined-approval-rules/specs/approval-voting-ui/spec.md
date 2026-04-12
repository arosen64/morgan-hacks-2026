## ADDED Requirements

### Requirement: Members can approve or reject a pending proposal

The UI SHALL display approve and reject buttons to group members for any proposal in `pending` status.

#### Scenario: Member approves a proposal

- **WHEN** a group member clicks the approve button on a pending proposal
- **THEN** the system SHALL record their approval vote and re-evaluate quorum

#### Scenario: Member rejects a proposal

- **WHEN** a group member clicks the reject button on a pending proposal
- **THEN** the system SHALL record their rejection vote and re-evaluate quorum

#### Scenario: Member has already voted

- **WHEN** a group member views a proposal they have already voted on
- **THEN** the approve and reject buttons SHALL be disabled and their existing vote SHALL be visually indicated

### Requirement: Vote tally is visible to all group members

The UI SHALL display the current vote tally (number of approvals, number of rejections, number of members yet to vote) in real time for all group members viewing a pending proposal.

#### Scenario: Tally updates after a vote is cast

- **WHEN** any group member casts a vote
- **THEN** all members currently viewing the proposal SHALL see the updated tally without refreshing

#### Scenario: Tally reflects rule-specific quorum progress

- **WHEN** a group uses a k-of-n rule requiring 2 of 5 approvals
- **THEN** the tally SHALL show "2 approvals needed" and update as votes come in

### Requirement: Proposal status transitions are reflected in the UI

The UI SHALL update the proposal display in real time when a proposal transitions from `pending` to `approved` or `rejected`.

#### Scenario: Proposal reaches quorum and is approved

- **WHEN** a proposal transitions to `approved`
- **THEN** the UI SHALL replace the voting controls with an "Approved" status badge and the approve/reject buttons SHALL no longer be shown

#### Scenario: Proposal is rejected

- **WHEN** a proposal transitions to `rejected`
- **THEN** the UI SHALL replace the voting controls with a "Rejected" status badge
