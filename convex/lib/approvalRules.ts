import { Id } from "../_generated/dataModel";

export type ApprovalRule =
  | { type: "unanimous" }
  | { type: "k-of-n"; k: number; n: number }
  | { type: "named-set"; memberIds: string[] }
  | { type: "role-based"; role: string }
  | { type: "tiered"; tiers: Array<{ maxAmount?: number; rule: ApprovalRule }> };

export type MemberSnapshot = {
  id: Id<"members">;
  role: string;
  isActive: boolean;
};

export type VoteRecord = {
  memberId: Id<"members">;
  vote: "approve" | "reject";
};

/**
 * Resolve the applicable rule for a given amount.
 * For non-tiered rules, returns the rule as-is.
 * For tiered rules, returns the nested rule for the first matching tier.
 */
export function resolveRule(
  rule: ApprovalRule,
  amountLamports: number | undefined,
): ApprovalRule {
  if (rule.type !== "tiered") return rule;

  for (const tier of rule.tiers) {
    if (tier.maxAmount === undefined || (amountLamports ?? 0) <= tier.maxAmount) {
      return resolveRule(tier.rule as ApprovalRule, amountLamports);
    }
  }
  // If no tier matched (shouldn't happen with a proper catch-all), fall back to unanimous
  return { type: "unanimous" };
}

/**
 * Returns true if the votes satisfy the given rule.
 * Members must be active to have their votes counted.
 */
export function evaluateApprovalRule(
  rule: ApprovalRule,
  votes: VoteRecord[],
  members: MemberSnapshot[],
  amountLamports?: number,
): boolean {
  const resolved = resolveRule(rule, amountLamports);
  const approvals = new Set(
    votes.filter((v) => v.vote === "approve").map((v) => v.memberId),
  );
  const activeMembers = members.filter((m) => m.isActive);

  switch (resolved.type) {
    case "unanimous":
      return activeMembers.every((m) => approvals.has(m.id));

    case "k-of-n":
      return approvals.size >= resolved.k;

    case "named-set":
      return resolved.memberIds.every((id) => approvals.has(id as Id<"members">));

    case "role-based": {
      const roleMembers = activeMembers.filter((m) => m.role === resolved.role);
      return roleMembers.length > 0 && roleMembers.every((m) => approvals.has(m.id));
    }

    default:
      return false;
  }
}

/**
 * Returns true if quorum can still theoretically be reached —
 * i.e., the proposal should NOT yet be marked rejected.
 */
export function canStillReachQuorum(
  rule: ApprovalRule,
  votes: VoteRecord[],
  members: MemberSnapshot[],
  amountLamports?: number,
): boolean {
  const resolved = resolveRule(rule, amountLamports);
  const rejections = new Set(
    votes.filter((v) => v.vote === "reject").map((v) => v.memberId),
  );
  const approvals = new Set(
    votes.filter((v) => v.vote === "approve").map((v) => v.memberId),
  );
  const activeMembers = members.filter((m) => m.isActive);
  const voted = new Set(votes.map((v) => v.memberId));
  const pendingMembers = activeMembers.filter((m) => !voted.has(m.id));

  switch (resolved.type) {
    case "unanimous":
      // Any rejection kills unanimous
      return rejections.size === 0;

    case "k-of-n": {
      const potentialApprovals = approvals.size + pendingMembers.length;
      return potentialApprovals >= resolved.k;
    }

    case "named-set": {
      // Quorum is impossible if any named member has rejected
      const namedSet = new Set(resolved.memberIds as Id<"members">[]);
      const anyNamedRejected = [...rejections].some((id) => namedSet.has(id));
      return !anyNamedRejected;
    }

    case "role-based": {
      const roleMembers = activeMembers.filter((m) => m.role === resolved.role);
      // Any rejection from a role member kills this rule
      const anyRoleRejected = roleMembers.some((m) => rejections.has(m.id));
      return !anyRoleRejected;
    }

    default:
      return false;
  }
}

/**
 * Returns the effective amendment rule for a group.
 * Defaults to unanimous if no override is set.
 */
export function effectiveAmendmentRule(
  amendmentApprovalRule: ApprovalRule | undefined,
): ApprovalRule {
  return amendmentApprovalRule ?? { type: "unanimous" };
}
