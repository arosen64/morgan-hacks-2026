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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  poolId: Id<"pools">;
  currentMemberId: Id<"members"> | null;
  onBack: () => void;
};

type ProposalDetail = NonNullable<
  ReturnType<typeof useQuery<typeof api.approvals.getProposalsWithDetails>>
>[number];

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
  const seedTestProposals = useMutation(api.seed.seedTestProposals);

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

  const pending = proposals?.filter((p) => p.status === "pending") ?? [];
  const past = proposals?.filter((p) => p.status !== "pending") ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header strip */}
      <div className="relative overflow-hidden bg-zinc-100 border-b border-zinc-200 px-8 pt-6 pb-10">
        <div className="relative max-w-3xl mx-auto flex flex-col gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-700 transition-colors self-start"
          >
            ← Back
          </button>

          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest">
                Pot Activity
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                All Transactions
              </h1>
            </div>

            {/* Summary pills */}
            {proposals != null && proposals.length > 0 && (
              <div className="flex gap-2 pb-1">
                <div className="flex flex-col items-center rounded-xl bg-white border border-zinc-200 px-4 py-2">
                  <span className="text-2xl font-bold text-zinc-900">
                    {pending.length}
                  </span>
                  <span className="text-xs text-zinc-400">Pending</span>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-white border border-zinc-200 px-4 py-2">
                  <span className="text-2xl font-bold text-zinc-900">
                    {past.length}
                  </span>
                  <span className="text-xs text-zinc-400">Resolved</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 pt-6 pb-16 max-w-3xl mx-auto flex flex-col gap-4">
        {proposals != null && proposals.length === 0 && (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={handleSeed}>
              Seed Test Data
            </Button>
          </div>
        )}

        {/* Loading state */}
        {proposals === undefined ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="pending" className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-violet-500" />
                  Pending
                  {pending.length > 0 && (
                    <span className="ml-1 rounded-full bg-violet-100 text-violet-700 px-1.5 py-0.5 text-xs font-semibold">
                      {pending.length}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-zinc-400" />
                  Past
                  {past.length > 0 && (
                    <span className="ml-1 rounded-full bg-zinc-100 text-zinc-600 px-1.5 py-0.5 text-xs font-semibold">
                      {past.length}
                    </span>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Pending tab */}
            <TabsContent value="pending" className="flex flex-col gap-3">
              {pending.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-3 text-center">
                  <div className="size-14 rounded-full bg-violet-100 flex items-center justify-center">
                    <div className="size-7 rounded-full border-2 border-violet-400" />
                  </div>
                  <p className="font-semibold text-lg">All caught up</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    No votes needed right now. New proposals will show up here.
                  </p>
                </div>
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
            </TabsContent>

            {/* Past tab */}
            <TabsContent value="past" className="flex flex-col gap-3">
              {past.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-3 text-center">
                  <div className="size-14 rounded-full bg-zinc-100 flex items-center justify-center">
                    <div className="size-7 rounded-full border-2 border-zinc-300" />
                  </div>
                  <p className="font-semibold text-lg">Nothing here yet</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Approved and rejected proposals will appear here.
                  </p>
                </div>
              ) : (
                past.map((proposal) => (
                  <PastCard key={proposal._id} proposal={proposal} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
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
  const total = proposal.tally.total || 1;
  const approvalPct = Math.round((proposal.tally.approvals / total) * 100);

  return (
    <Card className="overflow-hidden border-violet-100 shadow-sm hover:shadow-md hover:border-violet-300 transition-all">
      {/* Accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-purple-500" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="leading-snug">{proposal.description}</CardTitle>
          <Badge className="shrink-0 bg-violet-600 hover:bg-violet-600 text-white border-0">
            Needs Vote
          </Badge>
        </div>
        <CardDescription>
          {proposal.amount != null && (
            <span className="font-semibold text-violet-600 text-sm">
              {(proposal.amount / 1e9).toFixed(4)} SOL
            </span>
          )}
          {proposal.amount != null && " · "}
          Proposed by {proposal.proposerName}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Approval progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-violet-600">
                {proposal.tally.approvals}
              </span>{" "}
              approved ·{" "}
              <span className="font-semibold text-red-500">
                {proposal.tally.rejections}
              </span>{" "}
              rejected ·{" "}
              <span className="font-semibold text-zinc-400">
                {proposal.tally.pending}
              </span>{" "}
              pending
            </span>
            <span className="font-medium text-foreground">{approvalPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
              style={{ width: `${approvalPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {proposal.quorumDescription}
          </p>
        </div>

        {/* Vote actions */}
        {currentMemberId && (
          <div className="flex flex-wrap gap-2">
            {proposal.myVote === null ? (
              <>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm"
                  onClick={() => onVote(proposal._id, "approve")}
                >
                  ✓ Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="shadow-sm"
                  onClick={() => onVote(proposal._id, "reject")}
                >
                  ✗ Reject
                </Button>
              </>
            ) : (
              <Badge
                variant="outline"
                className={
                  proposal.myVote === "approve"
                    ? "bg-violet-50 text-violet-700 border-violet-300 px-3 py-1"
                    : "bg-red-50 text-red-700 border-red-300 px-3 py-1"
                }
              >
                {proposal.myVote === "approve" ? "✓" : "✗"} You voted{" "}
                {proposal.myVote === "approve" ? "Approved" : "Rejected"}
              </Badge>
            )}

            {proposal.proposerId === currentMemberId && (
              <Button
                size="sm"
                variant="outline"
                className="text-muted-foreground"
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
          className="text-xs text-muted-foreground hover:text-violet-600 self-start transition-colors"
        >
          {expanded ? "▲ Hide details" : "▼ View details"}
        </button>

        {expanded && (
          <div className="flex flex-col gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            {proposal.amount != null && (
              <DetailRow
                label="Amount"
                value={`${(proposal.amount / 1e9).toFixed(4)} SOL`}
              />
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
                <span className="font-semibold text-foreground">
                  Votes cast
                </span>
                {proposal.voterDetails.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={
                        v.vote === "approve"
                          ? "text-violet-600"
                          : "text-red-500"
                      }
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

// ── Past card ────────────────────────────────────────────────────────────────

function PastCard({ proposal }: { proposal: ProposalDetail }) {
  const [expanded, setExpanded] = useState(false);
  const approved = proposal.status === "approved";

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all">
      {/* Accent stripe */}
      <div
        className={`h-1 w-full ${
          approved
            ? "bg-gradient-to-r from-emerald-400 to-green-500"
            : "bg-gradient-to-r from-red-400 to-rose-500"
        }`}
      />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="leading-snug">{proposal.description}</CardTitle>
          <Badge
            variant="outline"
            className={
              approved
                ? "shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                : "shrink-0 bg-red-50 text-red-700 border-red-200 font-semibold"
            }
          >
            {approved ? "✓ Approved" : "✗ Rejected"}
          </Badge>
        </div>
        <CardDescription>
          {proposal.amount != null && (
            <span
              className={`font-semibold text-sm ${approved ? "text-emerald-600" : "text-red-500"}`}
            >
              {(proposal.amount / 1e9).toFixed(4)} SOL
            </span>
          )}
          {proposal.amount != null && " · "}
          Proposed by {proposal.proposerName}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            {proposal.tally.approvals} approved
          </span>
          <span className="flex items-center gap-1 text-red-500 font-medium">
            <span className="size-1.5 rounded-full bg-red-400" />
            {proposal.tally.rejections} rejected
          </span>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className={`text-xs self-start transition-colors text-muted-foreground ${
            approved ? "hover:text-emerald-600" : "hover:text-red-500"
          }`}
        >
          {expanded ? "▲ Hide details" : "▼ View details"}
        </button>

        {expanded && (
          <div className="flex flex-col gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            {proposal.amount != null && (
              <DetailRow
                label="Amount"
                value={`${(proposal.amount / 1e9).toFixed(4)} SOL`}
              />
            )}
            <DetailRow label="Type" value={proposal.type} />
            <DetailRow label="Approval rule" value={proposal.ruleLabel} />
            <DetailRow
              label="Final result"
              value={`${proposal.tally.approvals} approved · ${proposal.tally.rejections} rejected · ${proposal.tally.total} total`}
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
                <span className="font-semibold text-foreground">Votes</span>
                {proposal.voterDetails.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={
                        v.vote === "approve"
                          ? "text-emerald-600"
                          : "text-red-500"
                      }
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="font-semibold text-foreground w-28 shrink-0">
        {label}:
      </span>
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
