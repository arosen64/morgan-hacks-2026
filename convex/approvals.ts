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

async function loadActiveMembersForGroup(
  ctx: { db: { query: Function } },
  groupId: Id<"groups">,
): Promise<MemberSnapshot[]> {
  const rows = await (ctx.db as any)
    .query("members")
    .withIndex("by_groupId", (q: any) => q.eq("groupId", groupId))
    .collect();
  return rows
    .filter((m: any) => m.isActive)
    .map((m: any) => ({ id: m._id, role: m.role, isActive: m.isActive }));
}

function resolveRuleForProposal(
  group: { approvalRule?: ApprovalRule; amendmentApprovalRule?: ApprovalRule },
  proposalType: "transaction" | "amendment",
): ApprovalRule {
  if (proposalType === "amendment") {
    return effectiveAmendmentRule(group.amendmentApprovalRule as ApprovalRule | undefined);
  }
  return (group.approvalRule as ApprovalRule | undefined) ?? { type: "unanimous" };
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

    // Verify member belongs to this group and is active
    const member = await ctx.db.get(args.memberId);
    if (!member || !member.isActive || member.groupId !== proposal.groupId) {
      throw new Error("Member is not an active member of this group");
    }

    // Prevent double voting
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

    // Load everything needed for rule evaluation
    const group = await ctx.db.get(proposal.groupId);
    if (!group) throw new Error("Group not found");

    const rule = resolveRuleForProposal(
      group as any,
      proposal.type,
    );
    const votes = await loadVotesForProposal(ctx, args.proposalId);
    const members = await loadActiveMembersForGroup(ctx, proposal.groupId);

    if (evaluateApprovalRule(rule, votes, members, proposal.amount ?? undefined)) {
      await ctx.db.patch(args.proposalId, { status: "approved" });
    } else if (!canStillReachQuorum(rule, votes, members, proposal.amount ?? undefined)) {
      await ctx.db.patch(args.proposalId, { status: "rejected" });
    }
    // else: still pending
  },
});

export const createProposal = mutation({
  args: {
    groupId: v.id("groups"),
    proposerId: v.id("members"),
    type: v.union(v.literal("transaction"), v.literal("amendment")),
    description: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const proposer = await ctx.db.get(args.proposerId);
    if (!proposer || !proposer.isActive || proposer.groupId !== args.groupId) {
      throw new Error("Proposer is not an active member of this group");
    }

    return await ctx.db.insert("proposals", {
      groupId: args.groupId,
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
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return;

    const pending = await ctx.db
      .query("proposals")
      .withIndex("by_groupId_and_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "pending"),
      )
      .take(50);

    const members = await loadActiveMembersForGroup(ctx, args.groupId);

    for (const proposal of pending) {
      const rule = resolveRuleForProposal(group as any, proposal.type);
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

    const group = await ctx.db.get(proposal.groupId);
    if (!group) return null;

    const voteRows = await ctx.db
      .query("votes")
      .withIndex("by_proposalId", (q) => q.eq("proposalId", args.proposalId))
      .collect();

    const memberRows = await ctx.db
      .query("members")
      .withIndex("by_groupId", (q) => q.eq("groupId", proposal.groupId))
      .collect();

    const activeMembers = memberRows.filter((m) => m.isActive);
    const approvals = voteRows.filter((v) => v.vote === "approve").length;
    const rejections = voteRows.filter((v) => v.vote === "reject").length;
    const pending = activeMembers.length - voteRows.length;

    const rule = resolveRuleForProposal(group as any, proposal.type);

    // Compute a human-readable quorum description
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

export const getGroupProposals = query({
  args: {
    groupId: v.id("groups"),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("proposals")
        .withIndex("by_groupId_and_status", (q) =>
          q.eq("groupId", args.groupId).eq("status", args.status!),
        )
        .take(100);
    }
    return await ctx.db
      .query("proposals")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .take(100);
  },
});
