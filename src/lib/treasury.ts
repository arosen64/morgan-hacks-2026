import { PublicKey, Connection } from "@solana/web3.js";

export const TREASURY_PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID as string,
);

/**
 * Derive a deterministic 32-byte seed from a Convex pool ID string.
 * Uses SHA-256 of the UTF-8 bytes so the result is always exactly 32 bytes.
 */
export async function poolIdToBytes(poolId: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(poolId);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive the treasury PDA for a given Convex pool ID.
 * Seeds: ["treasury", poolIdBytes]
 */
export async function getTreasuryPda(poolId: string): Promise<PublicKey> {
  const seed = await poolIdToBytes(poolId);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), Buffer.from(seed)],
    TREASURY_PROGRAM_ID,
  );
  return pda;
}

/**
 * Check whether the treasury PDA account has been initialized on-chain.
 */
export async function isTreasuryInitialized(
  connection: Connection,
  poolId: string,
): Promise<boolean> {
  const pda = await getTreasuryPda(poolId);
  const info = await connection.getAccountInfo(pda);
  return info !== null && info.data.length > 0;
}
