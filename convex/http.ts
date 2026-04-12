import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

const corsPreflightHandler = httpAction(async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
});

// ---------------------------------------------------------------------------
// POST /auth/challenge
// ---------------------------------------------------------------------------

const challenge = httpAction(async (ctx, req) => {
  try {
    const body = await req.json();
    const wallet = body.wallet;
    if (typeof wallet !== "string" || !wallet) {
      return errorResponse("wallet is required", 400);
    }

    const nonce = crypto.randomUUID();
    await ctx.runMutation(internal.nonces.upsertNonce, { wallet, nonce });

    return jsonResponse({ nonce });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return errorResponse(message, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /auth/verify
// ---------------------------------------------------------------------------

const verify = httpAction(async (ctx, req) => {
  try {
    const body = await req.json();
    const { wallet, nonce, signature: signatureB64 } = body;
    if (!wallet || !nonce || !signatureB64) {
      return errorResponse("wallet, nonce, and signature are required", 400);
    }

    // Look up the stored nonce
    const stored = await ctx.runQuery(internal.nonces.getNonce, { wallet });
    console.log(
      "[verify] stored nonce:",
      stored?.nonce,
      "received nonce:",
      nonce,
    );
    if (!stored) {
      console.log("[verify] FAIL: no pending challenge for", wallet);
      return errorResponse("No pending challenge for this wallet", 401);
    }
    if (stored.nonce !== nonce) {
      console.log("[verify] FAIL: nonce mismatch");
      return errorResponse("Nonce mismatch", 401);
    }
    if (Date.now() - stored.createdAt > NONCE_TTL_MS) {
      await ctx.runMutation(internal.nonces.deleteNonce, { wallet });
      console.log("[verify] FAIL: nonce expired");
      return errorResponse("Nonce expired", 401);
    }

    // Consume the nonce before verification so it can't be replayed
    await ctx.runMutation(internal.nonces.deleteNonce, { wallet });

    // Verify signature and mint JWT in the Node.js runtime
    const token = await ctx.runAction(
      internal.authHelpers.verifySignatureAndMint,
      { wallet, nonce, signatureB64 },
    );

    return jsonResponse({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    const status =
      message === "Invalid signature" ||
      message === "Invalid wallet address or signature encoding"
        ? 401
        : 500;
    return errorResponse(message, status);
  }
});

// ---------------------------------------------------------------------------
// GET /.well-known/openid-configuration
// ---------------------------------------------------------------------------

const oidcConfig = httpAction(async () => {
  try {
    const siteUrl = process.env.CONVEX_SITE_URL!;
    return jsonResponse({
      issuer: siteUrl,
      jwks_uri: `${siteUrl}/.well-known/jwks.json`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return errorResponse(message, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /.well-known/jwks.json
// ---------------------------------------------------------------------------

const jwks = httpAction(async (ctx) => {
  try {
    const publicKeyJwk = await ctx.runAction(
      internal.authHelpers.getPublicJwk,
      {},
    );
    return jsonResponse({ keys: [publicKeyJwk] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return errorResponse(message, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /sol-price  — server-side proxy so the browser avoids CORS restrictions
// ---------------------------------------------------------------------------

const solPrice = httpAction(async () => {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    );
    if (!res.ok) return jsonResponse({ price: null });
    const data = await res.json();
    const price =
      typeof (data as { solana?: { usd?: number } })?.solana?.usd === "number"
        ? (data as { solana: { usd: number } }).solana.usd
        : null;
    return jsonResponse({ price });
  } catch {
    return jsonResponse({ price: null });
  }
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const http = httpRouter();

http.route({ path: "/auth/challenge", method: "POST", handler: challenge });
http.route({
  path: "/auth/challenge",
  method: "OPTIONS",
  handler: corsPreflightHandler,
});
http.route({ path: "/auth/verify", method: "POST", handler: verify });
http.route({
  path: "/auth/verify",
  method: "OPTIONS",
  handler: corsPreflightHandler,
});
http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: oidcConfig,
});
http.route({ path: "/.well-known/jwks.json", method: "GET", handler: jwks });
http.route({ path: "/sol-price", method: "GET", handler: solPrice });
http.route({
  path: "/sol-price",
  method: "OPTIONS",
  handler: corsPreflightHandler,
});

export default http;
