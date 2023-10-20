// evaluates milestone to see if it passed

use {
    crate::{constants::*, errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct EvaluateCtx<'info> {
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
    /// CHECK:
    #[account(mut, constraint = admin.key.to_string() == ADMIN_PUBKEY_STR @ ErrorCode::IncorrectAdmin)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<EvaluateCtx>) -> Result<()> {
    let milestone = &ctx.accounts.milestone.clone();
    let milestone_mut = &mut ctx.accounts.milestone;

    let current_ts = Clock::get()?.unix_timestamp;

    // if milestone end time has passed, mark as completed
    if current_ts > milestone.end_time.try_into().unwrap() && !milestone.is_complete {
        milestone_mut.is_complete = true;
    }

    // check if milestone was completed 
    if !milestone_mut.is_complete {
        msg!("Milestone not completed");
        return Ok(());
    }

    // check that milestone has started
    if current_ts < milestone.start_time.try_into().unwrap() {
        msg!("Milestone has not started");
        return Ok(());
    }

    // check if milestone has quorum
    let total_votes = milestone.yes_tally + milestone.no_tally;

    if milestone.quorum > total_votes {
        msg!("Milestone only has {} of {} votes", total_votes.to_string(), milestone.quorum.to_string());
        return Ok(());
    }
    
    // check if milestone met percentage threshold
    let yes_tally = milestone.yes_tally as f64;
    let total_votes = total_votes as f64;
    let pass_percentage = milestone.pass_percentage as f64;

    let percentage_yes: f64 = (yes_tally / total_votes) * 100.00;

    if pass_percentage > percentage_yes {
        msg!("Milestone does not pass {}", percentage_yes);
        msg!("{}, {}, {}", yes_tally, total_votes, pass_percentage);
        return Ok(());
    }

    msg!("quorum {}, pass percent {}", milestone.quorum, milestone.pass_percentage);
    msg!("yes {}, total {}, percent {}", yes_tally, total_votes, percentage_yes);

    milestone_mut.has_passed = true;

    Ok(())
}
