use {
    crate::{constants::*, errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, TokenAccount},
};
use anchor_spl::token;
use anchor_spl::token::Transfer;

#[derive(Accounts)]
pub struct DepositIntoProjectCtx<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [project.key().as_ref(), b"auth"],
        bump = project.auth_bump,
    )]
    /// CHECK:
    authority: AccountInfo<'info>,
    #[account(mut,
        seeds = [b"project".as_ref(), project.seed_title.as_bytes().as_ref()],
        bump = project.bump,
        )]
    project: Box<Account<'info, Project>>,
    #[account(mut, constraint = project.token_mint == token_mint.key() @ ErrorCode::IncorrectTokenMint)]
    pub token_mint: Box<Account<'info, Mint>>,
    #[account(mut, constraint =
        from_token_account.mint == token_mint.key()
        && from_token_account.owner == user.key()
        @ ErrorCode::InvalidMintTokenAccount
    )]
    from_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut,
        seeds = [b"token".as_ref(), project.key().as_ref()],
        bump,
        token::mint = token_mint.key(),
        token::authority = authority
    )]
    to_token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK:
    #[account(mut, constraint = admin.key.to_string() == ADMIN_PUBKEY_STR @ ErrorCode::IncorrectAdmin)]
    pub admin: AccountInfo<'info>,
    /// CHECK:
    pub token_program: AccountInfo<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> DepositIntoProjectCtx<'info> {
    pub fn into_spl_token_account_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = token::Transfer {
            from: self.from_token_account.to_account_info(),
            to: self.to_token_account.to_account_info(),
            authority: self.user.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

pub fn handler(ctx: Context<DepositIntoProjectCtx>, amount: u64) -> Result<()> {
    token::transfer(
        ctx.accounts.into_spl_token_account_ctx(),
        amount,
    )?;

    Ok(())
}
