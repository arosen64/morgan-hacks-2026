## ADDED Requirements

### Requirement: Contract viewer uses card-based section layout

The contract viewer (`ContractViewer.tsx`, `ContractEditor.tsx`, `ContractEntryScreen.tsx`) SHALL wrap each logical section (e.g., contract terms, parties, status) in a shadcn/ui `<Card>` with a `<CardHeader>` containing a descriptive heading and a `<CardContent>` for the body.

#### Scenario: Contract sections are visually grouped

- **WHEN** a user views the contract viewer page
- **THEN** each section of the contract SHALL be rendered inside a distinct `<Card>` component with a visible heading

#### Scenario: No custom CSS or inline styles used

- **WHEN** the contract viewer is rendered
- **THEN** all spacing, color, and typography SHALL be applied exclusively through Tailwind utility classes and shadcn/ui component defaults

### Requirement: Contract viewer is responsive

The contract viewer pages SHALL render correctly on both mobile (≥320px) and desktop (≥1024px) viewports using Tailwind responsive prefixes.

#### Scenario: Mobile layout

- **WHEN** a user views the contract viewer on a mobile screen
- **THEN** cards SHALL stack vertically with no horizontal overflow

#### Scenario: Desktop layout

- **WHEN** a user views the contract viewer on a desktop screen
- **THEN** the layout MAY use a multi-column arrangement where appropriate

### Requirement: Contract viewer preserves existing functionality

The visual refactor SHALL NOT change any user-facing behavior, routing, data fetching, or form submission logic.

#### Scenario: No functional regression

- **WHEN** a user interacts with the contract viewer after the polish
- **THEN** all existing actions (viewing, editing, submitting) SHALL work identically to before
