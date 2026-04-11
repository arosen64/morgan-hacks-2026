## Context

The project is a group treasury application built on Convex (backend) with a Solana smart contract for on-chain treasury operations. Currently, transaction approval is implicit — there is no stored, evaluatable approval rule per group. This means all groups share the same hard-coded logic, which cannot accommodate diverse governance structures (flat teams, committees, hierarchies).

Stakeholders: group admins who configure rules, group members who vote, and the Solana program that gates execution.

## Goals / Non-Goals

**Goals:**
- Store a typed `ApprovalRule` discriminated union on each group that supports: k-of-n, named-set, role-based, unanimous, tiered (by amount)
- Evaluate the rule server-side (Convex) when a vote is cast to determine if quorum is reached
- Default amendment approval to unanimous; allow groups to override it
- Provide a real-time voting UI (approve/reject buttons + live tally) accessible to all group members
- Votes transition through a `pending` state before quorum evaluation resolves them

**Non-Goals:**
- Delegated voting or proxy approval
- Time-locked approval windows (future iteration)
- Tiered rules by transaction type (amount-only)
- Migrating historical implicit approvals to the new schema

## Decisions

### Decision 1: Store approval rule as a Convex discriminated union, not a Solana PDA

**Chosen**: `ApprovalRule` stored in Convex `groups` table as a typed union field.

**Alternatives considered**:
- Store rule inside the Solana program: adds on-chain space and complexity, requires program upgrade for every new rule type. Convex is the source of truth for group config; the Solana program only needs a signature count threshold passed in at execution time.

**Rationale**: Convex is already the authority for group membership and settings. Keeping the rule there lets us change rule logic without a program upgrade. At execution time, the Convex action derives a resolved `requiredSignatures` value and passes it to the Solana instruction.

### Decision 2: Evaluate rules in a Convex mutation, not the client

**Chosen**: Rule evaluation happens inside `convex/approvals.ts` mutations.

**Rationale**: Prevents clients from spoofing quorum. All vote state lives in Convex; evaluation is a pure function over that state.

### Decision 3: Tiered approval uses ordered tiers by amount, first match wins

**Chosen**: `tiered` rule is an ordered array of `{ maxAmount, rule }` entries; the first tier whose `maxAmount` is ≥ transaction amount is applied. A final catch-all tier with no `maxAmount` handles amounts exceeding all thresholds.

**Rationale**: Simple, deterministic, easy to audit. Amount-only conditions keep the rule shape minimal.

### Decision 4: Amendment approval is a separate optional field, defaults to unanimous

**Chosen**: `groups` table gains an optional `amendmentApprovalRule` field; if absent, unanimous is assumed.

**Rationale**: Most groups want unanimous for amendments (high-stakes). Explicit opt-out keeps the safe default without requiring groups to configure anything.

### Decision 5: Vote lifecycle includes a `pending` state

**Chosen**: Proposal/vote documents have states: `pending` → `approved` | `rejected`.

A proposal enters `pending` as soon as it is created and votes are being collected. The Convex mutation evaluates the rule after each vote cast; when quorum is reached it transitions to `approved` (or `rejected` if quorum cannot be reached with remaining voters).

**Rationale**: `pending` makes the current state observable in the UI and allows the Solana action to guard against executing a non-approved proposal.

## Risks / Trade-offs

- **Role-based approval depends on role field accuracy** → Mitigation: role changes must re-evaluate any pending votes (invalidate open proposals when membership changes).
- **Named-set approval breaks if a named member leaves the group** → Mitigation: validate named members are still active members when the rule is saved; surface a warning in the UI.
- **Tiered thresholds are stored in lamports** → Mitigation: display amounts in SOL in the UI; store raw lamports in the contract to avoid float precision issues.
- **Pending proposals become stale if group membership changes mid-vote** → Mitigation: re-evaluate rule on each new vote cast; if rule can no longer be satisfied, transition to `rejected`.

## Migration Plan

1. Add new optional fields to Convex `groups` schema (`approvalRule`, `amendmentApprovalRule`) — existing groups get `undefined` (treated as unanimous fallback).
2. Deploy Convex schema migration (additive, non-breaking).
3. Ship voting UI behind a feature flag; enable per group after rule is configured.
4. Rollback: revert Convex functions; schema fields are optional so no data loss.
