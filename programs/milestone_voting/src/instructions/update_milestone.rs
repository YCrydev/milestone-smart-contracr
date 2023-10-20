use {
    crate::{constants::*, errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdateMilestoneCtx<'info> {
    #[account(mut, 
        seeds = [b"milestone".as_ref(), project.key().as_ref(), milestone.seed_title.as_bytes().as_ref()], 
        bump,
    )]
    milestone: Box<Account<'info, Milestone>>,
    #[account(mut,
        seeds = [b"project".as_ref(), project.seed_title.as_bytes().as_ref()],
        bump = project.bump,
        )]
    project: Box<Account<'info, Project>>,
    #[account(mut, constraint = admin.key.to_string() == ADMIN_PUBKEY_STR @ ErrorCode::IncorrectAdmin)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<UpdateMilestoneCtx>, title: String, start_time: u64, end_time: u64, description: String) -> Result<()> {
    let milestone = &mut ctx.accounts.milestone;

    milestone.title = title;
    milestone.start_time = start_time;
    milestone.end_time = end_time;
    milestone.description = description;
    
    Ok(())
}
