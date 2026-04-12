## Context

`PoolDashboard.tsx` is the current entry point after a pool is selected from `MainMenu`. It is an old prototype with mismatched UI. `App.tsx` renders it with props `{ poolId, walletAddress, onBack }`. The Potlock design system is established by `SignInScreen.tsx` and `MainMenu.tsx`: violet accent (violet-500/600/700), `bg-background` body, `border-border` dividers, shadcn Card/Button/Badge, top nav with Potlock logo on the left and a Disconnect button on the right.

## Goals / Non-Goals

**Goals:**

- Rewrite `PoolDashboard.tsx` in the Potlock visual language, keeping the same props signature
- Header: Potlock top nav (logo + Disconnect) with a back chevron and pool name below it
- Treasury balance: prominent SOL figure in a Card
- Members: Card list with name, truncated wallet, contributed SOL, and role badge
- Actions: grid of five labeled stub Buttons

**Non-Goals:**

- Any action button functionality (Request Transaction #25, Contract #26, All Transactions #27, Add Money #28, Invite Members #29)
- On-chain balance fetch (no Buffer/PDA derivation — show placeholder until Add Money is built)
- Changes to `App.tsx`, `MainMenu.tsx`, or the Convex schema

## Decisions

**Rewrite PoolDashboard.tsx, same file and export**
`App.tsx` imports `PoolDashboard` by name. Keeping the filename and export avoids touching `App.tsx`.

**Top nav identical to MainMenu**
The Potlock logo + Disconnect button repeats on every authenticated screen. Copy the pattern from `MainMenu.tsx` exactly so navigation feels consistent.

**Back navigation as `← Pool name` breadcrumb**
Rather than a generic back button, show `← Pool name` below the nav so the user knows where they are and where they're going.

**Treasury balance shows "—" until Add Money is wired**
No Buffer or on-chain calls. Displaying a placeholder is honest and avoids the browser `buffer` crash seen previously.

**Action buttons in a 2-column grid**
Five buttons fit cleanly in a 2-column grid (2 + 2 + 1). Each button uses `variant="outline"` with a fixed height, matching the secondary button style from the rest of the app.

**Member wallet truncation: first 4 + "…" + last 4**
Short enough to fit in a single line on mobile without wrapping.

## Risks / Trade-offs

- **Treasury balance is a stub** — will say "—" until issue #28. Acceptable since no funds flow yet.
- **Role badge derived from wallet match** — if `walletAddress` doesn't match any member (e.g. viewing a pool they were removed from), the badge defaults to "Member". No error state needed.

## Open Questions

None.
