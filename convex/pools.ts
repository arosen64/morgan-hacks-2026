import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Creates a new pool and auto-registers the creator as manager
export const createPool = mutation({
  args: {
    name: v.string(),
    founderName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const founderWallet = identity.tokenIdentifier;

    const poolId = await ctx.db.insert("pools", {
      name: args.name,
      status: "pre-contract",
    });

    await ctx.db.insert("members", {
      poolId,
      name: args.founderName,
      wallet: founderWallet,
      role: "manager",
    });

    return poolId;
  },
});

// Returns pool details including status
export const getPool = query({
  args: { poolId: v.id("pools") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.poolId);
  },
});

// Transitions a pool from pre-contract to active — called by the contract creation flow
export const activatePool = mutation({
  args: { poolId: v.id("pools") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.poolId, { status: "active" });
  },
});

// Returns members formatted for inclusion in the contract JSON
export const getMembersForContract = query({
  args: { poolId: v.id("pools") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();

    return members.map((m) => ({
      name: m.name,
      wallet: m.wallet,
      role: m.role,
    }));
  },
});
