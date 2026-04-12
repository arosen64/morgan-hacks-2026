## ADDED Requirements

### Requirement: Amendment approval defaults to unanimous

When no `amendmentApprovalRule` is configured on a group, the system SHALL require all active members to approve any amendment to the group's contract or rules.

#### Scenario: Amendment submitted with no override rule configured

- **WHEN** a member submits an amendment and the group has no `amendmentApprovalRule`
- **THEN** the system SHALL apply a `unanimous` rule requiring all active members to approve

#### Scenario: Amendment reaches unanimous approval

- **WHEN** all active group members have approved an amendment
- **THEN** the system SHALL transition the amendment proposal to `approved`

### Requirement: Group can override the default amendment approval rule

A group admin SHALL be able to set an explicit `amendmentApprovalRule` on the group that overrides the unanimous default for amendments. Any valid `ApprovalRule` variant is accepted.

#### Scenario: Group admin sets a k-of-n amendment rule

- **WHEN** a group admin saves `amendmentApprovalRule: { type: "k-of-n", k: 3, n: 5 }`
- **THEN** subsequent amendments SHALL require 3 of 5 members to approve instead of unanimous

#### Scenario: Group admin clears the amendment rule override

- **WHEN** a group admin removes the `amendmentApprovalRule` field
- **THEN** the system SHALL revert to requiring unanimous approval for amendments

### Requirement: Amendment approval rule is evaluated independently from transaction approval rule

The system SHALL use `amendmentApprovalRule` (or unanimous default) for amendment proposals and `approvalRule` for transaction proposals, evaluating them separately.

#### Scenario: Different rules for transactions and amendments

- **WHEN** a group has a `k-of-n` transaction rule and no `amendmentApprovalRule`
- **THEN** transactions SHALL require k-of-n approval and amendments SHALL require unanimous approval
