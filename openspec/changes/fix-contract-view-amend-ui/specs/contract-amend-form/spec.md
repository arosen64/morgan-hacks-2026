## ADDED Requirements

### Requirement: Amend page shows current contract in readable form before amendment input

The system SHALL display the current active contract using `ContractDisplay` (not raw JSON) above the amendment description textarea, so users can see what they are amending.

#### Scenario: Current contract is visible before user types

- **WHEN** the amend contract page loads and an active contract exists
- **THEN** the current contract is rendered via `ContractDisplay` in a read-only card labeled "Current Contract" — no raw JSON or bracket characters visible

#### Scenario: Current contract is hidden during preview

- **WHEN** the user has generated an amendment preview
- **THEN** the current contract card is hidden and only the amended contract preview is shown

### Requirement: Amendment preview renders in readable form

The system SHALL render the AI-generated amendment preview using `ContractDisplay`, not raw JSON.

#### Scenario: Amendment preview shows structured fields

- **WHEN** Gemini returns an amended contract and the preview card is shown
- **THEN** all contract fields are rendered via `ContractDisplay` — no `<pre>` blocks, no raw JSON, no curly braces visible to the user

#### Scenario: Amendment preview shows version badge

- **WHEN** the amendment preview is displayed
- **THEN** the new version number is shown as a badge in the preview card header

### Requirement: Amend page is visually consistent with the rest of the app

The system SHALL use shadcn/ui components (Card, Badge, Button, Separator, Textarea) and the violet accent color (`violet-600`) consistent with the rest of the app throughout the amend page.

#### Scenario: Buttons use correct variant and color

- **WHEN** the amend page is rendered
- **THEN** primary action buttons use `bg-violet-600 hover:bg-violet-700` and secondary/ghost buttons use `variant="ghost"` or `variant="outline"` with violet accents
