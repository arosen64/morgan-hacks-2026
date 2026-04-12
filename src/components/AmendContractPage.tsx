import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { canonicalizeAndHash } from "../lib/contractHash";
import { ContractFieldView } from "./ContractCreationPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Loader2 } from "lucide-react";

interface AmendContractPageProps {
  poolId: Id<"pools">;
  onSuccess: () => void;
  onBack: () => void;
}

export function AmendContractPage({
  poolId,
  onSuccess,
  onBack,
}: AmendContractPageProps) {
  const generateAmendment = useAction(api.gemini.generateAmendment);
  const commitContract = useMutation(api.contracts.commitContract);

  const pool = useQuery(api.pools.getPool, { poolId });
  const contractVersions = useQuery(api.contracts.getContractVersions, {
    poolId,
  });

  const [amendmentDescription, setAmendmentDescription] = useState("");
  const [preview, setPreview] = useState<{
    contract: Record<string, unknown>;
    prevHash: string;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeContractJson = pool?.activeContractHash
    ? contractVersions?.find((cv) => cv.hash === pool.activeContractHash)
        ?.contractJson
    : null;

  const activeContract: Record<string, unknown> | null = (() => {
    if (!activeContractJson) return null;
    try {
      return JSON.parse(activeContractJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();

  async function handlePreview() {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateAmendment({
        poolId,
        amendmentDescription,
      });
      setPreview(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate amendment.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setSubmitting(true);
    setError(null);
    try {
      const hash = await canonicalizeAndHash(preview.contract);
      const contractJson = JSON.stringify(preview.contract);

      await commitContract({
        poolId,
        hash,
        contractJson,
        prevHash: preview.prevHash,
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to commit amendment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
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
        <h2 className="text-xl font-bold text-foreground">Amend Contract</h2>
      </div>

      {/* Current contract (read-only) */}
      {activeContract && !preview && (
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Current Contract
              </CardTitle>
              <Badge className="bg-violet-600 hover:bg-violet-600 text-xs">
                v{activeContract.version as number}
              </Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="px-4 py-3 max-h-56 overflow-auto">
            <ContractFieldView contract={activeContract} />
          </CardContent>
        </Card>
      )}

      {/* Amendment input */}
      {!preview && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Describe your proposed change in plain language. Gemini will produce
            an updated contract for review.
          </p>
          <Textarea
            value={amendmentDescription}
            onChange={(e) => setAmendmentDescription(e.target.value)}
            placeholder="e.g. Increase the per-transaction limit to 3 SOL and add 'equipment' as an allowed transaction type."
            rows={4}
            className="resize-none focus-visible:ring-violet-500"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={handlePreview}
            disabled={
              generating || !amendmentDescription.trim() || !activeContract
            }
            className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating with Gemini…
              </>
            ) : (
              "Preview Amendment →"
            )}
          </Button>
        </div>
      )}

      {/* Amended contract preview */}
      {preview && (
        <div className="flex flex-col gap-4">
          <Card className="border-violet-300 bg-violet-50">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium text-violet-700 uppercase tracking-wide">
                    Amended Contract Preview
                  </CardTitle>
                  <Badge className="bg-violet-600 hover:bg-violet-600 text-xs">
                    v{preview.contract.version as number}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-0 px-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setPreview(null)}
                >
                  Edit
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="px-4 py-3">
              <ContractFieldView contract={preview.contract} />
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting…
              </>
            ) : (
              "Confirm Amendment"
            )}
          </Button>
        </div>
      )}

      {!activeContract && contractVersions !== undefined && (
        <p className="text-sm text-amber-600">
          No active contract found for this pool.
        </p>
      )}
    </div>
  );
}
