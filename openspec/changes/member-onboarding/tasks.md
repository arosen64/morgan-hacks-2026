## 1. Convex Schema

- [x] 1.1 Add `members` table to Convex schema with fields: `poolId`, `name`, `wallet`, `role` (`manager` | `member`)
- [x] 1.2 Add index on `members` by `poolId` for efficient member list queries
- [x] 1.3 Add `status` field (`pre-contract` | `active`) to `pools` table in schema

## 2. Convex Mutations & Queries

- [x] 2.1 Implement `addMember` mutation — validates uniqueness of name and wallet within the pool before inserting
- [x] 2.2 Implement `getMembers` query — returns all members for a given pool (name, wallet, role)
- [x] 2.3 Implement `resolveMemberWallet` query — looks up wallet address by member name within a pool, returns error if not found
- [x] 2.4 Auto-insert pool creator as `manager` inside the `createPool` mutation (or create it if not yet implemented)
- [x] 2.5 Implement `getMembersForContract` query — returns members as `{name, wallet, role}[]` for inclusion in contract JSON
- [x] 2.6 Set pool `status` to `pre-contract` on creation; add `activatePool` mutation to transition to `active` (called by contract creation flow)

## 3. Join Pool UI

- [x] 3.1 Create `JoinPoolForm` component — name text input + read-only wallet field pre-filled from Solana wallet adapter
- [x] 3.2 Wire `JoinPoolForm` to the `addMember` Convex mutation with loading and error states
- [x] 3.3 Show inline validation errors for duplicate name or duplicate wallet
- [x] 3.4 Prompt user to connect wallet if none is connected when the form is opened
- [x] 3.5 Redirect to pool dashboard on successful join

## 4. Member List UI

- [x] 4.1 Create `MemberList` component — renders name, role badge, and truncated wallet address for each member
- [x] 4.2 Wire `MemberList` to the `getMembers` Convex query on the pool dashboard page
- [x] 4.3 Display founder in member list even when no other members have joined

## 5. Pool Status UI

- [x] 5.1 Add pool status badge to the dashboard header (`pre-contract` = amber warning, `active` = green)
- [x] 5.2 Show a "Create Contract" CTA banner on the dashboard when pool status is `pre-contract` and the viewer is a `manager`
- [x] 5.3 Show a "Waiting for contract" message for non-managers when pool status is `pre-contract`
