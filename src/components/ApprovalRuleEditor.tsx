import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type RuleType = "unanimous" | "k-of-n" | "named-set" | "role-based" | "tiered";

type ApprovalRule =
  | { type: "unanimous" }
  | { type: "k-of-n"; k: number; n: number }
  | { type: "named-set"; memberIds: string[] }
  | { type: "role-based"; role: string }
  | {
      type: "tiered";
      tiers: Array<{ maxAmount?: number; rule: ApprovalRule }>;
    };

type Props = {
  poolId: Id<"pools">;
  /** "transaction" edits the main approvalRule; "amendment" edits amendmentApprovalRule */
  target: "transaction" | "amendment";
  onSaved?: () => void;
};

export function ApprovalRuleEditor({ poolId, target, onSaved }: Props) {
  const pool = useQuery(api.pools.getPool, { poolId });
  const members = useQuery(api.members.getMembers, { poolId });

  const saveApprovalRule = useMutation(api.groups.saveApprovalRule);
  const saveAmendmentRule = useMutation(api.groups.saveAmendmentApprovalRule);

  const currentRule =
    target === "transaction"
      ? (pool?.approvalRule as ApprovalRule | undefined)
      : (pool?.amendmentApprovalRule as ApprovalRule | undefined);

  const [ruleType, setRuleType] = useState<RuleType>(
    currentRule?.type ?? "unanimous",
  );
  const [kValue, setKValue] = useState(
    currentRule?.type === "k-of-n" ? currentRule.k : 2,
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    currentRule?.type === "named-set" ? currentRule.memberIds : [],
  );
  const [roleName, setRoleName] = useState(
    currentRule?.type === "role-based" ? currentRule.role : "manager",
  );
  const [tiers, setTiers] = useState<
    Array<{ maxAmount?: number; rule: ApprovalRule }>
  >(
    currentRule?.type === "tiered"
      ? currentRule.tiers
      : [
          { maxAmount: 1_000_000_000, rule: { type: "k-of-n", k: 2, n: 3 } },
          { rule: { type: "unanimous" } },
        ],
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const activeMembers = members?.filter((m) => m.isActive !== false) ?? [];

  const namedSetWarning =
    ruleType === "named-set" &&
    selectedMemberIds.some((id) => !activeMembers.find((m) => m._id === id))
      ? "One or more selected members are not active in this pot."
      : null;

  function buildRule(): ApprovalRule {
    switch (ruleType) {
      case "unanimous":
        return { type: "unanimous" };
      case "k-of-n":
        return { type: "k-of-n", k: kValue, n: activeMembers.length };
      case "named-set":
        return { type: "named-set", memberIds: selectedMemberIds };
      case "role-based":
        return { type: "role-based", role: roleName };
      case "tiered":
        return { type: "tiered", tiers };
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const rule = buildRule();
      if (target === "transaction") {
        await saveApprovalRule({ poolId, rule });
      } else {
        await saveAmendmentRule({ poolId, rule });
      }
      onSaved?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  }

  function toggleMember(memberId: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  }

  function updateTierAmount(index: number, value: string) {
    setTiers((prev) =>
      prev.map((tier, i) =>
        i === index
          ? {
              ...tier,
              maxAmount: value === "" ? undefined : parseFloat(value) * 1e9,
            }
          : tier,
      ),
    );
  }

  if (!pool || !members) return <div>Loading...</div>;

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 8,
        maxWidth: 520,
      }}
    >
      <h3 style={{ margin: "0 0 12px" }}>
        {target === "transaction"
          ? "Transaction Approval Rule"
          : "Amendment Approval Rule"}
      </h3>

      {target === "amendment" && (
        <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>
          Defaults to unanimous if not set.
        </p>
      )}

      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Rule type</span>
        <select
          value={ruleType}
          onChange={(e) => setRuleType(e.target.value as RuleType)}
          style={{
            display: "block",
            marginTop: 4,
            width: "100%",
            padding: "6px 8px",
          }}
        >
          <option value="unanimous">Unanimous — everyone must approve</option>
          <option value="k-of-n">K-of-N — any k members</option>
          <option value="named-set">Named set — specific members</option>
          <option value="role-based">
            Role-based — all members with a role
          </option>
          <option value="tiered">Tiered — different rules by amount</option>
        </select>
      </label>

      {ruleType === "k-of-n" && (
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Approvals required (k of {activeMembers.length} members)
          </span>
          <input
            type="number"
            min={1}
            max={activeMembers.length}
            value={kValue}
            onChange={(e) => setKValue(parseInt(e.target.value, 10))}
            style={{
              display: "block",
              marginTop: 4,
              width: 80,
              padding: "6px 8px",
            }}
          />
        </label>
      )}

      {ruleType === "named-set" && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Select required approvers
          </span>
          {activeMembers.length === 0 && (
            <p style={{ fontSize: 13, color: "#888" }}>
              No members in this pot yet.
            </p>
          )}
          {activeMembers.map((m) => (
            <label
              key={m._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 6,
              }}
            >
              <input
                type="checkbox"
                checked={selectedMemberIds.includes(m._id)}
                onChange={() => toggleMember(m._id)}
              />
              <span style={{ fontSize: 14 }}>
                {m.name} <span style={{ color: "#888" }}>({m.role})</span>
              </span>
            </label>
          ))}
          {namedSetWarning && (
            <p
              style={{
                color: "#856404",
                background: "#fff3cd",
                padding: 8,
                borderRadius: 4,
                fontSize: 13,
              }}
            >
              ⚠ {namedSetWarning}
            </p>
          )}
        </div>
      )}

      {ruleType === "role-based" && (
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Role</span>
          <select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            style={{
              display: "block",
              marginTop: 4,
              width: "100%",
              padding: "6px 8px",
            }}
          >
            <option value="manager">manager</option>
            <option value="member">member</option>
          </select>
        </label>
      )}

      {ruleType === "tiered" && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Tiers (first matching tier applies)
          </span>
          {tiers.map((tier, i) => (
            <div
              key={i}
              style={{
                marginTop: 8,
                padding: 10,
                border: "1px solid #eee",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              {i < tiers.length - 1 ? (
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span>Max amount (SOL):</span>
                  <input
                    type="number"
                    min={0}
                    step={0.001}
                    value={
                      tier.maxAmount !== undefined ? tier.maxAmount / 1e9 : ""
                    }
                    onChange={(e) => updateTierAmount(i, e.target.value)}
                    style={{ width: 90, padding: "4px 6px" }}
                  />
                </label>
              ) : (
                <span style={{ color: "#888" }}>
                  Catch-all (any amount above)
                </span>
              )}
              <div style={{ marginTop: 4, color: "#555" }}>
                Rule: <strong>{(tier.rule as ApprovalRule).type}</strong>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 12, color: "#888", margin: "6px 0 0" }}>
            To customise nested tier rules, edit the contract JSON directly.
          </p>
        </div>
      )}

      {error && (
        <p
          style={{
            color: "#721c24",
            background: "#f8d7da",
            padding: 8,
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: "8px 20px",
          background: "#0d6efd",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: saving ? "not-allowed" : "pointer",
          fontWeight: 600,
        }}
      >
        {saving ? "Saving…" : "Save rule"}
      </button>
    </div>
  );
}
