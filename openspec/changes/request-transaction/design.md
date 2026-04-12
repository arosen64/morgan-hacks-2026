## Context

`CreateProposalPage.tsx` handles description, category, amount, Gemini validation, and Convex insertion. It is missing: recipient wallet + URL fields, a submit-time pool-balance guard, the on-chain Anchor `create_proposal` call, and contract-violation visibility for approvers. The approval path (`castVote`) has no balance check before finalising.

Existing utilities to reuse: `getTreasuryPda` / `isTreasuryInitialized` in `src/lib/treasury.ts`, the IDL at `src/idl/treasury.json` (which already defines `create_proposal`), and the `AddMoneyModal` pattern for Anchor calls via `useConnection` + `sendTransaction`.

## Goals / Non-Goals

**Goals:**

- Add `recipientWallet` (required) and `url` (optional) fields to the proposal form and schema
- Block form submission when proposal amount > total on-chain treasury balance
- Call the Anchor `create_proposal` instruction on-chain before writing to Convex
- Reject approval finalisation in `castVote` when total treasury balance < proposal amount
- Surface `geminiValidation.pass === false` as a visible badge on proposals in `AllTransactionsPage`

**Non-Goals:**

- Per-member contribution tracking or per-member balance checks — only the aggregate treasury PDA balance matters
- On-chain execution of the spend (that is a separate `execute_proposal` instruction)
- Changing the voting UI beyond adding the violation badge

## Decisions

**Balance source — treasury PDA only:**
The only balance that matters is `connection.getBalance(treasuryPda)` — the total SOL held by the on-chain treasury account. Individual `contributedLamports` on member records is for display only and is never consulted for approval gating.

**Balance check placement — two layers:**

1. _Submit-time (frontend)_: `CreateProposalPage` fetches `connection.getBalance(treasuryPda)` before sending the Anchor tx. If `amountLamports > treasuryBalance` it shows an inline error and blocks submission. UX-only; can race with concurrent transactions.
2. _Vote-resolution (backend)_: When `castVote` would flip a proposal to `approved`, it instead schedules `internal.treasury.resolveProposalIfReady` — a new `internalAction` — which fetches the live treasury balance via RPC and either patches status to `approved` or to `rejected` (with `rejectionReason: "insufficient_funds"`). This is the authoritative guard.

**Why an `internalAction` for vote resolution:**
Convex mutations cannot call `fetch`/RPC. The balance check requires an HTTP call to the Solana RPC, so it must run inside an action. `castVote` records the vote then uses `ctx.scheduler.runAfter(0, internal.treasury.resolveProposalIfReady, { proposalId })` to hand off resolution without blocking the mutation transaction.

**On-chain call before Convex write:**
`CreateProposalPage` builds and sends the Anchor `create_proposal` tx, waits for confirmation, then calls the `createProposal` mutation. If the Anchor tx fails, nothing is written to Convex. If the Anchor tx confirms but the mutation fails, the proposal is orphaned on-chain — acceptable for hackathon scope.

**Schema additions:**
`proposals` gets `recipientWallet: v.optional(v.string())` and `url: v.optional(v.string())`. Both optional to preserve compatibility with existing rows. Also adds `rejectionReason: v.optional(v.string())` so the UI can explain why an approval was blocked.

**Violation badge:**
`getProposalsWithDetails` already returns `geminiValidation`. `AllTransactionsPage` renders a small amber "Contract violation" badge when `geminiValidation?.pass === false`.

## Risks / Trade-offs

- **Balance race**: between the action fetching the balance and actual on-chain state there could be concurrent deposits or other approvals. The check is best-effort; true atomicity would require an on-chain constraint.
- **Scheduled action delay**: `runAfter(0, ...)` fires asynchronously so proposal status flips slightly after the vote lands. UI will update reactively when Convex re-delivers the query.
- **Anchor call before Convex**: if the network drops between tx confirmation and mutation call, the proposal is on-chain but not in Convex. Low probability; out of scope.
