"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Bookmark,
  Trash2,
  Clock,
  MapPin,
  Building,
  ExternalLink,
  X,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import { useSavedJobsStore } from "@/store/saved-jobs-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobCard } from "./job-card";

interface SavedJobsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SortOption = "date" | "company" | "position";

// Extracted components for better organization
const LoadingSkeleton = () => (
  <div className="p-6 space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i} className="p-4">
        <div className="flex gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
    <div className="p-3 rounded-full bg-destructive/10 mb-4">
      <AlertTriangle className="h-8 w-8 text-destructive" />
    </div>
    <h3 className="font-semibold text-lg mb-2">Something went wrong</h3>
    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
      We couldn't load your saved jobs. Please try again.
    </p>
    <Button onClick={onRetry} className="gap-2">
      <RefreshCw className="h-4 w-4" />
      Try Again
    </Button>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
    <div className="p-4 rounded-full bg-muted/50 mb-4">
      <Bookmark className="h-12 w-12 text-muted-foreground/50" />
    </div>
    <h3 className="font-semibold text-lg mb-2">No saved jobs yet</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Start saving jobs you're interested in and they'll appear here for easy
      access.
    </p>
  </div>
);

const NoSearchResults = () => (
  <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
    <div className="p-3 rounded-full bg-muted/50 mb-4">
      <Search className="h-8 w-8 text-muted-foreground/50" />
    </div>
    <h3 className="font-semibold mb-2">No jobs found</h3>
    <p className="text-sm text-muted-foreground">
      Try adjusting your search terms
    </p>
  </div>
);

const SearchAndFilter = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}) => (
  <div className="px-2 py-2 border-b bg-muted/30">
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSortChange("date")}>
            Sort by Date
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("company")}>
            Sort by Company
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("position")}>
            Sort by Position
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

const JobsList = ({
  jobs,
  searchQuery,
  onClearAll,
}: {
  jobs: any[];
  searchQuery: string;
  onClearAll: () => void;
}) => {
  const handleViewJob = useCallback((url: string) => {
    window.open(url, "_blank");
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">
          {searchQuery ? `Search Results (${jobs.length})` : "Your Saved Jobs"}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onClearAll}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isSidebarSaved= {true}
          />
        ))}
      </div>
    </div>
  );
};

const ClearAllConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  jobCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  jobCount: number;
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Clear all saved jobs?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently remove all{" "}
          {jobCount} saved jobs from your list.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-destructive hover:bg-destructive/90"
        >
          Clear All Jobs
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// Custom hook for job filtering and sorting logic
const useJobFiltering = (
  jobs: any[],
  searchQuery: string,
  sortBy: SortOption
) => {
  return useMemo(() => {
    const filtered = jobs.filter(
      (job) =>
        job.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "company":
          return a.companyName.localeCompare(b.companyName);
        case "position":
          return a.position.localeCompare(b.position);
        case "date":
        default:
          return (
            new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
          );
      }
    });
  }, [jobs, searchQuery, sortBy]);
};

// Main component
export function SavedJobsDrawer({ open, onOpenChange }: SavedJobsDrawerProps) {
  const {
    savedJobs,
    isLoading,
    error,
    fetchSavedJobs,
    unsaveJob,
    clearAllSavedJobs,
  } = useSavedJobsStore();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const { toast } = useToast();

  const filteredJobs = useJobFiltering(savedJobs, searchQuery, sortBy);

  const showToast = useCallback(
    (title: string, description: string, variant?: "destructive") => {
      toast({ title, description, variant });
    },
    [toast]
  );


  const handleClearAllJobs = useCallback(async () => {
    try {
      await clearAllSavedJobs();
      setIsConfirmDialogOpen(false);
      showToast("All jobs cleared", "All saved jobs have been removed");
    } catch (err) {
      showToast(
        "Error clearing jobs",
        err instanceof Error ? err.message : "Failed to clear saved jobs",
        "destructive"
      );
    }
  }, [clearAllSavedJobs, showToast]);

  const handleRetryLoading = useCallback(() => {
    fetchSavedJobs().catch((err) => {
      showToast(
        "Error loading saved jobs",
        err instanceof Error ? err.message : "Failed to load saved jobs",
        "destructive"
      );
    });
  }, [fetchSavedJobs, showToast]);

  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton />;
    if (error && !isLoading) return <ErrorState onRetry={handleRetryLoading} />;
    if (!isLoading && !error && savedJobs.length === 0) return <EmptyState />;
    if (
      !isLoading &&
      !error &&
      savedJobs.length > 0 &&
      filteredJobs.length === 0
    ) {
      return <NoSearchResults />;
    }
    if (!isLoading && !error && filteredJobs.length > 0) {
      return (
        <JobsList
          jobs={filteredJobs}
          searchQuery={searchQuery}
          onClearAll={() => setIsConfirmDialogOpen(true)}
        />
      );
    }
    return null;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:w-[480px] p-0 flex flex-col gap-0"
        >
          {/* Header */}
          <SheetHeader className=" border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bookmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Saved Jobs</h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    {isLoading
                      ? "Loading..."
                      : `${savedJobs.length} jobs saved`}
                  </p>
                </div>
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Search and Filter */}
          {savedJobs.length > 0 && !isLoading && !error && (
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{renderContent()}</div>
        </SheetContent>
      </Sheet>

      <ClearAllConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleClearAllJobs}
        jobCount={savedJobs.length}
      />
    </>
  );
}
