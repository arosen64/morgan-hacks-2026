## 1. Dependencies & Environment

- [x] 1.1 Add `tweetnacl` and `jose` to `package.json` (and convex `package.json` if separate)
- [x] 1.2 Add `JWT_SECRET` environment variable to Convex dashboard and local `.env.local`

## 2. Nonce Storage Schema

- [x] 2.1 Add a `nonces` table to `convex/schema.ts` with fields `wallet` (string), `nonce` (string), `createdAt` (number), and an index `by_wallet`

## 3. HTTP Auth Actions

- [x] 3.1 Create `convex/auth.ts` with a Hono router (or raw `httpAction`) mounting `POST /auth/challenge` — generate a random nonce, upsert into `nonces` table, return JSON
- [x] 3.2 Implement `POST /auth/verify` in `convex/auth.ts` — look up nonce, check 5-min expiry, verify Ed25519 signature with `tweetnacl`, delete nonce, mint and return JWT with `jose`
- [x] 3.3 Register the HTTP router in `convex/http.ts` (or create the file if absent)

## 4. Convex Auth Config

- [x] 4.1 Create `convex/auth.config.ts` exporting the JWT provider config (algorithm HS256, secret from env var) so Convex validates bearer tokens on every request

## 5. Migrate Mutations to ctx.auth

- [x] 5.1 Update `convex/pools.ts` — remove `founderWallet` arg from `createPool`, read wallet from `ctx.auth.getUserIdentity().subject`, throw `ConvexError("Unauthenticated")` if null
- [x] 5.2 Update `convex/members.ts` — remove `wallet` arg from `addMember` (self-add path), derive wallet from `ctx.auth`
- [x] 5.3 Audit `convex/approvals.ts` and other mutations for any remaining wallet args used for authorization and migrate them

## 6. Frontend Sign-In Flow

- [x] 6.1 Update `src/components/SignInScreen.tsx` to call `/auth/challenge` after wallet connect, invoke `signMessage` via Phantom, post to `/auth/verify`, and store the returned JWT
- [x] 6.2 Pass the JWT to the Convex client (via `ConvexProviderWithAuth` or `setAuth`) so all subsequent calls include the bearer token
- [x] 6.3 Listen for Phantom `disconnect` event and clear JWT + return user to sign-in screen

## 7. Cleanup

- [x] 7.1 Remove `founderWallet` and `wallet` from all mutation `args` validators where they were used for authorization
- [x] 7.2 Update any frontend callers that were passing wallet addresses as mutation arguments
- [x] 7.3 Verify `ctx.auth.getUserIdentity()` returns a valid identity in a running dev environment
