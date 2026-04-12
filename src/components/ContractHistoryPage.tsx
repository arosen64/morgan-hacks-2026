import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Clock, Hash } from "lucide-react";
import { ContractDisplay } from "./ContractDisplay";

interface ContractHistoryPageProps {
  poolId: Id<"pools">;
  activeHash: string | undefined;
  currentMemberId: Id<"members"> | null;
  onBack: () => void;
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function ContractHistoryPage({
  poolId,
  activeHash,
  currentMemberId,
  onBack,
}: ContractHistoryPageProps) {
  const versions = useQuery(api.contracts.getContractVersions, { poolId });
  const pendingAmendments = useQuery(api.approvals.getProposalsWithDetails, {
    poolId,
    currentMemberId: currentMemberId ?? undefined,
  });
  const castVote = useMutation(api.approvals.castVote);

  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(
    null,
  );
  const [voting, setVoting] = useState<string | null>(null);

  const pendingAmendmentProposals = (pendingAmendments ?? []).filter(
    (p) => p.type === "amendment" && p.status === "pending",
  );

  async function handleVote(
    proposalId: Id<"proposals">,
    vote: "approve" | "reject",
  ) {
    if (!currentMemberId) return;
    setVoting(proposalId);
    try {
      await castVote({ proposalId, memberId: currentMemberId, vote });
    } finally {
      setVoting(null);
    }
  }

  if (versions === undefined || pendingAmendments === undefined) {
    return (
      <p className="text-sm text-muted-foreground p-6">Loading history…</p>
    );
  }

  if (versions.length === 0 && pendingAmendmentProposals.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 self-start -ml-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <p className="text-sm text-muted-foreground">
          No contract versions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 -ml-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold text-foreground">Contract History</h2>
      </div>

      <div className="flex flex-col gap-3">
        {/* Pending amendment proposals — shown at the top */}
        {pendingAmendmentProposals.map((proposal) => {
          const isExpanded = expandedProposalId === proposal._id;
          const myVote = proposal.myVote;
          const isVoting = voting === proposal._id;
          const proposedContract: Record<string, unknown> | null =
            proposal.contractJson
              ? (() => {
                  try {
                    return JSON.parse(proposal.contractJson) as Record<
                      string,
                      unknown
                    >;
                  } catch {
                    return null;
                  }
                })()
              : null;

          return (
            <Card key={proposal._id} className="border-amber-300 bg-amber-50">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-amber-500 hover:bg-amber-500 text-xs text-white">
                      Pending Vote
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      Proposed by {proposal.proposerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(proposal.proposedAt).toLocaleDateString()}
                    </span>
                    {proposedContract && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-0 px-1 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                        onClick={() =>
                          setExpandedProposalId(
                            isExpanded ? null : proposal._id,
                          )
                        }
                      >
                        {isExpanded ? "Collapse" : "Preview"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {proposal.description && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    "{proposal.description}"
                  </p>
                )}

                {/* Vote tally */}
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="text-green-700 font-medium">
                    ✓ {proposal.tally.approvals} approved
                  </span>
                  <span className="text-red-600 font-medium">
                    ✗ {proposal.tally.rejections} rejected
                  </span>
                  <span className="text-muted-foreground">
                    ⏳ {proposal.tally.pending} pending
                  </span>
                  <span className="text-muted-foreground">
                    ({proposal.quorumDescription})
                  </span>
                </div>

                {/* Who voted */}
                {proposal.voterDetails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {proposal.voterDetails.map((v, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          v.vote === "approve"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {v.memberName} {v.vote === "approve" ? "✓" : "✗"}
                      </span>
                    ))}
                  </div>
                )}

                {/* Voting buttons */}
                {currentMemberId && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                      disabled={myVote !== null || isVoting}
                      onClick={() => void handleVote(proposal._id, "approve")}
                    >
                      {myVote === "approve" ? "✓ Approved" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                      disabled={myVote !== null || isVoting}
                      onClick={() => void handleVote(proposal._id, "reject")}
                    >
                      {myVote === "reject" ? "✗ Rejected" : "Reject"}
                    </Button>
                  </div>
                )}
              </CardHeader>

              {isExpanded && proposedContract && (
                <>
                  <Separator />
                  <CardContent className="px-4 py-3">
                    <p className="text-xs font-medium text-amber-700 mb-2">
                      Proposed contract changes
                    </p>
                    <ContractDisplay contract={proposedContract} />
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}

        {/* Committed contract versions */}
        {[...versions].reverse().map((v) => {
          const isActive = v.hash === activeHash;
          const isExpanded = expandedHash === v.hash;

          return (
            <Card
              key={v.hash}
              className={isActive ? "border-violet-300 bg-violet-50" : ""}
            >
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      v{v.versionNumber}
                    </span>
                    {isActive && (
                      <Badge className="bg-violet-600 hover:bg-violet-600 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Hash className="w-3 h-3" />
                      {truncateHash(v.hash)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-0 px-1 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                      onClick={() =>
                        setExpandedHash(isExpanded ? null : v.hash)
                      }
                    >
                      {isExpanded ? "Collapse" : "View"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <>
                  <Separator />
                  <CardContent className="px-4 py-3">
                    {!isActive && (
                      <p className="text-xs text-amber-600 mb-3 font-medium">
                        Historical version — not the active contract
                      </p>
                    )}
                    <ContractDisplay
                      contract={
                        JSON.parse(v.contractJson) as Record<string, unknown>
                      }
                    />
                  </CardContent>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
