## 1. Dependencies & Environment

- [x] 1.1 Install `@google/generative-ai` package via `npm install @google/generative-ai`
- [x] 1.2 Add `GEMINI_API_KEY` to Convex environment variables in the Convex dashboard

## 2. Convex Gemini Actions

- [x] 2.1 Create `convex/gemini.ts` with `"use node"` directive and import `@google/generative-ai`
- [x] 2.2 Implement `generateContract` internal action — accepts `poolName`, `rulesDescription`, `members`; calls `gemini-1.5-flash` with structured JSON prompt; validates required contract schema keys; throws `ConvexError` on invalid output
- [x] 2.3 Implement `validateTransaction` internal action — accepts `poolId`, `amount`, `description`, `category`; fetches active contract from Convex; calls Gemini to evaluate type/budget/coherence; returns `{ pass: boolean, explanation: string }`
- [x] 2.4 Implement `generateAmendment` internal action — accepts `poolId`, `amendmentDescription`; fetches active contract JSON and hash; calls Gemini to return updated contract with incremented version and linked hashes; validates schema before returning
- [x] 2.5 Export all three actions as public `action` wrappers (so frontend `useAction` can call them via `api.gemini.*`)

## 3. Contract Creation Flow

- [x] 3.1 In `ContractCreationPage.tsx`, replace `buildDefaultContract()` call in `handlePreview()` with `useAction(api.gemini.generateContract)`
- [x] 3.2 Add loading state to the "Preview Contract →" button while the action is in-flight
- [x] 3.3 Pass `pool.name`, `rulesDescription`, and current `members` array to the action
- [x] 3.4 Surface `ConvexError` messages from the action as inline error text below the textarea

## 4. Amendment Flow

- [x] 4.1 Create `src/components/AmendContractPage.tsx` — read-only view of current contract + amendment textarea
- [x] 4.2 Wire "Preview Amendment →" button to `useAction(api.gemini.generateAmendment)` with loading state
- [x] 4.3 Show the returned amended contract in the same `ContractFieldView` preview panel
- [x] 4.4 Wire "Confirm Amendment" button to `commitContract` mutation with `prevHash` set to current active hash
- [x] 4.5 On success, redirect to pool dashboard; on error, show inline error message

## 5. Transaction Validation Integration

- [x] 5.1 In the transaction proposal form (wherever proposals are submitted), call `useAction(api.gemini.validateTransaction)` before calling the `createProposal` mutation
- [x] 5.2 Show validation result (`pass`/`fail` + `explanation`) inline; allow proposer to proceed or amend
- [x] 5.3 Pass the Gemini validation result (`pass`, `explanation`) into the proposal record so approvers can see it

## 6. Routing

- [x] 6.1 Add a route for `AmendContractPage` (e.g., `/pool/:poolId/amend`) in `App.tsx` or the router file
- [x] 6.2 Add an "Amend Contract" button to the pool dashboard (visible to all active members) that navigates to the amend route
