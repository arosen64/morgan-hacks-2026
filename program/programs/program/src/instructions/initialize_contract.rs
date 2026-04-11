// Task 2.2 — initialize_contract: creates v1 ContractVersion PDA, sets hash, updates Pool
use anchor_lang::prelude::*;
use crate::state::{Pool, ContractVersion};
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(pool_id: [u8; 32], hash: [u8; 32])]
pub struct InitializeContract<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool_id.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init,
        payer = authority,
        space = ContractVersion::LEN,
        seeds = [b"contract_version", pool.key().as_ref(), &1u32.to_le_bytes()],
        bump,
    )]
    pub contract_version: Account<'info, ContractVersion>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeContract>, _pool_id: [u8; 32], hash: [u8; 32]) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    require!(pool.version_count == 0, ErrorCode::ContractAlreadyInitialized);

    let cv = &mut ctx.accounts.contract_version;
    cv.hash = hash;
    cv.prev_hash = [0u8; 32];
    cv.next_hash = [0u8; 32];
    cv.version_number = 1;
    cv.bump = ctx.bumps.contract_version;

    pool.active_contract_hash = hash;
    pool.version_count = 1;

    Ok(())
}
