## ADDED Requirements

### Requirement: Join creates a pending membership

When a user submits the join pool form, the system SHALL create a `members` record with `status: "pending"` instead of immediately granting active access.

#### Scenario: New user joins via pool ID

- **WHEN** a user submits a valid pool ID and their display name in the join flow
- **THEN** a `members` record is created with `status: "pending"`, `role: "member"`, and the user is shown a "waiting for approval" screen

#### Scenario: Duplicate wallet join attempt

- **WHEN** a user whose wallet already exists in the pool (pending or active) attempts to join
- **THEN** the mutation throws an error and no duplicate record is created

### Requirement: Pending user cannot access the pool dashboard

A user with `status: "pending"` SHALL be blocked from viewing the pool dashboard and shown a waiting-for-approval message instead.

#### Scenario: Pending user navigates to pool

- **WHEN** a user with a pending membership opens the pool page
- **THEN** the pool dashboard is NOT shown; a "Your request is pending manager approval" message is displayed

#### Scenario: Active user accesses pool normally

- **WHEN** a user with `status: "active"` (or no status field, for backward compat) opens the pool page
- **THEN** the full pool dashboard is rendered as before

### Requirement: Manager sees pending requests on the dashboard

Pool managers SHALL see a "Pending Requests" section in the pool dashboard listing all users with `status: "pending"`.

#### Scenario: Manager views dashboard with pending requests

- **WHEN** there are one or more pending members in the pool and the current user is a manager
- **THEN** a "Pending Requests" card is displayed above the members list, showing each pending user's name and wallet address

#### Scenario: No pending requests

- **WHEN** there are no pending members
- **THEN** the "Pending Requests" card is hidden (not rendered)

#### Scenario: Non-manager does not see pending requests section

- **WHEN** the current user is a regular member (role: "member")
- **THEN** the "Pending Requests" card is not rendered

### Requirement: Manager can accept a pending join request

A manager SHALL be able to accept a pending request, promoting the user to an active member.

#### Scenario: Successful accept

- **WHEN** a manager clicks the "Accept" button next to a pending request
- **THEN** the `members` record is updated to `status: "active"` and the user disappears from the Pending Requests list

#### Scenario: Non-manager attempts to accept

- **WHEN** a non-manager calls the accept mutation directly
- **THEN** the mutation throws an authorization error and the record is unchanged

### Requirement: Manager can reject a pending join request

A manager SHALL be able to reject a pending request, deleting the pending record.

#### Scenario: Successful reject

- **WHEN** a manager clicks the "Reject" button next to a pending request
- **THEN** the `members` record is deleted and the user disappears from the Pending Requests list

#### Scenario: Non-manager attempts to reject

- **WHEN** a non-manager calls the reject mutation directly
- **THEN** the mutation throws an authorization error and the record is unchanged

### Requirement: Invite Members button shows pool ID

The "Invite Members" action button on the pool dashboard SHALL open a modal displaying the pool ID, with a copy-to-clipboard control.

#### Scenario: Manager clicks Invite Members

- **WHEN** any member (manager or otherwise) clicks the "Invite Members" button
- **THEN** a modal opens showing the pool ID and a "Copy" button

#### Scenario: Copy pool ID to clipboard

- **WHEN** the user clicks the "Copy" button in the Invite Members modal
- **THEN** the pool ID is copied to the system clipboard and the button label changes to "Copied!" briefly
