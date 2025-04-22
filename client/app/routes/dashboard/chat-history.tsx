import type React from "react";
import { format } from "date-fns";
import { Briefcase, Globe, Calendar, Clock } from "lucide-react";
import { Link, useParams } from "react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentViewer from "@/components/chats/document-viewer";
import HistoryDetailSkeleton from "@/components/chats/history-detail-skeleton";
import { useChatHistory } from "@/hooks/use-chat-history";
import type { HistoryData } from "../../types/history";
import { Link as LinkIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0">{icon}</div>
    <div className="space-y-1 w-full overflow-hidden">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm truncate max-w-full" title={value}>
              {value}
            </p>
          </TooltipTrigger>
          {/* <TooltipContent>
            <p className="max-w-xs break-all">{value}</p>
          </TooltipContent> */}
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
);

const JobDetailsCard = ({ historyData }: { historyData: HistoryData }) => (
  <Card className="md:col-span-1 max-w-md ">
    <CardHeader>
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
        value={historyData.status}
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

const DocumentsViewer = ({ historyData }: { historyData: HistoryData }) => (
  <Tabs defaultValue="resume" className="w-full">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="resume">Resume</TabsTrigger>
      <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
    </TabsList>
    <TabsContent value="resume" className="mt-4">
      <DocumentViewer
        document={historyData.generated.resumePath}
        documentType="resume"
      />
    </TabsContent>
    <TabsContent value="coverLetter" className="mt-4">
      <DocumentViewer
        document={historyData.generated.coverLetterPath}
        documentType="coverLetter"
      />
    </TabsContent>
  </Tabs>
);

const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-64">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">
      {error || "Unable to load history data"}
    </h2>
    <Button asChild>
      <Link to="/dashboard">Back to History</Link>
    </Button>
  </div>
);

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

  if (loading) return <HistoryDetailSkeleton />;
  if (error || !historyData) {
    return <ErrorState error={error || "Unknown error"} onRetry={retry} />;
  }

  return (
    <div className="space-y-6">
      <Header title={historyData.jobDetails.title || "Job Application"} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <JobDetailsCard historyData={historyData} />

        <Card className="md:col-span-2 ">
          <CardHeader>
            <CardTitle>Generated Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentsViewer historyData={historyData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
