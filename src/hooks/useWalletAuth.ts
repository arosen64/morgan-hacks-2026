import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL as string;
const TOKEN_CACHE_KEY = "wallet_auth_v1";
// JWT TTL is 7 days; we expire the cache 10 minutes early to avoid edge cases.
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000;

interface CachedAuth {
  token: string;
  wallet: string;
  expiresAt: number;
}

function loadCached(wallet: string): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedAuth;
    if (cached.wallet !== wallet) return null;
    if (cached.expiresAt < Date.now()) {
      localStorage.removeItem(TOKEN_CACHE_KEY);
      return null;
    }
    return cached.token;
  } catch {
    return null;
  }
}

function saveCache(token: string, wallet: string) {
  const entry: CachedAuth = {
    token,
    wallet,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(entry));
}

function clearCache() {
  localStorage.removeItem(TOKEN_CACHE_KEY);
}

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "signing" }
  | { status: "authenticated"; token: string }
  | { status: "error"; message: string };

export function useWalletAuth() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  // Track the wallet that the current token was issued for, so we can
  // clear state if the user switches wallets.
  const tokenWalletRef = useRef<string | null>(null);
  const signingRef = useRef(false);

  const doSignIn = useCallback(async () => {
    if (!publicKey || !signMessage) return;
    if (signingRef.current) return; // prevent concurrent sign-in attempts

    const walletAddress = publicKey.toBase58();

    // Restore from localStorage cache — avoids Phantom prompt on every reload
    const cached = loadCached(walletAddress);
    if (cached) {
      tokenWalletRef.current = walletAddress;
      setAuthState({ status: "authenticated", token: cached });
      return;
    }

    signingRef.current = true;
    setAuthState({ status: "signing" });

    try {
      // 1. Request a challenge nonce
      const challengeRes = await fetch(`${CONVEX_SITE_URL}/auth/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress }),
      });
      if (!challengeRes.ok) throw new Error("Failed to get challenge");
      const { nonce } = await challengeRes.json();

      // 2. Sign the nonce with Phantom
      const messageBytes = new TextEncoder().encode(nonce);
      const signature = await signMessage(messageBytes);

      // Encode signature as base64
      const signatureB64 = btoa(String.fromCharCode(...signature));

      // 3. Verify signature and receive JWT
      const verifyRes = await fetch(`${CONVEX_SITE_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletAddress,
          nonce,
          signature: signatureB64,
        }),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Signature verification failed");
      }
      const { token } = await verifyRes.json();

      saveCache(token, walletAddress);
      tokenWalletRef.current = walletAddress;
      setAuthState({ status: "authenticated", token });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      setAuthState({ status: "error", message });
    } finally {
      signingRef.current = false;
    }
  }, [publicKey, signMessage]);

  // Trigger sign-in when wallet connects or when auth is lost
  useEffect(() => {
    if (!connected || !publicKey) {
      // Wallet disconnected — clear session but keep localStorage cache
      // (user may just be reloading; they'll be re-authenticated from cache)
      tokenWalletRef.current = null;
      signingRef.current = false;
      setAuthState({ status: "unauthenticated" });
      return;
    }

    const currentWallet = publicKey.toBase58();

    // If the wallet changed, clear token + cache for the old wallet
    if (tokenWalletRef.current && tokenWalletRef.current !== currentWallet) {
      clearCache();
      tokenWalletRef.current = null;
      signingRef.current = false;
    }

    if (
      authState.status === "unauthenticated" ||
      authState.status === "loading"
    ) {
      doSignIn();
    }
    // Include authState.status so a forced token expiry (forceRefreshToken) that
    // resets state to "unauthenticated" automatically re-triggers sign-in.
  }, [connected, publicKey, authState.status, doSignIn]);

  // Expose shape expected by ConvexProviderWithAuth.
  const fetchAccessToken = useCallback(
    async ({
      forceRefreshToken,
    }: {
      forceRefreshToken: boolean;
    }): Promise<string | null> => {
      if (authState.status !== "authenticated") return null;
      if (forceRefreshToken) {
        // Token rejected by Convex. Clear cache and re-authenticate.
        if (signingRef.current) return null;
        clearCache();
        signingRef.current = false;
        setAuthState({ status: "unauthenticated" });
        return null;
      }
      return authState.token;
    },
    [authState],
  );

  return {
    isLoading: authState.status === "loading" || authState.status === "signing",
    isAuthenticated: authState.status === "authenticated",
    fetchAccessToken,
    // Extra fields for the UI
    authState,
    retrySignIn: doSignIn,
    walletAddress:
      authState.status === "authenticated" && publicKey
        ? publicKey.toBase58()
        : null,
    disconnect,
  };
}
