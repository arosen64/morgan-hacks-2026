// 3.8 — Canonicalize a contract object and return its SHA-256 hex hash.
// Keys are sorted recursively so the same logical contract always hashes identically.

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as object)
      .sort()
      .reduce(
        (acc, key) => {
          (acc as Record<string, unknown>)[key] = sortKeys(
            (obj as Record<string, unknown>)[key],
          );
          return acc;
        },
        {} as Record<string, unknown>,
      );
  }
  return obj;
}

export function canonicalizeContract(contract: object): string {
  return JSON.stringify(sortKeys(contract));
}

export async function canonicalizeAndHash(contract: object): Promise<string> {
  const canonical = canonicalizeContract(contract);
  const encoded = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
