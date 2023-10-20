use {
    crate::{constants::*, errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

use super::MetadataAccount;
use super::TokenMetadata;
use crate::metadata::Metadata;
use mpl_token_metadata::state::PREFIX;

use anchor_spl::token::TokenAccount;
use anchor_spl::token::Mint;

#[derive(Accounts)]
pub struct VoteCtx<'info> {
    #[account(
        init,
        seeds = [b"vote".as_ref(), milestone.key().as_ref(), nft_mint.key().as_ref()],
        bump,
        payer = voter,
        space = VOTE_SIZE,
    )]
    pub vote: Account<'info, Vote>,
    pub nft_mint: Box<Account<'info, Mint>>,
    ///CHECK::
    #[account(
        mut,
        seeds = ["metadata".as_ref(), nft_program_id.key().as_ref(), nft_mint.key().as_ref()],
        seeds::program = nft_program_id.key(),
        bump,
    )]
    pub nft_metadata: Box<Account<'info, MetadataAccount>>,
    #[account(mut, constraint =
        nft_token_account.amount > 0
        && nft_token_account.mint == nft_mint.key()
        && nft_token_account.owner == voter.key()
        @ ErrorCode::InvalidUserOriginalMintTokenAccount
    )]
    nft_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut,
        seeds = [b"project".as_ref(), project.seed_title.as_bytes().as_ref()],
        bump = project.bump,
        )]
    project: Box<Account<'info, Project>>,
    #[account(mut, 
        seeds = [b"milestone".as_ref(), project.key().as_ref(), milestone.seed_title.as_bytes().as_ref()], 
        bump,
    )]
    milestone: Box<Account<'info, Milestone>>,

    #[account(mut)]
    pub voter: Signer<'info>,
    /// CHECK:
    #[account(mut, constraint = admin.key.to_string() == ADMIN_PUBKEY_STR @ ErrorCode::IncorrectAdmin)]
    pub admin: AccountInfo<'info>,
    /// CHECK:
    pub nft_program_id: Program<'info, TokenMetadata>,
    /// CHECK:
    pub token_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> VoteCtx<'info> {
    pub fn validate_nft_metadata_with_creator_vec(
        &self,
        nft: &Box<Account<'info, Mint>>,
        nft_metadata: &Box<Account<'info, MetadataAccount>>,
        given_verified_creator_vec: Vec<Pubkey>,
    ) -> Result<()> {
        let (expected_metadata, _) = Pubkey::find_program_address(
            &[
                PREFIX.as_bytes(),
                Metadata::owner().as_ref(),
                nft.key().as_ref(),
            ],
            &Metadata::owner(),
        );

        if nft_metadata.key().ne(&expected_metadata) {
            msg!(&format!(
                "metadata key -> expected: {}, found: {}",
                expected_metadata.to_string(),
                nft_metadata.key().to_string()
            ));
            return err!(ErrorCode::InvalidNFTMetadata);
        }

        if let Some(creators) = &nft_metadata.data.creators {
            let verified_creator = creators.iter().find(|creator| {
                given_verified_creator_vec.contains(&creator.address) && creator.verified
            });

            if verified_creator.is_none() {
                msg!("creator didn't match, expected");
                return err!(ErrorCode::InvalidNFTMetadata);
            }
        } else {
            msg!("creator didn't match, expected");
            return err!(ErrorCode::InvalidNFTMetadata);
        }
        Ok(())
    }
}

pub fn handler(ctx: Context<VoteCtx>, vote: bool) -> Result<()> {
    // verify creator of the nft
    ctx.accounts.validate_nft_metadata_with_creator_vec(
        &ctx.accounts.nft_mint,
        &ctx.accounts.nft_metadata,
        vec![ctx.accounts.project.verified_creator],
    )?;



    let current_ts = Clock::get()?.unix_timestamp;

    if !ctx.accounts.milestone.is_complete && current_ts < ctx.accounts.milestone.end_time.try_into().unwrap() {
        return err!(ErrorCode::MilestoneIncomplete);
    }

    // check that milestone has started
    if current_ts < ctx.accounts.milestone.start_time.try_into().unwrap() {
        return err!(ErrorCode::MilestoneNotStarted);
    }

    msg!("current time {}", current_ts);
    msg!("end time {}", ctx.accounts.milestone.end_time);

    let vote_acct = &mut ctx.accounts.vote;

    vote_acct.owner = ctx.accounts.voter.key();
    vote_acct.mint = ctx.accounts.nft_mint.key();
    vote_acct.time = current_ts;
    vote_acct.project = ctx.accounts.project.key();
    vote_acct.milestone = ctx.accounts.milestone.key();
    vote_acct.is_yes_vote = vote;

    let milestone = &mut ctx.accounts.milestone;
    if vote {
        milestone.yes_tally += 1;
    } else {
        milestone.no_tally += 1;
    }

    Ok(())
}
