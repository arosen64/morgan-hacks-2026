## 1. Project Scaffolding

- [x] 1.1 Create workspace `Cargo.toml` at repo root (members: `["programs/treasury"]`)
- [x] 1.2 Create `programs/treasury/Cargo.toml` with Anchor, solana-program dependencies
- [x] 1.3 Create `programs/treasury/src/lib.rs` with empty Anchor program skeleton
- [x] 1.4 Create `Anchor.toml` configured for devnet with wallet pointing to `playground-keypair.json`
- [x] 1.5 Generate playground keypair: `solana-keygen new -o playground-keypair.json` and add it to `.gitignore`

## 2. Account State Definitions

- [x] 2.1 Define `Member` struct: pubkey (Pubkey), username (String, max 50 chars)
- [x] 2.2 Define `ProposalType` enum with variants:
  - `Spending { recipient: Pubkey, amount_lamports: u64 }`
  - `AddMember { new_pubkey: Pubkey, username: String }`
  - `AmendContract { new_hash: [u8; 32] }`
  - `SwitchContract { target_version: u64 }`
- [x] 2.3 Define `ProposalStatus` enum: Pending, Executed, Cancelled, Rejected
- [x] 2.4 Define `Treasury` account struct: authority, bump, pool_id, members (Vec\<Member\>), approval_threshold, proposal_count, has_contract, contract_count, active_version, active_contract_hash, total_deposits
- [x] 2.5 Define `ContractNode` account struct: treasury, version, hash ([u8;32]), prev_version, next_version, has_prev, has_next, bump
- [x] 2.6 Define `Proposal` account struct: treasury, proposer, proposal_id, proposal_type (ProposalType), description, category, has_url, status (ProposalStatus), approvals (Vec\<Pubkey\>), rejections (Vec\<Pubkey\>), required_approvals, bump
- [x] 2.7 Define custom error codes: Unauthorized, InvalidThreshold, InvalidMembers, InvalidAmount, InsufficientFunds, ContractNotSet, ContractAlreadySet, InvalidContractVersion, MemberAlreadyExists, AlreadyVoted, ProposalNotPending

## 3. Treasury Initialization

- [x] 3.1 Implement `initialize_treasury` instruction with accounts: treasury PDA, authority (signer), system_program
- [x] 3.2 Accept `pool_id: [u8; 32]`, `members: Vec<(Pubkey, String)>` (pubkey + username), `approval_threshold: u32`
- [x] 3.3 Validate: members not empty, approval_threshold ≥ 1 and ≤ member count, each username ≤ 50 chars
- [x] 3.4 Initialize all treasury fields; set `has_contract = false`, `proposal_count = 0`, `contract_count = 0`

## 4. Set Initial Contract

- [x] 4.1 Implement `set_contract` instruction with accounts: treasury PDA, contract_node PDA (new), caller (signer, must be member), system_program
- [x] 4.2 Validate: caller is a member, `has_contract = false`
- [x] 4.3 Create `ContractNode` PDA at version 1 (`has_prev = false`, `has_next = false`)
- [x] 4.4 Update treasury: `has_contract = true`, `active_version = 1`, `active_contract_hash = hash`, `contract_count = 1`

## 5. Deposit

- [x] 5.1 Implement `deposit` instruction with accounts: treasury PDA, depositor (signer), system_program
- [x] 5.2 Validate: depositor pubkey is in treasury members list, amount > 0
- [x] 5.3 Transfer lamports from depositor to treasury PDA via `system_program::transfer`
- [x] 5.4 Increment `treasury.total_deposits`

## 6. Proposal Creation

- [x] 6.1 Implement `create_proposal` instruction with accounts: treasury PDA, proposal PDA (new), proposer (signer), system_program
- [x] 6.2 Validate: proposer is a member
- [x] 6.3 For `Spending`: validate `has_contract = true`, `amount > 0`, treasury balance ≥ amount
- [x] 6.4 For `AmendContract` / `SwitchContract`: validate `has_contract = true`; for `SwitchContract` validate `1 ≤ target_version ≤ contract_count`
- [x] 6.5 For `AddMember`: validate new pubkey is not already in members list (no `has_contract` requirement)
- [x] 6.6 Create `Proposal` PDA seeded by `["proposal", treasury_key, proposal_id_le]`, set status `Pending`, copy `required_approvals` from `treasury.approval_threshold`
- [x] 6.7 Increment `treasury.proposal_count`

## 7. Voting and Execution

- [x] 7.1 Implement `vote_on_proposal` instruction with accounts: treasury PDA, proposal PDA (mut), voter (signer), and optional execution-time accounts (recipient for Spending, new contract_node PDA for AmendContract, existing contract_node PDA for SwitchContract)
- [x] 7.2 Validate: voter is a member, proposal status is `Pending`, voter has not already voted
- [x] 7.3 Append voter to `approvals` (if approve) or `rejections` (if reject)
- [x] 7.4 Check rejection threshold: if `rejections.len() > member_count - required_approvals`, set status `Rejected` and return
- [x] 7.5 Check approval threshold: if `approvals.len() >= required_approvals`, execute based on `proposal_type`:
  - **Spending**: deduct lamports from treasury, credit recipient, set status `Executed`
  - **AddMember**: realloc treasury, append `Member { new_pubkey, username }`, set status `Executed`
  - **AmendContract**: create new `ContractNode` PDA, update previous tail's `has_next`/`next_version`, update `treasury.active_version`/`active_contract_hash`/`contract_count`, set status `Executed`
  - **SwitchContract**: load target `ContractNode` PDA, update `treasury.active_version`/`active_contract_hash`, set status `Executed`

## 8. Cancel Proposal

- [x] 8.1 Implement `cancel_proposal` instruction with accounts: proposal PDA (mut), proposer (signer)
- [x] 8.2 Validate: signer matches `proposal.proposer`, `proposal.status == Pending`
- [x] 8.3 Set `proposal.status = Cancelled`

## 9. Demo Wallet (Frontend)

- [x] 9.1 Install `@solana/web3.js` as a frontend dependency
- [x] 9.2 Create `src/lib/demoWallet.ts`: derive a `Keypair` deterministically from a username string using `sha256("demo:" + username)` as the seed (use `tweetnacl` or `@noble/hashes`)
- [x] 9.3 Persist the keypair secret key to `localStorage` as `demo_wallet` (base64-encoded); restore on app load
- [x] 9.4 Create `src/hooks/useWallet.ts`: returns `{ keypair, publicKey, signTransaction }` — compatible interface for both demo keypair and Phantom adapter
- [x] 9.5 On first demo wallet creation (balance = 0), call `connection.requestAirdrop(pubkey, 2_000_000_000)` and await confirmation; show a non-blocking warning if rate-limited
- [x] 9.6 Create `src/components/WalletGate.tsx`: entry-point screen with "Connect Wallet" (Phantom) and "Try Demo" (username input) options; display public key and SOL balance after demo wallet is created
- [x] 9.7 Wire `WalletGate` as the app's root; redirect to main UI once a wallet (demo or Phantom) is active
- [x] 9.8 Add "Log Out" button that clears `demo_wallet` from `localStorage` and returns to `WalletGate`

## 10. Build and Deploy

- [x] 10.1 Run `anchor build` and resolve any compilation errors
- [x] 10.2 Airdrop devnet SOL to playground keypair — fund ARYRLhdPcxMqEz7wwn7xMoeL1pdf4pBarnWWxXeDS2d7 at https://faucet.solana.com then run `./deploy.sh`
- [x] 10.3 Run `anchor deploy --provider.cluster devnet` and record Program ID (handled by `./deploy.sh`)
- [x] 10.4 Update `Anchor.toml` `[programs.devnet]` with deployed Program ID (handled by `./deploy.sh`)
- [x] 10.5 Copy generated IDL (`target/idl/treasury.json`) to `src/idl/treasury.json` for frontend use
- [x] 10.6 Add `VITE_PROGRAM_ID` to `.env.local` with the deployed Program ID
