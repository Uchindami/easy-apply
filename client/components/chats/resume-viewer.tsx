import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Edit, Save } from "lucide-react";
import RichTextEditor from "@/components/chats/rich-text-editor";
import ResumeImageRenderer from "@/components/chats/resume-image-renderer";

interface DocumentViewerProps {
  documentHTML: string;
}

export default function DocumentViewer({ documentHTML }: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleEditorChange = (newContent: string): void => { };

  const handleSave = (): void => {

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

        <div className="flex md:flex-row space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="md:h-4 md:w-4 mr-1" />
            <span>Download .txt</span>
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
            content={documentHTML}
            onChange={handleEditorChange}
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} className="mt-2">
              <Save className="h-4 w-4 mr-1" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      ) : (
        <ResumeImageRenderer htmlContent={documentHTML} />
      )}
    </div>
  );
}