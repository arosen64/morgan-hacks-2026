## 1. Main Menu Copy Updates (`src/components/MainMenu.tsx`)

- [x] 1.1 Change badge text from "Investment Pools" to "Your Pots"
- [x] 1.2 Change page heading from "My Pools" to "My Pots"
- [x] 1.3 Rewrite description to remove "investment" framing (e.g. "Manage your pots or start a new one with people you trust.")
- [x] 1.4 Change "+ Create Pool" button label to "+ Create Pot"
- [x] 1.5 Change "Join Pool" button label to "Join Pot"
- [x] 1.6 Update empty state: "No pools yet" → "No pots yet" and fix supporting copy

## 2. Create Flow Copy Updates (`src/components/CreatePoolFlow.tsx`)

- [x] 2.1 Change step header "Create a Pool" to "Create a Pot"
- [x] 2.2 Change input label "Pool Name" to "Pot Name"

## 3. Pot Dashboard Copy Updates (`src/components/PoolDashboard.tsx`)

- [x] 3.1 Change fallback heading "Pool" to "Pot"

## 4. Sign-In Screen Copy Updates (`src/components/SignInScreen.tsx`)

- [x] 4.1 Rewrite hero tagline to remove "invest" framing (e.g. "The smarter way to manage money with people you trust.")
- [x] 4.2 Rewrite wallet connection description to remove "investment pools" (e.g. "Connect your Phantom wallet to access your pots.")

## 5. Verification

- [x] 5.1 Grep `src/` for remaining user-visible "pool" / "Pool" strings and confirm all are internal identifiers (not UI copy)
- [x] 5.2 Grep `src/` for "invest" and confirm no occurrences remain in user-visible strings
- [x] 5.3 Manually verify the main menu, create flow, dashboard, and sign-in screen render correctly with updated copy
- [x] 5.4 Check for any test files asserting on old label strings and update them
