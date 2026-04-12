import { useState } from "react";
import { useQuery } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ContractCreationPage } from "./ContractCreationPage";
import { ContractHistoryPage } from "./ContractHistoryPage";
import { AllTransactionsPage } from "./AllTransactionsPage";
import { AmendContractPage } from "./AmendContractPage";
import { CreateProposalPage } from "./CreateProposalPage";
import { InviteMembersModal } from "./InviteMembersModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type View =
  | "dashboard"
  | "create-contract"
  | "contract-history"
  | "all-transactions"
  | "amend-contract"
  | "create-proposal";

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
  const [inviteOpen, setInviteOpen] = useState(false);

  const pool = useQuery(api.pools.getPool, { poolId });
  const members = useQuery(api.members.getMembers, { poolId });

  const currentMember = members?.find((m) => m.wallet === walletAddress);
  const role = currentMember?.role ?? "member";

  // ── Sub-pages ──────────────────────────────────────────────────────────────

  if (view === "create-contract") {
    return (
      <ContractCreationPage
        poolId={poolId}
        onSuccess={() => setView("dashboard")}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (view === "contract-history") {
    return (
      <ContractHistoryPage
        poolId={poolId}
        activeHash={pool?.activeContractHash}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (view === "all-transactions") {
    return (
      <AllTransactionsPage
        poolId={poolId}
        currentMemberId={currentMember?._id ?? null}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (view === "amend-contract") {
    return (
      <AmendContractPage
        poolId={poolId}
        onSuccess={() => setView("dashboard")}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (view === "create-proposal" && currentMember) {
    return (
      <CreateProposalPage
        poolId={poolId}
        currentMemberId={currentMember._id}
        onSuccess={() => setView("all-transactions")}
        onBack={() => setView("dashboard")}
      />
    );
  }

  // ── Action button definitions ──────────────────────────────────────────────

  const actions: { label: string; onClick: () => void }[] = [
    {
      label: "Request Transaction",
      onClick: () => setView("create-proposal"),
    },
    {
      label: "Contract",
      onClick: () =>
        pool?.status === "pre-contract"
          ? setView("create-contract")
          : setView("contract-history"),
    },
    {
      label: "All Transactions",
      onClick: () => setView("all-transactions"),
    },
    {
      label: "Amend Contract",
      onClick: () => setView("amend-contract"),
    },
    {
      label: "Add Money",
      onClick: () => {}, // issue #28
    },
    {
      label: "Invite Members",
      onClick: () => setInviteOpen(true),
    },
  ];

  // ── Main dashboard ─────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Top nav — identical to MainMenu */}
        <header className="border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-violet-500" />
            <span className="text-lg font-semibold tracking-tight">
              Potlock
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => disconnect()}>
            Disconnect
          </Button>
        </header>

        <div className="max-w-xl mx-auto px-8 py-8 flex flex-col gap-6">
          {/* Back + pool name + role */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              {pool === undefined ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                <h1 className="text-3xl font-bold tracking-tight">
                  {pool?.name ?? "Pool"}
                </h1>
              )}
              <Badge
                className={
                  role === "manager" ? "bg-violet-600 hover:bg-violet-600" : ""
                }
                variant={role === "manager" ? "default" : "secondary"}
              >
                {role === "manager" ? "Manager" : "Member"}
              </Badge>
            </div>
          </div>

          {/* Treasury Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Treasury Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold tracking-tight">—</p>
              <p className="text-xs text-muted-foreground mt-1">
                Live balance available once Add Money is set up.
              </p>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Members
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {members === undefined ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No members yet.
                </p>
              ) : (
                members.map((member) => {
                  // contributedLamports is in the schema but Convex types regenerate on next `convex dev`
                  const contributed = (
                    member as typeof member & { contributedLamports?: number }
                  ).contributedLamports;
                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {member.name}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {member.wallet.slice(0, 4)}…{member.wallet.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {contributed
                            ? `${(contributed / 1e9).toFixed(4)} SOL`
                            : "0 SOL"}
                        </span>
                        <Badge
                          variant={
                            member.role === "manager" ? "default" : "secondary"
                          }
                          className={
                            member.role === "manager"
                              ? "bg-violet-600 hover:bg-violet-600 text-xs"
                              : "text-xs"
                          }
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {actions.map(({ label, onClick }) => (
                  <Button
                    key={label}
                    variant="outline"
                    className="h-12 text-sm font-medium"
                    onClick={onClick}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {inviteOpen && (
        <InviteMembersModal
          poolId={poolId}
          poolName={pool?.name ?? ""}
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </>
  );
}
