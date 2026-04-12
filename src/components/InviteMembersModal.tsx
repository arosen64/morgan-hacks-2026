import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteMembersModalProps {
  poolId: Id<"pools">;
  open: boolean;
  onClose: () => void;
}

export function InviteMembersModal({
  poolId,
  open,
  onClose,
}: InviteMembersModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(poolId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Share this pool ID with anyone you want to invite. They can enter it
            in the "Join Pool" flow.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 mt-2">
          <Input
            readOnly
            value={poolId}
            className="font-mono text-sm"
            onFocus={(e) => e.target.select()}
          />
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 w-20"
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
