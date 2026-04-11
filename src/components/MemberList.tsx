import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface MemberListProps {
  poolId: Id<"pools">;
}

function truncateWallet(wallet: string) {
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

const ROLE_STYLES: Record<string, string> = {
  manager: "bg-purple-100 text-purple-700",
  member: "bg-gray-100 text-gray-600",
};

// 4.1 + 4.2 + 4.3 — Member list wired to getMembers query; founder shown even when alone
export function MemberList({ poolId }: MemberListProps) {
  const members = useQuery(api.members.getMembers, { poolId });

  if (members === undefined) {
    return <p className="text-sm text-gray-400">Loading members…</p>;
  }

  if (members.length === 0) {
    return <p className="text-sm text-gray-400">No members yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {members.map((m) => (
        <li
          key={m._id}
          className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
        >
          <span className="font-medium text-gray-800">{m.name}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono">
              {truncateWallet(m.wallet)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[m.role] ?? ROLE_STYLES.member}`}
            >
              {m.role}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
