import { cn } from "@/lib/utils"
import { JobCard } from "@/components/job-card"
import type { SourceBucket, SwipeState } from "@/types/job"
import { memo, useMemo } from "react"

interface JobContentProps {
  isMobile: boolean
  sourceBuckets: SourceBucket[]
  activeTab: number
  activeSources: number[]
  swipeState: SwipeState
  savedJobsInitialized: boolean
}

const GRID_COLUMNS_MAP = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
} as const

const MAX_COLUMNS = 5

export const JobContent = memo(function JobContent({
  isMobile,
  sourceBuckets,
  activeTab,
  activeSources,
  swipeState,
  savedJobsInitialized,
}: JobContentProps) {
  const gridColsClass = useMemo(() => {
    const columnCount = Math.min(activeSources.length || 1, MAX_COLUMNS) as keyof typeof GRID_COLUMNS_MAP
    return GRID_COLUMNS_MAP[columnCount]
  }, [activeSources.length])

  const swipeTransform = useMemo(() => {
    switch (swipeState.swipeDirection) {
      case "left":
        return "translate-x-[-8px]"
      case "right":
        return "translate-x-[8px]"
      default:
        return ""
    }
  }, [swipeState.swipeDirection])

  return (
    <div className={cn("transition-transform bg-background duration-150 ease-out", swipeTransform)}>
      {isMobile ? (
        <MobileJobContent
          sourceBuckets={sourceBuckets}
          activeTab={activeTab}
          savedJobsInitialized={savedJobsInitialized}
        />
      ) : (
        <DesktopJobContent
          sourceBuckets={sourceBuckets}
          activeSources={activeSources}
          gridColsClass={gridColsClass}
          savedJobsInitialized={savedJobsInitialized}
        />
      )}
    </div>
  )
})

interface MobileJobContentProps {
  sourceBuckets: SourceBucket[]
  activeTab: number
  savedJobsInitialized: boolean
}

const MobileJobContent = memo(function MobileJobContent({
  sourceBuckets,
  activeTab,
  savedJobsInitialized,
}: MobileJobContentProps) {
  const currentBucket = useMemo(() => {
    if (sourceBuckets.length === 0 || activeTab >= sourceBuckets.length) {
      return null
    }
    return sourceBuckets[activeTab]
  }, [sourceBuckets, activeTab])

  if (!currentBucket) {
    return <div className="p-4 text-center text-muted-foreground">No content available</div>
  }

  return (
    <section className="relative touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
      <div
        className="p-4 overflow-y-auto"
        role="tabpanel"
        id={`tab-panel-${currentBucket.id}`}
        aria-labelledby={`tab-${currentBucket.id}`}
      >
        <JobList jobs={currentBucket.jobs} savedJobsInitialized={savedJobsInitialized} />
      </div>
    </section>
  )
})

interface DesktopJobContentProps {
  sourceBuckets: SourceBucket[]
  activeSources: number[]
  gridColsClass: string
  savedJobsInitialized: boolean
}

const DesktopJobContent = memo(function DesktopJobContent({
  sourceBuckets,
  activeSources,
  gridColsClass,
  savedJobsInitialized,
}: DesktopJobContentProps) {
  const activeBuckets = useMemo(() => {
    return activeSources.map((sourceIndex) => sourceBuckets[sourceIndex]).filter(Boolean)
  }, [sourceBuckets, activeSources])

  if (activeSources.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <div className="col-span-full p-6 text-center text-muted-foreground">
          Select at least one source to view jobs
        </div>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4", gridColsClass)}>
      {activeBuckets.map((bucket) => (
        <SourceColumn key={bucket.id} bucket={bucket} savedJobsInitialized={savedJobsInitialized} />
      ))}
    </div>
  )
})

interface SourceColumnProps {
  bucket: SourceBucket
  savedJobsInitialized: boolean
}

const SourceColumn = memo(function SourceColumn({ bucket, savedJobsInitialized }: SourceColumnProps) {
  return (
    <div className="p-6">
      <h3 className="font-medium text-lg mb-4 text-foreground">{bucket.title}</h3>
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-hide">
        <JobList jobs={bucket.jobs} savedJobsInitialized={savedJobsInitialized} />
      </div>
    </div>
  )
})

interface JobListProps {
  jobs: SourceBucket["jobs"]
  savedJobsInitialized: boolean
}

const JobList = memo(function JobList({ jobs, savedJobsInitialized }: JobListProps) {
  if (jobs.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No jobs found</div>
  }

  return (
    <div className="space-y-4">
      {jobs.map((job, idx) => (
        <JobCard
          key={job.id ? `${job.id}-${idx}` : `${job.link}-${idx}`}
          job={job}
          savedJobsInitialized={savedJobsInitialized}
        />
      ))}
    </div>
  )
})
