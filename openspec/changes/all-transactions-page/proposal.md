## Why

Pool members need a single place to see what has happened with the pool's money and to participate in approving or rejecting pending spending proposals. Without this view, members have no way to vote on proposals, proposers cannot cancel accidental submissions, and there is no historical record of executed transactions.

## What Changes

- A new "All Transactions" page is accessible from the pool dashboard
- The page is divided into two sections: **Pending** (open proposals awaiting votes) and **Past** (approved/rejected proposals)
- Members vote Yes/No on pending proposals directly from this page
- Members who have already voted see their vote status and cannot change it
- A proposer can cancel their own pending proposal before the approval threshold is reached
- Proposals that reach the approval threshold are marked approved and move to the Past section
- In-flight proposals (threshold met, on-chain execution in progress) are shown with an "Executing" badge and are irrevocable

## Capabilities

### New Capabilities

- `all-transactions-page`: Full-page view listing pending proposals (with live vote tallies and voting actions) and past proposals (approved/rejected with final counts)
- `cancel-proposal`: Proposers can withdraw their own pending proposal before it reaches threshold

### Modified Capabilities

- `proposal-voting`: Previously only surfaced via the `ProposalVoting` component in isolation; now embedded inside the All Transactions page with Tailwind + shadcn styling

## Impact

- **Convex DB**: No schema changes required; `proposals` and `votes` tables already support all needed data. A `cancelProposal` mutation is added.
- **Convex Queries**: New `getProposalsWithDetails` query returns proposals enriched with proposer name and per-proposal vote tallies for efficient rendering.
- **Frontend**: New `AllTransactionsPage` component. `App.tsx` gains an `all-transactions` view and an "All Transactions" button on the dashboard. shadcn `Card`, `Badge`, `Button`, and `Separator` are used throughout.
- **No breaking changes**: Existing `ProposalVoting` component and all other views are unaffected.
