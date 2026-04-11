use anchor_lang::prelude::*;

// Tasks 1.3 + 1.5 — Pool account, seeded by [b"pool", pool_id_bytes]
#[account]
#[derive(Default)]
pub struct Pool {
    /// SHA-256 hash of the active contract JSON (zeroed = no contract yet)
    pub active_contract_hash: [u8; 32],
    /// Number of contract versions committed for this pool
    pub version_count: u32,
    /// PDA bump
    pub bump: u8,
}

impl Pool {
    pub const LEN: usize = 8  // discriminator
        + 32   // active_contract_hash
        + 4    // version_count
        + 1;   // bump

    pub fn has_contract(&self) -> bool {
        self.active_contract_hash != [0u8; 32]
    }
}

// Tasks 1.4 + 1.5 — ContractVersion account, seeded by [b"contract_version", pool_pubkey, version_number_le_bytes]
#[account]
#[derive(Default)]
pub struct ContractVersion {
    /// SHA-256 hash of this version's canonical contract JSON
    pub hash: [u8; 32],
    /// Hash of the previous version (zeroed for v1)
    pub prev_hash: [u8; 32],
    /// Hash of the next version (zeroed if this is the latest)
    pub next_hash: [u8; 32],
    /// 1-based version number
    pub version_number: u32,
    /// PDA bump
    pub bump: u8,
}

impl ContractVersion {
    pub const LEN: usize = 8  // discriminator
        + 32   // hash
        + 32   // prev_hash
        + 32   // next_hash
        + 4    // version_number
        + 1;   // bump
}
