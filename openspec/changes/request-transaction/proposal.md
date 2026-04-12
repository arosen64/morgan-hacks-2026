## Why

Members need a way to propose spending from the pool treasury. A `CreateProposalPage` component exists but is incomplete: it is missing recipient wallet, optional URL fields, an on-chain Anchor instruction call, a pool-balance guard, and contract-violation visibility in the approvals view. This work closes the gap so the full flow works end-to-end.

## What Changes

- Add **recipient wallet** and **optional URL/note** fields to `CreateProposalPage`
- Add a **pool balance guard on submission**: block submitting a proposal when the requested amount exceeds the on-chain treasury balance
- Add a **pool balance guard on approval**: `castVote` must check whether total pending approved lamports ≤ treasury balance before finalising approval; if funds are insufficient at vote-resolution time the proposal is auto-rejected with a clear reason
- Add the **on-chain `create_proposal` Anchor instruction** call before storing in Convex (requires an active contract and initialized treasury)
- Add `recipientWallet` and `url` fields to the `proposals` Convex table and `createProposal` mutation
- Show a **contract-violation badge** on pending proposals in `AllTransactionsPage` / `ProposalVoting` so approvers see when a proposal failed Gemini validation

## Capabilities

### New Capabilities

- `transaction-proposal-form`: Complete request-transaction form with all required fields, pool-balance guard on submit, Gemini validation, and on-chain submission
- `proposal-violation-badge`: Display contract-violation status on pending proposals for approvers
- `approval-balance-guard`: `castVote` rejects approval finalisation when treasury balance is insufficient to cover the proposal amount

### Modified Capabilities

- `proposal-storage`: `proposals` table gains `recipientWallet` (required for transaction type) and `url` (optional) fields

## Impact

- `src/components/CreateProposalPage.tsx` — add fields, submit-time balance check, Anchor call
- `src/components/AllTransactionsPage.tsx` and `ProposalVoting.tsx` — render violation badge
- `convex/schema.ts` — two new optional fields on `proposals`
- `convex/approvals.ts` — `createProposal` accepts new fields; `castVote` fetches treasury balance via `getBalance` action before finalising approval
- `src/lib/treasury.ts` — reuse existing PDA helpers for on-chain call
- `src/idl/treasury.json` — `create_proposal` instruction already defined
