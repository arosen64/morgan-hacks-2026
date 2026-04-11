use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("A governing contract is required before transactions can be proposed")]
    ContractRequired,
    #[msg("This pool already has an initialized contract")]
    ContractAlreadyInitialized,
    #[msg("The provided previous version does not match the pool's active contract hash")]
    InvalidPreviousVersion,
    #[msg("Only a manager may append a contract version")]
    NotManager,
}
