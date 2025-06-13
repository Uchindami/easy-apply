import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useJobStore } from "@/store/job-store";
import { listenToJobListings } from "@/services/job-services";
import { useSwipe } from "@/hooks/use-swipe";
import { ErrorBoundary } from "@/components/error-boundary";
import { JobCard } from "@/components/job-card";
import { SavedJobsDrawer } from "@/components/saved-jobs-drawer";
import { useSavedJobsStore } from "@/store/saved-jobs-store";
import { Toaster } from "@/components/toaster";
import { useSavedJobsInitialization } from "@/hooks/use-saved-jobs-initialization";

export default function JobListingPlatform() {
  const sourceBuckets = useJobStore((state) => state.sourceBuckets);
  const hasInitialized = useJobStore((state) => state.hasInitialized);
  const savedJobs = useSavedJobsStore((state) => state.savedJobs);
  const isLoadingSavedJobs = useSavedJobsStore((state) => state.isLoading);
  const [activeTab, setActiveTab] = useState(0); // For mobile view
  const [activeSources, setActiveSources] = useState<number[]>([]); // For desktop view
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedJobsDrawerOpen, setSavedJobsDrawerOpen] = useState(false);
  const { savedJobsInitialized } = useSavedJobsInitialization();

  // Initialize active sources with first two sources when data is loaded
  useEffect(() => {
    if (sourceBuckets.length > 0 && activeSources.length === 0) {
      // Default to showing first two sources
      setActiveSources([0, 1].slice(0, Math.min(2, sourceBuckets.length)));
    }

    // Set loading state based on initialization
    if (hasInitialized) {
      setIsLoading(false);
    }
  }, [sourceBuckets, activeSources.length, hasInitialized]);

  // Listen to Firestore job updates
  useEffect(() => {
    const unsubscribe = listenToJobListings();

    // Set a timeout to stop showing loading state even if no data arrives
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      // Cleanup subscription and timeout when component unmounts
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const handlePrevTab = () => {
    setActiveTab((prev) => (prev > 0 ? prev - 1 : sourceBuckets.length - 1));
  };

  const handleNextTab = () => {
    setActiveTab((prev) => (prev < sourceBuckets.length - 1 ? prev + 1 : 0));
  };

  // Use the custom swipe hook
  const { touchHandlers, swipeState } = useSwipe(handleNextTab, handlePrevTab);
  const { swiping, swipeDirection } = swipeState;

  const toggleSource = (index: number) => {
    setActiveSources((prev) => {
      if (prev.includes(index)) {
        // Remove the source if it's already active
        return prev.filter((i) => i !== index);
      } else {
        // Add the source if it's not active
        return [...prev, index];
      }
    });
  };

  // Get the appropriate grid columns class based on active sources
  const getGridColsClass = () => {
    switch (Math.min(activeSources.length || 1, 5)) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      case 5:
        return "grid-cols-5";
      default:
        return "grid-cols-1";
    }
  };

  // If there are no sources yet, show loading state
  if (isLoading) {
    return (
      <ErrorBoundary>
        <>
          <Header title="Jobs from across the web in real time" />
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading job listings...</p>
          </div>
          <Toaster />
        </>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <>
        <Header
          title="Jobs from across the web in real time"
          savedJobsButtonProps={{
            onClick: () => setSavedJobsDrawerOpen(true),
            isLoadingSavedJobs,
            savedJobsCount: savedJobs.length,
          }}
        />
        <div
          ref={containerRef}
          className={cn(
            "w-full mt-2.5 overflow-hidden",
            swiping && "cursor-grabbing"
          )}
          {...touchHandlers}
        >
          {/* Tab navigation */}
          <div className={cn("border-b mb-2.5", isMobile ? "p-2" : "p-4")}>
            {isMobile ? (
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevTab}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="Previous tab"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div
                  className="flex space-x-1"
                  role="tablist"
                  aria-label="Job sources"
                >
                  {sourceBuckets.map((bucket, index) => (
                    <div
                      key={bucket.id}
                      role="tab"
                      aria-selected={activeTab === index}
                      aria-controls={`tab-panel-${bucket.id}`}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        activeTab === index ? "bg-foreground" : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextTab}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="Next tab"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-center space-x-4">
                {sourceBuckets.map((category, index) => (
                  <Button
                    key={category.id}
                    variant={
                      activeSources.includes(index) ? "default" : "outline"
                    }
                    className={cn(
                      "px-6 py-2 font-medium transition-all",
                      activeSources.includes(index)
                        ? "bg-foreground text-white"
                        : "text-primary"
                    )}
                    onClick={() => toggleSource(index)}
                    aria-pressed={activeSources.includes(index)}
                  >
                    {category.title}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Content area */}
          <div
            className={cn(
              "transition-all bg-background duration-300 ease-in-out",
              swipeDirection === "left" && "translate-x-[-20px]",
              swipeDirection === "right" && "translate-x-[20px]"
            )}
          >
            {isMobile &&
              sourceBuckets.length > 0 &&
              activeTab < sourceBuckets.length && (
                <div
                  className="p-4"
                  role="tabpanel"
                  id={`tab-panel-${sourceBuckets[activeTab].id}`}
                  aria-labelledby={`tab-${sourceBuckets[activeTab].id}`}
                >
                  <div className="space-y-4">
                    {sourceBuckets[activeTab].jobs.length === 0 && (
                      <div className="text-center text-gray-400">
                        No jobs found.
                      </div>
                    )}
                    {sourceBuckets[activeTab].jobs.map((job, idx) => (
                      <JobCard
                        key={`${job.link}-${idx}`}
                        job={job}
                        savedJobsInitialized={savedJobsInitialized}
                      />
                    ))}
                  </div>
                </div>
              )}

            {!isMobile && (
              <div className={`grid ${getGridColsClass()} gap-4`}>
                {activeSources.length === 0 ? (
                  <div className="col-span-full p-6 text-center text-gray-500">
                    Select at least one source to view jobs
                  </div>
                ) : (
                  activeSources.map((sourceIndex) => (
                    <div key={sourceBuckets[sourceIndex].id} className="p-6">
                      <h3 className="font-medium text-lg mb-4">
                        {sourceBuckets[sourceIndex].title}
                      </h3>
                      <div className="space-y-4">
                        {sourceBuckets[sourceIndex].jobs.length === 0 && (
                          <div className="text-center text-gray-400">
                            No jobs found.
                          </div>
                        )}
                        {sourceBuckets[sourceIndex].jobs.map((job, idx) => (
                          <JobCard
                            key={`${job.link}-${idx}`}
                            job={job}
                            savedJobsInitialized={savedJobsInitialized}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Saved Jobs Drawer (instead of Sidebar) */}
        <SavedJobsDrawer
          open={savedJobsDrawerOpen}
          onOpenChange={setSavedJobsDrawerOpen}
        />

        {/* Toast notifications */}
        <Toaster />
      </>
    </ErrorBoundary>
  );
}
