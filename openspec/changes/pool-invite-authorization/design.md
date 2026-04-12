## Context

The current join flow (`addMember` mutation) immediately inserts a fully-active member record with no approval step. Pool managers have no visibility into who has joined and no way to gatekeep membership. The "Invite Members" action button on the dashboard also does nothing (empty `onClick`).

The `members` table already tracks `role` and an optional `isActive` flag (introduced for backward compat); this change adds a parallel `status` field to distinguish `pending` from `active` membership in a type-safe way.

## Goals / Non-Goals

**Goals:**

- Join requests create a `pending` member record instead of an active one
- Managers see and can act on pending requests in the pool dashboard
- Accept → updates status to `active`; Reject → deletes the record
- Non-managers are blocked from calling accept/reject (server-enforced)
- Pending users are shown a "waiting for approval" screen instead of the dashboard
- Invite Members button shows the pool ID so managers can share it

**Non-Goals:**

- Email/push notifications for new join requests
- Invite link tokens with expiry (just sharing the pool ID)
- Bulk accept/reject
- Re-requesting after rejection

## Decisions

### D1: `status` field on `members` table (not a separate `joinRequests` table)

Keeping pending members in the same table avoids synchronization bugs (a member can't be both pending and active simultaneously) and keeps all existing queries that filter by `poolId` working. The schema addition is backward-compatible: existing rows without `status` are treated as `"active"`.

**Alternatives considered:** A separate `pendingRequests` table — adds complexity, two writes on accept, and complicates "is this wallet already a member?" checks.

### D2: Server-side role guard in `resolveJoinRequest`

The mutation looks up the caller's wallet from the session (via `authHelpers`) and verifies they are a `manager` in the pool before mutating. This prevents UI bypass.

**Alternatives considered:** Client-side guard only — insufficient; any authenticated user could call the mutation directly.

### D3: Invite Members shows pool ID in a modal (copy-to-clipboard)

Simple and sufficient for the hackathon scope. The pool ID is the join token — no separate invite link infrastructure needed.

### D4: Tailwind + shadcn/ui throughout

Consistent with the existing dashboard (`PoolDashboard.tsx`) which already uses `Button`, `Badge`, `Card`, and `Skeleton` from `@/components/ui`.

## Risks / Trade-offs

- **Backward compat** → Rows without `status` are treated as active everywhere via a helper `isActive(member)` — must be applied consistently in all member queries.
- **Auth dependency** → `resolveJoinRequest` must read the caller's identity. The project uses wallet-based auth via `authHelpers.ts`; need to confirm `ctx.auth` provides wallet identity or fall back to passing `walletAddress` as a trusted arg from the UI (acceptable for hackathon scope).
- **Race condition on duplicate join** → `addMember` already throws on duplicate wallet, so a second join attempt for the same wallet is rejected cleanly.

## Migration Plan

1. Update `convex/schema.ts` — add optional `status` field (no data migration needed; absent = active)
2. Update `convex/members.ts` mutations and queries
3. Update frontend `PoolDashboard.tsx` and join flow
4. No rollback needed — schema change is purely additive

## Open Questions

- Does `authHelpers.ts` expose a way to get the caller's wallet address inside a mutation context, or do we pass `walletAddress` as an arg? (Tentative: pass as arg, validated against session on mutation side.)
