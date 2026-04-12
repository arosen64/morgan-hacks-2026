import { useState } from "react";
import { useQuery } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { JoinPoolForm } from "./JoinPoolForm";
import { MemberList } from "./MemberList";
import { PoolStatusBadge, PoolStatusBanner } from "./PoolStatusBanner";
import { ContractCreationPage } from "./ContractCreationPage";
import { ContractHistoryPage } from "./ContractHistoryPage";
import { AllTransactionsPage } from "./AllTransactionsPage";
import { Button } from "@/components/ui/button";

type View =
  | "dashboard"
  | "join"
  | "create-contract"
  | "contract-history"
  | "all-transactions";

interface PoolDashboardProps {
  poolId: Id<"pools">;
  walletAddress: string;
  onBack: () => void;
}

export function PoolDashboard({
  poolId,
  walletAddress,
  onBack,
}: PoolDashboardProps) {
  const { disconnect } = useWallet();
  const [view, setView] = useState<View>("dashboard");

  const pool = useQuery(api.pools.getPool, { poolId });
  const members = useQuery(api.members.getMembers, { poolId });

  const currentMember = members?.find((m) => m.wallet === walletAddress);
  const isManager = currentMember?.role === "manager";
  const poolStatus = pool?.status ?? "pre-contract";

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

  if (view === "all-transactions") {
    return (
      <div className="min-h-screen p-8 max-w-4xl mx-auto">
        <AllTransactionsPage
          poolId={poolId}
          currentMemberId={currentMember?._id ?? null}
          onBack={() => setView("dashboard")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-lg mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">
            {pool?.name ?? "Pool Dashboard"}
          </h1>
          <PoolStatusBadge status={poolStatus} />
        </div>
        <div className="flex gap-2">
          {poolStatus === "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("all-transactions")}
            >
              All Transactions
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "join" ? "dashboard" : "join")}
          >
            {view === "join" ? "← Back" : "+ Add Member"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </div>
      </div>

      {/* Pre-contract banner */}
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
          {/* Active contract summary */}
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
