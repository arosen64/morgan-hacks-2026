import { v } from "convex/values";

// Tiered tier — nested rule stored as v.any() since Convex validators can't be recursive
export const tierValidator = v.object({
  maxAmount: v.optional(v.number()), // lamports; absent means catch-all tier
  rule: v.any(),
});

export const approvalRuleValidator = v.union(
  v.object({ type: v.literal("unanimous") }),
  v.object({ type: v.literal("k-of-n"), k: v.number(), n: v.number() }),
  v.object({ type: v.literal("named-set"), memberIds: v.array(v.string()) }),
  v.object({ type: v.literal("role-based"), role: v.string() }),
  v.object({
    type: v.literal("tiered"),
    tiers: v.array(tierValidator),
  }),
);
