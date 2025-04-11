"use client"

import type React from "react"

import { UploadCloud } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ResumeUploaderProps {
  resumeFile: File | null
  onFileChange: (file: File | null) => void
}

export function ResumeUploader({ resumeFile, onFileChange }: ResumeUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onFileChange(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
        <CardDescription>Upload your current resume in PDF, DOCX, or TXT format</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
          <input
            type="file"
            id="resume-upload"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
          />
          <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
            <div className="text-center">
              {resumeFile ? (
                <p className="font-medium text-primary">{resumeFile.name}</p>
              ) : (
                <>
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT (max 5MB)</p>
                </>
              )}
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
