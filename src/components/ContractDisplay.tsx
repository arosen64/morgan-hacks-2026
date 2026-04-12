import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ContractMember {
  name: string;
  wallet: string;
  role: "manager" | "member";
}

interface ApprovalRule {
  type: "unanimous" | "k-of-n" | string;
  k?: number;
  n?: number;
}

interface ApprovalRules {
  default?: ApprovalRule;
  amendment?: ApprovalRule;
  [key: string]: ApprovalRule | undefined;
}

interface BudgetLimits {
  per_transaction_max_sol?: number;
  [key: string]: unknown;
}

export interface ContractData {
  name?: string;
  version?: number;
  members?: ContractMember[];
  contribution_rules?: string;
  distribution_rules?: string;
  allowed_transaction_types?: string[];
  approval_rules?: ApprovalRules;
  budget_limits?: BudgetLimits;
  [key: string]: unknown;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {title}
      </p>
      {children}
    </div>
  );
}

function formatApprovalRule(rule: ApprovalRule | undefined): string {
  if (!rule) return "—";
  if (rule.type === "unanimous") return "Unanimous";
  if (rule.type === "k-of-n") {
    const k = rule.k ?? "?";
    const n = rule.n ?? "?";
    return `${k} of ${n}`;
  }
  return rule.type;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
}

export function ContractDisplay({ contract }: { contract: ContractData }) {
  const {
    members,
    contribution_rules,
    distribution_rules,
    allowed_transaction_types,
    approval_rules,
    budget_limits,
  } = contract;

  const sections: React.ReactNode[] = [];

  if (members && members.length > 0) {
    sections.push(
      <Section key="members" title="Members">
        <ul className="flex flex-col gap-1">
          {members.map((m, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-medium text-foreground truncate">
                  {m.name}
                </span>
                <Badge
                  variant={m.role === "manager" ? "default" : "secondary"}
                  className={
                    m.role === "manager"
                      ? "bg-violet-600 hover:bg-violet-600 text-[10px] px-1.5 py-0 h-4 shrink-0"
                      : "text-[10px] px-1.5 py-0 h-4 shrink-0"
                  }
                >
                  {m.role === "manager" ? "Manager" : "Member"}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {truncateWallet(m.wallet)}
              </span>
            </li>
          ))}
        </ul>
      </Section>,
    );
  }

  if (contribution_rules) {
    sections.push(
      <Section key="contribution" title="Contribution Rules">
        <p className="text-sm text-foreground">{contribution_rules}</p>
      </Section>,
    );
  }

  if (distribution_rules) {
    sections.push(
      <Section key="distribution" title="Distribution Rules">
        <p className="text-sm text-foreground">{distribution_rules}</p>
      </Section>,
    );
  }

  if (allowed_transaction_types && allowed_transaction_types.length > 0) {
    sections.push(
      <Section key="types" title="Allowed Transaction Types">
        <div className="flex flex-wrap gap-1.5">
          {allowed_transaction_types.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {capitalize(type)}
            </Badge>
          ))}
        </div>
      </Section>,
    );
  }

  if (approval_rules) {
    sections.push(
      <Section key="approval" title="Approval Rules">
        <dl className="flex flex-col gap-1 text-sm">
          {Object.entries(approval_rules).map(([key, rule]) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">
                {capitalize(key)} Approval
              </dt>
              <dd className="font-medium text-foreground">
                {formatApprovalRule(rule)}
              </dd>
            </div>
          ))}
        </dl>
      </Section>,
    );
  }

  if (budget_limits && budget_limits.per_transaction_max_sol != null) {
    sections.push(
      <Section key="budget" title="Budget Limits">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Max per Transaction</span>
          <span className="font-medium text-foreground">
            {budget_limits.per_transaction_max_sol} SOL
          </span>
        </div>
      </Section>,
    );
  }

  return (
    <div className="flex flex-col">
      {sections.map((section, i) => (
        <div key={i}>
          <div className="py-2.5 px-1">{section}</div>
          {i < sections.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  );
}
