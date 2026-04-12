## ADDED Requirements

### Requirement: Amendment history displays as a readable versioned list

The contract history pages (`ContractHistoryPage.tsx`, `AmendContractPage.tsx`) SHALL render each amendment entry as a shadcn/ui `<Card>` containing a timestamp `<Badge>`, a version label, and a summary of changes. Entries SHALL be separated by a `<Separator>` component.

#### Scenario: History entries are visually distinct

- **WHEN** a user views the contract history page
- **THEN** each amendment version SHALL be displayed as a separate card with a visible timestamp and version identifier

#### Scenario: Separator between entries

- **WHEN** multiple amendment entries exist
- **THEN** a `<Separator>` SHALL appear between consecutive entries

### Requirement: History page uses consistent Tailwind typography

All text in the history page SHALL use Tailwind typography utilities (`text-sm`, `text-muted-foreground`, `font-semibold`, etc.) consistent with the rest of the app.

#### Scenario: Label and value typography

- **WHEN** a history entry displays metadata (date, author, version)
- **THEN** labels SHALL use `text-sm font-medium text-muted-foreground` and values SHALL use `text-sm` or `text-base`

### Requirement: History page is responsive

The history pages SHALL render correctly on both mobile and desktop viewports.

#### Scenario: Mobile history list

- **WHEN** a user views the contract history on a mobile screen
- **THEN** history cards SHALL stack vertically with readable text and no horizontal overflow

### Requirement: History page preserves existing functionality

The visual refactor SHALL NOT change routing, data fetching, or amendment submission logic.

#### Scenario: No functional regression

- **WHEN** a user navigates the contract history after the polish
- **THEN** all existing navigation and amendment actions SHALL work identically to before
