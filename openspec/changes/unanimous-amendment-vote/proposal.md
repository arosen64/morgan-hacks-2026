## Why

Amendment proposals currently bypass the voting system — any member can instantly commit a new contract version by clicking "Confirm Amendment." Issue #54 requires unanimous member approval before an amendment takes effect.

## What Changes

- `AmendContractPage` submits a proposal (with the proposed contract JSON attached) instead of committing immediately; proposer's approve vote is auto-cast
- When every active member approves, `castVote` automatically commits the new contract version
- Pending amendment proposals appear in Contract History with vote tally and approve/reject buttons
- Approved amendments appear in Contract History as committed versions

## Capabilities

### New Capabilities

- `unanimous-amendment-vote`: Amendment proposals enter a voting queue shown in Contract History; contract only commits on unanimous approval; proposer vote auto-cast on submission

### Modified Capabilities

## Impact

- `convex/schema.ts` — add `contractJson` and `contractHash` optional fields to `proposals` table
- `convex/approvals.ts` — `createProposal`: accept `contractJson`/`contractHash`, auto-cast proposer vote; `castVote`: on unanimous amendment approval, commit the contract
- `src/components/AmendContractPage.tsx` — replace `commitContract` with `createProposal`; show "Submitted for vote" state
- `src/components/ContractHistoryPage.tsx` — show pending amendment proposals at the top with vote tally and voting buttons
