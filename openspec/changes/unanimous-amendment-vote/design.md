## Context

The voting infrastructure is fully built: `castVote`, `evaluateApprovalRule` (unanimous is the default for amendments via `effectiveAmendmentRule`), and `getProposalsWithDetails` all exist. The `proposals` table already has a `type: "amendment"` variant. The only gaps are: (1) the proposed contract JSON isn't stored on the proposal, (2) `castVote` doesn't auto-commit when unanimous, and (3) `AmendContractPage` bypasses the vote.

## Goals / Non-Goals

**Goals:**

- Route all amendment commits through unanimous voting
- Surface pending amendment proposals in Contract History with voting UI
- Auto-commit on unanimous approval without extra user steps

**Non-Goals:**

- Changing the approval rule type (stays unanimoous per issue #54)
- Voting UI in the All Transactions page (stays as-is)

## Decisions

**Store contract JSON on the proposal**: Add `contractJson: v.optional(v.string())` and `contractHash: v.optional(v.string())` to `proposals`. This keeps the proposed contract co-located with the proposal and avoids a separate table.

**Auto-commit in `castVote`**: When an amendment proposal transitions to "approved", `castVote` directly calls the same `commitContract` logic inline (read prevHash from pool, insert contract, patch pool). No new internal action needed.

**Auto-cast proposer vote**: After inserting the proposal, immediately insert an approve vote for the proposer. If they're the only member, the proposal auto-approves and commits in the same mutation.

**Pending amendments in Contract History**: Query `getPoolProposals` with `type: "amendment"` and `status: "pending"` alongside committed versions. Render pending proposals at the top of the history list with a distinct "Pending Vote" badge and inline approve/reject buttons.

## Risks / Trade-offs

- If a member is added after a proposal is submitted, they don't need to vote (snapshot is taken at vote-resolution time from active members). This is acceptable — same behavior as transaction proposals.
