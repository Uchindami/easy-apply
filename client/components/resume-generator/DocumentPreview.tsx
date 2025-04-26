import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Edit, Eye, FileText, Mail } from "lucide-react";
import RichTextEditor from "@/components/chats/rich-text-editor";
import ResumeImageRenderer from "@/components/chats/resume-image-renderer";

interface DocumentPreviewProps {
  generatedResume: string;
  generatedCoverLetter: string;
  onResumeChange: (content: string) => void;
  onCoverLetterChange: (content: string) => void;
  onDownload: (type: "resume" | "coverLetter") => void;
}

export function DocumentPreview({
  generatedResume,
  generatedCoverLetter,
  onResumeChange,
  onCoverLetterChange,
  onDownload,
}: DocumentPreviewProps) {
  const [activeDocTab, setActiveDocTab] = useState<string>("resume");
  const [editMode, setEditMode] = useState<boolean>(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Tailored Documents</CardTitle>
            <CardDescription>
              Review and edit your tailored resume and cover letter
            </CardDescription>
            
          </div>
          <div className="flex items-center space-x-2">
            
            <Switch
              id="edit-mode"
              checked={editMode}
              onCheckedChange={setEditMode}
            />
            <Label htmlFor="edit-mode" className="flex items-center">
              {editMode ? (
                <>
                  <Edit className="mr-1 h-4 w-4" /> Edit Mode
                </>
              ) : (
                <>
                  <Eye className="mr-1 h-4 w-4" /> View Mode
                </>
              )}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeDocTab}
          onValueChange={setActiveDocTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="resume" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Resume
            </TabsTrigger>
            <TabsTrigger value="coverLetter" className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              Cover Letter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="space-y-4">
            {editMode ? (
              <RichTextEditor
                content={generatedResume}
                onChange={() => { }}
              />
            ) : (
              <ResumeImageRenderer htmlContent={generatedResume} />

            )}
            <div className="flex justify-end">
              <Button
                onClick={() => onDownload("resume")}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Resume
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="coverLetter" className="space-y-4">
            {editMode ? (
              <div
                className="border rounded-md p-4 min-h-[500px] overflow-y-scroll overflow-x-hidden bg-white"
                dangerouslySetInnerHTML={{ __html: generatedCoverLetter }}
              />
            ) : (
              <Textarea
                value={generatedCoverLetter}
                onChange={(e) => onCoverLetterChange(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
              />
            )}

          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
