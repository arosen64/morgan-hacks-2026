import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { approvalRuleValidator } from "./lib/validators";

async function validateNamedSetMembers(
  ctx: {
    db: {
      get: (
        id: Id<"members">,
      ) => Promise<{ isActive?: boolean; poolId: Id<"pools"> } | null>;
    };
  },
  memberIds: string[],
  poolId: Id<"pools">,
) {
  for (const memberId of memberIds) {
    const member = await ctx.db.get(memberId as Id<"members">);
    const isActive = member?.isActive !== false; // absent treated as active
    if (!member || !isActive || member.poolId !== poolId) {
      throw new Error(
        `Member ${memberId} is not an active member of this pool`,
      );
    }
  }
}

export const saveApprovalRule = mutation({
  args: {
    poolId: v.id("pools"),
    rule: approvalRuleValidator,
  },
  handler: async (ctx, args) => {
    const pool = await ctx.db.get(args.poolId);
    if (!pool) throw new Error("Pool not found");

    if (args.rule.type === "named-set") {
      await validateNamedSetMembers(ctx, args.rule.memberIds, args.poolId);
    }

    await ctx.db.patch(args.poolId, { approvalRule: args.rule });
  },
});

export const saveAmendmentApprovalRule = mutation({
  args: {
    poolId: v.id("pools"),
    rule: v.optional(approvalRuleValidator),
  },
  handler: async (ctx, args) => {
    const pool = await ctx.db.get(args.poolId);
    if (!pool) throw new Error("Pool not found");

    if (args.rule?.type === "named-set") {
      await validateNamedSetMembers(ctx, args.rule.memberIds, args.poolId);
    }

    await ctx.db.patch(args.poolId, {
      amendmentApprovalRule: args.rule ?? undefined,
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
    await ctx.scheduler.runAfter(
      0,
      internal.approvals.reEvaluatePendingProposals,
      {
        poolId: member.poolId,
      },
    );
  },
});
