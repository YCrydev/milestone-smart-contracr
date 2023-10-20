pub mod init_project;
pub mod update_project;
pub mod delete_project;
pub mod deposit_into_project;
pub mod add_milestone;
pub mod update_milestone;
pub mod delete_milestone;
pub mod complete_milestone;
pub mod release_funds;
pub mod vote;
pub mod evaluate;

pub use init_project::*;
pub use update_project::*;
pub use delete_project::*;
pub use deposit_into_project::*;
pub use add_milestone::*;
pub use update_milestone::*;
pub use delete_milestone::*;
pub use complete_milestone::*;
pub use release_funds::*;
pub use vote::*;
pub use evaluate::*;

use anchor_lang::prelude::*;
use mpl_token_metadata::state::{self};

#[derive(Clone)]
/// Token metadata program struct.
pub struct TokenMetadata;

impl Id for TokenMetadata {
    fn id() -> Pubkey {
        mpl_token_metadata::ID
    }
}

#[derive(Clone)]
/// Wrapper for [mpl_token_metadata::state::Metadata] account.
pub struct MetadataAccount(state::Metadata);

impl MetadataAccount {
    pub const LEN: usize = state::MAX_METADATA_LEN;
}

impl AccountDeserialize for MetadataAccount {
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self> {
        state::Metadata::deserialize(buf)
            .map_err(|_| ErrorCode::AccountDidNotDeserialize.into())
            .map(MetadataAccount)
    }
}

impl AccountSerialize for MetadataAccount {}

impl Owner for MetadataAccount {
    fn owner() -> Pubkey {
        TokenMetadata::id()
    }
}

impl std::ops::Deref for MetadataAccount {
    type Target = state::Metadata;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
