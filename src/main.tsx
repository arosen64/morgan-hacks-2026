// Anchor (and other Solana libs) rely on Node's Buffer global — polyfill for Vite browser builds.
import { Buffer } from "buffer";
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).Buffer = Buffer;
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./index.css";
import App from "./App.tsx";
import { useWalletAuth } from "./hooks/useWalletAuth.ts";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const endpoint = clusterApiUrl("devnet");
const wallets = [new PhantomWalletAdapter()];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ConvexProviderWithAuth client={convex} useAuth={useWalletAuth}>
            <App />
          </ConvexProviderWithAuth>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>,
);
