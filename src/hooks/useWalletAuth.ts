import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL as string;

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
    signingRef.current = true;

    const walletAddress = publicKey.toBase58();
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

  // Trigger sign-in when wallet connects
  useEffect(() => {
    if (!connected || !publicKey) {
      // Wallet disconnected — clear session
      tokenWalletRef.current = null;
      signingRef.current = false;
      setAuthState({ status: "unauthenticated" });
      return;
    }

    const currentWallet = publicKey.toBase58();

    // If the wallet changed, clear any existing token and re-authenticate
    if (tokenWalletRef.current && tokenWalletRef.current !== currentWallet) {
      tokenWalletRef.current = null;
      signingRef.current = false;
    }

    if (
      authState.status === "unauthenticated" ||
      authState.status === "loading"
    ) {
      doSignIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  // Expose shape expected by ConvexProviderWithAuth.
  // When Convex calls with forceRefreshToken: true it means the current token
  // was rejected (expired). We can't silently refresh (requires Phantom),
  // so we clear auth state — the UI gate in App.tsx will show SignInScreen
  // and the useEffect below will re-trigger doSignIn cleanly.
  const fetchAccessToken = useCallback(
    async ({
      forceRefreshToken,
    }: {
      forceRefreshToken: boolean;
    }): Promise<string | null> => {
      if (authState.status !== "authenticated") return null;
      if (forceRefreshToken) {
        // Tell Convex we have no valid token — drop to unauthenticated so
        // the app shows SignInScreen rather than a random Phantom popup.
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
