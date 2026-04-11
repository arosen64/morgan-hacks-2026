## Why

Group treasury pools need to know who their members are before any governance can happen — approval rules reference members by name, contracts list them with roles, and the UI needs to show who approved or proposed what. Without a member registry, the pool is ungovernable.

## What Changes

- Members can join a pool by submitting their name and Solana wallet address
- Each member is assigned a role (`manager` or `member`) at join time
- Name→wallet mapping is stored in Convex DB and used throughout approval rule evaluation
- Duplicate names or wallet addresses within the same pool are rejected
- A member list is displayed on the pool dashboard
- The current member list (name, wallet, role) is exposed for inclusion in the contract JSON when Gemini formalizes the contract — members must be registered before contract creation can begin

## Capabilities

### New Capabilities

- `member-registry`: Store and manage pool members (name, wallet, role) in Convex DB with uniqueness enforcement per pool
- `member-onboarding-ui`: Frontend form for joining a pool and a member list view on the pool dashboard

### Modified Capabilities

<!-- None — no existing specs yet -->

## Impact

- **Convex DB**: New `members` table with pool association, name, wallet address, and role; `pools` table gains a `status` field (`pre-contract` | `active`) to block transactions until a contract exists
- **Frontend**: New onboarding form component and member list view on the pool dashboard; contract creation is gated behind having at least one member registered
- **Approval rules**: Name→wallet resolution logic must reference this registry at rule evaluation time
- **Contract JSON**: The `members` array in the generated contract JSON is populated directly from the Convex member registry at the moment of contract creation
