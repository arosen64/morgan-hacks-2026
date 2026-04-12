import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { canonicalizeAndHash } from "../lib/contractHash";

interface ContractCreationPageProps {
  poolId: Id<"pools">;
  onSuccess: () => void;
  onBack: () => void;
}

export function ContractCreationPage({
  poolId,
  onSuccess,
  onBack,
}: ContractCreationPageProps) {
  const { publicKey } = useWallet();
  const commitContract = useMutation(api.contracts.commitContract);
  const generateContract = useAction(api.gemini.generateContract);
  const pool = useQuery(api.pools.getPool, { poolId });
  const members = useQuery(api.members.getMembers, { poolId });

  const [rulesDescription, setRulesDescription] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Call Gemini to generate a contract from the description
  async function handlePreview() {
    if (!pool || !members) return;
    setGenerating(true);
    setError(null);
    try {
      const contractMembers = members.map(
        (m): { name: string; wallet: string; role: "manager" | "member" } => ({
          name: m.name,
          wallet: m.wallet,
          role: m.role,
        }),
      );
      const contract = await generateContract({
        poolName: pool.name,
        rulesDescription,
        members: contractMembers,
      });
      setPreview(contract);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate contract.";
      setError(message);
    } finally {
      setGenerating(false);
    }
  }

  // Hash, sign (placeholder), and commit
  async function handleConfirm() {
    if (!preview || !publicKey) return;
    setSubmitting(true);
    setError(null);
    try {
      const hash = await canonicalizeAndHash(preview);
      const contractJson = JSON.stringify(preview);

      // TODO (issue #2): build and submit Anchor initialize_contract instruction here
      // For now, commit directly to Convex to unblock UI development
      await commitContract({
        poolId,
        hash,
        contractJson,
        prevHash: undefined,
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create contract.",
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
        <h2 className="text-xl font-bold">Create Governing Contract</h2>
      </div>

      {/* Rules input */}
      {!preview && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Describe your group's rules in plain language. Gemini will generate
            a contract from your description. Leave blank for a sensible
            default.
          </p>
          <textarea
            value={rulesDescription}
            onChange={(e) => setRulesDescription(e.target.value)}
            placeholder="e.g. All 3 members must approve any transaction over 0.5 SOL. Groceries and utilities are allowed. Amendments require unanimous approval."
            rows={5}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handlePreview}
            disabled={generating || !members || !pool}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="inline-block size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating with Gemini…
              </>
            ) : (
              "Preview Contract →"
            )}
          </button>
        </div>
      )}

      {/* Contract JSON preview */}
      {preview && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Contract Preview
              </h3>
              <button
                onClick={() => setPreview(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Edit
              </button>
            </div>
            <ContractFieldView contract={preview} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Signing & Submitting…" : "Confirm & Sign"}
          </button>
        </div>
      )}
    </div>
  );
}

// Field-by-field breakdown of the contract JSON
export function ContractFieldView({
  contract,
}: {
  contract: Record<string, unknown>;
}) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {Object.entries(contract).map(([key, value]) => (
        <div key={key} className="grid grid-cols-3 gap-2">
          <dt className="font-medium text-gray-500 capitalize">
            {key.replace(/_/g, " ")}
          </dt>
          <dd className="col-span-2 text-gray-800 break-all">
            {typeof value === "object" ? (
              <pre className="text-xs bg-white rounded p-1 overflow-auto max-h-24">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              String(value ?? "—")
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
