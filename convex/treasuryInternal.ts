// Internal query and mutation for proposal resolution.
// Must NOT have "use node" — queries and mutations run in the Convex runtime.

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
// ---------------------------------------------------------------------------
// Internal query — load proposal + votes + members needed for resolution
// ---------------------------------------------------------------------------

export const getProposalForResolution = internalQuery({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) return null;

    const pool = await ctx.db.get(proposal.poolId);
    if (!pool) return null;

    const voteRows = await ctx.db
      .query("votes")
      .withIndex("by_proposalId", (q) => q.eq("proposalId", args.proposalId))
      .collect();

    const memberRows = await ctx.db
      .query("members")
      .withIndex("by_poolId", (q) => q.eq("poolId", proposal.poolId))
      .collect();

    const activeMembers = memberRows
      .filter((m) => m.isActive !== false)
      .map((m) => ({ id: m._id, role: m.role, isActive: true as const }));

    return { proposal, pool, votes: voteRows, activeMembers };
  },
});

// ---------------------------------------------------------------------------
// Internal mutation — patch proposal to approved or rejected
// ---------------------------------------------------------------------------

export const finalizeProposal = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    approved: v.boolean(),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || proposal.status !== "pending") return;

    if (args.approved) {
      await ctx.db.patch(args.proposalId, {
        status: "approved",
        resolvedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.proposalId, {
        status: "rejected",
        resolvedAt: Date.now(),
        rejectionReason: args.rejectionReason,
      });
    }
  },
});
