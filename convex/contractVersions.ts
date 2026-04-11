import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const storeContractVersion = mutation({
  args: {
    poolId: v.string(),
    content: v.any(),
    prevVersionHash: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const versionHash = crypto.randomUUID();

    // Find the current active version (nextVersionHash: null) to determine version number
    const existing = await ctx.db
      .query("contractVersions")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();

    const version = existing.length + 1;

    // If there's a previous version, update its nextVersionHash
    if (args.prevVersionHash) {
      const prev = await ctx.db
        .query("contractVersions")
        .withIndex("by_versionHash", (q) =>
          q.eq("versionHash", args.prevVersionHash as string),
        )
        .unique();
      if (prev) {
        await ctx.db.patch(prev._id, { nextVersionHash: versionHash });
      }
    }

    await ctx.db.insert("contractVersions", {
      poolId: args.poolId,
      version,
      versionHash,
      prevVersionHash: args.prevVersionHash,
      nextVersionHash: null,
      content: args.content,
      createdAt: Date.now(),
    });

    return versionHash;
  },
});

export const getActiveContractVersion = query({
  args: { poolId: v.string() },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("contractVersions")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();
    return versions.find((v) => v.nextVersionHash === null) ?? null;
  },
});

export const getContractVersionByHash = query({
  args: { versionHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contractVersions")
      .withIndex("by_versionHash", (q) => q.eq("versionHash", args.versionHash))
      .unique();
  },
});

export const listContractVersions = query({
  args: { poolId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contractVersions")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .order("asc")
      .collect();
  },
});
