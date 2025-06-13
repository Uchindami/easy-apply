import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { ResumeUploader } from "@/components/resume-generator/ResumeUploader";
import { JobDetails } from "@/components/resume-generator/JobDetails";
import { useDocumentStore } from "@/store/useResumeStore";
import DocumentViewer from "@/components/chats/resume-viewer";
import { motion } from "framer-motion";
import { ProgressIndicator } from "@/components/resume-generator/progress-indicator";
import { TemplateSelector } from "@/components/resume-generator/TemplateSelector";
import { useEffect } from "react";
import { useLocation } from "react-router";

export default function DocumentGenerator() {
  const {
    resumeFile,
    jobUrl,
    isGenerating,
    activeTab,
    generatedResume,
    chatId,
    generatedCoverLetter,
    selectedTemplate,
    selectedColors,
    setResumeFile,
    setJobUrl,
    setActiveTab,
    setSelectedTemplate,
    setSelectedColors,
    generateDocuments,
    resetForm,
  } = useDocumentStore();

  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.jobUrl) {
      setJobUrl(location.state.jobUrl);
      setActiveTab("upload");
    }
    // eslint-disable-next-line
  }, [location.state]);

  const isReadyToGenerate = resumeFile && jobUrl;
  const hasGeneratedDocuments = generatedResume || generatedCoverLetter;

  return (
    <div className=" flex flex-col overflow-hidden bg-gradient-to-b from-background to-muted/20">
      <Header
        title="Resume Tailoring Tool"
        onReset={resetForm}
        isResetDisabled={activeTab === "upload" && !resumeFile && !jobUrl}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-[1200px] mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab as (value: string) => void}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger
                value="upload"
                disabled={isGenerating}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Upload
              </TabsTrigger>
              <TabsTrigger
                value="design"
                disabled={isGenerating}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Design
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                disabled={!hasGeneratedDocuments && !isGenerating}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Preview
              </TabsTrigger>
            </TabsList>

            <ProgressIndicator
              step={activeTab === "upload" ? 1 : activeTab === "design" ? 2 : 3}
              totalSteps={3}
              labels={["Upload", "Design", "Preview"]}
            />
          </div>

          <TabsContent value="upload" className=" space-y-6 mt-0">
            <div className="flex flex-col gap-6">
              <ResumeUploader
                resumeFile={resumeFile}
                onFileChange={setResumeFile}
                isGenerating={isGenerating}
              />
              <JobDetails
                jobUrl={jobUrl}
                onUrlChange={setJobUrl}
                onGenerate={() => setActiveTab("design")}
                isGenerating={isGenerating}
                isDisabled={!isReadyToGenerate}
              />
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-6 mt-0">
            <TemplateSelector
              onTemplateSelect={(template, colors) => {
                setSelectedTemplate(template);
                setSelectedColors(colors);
              }}
              onContinue={generateDocuments}
              isGenerating={isGenerating}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6 mt-0">
            {isGenerating ? (
              <GeneratingState />
            ) : hasGeneratedDocuments ? (
              <DocumentPreview
                generatedResume={generatedResume}
                generatedCoverLetter={generatedCoverLetter}
                chatId={chatId ?? ""}
                onNewDocument={() => setActiveTab("upload")}
                onReset={resetForm}
              />
            ) : (
              <EmptyState onNavigateToUpload={() => setActiveTab("upload")} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GeneratingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 md:p-12 bg-card rounded-lg shadow-md border border-border"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-primary"></div>
          </div>
        </div>
        <h3 className="text-2xl font-semibold mt-6 mb-2">
          Generating Your Documents
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          We're analyzing the job posting and tailoring your resume and cover
          letter to maximize your chances of success. This typically takes 45-60
          seconds...
        </p>

        <div className="w-full max-w-md mt-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 45, ease: "linear" }}
            />
          </div>

          <div className="mt-8 space-y-2">
            <StepItem label="Analyzing resume content" status="complete" />
            <StepItem label="Extracting job requirements" status="complete" />
            <StepItem label="Tailoring resume content" status="active" />
            <StepItem label="Creating cover letter" status="pending" />
            <StepItem label="Finalizing documents" status="pending" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StepItem({
  label,
  status,
}: {
  label: string;
  status: "pending" | "active" | "complete";
}) {
  return (
    <div className="flex items-center space-x-3">
      {status === "complete" ? (
        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 text-primary"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      ) : status === "active" ? (
        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        </div>
      ) : (
        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center"></div>
      )}
      <span
        className={`text-sm ${
          status === "complete"
            ? "text-primary"
            : status === "active"
            ? "text-foreground"
            : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function EmptyState({
  onNavigateToUpload,
}: {
  onNavigateToUpload: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-lg">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">No Documents Generated</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        You haven't generated any documents yet. Upload your resume and provide
        a job posting URL to get started.
      </p>
      <Button onClick={onNavigateToUpload}>Go to Upload</Button>
    </div>
  );
}

function DocumentPreview({
  generatedResume,
  generatedCoverLetter,
  chatId,
  onNewDocument,
  onReset,
}: {
  generatedResume: string;
  generatedCoverLetter: string;
  chatId: string;
  onNewDocument: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="mt-0">
          <DocumentViewer
            documentHTML={generatedResume}
            historyId={chatId}
            documentType="resume"
            jobTitle=""
          />
        </TabsContent>

        <TabsContent value="coverLetter" className="mt-0">
          <DocumentViewer
            documentHTML={generatedCoverLetter}
            historyId={chatId}
            documentType="coverLetter"
            jobTitle=""
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <Button onClick={onReset} variant="outline">
          Start New
        </Button>
        <Button onClick={onNewDocument}>Edit Inputs</Button>
      </div>
    </div>
  );
}
