"use client";

import type React from "react";
import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  LinkIcon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  User,
  Mail,
  CheckCircle2,
  Target,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getJobDetailsByUrl } from "@/services/job-services";

// --- Types ---
export interface JobMoreInfoProps {
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

export interface JobDetailsCardProps {
  historyData: import("@/types/history").HistoryData;
}

// --- DetailItem subcomponent ---
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
        className="text-sm font-medium leading-relaxed break-words"
        title={value}
      >
        {value}
      </p>
    </div>
  </div>
);

// --- Section component for better organization ---
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

// --- List component for qualifications and responsibilities ---
const InfoList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map((item: string, index: number) => (
      <li key={index} className="flex items-start gap-2 text-sm">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
        <span className="leading-relaxed">{item}</span>
      </li>
    ))}
  </ul>
);

// --- Main JobDetailsCard ---
export const JobDetailsCard: React.FC<JobDetailsCardProps> = ({
  historyData,
}) => {
  const [moreInfo, setMoreInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLoadMoreInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await getJobDetailsByUrl(historyData.original.jobLink);
      if (!info) {
        setError("No additional information found for this job.");
      } else {
        setMoreInfo(info);
        setIsExpanded(true);
      }
    } catch (e) {
      setError("Failed to load additional job information.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "interview":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Job Application Details
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {historyData.jobDetails.title || "Job Application"}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`${getStatusColor(
              historyData.status || "Unknown"
            )} font-medium`}
          >
            {historyData.status || "Unknown"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem
            icon={<Building2 className="h-4 w-4 text-blue-600" />}
            label="Company"
            value={historyData.jobDetails.company || "Not specified"}
          />
          <DetailItem
            icon={<Calendar className="h-4 w-4 text-green-600" />}
            label="Applied On"
            value={
              historyData.timestamp
                ? format(historyData.timestamp, "PPP")
                : "Unknown date"
            }
          />
        </div>

        <DetailItem
          icon={<LinkIcon className="h-4 w-4 text-purple-600" />}
          label="Job Source"
          value={historyData.original.jobLink || "Not specified"}
        />

        {/* Load More Info Section */}
        {historyData.original.jobLink && !moreInfo && !error && (
          <>
            <Separator />
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMoreInfo}
                disabled={loading}
                className="w-full max-w-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Details...
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load Additional Information
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Additional Information */}
        {moreInfo && (
          <>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Additional Information
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isExpanded && (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                  {/* Position and Purpose */}
                  {(moreInfo.position || moreInfo.purpose) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {moreInfo.position && (
                        <DetailItem
                          icon={<User className="h-4 w-4 text-indigo-600" />}
                          label="Position"
                          value={moreInfo.position}
                        />
                      )}
                      {moreInfo.purpose && (
                        <DetailItem
                          icon={<Target className="h-4 w-4 text-orange-600" />}
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
                          icon={<MapPin className="h-4 w-4 text-teal-600" />}
                          label="Domain"
                          value={moreInfo.domain}
                        />
                      )}
                      {moreInfo.industry && (
                        <DetailItem
                          icon={<Building2 className="h-4 w-4 text-cyan-600" />}
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
                      <div className="text-sm bg-muted/50 p-3 rounded-md">
                        {typeof moreInfo.contactDetails === "string"
                          ? moreInfo.contactDetails
                          : JSON.stringify(moreInfo.contactDetails, null, 2)}
                      </div>
                    </InfoSection>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
