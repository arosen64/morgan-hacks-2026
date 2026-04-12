import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";

// 2.1 — Add a member to a pool, enforcing uniqueness of name and wallet within the pool.
export const addMember = mutation({
  args: {
    poolId: v.id("pools"),
    name: v.string(),
    role: v.union(v.literal("manager"), v.literal("member")),
    wallet: v.string(),
  },
  handler: async (ctx, args) => {
    const wallet = args.wallet;

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
      if (member.wallet === wallet) {
        throw new Error(
          "This wallet address is already registered in this pool.",
        );
      }
    }

    return await ctx.db.insert("members", {
      poolId: args.poolId,
      name: args.name,
      wallet,
      role: args.role,
      status: "pending",
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

// Returns all pools a wallet address belongs to, with their role in each
export const getPoolsByWallet = query({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    const wallet = args.wallet;
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_wallet", (q) => q.eq("wallet", wallet))
      .take(100);

    const result: { pool: Doc<"pools">; role: "manager" | "member" }[] = [];
    for (const membership of memberships) {
      // Skip pending memberships — pending users don't see the pool in their list
      if (membership.status === "pending") continue;
      const pool = await ctx.db.get(membership.poolId);
      if (pool) {
        result.push({ pool, role: membership.role });
      }
    }
    return result;
  },
});

// Returns only pending members for a given pool
export const getPendingMembers = query({
  args: { poolId: v.id("pools") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();
    return members.filter((m) => m.status === "pending");
  },
});

// Accept or reject a pending join request. Only pool managers may call this.
export const resolveJoinRequest = mutation({
  args: {
    poolId: v.id("pools"),
    memberId: v.id("members"),
    action: v.union(v.literal("accept"), v.literal("reject")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthenticated");

    const callerWallet = identity.tokenIdentifier;

    // Verify caller is a manager in this pool
    const allMembers = await ctx.db
      .query("members")
      .withIndex("by_poolId", (q) => q.eq("poolId", args.poolId))
      .collect();

    const caller = allMembers.find((m) => m.wallet === callerWallet);
    if (!caller || caller.role !== "manager") {
      throw new ConvexError(
        "Only pool managers can accept or reject join requests.",
      );
    }

    const target = await ctx.db.get(args.memberId);
    if (
      !target ||
      target.poolId !== args.poolId ||
      target.status !== "pending"
    ) {
      throw new ConvexError("Pending member record not found.");
    }

    if (args.action === "accept") {
      await ctx.db.patch(args.memberId, { status: "active" });
    } else {
      await ctx.db.delete(args.memberId);
    }
  },
});

// Record a confirmed on-chain deposit — increments contributedLamports for the depositing member
export const recordDeposit = mutation({
  args: {
    poolId: v.id("pools"),
    wallet: v.string(),
    lamports: v.number(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("members")
      .withIndex("by_poolId_and_wallet", (q) =>
        q.eq("poolId", args.poolId).eq("wallet", args.wallet),
      )
      .first();

    if (!member) throw new Error("Member not found in this pool.");

    const current = member.contributedLamports ?? 0;
    await ctx.db.patch(member._id, {
      contributedLamports: current + args.lamports,
    });
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
