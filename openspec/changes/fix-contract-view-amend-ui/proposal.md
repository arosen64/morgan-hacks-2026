## Why

The View Contract and Amend Contract pages currently dump raw JSON to the screen, making them unreadable and confusing for end users. Fixing this is a prerequisite for Iteration 1 usability — users cannot meaningfully review or amend contracts in their current state.

## What Changes

- Replace raw JSON rendering on the View Contract page with a structured, labeled card layout showing each contract field in human-readable form
- Replace the JSON editor on the Amend Contract page with a pre-filled structured form that mirrors the contract fields
- Display contract version and creation date in a clear page header on both pages
- Use human-readable labels throughout (e.g. "Approval Threshold" instead of `approval_threshold`)
- Ensure both pages are responsive and visually consistent with the rest of the app using Tailwind CSS and shadcn/ui

## Capabilities

### New Capabilities

- `contract-view-ui`: Structured, human-readable display of contract fields (members, contribution rules, distribution rules, approval rules, version, date)
- `contract-amend-form`: Pre-filled structured form for amending a contract — replacing the raw JSON editor

### Modified Capabilities

<!-- No existing spec-level behavior is changing — this is purely a UI/rendering fix -->

## Impact

- `src/` pages/components for View Contract and Amend Contract
- No backend/Convex changes needed — data shape is unchanged
- Depends on shadcn/ui component library and Tailwind CSS (already in use in the app)
