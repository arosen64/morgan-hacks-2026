import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { SolAmount } from "./SolAmount";
import logoPurple from "@/assets/logo_purple.png";
import { ContractCreationPage } from "./ContractCreationPage";
import { ContractHistoryPage } from "./ContractHistoryPage";
import { AllTransactionsPage } from "./AllTransactionsPage";
import { AmendContractPage } from "./AmendContractPage";
import { CreateProposalPage } from "./CreateProposalPage";
import { InviteMembersModal } from "./InviteMembersModal";
import { AddMoneyModal } from "./AddMoneyModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTreasuryPda } from "../lib/treasury";

type View =
  | "dashboard"
  | "create-contract"
  | "contract-history"
  | "all-transactions"
  | "amend-contract"
  | "create-proposal"
  | "add-money";

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
  const { connection } = useConnection();
  const [view, setView] = useState<View>("dashboard");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [treasuryBalanceSol, setTreasuryBalanceSol] = useState<number | null>(
    null,
  );
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  const pool = useQuery(api.pools.getPool, { poolId });
  const members = useQuery(api.members.getMembers, { poolId });

  const currentMember = members?.find((m) => m.wallet === walletAddress);
  const role = currentMember?.role ?? "member";

  // Only managers fetch pending requests
  const pendingMembers = useQuery(
    api.members.getPendingMembers,
    role === "manager" ? { poolId } : "skip",
  );

  const resolveJoinRequest = useMutation(api.members.resolveJoinRequest);

  const refreshTreasuryBalance = useCallback(() => {
    setBalanceRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTreasuryPda(poolId)
      .then((pda) => connection.getBalance(pda))
      .then((lamports) => {
        if (!cancelled) setTreasuryBalanceSol(lamports / LAMPORTS_PER_SOL);
      })
      .catch(() => {
        // treasury may not be initialized yet
      });
    return () => {
      cancelled = true;
    };
  }, [connection, poolId, balanceRefreshKey]);

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
        currentMemberId={currentMember?._id ?? null}
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

  if (view === "amend-contract" && currentMember) {
    return (
      <AmendContractPage
        poolId={poolId}
        currentMemberId={currentMember._id}
        onSuccess={() => setView("contract-history")}
        onBack={() => setView("dashboard")}
      />
    );
  }

  // Pending user guard — show waiting screen instead of dashboard
  if (members !== undefined && currentMember?.status === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle className="text-lg">Request Pending</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Your request to join <strong>{pool?.name ?? "this pot"}</strong>{" "}
              is awaiting manager approval.
            </p>
            <button
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to pots
            </button>
          </CardContent>
        </Card>
      </div>
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
      onClick: () => setView("add-money"),
    },
    {
      label: "Invite Members",
      onClick: () => setInviteOpen(true),
    },
  ];

  // ── Main dashboard ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav — identical to MainMenu */}
      <header className="border-b border-border px-8 py-4 flex items-center justify-between">
        <div>
          <img src={logoPurple} alt="Potlock" className="h-25 w-auto" />
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
                {pool?.name ?? "Pot"}
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

        {/* Pending Requests — manager only, hidden when empty */}
        {role === "manager" && pendingMembers && pendingMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {pendingMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{member.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {member.wallet.slice(0, 4)}…{member.wallet.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() =>
                        resolveJoinRequest({
                          poolId,
                          memberId: member._id,
                          action: "accept",
                          managerWallet: walletAddress,
                        })
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() =>
                        resolveJoinRequest({
                          poolId,
                          memberId: member._id,
                          action: "reject",
                          managerWallet: walletAddress,
                        })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Treasury Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Treasury Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tracking-tight">
              {treasuryBalanceSol === null ? (
                "—"
              ) : (
                <SolAmount sol={treasuryBalanceSol} />
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Live on-chain balance (devnet)
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
            ) : members.filter((m) => m.status !== "pending").length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No members yet.
              </p>
            ) : (
              members
                .filter((m) => m.status !== "pending")
                .map((member) => {
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
                          <SolAmount lamports={contributed ?? 0} />
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

      <InviteMembersModal
        poolId={poolId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />

      {/* Add Money overlay modal */}
      {view === "add-money" && (
        <AddMoneyModal
          poolId={poolId}
          walletAddress={walletAddress}
          onSuccess={() => {
            setView("dashboard");
            void refreshTreasuryBalance();
          }}
          onClose={() => setView("dashboard")}
        />
      )}
    </div>
  );
}
