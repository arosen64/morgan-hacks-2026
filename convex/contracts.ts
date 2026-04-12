import { internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 3.5 — Commit a contract version: insert record, update pool hash + status
export const commitContract = mutation({
  args: {
    poolId: v.id("pools"),
    hash: v.string(),
    contractJson: v.string(),
    prevHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current version count to determine version number
    const existing = await ctx.db
      .query("contracts")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();

    const versionNumber = existing.length + 1;

    // If there's a previous version, update its nextHash
    if (args.prevHash) {
      const prev = await ctx.db
        .query("contracts")
        .withIndex("by_hash", (q) => q.eq("hash", args.prevHash!))
        .unique();
      if (prev) {
        await ctx.db.patch(prev._id, { nextHash: args.hash });
      }
    }

    // Insert new contract version
    await ctx.db.insert("contracts", {
      poolId: args.poolId,
      hash: args.hash,
      versionNumber,
      contractJson: args.contractJson,
      prevHash: args.prevHash,
      nextHash: undefined,
      createdAt: Date.now(),
    });

    // Update pool: set activeContractHash and transition status to active
    await ctx.db.patch(args.poolId, {
      activeContractHash: args.hash,
      status: "active",
    });

    return versionNumber;
  },
});

// 3.6 — Return all contract versions for a pool ordered by version number
export const getContractVersions = query({
  args: { poolId: v.id("pools") },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("contracts")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();

    return versions.sort((a, b) => a.versionNumber - b.versionNumber);
  },
});

// 3.7 — Fetch a single contract version by its hash
export const getContractByHash = query({
  args: { hash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contracts")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
  },
});

// Internal — fetch the active contract JSON for a pool (used by Gemini actions)
export const getActiveContractForPool = internalQuery({
  args: { poolId: v.id("pools") },
  handler: async (ctx, args) => {
    const pool = await ctx.db.get(args.poolId);
    if (!pool?.activeContractHash) return null;
    return await ctx.db
      .query("contracts")
      .withIndex("by_hash", (q) => q.eq("hash", pool.activeContractHash!))
      .unique();
  },
});
