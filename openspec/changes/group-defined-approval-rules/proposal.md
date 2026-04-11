## Why

Groups need full control over how transactions and amendments are approved. Currently approval logic is not group-configurable, blocking diverse organizational structures (flat teams, hierarchies, committees) from enforcing their own governance rules.

## What Changes

- Contract stores a typed `ApprovalRule` per group that covers all approval patterns (k-of-n, named-set, role-based, unanimous, tiered)
- Amendment approval defaults to unanimous but the group can override it with any valid rule
- Approval rules are evaluated on-chain at transaction execution time
- New UI surfaces approve/reject actions with live vote tallies visible to all group members

## Capabilities

### New Capabilities
- `approval-rules`: Define, store, and evaluate flexible group approval rules (k-of-n, named-set, role-based, unanimous, tiered) inside the contract
- `amendment-approval`: Override the default unanimous amendment-approval rule with any configured approval rule
- `approval-voting-ui`: Frontend approve/reject flow with real-time vote tally display for all group members

### Modified Capabilities
<!-- No existing specs yet -->

## Impact

- `convex/` — new schema fields for `ApprovalRule` type; new mutations/queries for submitting votes and evaluating rules
- Solana treasury program — approval rule enforcement must be mirrored on-chain for transaction gating
- Frontend group-settings and transaction-detail pages — new voting UI components
- No breaking API changes for existing groups; new fields are additive
