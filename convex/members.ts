import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

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

// Returns all pools a wallet address belongs to, with the member's role in each
export const getPoolsByWallet = query({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .take(100);

    const result: { pool: Doc<"pools">; role: "manager" | "member" }[] = [];
    for (const membership of memberships) {
      const pool = await ctx.db.get(membership.poolId);
      if (pool) {
        result.push({ pool, role: membership.role });
      }
    }
    return result;
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
