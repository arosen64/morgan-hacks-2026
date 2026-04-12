## Context

The group treasury requires a governing contract before any transactions can occur. The current `ContractCreationPage` has a `buildDefaultContract()` function that produces boilerplate JSON locally — it does not call Gemini and ignores the founder's plain-language input. The SPEC.md explicitly calls Gemini as the formalization layer for three scenarios: (1) contract creation from plain language, (2) contract amendment, and (3) transaction validation. None of these are wired yet.

Convex actions (not mutations) are the right layer for external API calls: they run in Node.js, support `async/await` with external SDKs, and are isolated from the reactive query layer. The frontend calls them via `useAction`.

## Goals / Non-Goals

**Goals:**

- Replace `buildDefaultContract` with a real Gemini call in the contract creation flow
- Add a `generateAmendment` action for the amendment flow and an `AmendContractPage` component
- Add a `validateTransaction` action used by the proposal form before submission
- Always validate Gemini output against the contract schema before returning to the frontend
- Gracefully degrade: if Gemini returns malformed JSON, surface a user-facing error rather than crashing

**Non-Goals:**

- Streaming Gemini responses (full JSON only; streaming is not useful for structured output)
- PDF extraction (separate concern, not in issue #6 acceptance criteria)
- Caching Gemini responses
- Fine-tuning or custom Gemini models

## Decisions

**Decision 1: All Gemini logic lives in `convex/gemini.ts` as internal actions**

- Rationale: Keeps the Gemini SDK import (`@google/generative-ai`) in one place. Internal actions can be called from HTTP actions or directly from the frontend via `useAction(api.gemini.*)`. The `"use node"` pragma enables the Node.js runtime required by the SDK.
- Alternative considered: HTTP endpoint (`/ai/generate-contract`) — rejected because it adds an extra network hop and bypasses Convex auth.

**Decision 2: Use `gemini-1.5-flash` for all three operations**

- Rationale: Fast and cheap; structured JSON output with `responseMimeType: "application/json"` eliminates parsing ambiguity. Flash is sufficient for the contract schemas in use.
- Alternative considered: `gemini-1.5-pro` — overkill for well-structured prompts with explicit JSON schemas.

**Decision 3: Schema validation happens inside the Convex action, not in the frontend**

- Rationale: The action is the trust boundary. If the action returns successfully, the frontend can render the contract without re-validating. This prevents a malformed Gemini response from being committed to Convex.
- Validation approach: Parse the JSON string Gemini returns, then check required top-level keys (`name`, `version`, `members`, `contribution_rules`, `distribution_rules`, `allowed_transaction_types`, `approval_rules`, `budget_limits`). Throw a `ConvexError` if any are missing.

**Decision 4: `AmendContractPage` is a separate component, not a prop variant of `ContractCreationPage`**

- Rationale: The amendment flow has different inputs (existing contract JSON is visible, the textarea asks for a "change" not "rules"), a different action (`generateAmendment` vs `generateContract`), and different confirmation copy. A shared component would need excessive conditional branching.
- Alternative considered: `existingContract` prop on `ContractCreationPage` — rejected because it muddies the component's single responsibility.

**Decision 5: `validateTransaction` is called client-side before submitting the proposal, non-blocking on failure**

- Rationale: Per SPEC.md the validation is informational — the proposer sees pass/fail + explanation and can choose to amend or proceed. The Convex mutation that creates the proposal does not call Gemini (mutations cannot call external APIs); validation is a separate action called first.
- The proposal mutation records the validation result alongside the proposal for approvers to see.

## Risks / Trade-offs

- **Gemini rate limits** → Only three distinct operations; hackathon traffic is low. No mitigation needed for v1.
- **Prompt injection via user input** → Contract rules text is included in the prompt. Mitigation: schema validation ensures the output is valid JSON matching the contract shape, so injection can only corrupt field values, not escape the JSON structure.
- **`GEMINI_API_KEY` misconfiguration** → Convex action throws immediately; frontend surfaces "Failed to generate contract" error. Mitigation: clear error message guides the developer to set the env var in the Convex dashboard.
- **Gemini returns valid JSON but semantically bad contract** → No automated semantic check beyond schema shape. Mitigation: the contract preview step lets the founder review before confirming.

## Migration Plan

No data migration needed — no existing schema changes. Steps:

1. Install `@google/generative-ai` via `npm install`
2. Add `GEMINI_API_KEY` to Convex environment variables in the dashboard
3. Deploy `convex/gemini.ts` (new file, no schema changes)
4. Update frontend components (no Convex schema migration required)

Rollback: revert `convex/gemini.ts` and frontend changes; `buildDefaultContract` placeholder can be temporarily restored.

## Open Questions

- ~~Should amendment proposals go through member voting before `commitContract` is called?~~ — Yes, per SPEC.md. The `AmendContractPage` flow should create an `amendment` proposal record and only call `commitContract` after approval threshold is met. For hackathon v1, the amendment can be committed immediately by the manager (same as the initial contract creation flow) with a TODO comment for the voting gate.
