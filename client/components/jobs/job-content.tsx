import { cn } from "@/lib/utils"
import { JobCard } from "@/components/job-card"
import type { SourceBucket, SwipeState } from "@/types/job"
import { memo } from "react"

interface JobContentProps {
  isMobile: boolean
  sourceBuckets: SourceBucket[]
  activeTab: number
  activeSources: number[]
  swipeState: SwipeState
  savedJobsInitialized: boolean
}

export const JobContent = memo(function JobContent({
  isMobile,
  sourceBuckets,
  activeTab,
  activeSources,
  swipeState,
  savedJobsInitialized,
}: JobContentProps) {
  const getGridColsClass = () => {
    switch (Math.min(activeSources.length || 1, 5)) {
      case 1:
        return "grid-cols-1"
      case 2:
        return "grid-cols-2"
      case 3:
        return "grid-cols-3"
      case 4:
        return "grid-cols-4"
      case 5:
        return "grid-cols-5"
      default:
        return "grid-cols-1"
    }
  }

  return (
    <div
      className={cn(
        "transition-transform bg-background duration-150 ease-out",
        swipeState.swipeDirection === "left" && "translate-x-[-8px]",
        swipeState.swipeDirection === "right" && "translate-x-[8px]",
      )}
    >
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
          gridColsClass={getGridColsClass()}
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
  if (sourceBuckets.length === 0 || activeTab >= sourceBuckets.length) {
    return null
  }

  const currentBucket = sourceBuckets[activeTab]

  return (
    <div
      className="relative"
      style={{ 
        touchAction: "pan-y pinch-zoom",
        WebkitOverflowScrolling: "touch" 
      }}
    >
      <div
        className="p-4 overflow-y-auto"
        role="tabpanel"
        id={`tab-panel-${currentBucket.id}`}
        aria-labelledby={`tab-${currentBucket.id}`}
      >
        <div className="space-y-4">
          {currentBucket.jobs.length === 0 ? (
            <div className="text-center text-gray-400">No jobs found.</div>
          ) : (
            currentBucket.jobs.map((job, idx) => (
              <JobCard key={`${job.id || job.link}-${idx}`} job={job} savedJobsInitialized={savedJobsInitialized} />
            ))
          )}
        </div>
      </div>
    </div>
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
  if (activeSources.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <div className="col-span-full p-6 text-center text-gray-500">Select at least one source to view jobs</div>
      </div>
    )
  }

  return (
    <div className={`grid ${gridColsClass} gap-4`}>
      {activeSources.map((sourceIndex) => {
        const bucket = sourceBuckets[sourceIndex]
        if (!bucket) return null

        return (
          <div key={bucket.id} className="p-6">
            <h3 className="font-medium text-lg mb-4">{bucket.title}</h3>
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {bucket.jobs.length === 0 ? (
                <div className="text-center text-gray-400">No jobs found.</div>
              ) : (
                bucket.jobs.map((job, idx) => (
                  <JobCard key={`${job.id || job.link}-${idx}`} job={job} savedJobsInitialized={savedJobsInitialized} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
})