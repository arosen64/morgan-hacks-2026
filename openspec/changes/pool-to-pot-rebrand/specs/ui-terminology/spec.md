## ADDED Requirements

### Requirement: Main menu uses "pot" terminology

The main menu SHALL use the word "pot" / "Pot" / "Pots" for all user-visible labels that previously said "pool" / "Pool" / "Pools". The badge, heading, description, and CTA buttons SHALL all reflect this terminology.

#### Scenario: Main menu badge reads "Your Pots"

- **WHEN** the user views the main menu
- **THEN** the badge text SHALL read "Your Pots" (not "Investment Pools")

#### Scenario: Main menu heading uses "Pots"

- **WHEN** the user views the main menu
- **THEN** the page heading SHALL read "My Pots" (not "My Pools")

#### Scenario: Main menu description is investment-neutral

- **WHEN** the user views the main menu description
- **THEN** the description text SHALL NOT contain the words "invest" or "investment"

#### Scenario: CTA buttons use "Pot" labels

- **WHEN** the user views the main menu call-to-action buttons
- **THEN** the primary button SHALL read "+ Create Pot" (not "+ Create Pool")
- **THEN** the secondary button SHALL read "Join Pot" (not "Join Pool")

### Requirement: Create flow uses "pot" terminology

The pot creation flow SHALL use "pot" / "Pot" in all user-visible step headers and input labels.

#### Scenario: Create flow header reads "Create a Pot"

- **WHEN** the user opens the pot creation flow
- **THEN** the step header SHALL read "Create a Pot" (not "Create a Pool")

#### Scenario: Pot name input label uses "Pot"

- **WHEN** the user is on the pot details step of creation
- **THEN** the name field label SHALL read "Pot Name" (not "Pool Name")

### Requirement: Pot dashboard uses "pot" terminology

The pot dashboard SHALL use "Pot" as the fallback heading when no pot name is set.

#### Scenario: Dashboard heading fallback

- **WHEN** the user views a pot dashboard with no custom name
- **THEN** the heading SHALL read "Pot" (not "Pool")

### Requirement: Sign-in screen uses investment-neutral copy

The sign-in screen SHALL NOT frame the product around investing. All hero copy and descriptions SHALL use neutral, action-oriented language.

#### Scenario: Hero tagline is investment-neutral

- **WHEN** the user views the sign-in screen
- **THEN** the hero tagline SHALL NOT contain the words "invest" or "investment"
- **THEN** the tagline SHALL convey the core value proposition without investment framing

#### Scenario: Sign-in description is investment-neutral

- **WHEN** the user views the sign-in screen wallet connection prompt
- **THEN** the description SHALL NOT contain the words "invest" or "investment pools"
- **THEN** the description SHALL reference "pots" when referring to the user's Potlock groups

### Requirement: Empty state uses "pot" terminology

The empty state shown when a user has no pots SHALL use "pot" language.

#### Scenario: Empty state message uses "pots"

- **WHEN** the user has no pots and views the main menu
- **THEN** the empty state SHALL read "No pots yet" (not "No pools yet")
- **THEN** the supporting copy SHALL NOT reference "pools"

### Requirement: Internal identifiers are unchanged

Internal TypeScript identifiers, prop names, Convex table/field names, and component filenames SHALL NOT be renamed as part of this change.

#### Scenario: Props remain unchanged

- **WHEN** a developer inspects component props in the codebase
- **THEN** identifiers such as `poolId`, `onSelectPool`, `pools` SHALL remain as-is
- **THEN** only JSX string content and user-visible text SHALL differ from the previous version
