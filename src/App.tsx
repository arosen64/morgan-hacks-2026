import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Id } from "../convex/_generated/dataModel";
import { SignInScreen } from "./components/SignInScreen";
import { MainMenu } from "./components/MainMenu";
import { PoolDashboard } from "./components/PoolDashboard";

export default function App() {
  const { publicKey, connected } = useWallet();

  // Track pool selection alongside the wallet that made it.
  // If the wallet changes (disconnect / reconnect), the selection is invalidated
  // without needing a useEffect setState.
  const [selection, setSelection] = useState<{
    wallet: string;
    poolId: Id<"pools">;
  } | null>(null);

  if (!connected || !publicKey) {
    return <SignInScreen />;
  }

  const walletAddress = publicKey.toBase58();
  const activePoolId =
    selection?.wallet === walletAddress ? selection.poolId : null;

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
