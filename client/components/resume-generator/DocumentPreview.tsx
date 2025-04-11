"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Download, FileText, Mail } from "lucide-react"

interface DocumentPreviewProps {
  generatedResume: string
  generatedCoverLetter: string
  originalResume: string
  showDiff: boolean
  onShowDiffChange: (show: boolean) => void
  onResumeChange: (content: string) => void
  onCoverLetterChange: (content: string) => void
  onDownload: (type: "resume" | "coverLetter") => void
}

export function DocumentPreview({
  generatedResume,
  generatedCoverLetter,
  originalResume,
  showDiff,
  onShowDiffChange,
  onResumeChange,
  onCoverLetterChange,
  onDownload,
}: DocumentPreviewProps) {
  const [activeDocTab, setActiveDocTab] = useState<string>("resume")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Tailored Documents</CardTitle>
            <CardDescription>Review and edit your tailored resume and cover letter</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="show-diff" checked={showDiff} onCheckedChange={onShowDiffChange} />
            <Label htmlFor="show-diff">Show Changes</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeDocTab} onValueChange={setActiveDocTab} className="w-full">
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
            <Textarea
              value={generatedResume}
              onChange={(e) => onResumeChange(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex justify-end">
              <Button onClick={() => onDownload("resume")} className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Download Resume
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="coverLetter" className="space-y-4">
            <Textarea
              value={generatedCoverLetter}
              onChange={(e) => onCoverLetterChange(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex justify-end">
              <Button onClick={() => onDownload("coverLetter")} className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Download Cover Letter
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
