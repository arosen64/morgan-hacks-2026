## ADDED Requirements

### Requirement: Member SOL deposit
The program SHALL allow any member of the treasury to deposit SOL into the treasury PDA by calling `deposit`. The deposit is a direct SOL transfer from the signer's account to the treasury PDA. The treasury SHALL track `total_deposits` as the running sum of all deposits received.

#### Scenario: Successful deposit
- **WHEN** a member calls `deposit` with a positive lamport amount and has sufficient balance
- **THEN** the SOL is transferred to the treasury PDA, `total_deposits` is incremented by the deposited amount

#### Scenario: Non-member deposit rejected
- **WHEN** a signer not in the treasury's members list calls `deposit`
- **THEN** the instruction fails with `Unauthorized`

#### Scenario: Zero-amount deposit rejected
- **WHEN** a member calls `deposit` with `amount = 0`
- **THEN** the instruction fails with `InvalidAmount`

#### Scenario: Insufficient balance
- **WHEN** a member calls `deposit` with an amount exceeding their wallet balance
- **THEN** the Solana runtime rejects the transaction before the program executes

### Requirement: Treasury balance reflects deposits and executions
The treasury PDA's lamport balance SHALL reflect all deposits minus all executed proposal amounts. The program does not need a separate `balance` field — the on-chain lamport balance is authoritative.

#### Scenario: Balance after deposit and execution
- **WHEN** a member deposits 1 SOL and a proposal for 0.5 SOL executes
- **THEN** the treasury PDA holds approximately 0.5 SOL (minus rent and fees)
