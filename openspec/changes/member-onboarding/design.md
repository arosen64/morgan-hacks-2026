## Context

The group treasury is governed by a contract that references members by name. Per the SPEC, the architectural sequence is:

```
Pool created → Members join (name + wallet) → Gemini formalizes contract (members array populated from registry) → Transactions allowed
```

Member data lives off-chain in Convex DB and is resolved to wallet addresses at approval-rule evaluation time. Critically, the contract JSON that Gemini generates includes the full `members` array drawn from the Convex registry — members must be in place before the contract can be created.

## Goals / Non-Goals

**Goals:**

- Store members (name, wallet, role) in Convex DB scoped to a pool
- Enforce uniqueness of name and wallet address within a pool
- Expose name→wallet resolution for use by approval rule evaluation
- Provide a UI form to join a pool and a member list on the pool dashboard

**Non-Goals:**

- On-chain member registration (wallets are resolved client-side from Convex)
- Member removal or role changes (v1 scope)
- Wallet signature verification at join time (trust-on-first-use for hackathon)
- Invitations or access control on who can join a pool

## Decisions

**Decision 1: Convex DB as the single source of truth for member identity**

- Rationale: Member data (names, roles) is off-chain metadata. Solana stores wallet addresses implicitly via signers; Convex stores the human-readable mapping. Keeping it in Convex keeps it cheap and queryable.
- Alternative considered: Storing name→wallet in the on-chain contract account — rejected because it adds account size complexity and makes lookups expensive.

**Decision 2: Uniqueness enforced at the Convex mutation layer**

- Both `name` and `wallet` must be unique within a pool. Enforced in the `addMember` Convex mutation before insert.
- Alternative considered: DB-level unique index — Convex supports indexes but not composite unique constraints natively, so we do a query-then-insert with an explicit check.

**Decision 3: Role is an enum (`manager` | `member`) set at join time**

- Keeps the approval rule engine simple: role-based rules just check this field.
- The founder who creates the pool is automatically inserted as `manager`.

**Decision 5: Pool has a `status` field (`pre-contract` | `active`)**

- Pools start in `pre-contract` state. Transactions are blocked until a contract is created and the pool transitions to `active`.
- This enforces the SPEC requirement: "A contract is required before any transactions can occur."
- Alternative considered: check for existence of a contract record at transaction time — rejected because it scatters the gate logic; a status field on the pool is a single, clear source of truth.

**Decision 4: Wallet connection via Solana wallet adapter (Phantom)**

- The onboarding form pre-fills the wallet field from the connected wallet. User provides their name manually.
- This avoids manual wallet address entry errors.

## Risks / Trade-offs

- **No signature proof at join time** → Anyone who knows a wallet address can register it under any name. Mitigation: acceptable for hackathon trust model; v2 can add a sign-to-verify step.
- **Name collisions across pools** → Names are only unique within a pool, not globally. This is intentional but could confuse users who are in multiple pools. Mitigation: always show pool context in the UI.
- **Race condition on duplicate check** → Two simultaneous join requests could both pass the uniqueness check before either inserts. Mitigation: low risk for hackathon scale; a Convex transaction or optimistic locking can address this later.

## Migration Plan

No migration needed — this is a greenfield table. The `members` table is created as part of the Convex schema definition.

## Open Questions

- ~~Should the pool creator be auto-added as a member when the pool is created, or do they go through the same onboarding form?~~
  - **Resolved**: Pool creator is automatically added as `manager` with their connected wallet at pool creation time. They do not go through the onboarding form.
