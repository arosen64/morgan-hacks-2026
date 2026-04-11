import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { JoinPoolForm } from "./components/JoinPoolForm";
import { MemberList } from "./components/MemberList";
import {
  PoolStatusBadge,
  PoolStatusBanner,
} from "./components/PoolStatusBanner";
import { ContractCreationPage } from "./components/ContractCreationPage";
import { ContractHistoryPage } from "./components/ContractHistoryPage";

type View = "dashboard" | "join" | "create-contract" | "contract-history";

export default function App() {
  const { publicKey, connected } = useWallet();
  const createPool = useMutation(api.pools.createPool);

  const [poolId, setPoolId] = useState<Id<"pools"> | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [founderName, setFounderName] = useState("");
  const [poolName, setPoolName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pool = useQuery(api.pools.getPool, poolId ? { poolId } : "skip");
  const members = useQuery(
    api.members.getMembers,
    poolId ? { poolId } : "skip",
  );

  const walletAddress = publicKey?.toBase58();
  const currentMember = members?.find((m) => m.wallet === walletAddress);
  const isManager = currentMember?.role === "manager";
  const poolStatus = pool?.status ?? "pre-contract";

  async function handleCreatePool(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey) return;
    setCreating(true);
    setError(null);
    try {
      const id = await createPool({
        name: poolName.trim(),
        founderName: founderName.trim(),
        founderWallet: publicKey.toBase58(),
      });
      setPoolId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pool.");
    } finally {
      setCreating(false);
    }
  }

  // No pool yet — show create form
  if (!poolId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <h1 className="text-2xl font-bold">Create a Pool</h1>
          {!connected ? (
            <div className="flex flex-col gap-3">
              <p className="text-gray-500 text-sm">
                Connect your wallet to get started.
              </p>
              <WalletMultiButton />
            </div>
          ) : (
            <form onSubmit={handleCreatePool} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Pool name (e.g. The House Fund)"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                required
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Your name"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                required
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Pool"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Sub-pages
  if (view === "create-contract") {
    return (
      <div className="min-h-screen p-8 max-w-lg mx-auto">
        <ContractCreationPage
          poolId={poolId}
          onSuccess={() => setView("dashboard")}
          onBack={() => setView("dashboard")}
        />
      </div>
    );
  }

  if (view === "contract-history") {
    return (
      <div className="min-h-screen p-8 max-w-lg mx-auto">
        <ContractHistoryPage
          poolId={poolId}
          activeHash={pool?.activeContractHash}
          onBack={() => setView("dashboard")}
        />
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen p-8 max-w-lg mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {pool?.name ?? "Pool Dashboard"}
          </h1>
          <PoolStatusBadge status={poolStatus} />
        </div>
        <button
          onClick={() => setView(view === "join" ? "dashboard" : "join")}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {view === "join" ? "← Back" : "+ Add Member"}
        </button>
      </div>

      {/* 6.1 — Pre-contract banner with wired Create Contract CTA */}
      <PoolStatusBanner
        status={poolStatus}
        isManager={isManager}
        onCreateContract={() => setView("create-contract")}
      />

      {view === "join" ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Join Pool</h2>
          <JoinPoolForm
            poolId={poolId}
            onSuccess={() => setView("dashboard")}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 6.2 — Active contract summary */}
          {poolStatus === "active" && pool?.activeContractHash && (
            <ActiveContractSummary
              activeHash={pool.activeContractHash}
              onViewHistory={() => setView("contract-history")}
            />
          )}

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Members</h2>
            <MemberList poolId={poolId} />
          </div>
        </div>
      )}
    </div>
  );
}

// 6.2 — Active contract summary panel on dashboard
function ActiveContractSummary({
  activeHash,
  onViewHistory,
}: {
  activeHash: string;
  onViewHistory: () => void;
}) {
  const contract = useQuery(api.contracts.getContractByHash, {
    hash: activeHash,
  });
  if (!contract) return null;

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(contract.contractJson);
  } catch {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Governing Contract</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            v{contract.versionNumber}
          </span>
          <button
            onClick={onViewHistory}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            {/* 5.4 — View History link */}
            View History →
          </button>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <ContractSummaryField
          label="Allowed types"
          value={
            Array.isArray(parsed.allowed_transaction_types)
              ? (parsed.allowed_transaction_types as string[]).join(", ")
              : "—"
          }
        />
        <ContractSummaryField
          label="Budget limit"
          value={
            parsed.budget_limits
              ? `${(parsed.budget_limits as Record<string, number>).per_transaction_max_sol} SOL`
              : "—"
          }
        />
        <ContractSummaryField
          label="Approval rules"
          value={
            parsed.approval_rules
              ? JSON.stringify(
                  (parsed.approval_rules as Record<string, unknown>).default,
                )
              : "—"
          }
        />
        <ContractSummaryField
          label="Amendment rules"
          value={
            parsed.approval_rules
              ? JSON.stringify(
                  (parsed.approval_rules as Record<string, unknown>).amendment,
                )
              : "—"
          }
        />
      </dl>
    </div>
  );
}

function ContractSummaryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-800 break-words">{value}</dd>
    </div>
  );
}
