## 1. Schema & Backend

- [x] 1.1 Add optional `status` field (`v.optional(v.union(v.literal("pending"), v.literal("active")))`) to `members` table in `convex/schema.ts`
- [x] 1.2 Update `addMember` mutation in `convex/members.ts` to insert `status: "pending"` by default
- [x] 1.3 Update `getMembers` query to also return pending members (no filter change needed — dashboard will split them client-side)
- [x] 1.4 Add `getPendingMembers` query that returns only `status: "pending"` members for a given `poolId`
- [x] 1.5 Add `resolveJoinRequest` mutation that accepts `{ poolId, memberId, action: "accept" | "reject", managerWallet }`, verifies the caller is a manager, then updates status to `"active"` or deletes the record

## 2. Pool Dashboard — Pending Requests UI

- [x] 2.1 Import `useMutation` and wire up `resolveJoinRequest` in `PoolDashboard.tsx`
- [x] 2.2 Add a `getPendingMembers` query call in `PoolDashboard.tsx` (only fetched when role is `"manager"`)
- [x] 2.3 Render a "Pending Requests" `Card` (manager-only, hidden when no pending members) showing each requester's name, truncated wallet, and Accept / Reject buttons using shadcn `Button` with Tailwind styling
- [x] 2.4 Wire Accept button to call `resolveJoinRequest` with `action: "accept"`
- [x] 2.5 Wire Reject button to call `resolveJoinRequest` with `action: "reject"`

## 3. Pending User Access Guard

- [x] 3.1 In `PoolDashboard.tsx`, check if `currentMember?.status === "pending"` and render a "Your join request is pending manager approval" screen instead of the dashboard (use a simple `Card` with a spinner/message, Tailwind + shadcn)

## 4. Invite Members Button

- [x] 4.1 Create `InviteMembersModal.tsx` using shadcn `Dialog` — displays the pool ID in a read-only `Input` with a "Copy" `Button` that calls `navigator.clipboard.writeText` and briefly shows "Copied!"
- [x] 4.2 Wire the "Invite Members" action in `PoolDashboard.tsx` `actions` array to open the modal (replace empty `onClick: () => {}`)

## 5. Verification

- [ ] 5.1 Join pool as a new wallet → confirm the pool dashboard is blocked with pending screen
- [ ] 5.2 Log in as a manager → confirm Pending Requests card appears with the new user
- [ ] 5.3 Accept the request → confirm the user can now access the dashboard
- [ ] 5.4 Reject a second test request → confirm the record is removed
- [ ] 5.5 Confirm non-manager members do not see the Pending Requests card
- [ ] 5.6 Click Invite Members → confirm modal opens and Copy works
