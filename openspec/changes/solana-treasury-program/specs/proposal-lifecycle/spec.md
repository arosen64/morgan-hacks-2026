## ADDED Requirements

### Requirement: Proposal types

The program SHALL support four proposal types via a `ProposalType` enum stored on each `Proposal` account. All four types share the same approval/rejection/cancellation lifecycle. The type determines what executes when the threshold is reached.

- `Spending { recipient: Pubkey, amount_lamports: u64 }` — transfer SOL from the treasury to a recipient
- `AddMember { new_pubkey: Pubkey, username: String }` — add a new member (pubkey + username) to the treasury
- `AmendContract { new_hash: [u8; 32] }` — append a new contract version to the doubly linked list
- `SwitchContract { target_version: u64 }` — change the active contract to an existing version

#### Scenario: Proposal stores its type

- **WHEN** any proposal is created
- **THEN** the `Proposal` PDA stores the `ProposalType` variant and all type-specific data

#### Scenario: Execution dispatches by type

- **WHEN** the approval threshold is reached
- **THEN** the program executes the action corresponding to the stored `ProposalType` (transfer SOL, add member, append contract node, or update active contract pointer)

### Requirement: Submit a proposal

The program SHALL allow any treasury member to submit any proposal type via `create_proposal`. The proposal SHALL store: proposer pubkey, proposal type + payload, description (max 200 chars), category (max 50 chars), optional URL flag (`has_url: bool`), proposal ID (auto-incremented from `treasury.proposal_count`), and initial status `Pending`. The treasury's `proposal_count` SHALL be incremented. All proposal types except `AddMember` SHALL be rejected if `has_contract = false` on the treasury.

#### Scenario: Successful spending proposal

- **WHEN** a treasury member calls `create_proposal` with type `Spending`, valid amount, and `has_contract = true`
- **THEN** a `Proposal` PDA is created with status `Pending`, empty `approvals` and `rejections`, and `proposal_count` is incremented

#### Scenario: Successful add-member proposal

- **WHEN** a treasury member calls `create_proposal` with type `AddMember` and a pubkey not already in the members list
- **THEN** a `Proposal` PDA is created (this type does not require `has_contract = true`)

#### Scenario: Spending proposal blocked without contract

- **WHEN** a member submits a `Spending`, `AmendContract`, or `SwitchContract` proposal and `has_contract = false`
- **THEN** the instruction fails with `ContractNotSet`

#### Scenario: Non-member proposer rejected

- **WHEN** a signer not in the treasury's members list calls `create_proposal`
- **THEN** the instruction fails with `Unauthorized`

#### Scenario: Zero amount on spending proposal rejected

- **WHEN** a `Spending` proposal is submitted with `amount = 0`
- **THEN** the instruction fails with `InvalidAmount`

#### Scenario: Insufficient treasury balance at proposal time

- **WHEN** a `Spending` proposal is submitted with an amount exceeding the treasury PDA's current lamport balance
- **THEN** the instruction fails with `InsufficientFunds`

#### Scenario: Duplicate add-member proposal rejected

- **WHEN** an `AddMember` proposal is submitted with a pubkey already in the members list
- **THEN** the instruction fails with `MemberAlreadyExists`

#### Scenario: Switch to non-existent contract version rejected

- **WHEN** a `SwitchContract` proposal targets a version number outside `[1, contract_count]`
- **THEN** the instruction fails with `InvalidContractVersion`

### Requirement: Vote on a proposal

The program SHALL allow any treasury member to cast a vote on a `Pending` proposal via `vote_on_proposal`. Each member SHALL vote at most once per proposal; duplicate votes SHALL be rejected. A vote of `approve = true` adds the signer to `approvals`; `approve = false` adds them to `rejections`. When `approvals.len() >= required_approvals`, execution is triggered immediately within the same instruction (auto-execute). When it becomes mathematically impossible to reach the threshold (i.e., `rejections.len() > member_count - required_approvals`), the proposal is marked `Rejected`.

#### Scenario: Approval below threshold

- **WHEN** a member approves and the approval count is still below `required_approvals`
- **THEN** the signer is added to `approvals`, status remains `Pending`

#### Scenario: Final approval triggers immediate execution — Spending

- **WHEN** the threshold-meeting vote is cast on a `Spending` proposal
- **THEN** the treasury transfers `amount` lamports to the `recipient` account in the same instruction, proposal status is set to `Executed`, and the transfer is irrevocable

#### Scenario: Final approval triggers immediate execution — AddMember

- **WHEN** the threshold-meeting vote is cast on an `AddMember` proposal
- **THEN** the new `Member { pubkey, username }` is appended to `treasury.members`, the treasury account is reallocated, and the proposal status is set to `Executed`

#### Scenario: Final approval triggers immediate execution — AmendContract

- **WHEN** the threshold-meeting vote is cast on an `AmendContract` proposal
- **THEN** a new `ContractNode` PDA is created and linked to the previous tail, `treasury.active_version` and `treasury.active_contract_hash` are updated, and the proposal status is set to `Executed`

#### Scenario: Final approval triggers immediate execution — SwitchContract

- **WHEN** the threshold-meeting vote is cast on a `SwitchContract` proposal
- **THEN** `treasury.active_version` and `treasury.active_contract_hash` are updated to the target version's values, and the proposal status is set to `Executed`

#### Scenario: Rejection makes threshold unreachable

- **WHEN** rejections make it impossible for the proposal to ever reach the approval threshold
- **THEN** proposal status is set to `Rejected`

#### Scenario: Duplicate vote rejected

- **WHEN** a member who has already voted calls `vote_on_proposal` again
- **THEN** the instruction fails with `AlreadyVoted`

#### Scenario: Vote on non-pending proposal rejected

- **WHEN** a member votes on a proposal with status `Executed`, `Cancelled`, or `Rejected`
- **THEN** the instruction fails with `ProposalNotPending`

#### Scenario: Non-member voter rejected

- **WHEN** a signer not in the treasury's members list calls `vote_on_proposal`
- **THEN** the instruction fails with `Unauthorized`

### Requirement: Cancel a proposal

The program SHALL allow only the original proposer to cancel a `Pending` proposal at any time before the approval threshold is reached. Cancellation sets the proposal status to `Cancelled`. Once a proposal's status is `Executed`, it cannot be cancelled.

#### Scenario: Proposer cancels pending proposal

- **WHEN** the proposer calls `cancel_proposal` on a `Pending` proposal
- **THEN** the proposal status is set to `Cancelled`

#### Scenario: Non-proposer cancel rejected

- **WHEN** a signer other than the original proposer calls `cancel_proposal`
- **THEN** the instruction fails with `Unauthorized`

#### Scenario: Cancel executed proposal rejected

- **WHEN** `cancel_proposal` is called on a proposal with status `Executed`
- **THEN** the instruction fails with `ProposalNotPending`

### Requirement: Immediate and irrevocable execution

Once the approval threshold is met on-chain, the action corresponding to the proposal type SHALL execute in the same transaction. There SHALL be no separate execution step. For `Spending` proposals, the SOL transfer cannot be reversed.

#### Scenario: Execution is atomic with final approval

- **WHEN** the threshold-meeting vote is cast
- **THEN** the execution and status update to `Executed` occur in the same Solana transaction, succeeding or failing atomically

#### Scenario: Treasury balance insufficient at execution time for Spending proposal

- **WHEN** the treasury has been drained by prior executions and a `Spending` proposal's amount now exceeds the balance at vote time
- **THEN** the instruction fails with `InsufficientFunds` and the vote is not recorded
