import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { MilestoneVoting } from "../target/types/milestone_voting";
import { AssetNotFoundError, keypairIdentity, Metaplex, toBigNumber } from "@metaplex-foundation/js";
import { MPL_TOKEN_METADATA_PROGRAM_ID, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MintLayout,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { 
  adminKeypair, 
  getProjectPDA, 
  getAuthPDA, 
  getAtaForMint, 
  mintKey, 
  VERIFIED_CREATOR, 
  ADMIN_PUBKEY,
  getProjectTokenPDA,
  getMilestonePDA, 
  createNewNft,
  getVotePDA,
  getMetadataAccount,
  getTokenAccount,
  TOKEN_METADATA_PROGRAM_ID,
} from "./utils";
import { assert } from "chai";

describe("milestone_voting", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MilestoneVoting as Program<MilestoneVoting>;

  const metaplex = new Metaplex(program.provider.connection)
    .use(keypairIdentity(adminKeypair));
  
  const projectTitle = `project-${Date.now()}`;
  const milestone1Title = 'milestone 1';
  const milestone1Description = 'some description';
  const milestone1Start = (Date.now() / 1000) + 100;
  const milestone1End = milestone1Start + 86400;
  const milestone1Amount = 99_000_000_000;
  let quorum = 3;
  let passPercent = 51;

  let metadataUri = `https://shdw-drive.genesysgo.net/BHpjwKEHjNFQQrEfJZe5FF4RUV5SLS59uXh4NAsk6tD/8vrwq6P9Lj25uiQtwtHUUrmbD4HEm9ypXPPfTtp21zTd.json`;

  const [projectPDA, projectPDABump] = getProjectPDA(projectTitle, program);
  const [projectTokenPDA, projectTokenPDABump] = getProjectTokenPDA(projectPDA, program);
  const [authPDA, authPDABump] = getAuthPDA(projectPDA, program);
  const [milestone1PDA, milestone1PDABump] = getMilestonePDA(milestone1Title, projectPDA, program);

  // it("Create Token if it is not created already", async () => {
  //   try {
  //     const transaction = new anchor.web3.Transaction();
  //     const adminAta = (
  //       await getAtaForMint(mintKey.publicKey, adminKeypair.publicKey)
  //     )[0];

  //     transaction.add(
  //       // create mint account
  //       anchor.web3.SystemProgram.createAccount({
  //         fromPubkey: adminKeypair.publicKey,
  //         newAccountPubkey: mintKey.publicKey,
  //         space: MINT_SIZE,
  //         lamports: await getMinimumBalanceForRentExemptMint(
  //           program.provider.connection
  //         ),
  //         programId: TOKEN_PROGRAM_ID,
  //       }),
  //       // init mint account
  //       createInitializeMintInstruction(
  //         mintKey.publicKey,
  //         9,
  //         adminKeypair.publicKey,
  //         adminKeypair.publicKey
  //       ),
  //       // mint 1 Million tokens to admin account
  //       createAssociatedTokenAccountInstruction(
  //         adminKeypair.publicKey,
  //         adminAta,
  //         adminKeypair.publicKey,
  //         mintKey.publicKey
  //       ),
  //       createMintToInstruction(
  //         mintKey.publicKey,
  //         adminAta,
  //         adminKeypair.publicKey,
  //         1000000 * 10 ** 9
  //       )
  //     );

  //     const tx = await program.provider.sendAndConfirm(transaction, [
  //       mintKey
  //     ]);
  //     console.log(`Created token ${tx}`);
  //   } catch (error) {
  //     console.log({ error });
  //     console.log({ errorString: error.toString() });
  //     console.log(`Token is already created`);
  //   }
  // });

  
  it("Initialize project", async () => {
    const initProjectTx = await program.methods.initProject(
        authPDABump,
        projectTitle,
        false,
        ).accounts({
        authority: authPDA,
        project: projectPDA,
        verifiedCreator: VERIFIED_CREATOR,
        tokenMint: mintKey.publicKey,
        tokenAccount: projectTokenPDA,
        admin: ADMIN_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("Init project signature", initProjectTx);

    const project = await program.account.project.fetch(projectPDA);
    
    assert.equal(projectTitle, project.seedTitle);
    assert.equal(projectTitle, project.title);
    assert.equal(authPDA.toString(), project.authority.toString());
    assert.equal(VERIFIED_CREATOR.toString(), project.verifiedCreator.toString());
    assert.isFalse(project.isHidden);
    assert.equal(mintKey.publicKey.toString(), project.tokenMint.toString());
    assert.equal(projectPDABump, project.bump);
    assert.equal(authPDABump, project.authBump);
  });

  // it("Update project", async () => {
  //   const updatedTitle = "my little project";

  //   const updateProjectTx = await program.methods.updateProject(
  //       updatedTitle,
  //       true,
  //       ).accounts({
  //       project: projectPDA,
  //       verifiedCreator: VERIFIED_CREATOR,
  //       admin: ADMIN_PUBKEY,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //     })
  //     .rpc();
  //   console.log("Update project signature", updateProjectTx);

  //   const project = await program.account.project.fetch(projectPDA);
    
  //   assert.equal(projectTitle, project.seedTitle);
  //   assert.equal(updatedTitle, project.title);
  //   assert.equal(authPDA.toString(), project.authority.toString());
  //   assert.equal(VERIFIED_CREATOR.toString(), project.verifiedCreator.toString());
  //   assert.isTrue(project.isHidden);
  //   assert.equal(mintKey.publicKey.toString(), project.tokenMint.toString());
  //   assert.equal(projectPDABump, project.bump);
  //   assert.equal(authPDABump, project.authBump);
  // });

  it("Add milestone 1", async () => {

    const addMilestoneTx = await program.methods.addMilestone(
        authPDABump,
        milestone1Title,
        new anchor.BN(milestone1Start),
        new anchor.BN(milestone1End),
        new anchor.BN(milestone1Amount),
        new anchor.BN(quorum),
        new anchor.BN(passPercent),
        milestone1Description,
        ).accounts({
        authority: authPDA,
        milestone: milestone1PDA,
        project: projectPDA,
        paymentAcct: ADMIN_PUBKEY,
        admin: ADMIN_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("Add milestone 1 signature", addMilestoneTx);

    const milestone = await program.account.milestone.fetch(milestone1PDA);
    
    assert.equal(milestone1Title, milestone.seedTitle);
    assert.equal(milestone1Title, milestone.title);
    assert.equal(Math.trunc(milestone1Start), milestone.startTime.toNumber());
    assert.equal(Math.trunc(milestone1End), milestone.endTime.toNumber());
    assert.equal(0, milestone.yesTally.toNumber());
    assert.equal(0, milestone.noTally.toNumber());
    assert.equal(projectPDA.toString(), milestone.project.toString());
    assert.isFalse(milestone.isComplete);
    assert.isFalse(milestone.hasPassed);
    assert.isFalse(milestone.fundsReleased);
    assert.equal(milestone1Amount, milestone.amount.toNumber());
    assert.equal(milestone1PDABump, milestone.bump);
  });


  it("Deposit into project", async () => {
    // get project token account balance
    const before = await program.provider.connection.getTokenAccountBalance(projectTokenPDA);
    const startAmount = before.value.uiAmount;

    const userAta = (await getAtaForMint(mintKey.publicKey, adminKeypair.publicKey))[0];

    const amount = 100_000_000_000;

    const depositTx = await program.methods.depositIntoProject(new anchor.BN(amount))
        .accounts({
        user: adminKeypair.publicKey,
        authority: authPDA,
        project: projectPDA,
        tokenMint: mintKey.publicKey,
        fromTokenAccount: userAta,
        toTokenAccount: projectTokenPDA,
        admin: ADMIN_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("Deposit into project signature", depositTx);

    const after = await program.provider.connection.getTokenAccountBalance(projectTokenPDA);
    assert.equal(after.value.uiAmount, startAmount + 100);
  });

  it("Fail to release funds on not passing milestone", async () => {
    try {
      const adminAta = (await getAtaForMint(mintKey.publicKey, adminKeypair.publicKey))[0];

      const releaseTx = await program.methods.releaseFunds()
          .accounts({
          authority: authPDA,
          project: projectPDA,
          milestone: milestone1PDA,
          tokenMint: mintKey.publicKey,
          fromTokenAccount: projectTokenPDA,
          toTokenAccount: adminAta,
          admin: ADMIN_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      console.log("Fail release on not passing signature", releaseTx);
    } catch (_err) {
      assert.isTrue(_err instanceof AnchorError);
          const err: AnchorError = _err;
          const errMsg =
            "Milestone has not passed";
          assert.strictEqual(err.error.errorMessage, errMsg);
          assert.strictEqual(err.error.errorCode.number, 6009);
    }
  });

  it("Vote yes fails before milestone complete", async () => {
    try {
      const { votePDA, nftMint } = await castVote(true);
      const vote = await program.account.vote.fetch(votePDA);

    } catch (_err) {
      // console.log(_err);
        assert.isTrue(_err instanceof AnchorError);
          const err: AnchorError = _err;
          const errMsg =
            "Milestone is incomplete";
          assert.strictEqual(err.error.errorMessage, errMsg);
          assert.strictEqual(err.error.errorCode.number, 6008);
    }
  });

  it("Complete milestone 1", async () => {
    const addMilestoneTx = await program.methods.completeMilestone()
        .accounts({
        milestone: milestone1PDA,
        project: projectPDA,
        admin: ADMIN_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("Complete milestone 1 signature", addMilestoneTx);

    const milestone = await program.account.milestone.fetch(milestone1PDA);
    
    assert.isTrue(milestone.isComplete);
  });

  // it("Fail to release funds on unstarted milestone", async () => {
  //   try {
  //     const adminAta = (await getAtaForMint(mintKey.publicKey, adminKeypair.publicKey))[0];

  //     const releaseTx = await program.methods.releaseFunds()
  //         .accounts({
  //         authority: authPDA,
  //         project: projectPDA,
  //         milestone: milestone1PDA,
  //         tokenMint: mintKey.publicKey,
  //         fromTokenAccount: projectTokenPDA,
  //         toTokenAccount: adminAta,
  //         admin: ADMIN_PUBKEY,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //       })
  //       .rpc();
  //     console.log("Fail release on unstarted signature", releaseTx);
  //   } catch (_err) {
  //     assert.isTrue(_err instanceof AnchorError);
  //         const err: AnchorError = _err;
  //         const errMsg =
  //           "Milestone has not started";
  //         assert.strictEqual(err.error.errorMessage, errMsg);
  //         assert.strictEqual(err.error.errorCode.number, 6004);
  //   }
  // });

  it("Update milestone 1", async () => {
    const newTitle = "milestone 1.1";
    const newStart = milestone1Start - 1000;
    const newEnd = newStart + 86400;
    const newDescription = "description 1.1";

    const addMilestoneTx = await program.methods.updateMilestone(
        newTitle,
        new anchor.BN(newStart),
        new anchor.BN(newEnd),
        newDescription,
        ).accounts({
        milestone: milestone1PDA,
        project: projectPDA,
        admin: ADMIN_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("Update milestone 1 signature", addMilestoneTx);

    const milestone = await program.account.milestone.fetch(milestone1PDA);
    
    assert.equal(milestone1Title, milestone.seedTitle);
    assert.equal(newTitle, milestone.title);
    assert.equal(Math.trunc(newStart), milestone.startTime.toNumber());
    assert.equal(Math.trunc(newEnd), milestone.endTime.toNumber());
    assert.equal(0, milestone.yesTally.toNumber());
    assert.equal(0, milestone.noTally.toNumber());
    assert.equal(projectPDA.toString(), milestone.project.toString());
    assert.isFalse(milestone.hasPassed);
    assert.isFalse(milestone.fundsReleased);
    assert.equal(milestone1Amount, milestone.amount.toNumber());
    assert.equal(milestone1PDABump, milestone.bump);
  });

  it("Fail to release funds on not passing milestone", async () => {
    try {
      const adminAta = (await getAtaForMint(mintKey.publicKey, adminKeypair.publicKey))[0];

      const releaseTx = await program.methods.releaseFunds()
          .accounts({
          authority: authPDA,
          project: projectPDA,
          milestone: milestone1PDA,
          tokenMint: mintKey.publicKey,
          fromTokenAccount: projectTokenPDA,
          toTokenAccount: adminAta,
          admin: ADMIN_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      console.log("Fail release on not passing signature", releaseTx);
    } catch (_err) {
      assert.isTrue(_err instanceof AnchorError);
          const err: AnchorError = _err;
          const errMsg =
            "Milestone has not passed";
          assert.strictEqual(err.error.errorMessage, errMsg);
          assert.strictEqual(err.error.errorCode.number, 6009);
    }
  });

  it("Vote yes once", async () => {
    const { votePDA, nftMint } = await castVote(true);
    const vote = await program.account.vote.fetch(votePDA);
    assert.equal(vote.owner.toString(), adminKeypair.publicKey.toString());
    assert.equal(vote.mint.toString(), nftMint.toString());
    assert.equal(vote.project.toString(), projectPDA.toString());
    assert.equal(vote.milestone.toString(), milestone1PDA.toString());
    assert.isTrue(vote.isYesVote);

    const milestone = await program.account.milestone.fetch(milestone1PDA);
    assert.equal(milestone.yesTally.toNumber(), 1);
    assert.equal(milestone.noTally.toNumber(), 0);
  });

  it("Evaluate milestone, not passing", async () => {
    const evalTx = await program.methods.evaluate()
        .accounts({
          project: projectPDA,
          milestone: milestone1PDA,
          admin: ADMIN_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("evaluate signature", evalTx);

    const milestone = await program.account.milestone.fetch(milestone1PDA);
    
    assert.isFalse(milestone.hasPassed);
  });

  it("Fail to release funds on not passing milestone", async () => {
    try {
      const adminAta = (await getAtaForMint(mintKey.publicKey, adminKeypair.publicKey))[0];

      const releaseTx = await program.methods.releaseFunds()
          .accounts({
          authority: authPDA,
          project: projectPDA,
          milestone: milestone1PDA,
          tokenMint: mintKey.publicKey,
          fromTokenAccount: projectTokenPDA,
          toTokenAccount: adminAta,
          admin: ADMIN_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      console.log("Fail release on not passing signature", releaseTx);
    } catch (_err) {
      assert.isTrue(_err instanceof AnchorError);
          const err: AnchorError = _err;
          const errMsg =
            "Milestone has not passed";
          assert.strictEqual(err.error.errorMessage, errMsg);
          assert.strictEqual(err.error.errorCode.number, 6009);
    }
  });


  it("Vote yes once", async () => {
    const { votePDA, nftMint } = await castVote(true);
    const vote = await program.account.vote.fetch(votePDA);
    assert.equal(vote.owner.toString(), adminKeypair.publicKey.toString());
    assert.equal(vote.mint.toString(), nftMint.toString());
    assert.equal(vote.project.toString(), projectPDA.toString());
    assert.equal(vote.milestone.toString(), milestone1PDA.toString());
    assert.isTrue(vote.isYesVote);

    const milestone = await program.account.milestone.fetch(milestone1PDA);
    assert.equal(milestone.yesTally.toNumber(), 2);
    assert.equal(milestone.noTally.toNumber(), 0);
  });

  it("Evaluate milestone with quorum, not passing for quorum", async () => {
    const evalTx = await program.methods.evaluate()
        .accounts({
          project: projectPDA,
          milestone: milestone1PDA,
          admin: ADMIN_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("evaluate signature", evalTx);

    const milestone = await program.account.milestone.fetch(milestone1PDA);
    
    assert.isFalse(milestone.hasPassed);
  });

  it("Fail to release funds on not passing milestone", async () => {
    try {
      const adminAta = (await getAtaForMint(mintKey.publicKey, adminKeypair.publicKey))[0];

      const releaseTx = await program.methods.releaseFunds()
          .accounts({
          authority: authPDA,
          project: projectPDA,
          milestone: milestone1PDA,
          tokenMint: mintKey.publicKey,
          fromTokenAccount: projectTokenPDA,
          toTokenAccount: adminAta,
          admin: ADMIN_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      console.log("Fail release on not passing signature", releaseTx);
    } catch (_err) {
      assert.isTrue(_err instanceof AnchorError);
          const err: AnchorError = _err;
          const errMsg =
            "Milestone has not passed";
          assert.strictEqual(err.error.errorMessage, errMsg);
          assert.strictEqual(err.error.errorCode.number, 6009);
    }
  });

  it("Vote no once", async () => {
    const { votePDA, nftMint } = await castVote(false);
    const vote = await program.account.vote.fetch(votePDA);
    assert.equal(vote.owner.toString(), adminKeypair.publicKey.toString());
    assert.equal(vote.mint.toString(), nftMint.toString());
    assert.equal(vote.project.toString(), projectPDA.toString());
    assert.equal(vote.milestone.toString(), milestone1PDA.toString());
    assert.isFalse(vote.isYesVote);

    const milestone = await program.account.milestone.fetch(milestone1PDA);
    assert.equal(milestone.yesTally.toNumber(), 2);
    assert.equal(milestone.noTally.toNumber(), 1);
  });

  it("Evaluate milestone, passing", async () => {
    const evalTx = await program.methods.evaluate()
        .accounts({
          project: projectPDA,
          milestone: milestone1PDA,
          admin: ADMIN_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("evaluate signature", evalTx);

    const milestone = await program.account.milestone.fetch(milestone1PDA);
    
    assert.isTrue(milestone.hasPassed);
  });

  const castVote = async(vote) => {
    const uri = 'https://shdw-drive.genesysgo.net/3nBfs4AvAG5vwfQY3D8Xepju85U3JGyFHqckU4JdV6Si/og_e1_e2_DyZChhwCPe7bRojzMkTPhRhU5qq8TKTgeKxNiHKauWGF.json';
    const mintAddress = await createNewNft(anchor.getProvider(), uri, adminKeypair, 'Test NFT');
    const nftMint = new anchor.web3.PublicKey(mintAddress);
    const nftMetadata = await getMetadataAccount(nftMint);
    const nftTokenAccount = await getTokenAccount(adminKeypair.publicKey, nftMint);
    
    const [votePDA, votePDABump] = getVotePDA(milestone1PDA, nftMint, program);

    const voteTx = await program.methods.vote(
        vote
        ).accounts({
          vote: votePDA,
          nftMint: nftMint,
          nftMetadata: nftMetadata,
          nftTokenAccount: nftTokenAccount,
          voter: adminKeypair.publicKey,
          project: projectPDA,
          milestone: milestone1PDA,
          admin: ADMIN_PUBKEY,
          nftProgramId: TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
      console.log("vote once signature", voteTx);
      return { votePDA, nftMint };
  }

  it("Releases funds on passing milestone", async () => {
    try {
      const adminAta = (await getAtaForMint(mintKey.publicKey, adminKeypair.publicKey))[0];

      const releaseTx = await program.methods.releaseFunds()
          .accounts({
          authority: authPDA,
          project: projectPDA,
          milestone: milestone1PDA,
          tokenMint: mintKey.publicKey,
          fromTokenAccount: projectTokenPDA,
          toTokenAccount: adminAta,
          admin: ADMIN_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      console.log("Release on passing signature", releaseTx);

      const milestone = await program.account.milestone.fetch(milestone1PDA);

      assert.equal(milestone.fundsReleased, true);
    } catch (_err) {
      // assert.isTrue(_err instanceof AnchorError);
          const err: AnchorError = _err;
          console.log(_err);
          // console.log(err.error.errorMessage);
          assert.isTrue(false);
    }
  });

  it("Does not releases funds twice", async () => {
    try {
      const adminAta = (await getAtaForMint(mintKey.publicKey, adminKeypair.publicKey))[0];

      const releaseTx = await program.methods.releaseFunds()
          .accounts({
          authority: authPDA,
          project: projectPDA,
          milestone: milestone1PDA,
          tokenMint: mintKey.publicKey,
          fromTokenAccount: projectTokenPDA,
          toTokenAccount: adminAta,
          admin: ADMIN_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      console.log("Release funds twice signature", releaseTx);

    } catch (_err) {
        assert.isTrue(_err instanceof AnchorError);
        const err: AnchorError = _err;
        const errMsg =
          "Already released funds";
        assert.strictEqual(err.error.errorMessage, errMsg);
        assert.strictEqual(err.error.errorCode.number, 6011);
    }
  });
});
