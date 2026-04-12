## Context

The app uses Phantom wallet connection for UI gating but has no server-side authentication. Convex mutations in `pools.ts`, `members.ts`, and `approvals.ts` accept `founderWallet` and `wallet` as plain string args, meaning the backend cannot distinguish the legitimate owner from an attacker who knows the address. Solana wallet addresses are public, so this offers zero protection.

## Goals / Non-Goals

**Goals:**

- Prove private key ownership via a challenge/signature scheme (sign-in with Solana, SIWS-style)
- Issue a short-lived JWT after verification so Convex `ctx.auth.getUserIdentity()` returns a real identity
- Remove all `wallet`/`founderWallet` args from mutations that use them for authorization
- Invalidate the session when the wallet disconnects

**Non-Goals:**

- OAuth, email, or social login
- Long-lived refresh tokens or persistent sessions beyond wallet connection lifetime
- On-chain transaction signing (only off-chain message signing is required)

## Decisions

### 1. Challenge/nonce flow via Convex HTTP action

A Convex HTTP action (`/auth/challenge`) generates and stores a one-time nonce keyed to the wallet address. The client signs the nonce with Phantom (`signMessage`), then posts the signature to `/auth/verify`. On success the action returns a signed JWT.

**Alternative considered**: Storing nonces in a Convex table vs. in-memory. Convex tables are used so nonces survive cold starts and can be expired via a scheduled job.

### 2. Signature verification with `tweetnacl`

Solana uses Ed25519. `tweetnacl` is a pure-JS, audited library already common in the Solana ecosystem. It can run inside a Convex action (Node.js runtime). `@noble/ed25519` is a fine alternative but requires async; `tweetnacl` is synchronous and simpler.

### 3. JWT minting with `jose`

`jose` supports the Web Crypto API and works in Convex's Node.js action runtime. The JWT payload contains `{ sub: walletAddress, iat, exp }`. A symmetric HS256 secret is stored in a Convex environment variable (`JWT_SECRET`).

### 4. Convex auth config

`convex/auth.config.ts` exports a config with a custom JWT provider pointing at the same `JWT_SECRET`. This makes `ctx.auth.getUserIdentity()` return `{ subject: walletAddress }` on all authenticated calls.

### 5. Mutations derive identity from `ctx.auth`

All mutations that currently accept `wallet`/`founderWallet` for authorization will call `ctx.auth.getUserIdentity()` and throw `ConvexError("Unauthenticated")` if null. The wallet address is read from `identity.subject`.

## Risks / Trade-offs

- **Nonce replay** → Nonces are single-use: deleted immediately after successful verification.
- **JWT secret rotation** → Requires re-login for all users. Acceptable for a hackathon scope; can be mitigated with key versioning later.
- **Clock skew on JWT exp** → Use a 1-hour expiry with a small leeway (60 s) in the Convex validator.
- **tweetnacl bundle size** → ~35 KB minified; negligible for a Convex action.

## Migration Plan

1. Deploy new Convex HTTP actions and `auth.config.ts` behind the existing schema — no breaking change yet.
2. Update frontend `SignInScreen` to perform the challenge/sign/verify flow before entering the app.
3. Migrate mutations one file at a time (`pools` → `members` → `approvals`), replacing wallet args with `ctx.auth` reads.
4. Remove now-unused wallet args from all mutaton validators.
5. Roll back: revert `auth.config.ts` and restore wallet args — sessions fall back to unauthenticated (UI gating still present).

## Open Questions

- Should the nonce table have a TTL-based cleanup job, or is a simple 5-minute expiry checked at verify time sufficient?
- Do `getPoolsByWallet` queries (read-only) also need auth, or is it acceptable to keep them public?
