import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const upsertNonce = internalMutation({
  args: { wallet: v.string(), nonce: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nonces")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        nonce: args.nonce,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert("nonces", {
        wallet: args.wallet,
        nonce: args.nonce,
        createdAt: Date.now(),
      });
    }
  },
});

export const getNonce = internalQuery({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nonces")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .unique();
  },
});

export const deleteNonce = internalMutation({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nonces")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
