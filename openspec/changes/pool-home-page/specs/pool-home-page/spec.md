## ADDED Requirements

### Requirement: Potlock top nav

The pool home page SHALL render the same top navigation bar as `MainMenu`: Potlock logo (violet rounded square) and app name on the left, a "Disconnect" ghost button on the right.

#### Scenario: Nav renders on pool home page

- **WHEN** a user navigates from the main menu to a pool
- **THEN** the top nav shows the Potlock logo, "Potlock" text, and the Disconnect button

### Requirement: Pool name and role header

Below the top nav, the page SHALL display the pool name as a large heading and the user's role (Manager or Member) as a violet or secondary Badge.

#### Scenario: Manager views pool

- **WHEN** the connected wallet matches a member with role "manager"
- **THEN** the heading shows the pool name and a violet "Manager" badge

#### Scenario: Member views pool

- **WHEN** the connected wallet matches a member with role "member"
- **THEN** the heading shows the pool name and a secondary "Member" badge

#### Scenario: Pool data loading

- **WHEN** the pool query has not yet resolved
- **THEN** a Skeleton placeholder is shown in place of the pool name

### Requirement: Back navigation to main menu

The page SHALL provide a back control that returns the user to the main menu.

#### Scenario: User navigates back

- **WHEN** the user clicks the back arrow or "← Back" control
- **THEN** `onBack()` is called and the main menu is shown

### Requirement: Treasury balance card

The page SHALL display a Card showing the pool's treasury SOL balance.

#### Scenario: Balance placeholder shown

- **WHEN** the pool home page renders (before Add Money is implemented)
- **THEN** the balance section shows "—" with a label "Treasury Balance" and a note that live balance is available once Add Money is set up

### Requirement: Member contribution list

The page SHALL display a Card listing all pool members. Each row SHALL show the member's display name, wallet address truncated to first 4 + "…" + last 4 characters, contributed SOL amount, and role badge.

#### Scenario: Members list renders

- **WHEN** members data has loaded and the pool has at least one member
- **THEN** each member row shows: name, truncated wallet, contributed SOL (defaulting to "0 SOL" if `contributedLamports` is absent), and role badge

#### Scenario: Members loading

- **WHEN** the members query has not yet resolved
- **THEN** two Skeleton rows are shown in the members Card

#### Scenario: No members

- **WHEN** the pool has zero members
- **THEN** an empty state message is shown: "No members yet."

### Requirement: Action buttons grid

The page SHALL render a grid of five stub Buttons: "Request Transaction", "Contract", "All Transactions", "Add Money", "Invite Members". All buttons SHALL be clickable but are no-op stubs with no side effects.

#### Scenario: All five buttons visible

- **WHEN** any user views the pool home page
- **THEN** all five buttons are visible in a 2-column grid using `variant="outline"` styling consistent with the Potlock design system

### Requirement: Reactive data

All pool data and member data SHALL be fetched via Convex `useQuery` and update in real time without a page refresh.

#### Scenario: New member added while page is open

- **WHEN** a new member joins the pool while another user is viewing the pool home page
- **THEN** the new member appears in the list without any manual refresh
