/**
 * Run once to generate the EC P-256 key pair used for JWT signing.
 * Paste the output values into the Convex dashboard env vars:
 *   JWT_PRIVATE_KEY  — full JWK (including "d")
 *   CONVEX_SITE_URL  — e.g. https://laudable-meadowlark-713.convex.site
 */
import { generateKeyPair, exportJWK } from "jose";

const { privateKey, publicKey } = await generateKeyPair("ES256");

const privateJwk = await exportJWK(privateKey);
const publicJwk = await exportJWK(publicKey);

console.log("=== JWT_PRIVATE_KEY (set in Convex dashboard) ===");
console.log(JSON.stringify(privateJwk));
console.log(
  "\n=== Public key (embedded in JWKS endpoint — no env var needed) ===",
);
console.log(JSON.stringify(publicJwk));
