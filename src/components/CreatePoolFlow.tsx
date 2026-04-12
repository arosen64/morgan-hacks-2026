import { useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { canonicalizeAndHash } from "../lib/contractHash";
import { Button } from "@/components/ui/button";

interface CreatePoolFlowProps {
  founderWallet: string;
  onSuccess: (poolId: Id<"pools">) => void;
  onCancel: () => void;
}

type Step = "pool-details" | "contract-builder";

type HistoryEntry =
  | { role: "user"; text: string }
  | { role: "ai"; contract: Record<string, unknown> };

export function CreatePoolFlow({
  founderWallet,
  onSuccess,
  onCancel,
}: CreatePoolFlowProps) {
  const [step, setStep] = useState<Step>("pool-details");
  const [poolName, setPoolName] = useState("");
  const [founderName, setFounderName] = useState("");

  if (step === "pool-details") {
    return (
      <PoolDetailsStep
        poolName={poolName}
        founderName={founderName}
        onPoolNameChange={setPoolName}
        onFounderNameChange={setFounderName}
        onNext={() => setStep("contract-builder")}
        onCancel={onCancel}
      />
    );
  }

  return (
    <ContractBuilderStep
      poolName={poolName}
      founderName={founderName}
      founderWallet={founderWallet}
      onSuccess={onSuccess}
      onBack={() => setStep("pool-details")}
    />
  );
}

// ── Step 1: Pool Details (no DB writes) ──────────────────────────────────────

function PoolDetailsStep({
  poolName,
  founderName,
  onPoolNameChange,
  onFounderNameChange,
  onNext,
  onCancel,
}: {
  poolName: string;
  founderName: string;
  onPoolNameChange: (v: string) => void;
  onFounderNameChange: (v: string) => void;
  onNext: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 max-w-md w-full">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create a Pot</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Name your group treasury and tell us who you are.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Pot Name</label>
          <input
            type="text"
            value={poolName}
            onChange={(e) => onPoolNameChange(e.target.value)}
            placeholder="e.g. The House Fund"
            className="rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Your Name</label>
          <input
            type="text"
            value={founderName}
            onChange={(e) => onFounderNameChange(e.target.value)}
            placeholder="e.g. Alice"
            className="rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && poolName.trim() && founderName.trim())
                onNext();
            }}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            disabled={!poolName.trim() || !founderName.trim()}
            onClick={onNext}
          >
            Next: Define Contract →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Iterative Contract Builder (no DB writes until Confirm) ───────────

function ContractBuilderStep({
  poolName,
  founderName,
  founderWallet,
  onSuccess,
  onBack,
}: {
  poolName: string;
  founderName: string;
  founderWallet: string;
  onSuccess: (poolId: Id<"pools">) => void;
  onBack: () => void;
}) {
  const generateContract = useAction(api.gemini.generateContract);
  const refineContract = useAction(api.gemini.refineContract);
  const createPoolWithContract = useMutation(api.pools.createPoolWithContract);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentContract, setCurrentContract] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);

    setHistory((h) => [...h, { role: "user", text }]);
    setLoading(true);

    try {
      let contract: Record<string, unknown>;

      if (!currentContract) {
        // First message — generate from scratch
        contract = await generateContract({
          poolName,
          rulesDescription: text,
          members: [{ name: founderName, wallet: "TBD", role: "manager" }],
        });
      } else {
        // Subsequent messages — refine in-memory draft
        contract = await refineContract({
          currentContractJson: JSON.stringify(currentContract),
          modification: text,
        });
      }

      setCurrentContract(contract);
      setHistory((h) => [...h, { role: "ai", contract }]);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gemini failed. Please try again.",
      );
      setHistory((h) => h.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  // Pool + contract created atomically only when user confirms
  async function handleConfirm() {
    if (!currentContract) return;
    setConfirming(true);
    setError(null);
    try {
      const hash = await canonicalizeAndHash(currentContract);
      const poolId = await createPoolWithContract({
        name: poolName,
        founderName,
        founderWallet,
        contractJson: JSON.stringify(currentContract),
        contractHash: hash,
      });

      onSuccess(poolId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create pot. Please try again.",
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Define Contract — {poolName}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Describe your rules. Keep refining until it looks right, then
            confirm.
          </p>
        </div>
        {currentContract && (
          <Button
            className="bg-green-600 hover:bg-green-700 text-white shrink-0 ml-4"
            disabled={confirming}
            onClick={handleConfirm}
          >
            {confirming ? "Creating pot…" : "Confirm & Create Pot ✓"}
          </Button>
        )}
      </div>

      {/* Conversation history */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-muted-foreground px-8">
            <div className="size-12 rounded-full bg-violet-50 flex items-center justify-center">
              <div className="size-6 rounded-full border-2 border-violet-300" />
            </div>
            <p className="font-medium text-foreground">
              Describe your group's rules
            </p>
            <p className="text-sm max-w-sm">
              e.g. "3 members, all must approve transactions over 0.5 SOL.
              Groceries and utilities allowed. Monthly contribution of 0.1 SOL."
            </p>
          </div>
        )}

        {history.map((entry, i) => {
          if (entry.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-lg">
                  {entry.text}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-xl w-full">
                <p className="text-xs font-semibold text-violet-600 mb-2">
                  Gemini · Contract Draft
                </p>
                <ContractSummary contract={entry.contract} />
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-block size-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                Gemini is generating…
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="pt-4 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            currentContract
              ? "Ask Gemini to change something…"
              : "Describe your group's rules…"
          }
          disabled={loading || confirming}
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading || confirming}
          className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
        >
          {currentContract ? "Refine" : "Generate"}
        </Button>
      </div>

      <button
        onClick={onBack}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground text-center"
      >
        ← Back to pot details
      </button>
    </div>
  );
}

// ── Contract summary card ─────────────────────────────────────────────────────

function ContractSummary({ contract }: { contract: Record<string, unknown> }) {
  const fields: { label: string; key: string }[] = [
    { label: "Name", key: "name" },
    { label: "Contribution rules", key: "contribution_rules" },
    { label: "Distribution rules", key: "distribution_rules" },
    { label: "Allowed types", key: "allowed_transaction_types" },
    { label: "Approval rules", key: "approval_rules" },
    { label: "Budget limits", key: "budget_limits" },
  ];

  return (
    <dl className="flex flex-col gap-1.5">
      {fields.map(({ label, key }) => {
        const value = contract[key];
        if (value === undefined || value === null) return null;
        return (
          <div key={key} className="grid grid-cols-5 gap-2 text-xs">
            <dt className="col-span-2 font-medium text-muted-foreground">
              {label}
            </dt>
            <dd className="col-span-3 text-foreground break-all">
              {typeof value === "object" && !Array.isArray(value) ? (
                <pre className="bg-background rounded p-1 overflow-auto max-h-16 text-xs">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : Array.isArray(value) ? (
                (value as string[]).join(", ")
              ) : (
                String(value)
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
