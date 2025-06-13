"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building,
  MapPin,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Building2,
  User,
  Target,
  CheckCircle2,
  Mail,
  Eye,
} from "lucide-react";
import { formatRelativeTime } from "@/utils/date-utils";
import { useSavedJobsStore } from "@/store/saved-jobs-store";
import { useToast } from "@/hooks/use-toast";
import { getJobDetailsByUrl } from "@/services/job-services";
import type { Job } from "@/types/job";
import { useNavigate } from "react-router";

interface JobCardProps {
  job: Job;
  savedJobsInitialized?: boolean;
}

interface JobMoreInfo {
  requiredQualifications?: string[];
  purpose?: string;
  position?: string;
  keyResponsibilities?: string[];
  domain?: string;
  industry?: string;
  contactDetails?: string | Record<string, any>;
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({
  icon,
  label,
  value,
  className = "",
}) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <div className="flex-shrink-0 mt-0.5">{icon}</div>
    <div className="space-y-1 min-w-0 flex-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p
        className="text-sm font-medium leading-relaxed  text-black dark:text-white/90  break-words"
        title={value}
      >
        {value}
      </p>
    </div>
  </div>
);

const InfoSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      {icon}
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    </div>
    <div className="space-y-2 pl-6">{children}</div>
  </div>
);

const InfoList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map((item: string, index: number) => (
      <li key={index} className="flex items-start gap-2 text-sm">
        <CheckCircle2 className="h-3.5 w-3.5 text-black/25  dark:text-white/25 mt-0.5 flex-shrink-0" />
        <span className="leading-relaxed text-black dark:text-white/70 ">{item}</span>
      </li>
    ))}
  </ul>
);

export const JobCard = React.memo(function JobCard({
  job,
  savedJobsInitialized = false,
}: JobCardProps) {
  const { saveJob, unsaveJob, isJobSaved } = useSavedJobsStore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showBookmark, setShowBookmark] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [moreInfo, setMoreInfo] = useState<JobMoreInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const jobId =
    job.id ||
    `${job.link}-${job.position}-${job.companyName}`.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    );
  const isSaved = isJobSaved(jobId);

  // Only show bookmark icons after saved jobs have been initialized
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
          variant: "default",
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

  const handleTailorResume = () => {
    navigate("/dashboard", { state: { jobUrl: job.link } });
  };

  const handleLoadMoreInfo = async () => {
    if (moreInfo) return; // Don't reload if already loaded

    setLoading(true);
    setError(null);

    try {
      const info = await getJobDetailsByUrl(job.link);
      if (!info) {
        setError("No additional information found for this job.");
      } else {
        setMoreInfo(info);
      }
    } catch (e) {
      setError("Failed to load additional job information.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = (open: boolean) => {
    setIsModalOpen(open);
    if (open && !moreInfo && !loading) {
      handleLoadMoreInfo();
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
            {job.source === "jobsearchmalawi" ? (
              <img
                src={`https://corsproxy.io/?${job.companyLogo}`}
                alt={`${job.companyName} logo`}
                className="h-full w-full object-contain"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/40?text=Logo";
                }}
              />
            ) : (
              <img
                src={job.companyLogo || "/placeholder.svg"}
                alt={`${job.companyName} logo`}
                className="h-full w-full object-contain"
              />
            )}
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

        <div className="text-xs pt-2 mt-auto flex gap-1">
          <Button
            variant="link"
            size="sm"
            className="flex-1 bg-primary/6 hover:bg-primary/4 transition-colors"
            onClick={handleTailorResume}
            aria-label="Tailor resume for this job"
          >
            Apply
          </Button>

          <Dialog open={isModalOpen} onOpenChange={handleModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="link"
                size="sm"
                className="flex-1 bg-primary/6 hover:bg-primary/4 transition-colors"
                aria-label="View job details"
              >
                View <Eye className="ml-2 h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] lg:max-w-6xl sm:w-full">
              <DialogHeader className="shadow-sm ">
                <DialogTitle className="text-lg m-2 font-semibold textbla flex items-center gap-2">
                  {/* <Building2 className="h-5 w-5 text-black" /> */}
                  {job.position}
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                <div className="space-y-6">
                  {/* Basic Job Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DetailItem
                      icon={<Building2 className="h-4 w-4 text-blue-600" />}
                      label="Company"
                      value={job.companyName}
                    />
                    <DetailItem
                      icon={<MapPin className="h-4 w-4 text-green-600" />}
                      label="Location"
                      value={job.location}
                    />
                    <DetailItem
                      icon={<Clock className="h-4 w-4 text-orange-600" />}
                      label="Posted"
                      value={formatRelativeTime(job.datePosted)}
                    />
                    <DetailItem
                      icon={<Badge className="h-4 w-4 text-purple-600" />}
                      label="Job Type"
                      value={job.jobType}
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => window.open(job.link, "_blank")}
                      className="w-full max-w-xs"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Original Job Posting
                    </Button>
                  </div>

                  <Separator />

                  {/* Loading State */}
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Loading additional information...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Additional Information */}
                  {moreInfo && (
                    <div className="space-y-6">
                      <h3 className="text-base font-semibold text-foreground">
                        Additional Information
                      </h3>

                      {/* Position and Purpose */}
                      {(moreInfo.position || moreInfo.purpose) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {moreInfo.position && (
                            <DetailItem
                              icon={
                                <User className="h-4 w-4 text-indigo-600" />
                              }
                              label="Position"
                              value={moreInfo.position}
                            />
                          )}
                          {moreInfo.purpose && (
                            <DetailItem
                              icon={
                                <Target className="h-4 w-4 text-orange-600" />
                              }
                              label="Purpose"
                              value={moreInfo.purpose}
                            />
                          )}
                        </div>
                      )}

                      {/* Domain and Industry */}
                      {(moreInfo.domain || moreInfo.industry) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {moreInfo.domain && (
                            <DetailItem
                              icon={
                                <MapPin className="h-4 w-4 text-teal-600" />
                              }
                              label="Domain"
                              value={moreInfo.domain}
                            />
                          )}
                          {moreInfo.industry && (
                            <DetailItem
                              icon={
                                <Building2 className="h-4 w-4 text-cyan-600" />
                              }
                              label="Industry"
                              value={moreInfo.industry}
                            />
                          )}
                        </div>
                      )}

                      {/* Required Qualifications */}
                      {moreInfo.requiredQualifications &&
                        moreInfo.requiredQualifications.length > 0 && (
                          <InfoSection
                            title="Required Qualifications"
                            icon={
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            }
                          >
                            <InfoList items={moreInfo.requiredQualifications} />
                          </InfoSection>
                        )}

                      {/* Key Responsibilities */}
                      {moreInfo.keyResponsibilities &&
                        moreInfo.keyResponsibilities.length > 0 && (
                          <InfoSection
                            title="Key Responsibilities"
                            icon={<Target className="h-4 w-4 text-blue-600" />}
                          >
                            <InfoList items={moreInfo.keyResponsibilities} />
                          </InfoSection>
                        )}

                      {/* Contact Details */}
                      {moreInfo.contactDetails && (
                        <InfoSection
                          title="Contact Information"
                          icon={<Mail className="h-4 w-4 text-red-600" />}
                        >
                          <div className="text-sm text-black dark:text-white/70 bg-muted/50 p-3 rounded-md">
                            {typeof moreInfo.contactDetails === "string"
                              ? moreInfo.contactDetails
                              : JSON.stringify(
                                  moreInfo.contactDetails,
                                  null,
                                  2
                                )}
                          </div>
                        </InfoSection>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
});
