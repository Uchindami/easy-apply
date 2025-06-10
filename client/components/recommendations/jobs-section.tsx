import { Card, CardContent } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobCard } from "@/components/job-card"
import { motion } from "@/components/ui/motion"
import type { RecommendationResponse } from "@/types/job"

interface JobsSectionProps {
  data: RecommendationResponse
  hasInitialized: boolean
  onRefresh: () => void
}

type JobCategory = "Jobs" | "Education" | "Consultancy" | "Others"

interface CategorizedJobs {
  Jobs: any[]
  Education: any[]
  Consultancy: any[]
  Others: any[]
}

interface CategoryInfo {
  key: JobCategory
  label: string
  jobs: any[]
}

export function JobsSection({ data, hasInitialized, onRefresh }: JobsSectionProps) {
  const totalCount = data.matchedJobs ? data.matchedJobs.length : 0

  if (!data.matchedJobs || data.matchedJobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No job recommendations found. Try refreshing or uploading a different resume.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Function to sort jobs by uploadedAt date in descending order (newest first)
  const sortJobsByDate = (jobs: any[]) => {
    return [...jobs].sort((a, b) => {
      // Handle ISO date strings
      const dateA = new Date(a.datePosted || 0)
      const dateB = new Date(b.datePosted || 0)
      return dateB.getTime() - dateA.getTime() // Descending order (newest first)
    })
  }

  // Function to categorize jobs based on jobType
  const categorizeJob = (jobType: string): JobCategory => {
    const normalizedJobType = jobType?.toLowerCase().trim()

    // Jobs category
    if (["full time", "job vacancy malawi", "fixed contract","internship"].includes(normalizedJobType)) {
      return "Jobs"
    }

    // Education category
    if (["scholarships", "masters", "phd", "bachelors"].includes(normalizedJobType)) {
      return "Education"
    }

    // Consultancy category
    if (normalizedJobType === "consultancy" || normalizedJobType === "consultant") {
      return "Consultancy"
    }

    // Others category (default)
    return "Others"
  }

  // Categorize all jobs and sort each category by date
  const categorizedJobs: CategorizedJobs = data.matchedJobs.reduce(
    (acc, job) => {
      const category = categorizeJob(job.jobType)
      acc[category].push(job)
      return acc
    },
    {
      Jobs: [],
      Education: [],
      Consultancy: [],
      Others: [],
    } as CategorizedJobs,
  )

  // Sort each category by date in descending order
  Object.keys(categorizedJobs).forEach((category) => {
    categorizedJobs[category as JobCategory] = sortJobsByDate(categorizedJobs[category as JobCategory])
  })

  // Create array of categories with jobs (filter out empty categories)
  const availableCategories: CategoryInfo[] = [
    { key: "Jobs" as JobCategory, label: "Jobs", jobs: categorizedJobs.Jobs },
    { key: "Education" as JobCategory, label: "Education", jobs: categorizedJobs.Education },
    { key: "Consultancy" as JobCategory, label: "Consultancy", jobs: categorizedJobs.Consultancy },
    { key: "Others" as JobCategory, label: "Others", jobs: categorizedJobs.Others },
  ].filter((category) => category.jobs.length > 0)

  // Get the default tab (first available category)
  const defaultTab = availableCategories[0]?.key.toLowerCase() || "jobs"

  // Component to render jobs grid for a category
  const renderJobsGrid = (jobs: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job, index) => (
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
  )

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Recommended Opportunities</h2>
        <p className="text-sm text-muted-foreground mt-1">{totalCount} total matches across all categories</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:flex lg:w-auto">
          {availableCategories.map((category) => (
            <TabsTrigger key={category.key} value={category.key.toLowerCase()} className="flex items-center gap-2">
              <span>{category.label}</span>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {category.jobs.length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {availableCategories.map((category) => (
          <TabsContent key={category.key} value={category.key.toLowerCase()} className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{category.label} Opportunities</h3>
              <span className="text-sm text-muted-foreground">
                {category.jobs.length} {category.jobs.length === 1 ? "match" : "matches"}
              </span>
            </div>
            {renderJobsGrid(category.jobs)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}