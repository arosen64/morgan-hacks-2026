import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

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
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold">Request Transaction</h2>
      </div>

      {!isActive && (
        <p className="text-sm text-amber-600 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
          This pool has no active contract. A contract must be created before
          transactions can be proposed.
        </p>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Monthly groceries run at Costco"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. groceries"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Amount (SOL)
          </label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={amountSol}
            onChange={(e) => setAmountSol(e.target.value)}
            placeholder="0.5"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Gemini validation result */}
        {validation && (
          <div
            className={`rounded-md border px-3 py-2.5 text-sm ${
              validation.pass
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span className="font-semibold">
              {validation.pass ? "✓ Validation passed" : "✗ Validation failed"}
              {" — "}
            </span>
            {validation.explanation}
          </div>
        )}

        {/* Validate first, then allow submission */}
        {!validation ? (
          <button
            onClick={handleValidate}
            disabled={
              validating ||
              !description.trim() ||
              !category.trim() ||
              !amountSol ||
              !isActive
            }
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {validating ? (
              <>
                <span className="inline-block size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validating with Gemini…
              </>
            ) : (
              "Validate →"
            )}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setValidation(null)}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Re-validate
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting
                ? "Submitting…"
                : validation.pass
                  ? "Submit Proposal"
                  : "Submit Anyway"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
