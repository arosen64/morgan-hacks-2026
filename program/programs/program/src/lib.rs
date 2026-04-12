pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::{
    initialize::*,
    initialize_pool::*,
    initialize_contract::*,
    append_contract_version::*,
    propose_transaction::*,
};

declare_id!("BFTWuWFcjmLi6t1sHZpC15eE2WzZKFHqdFsJnwtGdAaM");

#[program]
pub mod group_treasury {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn initialize_pool(ctx: Context<InitializePool>, pool_id: [u8; 32]) -> Result<()> {
        instructions::initialize_pool::handler(ctx, pool_id)
    }

    pub fn initialize_contract(
        ctx: Context<InitializeContract>,
        pool_id: [u8; 32],
        hash: [u8; 32],
    ) -> Result<()> {
        instructions::initialize_contract::handler(ctx, pool_id, hash)
    }

    pub fn append_contract_version(
        ctx: Context<AppendContractVersion>,
        pool_id: [u8; 32],
        new_hash: [u8; 32],
    ) -> Result<()> {
        instructions::append_contract_version::handler(ctx, pool_id, new_hash)
    }

    pub fn propose_transaction(ctx: Context<ProposeTransaction>, pool_id: [u8; 32]) -> Result<()> {
        instructions::propose_transaction::handler(ctx, pool_id)
    }
}
