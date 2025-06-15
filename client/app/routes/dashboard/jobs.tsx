"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/Header";
import { useJobStore } from "@/store/job-store";
import { listenToJobListings } from "@/services/job-services";
import { useSwipe } from "@/hooks/use-swipe";
import { ErrorBoundary } from "@/components/error-boundary";
import { SavedJobsDrawer } from "@/components/saved-jobs-drawer";
import { useSavedJobsStore } from "@/store/saved-jobs-store";
import { Toaster } from "@/components/toaster";
import { useSavedJobsInitialization } from "@/hooks/use-saved-jobs-initialization";
import { MobileNavigation } from "@/components/jobs/mobile-navigation";
import { DesktopSourceButtons } from "@/components/jobs/desktop-source-buttons";
import { JobContent } from "@/components/jobs/job-content";

interface JobListingPlatformState {
  activeTab: number;
  activeSources: number[];
  isLoading: boolean;
  savedJobsDrawerOpen: boolean;
}

export default function JobListingPlatform() {
  const sourceBuckets = useJobStore((state) => state.sourceBuckets);
  const hasInitialized = useJobStore((state) => state.hasInitialized);
  const savedJobs = useSavedJobsStore((state) => state.savedJobs);
  const isLoadingSavedJobs = useSavedJobsStore((state) => state.isLoading);
  const { savedJobsInitialized } = useSavedJobsInitialization();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<JobListingPlatformState>({
    activeTab: 0,
    activeSources: [],
    isLoading: true,
    savedJobsDrawerOpen: false,
  });

  // Initialize active sources and loading state
  useEffect(() => {
    if (sourceBuckets.length > 0 && state.activeSources.length === 0) {
      setState((prev) => ({
        ...prev,
        activeSources: [0, 1].slice(0, Math.min(2, sourceBuckets.length)),
      }));
    }

    if (hasInitialized) {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [sourceBuckets.length, state.activeSources.length, hasInitialized]);

  // Listen to Firestore job updates
  useEffect(() => {
    const unsubscribe = listenToJobListings();
    const loadingTimeout = setTimeout(() => {
      setState((prev) => ({ ...prev, isLoading: false }));
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  // Memoize tab navigation handlers to prevent recreating on every render
  const handleTabNavigation = useMemo(() => ({
    prev: () =>
      setState((prev) => ({
        ...prev,
        activeTab:
          prev.activeTab > 0 ? prev.activeTab - 1 : sourceBuckets.length - 1,
      })),
    next: () =>
      setState((prev) => ({
        ...prev,
        activeTab:
          prev.activeTab < sourceBuckets.length - 1 ? prev.activeTab + 1 : 0,
      })),
  }), [sourceBuckets.length]);

  // Only use swipe handlers on mobile
  const { touchHandlers, swipeState } = useSwipe(
    handleTabNavigation.next,
    handleTabNavigation.prev
  );

  const toggleSource = (index: number) => {
    setState((prev) => ({
      ...prev,
      activeSources: prev.activeSources.includes(index)
        ? prev.activeSources.filter((i) => i !== index)
        : [...prev.activeSources, index],
    }));
  };

  const updateSavedJobsDrawer = (open: boolean) => {
    setState((prev) => ({ ...prev, savedJobsDrawerOpen: open }));
  };

  if (state.isLoading) {
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
          title="Jobs in real time"
          savedJobsButtonProps={{
            onClick: () => updateSavedJobsDrawer(true),
            isLoadingSavedJobs,
            savedJobsCount: savedJobs.length,
          }}
        />

        <div
          ref={containerRef}
          className="w-full mt-2.5 overflow-hidden"
        >
          {/* Navigation - Apply touch handlers only to mobile navigation */}
          <div className={cn("border-b mb-2.5", isMobile ? "p-2" : "p-4")}>
            {isMobile ? (
              <div {...touchHandlers}>
                <MobileNavigation
                  sourceBuckets={sourceBuckets}
                  activeTab={state.activeTab}
                  onPrevTab={handleTabNavigation.prev}
                  onNextTab={handleTabNavigation.next}
                />
              </div>
            ) : (
              <DesktopSourceButtons
                sourceBuckets={sourceBuckets}
                activeSources={state.activeSources}
                onToggleSource={toggleSource}
              />
            )}
          </div>

          {/* Content */}
          <JobContent
            isMobile={isMobile}
            sourceBuckets={sourceBuckets}
            activeTab={state.activeTab}
            activeSources={state.activeSources}
            swipeState={swipeState}
            savedJobsInitialized={savedJobsInitialized}
          />
        </div>

        <SavedJobsDrawer
          open={state.savedJobsDrawerOpen}
          onOpenChange={updateSavedJobsDrawer}
        />

        <Toaster />
      </>
    </ErrorBoundary>
  );
}