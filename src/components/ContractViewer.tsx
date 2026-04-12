import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, PenLine, Hash, Clock } from "lucide-react";

interface ContractVersionDoc {
  _id: string;
  poolId: string;
  version: number;
  versionHash: string;
  prevVersionHash: string | null;
  nextVersionHash: string | null;
  content: object;
  createdAt: number;
}

function VersionView({
  doc,
  poolId,
  onNavigate,
}: {
  doc: ContractVersionDoc;
  poolId: string;
  onNavigate: (hash: string) => void;
}) {
  const [, navigate] = useLocation();
  const isActive = doc.nextVersionHash === null;

  const editor = useEditor({
    extensions: [StarterKit],
    content: doc.content,
    editable: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none p-6 text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-sm",
      },
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Contract</h1>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? "bg-violet-600 hover:bg-violet-600" : ""}
            >
              {isActive ? "Active" : `v${doc.version}`}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Pool: {poolId}</p>
        </div>
        {isActive && (
          <Button
            variant="outline"
            onClick={() => navigate(`/pool/${poolId}/contract/edit`)}
            className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
          >
            <PenLine className="w-4 h-4" />
            Amend
          </Button>
        )}
      </div>

      <Card className="mb-4">
        <CardHeader className="py-3 px-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              Version {doc.version}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1.5 font-mono text-xs">
              {doc.versionHash.slice(0, 12)}...
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(doc.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <EditorContent editor={editor} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={!doc.prevVersionHash}
          onClick={() => doc.prevVersionHash && onNavigate(doc.prevVersionHash)}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous version
        </Button>

        <span className="text-sm text-muted-foreground">
          Version {doc.version}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={!doc.nextVersionHash}
          onClick={() => doc.nextVersionHash && onNavigate(doc.nextVersionHash)}
          className="gap-2"
        >
          Next version
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function VersionByHash({
  hash,
  poolId,
  onNavigate,
}: {
  hash: string;
  poolId: string;
  onNavigate: (hash: string) => void;
}) {
  const doc = useQuery(api.contractVersions.getContractVersionByHash, {
    versionHash: hash,
  });
  if (doc === undefined) return <LoadingState />;
  if (doc === null)
    return <p className="text-muted-foreground p-6">Version not found.</p>;
  return (
    <VersionView
      doc={doc as ContractVersionDoc}
      poolId={poolId}
      onNavigate={onNavigate}
    />
  );
}

function LoadingState() {
  return <p className="text-muted-foreground p-6">Loading contract...</p>;
}

export function ContractViewer({ poolId }: { poolId: string }) {
  const activeVersion = useQuery(
    api.contractVersions.getActiveContractVersion,
    { poolId },
  );
  const [viewingHash, setViewingHash] = useState<string | null>(null);

  if (activeVersion === undefined) return <LoadingState />;
  if (activeVersion === null)
    return (
      <p className="text-muted-foreground p-6">
        No contract found for this pool.
      </p>
    );

  const hashToShow = viewingHash ?? activeVersion.versionHash;

  if (hashToShow !== activeVersion.versionHash) {
    return (
      <VersionByHash
        hash={hashToShow}
        poolId={poolId}
        onNavigate={setViewingHash}
      />
    );
  }

  return (
    <VersionView
      doc={activeVersion as ContractVersionDoc}
      poolId={poolId}
      onNavigate={setViewingHash}
    />
  );
}
