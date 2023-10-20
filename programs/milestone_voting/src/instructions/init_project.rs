use {
    crate::{constants::*, errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, TokenAccount},
};

#[derive(Accounts)]
#[instruction(auth_bump: u8, seed_title: String)]
pub struct InitProjectCtx<'info> {
    #[account(
        mut,
        seeds = [project.key().as_ref(), b"auth"],
        bump = auth_bump,
    )]
    /// CHECK:
    authority: AccountInfo<'info>,
    #[account(
        init,
        seeds = [b"project".as_ref(), seed_title.as_bytes().as_ref()],
        bump,
        payer = admin,
        space = PROJECT_SIZE,
    )]
    pub project: Account<'info, Project>,
    ///CHECK:
    pub verified_creator: UncheckedAccount<'info>,
    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,
    #[account(init,
        seeds = [b"token".as_ref(), project.key().as_ref()],
        bump,
        payer = admin,
        token::mint = token_mint,
        token::authority = authority
    )]
    token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = admin.key.to_string() == ADMIN_PUBKEY_STR @ ErrorCode::IncorrectAdmin)]
    pub admin: Signer<'info>,
    /// CHECK:
    pub token_program: AccountInfo<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitProjectCtx>, auth_bump: u8, seed_title: String, is_hidden: bool) -> Result<()> {
    let project = &mut ctx.accounts.project;

    project.authority = ctx.accounts.authority.key();
    project.seed_title = seed_title.clone();
    project.title = seed_title;
    project.is_hidden = is_hidden;
    project.verified_creator = ctx.accounts.verified_creator.key();
    project.token_mint = ctx.accounts.token_mint.key();
    project.bump = *ctx.bumps.get("project").unwrap();
    project.auth_bump = auth_bump;

    Ok(())
}
