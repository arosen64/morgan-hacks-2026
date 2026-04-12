import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Clock, Hash } from "lucide-react";

interface ContractHistoryPageProps {
  poolId: Id<"pools">;
  activeHash: string | undefined;
  onBack: () => void;
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function ContractHistoryPage({
  poolId,
  activeHash,
  onBack,
}: ContractHistoryPageProps) {
  const versions = useQuery(api.contracts.getContractVersions, { poolId });
  const [expandedHash, setExpandedHash] = useState<string | null>(null);

  if (versions === undefined) {
    return (
      <p className="text-sm text-muted-foreground p-6">Loading history…</p>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-6">
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
    <div className="flex flex-col gap-4 p-6">
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
                    <ContractFieldView contract={JSON.parse(v.contractJson)} />
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

function ContractFieldView({
  contract,
}: {
  contract: Record<string, unknown>;
}) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {Object.entries(contract).map(([key, value]) => (
        <div key={key} className="grid grid-cols-3 gap-2">
          <dt className="font-medium text-muted-foreground capitalize">
            {key.replace(/_/g, " ")}
          </dt>
          <dd className="col-span-2 text-foreground break-all">
            {typeof value === "object" ? (
              <pre className="text-xs bg-muted rounded p-1 overflow-auto max-h-24">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              String(value ?? "—")
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
