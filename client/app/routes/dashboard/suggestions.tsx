"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useJobStore } from "@/store/job-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  MapPin,
  Clock,
  ExternalLink,
  Tag,
  Bookmark,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date-utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Define job tag types
const jobTags = [
  "Remote",
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Customer Support",
  "Product",
  "Data Science",
  "Finance",
  "HR",
  "Legal",
  "Operations",
] as const;

type JobTag = (typeof jobTags)[number];

export default function SuggestedJobsPage() {
  const isMobile = useIsMobile();
  const { sourceBuckets } = useJobStore();
  const [selectedTags, setSelectedTags] = useState<JobTag[]>([]);
  const [viewMode, setViewMode] = useState<"suggested" | "saved">("suggested");
  const [savedJobs, setSavedJobs] = useState<any[]>([]);

  // Simulate loading suggested jobs based on selected tags
  const suggestedJobs = sourceBuckets.flatMap((bucket) =>
    bucket.jobs.filter(
      (job) =>
        selectedTags.length === 0 ||
        selectedTags.some(
          (tag) => job.jobType.includes(tag) || job.position.includes(tag)
        )
    )
  );

  // Load saved jobs from localStorage on component mount
  useEffect(() => {
    const savedJobsFromStorage = localStorage.getItem("savedJobs");
    if (savedJobsFromStorage) {
      setSavedJobs(JSON.parse(savedJobsFromStorage));
    }
  }, []);

  // Save jobs to localStorage when savedJobs changes
  useEffect(() => {
    localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
  }, [savedJobs]);

  const toggleTag = (tag: JobTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  const toggleSaveJob = (job: any) => {
    const isJobSaved = savedJobs.some((savedJob) => savedJob.link === job.link);

    if (isJobSaved) {
      setSavedJobs(savedJobs.filter((savedJob) => savedJob.link !== job.link));
    } else {
      setSavedJobs([...savedJobs, job]);
    }
  };

  const isJobSaved = (job: any) => {
    return savedJobs.some((savedJob) => savedJob.link === job.link);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Your Suggested Jobs" />

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="suggested" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="suggested"
              onClick={() => setViewMode("suggested")}
              className="text-sm sm:text-base"
            >
              Suggested Jobs
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              onClick={() => setViewMode("saved")}
              className="text-sm sm:text-base"
            >
              Saved Jobs ({savedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggested" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Job Tags
                </h2>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTags}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {jobTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedTags.includes(tag)
                        ? "bg-foreground text-white"
                        : "hover:bg-foreground/10"
                    )}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {selectedTags.length > 0
                    ? `Jobs matching your tags (${suggestedJobs.length})`
                    : `All suggested jobs (${suggestedJobs.length})`}
                </h2>
              </div>

              {suggestedJobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-500">
                    {selectedTags.length > 0
                      ? "No jobs match your selected tags. Try selecting different tags."
                      : "No suggested jobs available at the moment."}
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    "grid gap-4",
                    isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
                  )}
                >
                  {suggestedJobs.map((job, index) => (
                    <JobCard
                      key={`${job.link}-${index}`}
                      job={job}
                      isSaved={isJobSaved(job)}
                      onToggleSave={() => toggleSaveJob(job)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Your Saved Jobs ({savedJobs.length})
              </h2>

              {savedJobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-500">
                    You haven't saved any jobs yet. Browse suggested jobs and
                    click the bookmark icon to save them.
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    "grid gap-4",
                    isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
                  )}
                >
                  {savedJobs.map((job, index) => (
                    <JobCard
                      key={`${job.link}-${index}`}
                      job={job}
                      isSaved={true}
                      onToggleSave={() => toggleSaveJob(job)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function JobCard({
  job,
  isSaved,
  onToggleSave,
}: {
  job: any;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md group h-full">
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between">
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
                className="font-medium group-hover:text-primary transition-colors truncate"
                title={job.position}
              >
                {job.position}
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
                <Building className="h-3 w-3 min-w-[12px] mr-1" />
                <span className="truncate" title={job.companyName}>
                  {job.companyName}
                </span>
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              isSaved ? "text-primary" : "text-gray-400"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave();
            }}
            aria-label={isSaved ? "Unsave job" : "Save job"}
          >
            <Bookmark className={cn("h-5 w-5", isSaved && "fill-primary")} />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge
            variant="default"
            className="bg-foreground/50 text-primary/90 hover:bg-primary/20 border-none max-w-full"
          >
            <span className="truncate" title={job.jobType}>
              {job.jobType}
            </span>
          </Badge>
        </div>

        <div className="mt-3 pt-3 border-t flex justify-between items-center">
          <div className="flex items-center text-xs text-gray-500 min-w-0 max-w-[60%]">
            <MapPin className="h-3 w-3 min-w-[12px] mr-1" />
            <span className="truncate" title={job.location}>
              {job.location}
            </span>
          </div>
          <div className="flex items-center text-xs text-gray-500 ml-2">
            <Clock className="h-3 w-3 min-w-[12px] mr-1" />
            <span className="truncate" title={job.datePosted}>
              {formatRelativeTime(job.datePosted)}
            </span>
          </div>
        </div>

        <div className="pt-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full group-hover:bg-primary/5 transition-colors"
            onClick={() => window.open(job.link, "_blank")}
          >
            View Job <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
