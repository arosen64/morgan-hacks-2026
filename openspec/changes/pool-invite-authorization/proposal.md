## Why

Any authenticated user can currently join a pool by submitting a valid pool ID with no approval step, giving pool managers no control over membership. This change adds a manager-gated approval flow so that join requests require explicit acceptance before a user becomes an active member.

## What Changes

- Joining a pool via the join flow creates a `pending` membership record instead of immediately granting active access
- Pool managers see a **Pending Requests** section in the pool dashboard listing users awaiting approval
- Managers can **Accept** (promote to active member) or **Reject** (delete the pending record) each request
- Non-managers cannot accept or reject join requests — enforced both in the UI and server-side in Convex mutations
- A user with a pending membership is blocked from accessing the pool dashboard until approved
- The `addMember` Convex mutation is updated to write `status: "pending"` by default; a new `resolveJoinRequest` mutation handles accept/reject
- The schema gains a `status` field (`"pending"` | `"active"`) on the `members` table (backward-compatible: absence treated as active)
- The **Invite Members** button on the pool home page is wired up (currently a no-op) — clicking it copies a join link or shows the pool ID so managers can share it

## Capabilities

### New Capabilities

- `join-request-approval`: Pending join request creation, manager approval/rejection UI and mutations, and access guard for pending users

### Modified Capabilities

- None — no existing spec files exist yet

## Impact

- `convex/schema.ts` — add `status` field to `members` table
- `convex/members.ts` — update `addMember` to set `status: "pending"`; add `resolveJoinRequest` mutation; update `getMembers` to filter active vs pending
- `src/components/PoolDashboard.tsx` — add Pending Requests card (manager-only), wire up Invite Members button, gate dashboard access for pending users
- `src/components/JoinPoolForm.tsx` / join flow — no change to UI; backend now writes pending status
- Existing active members unaffected (absent `status` treated as active)
