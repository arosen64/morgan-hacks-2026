// Task 2.4 — propose_transaction stub: errors if no contract exists on pool
use anchor_lang::prelude::*;
use crate::state::Pool;
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(pool_id: [u8; 32])]
pub struct ProposeTransaction<'info> {
    #[account(
        seeds = [b"pool", pool_id.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, Pool>,

    pub proposer: Signer<'info>,
}

pub fn handler(ctx: Context<ProposeTransaction>, _pool_id: [u8; 32]) -> Result<()> {
    require!(
        ctx.accounts.pool.has_contract(),
        ErrorCode::ContractRequired
    );
    // Full transaction proposal logic implemented in issue #8
    Ok(())
}
