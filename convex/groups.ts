import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { approvalRuleValidator } from "./lib/validators";

async function validateNamedSetMembers(
  ctx: { db: { get: (id: Id<"members">) => Promise<{ isActive: boolean; groupId: Id<"groups"> } | null> } },
  memberIds: string[],
  groupId: Id<"groups">,
) {
  for (const memberId of memberIds) {
    const member = await ctx.db.get(memberId as Id<"members">);
    if (!member || !member.isActive || member.groupId !== groupId) {
      throw new Error(`Member ${memberId} is not an active member of this group`);
    }
  }
}

export const createGroup = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("groups", {
      name: args.name,
    });
  },
});

export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

export const saveApprovalRule = mutation({
  args: {
    groupId: v.id("groups"),
    rule: approvalRuleValidator,
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    if (args.rule.type === "named-set") {
      await validateNamedSetMembers(ctx, args.rule.memberIds, args.groupId);
    }

    await ctx.db.patch(args.groupId, { approvalRule: args.rule });
  },
});

export const saveAmendmentApprovalRule = mutation({
  args: {
    groupId: v.id("groups"),
    rule: v.optional(approvalRuleValidator),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    if (args.rule?.type === "named-set") {
      await validateNamedSetMembers(ctx, args.rule.memberIds, args.groupId);
    }

    await ctx.db.patch(args.groupId, {
      amendmentApprovalRule: args.rule ?? undefined,
    });
  },
});

export const addMember = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    wallet: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("members", {
      groupId: args.groupId,
      name: args.name,
      wallet: args.wallet,
      role: args.role,
      isActive: true,
    });
  },
});

export const removeMember = mutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    await ctx.db.patch(args.memberId, { isActive: false });

    // Re-evaluate pending proposals — any that can no longer reach quorum get rejected
    await ctx.scheduler.runAfter(0, internal.approvals.reEvaluatePendingProposals, {
      groupId: member.groupId,
    });
  },
});

export const getGroupMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("members")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});
