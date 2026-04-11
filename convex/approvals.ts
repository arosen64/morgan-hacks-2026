import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  ApprovalRule,
  MemberSnapshot,
  VoteRecord,
  canStillReachQuorum,
  effectiveAmendmentRule,
  evaluateApprovalRule,
} from "./lib/approvalRules";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadVotesForProposal(
  ctx: { db: { query: Function } },
  proposalId: Id<"proposals">,
): Promise<VoteRecord[]> {
  const rows = await (ctx.db as any)
    .query("votes")
    .withIndex("by_proposalId", (q: any) => q.eq("proposalId", proposalId))
    .collect();
  return rows.map((r: any) => ({ memberId: r.memberId, vote: r.vote }));
}

async function loadActiveMembersForPool(
  ctx: { db: { query: Function } },
  poolId: Id<"pools">,
): Promise<MemberSnapshot[]> {
  const rows = await (ctx.db as any)
    .query("members")
    .withIndex("by_poolId", (q: any) => q.eq("poolId", poolId))
    .collect();
  return rows
    .filter((m: any) => m.isActive !== false) // absent treated as active
    .map((m: any) => ({ id: m._id, role: m.role, isActive: true }));
}

function resolveRuleForProposal(
  pool: { approvalRule?: ApprovalRule; amendmentApprovalRule?: ApprovalRule },
  proposalType: "transaction" | "amendment",
): ApprovalRule {
  if (proposalType === "amendment") {
    return effectiveAmendmentRule(pool.amendmentApprovalRule as ApprovalRule | undefined);
  }
  return (pool.approvalRule as ApprovalRule | undefined) ?? { type: "unanimous" };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const castVote = mutation({
  args: {
    proposalId: v.id("proposals"),
    memberId: v.id("members"),
    vote: v.union(v.literal("approve"), v.literal("reject")),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) throw new Error("Proposal not found");
    if (proposal.status !== "pending") {
      throw new Error(`Proposal is already ${proposal.status}`);
    }

    const member = await ctx.db.get(args.memberId);
    if (!member || member.isActive === false || member.poolId !== proposal.poolId) {
      throw new Error("Member is not an active member of this pool");
    }

    const existing = await ctx.db
      .query("votes")
      .withIndex("by_proposalId_and_memberId", (q) =>
        q.eq("proposalId", args.proposalId).eq("memberId", args.memberId),
      )
      .unique();
    if (existing) throw new Error("Member has already voted on this proposal");

    await ctx.db.insert("votes", {
      proposalId: args.proposalId,
      memberId: args.memberId,
      vote: args.vote,
    });

    const pool = await ctx.db.get(proposal.poolId);
    if (!pool) throw new Error("Pool not found");

    const rule = resolveRuleForProposal(pool as any, proposal.type);
    const votes = await loadVotesForProposal(ctx, args.proposalId);
    const members = await loadActiveMembersForPool(ctx, proposal.poolId);

    if (evaluateApprovalRule(rule, votes, members, proposal.amount ?? undefined)) {
      await ctx.db.patch(args.proposalId, { status: "approved" });
    } else if (!canStillReachQuorum(rule, votes, members, proposal.amount ?? undefined)) {
      await ctx.db.patch(args.proposalId, { status: "rejected" });
    }
  },
});

export const createProposal = mutation({
  args: {
    poolId: v.id("pools"),
    proposerId: v.id("members"),
    type: v.union(v.literal("transaction"), v.literal("amendment")),
    description: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pool = await ctx.db.get(args.poolId);
    if (!pool) throw new Error("Pool not found");

    const proposer = await ctx.db.get(args.proposerId);
    if (!proposer || proposer.isActive === false || proposer.poolId !== args.poolId) {
      throw new Error("Proposer is not an active member of this pool");
    }

    return await ctx.db.insert("proposals", {
      poolId: args.poolId,
      proposerId: args.proposerId,
      type: args.type,
      description: args.description,
      amount: args.amount,
      status: "pending",
    });
  },
});

// ---------------------------------------------------------------------------
// Internal mutation — re-evaluate pending proposals when membership changes
// ---------------------------------------------------------------------------

export const reEvaluatePendingProposals = internalMutation({
  args: { poolId: v.id("pools") },
  handler: async (ctx, args) => {
    const pool = await ctx.db.get(args.poolId);
    if (!pool) return;

    const pending = await ctx.db
      .query("proposals")
      .withIndex("by_poolId_and_status", (q) =>
        q.eq("poolId", args.poolId).eq("status", "pending"),
      )
      .take(50);

    const members = await loadActiveMembersForPool(ctx, args.poolId);

    for (const proposal of pending) {
      const rule = resolveRuleForProposal(pool as any, proposal.type);
      const votes = await loadVotesForProposal(ctx, proposal._id);

      if (!canStillReachQuorum(rule, votes, members, proposal.amount ?? undefined)) {
        await ctx.db.patch(proposal._id, { status: "rejected" });
      }
    }
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getProposalVotes = query({
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

    const activeMembers = memberRows.filter((m) => m.isActive !== false);
    const approvals = voteRows.filter((v) => v.vote === "approve").length;
    const rejections = voteRows.filter((v) => v.vote === "reject").length;
    const pending = activeMembers.length - voteRows.length;

    const rule = resolveRuleForProposal(pool as any, proposal.type);

    let quorumDescription = "";
    switch (rule.type) {
      case "unanimous":
        quorumDescription = `${activeMembers.length} of ${activeMembers.length} approvals needed`;
        break;
      case "k-of-n":
        quorumDescription = `${rule.k} of ${activeMembers.length} approvals needed`;
        break;
      case "named-set":
        quorumDescription = `${rule.memberIds.length} specific members must approve`;
        break;
      case "role-based":
        quorumDescription = `All members with role "${rule.role}" must approve`;
        break;
      case "tiered":
        quorumDescription = "Tiered approval (see rule for details)";
        break;
    }

    return {
      proposal,
      tally: { approvals, rejections, pending, total: activeMembers.length },
      votes: voteRows.map((v) => ({
        memberId: v.memberId,
        vote: v.vote,
        member: memberRows.find((m) => m._id === v.memberId) ?? null,
      })),
      quorumDescription,
    };
  },
});

export const getPoolProposals = query({
  args: {
    poolId: v.id("pools"),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("proposals")
        .withIndex("by_poolId_and_status", (q) =>
          q.eq("poolId", args.poolId).eq("status", args.status!),
        )
        .take(100);
    }
    return await ctx.db
      .query("proposals")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .take(100);
  },
});
