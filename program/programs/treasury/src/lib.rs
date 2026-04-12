use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("GkkgQsMLxjzZ6zxsbSbReyt4pNM8fUBYf98E3KpWvaer");

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_MEMBERS: usize = 20;
const MAX_USERNAME: usize = 50;
const MAX_DESCRIPTION: usize = 200;
const MAX_CATEGORY: usize = 50;

// ─── State ────────────────────────────────────────────────────────────────────

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
    // discriminator(8) + authority(32) + bump(1) + pool_id(32)
    // + members vec len(4) + MAX_MEMBERS * Member::LEN
    // + approval_threshold(4) + proposal_count(8) + has_contract(1)
    // + contract_count(8) + active_version(8) + active_contract_hash(32) + total_deposits(8)
    pub const LEN: usize = 8 + 32 + 1 + 32
        + 4 + MAX_MEMBERS * Member::LEN
        + 4 + 8 + 1 + 8 + 8 + 32 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Member {
    pub pubkey: Pubkey,
    pub username: String,
}

impl Member {
    // pubkey(32) + string len(4) + MAX_USERNAME bytes
    pub const LEN: usize = 32 + 4 + MAX_USERNAME;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MemberInput {
    pub pubkey: Pubkey,
    pub username: String,
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
    // discriminator(8) + treasury(32) + proposer(32) + proposal_id(8)
    // + proposal_type max variant = Spending(32+8)=40, enum disc(1) = 41
    // + description len(4)+MAX_DESCRIPTION + category len(4)+MAX_CATEGORY
    // + has_url(1) + status(1)
    // + approvals len(4) + MAX_MEMBERS*32 + rejections len(4) + MAX_MEMBERS*32
    // + required_approvals(4) + bump(1)
    pub const LEN: usize = 8 + 32 + 32 + 8
        + 1 + 32 + 8   // ProposalType::Spending is largest
        + 4 + MAX_DESCRIPTION
        + 4 + MAX_CATEGORY
        + 1 + 1
        + 4 + MAX_MEMBERS * 32
        + 4 + MAX_MEMBERS * 32
        + 4 + 1;
}

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
    pub const LEN: usize = 8 + 32 + 8 + 32 + 8 + 8 + 1 + 1 + 1;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

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

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod treasury {
    use super::*;

    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        pool_id: [u8; 32],
        members: Vec<MemberInput>,
        approval_threshold: u32,
    ) -> Result<()> {
        require!(!members.is_empty(), TreasuryError::InvalidMembers);
        require!(members.len() <= MAX_MEMBERS, TreasuryError::TooManyMembers);
        require!(
            approval_threshold >= 1 && approval_threshold <= members.len() as u32,
            TreasuryError::InvalidThreshold
        );
        for m in &members {
            require!(m.username.len() <= MAX_USERNAME, TreasuryError::UsernameTooLong);
        }

        let t = &mut ctx.accounts.treasury;
        t.authority = ctx.accounts.authority.key();
        t.bump = ctx.bumps.treasury;
        t.pool_id = pool_id;
        t.members = members
            .iter()
            .map(|m| Member { pubkey: m.pubkey, username: m.username.clone() })
            .collect();
        t.approval_threshold = approval_threshold;
        t.proposal_count = 0;
        t.has_contract = false;
        t.contract_count = 0;
        t.active_version = 0;
        t.active_contract_hash = [0u8; 32];
        t.total_deposits = 0;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, TreasuryError::InvalidAmount);

        // anchor-lang 1.0 CpiContext::new takes Pubkey (program id), not AccountInfo
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.key(),
            system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, amount)?;

        ctx.accounts.treasury.total_deposits = ctx
            .accounts
            .treasury
            .total_deposits
            .saturating_add(amount);
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_type: ProposalType,
        description: String,
        category: String,
        has_url: bool,
    ) -> Result<()> {
        require!(
            description.len() <= MAX_DESCRIPTION,
            TreasuryError::DescriptionTooLong
        );
        require!(
            category.len() <= MAX_CATEGORY,
            TreasuryError::CategoryTooLong
        );

        let treasury = &mut ctx.accounts.treasury;
        let proposal_id = treasury.proposal_count;

        let p = &mut ctx.accounts.proposal;
        p.treasury = treasury.key();
        p.proposer = ctx.accounts.proposer.key();
        p.proposal_id = proposal_id;
        p.proposal_type = proposal_type;
        p.description = description;
        p.category = category;
        p.has_url = has_url;
        p.status = ProposalStatus::Pending;
        p.approvals = vec![ctx.accounts.proposer.key()]; // proposer auto-approves
        p.rejections = vec![];
        p.required_approvals = treasury.approval_threshold;
        p.bump = ctx.bumps.proposal;

        treasury.proposal_count = treasury.proposal_count.saturating_add(1);
        Ok(())
    }

    pub fn vote_on_proposal(ctx: Context<VoteOnProposal>, approve: bool) -> Result<()> {
        let voter = ctx.accounts.voter.key();
        let proposal = &mut ctx.accounts.proposal;

        require!(
            proposal.status == ProposalStatus::Pending,
            TreasuryError::ProposalNotPending
        );
        require!(
            !proposal.approvals.contains(&voter) && !proposal.rejections.contains(&voter),
            TreasuryError::AlreadyVoted
        );

        let threshold = proposal.required_approvals as usize;

        if approve {
            proposal.approvals.push(voter);
            if proposal.approvals.len() >= threshold {
                proposal.status = ProposalStatus::Executed;
            }
        } else {
            proposal.rejections.push(voter);
            let treasury = &ctx.accounts.treasury;
            let total = treasury.members.len();
            let max_remaining_approvals =
                total.saturating_sub(proposal.approvals.len() + proposal.rejections.len());
            if proposal.approvals.len() + max_remaining_approvals < threshold {
                proposal.status = ProposalStatus::Rejected;
            }
        }
        Ok(())
    }

    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(
            proposal.status == ProposalStatus::Pending,
            TreasuryError::ProposalNotPending
        );
        require!(
            proposal.proposer == ctx.accounts.proposer.key(),
            TreasuryError::Unauthorized
        );
        proposal.status = ProposalStatus::Cancelled;
        Ok(())
    }

    pub fn set_contract(ctx: Context<SetContract>, hash: [u8; 32]) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.has_contract = true;
        treasury.contract_count = 1;
        treasury.active_version = 1;
        treasury.active_contract_hash = hash;

        let node = &mut ctx.accounts.contract_node;
        node.treasury = treasury.key();
        node.version = 1;
        node.hash = hash;
        node.prev_version = 0;
        node.next_version = 0;
        node.has_prev = false;
        node.has_next = false;
        node.bump = ctx.bumps.contract_node;
        Ok(())
    }

    pub fn add_contract_node(
        ctx: Context<AddContractNode>,
        new_version: u64,
        new_hash: [u8; 32],
    ) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        require!(treasury.has_contract, TreasuryError::ContractNotSet);
        require!(
            new_version == treasury.contract_count + 1,
            TreasuryError::InvalidContractVersion
        );

        let prev = &mut ctx.accounts.prev_contract_node;
        prev.has_next = true;
        prev.next_version = new_version;

        let node = &mut ctx.accounts.new_contract_node;
        node.treasury = treasury.key();
        node.version = new_version;
        node.hash = new_hash;
        node.prev_version = treasury.contract_count;
        node.next_version = 0;
        node.has_prev = true;
        node.has_next = false;
        node.bump = ctx.bumps.new_contract_node;

        treasury.contract_count = new_version;
        treasury.active_version = new_version;
        treasury.active_contract_hash = new_hash;
        Ok(())
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(pool_id: [u8; 32])]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = Treasury::LEN,
        seeds = [b"treasury", pool_id.as_ref()],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.pool_id.as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.pool_id.as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        init,
        payer = proposer,
        space = Proposal::LEN,
        seeds = [b"proposal", treasury.key().as_ref(), &treasury.proposal_count.to_le_bytes()],
        bump,
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
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        seeds = [b"proposal", treasury.key().as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump,
        has_one = treasury,
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.treasury.as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump,
    )]
    pub proposal: Account<'info, Proposal>,

    pub proposer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetContract<'info> {
    #[account(
        mut,
        seeds = [b"treasury", treasury.pool_id.as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        init,
        payer = caller,
        space = ContractNode::LEN,
        seeds = [b"contract", treasury.key().as_ref(), &1u64.to_le_bytes()],
        bump,
    )]
    pub contract_node: Account<'info, ContractNode>,

    #[account(mut)]
    pub caller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(new_version: u64)]
pub struct AddContractNode<'info> {
    #[account(
        seeds = [b"treasury", treasury.pool_id.as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        seeds = [b"contract", treasury.key().as_ref(), &treasury.active_version.to_le_bytes()],
        bump = prev_contract_node.bump,
    )]
    pub prev_contract_node: Account<'info, ContractNode>,

    #[account(
        init,
        payer = caller,
        space = ContractNode::LEN,
        seeds = [b"contract", treasury.key().as_ref(), &new_version.to_le_bytes()],
        bump,
    )]
    pub new_contract_node: Account<'info, ContractNode>,

    #[account(mut)]
    pub caller: Signer<'info>,

    pub system_program: Program<'info, System>,
}
