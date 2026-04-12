## ADDED Requirements

### Requirement: Generate amended contract JSON via Gemini

The system SHALL expose a `generateAmendment` Convex action that accepts `poolId` and `amendmentDescription` (plain language). The action MUST fetch the current active contract JSON from Convex, send it to Gemini with the amendment description, and ask Gemini to return an updated contract JSON with: `version` incremented by 1, `prev_version_hash` set to the current contract's hash, `next_version_hash` set to `null`, and `created_at` updated to the current timestamp. All other fields MUST reflect the requested changes. The returned JSON MUST pass the same schema validation as `generateContract`.

#### Scenario: Member proposes a rule change

- **WHEN** any member submits a plain-language amendment (e.g., "Increase the per-transaction limit to 3 SOL")
- **THEN** `generateAmendment` fetches the active contract, sends it with the description to Gemini
- **THEN** Gemini returns an updated contract with version incremented and the limit changed
- **THEN** the action validates and returns the new contract JSON

#### Scenario: Gemini returns invalid amendment JSON

- **WHEN** Gemini's amendment response fails schema validation
- **THEN** the action throws a `ConvexError` with message "Gemini returned an invalid amendment. Please try again."

### Requirement: AmendContractPage component

The system SHALL provide an `AmendContractPage` React component that: (1) displays the current active contract in a read-only view, (2) provides a textarea for the member to describe the change in plain language, (3) calls `generateAmendment` on submit to get a preview, (4) shows the diff or full new contract for review, and (5) on confirmation calls `commitContract` with the new contract JSON, `prevHash` set to the current active hash, and the hash of the new contract JSON. The component MUST show loading states during the action call and surface errors inline.

#### Scenario: Amendment preview and confirmation

- **WHEN** a member submits an amendment description and clicks "Preview Amendment →"
- **THEN** the component shows a spinner while `generateAmendment` runs
- **THEN** on success the new contract is displayed for review
- **THEN** the member can confirm to call `commitContract` or go back to edit the description

#### Scenario: Confirmation commits the new contract version

- **WHEN** the member clicks "Confirm Amendment"
- **THEN** `commitContract` is called with the new contract JSON, the new hash, and `prevHash` set to the previous version's hash
- **THEN** on success the member is redirected to the pool dashboard
- **THEN** the pool dashboard shows the new contract version as active
