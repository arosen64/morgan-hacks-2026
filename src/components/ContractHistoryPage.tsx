import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface ContractHistoryPageProps {
  poolId: Id<"pools">;
  activeHash: string | undefined;
  onBack: () => void;
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

// 5.1 — List all versions; 5.2 — highlight active; 5.3 — expand to view full JSON
export function ContractHistoryPage({
  poolId,
  activeHash,
  onBack,
}: ContractHistoryPageProps) {
  const versions = useQuery(api.contracts.getContractVersions, { poolId });
  const [expandedHash, setExpandedHash] = useState<string | null>(null);

  if (versions === undefined) {
    return <p className="text-sm text-gray-400">Loading history…</p>;
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 self-start"
        >
          ← Back
        </button>
        <p className="text-sm text-gray-500">No contract versions yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold">Contract History</h2>
      </div>

      <ul className="flex flex-col gap-2">
        {[...versions].reverse().map((v) => {
          const isActive = v.hash === activeHash;
          const isExpanded = expandedHash === v.hash;

          return (
            <li
              key={v.hash}
              className={`rounded-lg border p-4 flex flex-col gap-2 ${
                isActive ? "border-green-300 bg-green-50" : "border-gray-100"
              }`}
            >
              {/* 5.1 — Version header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">
                    v{v.versionNumber}
                  </span>
                  {/* 5.2 — Active badge */}
                  {isActive && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="font-mono">{truncateHash(v.hash)}</span>
                  <span>{new Date(v.createdAt).toLocaleDateString()}</span>
                  {/* 5.3 — Toggle full JSON */}
                  <button
                    onClick={() => setExpandedHash(isExpanded ? null : v.hash)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {isExpanded ? "Collapse" : "View"}
                  </button>
                </div>
              </div>

              {/* 5.3 — Full contract JSON field-by-field */}
              {isExpanded && (
                <div className="mt-2 rounded-md border border-gray-200 bg-white p-3">
                  {!isActive && (
                    <p className="text-xs text-amber-600 mb-2 font-medium">
                      Historical version — not the active contract
                    </p>
                  )}
                  <ContractFieldView contract={JSON.parse(v.contractJson)} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ContractFieldView({
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
              <pre className="text-xs bg-gray-50 rounded p-1 overflow-auto max-h-24">
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
