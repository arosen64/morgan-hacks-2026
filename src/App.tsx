import { useState } from "react";
import type { Id } from "../convex/_generated/dataModel";
import { SignInScreen } from "./components/SignInScreen";
import { MainMenu } from "./components/MainMenu";
import { PoolDashboard } from "./components/PoolDashboard";
import { useWalletAuth } from "./hooks/useWalletAuth";

export default function App() {
  const { isLoading, isAuthenticated, authState, retrySignIn, walletAddress } =
    useWalletAuth();

  // Track pool selection alongside the wallet that made it.
  // If the wallet changes (disconnect / reconnect), the selection is invalidated
  // without needing a useEffect setState.
  const [selection, setSelection] = useState<{
    wallet: string;
    poolId: Id<"pools">;
  } | null>(null);

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

  const activePoolId =
    selection?.wallet === walletAddress ? selection.poolId : null;

  if (!activePoolId) {
    return (
      <MainMenu
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
