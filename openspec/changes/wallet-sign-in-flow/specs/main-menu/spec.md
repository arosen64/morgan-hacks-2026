## ADDED Requirements

### Requirement: Main menu shown after wallet connection

The app SHALL display a main menu screen to connected users built with shadcn/ui `Card`, `Button`, and `Badge` components. The main menu is the default screen for authenticated users when no specific pool is selected.

#### Scenario: User lands on main menu after connecting wallet

- **WHEN** `connected` from `useWallet()` is true and no pool is selected
- **THEN** the main menu screen is displayed

### Requirement: Pool list shows all pools for the connected wallet

The main menu SHALL display a list of all pools the connected wallet belongs to, fetched via a Convex `getPoolsByWallet` query. Each pool row SHALL show the pool name and the user's role (manager or member) as a `Badge`.

#### Scenario: Connected wallet belongs to multiple pools

- **WHEN** the wallet is a member of one or more pools
- **THEN** each pool is shown as a row displaying the pool name and role badge

#### Scenario: Connected wallet belongs to no pools

- **WHEN** the wallet has no pool memberships
- **THEN** an empty state message is displayed (e.g., "You're not in any pools yet")

### Requirement: "Create Pool" button is present on the main menu

The main menu SHALL display a "Create Pool" `Button` (shadcn/ui). For this issue, the button does not need to navigate anywhere.

#### Scenario: Create Pool button is visible

- **WHEN** the main menu is displayed
- **THEN** a "Create Pool" button is visible on the screen

### Requirement: "Join Pool" button is present on the main menu

The main menu SHALL display a "Join Pool" `Button` (shadcn/ui). For this issue, the button does not need to navigate anywhere.

#### Scenario: Join Pool button is visible

- **WHEN** the main menu is displayed
- **THEN** a "Join Pool" button is visible on the screen

### Requirement: Backend query returns pools by wallet address

A Convex query `getPoolsByWallet` SHALL be added to `convex/members.ts`. It SHALL accept a `wallet` string argument, look up all `members` rows for that wallet using the `by_wallet` index, join each with its pool document, and return an array of `{ pool, role }` objects. The `members` table schema SHALL include a `by_wallet` index on the `wallet` field.

#### Scenario: Query returns pools for a wallet that is a member of multiple pools

- **WHEN** `getPoolsByWallet` is called with a wallet address that has two member records
- **THEN** the query returns two objects, each containing the pool document and the member's role

#### Scenario: Query returns empty array for unknown wallet

- **WHEN** `getPoolsByWallet` is called with a wallet address that has no member records
- **THEN** the query returns an empty array
