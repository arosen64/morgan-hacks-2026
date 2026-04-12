import { useState } from "react";
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

type ProposalDetail = NonNullable<
  ReturnType<typeof useQuery<typeof api.approvals.getProposalsWithDetails>>
>[number];

export function AllTransactionsPage({ poolId, currentMemberId, onBack }: Props) {
  const proposals = useQuery(api.approvals.getProposalsWithDetails, {
    poolId,
    currentMemberId: currentMemberId ?? undefined,
  });

  const castVote = useMutation(api.approvals.castVote);
  const cancelProposal = useMutation(api.approvals.cancelProposal);
  const seedTestProposals = useMutation(api.seed.seedTestProposals);

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

  async function handleSeed() {
    await seedTestProposals({ poolId });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton onBack={onBack} />
        {proposals.length === 0 && (
          <Button size="sm" variant="outline" onClick={handleSeed}>
            Seed Test Data
          </Button>
        )}
      </div>

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
              <PendingCard
                key={proposal._id}
                proposal={proposal}
                currentMemberId={currentMemberId}
                onVote={handleVote}
                onCancel={handleCancel}
              />
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
              <PastCard key={proposal._id} proposal={proposal} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

// ── Pending card ─────────────────────────────────────────────────────────────

function PendingCard({
  proposal,
  currentMemberId,
  onVote,
  onCancel,
}: {
  proposal: ProposalDetail;
  currentMemberId: Id<"members"> | null;
  onVote: (id: Id<"proposals">, vote: "approve" | "reject") => Promise<void>;
  onCancel: (id: Id<"proposals">) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-neutral-200 bg-neutral-50">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="leading-snug text-neutral-800">
            {proposal.description}
          </CardTitle>
          <Badge variant="outline" className="shrink-0 text-neutral-500 border-neutral-300">
            Pending
          </Badge>
        </div>
        <CardDescription className="text-neutral-500">
          {proposal.amount != null
            ? `${(proposal.amount / 1e9).toFixed(4)} SOL · `
            : ""}
          Proposed by {proposal.proposerName}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Tally */}
        <div className="flex gap-3 text-sm font-medium">
          <span className="text-green-600">✓ {proposal.tally.approvals} approved</span>
          <span className="text-red-500">✗ {proposal.tally.rejections} rejected</span>
          <span className="text-neutral-400">⏳ {proposal.tally.pending} pending</span>
        </div>
        <p className="text-xs text-neutral-500">{proposal.quorumDescription}</p>

        {/* Vote actions */}
        {currentMemberId && (
          <div className="flex flex-wrap gap-2 pt-1">
            {proposal.myVote === null ? (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white border-0"
                  onClick={() => onVote(proposal._id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white border-0"
                  onClick={() => onVote(proposal._id, "reject")}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Badge
                className={
                  proposal.myVote === "approve"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-red-100 text-red-600 border-red-200"
                }
                variant="outline"
              >
                You voted {proposal.myVote === "approve" ? "Approved" : "Rejected"}
              </Badge>
            )}

            {proposal.proposerId === currentMemberId && (
              <Button
                size="sm"
                variant="outline"
                className="text-neutral-500"
                onClick={() => onCancel(proposal._id)}
              >
                Cancel
              </Button>
            )}
          </div>
        )}

        {/* Expand / collapse */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-neutral-400 hover:text-neutral-600 self-start pt-1"
        >
          {expanded ? "▲ Hide details" : "▼ View details"}
        </button>

        {expanded && (
          <div className="flex flex-col gap-2 border-t border-neutral-200 pt-3 text-xs text-neutral-600">
            {proposal.amount != null && (
              <DetailRow label="Amount" value={`${(proposal.amount / 1e9).toFixed(4)} SOL`} />
            )}
            <DetailRow label="Type" value={proposal.type} />
            <DetailRow label="Approval rule" value={proposal.ruleLabel} />
            <DetailRow
              label="Progress"
              value={`${proposal.tally.approvals} of ${proposal.tally.total} members have approved`}
            />
            <DetailRow label="Proposed" value={fmtDate(proposal.proposedAt)} />
            {proposal.voterDetails.length > 0 && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="font-semibold text-neutral-500">Votes cast</span>
                {proposal.voterDetails.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={v.vote === "approve" ? "text-green-600" : "text-red-500"}>
                      {v.vote === "approve" ? "✓" : "✗"}
                    </span>
                    <span>{v.memberName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Past card ────────────────────────────────────────────────────────────────

function PastCard({ proposal }: { proposal: ProposalDetail }) {
  const [expanded, setExpanded] = useState(false);
  const approved = proposal.status === "approved";

  return (
    <Card
      className={
        approved
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className={`leading-snug ${approved ? "text-green-900" : "text-red-900"}`}
          >
            {proposal.description}
          </CardTitle>
          <Badge
            variant="outline"
            className={
              approved
                ? "shrink-0 bg-green-100 text-green-700 border-green-300"
                : "shrink-0 bg-red-100 text-red-600 border-red-300"
            }
          >
            {approved ? "Approved" : "Rejected"}
          </Badge>
        </div>
        <CardDescription
          className={approved ? "text-green-700" : "text-red-700"}
        >
          {proposal.amount != null
            ? `${(proposal.amount / 1e9).toFixed(4)} SOL · `
            : ""}
          Proposed by {proposal.proposerName}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <div className="flex gap-4 text-sm font-medium">
          <span className="text-green-600">✓ {proposal.tally.approvals} approved</span>
          <span className="text-red-500">✗ {proposal.tally.rejections} rejected</span>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className={`text-xs self-start pt-1 ${
            approved
              ? "text-green-500 hover:text-green-700"
              : "text-red-400 hover:text-red-600"
          }`}
        >
          {expanded ? "▲ Hide details" : "▼ View details"}
        </button>

        {expanded && (
          <div
            className={`flex flex-col gap-2 border-t pt-3 text-xs ${
              approved
                ? "border-green-200 text-green-800"
                : "border-red-200 text-red-800"
            }`}
          >
            {proposal.amount != null && (
              <DetailRow label="Amount" value={`${(proposal.amount / 1e9).toFixed(4)} SOL`} />
            )}
            <DetailRow label="Type" value={proposal.type} />
            <DetailRow label="Approval rule" value={proposal.ruleLabel} />
            <DetailRow
              label="Final result"
              value={`${proposal.tally.approvals} approved · ${proposal.tally.rejections} rejected · ${proposal.tally.total} total members`}
            />
            <DetailRow label="Proposed" value={fmtDate(proposal.proposedAt)} />
            {proposal.resolvedAt && (
              <DetailRow
                label={approved ? "Approved" : "Rejected"}
                value={fmtDate(proposal.resolvedAt)}
              />
            )}
            {proposal.voterDetails.length > 0 && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="font-semibold">Votes</span>
                {proposal.voterDetails.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={v.vote === "approve" ? "text-green-600" : "text-red-500"}
                    >
                      {v.vote === "approve" ? "✓" : "✗"}
                    </span>
                    <span>{v.memberName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onBack} className="self-start">
      ← Back to Dashboard
    </Button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="font-semibold w-28 shrink-0">{label}:</span>
      <span className="capitalize">{value}</span>
    </div>
  );
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
