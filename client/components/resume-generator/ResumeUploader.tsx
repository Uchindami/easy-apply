import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResumeUploaderProps {
  resumeFile: File | null
  onFileChange: (file: File | null) => void
}

export function ResumeUploader({ resumeFile, onFileChange }: ResumeUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
        <CardDescription>
          Upload your existing resume to tailor it for the job you're applying to
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
            resumeFile ? "border-green-500" : "border-gray-300",
          )}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md"
          />

          {resumeFile ? (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">{resumeFile.name}</p>
              <p className="text-sm text-gray-500 mt-2">File uploaded successfully</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={(e) => {
                  e.stopPropagation()
                  onFileChange(null)
                }}
              >
                Change File
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">Drag and drop your resume</p>
              <p className="text-sm text-gray-500 mt-2">or click to browse files</p>
              <p className="text-xs text-gray-400 mt-4">Supports PDF, Word, Text, and Markdown files</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 