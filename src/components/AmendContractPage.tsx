import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { canonicalizeAndHash } from "../lib/contractHash";
import { ContractFieldView } from "./ContractCreationPage";

interface AmendContractPageProps {
  poolId: Id<"pools">;
  onSuccess: () => void;
  onBack: () => void;
}

export function AmendContractPage({
  poolId,
  onSuccess,
  onBack,
}: AmendContractPageProps) {
  const generateAmendment = useAction(api.gemini.generateAmendment);
  const commitContract = useMutation(api.contracts.commitContract);

  const pool = useQuery(api.pools.getPool, { poolId });
  const contractVersions = useQuery(api.contracts.getContractVersions, {
    poolId,
  });

  const [amendmentDescription, setAmendmentDescription] = useState("");
  const [preview, setPreview] = useState<{
    contract: Record<string, unknown>;
    prevHash: string;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The active contract is the last version in the sorted list
  const activeContractJson = pool?.activeContractHash
    ? contractVersions?.find((cv) => cv.hash === pool.activeContractHash)
        ?.contractJson
    : null;

  const activeContract: Record<string, unknown> | null = (() => {
    if (!activeContractJson) return null;
    try {
      return JSON.parse(activeContractJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();

  async function handlePreview() {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateAmendment({
        poolId,
        amendmentDescription,
      });
      setPreview(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate amendment.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setSubmitting(true);
    setError(null);
    try {
      const hash = await canonicalizeAndHash(preview.contract);
      const contractJson = JSON.stringify(preview.contract);

      await commitContract({
        poolId,
        hash,
        contractJson,
        prevHash: preview.prevHash,
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to commit amendment.",
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
        <h2 className="text-xl font-bold">Amend Contract</h2>
      </div>

      {/* Current contract (read-only) */}
      {activeContract && !preview && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Current Contract (v{activeContract.version as number})
          </h3>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 max-h-56 overflow-auto">
            <ContractFieldView contract={activeContract} />
          </div>
        </div>
      )}

      {/* Amendment input */}
      {!preview && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Describe your proposed change in plain language. Gemini will produce
            an updated contract for review.
          </p>
          <textarea
            value={amendmentDescription}
            onChange={(e) => setAmendmentDescription(e.target.value)}
            placeholder="e.g. Increase the per-transaction limit to 3 SOL and add 'equipment' as an allowed transaction type."
            rows={4}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handlePreview}
            disabled={
              generating || !amendmentDescription.trim() || !activeContract
            }
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="inline-block size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating with Gemini…
              </>
            ) : (
              "Preview Amendment →"
            )}
          </button>
        </div>
      )}

      {/* Amended contract preview */}
      {preview && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-700">
                Amended Contract Preview (v
                {preview.contract.version as number})
              </h3>
              <button
                onClick={() => setPreview(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Edit
              </button>
            </div>
            <ContractFieldView contract={preview.contract} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Confirm Amendment"}
          </button>
        </div>
      )}

      {!activeContract && contractVersions !== undefined && (
        <p className="text-sm text-amber-600">
          No active contract found for this pool.
        </p>
      )}
    </div>
  );
}
