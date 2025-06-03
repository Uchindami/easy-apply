import React, { useState } from "react";
import { Header } from "@/components/Header";
import { RecommendationsContent } from "@/components/recommendations/recommendations-content";
import { SavedJobsDrawer } from "@/components/saved-jobs-drawer";
import { useAuthInitialization } from "@/hooks/use-auth-initialization";
import { useSavedJobsStore } from "@/store/saved-jobs-store";

export default function UserPage() {
  const [savedJobsDrawerOpen, setSavedJobsDrawerOpen] = useState(false);
  const { savedJobs, isLoading: isLoadingSavedJobs } = useSavedJobsStore();

  // Initialize auth
  useAuthInitialization();

  return (
    <>
      <Header
        title="Career Intelligence Hub"
        savedJobsButtonProps={{
          onClick: () => setSavedJobsDrawerOpen(true),
          isLoadingSavedJobs,
          savedJobsCount: savedJobs.length,
        }}
      />

      <div className="container px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <RecommendationsContent />
      </div>

      <SavedJobsDrawer
        open={savedJobsDrawerOpen}
        onOpenChange={setSavedJobsDrawerOpen}
      />
    </>
  );
}
