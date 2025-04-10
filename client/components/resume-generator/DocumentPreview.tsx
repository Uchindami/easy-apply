import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download } from "lucide-react"
import { DiffViewer } from "@/components/diff-viewer"

interface DocumentPreviewProps {
  generatedResume: string
  generatedCoverLetter: string
  originalResume: string
  showDiff: boolean
  onShowDiffChange: (show: boolean) => void
  onResumeChange: (resume: string) => void
  onCoverLetterChange: (coverLetter: string) => void
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tailored Resume</CardTitle>
            <CardDescription>Your resume tailored to the job posting</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {originalResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShowDiffChange(!showDiff)}
                className={showDiff ? "bg-muted" : ""}
              >
                {showDiff ? "Hide Changes" : "Show Changes"}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => onDownload("resume")}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showDiff && originalResume ? (
            <DiffViewer
              originalText={originalResume}
              newText={generatedResume}
              className="h-[500px] overflow-y-auto border rounded-md p-2"
            />
          ) : (
            <Textarea
              className="font-mono h-[500px] resize-none"
              value={generatedResume}
              onChange={(e) => onResumeChange(e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cover Letter</CardTitle>
            <CardDescription>A personalized cover letter for your application</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => onDownload("coverLetter")}>
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            className="font-mono h-[500px] resize-none"
            value={generatedCoverLetter}
            onChange={(e) => onCoverLetterChange(e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  )
} 