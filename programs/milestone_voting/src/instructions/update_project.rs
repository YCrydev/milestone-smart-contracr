use {
    crate::{constants::*, errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct UpdateProjectCtx<'info> {
    #[account(
        mut,
        seeds = [b"project".as_ref(), project.seed_title.as_bytes().as_ref()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,
    ///CHECK:
    pub verified_creator: UncheckedAccount<'info>,
    #[account(mut, constraint = admin.key.to_string() == ADMIN_PUBKEY_STR @ ErrorCode::IncorrectAdmin)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<UpdateProjectCtx>, title: String, is_hidden: bool) -> Result<()> {
    let project = &mut ctx.accounts.project;
    
    project.title = title;
    project.verified_creator = ctx.accounts.verified_creator.key();
    project.is_hidden = is_hidden;
   
    Ok(())
}
