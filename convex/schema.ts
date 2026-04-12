import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { approvalRuleValidator } from "./lib/validators";

export default defineSchema({
  pools: defineTable({
    name: v.string(),
    status: v.union(v.literal("pre-contract"), v.literal("active")),
    activeContractHash: v.optional(v.string()),
    approvalRule: v.optional(approvalRuleValidator),
    amendmentApprovalRule: v.optional(approvalRuleValidator),
  }),

  members: defineTable({
    poolId: v.id("pools"),
    name: v.string(),
    wallet: v.string(),
    role: v.union(v.literal("manager"), v.literal("member")),
    isActive: v.optional(v.boolean()), // optional for backward compat; absent treated as active
    status: v.optional(v.union(v.literal("pending"), v.literal("active"))), // absent treated as active
    contributedLamports: v.optional(v.number()),
  })
    .index("by_poolId", ["poolId"])
    .index("by_wallet", ["wallet"])
    .index("by_poolId_and_wallet", ["poolId", "wallet"]),

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

  proposals: defineTable({
    poolId: v.id("pools"),
    type: v.union(v.literal("transaction"), v.literal("amendment")),
    proposerId: v.id("members"),
    description: v.string(),
    amount: v.optional(v.number()), // lamports; only for transaction proposals
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("executed"),
    ),
    resolvedAt: v.optional(v.number()), // ms timestamp when approved/rejected
    geminiValidation: v.optional(
      v.object({ pass: v.boolean(), explanation: v.string() }),
    ),
    // Amendment proposals store the proposed contract so it can be committed on approval
    contractJson: v.optional(v.string()),
    contractHash: v.optional(v.string()),
    // Transaction proposals
    recipientWallet: v.optional(v.string()),
    url: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    // On-chain linkage — proposal_count at the time of Anchor create_proposal
    onChainProposalId: v.optional(v.number()),
    // Execution record — set after the SOL transfer is confirmed on-chain
    txSignature: v.optional(v.string()),
    executedAt: v.optional(v.number()),
  })
    .index("by_poolId", ["poolId"])
    .index("by_poolId_and_status", ["poolId", "status"]),

  nonces: defineTable({
    wallet: v.string(),
    nonce: v.string(),
    createdAt: v.number(),
  }).index("by_wallet", ["wallet"]),

  votes: defineTable({
    proposalId: v.id("proposals"),
    memberId: v.id("members"),
    vote: v.union(v.literal("approve"), v.literal("reject")),
  })
    .index("by_proposalId", ["proposalId"])
    .index("by_proposalId_and_memberId", ["proposalId", "memberId"]),
});
