import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface InviteMembersModalProps {
  poolId: Id<"pools">;
  poolName: string;
  open: boolean;
  onClose: () => void;
}

export function InviteMembersModal({
  poolId,
  poolName,
  open,
  onClose,
}: InviteMembersModalProps) {
  const [confirmation, setConfirmation] = useState<string | null>(null);

  if (!open) return null;

  const inviteLink = `${window.location.origin}${window.location.pathname}?pool=${poolId}`;

  function showConfirmation(message: string) {
    setConfirmation(message);
    setTimeout(() => setConfirmation(null), 2000);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    showConfirmation("Link copied!");
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: `Join ${poolName} on Potlock`,
        text: `You've been invited to join ${poolName}. Use this link to sign up and join the pool:`,
        url: inviteLink,
      });
      showConfirmation("Shared!");
    } else {
      await navigator.clipboard.writeText(inviteLink);
      showConfirmation("Link copied!");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Invite Members</h2>
            <p className="text-sm text-muted-foreground">
              Share this link to invite someone to join{" "}
              <span className="font-medium text-foreground">{poolName}</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors ml-4 mt-0.5 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Invite link display */}
        <div className="rounded-lg border border-border bg-muted px-3 py-2.5">
          <p className="text-xs font-mono text-muted-foreground break-all">
            {inviteLink}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            Copy Link
          </Button>
          <Button
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleShare}
          >
            Share
          </Button>
        </div>

        {/* Confirmation message */}
        {confirmation && (
          <p className="text-center text-sm font-medium text-violet-600">
            {confirmation}
          </p>
        )}
      </div>
    </div>
  );
}
