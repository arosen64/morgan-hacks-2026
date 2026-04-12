"use node";
// Gemini integration for contract generation, transaction validation, and amendments.
// Requires GEMINI_API_KEY set in Convex environment variables.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REQUIRED_CONTRACT_KEYS = [
  "name",
  "version",
  "members",
  "contribution_rules",
  "distribution_rules",
  "allowed_transaction_types",
  "approval_rules",
  "budget_limits",
] as const;

function validateContractShape(obj: unknown): void {
  if (typeof obj !== "object" || obj === null) {
    throw new ConvexError(
      "Gemini returned an invalid contract. Please try again.",
    );
  }
  for (const key of REQUIRED_CONTRACT_KEYS) {
    if (!(key in (obj as Record<string, unknown>))) {
      throw new ConvexError(
        `Gemini returned an invalid contract (missing "${key}"). Please try again.`,
      );
    }
  }
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ConvexError("GEMINI_API_KEY is not configured.");
  return new GoogleGenerativeAI(apiKey);
}

// ---------------------------------------------------------------------------
// 1. generateContract — plain language → validated contract JSON
// ---------------------------------------------------------------------------

export const generateContract = action({
  args: {
    poolName: v.string(),
    rulesDescription: v.string(),
    members: v.array(
      v.object({
        name: v.string(),
        wallet: v.string(),
        role: v.union(v.literal("manager"), v.literal("member")),
      }),
    ),
  },
  handler: async (_ctx, args) => {
    const client = getClient();
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const rulesText = args.rulesDescription.trim()
      ? args.rulesDescription
      : `Generate reasonable defaults for a group of ${args.members.length} people with no specific rules provided.`;

    const prompt = `You are a smart contract generator for a group treasury.
Pool name: "${args.poolName}"
Members: ${JSON.stringify(args.members, null, 2)}
Rules: "${rulesText}"

Generate a JSON contract with EXACTLY these fields (no extra fields, no markdown):
{
  "name": "${args.poolName}",
  "version": 1,
  "prev_version_hash": null,
  "next_version_hash": null,
  "members": <array of all members with name, wallet, role>,
  "contribution_rules": <string describing contribution rules>,
  "distribution_rules": <string describing how distributions work>,
  "allowed_transaction_types": <array of strings, e.g. ["groceries","utilities","events"]>,
  "approval_rules": {
    "default": <object describing the approval rule, e.g. {"type":"unanimous"} or {"type":"k-of-n","k":2}>,
    "amendment": {"type":"unanimous"}
  },
  "budget_limits": {
    "per_transaction_max_sol": <number>
  }
}

Return ONLY valid JSON. No markdown fences, no explanation.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ConvexError(
        "Gemini returned an invalid contract. Please try again.",
      );
    }

    validateContractShape(parsed);
    return parsed as Record<string, unknown>;
  },
});

// ---------------------------------------------------------------------------
// 2. validateTransaction — check a proposed transaction against the contract
// ---------------------------------------------------------------------------

export const validateTransaction = action({
  args: {
    poolId: v.id("pools"),
    amount: v.number(), // in SOL
    description: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const contract = await ctx.runQuery(
      internal.contracts.getActiveContractForPool,
      { poolId: args.poolId },
    );
    if (!contract) {
      throw new ConvexError("Pool has no active contract.");
    }

    const client = getClient();
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are validating a transaction proposal against a group treasury contract.

Contract:
${contract.contractJson}

Proposed transaction:
- Amount: ${args.amount} SOL
- Category: "${args.category}"
- Description: "${args.description}"

Evaluate:
1. Is the category in "allowed_transaction_types"?
2. Is the amount within "budget_limits.per_transaction_max_sol"?
3. Is the description coherent with the stated category?

Return ONLY a JSON object with exactly two fields:
{
  "pass": <true if all checks pass, false otherwise>,
  "explanation": <one clear sentence explaining the result>
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ConvexError("Gemini validation failed. Please try again.");
    }

    const p = parsed as Record<string, unknown>;
    if (typeof p.pass !== "boolean" || typeof p.explanation !== "string") {
      throw new ConvexError("Gemini validation returned an unexpected format.");
    }

    return { pass: p.pass as boolean, explanation: p.explanation as string };
  },
});

// ---------------------------------------------------------------------------
// 3a. refineContract — refine an in-memory draft without touching the DB
//     Used by the iterative contract builder in the Create Pool flow.
// ---------------------------------------------------------------------------

export const refineContract = action({
  args: {
    currentContractJson: v.string(),
    modification: v.string(),
  },
  handler: async (_ctx, args): Promise<Record<string, unknown>> => {
    const client = getClient();
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `You are refining a group treasury contract draft.

Current draft:
${args.currentContractJson}

Requested modification: "${args.modification}"

Apply the modification and return the complete updated contract JSON.
Keep ALL fields intact. Only change what was requested.
Return ONLY valid JSON. No markdown fences, no explanation.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ConvexError("Gemini returned invalid JSON. Please try again.");
    }

    validateContractShape(parsed);
    return parsed as Record<string, unknown>;
  },
});

// ---------------------------------------------------------------------------
// 3. generateAmendment — current contract + plain language → updated contract
// ---------------------------------------------------------------------------

export const generateAmendment = action({
  args: {
    poolId: v.id("pools"),
    amendmentDescription: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ contract: Record<string, unknown>; prevHash: string }> => {
    const contract: {
      hash: string;
      contractJson: string;
    } | null = await ctx.runQuery(internal.contracts.getActiveContractForPool, {
      poolId: args.poolId,
    });
    if (!contract) {
      throw new ConvexError("Pool has no active contract to amend.");
    }

    const client = getClient();
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const currentVersion = (() => {
      try {
        return JSON.parse(contract.contractJson) as Record<string, unknown>;
      } catch {
        throw new ConvexError("Active contract JSON is malformed.");
      }
    })();

    const newVersion = ((currentVersion.version as number) ?? 1) + 1;

    const prompt = `You are amending a group treasury contract.

Current contract:
${JSON.stringify(currentVersion, null, 2)}

Requested amendment: "${args.amendmentDescription}"

Return an updated contract JSON that:
1. Applies the requested change
2. Sets "version" to ${newVersion}
3. Sets "prev_version_hash" to "${contract.hash}"
4. Sets "next_version_hash" to null
5. Keeps ALL other fields (name, members, etc.) unchanged unless the amendment specifically modifies them

Return ONLY valid JSON. No markdown fences, no explanation.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ConvexError(
        "Gemini returned an invalid amendment. Please try again.",
      );
    }

    validateContractShape(parsed);

    // Return both the new contract and the previous hash (needed for commitContract)
    return {
      contract: parsed as Record<string, unknown>,
      prevHash: contract.hash,
    };
  },
});
