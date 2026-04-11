import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { approvalRuleValidator } from "./lib/validators";

export default defineSchema({
  groups: defineTable({
    name: v.string(),
    approvalRule: v.optional(approvalRuleValidator),
    amendmentApprovalRule: v.optional(approvalRuleValidator),
  }),

  members: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    wallet: v.string(),
    role: v.string(),
    isActive: v.boolean(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_groupId_and_wallet", ["groupId", "wallet"]),

  proposals: defineTable({
    groupId: v.id("groups"),
    type: v.union(v.literal("transaction"), v.literal("amendment")),
    proposerId: v.id("members"),
    description: v.string(),
    amount: v.optional(v.number()), // lamports; only for transaction proposals
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
  })
    .index("by_groupId", ["groupId"])
    .index("by_groupId_and_status", ["groupId", "status"]),

  votes: defineTable({
    proposalId: v.id("proposals"),
    memberId: v.id("members"),
    vote: v.union(v.literal("approve"), v.literal("reject")),
  })
    .index("by_proposalId", ["proposalId"])
    .index("by_proposalId_and_memberId", ["proposalId", "memberId"]),
});
