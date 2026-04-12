## ADDED Requirements

### Requirement: Generate contract JSON from plain language

The system SHALL call the Gemini API with the founder's natural-language rules description and return a validated contract JSON object. The action MUST run in the Convex Node.js runtime (`"use node"`), read `GEMINI_API_KEY` from environment, and use `gemini-1.5-flash` with `responseMimeType: "application/json"`. The returned object MUST pass schema validation (required keys: `name`, `version`, `members`, `contribution_rules`, `distribution_rules`, `allowed_transaction_types`, `approval_rules`, `budget_limits`) before the action resolves. If validation fails, the action MUST throw a `ConvexError` with a user-readable message.

#### Scenario: Founder provides plain-language rules

- **WHEN** the founder submits a non-empty rules description and clicks "Preview Contract →"
- **THEN** the frontend calls `generateContract` action with `poolId`, `rulesDescription`, and the current member list
- **THEN** Gemini returns a contract JSON reflecting the described rules
- **THEN** the action validates the JSON shape and returns it to the frontend
- **THEN** the frontend renders the contract preview for review

#### Scenario: Founder submits empty rules description

- **WHEN** the founder leaves the rules textarea blank and clicks "Preview Contract →"
- **THEN** `generateContract` is called with an empty `rulesDescription`
- **THEN** Gemini generates a reasonable default contract from pool name and member count alone
- **THEN** the action validates and returns the default contract

#### Scenario: Gemini returns malformed JSON

- **WHEN** Gemini's response cannot be parsed as valid JSON or fails schema validation
- **THEN** the action throws a `ConvexError` with message "Gemini returned an invalid contract. Please try again."
- **THEN** the frontend displays the error message inline and keeps the textarea editable

### Requirement: Wire ContractCreationPage to generateContract action

The `ContractCreationPage` component SHALL replace the local `buildDefaultContract()` call with a `useAction(api.gemini.generateContract)` call. A loading state MUST be shown while the action is in-flight. The "Confirm & Sign" button MUST remain disabled until a valid preview is returned.

#### Scenario: Action in-flight

- **WHEN** the frontend calls `generateContract` and awaits the result
- **THEN** the "Preview Contract →" button shows a spinner/loading state and is disabled
- **THEN** no other action can be taken until the response arrives

#### Scenario: Action succeeds

- **WHEN** `generateContract` resolves with a contract object
- **THEN** the preview panel renders the contract fields
- **THEN** the "Confirm & Sign" button becomes enabled
