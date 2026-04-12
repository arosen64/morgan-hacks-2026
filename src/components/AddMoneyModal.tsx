import { useState, useEffect, useCallback } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { SolAmount } from "./SolAmount";
import { useSolPrice } from "@/hooks/useSolPrice";
import { getTreasuryPda } from "../lib/treasury";

// Minimum lamports to keep a 0-byte account rent-exempt (~0.00089 SOL, rounded up)
const MIN_RENT_EXEMPT_LAMPORTS = 1_000_000; // 0.001 SOL — safely above threshold

interface AddMoneyModalProps {
  poolId: Id<"pools">;
  walletAddress: string;
  onSuccess: (lamports: number) => void;
  onClose: () => void;
}

export function AddMoneyModal({
  poolId,
  walletAddress,
  onSuccess,
  onClose,
}: AddMoneyModalProps) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const recordDeposit = useMutation(api.members.recordDeposit);

  const [amountSol, setAmountSol] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [treasuryExists, setTreasuryExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!anchorWallet?.publicKey) return;
    try {
      const lamports = await connection.getBalance(anchorWallet.publicKey);
      setWalletBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      // ignore
    }
  }, [connection, anchorWallet?.publicKey]);

  useEffect(() => {
    let cancelled = false;
    if (!anchorWallet?.publicKey) return;

    Promise.all([
      connection.getBalance(anchorWallet.publicKey),
      getTreasuryPda(poolId).then((pda) => connection.getAccountInfo(pda)),
    ])
      .then(([balance, accountInfo]) => {
        if (cancelled) return;
        setWalletBalance(balance / LAMPORTS_PER_SOL);
        setTreasuryExists(accountInfo !== null);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [connection, anchorWallet?.publicKey, fetchBalance, poolId]);

  const solPriceUsd = useSolPrice();
  const parsedAmount = parseFloat(amountSol);
  const inputUsd =
    solPriceUsd !== null && !isNaN(parsedAmount) && parsedAmount > 0
      ? parsedAmount * solPriceUsd
      : null;
  const amountLamports =
    !isNaN(parsedAmount) && parsedAmount > 0
      ? Math.floor(parsedAmount * LAMPORTS_PER_SOL)
      : 0;

  // For new treasury accounts (first deposit ever), need >= rent-exempt minimum
  const belowRentMinimum =
    treasuryExists === false && amountLamports < MIN_RENT_EXEMPT_LAMPORTS;

  const isValid =
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    walletBalance !== null &&
    parsedAmount <= walletBalance - 0.001 && // reserve for tx fee
    !belowRentMinimum;

  async function handleDeposit() {
    if (!anchorWallet) return;
    setLoading(true);
    setError(null);

    try {
      const treasuryPda = await getTreasuryPda(poolId);

      // Raw SOL transfer — works regardless of on-chain program state.
      // The treasury PDA accumulates lamports; connection.getBalance() reads it back.
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: anchorWallet.publicKey,
          toPubkey: treasuryPda,
          lamports: amountLamports,
        }),
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = anchorWallet.publicKey;

      // Sign via Phantom, broadcast via our Helius connection
      const signed = await anchorWallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      // Record the confirmed deposit in Convex
      await recordDeposit({
        poolId,
        wallet: walletAddress,
        lamports: amountLamports,
      });

      onSuccess(amountLamports);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("rejected") ||
        msg.toLowerCase().includes("user cancel")
      ) {
        setError("Transaction rejected.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Add Money</h2>
            <p className="text-sm text-muted-foreground">
              Deposit SOL into the pot treasury from your Phantom wallet.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors ml-4 mt-0.5 text-xl leading-none disabled:opacity-40"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Amount (SOL)</label>
            {walletBalance !== null && (
              <span className="text-xs text-muted-foreground">
                Balance: <SolAmount sol={walletBalance} />
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.001"
              value={amountSol}
              onChange={(e) => setAmountSol(e.target.value)}
              placeholder="0.00"
              disabled={loading}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
              autoFocus
            />
            {walletBalance !== null && (
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() =>
                  setAmountSol(Math.max(0, walletBalance - 0.001).toFixed(4))
                }
              >
                Max
              </Button>
            )}
          </div>
          {inputUsd !== null && (
            <p className="text-xs text-muted-foreground">
              ≈ ${inputUsd.toFixed(2)}
            </p>
          )}
          {walletBalance !== null && parsedAmount > walletBalance - 0.001 && (
            <p className="text-xs text-red-500">
              Insufficient balance (keeping 0.001 SOL for transaction fee)
            </p>
          )}
          {belowRentMinimum && (
            <p className="text-xs text-amber-600">
              First deposit must be at least 0.001 SOL to initialize the
              treasury account.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            disabled={!isValid || loading}
            onClick={() => void handleDeposit()}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Depositing…
              </span>
            ) : (
              "Deposit"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
