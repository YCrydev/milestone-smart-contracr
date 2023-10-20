use anchor_lang::prelude::*;

// https://www.anchor-lang.com/docs/space

#[account]
pub struct Project {
    pub seed_title: String, // 4 + 256
    pub title: String, // 4 + 256 (max byte length)
    pub authority: Pubkey, // 32
    pub verified_creator: Pubkey, // 32
    pub is_hidden: bool, // 1
    pub token_mint: Pubkey, // 32
    pub bump: u8, // 1
    pub auth_bump: u8, // 1
}

// discriminator + string + pubkey + pubkey + bool + u8 + extra padding
pub const PROJECT_SIZE: usize = 8 + 4 + 256 + 4 + 256 + 32 + 32 + 1 + 32 + 1 + 1 + 32;

#[account]
pub struct Milestone {
    pub seed_title: String, // 4 + 256
    pub title: String, // 4 + 256
    pub start_time: u64, // 8
    pub end_time: u64, // 8
    pub yes_tally: u64, // 8
    pub no_tally: u64, // 8
    pub project: Pubkey, // 32
    pub is_complete: bool, // 1
    pub has_passed: bool, // 1
    pub amount: u64, // 8
    pub payment_acct: Pubkey, // 32
    pub funds_released: bool, // 1
    pub quorum: u64, // 8 
    pub pass_percentage: u64, // 8
    pub bump: u8, // 1
    pub description: String, // 4 + 256
}

// discriminator + string + u64 + u64 + u64 + u64 + pubkey + bool + pubkey + u8 + u8 + extra padding
pub const MILESTONE_SIZE: usize = 8 + 4 + 256 + 4 + 256 + 8 + 8 + 8 + 8 + 32 + 1 + 1 + 8 + 32 + 1 + 8 + 8 + 1 + 32 + 8 + 4 + 256;

#[account]
pub struct Vote {
    pub owner: Pubkey, // 32
    pub mint: Pubkey, // 32
    pub time: i64, // 8
    pub project: Pubkey, // 32
    pub milestone: Pubkey, // 32
    pub is_yes_vote: bool, // 1
}

// discriminator + pubkey + pubkey + i64 + pubkey + pubkey + bool + extra padding
pub const VOTE_SIZE: usize = 8 + 32 + 32 + 8 + 32 + 32 + 1 + 32;
