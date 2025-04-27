import type React from "react";
import { format } from "date-fns";
import {
  Briefcase,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HistoryDetailSkeleton from "@/components/chats/history-detail-skeleton";
import { useChatHistory } from "@/hooks/use-chat-history";
import type { HistoryData } from "../../../types/history";
import { Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DocumentViewer from "@/components/chats/resume-viewer";
import { DocumentPreview } from "@/components/resume-generator/DocumentPreview";

// --- Types ---
interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface JobDetailsCardProps {
  historyData: HistoryData;
}

interface DocumentsViewerProps {
  historyData: HistoryData;
  isJobDetailsCollapsed: boolean;
  onToggleJobDetails: () => void;
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

// --- Components ---
const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0">{icon}</div>
    <div className="space-y-1 min-w-0">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm truncate" title={value}>
              {value}
            </p>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
);

const JobDetailsCard: React.FC<JobDetailsCardProps> = ({ historyData }) => (
  <Card className="max-w-sm">
    <CardHeader className="items-center">
      <CardTitle>Job Details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <DetailItem
        icon={<Briefcase className="h-5 w-5 text-gray-500 mt-0.5" />}
        label="Company"
        value={historyData.jobDetails.company || "Not specified"}
      />
      <DetailItem
        icon={<LinkIcon className="h-5 w-5 text-gray-500 mt-0.5" />}
        label="Source"
        value={historyData.original.jobLink || "Not specified"}
      />
      <DetailItem
        icon={<Calendar className="h-5 w-5 text-gray-500 mt-0.5" />}
        label="Applied On"
        value={
          historyData.timestamp
            ? format(historyData.timestamp, "PPP")
            : "Unknown date"
        }
      />
      <DetailItem
        icon={<Clock className="h-5 w-5 text-gray-500 mt-0.5" />}
        label="Status"
        value={historyData.status || "Unknown"}
      />
      {historyData.original.jobLink && (
        <Button className="w-full mt-4" asChild>
          <a
            href={historyData.original.jobLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Original Job Posting
          </a>
        </Button>
      )}
    </CardContent>
  </Card>
);

const DocumentsViewer: React.FC<DocumentsViewerProps> = ({
  historyData,
  isJobDetailsCollapsed,
  onToggleJobDetails,
}) => (
  <Card className="flex transition-all duration-300 overflow-hidden">
    <CardHeader className="flex flex-row items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleJobDetails}
        className="hidden md:flex"
      >
        {isJobDetailsCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
      <CardTitle>Generated Documents</CardTitle>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="grid w-full grid-cols-2 s">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
        </TabsList>
        <TabsContent value="resume" className="mt-4 flex">
          <DocumentViewer
            documentHTML={historyData.generated.resumePath}
            historyId={useParams<{ chatHistoryId: string; }>().chatHistoryId!}
            documentType={"resume"} jobTitle={historyData.jobDetails.title}          />
        </TabsContent>
        <TabsContent value="coverLetter" className="mt-4">
          <DocumentViewer
            documentHTML={historyData.generated.coverLetterPath}
            historyId={useParams<{ chatHistoryId: string; }>().chatHistoryId!}
            documentType={"coverLetter"} jobTitle={historyData.jobDetails.title}          />
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">
      {error || "Unable to load history data"}
    </h2>
    <Button asChild>
      <Link to="/dashboard">Back to History</Link>
    </Button>
  </div>
);

// --- Main Page Component ---
export default function ChatHistoryDetail() {
  const { chatHistoryId } = useParams<{ chatHistoryId: string }>();
  const { historyData, loading, error, retry } = useChatHistory(
    chatHistoryId
  ) as {
    historyData: HistoryData | null;
    loading: boolean;
    error: string | null;
    retry: () => void;
  };
  const [isJobDetailsCollapsed, setIsJobDetailsCollapsed] =
    useState<boolean>(false);

  if (loading) return <HistoryDetailSkeleton />;
  if (error || !historyData) {
    return <ErrorState error={error || "Unknown error"} onRetry={retry} />;
  }

  return (
    <div>
      <Header title={historyData.jobDetails.title || "Job Application"} />
      <div className="flex space-y-5 flex-col md:flex-row md:gap-4 p-6">
        <div>
          {!isJobDetailsCollapsed && (
            <JobDetailsCard historyData={historyData} />
          )}
        </div>
        {/* <DocumentPreview
                  generatedResume={historyData.generated.resumePath}
                  generatedCoverLetter={historyData.generated.coverLetterPath}
                  onResumeChange={()=>{}}
                  onCoverLetterChange={()=>{}}
                  onDownload={()=>{}}
                /> */}
        <DocumentsViewer
          historyData={historyData}
          isJobDetailsCollapsed={isJobDetailsCollapsed}
          onToggleJobDetails={() => setIsJobDetailsCollapsed((prev) => !prev)}
        />
      </div>
    </div>
  );
}
