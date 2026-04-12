import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Props = {
  proposalId: Id<"proposals">;
  currentMemberId: Id<"members">;
};

export function ProposalVoting({ proposalId, currentMemberId }: Props) {
  const data = useQuery(api.approvals.getProposalVotes, { proposalId });
  const castVote = useMutation(api.approvals.castVote);

  if (!data) return <div>Loading...</div>;

  const { proposal, tally, votes, quorumDescription } = data;
  const myVote =
    votes.find((v) => v.memberId === currentMemberId)?.vote ?? null;
  const isPending = proposal.status === "pending";

  async function handleVote(vote: "approve" | "reject") {
    await castVote({ proposalId, memberId: currentMemberId, vote });
  }

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        maxWidth: 480,
      }}
    >
      <h3 style={{ margin: "0 0 4px" }}>{proposal.description}</h3>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#666" }}>
        {proposal.type === "transaction" && proposal.amount != null
          ? `${(proposal.amount / 1e9).toFixed(4)} SOL · `
          : ""}
        {proposal.type}
      </p>

      {proposal.status !== "pending" ? (
        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 99,
            fontWeight: 600,
            fontSize: 14,
            background: proposal.status === "approved" ? "#d4edda" : "#f8d7da",
            color: proposal.status === "approved" ? "#155724" : "#721c24",
            marginBottom: 12,
          }}
        >
          {proposal.status === "approved" ? "Approved" : "Rejected"}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 24, marginBottom: 8, fontSize: 14 }}>
        <span style={{ color: "#28a745" }}>✓ {tally.approvals} approved</span>
        <span style={{ color: "#dc3545" }}>✗ {tally.rejections} rejected</span>
        <span style={{ color: "#6c757d" }}>⏳ {tally.pending} pending</span>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#555" }}>
        {quorumDescription}
      </p>

      {isPending && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => handleVote("approve")}
            disabled={myVote !== null}
            style={{
              padding: "8px 20px",
              background: myVote === "approve" ? "#28a745" : "#fff",
              color: myVote === "approve" ? "#fff" : "#28a745",
              border: "1px solid #28a745",
              borderRadius: 6,
              cursor: myVote !== null ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {myVote === "approve" ? "Approved" : "Approve"}
          </button>
          <button
            onClick={() => handleVote("reject")}
            disabled={myVote !== null}
            style={{
              padding: "8px 20px",
              background: myVote === "reject" ? "#dc3545" : "#fff",
              color: myVote === "reject" ? "#fff" : "#dc3545",
              border: "1px solid #dc3545",
              borderRadius: 6,
              cursor: myVote !== null ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {myVote === "reject" ? "Rejected" : "Reject"}
          </button>
        </div>
      )}
    </div>
  );
}
