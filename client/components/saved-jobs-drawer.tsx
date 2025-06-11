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
import { formatRelativeTime } from "@/utils/date-utils";
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
      Start saving jobs you're interested in and they'll appear here for easy access.
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

const JobCard = ({ 
  job, 
  onUnsave, 
  onViewJob 
}: { 
  job: any; 
  onUnsave: (id: string) => void;
  onViewJob: (url: string) => void;
}) => {
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48";
  }, []);

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-primary/20">
      <div className="p-4">
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
            <img
              src={job.companyLogo || "/placeholder.svg?height=48&width=48"}
              alt={`${job.companyName} logo`}
              className="h-full w-full object-contain"
              onError={handleImageError}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                  {job.position}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Building className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span className="truncate text-xs">{job.companyName}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onUnsave(job.id || "")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span className="truncate mr-4 text-xs">{job.location}</span>
              <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span className="truncate text-xs">
                {formatRelativeTime(job.datePosted)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 sm:flex-none text-xs"
                onClick={() => onViewJob(job.link)}
              >
                View Job
                <ExternalLink className="ml-2 h-4 w-4 text-xs" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

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
  <div className="px-6 py-4 border-b bg-muted/30">
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
  onUnsaveJob,
  onClearAll,
}: {
  jobs: any[];
  searchQuery: string;
  onUnsaveJob: (id: string) => void;
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
            onUnsave={onUnsaveJob}
            onViewJob={handleViewJob}
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
          return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
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

  const showToast = useCallback((title: string, description: string, variant?: "destructive") => {
    toast({ title, description, variant });
  }, [toast]);

  const handleUnsaveJob = useCallback(async (jobId: string) => {
    try {
      await unsaveJob(jobId);
      showToast("Job removed", "The job has been removed from your saved jobs");
    } catch (err) {
      showToast(
        "Error removing job",
        err instanceof Error ? err.message : "Failed to remove job",
        "destructive"
      );
    }
  }, [unsaveJob, showToast]);

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
    if (!isLoading && !error && savedJobs.length > 0 && filteredJobs.length === 0) {
      return <NoSearchResults />;
    }
    if (!isLoading && !error && filteredJobs.length > 0) {
      return (
        <JobsList
          jobs={filteredJobs}
          searchQuery={searchQuery}
          onUnsaveJob={handleUnsaveJob}
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
          className="w-full sm:w-[480px] p-0 flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bookmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Saved Jobs</h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    {isLoading ? "Loading..." : `${savedJobs.length} jobs saved`}
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
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
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