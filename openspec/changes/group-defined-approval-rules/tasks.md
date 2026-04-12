## 1. Schema & Types

- [ ] 1.1 Define `ApprovalRule` discriminated union type in `convex/schema.ts` (variants: k-of-n, named-set, role-based, unanimous, tiered)
- [ ] 1.2 Add optional `approvalRule` field to `groups` table in `convex/schema.ts`
- [ ] 1.3 Add optional `amendmentApprovalRule` field to `groups` table in `convex/schema.ts`
- [ ] 1.4 Add `status` field (`pending | approved | rejected`) to proposals/transactions table in `convex/schema.ts`
- [ ] 1.5 Add `votes` table (or embed votes array) to track per-member vote records in `convex/schema.ts`

## 2. Approval Rule Evaluation Logic

- [ ] 2.1 Implement `evaluateApprovalRule(rule, votes, members)` pure function in `convex/lib/approvalRules.ts`
- [ ] 2.2 Handle `unanimous` variant: all active members must have approved
- [ ] 2.3 Handle `k-of-n` variant: any k members from the group approved
- [ ] 2.4 Handle `named-set` variant: all listed memberIds have approved
- [ ] 2.5 Handle `role-based` variant: all members with the given role have approved
- [ ] 2.6 Handle `tiered` variant: resolve correct tier by transaction amount (first match on `maxAmount`), then evaluate its nested rule
- [ ] 2.7 Implement `canStillReachQuorum(rule, votes, members)` to detect early rejection

## 3. Convex Mutations & Queries

- [ ] 3.1 Add `castVote` mutation in `convex/approvals.ts` that records a vote, evaluates the rule, and updates proposal status
- [ ] 3.2 Add `saveApprovalRule` mutation in `convex/groups.ts` that validates named-set members are active before saving
- [ ] 3.3 Add `saveAmendmentApprovalRule` mutation in `convex/groups.ts`
- [ ] 3.4 Add `getProposalVotes` query to expose vote tally + per-member vote status to the UI
- [ ] 3.5 Add membership-change side effect: when a member is removed, re-evaluate all pending proposals for that group and reject any that can no longer reach quorum

## 4. Frontend — Voting UI

- [ ] 4.1 Create `ProposalVoting` component with approve/reject buttons and vote tally display
- [ ] 4.2 Disable buttons and show current vote indicator when the current user has already voted
- [ ] 4.3 Subscribe to `getProposalVotes` with Convex `useQuery` so tally updates in real time
- [ ] 4.4 Show `Approved` or `Rejected` status badge and hide voting controls when proposal is no longer `pending`
- [ ] 4.5 Display rule-specific quorum progress text (e.g., "2 of 3 approvals needed")

## 5. Frontend — Group Settings

- [ ] 5.1 Add `ApprovalRuleEditor` component to group settings page for configuring `approvalRule`
- [ ] 5.2 Add separate `AmendmentApprovalRuleEditor` (or toggle) for `amendmentApprovalRule` override
- [ ] 5.3 Warn admin when saving a named-set rule that references a member who is not in the group

## 6. Integration & Cleanup

- [ ] 6.1 Update transaction execution Convex action to gate Solana submission on proposal status = `approved`
- [ ] 6.2 Write unit tests for `evaluateApprovalRule` covering all five variants and edge cases
- [ ] 6.3 Write unit tests for `canStillReachQuorum` covering k-of-n and named-set early rejection
- [ ] 6.4 Manual smoke test: create a group, configure each rule type, run a vote to completion
