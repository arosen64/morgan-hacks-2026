## Why

The current login flow connects a Phantom wallet but never verifies ownership on the backend — wallet addresses are passed as plain arguments, meaning any caller can impersonate any wallet. Server-side authentication is required to enforce access control.

## What Changes

- Users sign a challenge message with their Phantom wallet; the signature is verified server-side and a JWT is issued
- Convex is configured to validate that JWT via `convex/auth.config.ts`
- All mutations replace untrusted `wallet`/`founderWallet` arguments with `ctx.auth.getUserIdentity()` for identity derivation
- **BREAKING**: `founderWallet`, `wallet`, and similar caller-supplied address arguments are removed from mutations
- Wallet disconnection invalidates the session

## Capabilities

### New Capabilities

- `wallet-challenge-auth`: Challenge/response flow where the frontend requests a nonce, signs it with Phantom, posts the signature to a Convex HTTP action, and receives a JWT
- `convex-jwt-validation`: Convex auth config that validates the custom JWT so `ctx.auth.getUserIdentity()` returns a populated identity for authenticated wallet users

### Modified Capabilities

- None

## Impact

- `convex/auth.config.ts` — new file configuring JWT validation
- `convex/` mutations (`pools`, `members`, `approvals`, etc.) — remove wallet address args, use `ctx.auth.getUserIdentity()`
- `src/components/SignInScreen.tsx` — add challenge-sign step before granting app access
- New Convex HTTP action to verify Solana signature and mint JWT
- Adds `@noble/ed25519` (or `tweetnacl`) for server-side signature verification and `jose` for JWT minting
