use {
    crate::{constants::*, errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(auth_bump: u8, seed_title: String)]
pub struct AddMilestoneCtx<'info> {
    #[account(
        mut,
        seeds = [project.key().as_ref(), b"auth"],
        bump = auth_bump,
    )]
    /// CHECK:
    authority: AccountInfo<'info>,
    #[account(init, 
        seeds = [b"milestone".as_ref(), project.key().as_ref(), seed_title.as_bytes().as_ref()], 
        bump, 
        payer = admin, 
        space = MILESTONE_SIZE)] // seed should contain some sort of user generated string
    milestone: Box<Account<'info, Milestone>>,
    #[account(mut,
        seeds = [b"project".as_ref(), project.seed_title.as_bytes().as_ref()],
        bump = project.bump,
        )]
    project: Box<Account<'info, Project>>,
    ///CHECK:
    pub payment_acct: UncheckedAccount<'info>,
    #[account(mut, constraint = admin.key.to_string() == ADMIN_PUBKEY_STR @ ErrorCode::IncorrectAdmin)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<AddMilestoneCtx>, _auth_bump: u8, seed_title: String, start_time: u64, end_time: u64, amount: u64, quorum: u64, pass_percentage: u64, description: String) -> Result<()> {
    let milestone = &mut ctx.accounts.milestone;
    milestone.seed_title = seed_title.clone();
    milestone.title = seed_title;
    milestone.start_time = start_time;
    milestone.end_time = end_time;
    milestone.yes_tally = 0;
    milestone.no_tally = 0;
    milestone.project = ctx.accounts.project.key();
    milestone.is_complete = false;
    milestone.has_passed = false;
    milestone.amount = amount;
    milestone.payment_acct = ctx.accounts.payment_acct.key();
    milestone.funds_released = false;
    milestone.quorum = quorum;
    milestone.pass_percentage = pass_percentage;
    milestone.bump = *ctx.bumps.get("milestone").unwrap();
    milestone.description = description;
    
    Ok(())
}
