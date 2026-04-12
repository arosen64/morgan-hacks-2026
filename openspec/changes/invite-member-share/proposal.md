## Why

Pool managers need a frictionless way to bring new members into a pool. Currently the "Invite Members" button in the pool dashboard is a no-op, leaving managers with no in-app path to share pool access — new members can only join if they already know the pool's internal ID.

## What Changes

- The "Invite Members" button in `PoolDashboard` opens a share modal instead of doing nothing.
- The modal displays the pool's unique invite link (app URL + pool ID) and a copy-to-clipboard button.
- A "Share" button triggers the device's native share sheet (`navigator.share`) with the invite link and a short message; falls back to a copy action on unsupported browsers.
- The "Join Pool" button in `MainMenu` is enabled and opens an input where users can paste a pool ID or full invite link to navigate directly to the join flow.
- The join URL format is `?pool=<poolId>` as a query parameter so the app can auto-route to `JoinPoolForm` on load.

## Capabilities

### New Capabilities

- `invite-members-modal`: Share modal that displays the pool's invite link with copy and native-share actions, plus a confirmation message after sharing.
- `join-pool-by-id`: Ability to enter or paste a pool ID/invite link from the main menu to jump directly into `JoinPoolForm`.

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `src/components/PoolDashboard.tsx` — wire `Invite Members` onClick to open the new modal.
- `src/components/MainMenu.tsx` — enable the `Join Pool` button and handle pool ID input.
- `src/components/InviteMembersModal.tsx` — new component.
- `src/App.tsx` — read `?pool=` query param on load and skip `MainMenu` if a valid pool ID is present.
- No backend (Convex) changes needed; the existing pool `_id` is the invite identifier.
