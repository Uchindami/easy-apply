import { Card, CardContent } from "../ui/card";
import { JobCard } from "@/components/job-card";
import { motion } from "@/components/ui/motion";
import type { RecommendationResponse } from "@/types/job";

interface JobsSectionProps {
  data: RecommendationResponse;
  hasInitialized: boolean;
  onRefresh: () => void;
}

export function JobsSection({
  data,
  hasInitialized,
  onRefresh,
}: JobsSectionProps) {
  const totalCount = data.matchedJobs ? data.matchedJobs.length : 0;
  if (!data.matchedJobs || data.matchedJobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No job recommendations found. Try refreshing or uploading a
            different resume.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
        Recommended Oppotunities
        <p className="text-sm text-muted-foreground">
          {totalCount} total matches
        </p>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.matchedJobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <JobCard job={job} savedJobsInitialized={hasInitialized} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
