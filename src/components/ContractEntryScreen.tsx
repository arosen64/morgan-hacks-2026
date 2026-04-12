import { useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ContractEditor } from "./ContractEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, PenLine, Upload, AlertCircle, Loader2 } from "lucide-react";

interface ContractEntryScreenProps {
  poolId: string;
}

type State =
  | { mode: "entry" }
  | { mode: "scratch" }
  | { mode: "uploading" }
  | { mode: "editor"; initialContent: object }
  | { mode: "error"; message: string };

export function ContractEntryScreen({ poolId }: ContractEntryScreenProps) {
  const [state, setState] = useState<State>({ mode: "entry" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractContractFromPdf = useAction(
    api.contractPdf.extractContractFromPdf,
  );

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState({ mode: "uploading" });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = await extractContractFromPdf({
        pdfBytes: arrayBuffer,
      });

      const paragraphs = extractedText
        .split(/\n+/)
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => ({
          type: "paragraph",
          content: [{ type: "text", text: line.trim() }],
        }));

      const content = { type: "doc", content: paragraphs };
      setState({ mode: "editor", initialContent: content });
    } catch (err) {
      setState({
        mode: "error",
        message: err instanceof Error ? err.message : "PDF extraction failed",
      });
    }
  };

  if (state.mode === "scratch") {
    return <ContractEditor poolId={poolId} />;
  }

  if (state.mode === "editor") {
    return (
      <ContractEditor poolId={poolId} initialContent={state.initialContent} />
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100">
            <FileText className="w-5 h-5 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Create Your Contract
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          No contract exists for this pool yet. Choose how you'd like to get
          started.
        </p>
      </div>

      {state.mode === "error" && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 mb-6 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">PDF extraction failed</p>
            <p className="text-destructive/80 mt-0.5">
              {state.message}. Please try again or create from scratch.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:border-violet-300 hover:shadow-sm transition-all group"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-2 group-hover:bg-violet-100 transition-colors">
              {state.mode === "uploading" ? (
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-violet-600 transition-colors" />
              )}
            </div>
            <CardTitle className="text-base">Upload a PDF</CardTitle>
            <CardDescription>
              Import an existing contract. Gemini will extract the content into
              the editor for you to review and edit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-violet-200 text-violet-700 hover:bg-violet-50"
              disabled={state.mode === "uploading"}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {state.mode === "uploading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Extracting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" /> Choose PDF
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-violet-300 hover:shadow-sm transition-all group"
          onClick={() => setState({ mode: "scratch" })}
        >
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-2 group-hover:bg-violet-100 transition-colors">
              <PenLine className="w-5 h-5 text-muted-foreground group-hover:text-violet-600 transition-colors" />
            </div>
            <CardTitle className="text-base">Create from Scratch</CardTitle>
            <CardDescription>
              Open a blank editor and write your contract directly using our
              rich text editor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={() => setState({ mode: "scratch" })}
            >
              <PenLine className="w-4 h-4 mr-2" /> Start Writing
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
