import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pools: defineTable({
    name: v.string(),
    status: v.union(v.literal("pre-contract"), v.literal("active")),
    activeContractHash: v.optional(v.string()),
  }),

  members: defineTable({
    poolId: v.id("pools"),
    name: v.string(),
    wallet: v.string(),
    role: v.union(v.literal("manager"), v.literal("member")),
  })
    .index("by_poolId", ["poolId"])
    .index("by_wallet", ["wallet"]),

  contracts: defineTable({
    poolId: v.id("pools"),
    hash: v.string(),
    versionNumber: v.number(),
    contractJson: v.string(),
    prevHash: v.optional(v.string()),
    nextHash: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_poolId", ["poolId"])
    .index("by_hash", ["hash"]),

  contractVersions: defineTable({
    poolId: v.string(),
    version: v.number(),
    versionHash: v.string(),
    prevVersionHash: v.union(v.string(), v.null()),
    nextVersionHash: v.union(v.string(), v.null()),
    content: v.any(),
    createdAt: v.number(),
  })
    .index("by_poolId", ["poolId"])
    .index("by_versionHash", ["versionHash"]),
});
