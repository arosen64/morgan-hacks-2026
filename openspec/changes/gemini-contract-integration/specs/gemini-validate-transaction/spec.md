## ADDED Requirements

### Requirement: Validate transaction against active contract via Gemini

The system SHALL expose a `validateTransaction` Convex action that accepts `poolId`, `amount` (in SOL), `description`, and `category`. The action MUST fetch the pool's active contract JSON from Convex, then send it along with the transaction fields to Gemini and ask it to evaluate: (1) whether the category is in `allowed_transaction_types`, (2) whether the amount is within `budget_limits.per_transaction_max_sol`, and (3) whether the description is coherent with the stated category. The action MUST return `{ pass: boolean, explanation: string }`.

#### Scenario: Transaction passes all checks

- **WHEN** a proposer submits a transaction with a valid category, amount within limits, and coherent description
- **THEN** `validateTransaction` returns `{ pass: true, explanation: "Transaction meets all contract requirements." }`
- **THEN** the proposal form proceeds to the approval submission step

#### Scenario: Transaction exceeds budget limit

- **WHEN** a proposer submits an amount greater than `budget_limits.per_transaction_max_sol`
- **THEN** `validateTransaction` returns `{ pass: false, explanation: "Amount exceeds the per-transaction budget limit of X SOL." }`
- **THEN** the proposal form shows the explanation and prompts the proposer to amend

#### Scenario: Transaction category not allowed

- **WHEN** a proposer submits a category not listed in `allowed_transaction_types`
- **THEN** `validateTransaction` returns `{ pass: false, explanation: "Category '<x>' is not in the allowed transaction types." }`
- **THEN** the proposal form shows the explanation inline

#### Scenario: No active contract exists

- **WHEN** the pool has no active contract (status is `pre-contract`)
- **THEN** `validateTransaction` throws a `ConvexError` with message "Pool has no active contract."
