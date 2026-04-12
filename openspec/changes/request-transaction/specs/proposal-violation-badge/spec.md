## ADDED Requirements

### Requirement: Contract violation badge on proposals

The transactions list SHALL display an amber "Contract violation" badge on any proposal whose `geminiValidation.pass` is `false`, visible to all members when viewing pending or past proposals.

#### Scenario: Proposal failed Gemini validation

- **WHEN** a proposal has `geminiValidation.pass === false`
- **THEN** an amber "Contract violation" badge is shown next to the proposal description in `AllTransactionsPage`

#### Scenario: Proposal passed Gemini validation

- **WHEN** a proposal has `geminiValidation.pass === true` or `geminiValidation` is absent
- **THEN** no violation badge is rendered

#### Scenario: Violation explanation visible

- **WHEN** a contract-violation badge is shown
- **THEN** hovering or expanding the proposal shows `geminiValidation.explanation` so approvers understand why it was flagged
