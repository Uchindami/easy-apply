import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Edit, Save } from "lucide-react";
import RichTextEditor from "@/components/chats/rich-text-editor";
import ResumeImageRenderer from "@/components/chats/resume-image-renderer";
import { useChatStore } from "@/store/chat-store";
import { useProfileStore } from "@/store/profile-store";
// import HTMLtoDOCX from "@turbodocx/html-to-docx"

interface DocumentViewerProps {
  documentHTML: string;
  historyId: string;
}

export default function DocumentViewer({ documentHTML, historyId, }: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editorContent, setEditorContent] = useState<string>(documentHTML);
  const updateChat = useChatStore((state) => state.updateChat);
  const userId = useProfileStore((state) => state.user?.uid);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditorChange = (newContent: string): void => {
    setEditorContent(newContent);
  };

  const handleSave = async (): Promise<void> => {
    if (!userId || !historyId) return;
    setIsSaving(true);
    try {
      await updateChat(userId, historyId, {
        "generated.resumePath": editorContent,
      });
      setIsEditing(false);
    } catch (e) {
      // Optionally handle error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadDOCX = async (): Promise<void> => {
    // try {
    //   // Convert HTML to DOCX (returns a Blob in browser)
    //   const docxBlob = await HTMLtoDOCX(editorContent, "", { title: "Resume" }, "");
    //   // Create a download link
    //   const url = URL.createObjectURL(docxBlob);
    //   const a = document.createElement("a");
    //   a.href = url;
    //   a.download = "Resume.docx";
    //   document.body.appendChild(a);
    //   a.click();
    //   document.body.removeChild(a);
    //   URL.revokeObjectURL(url);
    // } catch (error) {
    //   // Optionally handle error (e.g., show a toast)
    //   console.error("Failed to generate DOCX:", error);
    // }
  };

  const handleDownloadPDF = (): void => { };

  return (
    <div className="space-y-4 overflow-hidden flex-1">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="edit-mode"
            checked={isEditing}
            onCheckedChange={setIsEditing}
          />
          <Label htmlFor="edit-mode" className="flex items-center">
            <Edit className="h-4 w-4 mr-1" />
            <span>Edit Mode</span>
          </Label>
        </div>

        <div className="flex md:flex-row space-x-2 overflow-x-auto">
          <Button variant="outline" size="sm" onClick={handleDownloadDOCX}>
            <Download className="md:h-4 md:w-4 mr-1" />
            <span>Download docx</span>
          </Button>
          <Button variant="default" size="sm" onClick={handleDownloadPDF}>
            <Download className="md:h-4 md:w-4 mr-1" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <RichTextEditor
            content={editorContent}
            onChange={handleEditorChange}
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} className="mt-2" disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>
      ) : (
        <ResumeImageRenderer htmlContent={editorContent} />
      )}
    </div>
  );
}