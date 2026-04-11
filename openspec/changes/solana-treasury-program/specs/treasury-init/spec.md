## ADDED Requirements

### Requirement: Treasury initialization

The program SHALL allow a founder to initialize a treasury PDA seeded by a unique `pool_id`. The treasury SHALL record the authority (founder), initial member list, and approval threshold. The treasury SHALL start with `has_contract = false`, blocking proposal submission until a contract is set. The `approval_threshold` MUST never exceed the current member count; this invariant is enforced on initialization and any time the threshold or member list changes.

#### Scenario: Successful initialization

- **WHEN** a founder calls `initialize_treasury` with a valid `pool_id`, at least one member pubkey, and an `approval_threshold` between 1 and member count (inclusive)
- **THEN** a treasury PDA is created, `has_contract` is `false`, `proposal_count` is `0`, `contract_count` is `0`

#### Scenario: Threshold exceeds member count

- **WHEN** `approval_threshold` is greater than the number of members provided
- **THEN** the instruction fails with `InvalidThreshold`

#### Scenario: Empty member list

- **WHEN** the members array is empty
- **THEN** the instruction fails with `InvalidMembers`

### Requirement: Add member via approval

The program SHALL allow any existing member to propose adding a new member by submitting a `ProposalType::AddMember` proposal (pubkey + username). The contract (stored in Convex, hash on-chain) defines the approval rules (anyone, named set, unanimous, k-of-n); on-chain the `approval_threshold` is the enforced count. The member is added when the proposal reaches the threshold via the standard proposal lifecycle. The `approval_threshold` MUST remain ≤ the updated member count after the new member is added. Adding a member does NOT require `has_contract = true` — a group can add members before setting a contract.

#### Scenario: Approved member addition executes

- **WHEN** an `AddMember` proposal reaches `required_approvals`
- **THEN** `Member { pubkey, username }` is appended to `treasury.members`, the account is reallocated, and the proposal is marked `Executed`

#### Scenario: Duplicate member proposal rejected

- **WHEN** an `AddMember` proposal is submitted with a pubkey already in the members list
- **THEN** the instruction fails with `MemberAlreadyExists`

#### Scenario: Non-member proposer rejected

- **WHEN** a signer not in the current members list submits an `AddMember` proposal
- **THEN** the instruction fails with `Unauthorized`

#### Scenario: Threshold invariant maintained after add

- **WHEN** a new member is added and the resulting member count is still ≥ `approval_threshold`
- **THEN** the addition succeeds and `approval_threshold` is unchanged
