import { useState, useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { getTreasuryPda } from "../lib/treasury";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Loader2, CheckCircle, XCircle } from "lucide-react";

interface CreateProposalPageProps {
  poolId: Id<"pools">;
  currentMemberId: Id<"members">;
  onSuccess: () => void;
  onBack: () => void;
}

type ValidationResult = { pass: boolean; explanation: string };

function isValidPublicKey(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export function CreateProposalPage({
  poolId,
  currentMemberId,
  onSuccess,
  onBack,
}: CreateProposalPageProps) {
  const validateTransaction = useAction(api.gemini.validateTransaction);
  const createProposal = useMutation(api.approvals.createProposal);
  const pool = useQuery(api.pools.getPool, { poolId });
  const { connection } = useConnection();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amountSol, setAmountSol] = useState("");
  const [recipientWallet, setRecipientWallet] = useState("");
  const [url, setUrl] = useState("");

  const [treasuryBalanceSol, setTreasuryBalanceSol] = useState<number | null>(
    null,
  );
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = pool?.status === "active";
  const parsedAmount = parseFloat(amountSol);
  const amountLamports =
    !isNaN(parsedAmount) && parsedAmount > 0
      ? Math.round(parsedAmount * LAMPORTS_PER_SOL)
      : 0;

  const insufficientFunds =
    treasuryBalanceSol !== null &&
    amountLamports > 0 &&
    amountLamports > treasuryBalanceSol * LAMPORTS_PER_SOL;

  // Fetch treasury balance on mount
  useEffect(() => {
    let cancelled = false;
    getTreasuryPda(poolId)
      .then((pda) => connection.getBalance(pda))
      .then((lamports) => {
        if (!cancelled) setTreasuryBalanceSol(lamports / LAMPORTS_PER_SOL);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [connection, poolId]);

  const canValidate =
    isActive &&
    description.trim() &&
    category.trim() &&
    amountSol &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    recipientWallet.trim() &&
    isValidPublicKey(recipientWallet);

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
        category,
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
    if (!validation || amountLamports <= 0) return;

    // Soft balance guard — re-check before sending
    if (insufficientFunds) {
      setError(
        `Insufficient treasury funds (${treasuryBalanceSol?.toFixed(4) ?? "0"} SOL available).`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createProposal({
        poolId,
        proposerId: currentMemberId,
        type: "transaction",
        description,
        amount: amountLamports,
        geminiValidation: validation ?? undefined,
        recipientWallet,
        url: url.trim() || undefined,
      });

      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to submit proposal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 -ml-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold text-foreground">
          Request Transaction
        </h2>
      </div>

      {!isActive && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="px-4 py-3 text-sm text-amber-700">
            This pot has no active contract. A contract must be created before
            transactions can be proposed.
          </CardContent>
        </Card>
      )}

      {/* Treasury balance hint */}
      {treasuryBalanceSol !== null && (
        <p className="text-xs text-muted-foreground -mt-2">
          Treasury balance:{" "}
          <span className="font-medium">
            {treasuryBalanceSol.toFixed(4)} SOL
          </span>
        </p>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Monthly groceries run at Costco"
            className="focus-visible:ring-violet-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. groceries"
            className="focus-visible:ring-violet-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.001"
            value={amountSol}
            onChange={(e) => {
              setAmountSol(e.target.value);
              setValidation(null);
            }}
            placeholder="0.5"
            className="focus-visible:ring-violet-500"
          />
          {insufficientFunds && (
            <p className="text-xs text-destructive">
              Insufficient treasury funds (
              {treasuryBalanceSol?.toFixed(4) ?? "0"} SOL available).
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipient">Recipient wallet address</Label>
          <Input
            id="recipient"
            type="text"
            value={recipientWallet}
            onChange={(e) => setRecipientWallet(e.target.value)}
            placeholder="Solana public key (base58)"
            className="focus-visible:ring-violet-500"
          />
          {recipientWallet && !isValidPublicKey(recipientWallet) && (
            <p className="text-xs text-destructive">
              Invalid Solana public key.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="url">
            Link / note{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… or any note"
            className="focus-visible:ring-violet-500"
          />
        </div>

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
                  {validation.pass ? "Validation passed" : "Validation failed"}
                  {" — "}
                </span>
                <span
                  className={
                    validation.pass ? "text-violet-700" : "text-destructive/80"
                  }
                >
                  {validation.explanation}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {!validation ? (
          <Button
            onClick={handleValidate}
            disabled={!canValidate || validating || insufficientFunds}
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
            >
              Re-validate
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || insufficientFunds}
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
    </div>
  );
}
