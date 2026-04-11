import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";

const STORAGE_KEY = "demo_wallet";

/** Encode Uint8Array to base64 string without Buffer. */
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/** Decode base64 string to Uint8Array without Buffer. */
function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** SHA-256 via Web Crypto API (returns 32-byte Uint8Array). */
async function sha256(input: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(buf);
}

/**
 * Derives a deterministic Solana Keypair from a username.
 * Same username always produces the same keypair.
 */
export async function deriveKeypair(username: string): Promise<Keypair> {
  const seed = await sha256(`demo:${username}`); // 32 bytes
  const { secretKey } = nacl.sign.keyPair.fromSeed(seed);
  return Keypair.fromSecretKey(secretKey);
}

/** Persist a keypair's secret key to localStorage. */
export function saveKeypair(keypair: Keypair): void {
  localStorage.setItem(STORAGE_KEY, toBase64(keypair.secretKey));
}

/** Restore a keypair from localStorage, or return null if none stored. */
export function loadKeypair(): Keypair | null {
  const encoded = localStorage.getItem(STORAGE_KEY);
  if (!encoded) return null;
  try {
    return Keypair.fromSecretKey(fromBase64(encoded));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/** Clear the stored keypair (logout). */
export function clearKeypair(): void {
  localStorage.removeItem(STORAGE_KEY);
}
