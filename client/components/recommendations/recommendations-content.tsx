import { ResumeUpload } from "@/components/recommendations/resume-uploader";
import { PageHeader } from "@/components/recommendations//page-header";
import { JobsSection } from "@/components/recommendations//jobs-section";
import { ErrorAlert } from "@/components/recommendations/error-alert";
import { LoadingCard } from "@/components/recommendations/loading-card";
import { NoDataCard } from "@/components/recommendations/no-data-card";
import { useRecommendations } from "@/hooks/use-job-recommendations";
import { useSavedJobsInitialization } from "@/hooks/use-saved-jobs-initialization";
import { motion } from "@/components/ui/motion";

export function RecommendationsContent() {
  // Custom hooks
  const { savedJobsInitialized } = useSavedJobsInitialization();
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
    return <LoadingScreen />;
  }

  if (shouldShowUpload) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <ResumeUpload
          onUpload={fetchRecommendations}
          isLoading={loading}
          error={error}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 md:space-y-12"
    >
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
    </motion.div>
  );
}

function LoadingScreen() {
  return (
    <div className="space-y-12">
      
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="h-40 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      <div className="space-y-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
