import { useState } from "react";
import type { Id } from "../convex/_generated/dataModel";
import { SignInScreen } from "./components/SignInScreen";
import { MainMenu } from "./components/MainMenu";
import { PoolDashboard } from "./components/PoolDashboard";
import { useWalletAuth } from "./hooks/useWalletAuth";

// Read and immediately strip any ?pool= param from the URL on module load.
// This runs once so the invite param doesn't persist on page refresh.
function consumeInvitePoolId(): Id<"pools"> | null {
  const params = new URLSearchParams(window.location.search);
  const poolId = params.get("pool");
  if (poolId) {
    window.history.replaceState({}, "", window.location.pathname);
    return poolId as Id<"pools">;
  }
  return null;
}

const initialInvitePoolId = consumeInvitePoolId();

export default function App() {
  const { isLoading, isAuthenticated, authState, retrySignIn, walletAddress } =
    useWalletAuth();

  // Track pool selection alongside the wallet that made it.
  // If the wallet changes (disconnect / reconnect), the selection is invalidated
  // without needing a useEffect setState.
  // Seed with any invite pool ID from the URL so authenticated users skip MainMenu.
  const [selection, setSelection] = useState<{
    wallet: string;
    poolId: Id<"pools">;
  } | null>(null);

  // Holds the invite pool ID for unauthenticated users until they connect.
  const [pendingInvitePoolId] = useState<Id<"pools"> | null>(
    initialInvitePoolId,
  );

  if (isLoading || !isAuthenticated || !walletAddress) {
    return (
      <SignInScreen
        signingState={
          authState.status === "signing"
            ? "signing"
            : authState.status === "error"
              ? "error"
              : undefined
        }
        errorMessage={
          authState.status === "error" ? authState.message : undefined
        }
        onRetry={authState.status === "error" ? retrySignIn : undefined}
      />
    );
  }

  // If a selection exists for the current wallet, use it.
  // Otherwise, if an invite pool ID was in the URL, auto-select it.
  const activePoolId: Id<"pools"> | null =
    selection?.wallet === walletAddress
      ? selection.poolId
      : (pendingInvitePoolId ?? null);

  if (!activePoolId) {
    return (
      <MainMenu
        walletAddress={walletAddress}
        onSelectPool={(poolId) =>
          setSelection({ wallet: walletAddress, poolId })
        }
      />
    );
  }

  return (
    <PoolDashboard
      poolId={activePoolId}
      walletAddress={walletAddress}
      onBack={() => setSelection(null)}
    />
  );
}
