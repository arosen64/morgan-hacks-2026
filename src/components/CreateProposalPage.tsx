import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
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

export function CreateProposalPage({
  poolId,
  currentMemberId,
  onSuccess,
  onBack,
}: CreateProposalPageProps) {
  const validateTransaction = useAction(api.gemini.validateTransaction);
  const createProposal = useMutation(api.approvals.createProposal);
  const pool = useQuery(api.pools.getPool, { poolId });

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amountSol, setAmountSol] = useState("");

  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = pool?.status === "active";

  async function handleValidate() {
    const amount = parseFloat(amountSol);
    if (
      !description.trim() ||
      !category.trim() ||
      isNaN(amount) ||
      amount <= 0
    ) {
      setError("Please fill in all fields with valid values.");
      return;
    }
    setValidating(true);
    setError(null);
    setValidation(null);
    try {
      const result = await validateTransaction({
        poolId,
        amount,
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
    const amount = parseFloat(amountSol);
    if (!description.trim() || isNaN(amount) || amount <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await createProposal({
        poolId,
        proposerId: currentMemberId,
        type: "transaction",
        description,
        amount: Math.round(amount * 1e9), // convert SOL to lamports
        geminiValidation: validation ?? undefined,
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit proposal.",
      );
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
            onChange={(e) => setAmountSol(e.target.value)}
            placeholder="0.5"
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

        {/* Validate first, then allow submission */}
        {!validation ? (
          <Button
            onClick={handleValidate}
            disabled={
              validating ||
              !description.trim() ||
              !category.trim() ||
              !amountSol ||
              !isActive
            }
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
    </div>
  );
}
