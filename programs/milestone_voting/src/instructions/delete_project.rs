use {
    crate::{constants::*, errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct DeleteProjectCtx<'info> {
    #[account(
        mut,
        seeds = [b"project".as_ref(), project.title.as_bytes().as_ref()],
        bump = project.bump,
        close=admin,
    )]
    pub project: Account<'info, Project>,

    #[account(mut, constraint = admin.key.to_string() == ADMIN_PUBKEY_STR @ ErrorCode::IncorrectAdmin)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(_ctx: Context<DeleteProjectCtx>) -> Result<()> {
    Ok(())
}
