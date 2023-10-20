pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
pub mod metadata;

use anchor_lang::prelude::*;

use instructions::*;

declare_id!("3cHchq7GaE9v1nXrDoGGRgqP25vbvAbJjKp6mh5xN2RU");

#[program]
pub mod milestone_voting {
    use super::*;

    pub fn init_project(ctx: Context<InitProjectCtx>, auth_bump: u8, seed_title: String, is_hidden: bool) -> Result<()> {
        init_project::handler(ctx, auth_bump, seed_title, is_hidden)
    }

    pub fn update_project(ctx: Context<UpdateProjectCtx>, title: String, is_hidden: bool) -> Result<()> {
        update_project::handler(ctx, title, is_hidden)
    }

    pub fn delete_project(ctx: Context<DeleteProjectCtx>) -> Result<()> {
        delete_project::handler(ctx)
    }

    pub fn deposit_into_project(ctx: Context<DepositIntoProjectCtx>, amount: u64) -> Result<()> {
        deposit_into_project::handler(ctx, amount)
    }

    pub fn add_milestone(ctx: Context<AddMilestoneCtx>, auth_bump: u8, seed_title: String, start_time: u64, end_time: u64, amount: u64, quorum: u64, pass_percentage: u64, description: String) -> Result<()> {
        add_milestone::handler(ctx, auth_bump, seed_title, start_time, end_time, amount, quorum, pass_percentage, description)
    }

    pub fn update_milestone(ctx: Context<UpdateMilestoneCtx>, title: String, start_time: u64, end_time: u64, description: String) -> Result<()> {
        update_milestone::handler(ctx, title, start_time, end_time, description)
    }

    pub fn delete_milestone(ctx: Context<DeleteMilestoneCtx>) -> Result<()> {
        delete_milestone::handler(ctx)
    }

    pub fn complete_milestone(ctx: Context<CompleteMilestoneCtx>) -> Result<()> {
        complete_milestone::handler(ctx)
    }

    pub fn release_funds(ctx: Context<ReleaseFundsCtx>) -> Result<()> {
        release_funds::handler(ctx)
    }

    pub fn vote(ctx: Context<VoteCtx>, vote: bool) -> Result<()> {
        vote::handler(ctx, vote)
    }

    pub fn evaluate(ctx: Context<EvaluateCtx>) -> Result<()> {
        evaluate::handler(ctx)
    }
}
