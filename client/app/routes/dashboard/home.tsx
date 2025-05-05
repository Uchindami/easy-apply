import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { ResumeUploader } from "@/components/resume-generator/ResumeUploader";
import { JobDetails } from "@/components/resume-generator/JobDetails";
import { DocumentPreview } from "@/components/resume-generator/DocumentPreview";
import { useDocumentStore } from "@/store/useResumeStore";
import DocumentViewer from "@/components/chats/resume-viewer";

export default function DocumentGenerator() {
  const {
    resumeFile,
    jobUrl,
    isGenerating,
    isComplete,
    activeTab,
    generatedResume,
    chatId,
    generatedCoverLetter,
    setResumeFile,
    setJobUrl,
    setActiveTab,
    setGeneratedResume,
    setGeneratedCoverLetter,
    generateDocuments,
    resetForm,
  } = useDocumentStore();

  const handleDownload = (type: "resume" | "coverLetter") => {};

  return (
    <main className="flex-1 flex flex-col h-full w-full overflow-hidden ">
      <Header
        title="Resume tailoring tool"
        onReset={resetForm}
        isResetDisabled={activeTab === "upload" && !resumeFile && !jobUrl}
      />

      <div className="flex-1 overflow-y-auto p-6 w-full max-w-[1200px] mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab as (value: string) => void}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="upload" disabled={isGenerating}>
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              disabled={!generatedResume && !isGenerating}
            >
              Preview & Download
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <ResumeUploader
              resumeFile={resumeFile}
              onFileChange={setResumeFile}
            />
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
                  <h3 className="text-xl font-semibold mb-2">
                    Generating Your Documents
                  </h3>
                  <p className="text-gray-500 text-center max-w-md">
                    We're analyzing the job posting and tailoring your resume
                    and cover letter. This may take a minute...
                  </p>
                </div>
              </Card>
            ) : (
              <>
                <Tabs defaultValue="resume" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 s">
                    <TabsTrigger value="resume">Resume</TabsTrigger>
                    <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
                  </TabsList>
                  <TabsContent value="resume" className="mt-4 flex">
                    <DocumentViewer
                      documentHTML={generatedResume}
                      historyId={chatId}
                      documentType={"resume"}
                      jobTitle={""}
                    />
                  </TabsContent>
                  <TabsContent value="coverLetter" className="mt-4">
                    <DocumentViewer
                      documentHTML={generatedCoverLetter}
                      historyId={chatId}
                      documentType={"coverLetter"}
                      jobTitle={""}
                    />
                  </TabsContent>
                </Tabs>
                <div className="flex justify-center">
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="mr-4"
                  >
                    Start New
                  </Button>
                  <Button onClick={() => setActiveTab("upload")}>
                    Edit Inputs
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
