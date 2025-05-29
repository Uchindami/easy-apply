"use client";

import { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

// Components
import { Header } from "@/components/Header";
import { ResumeUpload } from "@/components/resume-upload";
import { SavedJobsDrawer } from "@/components/saved-jobs-drawer";
import { Toaster } from "@/components/toaster";
import { PageHeader } from "@/components/recommendations/page-header";
import { JobsSection } from "@/components/recommendations/jobs-section";

// Hooks and Services
import { useAuthInitialization } from "@/hooks/use-auth-initialization";
import { fetchJobRecommendations } from "@/services/job-services";

// Store
import { useProfileStore } from "@/store/profile-store";
import { useSavedJobsStore } from "@/store/saved-jobs-store";

// Types
import type { RecommendationResponse } from "@/types/job";

// Custom hooks for better separation of concerns
const useSavedJobsInitialization = () => {
  const [savedJobsInitialized, setSavedJobsInitialized] = useState(false);
  const {
    savedJobs,
    isLoading: isLoadingSavedJobs,
    fetchSavedJobs,
  } = useSavedJobsStore();

  useEffect(() => {
    fetchSavedJobs()
      .then(() => setSavedJobsInitialized(true))
      .catch((error) => {
        console.error("Error fetching saved jobs:", error);
        setSavedJobsInitialized(true);
      });
  }, [fetchSavedJobs]);

  return { savedJobs, isLoadingSavedJobs, savedJobsInitialized };
};

const useRecommendations = () => {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    user,
    recommendation,
    clearRecommendation,
    isLoading: profileLoading,
    isInitialized,
    clearError,
    currentDocument,
  } = useProfileStore();

  const fetchRecommendations = useCallback(
    async (resumeFile?: File) => {
      if (!user) {
        setError("You must be logged in to get recommendations.");
        return;
      }

      setLoading(true);
      setError(null);
      clearError();

      try {
        const industryToSend = getIndustrySource(resumeFile, recommendation);

        if (!industryToSend) {
          setError("Please upload a resume to get recommendations.");
          return;
        }

        const response = await fetchJobRecommendations(
          user.uid,
          industryToSend
        );
        setData(response);
      } catch (err: any) {
        const errorMessage =
          err?.message || "Failed to load recommendations. Please try again.";
        setError(errorMessage);
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    },
    [user, recommendation, clearError]
  );

  const clearRecommendationData = useCallback(() => {
    clearRecommendation();
    setData(null);
    setError(null);
  }, [clearRecommendation]);

  // Auto-fetch recommendations when conditions are met
  useEffect(() => {
    const shouldAutoFetch =
      user && recommendation?.industry && isInitialized && !loading && !data;

    if (shouldAutoFetch) {
      fetchRecommendations();
    }
  }, [
    user,
    recommendation,
    isInitialized,
    loading,
    data,
    fetchRecommendations,
  ]);

  return {
    data,
    loading,
    error,
    user,
    recommendation,
    profileLoading,
    isInitialized,
    currentDocument,
    fetchRecommendations,
    clearRecommendationData,
  };
};

// Helper function
const getIndustrySource = (
  resumeFile?: File,
  recommendation?: any
): File | string | null => {
  if (resumeFile) return resumeFile;
  if (recommendation?.industry) return recommendation.industry;
  return null;
};

// UI Components
const LoadingScreen = ({
  savedJobs,
  isLoadingSavedJobs,
  setSavedJobsDrawerOpen,
}: {
  savedJobs: any[];
  isLoadingSavedJobs: boolean;
  setSavedJobsDrawerOpen: (open: boolean) => void;
}) => (
  <div className="min-h-screen bg-background">
    <Header
      title="Career Intelligence Hub"
      savedJobsButtonProps={{
        onClick: () => setSavedJobsDrawerOpen(true),
        isLoadingSavedJobs,
        savedJobsCount: savedJobs.length,
      }}
    />
    <div className="container mx-auto px-6 py-16 max-w-5xl">
      <div className="space-y-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const UploadScreen = ({
  fetchRecommendations,
  loading,
  error,
}: {
  fetchRecommendations: (file?: File) => Promise<void>;
  loading: boolean;
  error: string | null;
}) => (
  <div className="min-h-screen bg-background">
    <Header title="Career Intelligence Hub" />
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <ResumeUpload
        onUpload={fetchRecommendations}
        isLoading={loading}
        error={error}
      />
    </div>
  </div>
);

const ErrorAlert = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span className="dark:text-red-300">{error}</span>
      <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
);

const LoadingCard = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span>Analyzing your profile and finding the best matches...</span>
      </div>
    </CardContent>
  </Card>
);

const NoDataCard = ({
  onGetRecommendations,
}: {
  onGetRecommendations: () => void;
}) => (
  <Card>
    <CardContent className="text-center py-12">
      <Button onClick={onGetRecommendations}>Get Job Recommendations</Button>
    </CardContent>
  </Card>
);

// Main Component
export default function UserPage() {
  const [savedJobsDrawerOpen, setSavedJobsDrawerOpen] = useState(false);

  // Initialize auth
  useAuthInitialization();

  // Custom hooks
  const { savedJobs, isLoadingSavedJobs, savedJobsInitialized } =
    useSavedJobsInitialization();
  const {
    data,
    loading,
    error,
    recommendation,
    profileLoading,
    isInitialized,
    currentDocument,
    fetchRecommendations,
    clearRecommendationData,
  } = useRecommendations();

  // Render conditions
  const isInitializing = !isInitialized || profileLoading;
  const shouldShowUpload = !recommendation?.industry && !data;
  const shouldShowNoData =
    !loading && !data && !error && recommendation?.industry;

  if (isInitializing) {
    return (
      <LoadingScreen
        savedJobs={savedJobs}
        isLoadingSavedJobs={isLoadingSavedJobs}
        setSavedJobsDrawerOpen={setSavedJobsDrawerOpen}
      />
    );
  }

  if (shouldShowUpload) {
    return (
      <UploadScreen
        fetchRecommendations={fetchRecommendations}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Career Intelligence Hub"
        savedJobsButtonProps={{
          onClick: () => setSavedJobsDrawerOpen(true),
          isLoadingSavedJobs,
          savedJobsCount: savedJobs.length,
        }}
      />

      <div className="container px-6 py-16">
        <div className="space-y-12">
          <PageHeader
            recommendation={recommendation}
            currentDocument={currentDocument}
            onRefresh={fetchRecommendations}
            onChangeDocument={clearRecommendationData}
            isLoading={loading}
            canRefresh={loading || !recommendation?.industry}
          />

          {error && (
            <ErrorAlert error={error} onRetry={() => fetchRecommendations()} />
          )}

          {loading && <LoadingCard />}

          {data?.success && (
            <JobsSection
              data={data}
              hasInitialized={savedJobsInitialized}
              onRefresh={fetchRecommendations}
            />
          )}

          {shouldShowNoData && (
            <NoDataCard onGetRecommendations={() => fetchRecommendations()} />
          )}
        </div>
      </div>

      <SavedJobsDrawer
        open={savedJobsDrawerOpen}
        onOpenChange={setSavedJobsDrawerOpen}
      />

      <Toaster />
    </div>
  );
}
