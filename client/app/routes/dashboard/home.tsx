"use client"

import { useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/resume-generator/Header"
import { ResumeUploader } from "@/components/resume-generator/ResumeUploader"
import { JobDetails } from "@/components/resume-generator/JobDetails"
import { DocumentPreview } from "@/components/resume-generator/DocumentPreview"
import { TemplateSelector } from "@/components/resume-generator/TemplateSelector"
import { useResumeStore } from "@/store/useResumeStore"

// Import html-to-pdf conversion library
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

export default function ResumeGenerator() {
  const {
    resumeFile,
    jobUrl,
    isGenerating,
    isComplete,
    activeTab,
    generatedResume,
    generatedCoverLetter,
    selectedTemplate,
    accentColor,
    setResumeFile,
    setJobUrl,
    setActiveTab,
    setSelectedTemplate,
    setAccentColor,
    setGeneratedResume,
    setGeneratedCoverLetter,
    generateDocuments,
    resetForm,
  } = useResumeStore()

  // Function to generate PDF from HTML content
  const handleDownload = async (type: "resume" | "coverLetter") => {
    const element = document.getElementById(type === "resume" ? "resume-preview" : "coverletter-preview")
    if (!element) return

    try {
      // Show loading state
      const loadingToast = document.createElement("div")
      loadingToast.className = "fixed top-4 right-4 bg-black text-white p-4 rounded shadow-lg z-50"
      loadingToast.textContent = "Generating PDF..."
      document.body.appendChild(loadingToast)

      // Create a clone of the element to avoid modifying the original
      const clone = element.cloneNode(true) as HTMLElement
      clone.style.width = "800px"
      clone.style.height = "auto"
      clone.style.position = "absolute"
      clone.style.left = "-9999px"
      document.body.appendChild(clone)

      // Generate canvas from the element
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      // Remove the clone
      document.body.removeChild(clone)

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      })

      // Add image to PDF
      const imgData = canvas.toDataURL("image/png")
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2)

      // Save PDF
      pdf.save(type === "resume" ? "tailored-resume.pdf" : "cover-letter.pdf")

      // Remove loading toast
      document.body.removeChild(loadingToast)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  // Create hidden elements for PDF generation
  useEffect(() => {
    // Create hidden elements for PDF generation if they don't exist
    if (!document.getElementById("resume-preview")) {
      const resumePreview = document.createElement("div")
      resumePreview.id = "resume-preview"
      resumePreview.style.position = "absolute"
      resumePreview.style.left = "-9999px"
      resumePreview.innerHTML = generatedResume
      document.body.appendChild(resumePreview)
    }

    if (!document.getElementById("coverletter-preview")) {
      const coverLetterPreview = document.createElement("div")
      coverLetterPreview.id = "coverletter-preview"
      coverLetterPreview.style.position = "absolute"
      coverLetterPreview.style.left = "-9999px"
      coverLetterPreview.innerHTML = generatedCoverLetter
      document.body.appendChild(coverLetterPreview)
    }

    // Update the content of the hidden elements when the generated content changes
    const updateHiddenElements = () => {
      const resumePreview = document.getElementById("resume-preview")
      const coverLetterPreview = document.getElementById("coverletter-preview")

      if (resumePreview && generatedResume) {
        resumePreview.innerHTML = generatedResume
      }

      if (coverLetterPreview && generatedCoverLetter) {
        coverLetterPreview.innerHTML = generatedCoverLetter
      }
    }

    updateHiddenElements()

    // Clean up on unmount
    return () => {
      const resumePreview = document.getElementById("resume-preview")
      const coverLetterPreview = document.getElementById("coverletter-preview")

      if (resumePreview) {
        document.body.removeChild(resumePreview)
      }

      if (coverLetterPreview) {
        document.body.removeChild(coverLetterPreview)
      }
    }
  }, [generatedResume, generatedCoverLetter])

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
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              accentColor={accentColor}
              onTemplateChange={setSelectedTemplate}
              onColorChange={setAccentColor}
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
                  selectedTemplate={selectedTemplate}
                  accentColor={accentColor}
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
