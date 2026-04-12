## 1. Convex Backend

- [ ] 1.1 Add `cancelProposal` mutation — verifies caller is the proposer and proposal is still `pending`, then patches status to `rejected`
- [ ] 1.2 Add `getProposalsWithDetails` query — returns all proposals for a pool enriched with: proposer member name, yes/no/pending tally, and the current user's existing vote (if any)

## 2. All Transactions Page Component

- [ ] 2.1 Create `AllTransactionsPage` component at `src/components/AllTransactionsPage.tsx`
- [ ] 2.2 Accept props: `poolId`, `currentMemberId` (nullable), `onBack`
- [ ] 2.3 Split layout into two sections: "Pending Proposals" and "Past Transactions" using shadcn `Separator` and headings
- [ ] 2.4 Wire to `getProposalsWithDetails` query; show skeleton/loading state while data loads

## 3. Pending Proposals Section

- [ ] 3.1 Render each pending proposal in a shadcn `Card` showing: description, amount (in SOL), proposer name, yes/no tally
- [ ] 3.2 Show "Vote Yes" (`Button` variant `default`) for members who have not yet voted
- [ ] 3.3 Show "Vote No" (`Button` variant `destructive`) for members who have not yet voted
- [ ] 3.4 Members who already voted see a `Badge` reflecting their vote (`Approved` green / `Rejected` red); buttons are hidden
- [ ] 3.5 Show quorum description string below the tally (e.g. "3 of 5 approvals needed")
- [ ] 3.6 Show "Cancel Proposal" (`Button` variant `outline`) only to the proposer of each pending proposal; wire to `cancelProposal` mutation
- [ ] 3.7 Show "Executing…" `Badge` (amber) on proposals whose status is approved but on-chain execution hasn't been confirmed (future-proofing placeholder)

## 4. Past Transactions Section

- [ ] 4.1 Render each past proposal (status `approved` or `rejected`) in a shadcn `Card`
- [ ] 4.2 Show: description, amount (in SOL if present), final yes/no tally, and a `Badge` for status (`Approved` green / `Rejected` red)
- [ ] 4.3 Show empty state message when no past proposals exist

## 5. App Integration

- [ ] 5.1 Add `all-transactions` to the `View` union type in `App.tsx`
- [ ] 5.2 Add "All Transactions" button on the dashboard (visible when pool status is `active`)
- [ ] 5.3 Render `AllTransactionsPage` when `view === "all-transactions"`, passing `poolId`, `currentMemberId`, and `onBack`
