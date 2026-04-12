## Why

The contract creation flow currently uses a local `buildDefaultContract()` placeholder instead of Gemini — meaning every pool gets the same boilerplate contract regardless of what rules the founder actually described. Gemini must replace this placeholder so that plain-language rules become a validated, structured contract JSON before any treasury can go live.

## What Changes

- Replace the `buildDefaultContract` placeholder in `ContractCreationPage` with a real Gemini API call that produces a validated contract JSON from the founder's natural-language description
- Add a `generateContract` Convex action (`"use node"`) that calls `gemini-1.5-flash` via `@google/generative-ai`, parses the JSON response, and validates it against the contract schema before returning
- Add a `validateTransaction` Convex action that sends the active contract JSON + proposed transaction fields to Gemini and returns a pass/fail result with a human-readable explanation
- Add a `generateAmendment` Convex action that takes the current contract JSON + a natural-language amendment description and returns a new contract JSON with version metadata updated
- If the founder provides no rules text, Gemini generates a reasonable default from group name and member count alone
- Gemini output is always validated against the contract schema client-side before the "Confirm & Sign" step is enabled
- Add an `AmendContractPage` component that pre-loads the active contract and accepts a plain-language change, wired to the `generateAmendment` action and existing `commitContract` mutation

## Capabilities

### New Capabilities

- `gemini-generate-contract`: Natural language → validated contract JSON via Gemini; includes default generation when no rules are supplied
- `gemini-validate-transaction`: Validate a proposed transaction against the active contract JSON via Gemini; returns structured pass/fail + explanation
- `gemini-amend-contract`: Current contract JSON + plain-language change → updated contract JSON with incremented version and linked hashes, via Gemini

### Modified Capabilities

<!-- None — no existing specs yet -->

## Impact

- **Convex**: New `convex/gemini.ts` file with three `internalAction` exports (`generateContract`, `validateTransaction`, `generateAmendment`); `"use node"` directive required; `GEMINI_API_KEY` env var added to Convex dashboard
- **Frontend**: `ContractCreationPage` wired to `generateContract` action via `useAction`; new `AmendContractPage` component wired to `generateAmendment` and `commitContract`; transaction proposal form wired to `validateTransaction`
- **Dependencies**: `@google/generative-ai` added to `package.json`
- **Environment**: `GEMINI_API_KEY` must be set in Convex environment variables (not `.env.local`)
