"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/resume-generator/Header"
import { ResumeUploader } from "@/components/resume-generator/ResumeUploader"
import { JobDetails } from "@/components/resume-generator/JobDetails"
import { DocumentPreview } from "@/components/resume-generator/DocumentPreview"
import { useResumeStore } from "@/store/useResumeStore"

export default function ResumeGenerator() {
  const {
    resumeFile,
    jobUrl,
    isGenerating,
    isComplete,
    activeTab,
    generatedResume,
    generatedCoverLetter,
    setResumeFile,
    setJobUrl,
    setActiveTab,
    setGeneratedResume,
    setGeneratedCoverLetter,
    generateDocuments,
    resetForm,
  } = useResumeStore()

  const handleDownload = (type: "resume" | "coverLetter") => {
    const content = type === "resume" ? generatedResume : generatedCoverLetter
    const fileName = type === "resume" ? "tailored-resume.html" : "cover-letter.html"
    const mimeType = "text/html"

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="flex-1 flex flex-col h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Header onReset={resetForm} isResetDisabled={activeTab === "upload" && !resumeFile && !jobUrl} />

      <div className="flex-1 overflow-y-auto p-6 w-full max-w-[1200px] mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upload" disabled={isGenerating}>
              Upload
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedResume && !isGenerating}>
              Preview & Download
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <ResumeUploader resumeFile={resumeFile} onFileChange={setResumeFile} />
            <JobDetails
              jobUrl={jobUrl}
              onUrlChange={setJobUrl}
              onGenerate={generateDocuments}
              isGenerating={isGenerating}
              isDisabled={!resumeFile || !jobUrl}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {isGenerating ? (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Generating Your Documents</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    We're analyzing the job posting and tailoring your resume and cover letter. This may take a
                    minute...
                  </p>
                </div>
              </Card>
            ) : (
              <>
                <DocumentPreview
                  generatedResume={generatedResume}
                  generatedCoverLetter={generatedCoverLetter}
                  onResumeChange={setGeneratedResume}
                  onCoverLetterChange={setGeneratedCoverLetter}
                  onDownload={handleDownload}
                />

                <div className="flex justify-center">
                  <Button onClick={resetForm} variant="outline" className="mr-4">
                    Start New
                  </Button>
                  <Button onClick={() => setActiveTab("upload")}>Edit Inputs</Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
