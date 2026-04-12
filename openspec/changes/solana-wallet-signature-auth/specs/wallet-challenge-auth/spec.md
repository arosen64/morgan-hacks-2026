## ADDED Requirements

### Requirement: Request a sign-in challenge

The system SHALL expose a Convex HTTP action (`POST /auth/challenge`) that accepts a wallet address and returns a unique nonce string. The nonce SHALL be stored server-side keyed to the wallet address with a 5-minute expiry.

#### Scenario: Challenge issued for new wallet

- **WHEN** the frontend posts `{ wallet: "<address>" }` to `/auth/challenge`
- **THEN** the server stores a nonce and returns `{ nonce: "<nonce>" }`

#### Scenario: Challenge replaces existing nonce

- **WHEN** a second challenge is requested for the same wallet before the first expires
- **THEN** the old nonce is overwritten and a new one is returned

### Requirement: Verify signature and issue JWT

The system SHALL expose a Convex HTTP action (`POST /auth/verify`) that accepts a wallet address, the original nonce, and the Ed25519 signature produced by signing that nonce. On successful verification the action SHALL return a signed JWT. The nonce SHALL be deleted after use.

#### Scenario: Valid signature returns JWT

- **WHEN** the frontend posts `{ wallet, nonce, signature }` with a valid Ed25519 signature
- **THEN** the server returns `{ token: "<jwt>" }` and deletes the nonce

#### Scenario: Invalid signature is rejected

- **WHEN** the posted signature does not verify against the wallet's public key and nonce
- **THEN** the server returns HTTP 401 and no token is issued

#### Scenario: Expired nonce is rejected

- **WHEN** the posted nonce is older than 5 minutes
- **THEN** the server returns HTTP 401 with an "expired nonce" message

#### Scenario: Unknown nonce is rejected

- **WHEN** the posted nonce does not match the stored nonce for that wallet
- **THEN** the server returns HTTP 401

### Requirement: Frontend performs challenge/sign/verify on connect

The frontend SHALL, after Phantom wallet connection, request a challenge, call `window.phantom.solana.signMessage` with the nonce, and post the result to `/auth/verify`. The returned JWT SHALL be stored in component state and passed to Convex as a bearer token. The app SHALL not render the main UI until a valid JWT is held.

#### Scenario: Successful sign-in flow

- **WHEN** the user connects their Phantom wallet and approves the sign message prompt
- **THEN** the app receives a JWT and proceeds to the main menu

#### Scenario: User rejects sign message

- **WHEN** the user dismisses the Phantom sign message prompt
- **THEN** the app remains on the sign-in screen and shows an error message

### Requirement: Wallet disconnection invalidates session

The system SHALL clear the stored JWT and return the user to the sign-in screen when the wallet disconnects.

#### Scenario: Wallet disconnected clears session

- **WHEN** the Phantom wallet fires a disconnect event
- **THEN** the JWT is cleared from state and the user sees the sign-in screen
