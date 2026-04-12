"use node";
// Server-side Solana helpers for treasury balance checks and proposal resolution.
// Requires SOLANA_RPC_URL set in Convex environment variables (falls back to public devnet).

import * as crypto from "crypto";
import { Connection, PublicKey } from "@solana/web3.js";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { type ApprovalRule, evaluateApprovalRule } from "./lib/approvalRules";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRpcConnection(): Connection {
  const url = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  return new Connection(url, "confirmed");
}

function poolIdToBytes(poolId: string): Buffer {
  return crypto.createHash("sha256").update(poolId, "utf8").digest();
}

function getTreasuryPda(poolId: string, programId: PublicKey): PublicKey {
  const seed = poolIdToBytes(poolId);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), seed],
    programId,
  );
  return pda;
}

// ---------------------------------------------------------------------------
// Internal action — fetch treasury balance and finalize a transaction proposal
// ---------------------------------------------------------------------------

export const resolveProposalIfReady = internalAction({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(
      internal.treasuryInternal.getProposalForResolution,
      { proposalId: args.proposalId },
    );
    if (!data) return;

    const { proposal, pool, votes, activeMembers } = data;

    // Only handle transaction proposals — amendments are resolved inline in castVote
    if (proposal.type !== "transaction") return;
    if (proposal.status !== "pending") return;

    const rule: ApprovalRule = (pool.approvalRule as
      | ApprovalRule
      | undefined) ?? { type: "unanimous" };

    const voteRecords = votes.map(
      (v: { memberId: Id<"members">; vote: "approve" | "reject" }) => ({
        memberId: v.memberId,
        vote: v.vote,
      }),
    );

    if (
      !evaluateApprovalRule(
        rule,
        voteRecords,
        activeMembers,
        proposal.amount ?? undefined,
      )
    ) {
      // Threshold not yet reached — nothing to do
      return;
    }

    // Threshold reached — check treasury balance before approving
    let approved = true;
    let rejectionReason: string | undefined;

    if (proposal.amount && proposal.amount > 0) {
      try {
        const programId = new PublicKey(
          process.env.VITE_PROGRAM_ID ?? process.env.PROGRAM_ID ?? "",
        );
        const connection = getRpcConnection();
        const pda = getTreasuryPda(proposal.poolId, programId);
        const balanceLamports = await connection.getBalance(pda);

        if (balanceLamports < proposal.amount) {
          approved = false;
          rejectionReason = "insufficient_funds";
        }
      } catch {
        // RPC error or missing PROGRAM_ID — approve optimistically rather than blocking
      }
    }

    await ctx.runMutation(internal.treasuryInternal.finalizeProposal, {
      proposalId: args.proposalId,
      approved,
      rejectionReason,
    });
  },
});
