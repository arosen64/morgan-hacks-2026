"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { SignJWT, importJWK } from "jose";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(s: string): Uint8Array {
  let decoded = BigInt(0);
  let leading = 0;
  const base = BigInt(58);

  for (const char of s) {
    const digit = BASE58_ALPHABET.indexOf(char);
    if (digit === -1) throw new Error(`Invalid base58 character: ${char}`);
    if (decoded === BigInt(0) && digit === 0) {
      leading++;
    } else {
      decoded = decoded * base + BigInt(digit);
    }
  }

  const bytes: number[] = [];
  while (decoded > BigInt(0)) {
    bytes.unshift(Number(decoded % BigInt(256)));
    decoded = decoded / BigInt(256);
  }

  return new Uint8Array([...new Array(leading).fill(0), ...bytes]);
}

// Verifies the Ed25519 signature and mints a JWT using Node.js native crypto.
// Returns the token string, or throws with an error message.
export const verifySignatureAndMint = internalAction({
  args: {
    wallet: v.string(),
    nonce: v.string(),
    signatureB64: v.string(),
  },
  handler: async (_ctx, args): Promise<string> => {
    let pubkeyBytes: Uint8Array;
    let sigBytes: Uint8Array;
    try {
      pubkeyBytes = base58Decode(args.wallet);
      sigBytes = Uint8Array.from(atob(args.signatureB64), (c) =>
        c.charCodeAt(0),
      );
    } catch (e) {
      throw new Error(
        `Invalid wallet address or signature encoding: ${e instanceof Error ? e.message : e}`,
      );
    }

    const messageBytes = new TextEncoder().encode(args.nonce);
    console.log("[authHelpers] pubkey bytes length:", pubkeyBytes.length);
    console.log("[authHelpers] sig bytes length:", sigBytes.length);
    console.log("[authHelpers] message:", args.nonce);

    // Use Node.js native Ed25519 via Web Crypto — no external library needed
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      pubkeyBytes.buffer as ArrayBuffer,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      { name: "Ed25519" },
      cryptoKey,
      sigBytes.buffer as ArrayBuffer,
      messageBytes,
    );
    console.log("[authHelpers] signature valid:", valid);

    if (!valid) throw new Error("Invalid signature");

    const siteUrl = process.env.CONVEX_SITE_URL!;
    const privateKeyJwk = JSON.parse(process.env.JWT_PRIVATE_KEY!);
    const privateKey = await importJWK(privateKeyJwk, "ES256");

    return await new SignJWT({ sub: args.wallet })
      .setProtectedHeader({ alg: "ES256" })
      .setIssuer(siteUrl)
      .setAudience("convex")
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(privateKey);
  },
});

// Returns the public JWKS payload (no crypto needed, but kept here for consistency).
export const getPublicJwk = internalAction({
  args: {},
  handler: async (): Promise<Record<string, unknown>> => {
    const privateKeyJwk = JSON.parse(process.env.JWT_PRIVATE_KEY!);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { d: _d, ...publicKeyJwk } = privateKeyJwk;
    return { ...publicKeyJwk, use: "sig", alg: "ES256" };
  },
});
