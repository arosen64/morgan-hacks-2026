interface PoolStatusBannerProps {
  status: "pre-contract" | "active";
  isManager: boolean;
  onCreateContract?: () => void;
}

// 5.1 — Status badge shown in dashboard header
export function PoolStatusBadge({
  status,
}: {
  status: "pre-contract" | "active";
}) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      No Contract
    </span>
  );
}

// 5.2 + 5.3 — CTA for managers, waiting message for members
export function PoolStatusBanner({
  status,
  isManager,
  onCreateContract,
}: PoolStatusBannerProps) {
  if (status === "active") return null;

  if (isManager) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-800">
            No governing contract yet
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Transactions are blocked until a contract is created and approved.
          </p>
        </div>
        <button
          onClick={onCreateContract}
          className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
        >
          Create Contract
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-700">Waiting for contract</p>
      <p className="text-xs text-gray-500 mt-0.5">
        A manager needs to create the governing contract before transactions are
        available.
      </p>
    </div>
  );
}
