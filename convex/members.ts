import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 2.1 — Add a member to a pool, enforcing uniqueness of name and wallet within the pool
export const addMember = mutation({
  args: {
    poolId: v.id("pools"),
    name: v.string(),
    wallet: v.string(),
    role: v.union(v.literal("manager"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("members")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();

    for (const member of existing) {
      if (member.name === args.name) {
        throw new Error(
          `A member named "${args.name}" already exists in this pool.`,
        );
      }
      if (member.wallet === args.wallet) {
        throw new Error(
          "This wallet address is already registered in this pool.",
        );
      }
    }

    return await ctx.db.insert("members", {
      poolId: args.poolId,
      name: args.name,
      wallet: args.wallet,
      role: args.role,
    });
  },
});

// 2.2 — Return all members for a given pool
export const getMembers = query({
  args: { poolId: v.id("pools") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("members")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();
  },
});

// 2.3 — Resolve a member name to their wallet address within a pool
export const resolveMemberWallet = query({
  args: { poolId: v.id("pools"), name: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();

    const match = members.find((m) => m.name === args.name);
    if (!match) {
      throw new Error(
        `Member "${args.name}" not found in pool "${args.poolId}".`,
      );
    }
    return match.wallet;
  },
});
