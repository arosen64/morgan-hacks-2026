## ADDED Requirements

### Requirement: Group stores a typed ApprovalRule
Each group SHALL store an `approvalRule` field containing a discriminated union that defines how transactions are approved. Supported variants: `k-of-n`, `named-set`, `role-based`, `unanimous`, `tiered`.

#### Scenario: Group created without explicit rule defaults to unanimous
- **WHEN** a group is created without specifying an `approvalRule`
- **THEN** the system SHALL treat the group as having a `unanimous` approval rule

#### Scenario: Group admin saves a k-of-n rule
- **WHEN** a group admin saves `{ type: "k-of-n", k: 2, n: 5 }`
- **THEN** the system SHALL store the rule and require any 2 of 5 members to approve transactions

#### Scenario: Group admin saves a named-set rule
- **WHEN** a group admin saves `{ type: "named-set", memberIds: ["alice", "bob"] }`
- **THEN** the system SHALL require all listed members to approve

#### Scenario: Group admin saves a role-based rule
- **WHEN** a group admin saves `{ type: "role-based", role: "manager" }`
- **THEN** the system SHALL require all members with the `manager` role to approve

#### Scenario: Group admin saves a unanimous rule
- **WHEN** a group admin saves `{ type: "unanimous" }`
- **THEN** the system SHALL require every active group member to approve

#### Scenario: Group admin saves a tiered rule
- **WHEN** a group admin saves a tiered rule with ordered amount tiers
- **THEN** the system SHALL apply the first tier whose `maxAmount` is ≥ the transaction amount

### Requirement: Approval rule is evaluated server-side at vote time
The system SHALL evaluate the group's `approvalRule` inside a Convex mutation each time a vote is cast, and SHALL NOT rely on client-supplied quorum calculations.

#### Scenario: Vote reaches quorum
- **WHEN** enough members have approved to satisfy the current rule
- **THEN** the system SHALL transition the proposal status from `pending` to `approved`

#### Scenario: Vote cannot reach quorum
- **WHEN** enough members have rejected such that quorum can no longer be reached
- **THEN** the system SHALL transition the proposal status from `pending` to `rejected`

#### Scenario: Vote does not yet reach quorum
- **WHEN** a vote is cast but quorum has not been reached and rejection is not final
- **THEN** the proposal SHALL remain in `pending` state

### Requirement: Named-set members must be active group members
The system SHALL validate that all `memberIds` in a `named-set` rule are active members of the group at the time the rule is saved.

#### Scenario: Named-set contains inactive member
- **WHEN** a group admin saves a named-set rule referencing a member who is not in the group
- **THEN** the system SHALL reject the save with an error

#### Scenario: Named-set member leaves group while proposal is pending
- **WHEN** a member referenced in an active named-set rule leaves the group
- **THEN** the system SHALL re-evaluate all pending proposals; proposals that can no longer reach quorum SHALL transition to `rejected`
