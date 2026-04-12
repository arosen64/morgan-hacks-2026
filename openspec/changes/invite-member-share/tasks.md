## 1. InviteMembersModal Component

- [x] 1.1 Create `src/components/InviteMembersModal.tsx` accepting `poolId`, `poolName`, `open`, and `onClose` props
- [x] 1.2 Build the invite link from `window.location.origin + "?pool=" + poolId`
- [x] 1.3 Implement "Copy" button using `navigator.clipboard.writeText` with "Copied!" confirmation label for 2 seconds
- [x] 1.4 Implement "Share" button using `navigator.share` with fallback to clipboard copy when unsupported
- [x] 1.5 Show confirmation message ("Link copied!" / "Shared!") after any successful action
- [x] 1.6 Add a close/dismiss button that calls `onClose`

## 2. Wire Modal into PoolDashboard

- [x] 2.1 Add `inviteOpen` state to `PoolDashboard`
- [x] 2.2 Update the "Invite Members" action's `onClick` to set `inviteOpen` to `true`
- [x] 2.3 Render `<InviteMembersModal>` in `PoolDashboard` with `poolId`, `poolName`, `open={inviteOpen}`, and `onClose`

## 3. Join Pool by ID from MainMenu

- [x] 3.1 Add `joinOpen` state and a pool-ID input state to `MainMenu`
- [x] 3.2 Enable the "Join Pool" button and wire its `onClick` to show the ID input (inline or small dialog)
- [x] 3.3 Parse the entered value: if it contains `?pool=`, extract the ID; otherwise treat the raw value as the pool ID
- [x] 3.4 On confirm, call `onSelectPool` with the parsed pool ID to navigate to `JoinPoolForm`

## 4. Invite Link Auto-Routing on Page Load

- [x] 4.1 In `App.tsx`, read `new URLSearchParams(window.location.search).get("pool")` once on mount
- [x] 4.2 If a `?pool=` value is present, store it as the initial pool selection (bypasses `MainMenu`)
- [x] 4.3 Call `window.history.replaceState({}, "", window.location.pathname)` after reading the param to strip it from the URL
- [x] 4.4 Ensure unauthenticated users still see the sign-in screen first; the pool ID is held in state until they connect their wallet
