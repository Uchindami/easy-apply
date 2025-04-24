import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Edit, Save } from "lucide-react";
import RichTextEditor from "@/components/chats/rich-text-editor";

interface CoverLetterViewerProps {
  document: string;
}

export default function CoverLetterViewer({
  document,
}: CoverLetterViewerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(true);

  const handleEditorChange = (newContent: string): void => {};

  const handleSave = (): void => {
    // In a real app, you would convert HTML back to plain text or store as HTML
    setIsEditing(false);
  };

  const handleDownload = (): void => {};

  const handleDownloadPDF = (): void => {
    // In a real application, you would use a library like jsPDF or
    // a server-side solution to generate a PDF
    alert(
      "In a production app, this would generate a PDF using a library like jsPDF or a server-side solution."
    );

    // For demonstration purposes, we'll just download as text
    handleDownload();
  };

  //   if (loading) {
  //     return (
  //       <div className="space-y-4">
  //         <Skeleton className="h-6 w-1/3" />
  //         <Skeleton className="h-4 w-2/3" />
  //         <Skeleton className="h-4 w-1/2" />
  //         <Skeleton className="h-32 w-full" />
  //         <Skeleton className="h-32 w-full" />
  //         <Skeleton className="h-6 w-1/4" />
  //       </div>
  //     );
  //   }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="edit-mode-cover"
            checked={isEditing}
            onCheckedChange={setIsEditing}
          />
          <Label htmlFor="edit-mode-cover" className="flex items-center">
            <Edit className="h-4 w-4 mr-1" />
            <span>Edit Mode</span>
          </Label>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            <span>Download .txt</span>
          </Button>
          <Button variant="default" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <RichTextEditor content={document} onChange={handleEditorChange} />
          <div className="flex justify-end">
            <Button onClick={handleSave} className="mt-2">
              <Save className="h-4 w-4 mr-1" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="font-serif leading-relaxed prose max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: document }}
        />
      )}
    </div>
  );
}
