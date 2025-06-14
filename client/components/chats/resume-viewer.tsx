import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Edit, Save } from "lucide-react";
import RichTextEditor from "@/components/chats/rich-text-editor";
import ResumeImageRenderer from "@/components/chats/resume-image-renderer";
import { useChatStore } from "@/store/chat-store";
import { useProfileStore } from "@/store/profile-store";
import { convertHtmlToDocx, convertHtmlToPdf } from "@/services/resumeService";
import { Textarea } from "../ui/textarea";
import { underscore } from "@/utils/underscore";

interface DocumentViewerProps {
  documentHTML: string;
  historyId: string | null;
  jobTitle: string;
  documentType: "resume" | "coverLetter";
}

export default function DocumentViewer({
  documentHTML,
  historyId,
  documentType,
  jobTitle,
}: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editorContent, setEditorContent] = useState<string>(documentHTML);
  const updateChat = useChatStore((state) => state.updateChat);
  const userId = useProfileStore((state) => state.user?.uid);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleEditorChange = (newContent: string): void => {
    setEditorContent(newContent);
  };

  const handleSave = async (): Promise<void> => {
    if (!userId || !historyId) return;
    setIsSaving(true);
    if (documentType === "coverLetter") {
      try {
        await updateChat(userId, historyId, {
          "generated.coverLetterPath": editorContent,
        });
        setIsEditing(false);
      } catch (e) {
        // Optionally handle error
      } finally {
        setIsSaving(false);
      }
    } else if (documentType === "resume") {
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
    }
  };

  const handleDownloadDOCX = async (): Promise<void> => {
    setIsDownloadingDocx(true);
    try {
      const docxBlob = await convertHtmlToDocx(editorContent);
      const url = window.URL.createObjectURL(docxBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        documentType === "resume"
          ? `${underscore(jobTitle)}_resume`
          : `${underscore(jobTitle)}_letter`
      }.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("DOCX download failed:", error);
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleDownloadPDF = async (): Promise<void> => {
    setIsDownloadingPdf(true);
    try {
      const pdfBlob = await convertHtmlToPdf(editorContent);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        documentType === "resume"
          ? `${underscore(jobTitle)}_resume`
          : `${underscore(jobTitle)}_letter`
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Optionally handle error, e.g., show a toast
      console.error("PDF download failed:", error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-4 overflow-hidden flex-1">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="edit-mode"
            checked={isEditing}
            onCheckedChange={setIsEditing}
          />
          <Label htmlFor="edit-mode" className="flex items-center text-primary">
            <Edit className="h-4 w-4 mr-1 text-primary" />
            <span>Edit Mode</span>
          </Label>
        </div>

        <div className="flex md:flex-row space-x-2 overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadDOCX}
            disabled={isDownloadingDocx}
          >
            <Download className="md:h-4 md:w-4 mr-1" />
            <span>
              {isDownloadingDocx ? "Downloading..." : "Download docx"}
            </span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloadingPdf}
          >
            <Download className="md:h-4 md:w-4 mr-1" />
            <span>{isDownloadingPdf ? "Downloading..." : "Download PDF"}</span>
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
      ) : documentType === "coverLetter" ? (
        <Textarea
          value={editorContent}
          className="min-h-[500px] font-serif text-md text-primary"
        />
      ) : (
        <ResumeImageRenderer htmlContent={editorContent} />
      )}
    </div>
  );
}
