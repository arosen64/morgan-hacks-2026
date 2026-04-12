use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("5hMtfmxu4ryajWx9CwiP6jQaB6tAtKhEnmBdrTPLFSo5");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_MEMBERS: usize = 20;
const MAX_USERNAME_LEN: usize = 50;
const MAX_DESCRIPTION_LEN: usize = 200;
const MAX_CATEGORY_LEN: usize = 50;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Member {
    pub pubkey: Pubkey,
    pub username: String,
}

impl Member {
    pub const MAX_SIZE: usize = 32 + 4 + MAX_USERNAME_LEN;
}

/// Input type for member initialization (avoids tuple which IDL doesn't support).
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MemberInput {
    pub pubkey: Pubkey,
    pub username: String,
}

/// All proposal variants. SwitchContract also stores the target hash so
/// execution never needs to re-read a separate account.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ProposalType {
    Spending {
        recipient: Pubkey,
        amount_lamports: u64,
    },
    AddMember {
        new_pubkey: Pubkey,
        username: String,
    },
    AmendContract {
        new_hash: [u8; 32],
    },
    /// target_hash is fetched from the ContractNode PDA off-chain and stored
    /// here so execution requires no extra accounts.
    SwitchContract {
        target_version: u64,
        target_hash: [u8; 32],
    },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ProposalStatus {
    Pending,
    Executed,
    Cancelled,
    Rejected,
}

#[account]
pub struct Treasury {
    pub authority: Pubkey,
    pub bump: u8,
    pub pool_id: [u8; 32],
    pub members: Vec<Member>,
    pub approval_threshold: u32,
    pub proposal_count: u64,
    pub has_contract: bool,
    pub contract_count: u64,
    pub active_version: u64,
    pub active_contract_hash: [u8; 32],
    pub total_deposits: u64,
}

impl Treasury {
    pub const BASE_SIZE: usize = 8   // discriminator
        + 32  // authority
        + 1   // bump
        + 32  // pool_id
        + 4   // members vec len prefix
        + 4   // approval_threshold
        + 8   // proposal_count
        + 1   // has_contract
        + 8   // contract_count
        + 8   // active_version
        + 32  // active_contract_hash
        + 8;  // total_deposits

    pub fn space(member_count: usize) -> usize {
        Self::BASE_SIZE + member_count * Member::MAX_SIZE
    }

    pub fn is_member(&self, key: &Pubkey) -> bool {
        self.members.iter().any(|m| m.pubkey == *key)
    }
}

#[account]
pub struct ContractNode {
    pub treasury: Pubkey,
    pub version: u64,
    pub hash: [u8; 32],
    pub prev_version: u64,
    pub next_version: u64,
    pub has_prev: bool,
    pub has_next: bool,
    pub bump: u8,
}

impl ContractNode {
    pub const SIZE: usize = 8 + 32 + 8 + 32 + 8 + 8 + 1 + 1 + 1;
}

#[account]
pub struct Proposal {
    pub treasury: Pubkey,
    pub proposer: Pubkey,
    pub proposal_id: u64,
    pub proposal_type: ProposalType,
    pub description: String,
    pub category: String,
    pub has_url: bool,
    pub status: ProposalStatus,
    pub approvals: Vec<Pubkey>,
    pub rejections: Vec<Pubkey>,
    pub required_approvals: u32,
    pub bump: u8,
}

impl Proposal {
    // Borsh serializes enums as 1-byte discriminant + fields of the active variant only.
    // The largest variant is AddMember: 1 (disc) + 32 (pubkey) + 4 (len) + 50 (username) = 87.
    // (Spending=41, AmendContract=33, SwitchContract=41 — all smaller.)
    const PROPOSAL_TYPE_MAX_SIZE: usize = 1 + 32 + 4 + MAX_USERNAME_LEN; // 87

    pub const BASE_SIZE: usize = 8      // discriminator
        + 32   // treasury
        + 32   // proposer
        + 8    // proposal_id
        + Self::PROPOSAL_TYPE_MAX_SIZE  // proposal_type (worst-case AddMember variant)
        + 4 + MAX_DESCRIPTION_LEN  // description
        + 4 + MAX_CATEGORY_LEN     // category
        + 1    // has_url
        + 1    // status
        + 4 + 32 * MAX_MEMBERS  // approvals
        + 4 + 32 * MAX_MEMBERS  // rejections
        + 4    // required_approvals
        + 1;   // bump
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum TreasuryError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid threshold: must be ≥ 1 and ≤ member count")]
    InvalidThreshold,
    #[msg("Invalid members: at least one member required")]
    InvalidMembers,
    #[msg("Invalid amount: must be > 0")]
    InvalidAmount,
    #[msg("Insufficient funds in treasury")]
    InsufficientFunds,
    #[msg("Contract not set")]
    ContractNotSet,
    #[msg("Contract already set")]
    ContractAlreadySet,
    #[msg("Invalid contract version")]
    InvalidContractVersion,
    #[msg("Member already exists")]
    MemberAlreadyExists,
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
    #[msg("Proposal is not pending")]
    ProposalNotPending,
    #[msg("Username exceeds 50 characters")]
    UsernameTooLong,
    #[msg("Description exceeds 200 characters")]
    DescriptionTooLong,
    #[msg("Category exceeds 50 characters")]
    CategoryTooLong,
    #[msg("Too many members: max 20")]
    TooManyMembers,
}

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

#[program]
pub mod treasury {
    use super::*;

    // -----------------------------------------------------------------------
    // initialize_treasury
    // -----------------------------------------------------------------------
    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        pool_id: [u8; 32],
        members: Vec<MemberInput>,
        approval_threshold: u32,
    ) -> Result<()> {
        require!(!members.is_empty(), TreasuryError::InvalidMembers);
        require!(members.len() <= MAX_MEMBERS, TreasuryError::TooManyMembers);
        require!(
            approval_threshold >= 1 && approval_threshold as usize <= members.len(),
            TreasuryError::InvalidThreshold
        );
        for m in &members {
            require!(m.username.len() <= MAX_USERNAME_LEN, TreasuryError::UsernameTooLong);
        }

        let t = &mut ctx.accounts.treasury;
        t.authority = ctx.accounts.authority.key();
        t.bump = ctx.bumps.treasury;
        t.pool_id = pool_id;
        t.approval_threshold = approval_threshold;
        t.proposal_count = 0;
        t.has_contract = false;
        t.contract_count = 0;
        t.active_version = 0;
        t.active_contract_hash = [0u8; 32];
        t.total_deposits = 0;
        t.members = members
            .into_iter()
            .map(|m| Member { pubkey: m.pubkey, username: m.username })
            .collect();

        Ok(())
    }

    // -----------------------------------------------------------------------
    // set_contract  (first contract — no vote required)
    // -----------------------------------------------------------------------
    pub fn set_contract(ctx: Context<SetContract>, hash: [u8; 32]) -> Result<()> {
        let caller = ctx.accounts.caller.key();
        let treasury = &mut ctx.accounts.treasury;

        require!(treasury.is_member(&caller), TreasuryError::Unauthorized);
        require!(!treasury.has_contract, TreasuryError::ContractAlreadySet);

        let node = &mut ctx.accounts.contract_node;
        node.treasury = treasury.key();
        node.version = 1;
        node.hash = hash;
        node.prev_version = 0;
        node.next_version = 0;
        node.has_prev = false;
        node.has_next = false;
        node.bump = ctx.bumps.contract_node;

        treasury.has_contract = true;
        treasury.active_version = 1;
        treasury.active_contract_hash = hash;
        treasury.contract_count = 1;

        Ok(())
    }

    // -----------------------------------------------------------------------
    // add_contract_node  (called after an AmendContract proposal executes)
    // Links the new ContractNode PDA into the doubly linked list and
    // updates the previous tail node to point forward to the new one.
    // -----------------------------------------------------------------------
    pub fn add_contract_node(
        ctx: Context<AddContractNode>,
        new_version: u64,
        new_hash: [u8; 32],
    ) -> Result<()> {
        let treasury = &ctx.accounts.treasury;
        let caller = ctx.accounts.caller.key();

        require!(treasury.is_member(&caller), TreasuryError::Unauthorized);
        // The treasury must already reflect this version (set by the executed proposal).
        require!(
            treasury.has_contract && treasury.contract_count == new_version,
            TreasuryError::InvalidContractVersion
        );
        require!(
            treasury.active_contract_hash == new_hash,
            TreasuryError::InvalidContractVersion
        );

        let prev_version = new_version - 1;

        // Update previous tail node
        let prev_node = &mut ctx.accounts.prev_contract_node;
        require!(
            prev_node.treasury == treasury.key() && prev_node.version == prev_version,
            TreasuryError::InvalidContractVersion
        );
        prev_node.has_next = true;
        prev_node.next_version = new_version;

        // Initialize new node
        let new_node = &mut ctx.accounts.new_contract_node;
        new_node.treasury = treasury.key();
        new_node.version = new_version;
        new_node.hash = new_hash;
        new_node.prev_version = prev_version;
        new_node.next_version = 0;
        new_node.has_prev = true;
        new_node.has_next = false;
        new_node.bump = ctx.bumps.new_contract_node;

        Ok(())
    }

    // -----------------------------------------------------------------------
    // deposit
    // -----------------------------------------------------------------------
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let depositor_key = ctx.accounts.depositor.key();
        require!(ctx.accounts.treasury.is_member(&depositor_key), TreasuryError::Unauthorized);
        require!(amount > 0, TreasuryError::InvalidAmount);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.depositor.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            amount,
        )?;

        ctx.accounts.treasury.total_deposits =
            ctx.accounts.treasury.total_deposits.saturating_add(amount);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // create_proposal
    // -----------------------------------------------------------------------
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_type: ProposalType,
        description: String,
        category: String,
        has_url: bool,
    ) -> Result<()> {
        require!(description.len() <= MAX_DESCRIPTION_LEN, TreasuryError::DescriptionTooLong);
        require!(category.len() <= MAX_CATEGORY_LEN, TreasuryError::CategoryTooLong);

        let proposer_key = ctx.accounts.proposer.key();
        let treasury = &mut ctx.accounts.treasury;
        require!(treasury.is_member(&proposer_key), TreasuryError::Unauthorized);

        match &proposal_type {
            ProposalType::Spending { amount_lamports, .. } => {
                require!(treasury.has_contract, TreasuryError::ContractNotSet);
                require!(*amount_lamports > 0, TreasuryError::InvalidAmount);
                let bal = treasury.to_account_info().lamports();
                let rent_min = Rent::get()?.minimum_balance(treasury.to_account_info().data_len());
                let available = bal.saturating_sub(rent_min);
                require!(available >= *amount_lamports, TreasuryError::InsufficientFunds);
            }
            ProposalType::AmendContract { .. } => {
                require!(treasury.has_contract, TreasuryError::ContractNotSet);
            }
            ProposalType::SwitchContract { target_version, .. } => {
                require!(treasury.has_contract, TreasuryError::ContractNotSet);
                require!(
                    *target_version >= 1 && *target_version <= treasury.contract_count,
                    TreasuryError::InvalidContractVersion
                );
            }
            ProposalType::AddMember { new_pubkey, username } => {
                require!(username.len() <= MAX_USERNAME_LEN, TreasuryError::UsernameTooLong);
                require!(!treasury.is_member(new_pubkey), TreasuryError::MemberAlreadyExists);
            }
        }

        let proposal_id = treasury.proposal_count;
        let required_approvals = treasury.approval_threshold;
        treasury.proposal_count += 1;

        let p = &mut ctx.accounts.proposal;
        p.treasury = treasury.key();
        p.proposer = proposer_key;
        p.proposal_id = proposal_id;
        p.proposal_type = proposal_type;
        p.description = description;
        p.category = category;
        p.has_url = has_url;
        p.status = ProposalStatus::Pending;
        p.approvals = Vec::new();
        p.rejections = Vec::new();
        p.required_approvals = required_approvals;
        p.bump = ctx.bumps.proposal;

        Ok(())
    }

    // -----------------------------------------------------------------------
    // vote_on_proposal
    // -----------------------------------------------------------------------
    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        approve: bool,
    ) -> Result<()> {
        let voter_key = ctx.accounts.voter.key();

        require!(ctx.accounts.treasury.is_member(&voter_key), TreasuryError::Unauthorized);
        require!(
            ctx.accounts.proposal.status == ProposalStatus::Pending,
            TreasuryError::ProposalNotPending
        );
        require!(
            !ctx.accounts.proposal.approvals.contains(&voter_key)
                && !ctx.accounts.proposal.rejections.contains(&voter_key),
            TreasuryError::AlreadyVoted
        );

        let member_count = ctx.accounts.treasury.members.len() as u32;
        let required_approvals = ctx.accounts.proposal.required_approvals;

        if approve {
            ctx.accounts.proposal.approvals.push(voter_key);
        } else {
            ctx.accounts.proposal.rejections.push(voter_key);
        }

        // Check if rejection makes threshold unreachable
        let rejection_count = ctx.accounts.proposal.rejections.len() as u32;
        if rejection_count > member_count.saturating_sub(required_approvals) {
            ctx.accounts.proposal.status = ProposalStatus::Rejected;
            return Ok(());
        }

        // Check if approval threshold is met → execute
        let approval_count = ctx.accounts.proposal.approvals.len() as u32;
        if approval_count >= required_approvals {
            let proposal_type = ctx.accounts.proposal.proposal_type.clone();

            match proposal_type {
                ProposalType::Spending { recipient, amount_lamports } => {
                    // recipient must be passed as a writable account in remaining_accounts
                    let recipient_info = ctx
                        .remaining_accounts
                        .iter()
                        .find(|a| a.key() == recipient)
                        .ok_or(error!(TreasuryError::Unauthorized))?;

                    let treasury_info = ctx.accounts.treasury.to_account_info();
                    let treasury_lamports = treasury_info.lamports();
                    let rent_min = Rent::get()?.minimum_balance(treasury_info.data_len());
                    let available = treasury_lamports.saturating_sub(rent_min);
                    require!(available >= amount_lamports, TreasuryError::InsufficientFunds);

                    **treasury_info.try_borrow_mut_lamports()? -= amount_lamports;
                    **recipient_info.try_borrow_mut_lamports()? += amount_lamports;
                }

                ProposalType::AddMember { new_pubkey, username } => {
                    require!(
                        !ctx.accounts.treasury.is_member(&new_pubkey),
                        TreasuryError::MemberAlreadyExists
                    );
                    // Realloc treasury account to fit the new member
                    let current_len = ctx.accounts.treasury.to_account_info().data_len();
                    let new_len = current_len + Member::MAX_SIZE;
                    ctx.accounts.treasury.to_account_info().realloc(new_len, false)?;
                    ctx.accounts.treasury.members.push(Member { pubkey: new_pubkey, username });
                }

                ProposalType::AmendContract { new_hash } => {
                    // Update treasury state; ContractNode PDA is linked by
                    // a follow-up add_contract_node call from the frontend.
                    let treasury = &mut ctx.accounts.treasury;
                    treasury.contract_count += 1;
                    treasury.active_version = treasury.contract_count;
                    treasury.active_contract_hash = new_hash;
                }

                ProposalType::SwitchContract { target_version, target_hash } => {
                    // Hash was captured at proposal creation from the on-chain node;
                    // no extra account needed.
                    require!(
                        target_version >= 1 && target_version <= ctx.accounts.treasury.contract_count,
                        TreasuryError::InvalidContractVersion
                    );
                    let treasury = &mut ctx.accounts.treasury;
                    treasury.active_version = target_version;
                    treasury.active_contract_hash = target_hash;
                }
            }

            ctx.accounts.proposal.status = ProposalStatus::Executed;
        }

        Ok(())
    }

    // -----------------------------------------------------------------------
    // cancel_proposal
    // -----------------------------------------------------------------------
    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        let proposer_key = ctx.accounts.proposer.key();
        let proposal = &mut ctx.accounts.proposal;

        require!(proposal.proposer == proposer_key, TreasuryError::Unauthorized);
        require!(proposal.status == ProposalStatus::Pending, TreasuryError::ProposalNotPending);

        proposal.status = ProposalStatus::Cancelled;
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Accounts contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(pool_id: [u8; 32], members: Vec<MemberInput>, approval_threshold: u32)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = Treasury::space(members.len().min(MAX_MEMBERS)),
        seeds = [b"treasury", pool_id.as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(hash: [u8; 32])]
pub struct SetContract<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.pool_id.as_ref()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        init,
        payer = caller,
        space = ContractNode::SIZE,
        seeds = [b"contract", treasury.key().as_ref(), &1u64.to_le_bytes()],
        bump
    )]
    pub contract_node: Account<'info, ContractNode>,

    #[account(mut)]
    pub caller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(new_version: u64, new_hash: [u8; 32])]
pub struct AddContractNode<'info> {
    #[account(
        seeds = [b"treasury", treasury.pool_id.as_ref()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        seeds = [b"contract", treasury.key().as_ref(), &(new_version - 1).to_le_bytes()],
        bump = prev_contract_node.bump
    )]
    pub prev_contract_node: Account<'info, ContractNode>,

    #[account(
        init,
        payer = caller,
        space = ContractNode::SIZE,
        seeds = [b"contract", treasury.key().as_ref(), &new_version.to_le_bytes()],
        bump
    )]
    pub new_contract_node: Account<'info, ContractNode>,

    #[account(mut)]
    pub caller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.pool_id.as_ref()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proposal_type: ProposalType, description: String, category: String, has_url: bool)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.pool_id.as_ref()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        init,
        payer = proposer,
        space = Proposal::BASE_SIZE,
        seeds = [b"proposal", treasury.key().as_ref(), &treasury.proposal_count.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteOnProposal<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.pool_id.as_ref()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        seeds = [b"proposal", treasury.key().as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump,
        has_one = treasury
    )]
    pub proposal: Account<'info, Proposal>,

    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.treasury.as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub proposer: Signer<'info>,
}
