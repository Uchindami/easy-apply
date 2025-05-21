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

export default function SmartSuggestions() {
  const sourceBuckets = useJobStore((state) => state.sourceBuckets);
  const hasInitialized = useJobStore((state) => state.hasInitialized);
  const savedJobs = useSavedJobsStore((state) => state.savedJobs);
  const isLoadingSavedJobs = useSavedJobsStore((state) => state.isLoading);
  const fetchSavedJobs = useSavedJobsStore((state) => state.fetchSavedJobs);
  const [activeTab, setActiveTab] = useState(0); // For mobile view
  const [activeSources, setActiveSources] = useState<number[]>([]); // For desktop view
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedJobsDrawerOpen, setSavedJobsDrawerOpen] = useState(false);
  const [savedJobsInitialized, setSavedJobsInitialized] = useState(false);

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

  // Fetch saved jobs as early as possible
  useEffect(() => {
    // Load saved jobs from Firebase
    fetchSavedJobs()
      .then(() => {
        setSavedJobsInitialized(true);
      })
      .catch((error) => {
        console.error("Error fetching saved jobs:", error);
        setSavedJobsInitialized(true); // Still mark as initialized even on error
      });
  }, [fetchSavedJobs]);

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
