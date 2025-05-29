"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building,
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Loader2,
} from "lucide-react";
import { formatRelativeTime } from "@/utils/date-utils";
import { useSavedJobsStore } from "@/store/saved-jobs-store";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  savedJobsInitialized?: boolean;
}

export const JobCard = React.memo(function JobCard({
  job,
  savedJobsInitialized = false,
}: JobCardProps) {
  const { saveJob, unsaveJob, isJobSaved } = useSavedJobsStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showBookmark, setShowBookmark] = useState(false);

  const jobId =
    job.id ||
    `${job.link}-${job.position}-${job.companyName}`.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    );
  const isSaved = isJobSaved(jobId);

  // Only show bookmark icons after saved jobs have been initialized
  // This prevents the "flicker" effect on page reload
  useEffect(() => {
    if (savedJobsInitialized) {
      setShowBookmark(true);
    }
  }, [savedJobsInitialized]);

  const handleSaveToggle = async () => {
    setIsSaving(true);

    try {
      if (isSaved) {
        await unsaveJob(jobId);
        toast({
          title: "Job removed",
          description: "The job has been removed from your saved jobs",
          variant: "default",
        });
      } else {
        await saveJob({ ...job, id: jobId });
        toast({
          title: "Job saved",
          description: "The job has been added to your saved jobs",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: isSaved ? "Error removing job" : "Error saving job",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      className="overflow-hidden transition-all duration-200 hover:shadow-md group h-full"
      tabIndex={0}
      role="article"
      aria-label={`${job.position} at ${job.companyName}`}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 min-w-[40px] rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
            <img
              src={job.companyLogo || "/placeholder.svg?height=40&width=40"}
              alt={`${job.companyName} logo`}
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/placeholder.svg?height=40&width=40";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="font-medium group-hover:text-primary text-sm transition-colors truncate"
              title={job.position}
            >
              {job.position}
            </h3>
            <p className="text-sm text-gray-600 flex items-center">
              <Building className="h-3 w-3 min-w-[12px] mr-1" />
              <span className="truncate text-xs" title={job.companyName}>
                {job.companyName}
              </span>
            </p>
          </div>
          {showBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${
                isSaved ? "text-primary" : "text-gray-400 hover:text-primary"
              }`}
              onClick={handleSaveToggle}
              disabled={isSaving}
              aria-label={isSaved ? "Unsave job" : "Save job"}
              title={isSaved ? "Unsave job" : "Save job"}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge
            variant="default"
            className="bg-foreground/50 text-primary/90 hover:bg-primary/20 border-none max-w-full"
          >
            <span className="truncate text-xs" title={job.jobType}>
              {job.jobType}
            </span>
          </Badge>
        </div>

        <div className="mt-3 pt-3 border-t flex justify-between items-center">
          <div className="flex items-center text-xs text-gray-500 min-w-0 max-w-[60%]">
            <MapPin className="h-3 w-3 min-w-[12px] mr-1" />
            <span className="truncate text-xs" title={job.location}>
              {job.location}
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-500 ml-2">
            <Clock className="h-3 w-3 min-w-[12px] mr-1" />
            <span className="truncate text-xs" title={job.datePosted}>
              {formatRelativeTime(job.datePosted)}
            </span>
          </div>
        </div>

        <div className="text-xs pt-2 mt-auto">
          <Button
            variant="outline"
            size="icon"
            className="w-full group-hover:bg-primary/5 transition-colors"
            onClick={() => window.open(job.link, "_blank")}
            aria-label={`View job: ${job.position} at ${job.companyName}`}
          >
            View Job <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
});
