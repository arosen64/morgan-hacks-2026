import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { getTreasuryPda } from "../lib/treasury";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { SolAmount } from "./SolAmount";
import { useSolPrice } from "@/hooks/useSolPrice";

interface RequestTransactionModalProps {
  poolId: Id<"pools">;
  currentMemberId: Id<"members">;
  treasuryBalanceSol: number | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ValidationResult = { pass: boolean; explanation: string };

// Simple Solana base58 public key format check (32 bytes encoded in base58 = 32-44 chars)
function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function RequestTransactionModal({
  poolId,
  currentMemberId,
  treasuryBalanceSol,
  open,
  onClose,
  onSuccess,
}: RequestTransactionModalProps) {
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const validateTransaction = useAction(api.gemini.validateTransaction);
  const createProposal = useMutation(api.approvals.createProposal);
  const pool = useQuery(api.pools.getPool, { poolId });

  const [description, setDescription] = useState("");
  const [amountSol, setAmountSol] = useState("");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [note, setNote] = useState("");

  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const solPriceUsd = useSolPrice();
  const isActive = pool?.status === "active";
  const parsedAmount = parseFloat(amountSol);
  const inputUsd =
    solPriceUsd !== null && !isNaN(parsedAmount) && parsedAmount > 0
      ? parsedAmount * solPriceUsd
      : null;
  const amountLamports = isNaN(parsedAmount)
    ? 0
    : Math.round(parsedAmount * 1e9);
  const exceedsBalance =
    treasuryBalanceSol !== null &&
    !isNaN(parsedAmount) &&
    parsedAmount > treasuryBalanceSol;

  const canValidate =
    isActive &&
    description.trim() !== "" &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    isValidPublicKey(recipientWallet) &&
    !exceedsBalance;

  function handleClose() {
    if (submitting) return;
    setDescription("");
    setAmountSol("");
    setRecipientWallet("");
    setNote("");
    setValidation(null);
    setError(null);
    setSuccess(false);
    onClose();
  }

  async function handleValidate() {
    if (!canValidate) return;
    setValidating(true);
    setError(null);
    setValidation(null);
    try {
      const result = await validateTransaction({
        poolId,
        amount: parsedAmount,
        description,
        category: description,
      });
      setValidation(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Validation failed. Please try again.",
      );
    } finally {
      setValidating(false);
    }
  }

  async function handleSubmit() {
    if (!anchorWallet) {
      setError("Wallet not connected.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Dynamically import anchor so it never runs at module init time
      const { Program, AnchorProvider, BN } = await import("@coral-xyz/anchor");
      const { default: idlJson } = await import("../idl/treasury.json");
      const { TREASURY_PROGRAM_ID } = await import("../lib/treasury");

      // Build and send Anchor create_proposal instruction
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const program = new Program(idlJson as any, provider);
      const treasuryPda = await getTreasuryPda(poolId);

      // Fetch the treasury account to read proposal_count, which is a seed
      // for the proposal PDA — Anchor cannot auto-resolve account-path seeds.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const treasuryAccount = await (program.account as any).treasury.fetch(
        treasuryPda,
      );
      const proposalCount: typeof BN.prototype = treasuryAccount.proposalCount;

      // Derive proposal PDA: seeds = ["proposal", treasury_pubkey, proposal_count (u64 LE)]
      const [proposalPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("proposal"),
          treasuryPda.toBuffer(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (proposalCount as any).toArrayLike(Buffer, "le", 8),
        ],
        TREASURY_PROGRAM_ID,
      );

      const recipientPubkey = new PublicKey(recipientWallet);
      const proposalType = {
        spending: {
          recipient: recipientPubkey,
          amountLamports: new BN(amountLamports),
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (program.methods as any)
        .createProposal(
          proposalType,
          description,
          description,
          note.trim() !== "",
        )
        .accounts({
          treasury: treasuryPda,
          proposal: proposalPda,
          proposer: anchorWallet.publicKey,
        })
        .rpc();

      // Record in Convex
      await createProposal({
        poolId,
        proposerId: currentMemberId,
        type: "transaction",
        description,
        amount: amountLamports,
        geminiValidation: validation ?? undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit proposal.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Transaction</DialogTitle>
          <DialogDescription>
            Propose a purchase from the pot treasury.
          </DialogDescription>
        </DialogHeader>

        {/* No active contract warning */}
        {pool !== undefined && !isActive && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="px-4 py-3 flex items-start gap-2 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              This pot has no active contract. A contract must be created before
              transactions can be proposed.
            </CardContent>
          </Card>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="w-10 h-10 text-violet-600" />
            <p className="font-semibold">Proposal submitted!</p>
            <p className="text-sm text-muted-foreground">
              Your transaction request is now in the pending queue.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rt-description">Item description</Label>
              <Input
                id="rt-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setValidation(null);
                }}
                placeholder="e.g. Monthly groceries run at Costco"
                disabled={!isActive}
                className="focus-visible:ring-violet-500"
              />
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rt-amount">Amount (SOL)</Label>
              <Input
                id="rt-amount"
                type="number"
                min="0"
                step="0.001"
                value={amountSol}
                onChange={(e) => {
                  setAmountSol(e.target.value);
                  setValidation(null);
                }}
                placeholder="0.5"
                disabled={!isActive}
                className="focus-visible:ring-violet-500"
              />
              {inputUsd !== null && (
                <p className="text-xs text-muted-foreground">
                  ≈ ${inputUsd.toFixed(2)}
                </p>
              )}
              {exceedsBalance && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Amount exceeds the treasury balance of{" "}
                  <SolAmount sol={treasuryBalanceSol!} />.
                </p>
              )}
            </div>

            {/* Recipient wallet */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rt-recipient">Recipient wallet address</Label>
              <Input
                id="rt-recipient"
                value={recipientWallet}
                onChange={(e) => {
                  setRecipientWallet(e.target.value);
                  setValidation(null);
                }}
                placeholder="Solana public key"
                disabled={!isActive}
                className="focus-visible:ring-violet-500 font-mono text-sm"
              />
              {recipientWallet && !isValidPublicKey(recipientWallet) && (
                <p className="text-xs text-destructive">
                  Not a valid Solana address.
                </p>
              )}
            </div>

            {/* Note / link (optional) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rt-note">
                Note / link{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="rt-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. https://receipt.com or additional context"
                disabled={!isActive}
                className="focus-visible:ring-violet-500"
              />
            </div>

            {/* Error */}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Gemini validation result */}
            {validation && (
              <Card
                className={
                  validation.pass
                    ? "border-violet-200 bg-violet-50"
                    : "border-destructive/30 bg-destructive/5"
                }
              >
                <CardContent className="px-4 py-3 flex items-start gap-2 text-sm">
                  {validation.pass ? (
                    <CheckCircle className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span
                      className={`font-semibold ${validation.pass ? "text-violet-800" : "text-destructive"}`}
                    >
                      {validation.pass
                        ? "Validation passed"
                        : "Contract violation"}{" "}
                      —{" "}
                    </span>
                    <span
                      className={
                        validation.pass
                          ? "text-violet-700"
                          : "text-destructive/80"
                      }
                    >
                      {validation.explanation}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            {!validation ? (
              <Button
                onClick={handleValidate}
                disabled={validating || !canValidate}
                className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating with Gemini…
                  </>
                ) : (
                  "Validate →"
                )}
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setValidation(null)}
                  className="flex-1 border-violet-200 text-violet-700 hover:bg-violet-50"
                  disabled={submitting}
                >
                  Re-validate
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting…
                    </>
                  ) : validation.pass ? (
                    "Submit Proposal"
                  ) : (
                    "Submit Anyway"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
