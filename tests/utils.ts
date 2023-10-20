import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MilestoneVoting } from "../target/types/milestone_voting";
import { keypairIdentity, Metaplex, toBigNumber } from "@metaplex-foundation/js";
import { MPL_TOKEN_METADATA_PROGRAM_ID, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const ADMIN_PUBKEY = new anchor.web3.PublicKey('EnQS1hpPkAcrVZ1U66UkMowYBDNXsJn7XhTMK6BXrjzy');

export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID =
    new anchor.web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export const TEST_NFT_URI = "https://arweave.net/b3r151ZnyJCy7qeO45-BYkfYmC7py2Gtg-B8vRqlVz8";
export const TEST_NFT_NAME = "Test NFT";
export const VERIFIED_CREATOR = new anchor.web3.PublicKey('EnQS1hpPkAcrVZ1U66UkMowYBDNXsJn7XhTMK6BXrjzy');

export const mintKey = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(
        require("fs").readFileSync(
          "./keys/mintKey.json",
          "utf8"
        )
      )
    )
  );

  export const adminKeypair = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(require('fs').readFileSync('./keys/update-local.json', 'utf8'))
    )
  );
export const getAtaForMint = async (
    mint: anchor.web3.PublicKey,
    buyer: anchor.web3.PublicKey
  ): Promise<[anchor.web3.PublicKey, number]> => {
    return await anchor.web3.PublicKey.findProgramAddress(
      [buyer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    );
  };

  export const getProjectTokenPDA = (project: anchor.web3.PublicKey, program: anchor.Program<MilestoneVoting>) => {
    return (
      anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("token"), project.toBuffer()],
      program.programId
    )
    );
  }

export const getProjectPDA = (seedTitle: string, program: anchor.Program<MilestoneVoting>) => {
    return (
      anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("project"), Buffer.from(seedTitle)],
      program.programId
    )
    );
  }
  
  export const getMilestonePDA = (seedTitle: string, project: anchor.web3.PublicKey, program: anchor.Program<MilestoneVoting>) => {
    return (
      anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("milestone"), project.toBuffer(), Buffer.from(seedTitle)],
      program.programId
    )
    );
  }
  
  export const getVotePDA = (milestone: anchor.web3.PublicKey, mint: anchor.web3.PublicKey, program: anchor.Program<MilestoneVoting>) => {
    return (
      anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), milestone.toBuffer(), mint.toBuffer()],
      program.programId
    )
    );
  }
  
  export const getAuthPDA = (project: anchor.web3.PublicKey, program: anchor.Program<MilestoneVoting>) => {
    return (
      anchor.web3.PublicKey.findProgramAddressSync(
      [project.toBuffer(), Buffer.from("auth")],
      program.programId
    )
    );
  }
  
  export const getMetadataAccount = async (
    mint: anchor.web3.PublicKey
  ): Promise<anchor.web3.PublicKey> => {
    return (
      await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };
  
  export const getTokenAccount = async function (
    wallet: anchor.web3.PublicKey,
    mint: anchor.web3.PublicKey
  ) {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        )
    )[0];
  };
  

  
  export const createNewNft = async (
    provider: anchor.Provider,
    uri: string,
    keypair: anchor.web3.Keypair,
    name: string = 'Test NFT',
  ): Promise<anchor.web3.PublicKey> => {
    const connection = provider.connection;
    const metaplex = Metaplex.make(connection)
        .use(keypairIdentity(keypair));
  
    const createNftBuilder = await metaplex.nfts().builders().create({
        uri,
        name,
        sellerFeeBasisPoints: 500, // Represents 5.00%.
        // maxSupply: toBigNumber(100),
        tokenStandard: TokenStandard.ProgrammableNonFungible,
    });
  
    const { mintAddress } = createNftBuilder.getContext();
  
    await metaplex
        .rpc()
        .sendAndConfirmTransaction(createNftBuilder, { commitment: "confirmed" });
  
    return mintAddress;
  };