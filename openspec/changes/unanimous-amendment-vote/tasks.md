## 1. Schema

- [x] 1.1 Add `contractJson: v.optional(v.string())` and `contractHash: v.optional(v.string())` to `proposals` table in `convex/schema.ts`

## 2. Backend

- [x] 2.1 Update `createProposal` in `convex/approvals.ts` to accept `contractJson` and `contractHash` args, then auto-cast the proposer's approve vote after insert
- [x] 2.2 Update `castVote` in `convex/approvals.ts`: when an amendment proposal reaches "approved" status, commit the contract (insert contract record, patch pool's activeContractHash)

## 3. AmendContractPage

- [x] 3.1 Replace the `commitContract` call in `AmendContractPage` with `createProposal` (type: "amendment", with contractJson + contractHash + description)
- [x] 3.2 Show a "Submitted for vote" confirmation state after successful submission

## 4. ContractHistoryPage

- [x] 4.1 Query pending amendment proposals in `ContractHistoryPage` using `api.approvals.getProposalsWithDetails`
- [x] 4.2 Render pending amendments above committed versions with "Pending Vote" badge, approve/reject buttons, and vote tally
