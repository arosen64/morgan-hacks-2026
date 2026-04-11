// Task 2.3 — append_contract_version: links new version, updates Pool active hash
use anchor_lang::prelude::*;
use crate::state::{Pool, ContractVersion};
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(pool_id: [u8; 32], new_hash: [u8; 32])]
pub struct AppendContractVersion<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_id.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, Pool>,

    /// The current active ContractVersion — will have its next_hash updated
    #[account(mut)]
    pub current_version: Account<'info, ContractVersion>,

    #[account(
        init,
        payer = authority,
        space = ContractVersion::LEN,
        seeds = [
            b"contract_version",
            pool.key().as_ref(),
            &(pool.version_count + 1).to_le_bytes(),
        ],
        bump,
    )]
    pub new_version: Account<'info, ContractVersion>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AppendContractVersion>,
    _pool_id: [u8; 32],
    new_hash: [u8; 32],
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // Verify current_version is actually the active version
    require!(
        ctx.accounts.current_version.hash == pool.active_contract_hash,
        ErrorCode::InvalidPreviousVersion
    );

    let prev_hash = pool.active_contract_hash;
    let new_version_number = pool.version_count + 1;

    // Link forward from old version
    ctx.accounts.current_version.next_hash = new_hash;

    // Create new version
    let nv = &mut ctx.accounts.new_version;
    nv.hash = new_hash;
    nv.prev_hash = prev_hash;
    nv.next_hash = [0u8; 32];
    nv.version_number = new_version_number;
    nv.bump = ctx.bumps.new_version;

    // Update pool
    pool.active_contract_hash = new_hash;
    pool.version_count = new_version_number;

    Ok(())
}
