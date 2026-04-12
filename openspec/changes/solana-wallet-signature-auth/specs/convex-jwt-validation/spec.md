## ADDED Requirements

### Requirement: Convex validates custom wallet JWT

The system SHALL have a `convex/auth.config.ts` that configures Convex to accept JWTs issued by the wallet challenge/verify flow. `ctx.auth.getUserIdentity()` SHALL return a populated identity (with `subject` equal to the wallet address) for requests that carry a valid JWT.

#### Scenario: Authenticated request resolves identity

- **WHEN** a Convex query or mutation is called with a valid wallet JWT as the bearer token
- **THEN** `ctx.auth.getUserIdentity()` returns `{ subject: "<walletAddress>", ... }`

#### Scenario: Unauthenticated request has no identity

- **WHEN** a Convex query or mutation is called without a bearer token
- **THEN** `ctx.auth.getUserIdentity()` returns `null`

### Requirement: Mutations derive caller identity from auth context

All mutations that previously accepted `wallet` or `founderWallet` as an authorization argument SHALL instead call `ctx.auth.getUserIdentity()` and use `identity.subject` as the wallet address. Mutations SHALL throw a `ConvexError("Unauthenticated")` if the identity is null.

#### Scenario: Authenticated mutation uses server-derived identity

- **WHEN** an authenticated user calls `createPool` (without providing `founderWallet`)
- **THEN** the pool is created with the caller's wallet address derived from `ctx.auth`

#### Scenario: Unauthenticated mutation call is rejected

- **WHEN** a caller invokes a mutation without a valid JWT
- **THEN** the mutation throws `ConvexError("Unauthenticated")` and no data is written

#### Scenario: Wallet address argument removed from mutation API

- **WHEN** a client calls `addMember` or `createPool`
- **THEN** those mutations no longer accept `wallet` or `founderWallet` as arguments
