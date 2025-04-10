import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/resume-generator/Header"
import { ResumeUploader } from "@/components/resume-generator/ResumeUploader"
import { JobDetails } from "@/components/resume-generator/JobDetails"
import { DocumentPreview } from "@/components/resume-generator/DocumentPreview"

export default function ResumeGenerator() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobUrl, setJobUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [generatedResume, setGeneratedResume] = useState("")
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("")
  const [originalResume, setOriginalResume] = useState("")
  const [showDiff, setShowDiff] = useState(false)

  const handleFileChange = (file: File | null) => {
    setResumeFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setOriginalResume(event.target.result as string)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleGenerate = async () => {
    if (!resumeFile || !jobUrl) return

    setIsGenerating(true)
    setActiveTab("preview")

    try {
      // Simulate API call to generate resume and cover letter
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock generated content
      setGeneratedResume(`# John Doe
## Software Engineer

**Contact:** john.doe@example.com | (555) 123-4567 | linkedin.com/in/johndoe

### Summary
Experienced software engineer with 5+ years of experience in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering high-quality applications that meet business requirements.

### Experience
**Senior Software Engineer | TechCorp Inc.**
*Jan 2020 - Present*
- Led development of company's flagship product, increasing user engagement by 35%
- Implemented CI/CD pipeline, reducing deployment time by 60%
- Mentored junior developers and conducted code reviews

**Software Developer | InnoSoft Solutions**
*Mar 2018 - Dec 2019*
- Developed responsive web applications using React and TypeScript
- Collaborated with UX designers to implement user-friendly interfaces
- Optimized database queries, improving application performance by 25%

### Skills
- Languages: JavaScript, TypeScript, Python, SQL
- Frontend: React, Next.js, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL, MongoDB
- Tools: Git, Docker, AWS, CI/CD, Jest
      `)

      setGeneratedCoverLetter(`Dear Hiring Manager,

I am writing to express my interest in the Software Engineer position at your company. With over 5 years of experience in full-stack development, I am confident that my skills and experience make me an ideal candidate for this role.

Throughout my career, I have demonstrated a strong ability to develop efficient, scalable applications using modern technologies such as React, Node.js, and cloud services. In my current role at TechCorp Inc., I have led the development of our flagship product, resulting in a 35% increase in user engagement.

I was particularly excited to see that your company is focused on innovative solutions in the fintech space. My experience with secure payment processing systems and financial data analysis aligns perfectly with your company's mission.

I am impressed by your company's commitment to creating user-friendly financial tools that help people manage their finances more effectively. This resonates with my personal belief that technology should simplify complex tasks and be accessible to everyone.

I would welcome the opportunity to discuss how my background, technical skills, and enthusiasm could contribute to your team's success. Thank you for considering my application.

Sincerely,
John Doe
      `)

      setIsComplete(true)
    } catch (error) {
      console.error("Error generating documents:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (type: "resume" | "coverLetter") => {
    const content = type === "resume" ? generatedResume : generatedCoverLetter
    const fileName = type === "resume" ? "tailored-resume.md" : "cover-letter.md"

    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    setResumeFile(null)
    setJobUrl("")
    setIsComplete(false)
    setGeneratedResume("")
    setGeneratedCoverLetter("")
    setActiveTab("upload")
  }

  return (
    <main className="flex-1 flex flex-col h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Header onReset={resetForm} isResetDisabled={activeTab === "upload" && !resumeFile && !jobUrl} />

      <div className="flex-1 overflow-y-auto p-6 w-full max-w-[1200px] mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upload" disabled={isGenerating}>
              Upload
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedResume && !isGenerating}>
              Preview & Download
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <ResumeUploader resumeFile={resumeFile} onFileChange={handleFileChange} />
            <JobDetails
              jobUrl={jobUrl}
              onUrlChange={setJobUrl}
              onGenerate={handleGenerate}
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
                  originalResume={originalResume}
                  showDiff={showDiff}
                  onShowDiffChange={setShowDiff}
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
