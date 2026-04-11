import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Save,
} from "lucide-react";

interface ContractEditorProps {
  poolId: string;
  initialContent?: object | null;
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-muted transition-colors ${
        active ? "bg-muted text-primary" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function ContractEditor({
  poolId,
  initialContent,
}: ContractEditorProps) {
  const [, navigate] = useLocation();
  const storeContractVersion = useMutation(
    api.contractVersions.storeContractVersion,
  );
  const activeVersion = useQuery(
    api.contractVersions.getActiveContractVersion,
    { poolId },
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your contract here..." }),
    ],
    content: initialContent ?? activeVersion?.content ?? undefined,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-sm",
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;
    await storeContractVersion({
      poolId,
      content: editor.getJSON(),
      prevVersionHash: activeVersion?.versionHash ?? null,
    });
    navigate(`/pool/${poolId}/contract`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {activeVersion ? "Amend Contract" : "Create Contract"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Pool: {poolId}</p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Contract
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-0">
            <div className="flex items-center gap-1 flex-wrap">
              <ToolbarButton
                title="Bold"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                active={editor?.isActive("bold")}
              >
                <Bold className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                title="Italic"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                active={editor?.isActive("italic")}
              >
                <Italic className="w-4 h-4" />
              </ToolbarButton>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <ToolbarButton
                title="Heading 1"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                active={editor?.isActive("heading", { level: 1 })}
              >
                <Heading1 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                title="Heading 2"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                active={editor?.isActive("heading", { level: 2 })}
              >
                <Heading2 className="w-4 h-4" />
              </ToolbarButton>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <ToolbarButton
                title="Bullet List"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                active={editor?.isActive("bulletList")}
              >
                <List className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                title="Numbered List"
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
                active={editor?.isActive("orderedList")}
              >
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <ToolbarButton
                title="Blockquote"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                active={editor?.isActive("blockquote")}
              >
                <Quote className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                title="Code"
                onClick={() => editor?.chain().focus().toggleCode().run()}
                active={editor?.isActive("code")}
              >
                <Code className="w-4 h-4" />
              </ToolbarButton>
            </div>
          </CardHeader>
          <Separator className="mt-3" />
          <CardContent className="p-0">
            <EditorContent editor={editor} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
