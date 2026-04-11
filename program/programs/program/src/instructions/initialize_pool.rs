// Task 2.1 — initialize_pool: creates Pool PDA with zeroed active_contract_hash
use anchor_lang::prelude::*;
use crate::state::Pool;

#[derive(Accounts)]
#[instruction(pool_id: [u8; 32])]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = Pool::LEN,
        seeds = [b"pool", pool_id.as_ref()],
        bump,
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePool>, _pool_id: [u8; 32]) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    pool.active_contract_hash = [0u8; 32];
    pool.version_count = 0;
    pool.bump = ctx.bumps.pool;
    Ok(())
}
