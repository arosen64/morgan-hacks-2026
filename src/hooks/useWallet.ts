import { useState, useEffect, useCallback } from "react";
import {
  Keypair,
  PublicKey,
  Transaction,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  deriveKeypair,
  saveKeypair,
  loadKeypair,
  clearKeypair,
} from "../lib/demoWallet";

export const CONNECTION = new Connection(clusterApiUrl("devnet"), "confirmed");

export interface WalletState {
  keypair: Keypair | null;
  publicKey: PublicKey | null;
  balance: number | null; // SOL
  airdropWarning: string | null;
  isLoading: boolean;
  /** Sign and send a transaction using the demo keypair. */
  signAndSendTransaction: (tx: Transaction) => Promise<string>;
  /** Create a demo wallet from a username, airdrop if balance=0. */
  createDemoWallet: (username: string) => Promise<void>;
  /** Log out and clear stored keypair. */
  logout: () => void;
}

export function useWallet(): WalletState {
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [airdropWarning, setAirdropWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const stored = loadKeypair();
    if (stored) {
      setKeypair(stored);
      refreshBalance(stored.publicKey);
    }
  }, []);

  const refreshBalance = useCallback(async (pubkey: PublicKey) => {
    try {
      const lamports = await CONNECTION.getBalance(pubkey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, []);

  const createDemoWallet = useCallback(
    async (username: string) => {
      setIsLoading(true);
      setAirdropWarning(null);
      const kp = await deriveKeypair(username);
      saveKeypair(kp);
      setKeypair(kp);

      // Airdrop if balance is zero
      try {
        const lamports = await CONNECTION.getBalance(kp.publicKey);
        if (lamports === 0) {
          const sig = await CONNECTION.requestAirdrop(
            kp.publicKey,
            2 * LAMPORTS_PER_SOL,
          );
          const { blockhash, lastValidBlockHeight } =
            await CONNECTION.getLatestBlockhash();
          await CONNECTION.confirmTransaction(
            { signature: sig, blockhash, lastValidBlockHeight },
            "confirmed",
          );
        }
        await refreshBalance(kp.publicKey);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.toLowerCase().includes("rate") ||
          msg.toLowerCase().includes("429")
        ) {
          setAirdropWarning(
            "Airdrop rate-limited — you may need to fund this wallet manually at faucet.solana.com",
          );
        } else {
          setAirdropWarning(`Airdrop failed: ${msg}`);
        }
        // Refresh balance anyway — wallet may already have funds
        await refreshBalance(kp.publicKey);
      } finally {
        setIsLoading(false);
      }
    },
    [refreshBalance],
  );

  const signAndSendTransaction = useCallback(
    async (tx: Transaction): Promise<string> => {
      if (!keypair) throw new Error("No wallet connected");
      const { blockhash, lastValidBlockHeight } =
        await CONNECTION.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = keypair.publicKey;
      tx.sign(keypair);
      const sig = await CONNECTION.sendRawTransaction(tx.serialize());
      await CONNECTION.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed",
      );
      return sig;
    },
    [keypair],
  );

  const logout = useCallback(() => {
    clearKeypair();
    setKeypair(null);
    setBalance(null);
    setAirdropWarning(null);
  }, []);

  return {
    keypair,
    publicKey: keypair?.publicKey ?? null,
    balance,
    airdropWarning,
    isLoading,
    signAndSendTransaction,
    createDemoWallet,
    logout,
  };
}
