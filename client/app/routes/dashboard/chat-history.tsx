import { Header } from "@/components/Header";
import HistoryDetailSkeleton from "@/components/chats/history-detail-skeleton";
import { JobDetailsCard } from "@/components/chats/job-details-card";
import DocumentViewer from "@/components/chats/resume-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChatHistory } from "@/hooks/use-chat-history";
import type { HistoryData } from "@/types/history";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link, useParams } from "react-router";

interface DocumentsViewerProps {
  historyData: HistoryData;
  isJobDetailsCollapsed: boolean;
  onToggleJobDetails: () => void;
  chatHistoryId: string;
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

// --- Components ---
const DocumentsViewer: React.FC<DocumentsViewerProps> = ({
  historyData,
  isJobDetailsCollapsed,
  onToggleJobDetails,
  chatHistoryId,
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
            documentHTML={historyData.generated.resumeText}
            historyId={chatHistoryId}
            documentType={"resume"}
            jobTitle={historyData.jobDetails.title}
          />
        </TabsContent>
        <TabsContent value="coverLetter" className="mt-4">
          <DocumentViewer
            documentHTML={historyData.generated.coverLetterText}
            historyId={chatHistoryId}
            documentType={"coverLetter"}
            jobTitle={historyData.jobDetails.title}
          />
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
        <DocumentsViewer
          historyData={historyData}
          isJobDetailsCollapsed={isJobDetailsCollapsed}
          onToggleJobDetails={() => setIsJobDetailsCollapsed((prev) => !prev)}
          chatHistoryId={chatHistoryId as string}
        />
      </div>
    </div>
  );
}
