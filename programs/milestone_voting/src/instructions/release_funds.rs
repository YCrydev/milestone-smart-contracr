// this is to release funds back to team
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
pub struct ReleaseFundsCtx<'info> {
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
    #[account(mut, 
        seeds = [b"milestone".as_ref(), project.key().as_ref(), milestone.seed_title.as_bytes().as_ref()], 
        bump,
    )]
    milestone: Box<Account<'info, Milestone>>,
    #[account(mut, constraint = project.token_mint == token_mint.key() @ ErrorCode::IncorrectTokenMint)]
    pub token_mint: Box<Account<'info, Mint>>,
    #[account(mut,
        seeds = [b"token".as_ref(), project.key().as_ref()],
        bump,
        token::mint = project.token_mint,
        token::authority = authority
    )]
    from_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint =
        to_token_account.mint == project.token_mint
        && to_token_account.owner == milestone.payment_acct.key()
        @ ErrorCode::InvalidMintTokenAccount
    )]
    to_token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK:
    #[account(mut, constraint = admin.key.to_string() == ADMIN_PUBKEY_STR @ ErrorCode::IncorrectAdmin)]
    pub admin: Signer<'info>,
    /// CHECK:
    pub token_program: AccountInfo<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ReleaseFundsCtx<'info> {
    pub fn into_spl_token_account_ctx(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = token::Transfer {
            from: self.from_token_account.to_account_info(),
            to: self.to_token_account.to_account_info(),
            authority: self.authority.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

pub fn handler(ctx: Context<ReleaseFundsCtx>) -> Result<()> {
    let milestone = &ctx.accounts.milestone;

    // check if milestone was voted to allow release
      if !milestone.has_passed {
        return err!(ErrorCode::MilestoneNotPassed);
    }

    if milestone.funds_released {
        return err!(ErrorCode::MilestoneAlreadyReleased);
    }

    // program signs the transfer from project pool
    let project_pk = ctx.accounts.project.key();
    let seeds = &[
        project_pk.as_ref(),
        b"auth".as_ref(),
        &[ctx.accounts.project.auth_bump],
    ];
    token::transfer(
        ctx.accounts
            .into_spl_token_account_ctx()
            .with_signer(&[&seeds[..]]),
        milestone.amount,
    )?;
    
    let milestone_mut = &mut ctx.accounts.milestone;
    milestone_mut.funds_released = true;

    Ok(())
}
