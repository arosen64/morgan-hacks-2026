## ADDED Requirements

### Requirement: Demo wallet generation
The app SHALL generate a Solana keypair entirely in-browser when a user requests a demo wallet. The private key SHALL be derived deterministically from a user-chosen username via a seed (e.g., `sha256("demo:" + username)`) so that the same username always recovers the same keypair. The keypair is stored in `localStorage` so the user stays logged in across refreshes.

#### Scenario: User claims a demo wallet
- **WHEN** a user enters a username on the demo wallet screen and clicks "Get Wallet"
- **THEN** a Solana keypair is derived from the username, the public key is displayed, and the keypair is persisted to `localStorage` under `demo_wallet`

#### Scenario: Returning user resumes session
- **WHEN** a user loads the app and a `demo_wallet` entry exists in `localStorage`
- **THEN** the keypair is restored from storage and the user is considered logged in without re-entering their username

#### Scenario: User logs out
- **WHEN** a user clicks "Log Out"
- **THEN** the `demo_wallet` entry is removed from `localStorage` and the user is returned to the wallet selection screen

### Requirement: Demo wallet acts as signer
The demo wallet keypair SHALL be used as the Solana transaction signer everywhere in the app. All Anchor instructions that require a signer (deposit, propose, vote, etc.) SHALL be signed client-side using the in-browser keypair via `@solana/web3.js` `Transaction.sign`. This replaces the need for the Phantom browser extension.

#### Scenario: Transaction signed with demo keypair
- **WHEN** any Solana instruction is invoked from the frontend
- **THEN** the transaction is signed using the demo wallet's `Keypair` and submitted to devnet via a configured RPC endpoint

#### Scenario: Phantom wallet still supported
- **WHEN** a user connects a real Phantom wallet
- **THEN** the app uses the Phantom signer instead of the demo keypair, with no code changes required in the instruction calls (both satisfy the same signer interface)

### Requirement: Pre-funded demo wallet airdrop
When a demo wallet is first created, the app SHALL automatically request a devnet SOL airdrop (up to 2 SOL) to the new public key so the user can immediately pay transaction fees and make deposits without any manual setup.

#### Scenario: Airdrop on first wallet creation
- **WHEN** a new demo keypair is generated for a username that has never been used before (balance = 0)
- **THEN** the app calls `connection.requestAirdrop(pubkey, 2_000_000_000)` and confirms the transaction before proceeding

#### Scenario: Airdrop skipped for returning wallet
- **WHEN** a keypair is restored from `localStorage` and the balance is already > 0
- **THEN** no airdrop is requested

#### Scenario: Airdrop rate-limited by devnet
- **WHEN** the devnet airdrop faucet rejects the request (rate limit)
- **THEN** the app shows a non-blocking warning ("Airdrop rate-limited — you may need to fund this wallet manually") and continues

### Requirement: Wallet selection screen
The app SHALL present a wallet selection screen as the entry point. Users can either (a) connect Phantom / any Solana wallet adapter wallet, or (b) enter a username to get an instant demo wallet. The screen SHALL display the generated public key and current SOL balance after a demo wallet is created.

#### Scenario: Demo path renders
- **WHEN** a user opens the app without an existing session
- **THEN** they see two options: "Connect Wallet" (Phantom) and "Try Demo" (username entry)

#### Scenario: Balance displayed after demo wallet creation
- **WHEN** a demo wallet is generated and the airdrop confirms
- **THEN** the screen shows the public key (truncated) and the SOL balance
