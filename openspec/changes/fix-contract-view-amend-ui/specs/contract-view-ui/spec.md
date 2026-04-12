## ADDED Requirements

### Requirement: Contract fields render in labeled, human-readable sections

The system SHALL render each contract field in a distinct, labeled section using shadcn/ui Card components and Tailwind CSS. No raw JSON, `<pre>` blocks, curly braces, or bracket characters SHALL appear in the user-facing contract display.

#### Scenario: Members section renders as a list

- **WHEN** a contract with a `members` array is displayed
- **THEN** each member is shown with their name, a role badge (Manager / Member), and a truncated wallet address — no raw JSON

#### Scenario: Contribution rules render as readable text

- **WHEN** a contract with `contribution_rules` is displayed
- **THEN** the label "Contribution Rules" and the rule text are shown as a labeled field — no quotes or JSON syntax

#### Scenario: Distribution rules render as readable text

- **WHEN** a contract with `distribution_rules` is displayed
- **THEN** the label "Distribution Rules" and the rule text are shown as a labeled field

#### Scenario: Allowed transaction types render as badges

- **WHEN** a contract with `allowed_transaction_types` array is displayed
- **THEN** each type is shown as a capitalized badge/chip — no square brackets or quotes visible

#### Scenario: Approval rules render as readable sentences

- **WHEN** a contract with `approval_rules` containing `default` and `amendment` keys is displayed
- **THEN** each rule is shown with a human-readable label (e.g. "Default Approval: Unanimous" or "Default Approval: 2 of 3") — no raw object syntax

#### Scenario: Budget limits render with units

- **WHEN** a contract with `budget_limits.per_transaction_max_sol` is displayed
- **THEN** the label "Max per Transaction" and the value with "SOL" unit are shown — no nested object syntax

### Requirement: Contract header shows version and creation date

The system SHALL display the contract version number and creation date prominently in a header area above the contract fields.

#### Scenario: Version number is visible

- **WHEN** a contract is displayed
- **THEN** a version badge or label showing "Version N" is visible in the header

#### Scenario: Creation date is human-readable

- **WHEN** a contract with a `createdAt` timestamp is displayed
- **THEN** the date is shown in a human-readable locale format (e.g. "Apr 12, 2026") — not a raw Unix timestamp

### Requirement: Contract display is responsive

The system SHALL render the contract display correctly on both mobile and desktop viewport widths using responsive Tailwind classes.

#### Scenario: Layout adapts on small screens

- **WHEN** the contract is viewed on a mobile-width screen (< 640px)
- **THEN** all sections stack vertically without overflow or horizontal scroll

### Requirement: ContractDisplay component is shared across creation and amend pages

The system SHALL use a single `ContractDisplay` component (in `src/components/ContractDisplay.tsx`) for rendering contract data in both the contract creation preview and the amend contract preview.

#### Scenario: Creation page preview uses ContractDisplay

- **WHEN** a contract is generated on the creation page and the preview is shown
- **THEN** the preview uses `ContractDisplay` — not the old generic `ContractFieldView`

#### Scenario: Amend page previews use ContractDisplay

- **WHEN** the current contract or the amended contract preview is shown on the amend page
- **THEN** both use `ContractDisplay` — not the old generic `ContractFieldView`
