## ADDED Requirements

### Requirement: Treasury PDA derivation

Pool-to-PDA mapping is deterministic: SHA-256(UTF-8(convexPoolId)) → 32-byte seed → `findProgramAddressSync(["treasury", seed], PROGRAM_ID)`.

#### Scenario: Same pool ID always yields same PDA

- **WHEN** `getTreasuryPda(poolId)` is called multiple times with the same pool ID
- **THEN** The same `PublicKey` is returned each time

### Requirement: Add Money modal

Any authenticated pool member can open the deposit modal from the dashboard.

#### Scenario: Modal shows wallet balance

- **WHEN** The modal opens
- **THEN** The user's current Phantom wallet balance in SOL is displayed

#### Scenario: Validation prevents zero or negative deposit

- **WHEN** The user enters 0 or a negative amount and clicks Deposit
- **THEN** The button is disabled and no transaction is sent

### Requirement: On-chain deposit

Depositing sends a confirmed Solana transaction to the treasury program.

#### Scenario: First deposit initializes treasury then deposits

- **WHEN** The treasury PDA has no on-chain account
- **THEN** `initialize_treasury` is sent and confirmed before `deposit`

#### Scenario: Subsequent deposits skip initialization

- **WHEN** The treasury PDA account already exists
- **THEN** Only the `deposit` instruction is sent

#### Scenario: Insufficient balance shows error

- **WHEN** The requested amount exceeds the wallet balance
- **THEN** The error is shown in the modal and no transaction is submitted

#### Scenario: Rejected signature shows error

- **WHEN** The user rejects the Phantom signature request
- **THEN** "Transaction rejected" error is shown in the modal

### Requirement: Convex contribution tracking

After a confirmed deposit, `contributedLamports` is incremented for the depositing member.

#### Scenario: recordDeposit updates member contribution

- **WHEN** `recordDeposit(poolId, lamports)` is called
- **THEN** The calling member's `contributedLamports` is incremented by `lamports`

### Requirement: Treasury balance display

The dashboard shows the live on-chain SOL balance of the treasury PDA.

#### Scenario: Balance refreshes after deposit

- **WHEN** A deposit is confirmed
- **THEN** The treasury balance on the dashboard updates to reflect the new on-chain balance
