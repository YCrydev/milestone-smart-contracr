use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Incorrect admin")]
    IncorrectAdmin, // 6001
    #[msg("Invalid NFT metadata")]
    InvalidNFTMetadata, // 6001
    #[msg("Bad Metadata")]
    BadMetadata, // 6002
    #[msg("Invalid NFT mint")]
    InvalidUserOriginalMintTokenAccount, // 6003
    #[msg("Milestone has not started")]
    MilestoneNotStarted, // 6004
    #[msg("Milestone has ended")]
    MilestoneEnded, // 6005
    #[msg("Invalid mint token account")]
    InvalidMintTokenAccount, // 6006
    #[msg("Incorrect token mint")]
    IncorrectTokenMint, // 6007
    #[msg("Milestone is incomplete")]
    MilestoneIncomplete, // 6008
    #[msg("Milestone has not passed")]
    MilestoneNotPassed, // 6009
    #[msg("Invalid Calculation")]
    InvalidCalculation, // 6010
    #[msg("Already released funds")]
    MilestoneAlreadyReleased, // 6011
}