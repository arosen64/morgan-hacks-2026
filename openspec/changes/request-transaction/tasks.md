## 1. Schema & Backend

- [x] 1.1 Add `recipientWallet: v.optional(v.string())`, `url: v.optional(v.string())`, and `rejectionReason: v.optional(v.string())` to the `proposals` table in `convex/schema.ts`
- [x] 1.2 Add `recipientWallet` and `url` args to `createProposal` mutation in `convex/approvals.ts` and persist them on insert
- [x] 1.3 Create `convex/treasury.ts` with an `internalAction` `resolveProposalIfReady` that: fetches the treasury PDA balance via RPC, and if the proposal amount exceeds it sets status to `rejected` + `rejectionReason: "insufficient_funds"`, otherwise sets status to `approved` (and commits amendment if applicable)
- [x] 1.4 Update `castVote` in `convex/approvals.ts` to remove inline approval/rejection logic for transaction proposals and instead call `ctx.scheduler.runAfter(0, internal.treasury.resolveProposalIfReady, { proposalId })` when the vote would reach threshold; keep existing inline logic for amendment proposals (no balance check needed)

## 2. Frontend — Form Fields & Balance Guard

- [x] 2.1 Add `recipientWallet` (required) and `url` (optional) controlled inputs to `CreateProposalPage.tsx` below the amount field
- [x] 2.2 Fetch treasury PDA balance via `connection.getBalance(treasuryPda)` on mount and when amount changes; show "Insufficient treasury funds (X SOL available)" inline error and disable submit when `amountLamports > treasuryBalance`
- [x] 2.3 Disable the Validate button when `recipientWallet` is empty or not a valid base58 public key

## 3. Frontend — On-chain Anchor Call

- [x] 3.1 In `CreateProposalPage.tsx` `handleSubmit`, build the Anchor `create_proposal` instruction using the IDL from `src/idl/treasury.json`, `getTreasuryPda`, and the wallet's `sendTransaction`; wait for confirmation before proceeding
- [x] 3.2 If the Anchor tx fails, display the error inline and do not call the Convex mutation
- [x] 3.3 Pass `recipientWallet` and `url` through to the `createProposal` Convex mutation call

## 4. Frontend — Violation Badge & Rejection Reason

- [x] 4.1 In `AllTransactionsPage.tsx`, render an amber "Contract violation" badge next to the description when `geminiValidation?.pass === false`; show `geminiValidation.explanation` on expand/hover
- [x] 4.2 In `AllTransactionsPage.tsx`, show "Rejected — insufficient funds" when `status === "rejected"` and `rejectionReason === "insufficient_funds"` instead of the plain "Rejected" label
