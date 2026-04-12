## Context

The pool dashboard has an "Invite Members" button that does nothing (issue #29). The app routes are managed entirely in `App.tsx` via React state — there is no URL router. The pool's Convex document ID (`_id`) is already a globally unique identifier that can serve as the invite code without any backend changes. The `JoinPoolForm` component already accepts a `poolId` prop and handles the full join flow.

## Goals / Non-Goals

**Goals:**

- Open a share modal when "Invite Members" is clicked, showing a copyable invite link built from `window.location.origin + ?pool=<poolId>`.
- Support native device share sheet via `navigator.share` with a fallback to clipboard copy.
- Enable the "Join Pool" button in `MainMenu` so a user can paste or type a pool ID to navigate to `JoinPoolForm`.
- Auto-route to the join flow on page load when `?pool=<poolId>` is present in the URL.

**Non-Goals:**

- Invite link expiry or revocation (v1 — valid indefinitely).
- SMS deep-link generation beyond `navigator.share`.
- Role-based restrictions on who can invite (any pool member can share).
- Server-side invite tracking or analytics.

## Decisions

### Use pool `_id` as the invite identifier (no separate invite code)

The Convex `_id` is already unique, immutable, and URL-safe. Generating a separate invite code would require a schema change, migration, and new Convex queries. The `_id` is already used to navigate to a pool inside the app, so sharing it as the join parameter is consistent with the existing join flow.

_Alternative considered:_ A short alphanumeric invite code stored on the pool document. Rejected for v1 due to schema complexity and no expiry requirement.

### Encode the pool ID as a `?pool=` query parameter in the invite URL

Reading `window.location.search` on app mount is the simplest way to pass context without a router. The app already manages all navigation via React state in `App.tsx`, so we add a one-time read of the query string at startup and treat a valid `?pool=` param the same as selecting a pool from the menu.

_Alternative considered:_ Hash routing (`#/join/<id>`). Rejected — the app has no router and adding one just for this case is over-engineering.

### `InviteMembersModal` as a standalone component controlled by `PoolDashboard`

The modal is self-contained: it receives `poolId` and `poolName` as props and manages its own open/close state. `PoolDashboard` owns the trigger button and passes the props. This matches the pattern used by other sub-pages in the dashboard.

### `navigator.share` with clipboard fallback

`navigator.share` is the spec-standard Web Share API and works natively on iOS and Android Chrome. Desktop Chrome also supports it. For unsupported browsers (Firefox desktop) we fall back to `navigator.clipboard.writeText`. The share button label changes to "Copied!" for 2 seconds as a confirmation.

## Risks / Trade-offs

- **`?pool=` param persists in the URL after joining** → Mitigation: after auto-routing on load, replace the history entry via `window.history.replaceState` to strip the param so a page refresh doesn't re-trigger the join flow.
- **`navigator.share` requires a user gesture** → Already satisfied because it's always triggered by the "Share" button click.
- **Pool ID exposure** → The `_id` is already visible in Convex queries; treating it as a shareable identifier adds no new attack surface beyond what already exists.
