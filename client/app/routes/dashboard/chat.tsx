import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { Briefcase, Globe, Calendar, Clock, FileText } from "lucide-react";
import { Link, useParams } from "react-router";
import { db } from "@/lib/firebase";
import { useProfileStore } from "@/store/profile-store";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentViewer from "@/components/chats/document-viewer";
import HistoryDetailSkeleton from "@/components/chats/history-detail-skeleton";

// Types
export interface HistoryData {
  timestamp: Date;
  status: "processing" | "completed" | "failed";
  original: {
    resumePath: string;
    jobLink: string;
  };
  generated: {
    resumePath: string;
    coverLetterPath: string;
  };
  jobDetails: {
    title: string;
    company: string;
    source: string;
  };
}

const LoadingState = () => <HistoryDetailSkeleton />;

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

const JobDetailsCard = ({ historyData }: { historyData: HistoryData }) => (
  <Card className="md:col-span-1">
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
        icon={<Globe className="h-5 w-5 text-gray-500 mt-0.5" />}
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
    {icon}
    <div>
      <p className="font-medium">{label}</p>
      <p className="text-gray-600">{value}</p>
    </div>
  </div>
);

const ProcessingState = () => (
  <div className="flex flex-col items-center justify-center h-64 space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    <p className="text-lg font-medium">Processing your application...</p>
    <p className="text-gray-500 text-center">
      We're generating your customized resume and cover letter. This may take a
      few minutes.
    </p>
  </div>
);

const FailedState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-64 space-y-4">
    <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
      <FileText className="h-6 w-6 text-red-500" />
    </div>
    <p className="text-lg font-medium text-red-600">Processing Failed</p>
    <p className="text-gray-500 text-center">
      We encountered an issue while generating your documents. Please try again.
    </p>
    <Button variant="outline" onClick={onRetry}>
      Retry Generation
    </Button>
  </div>
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

export default function ChatHistory() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useProfileStore();
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!user?.uid || !chatId) {
        setError("Invalid user or chat ID");
        setLoading(false);
        return;
      }

      try {
        const historyRef = doc(db, "Users", user.uid, "History", chatId);
        const historySnap = await getDoc(historyRef);

        if (!historySnap.exists()) {
          setError("History not found");
          setLoading(false);
          return;
        }

        const data = historySnap.data();
        setHistoryData({
          timestamp: data.timestamp?.toDate() || new Date(),
          status: data.status || "processing",
          original: data.original || {},
          generated: data.generated || {},
          jobDetails: data.jobDetails || {},
        });
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to load history data");
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [chatId, user]);

  const handleRetry = () => {
    // Implement retry logic here
    console.log("Retry generation");
  };

  if (loading) return <LoadingState />;
  if (error || !historyData)
    return (
      <ErrorState
        error={error || "Unknown error"}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="space-y-6">
      <Header title={historyData.jobDetails.title || "Job Application"} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <JobDetailsCard historyData={historyData} />

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Generated Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {historyData.status === "processing" ? (
              <ProcessingState />
            ) : historyData.status === "failed" ? (
              <FailedState onRetry={handleRetry} />
            ) : (
              <DocumentsViewer historyData={historyData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
