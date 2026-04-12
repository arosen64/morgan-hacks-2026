import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  poolId: Id<"pools">;
  currentMemberId: Id<"members"> | null;
  onBack: () => void;
};

export function AllTransactionsPage({
  poolId,
  currentMemberId,
  onBack,
}: Props) {
  const proposals = useQuery(api.approvals.getProposalsWithDetails, {
    poolId,
    currentMemberId: currentMemberId ?? undefined,
  });

  const castVote = useMutation(api.approvals.castVote);
  const cancelProposal = useMutation(api.approvals.cancelProposal);

  if (!proposals) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onBack={onBack} />
        <p className="text-sm text-muted-foreground">Loading transactions…</p>
      </div>
    );
  }

  const pending = proposals.filter((p) => p.status === "pending");
  const past = proposals.filter((p) => p.status !== "pending");

  async function handleVote(
    proposalId: Id<"proposals">,
    vote: "approve" | "reject",
  ) {
    if (!currentMemberId) return;
    await castVote({ proposalId, memberId: currentMemberId, vote });
  }

  async function handleCancel(proposalId: Id<"proposals">) {
    if (!currentMemberId) return;
    await cancelProposal({ proposalId, memberId: currentMemberId });
  }

  return (
    <div className="flex flex-col gap-6">
      <BackButton onBack={onBack} />

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* ── Pending ── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Pending Proposals</h2>
          <Separator />
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending proposals.
            </p>
          ) : (
            pending.map((proposal) => (
              <Card key={proposal._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="leading-snug">
                      {proposal.description}
                    </CardTitle>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <CardDescription>
                    {proposal.amount != null
                      ? `${(proposal.amount / 1e9).toFixed(4)} SOL · `
                      : ""}
                    Proposed by {proposal.proposerName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">
                      ✓ {proposal.tally.approvals} yes
                    </span>
                    <span className="text-red-600 font-medium">
                      ✗ {proposal.tally.rejections} no
                    </span>
                    <span className="text-muted-foreground">
                      ⏳ {proposal.tally.pending} pending
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {proposal.quorumDescription}
                  </p>

                  {currentMemberId && (
                    <div className="flex flex-wrap gap-2">
                      {proposal.myVote === null ? (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleVote(proposal._id, "approve")}
                          >
                            Vote Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleVote(proposal._id, "reject")}
                          >
                            Vote No
                          </Button>
                        </>
                      ) : (
                        <Badge
                          variant={
                            proposal.myVote === "approve"
                              ? "default"
                              : "destructive"
                          }
                        >
                          You voted{" "}
                          {proposal.myVote === "approve" ? "Yes" : "No"}
                        </Badge>
                      )}

                      {proposal.proposerId === currentMemberId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(proposal._id)}
                        >
                          Cancel Proposal
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </section>

        {/* ── Past ── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Past Transactions</h2>
          <Separator />
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No past transactions yet.
            </p>
          ) : (
            past.map((proposal) => (
              <Card key={proposal._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="leading-snug">
                      {proposal.description}
                    </CardTitle>
                    <Badge
                      variant={
                        proposal.status === "approved"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {proposal.status === "approved" ? "Approved" : "Rejected"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {proposal.amount != null
                      ? `${(proposal.amount / 1e9).toFixed(4)} SOL · `
                      : ""}
                    Proposed by {proposal.proposerName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>✓ {proposal.tally.approvals} approved</span>
                    <span>✗ {proposal.tally.rejections} rejected</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onBack} className="self-start">
      ← Back to Dashboard
    </Button>
  );
}
