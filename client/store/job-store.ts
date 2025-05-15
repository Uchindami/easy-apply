import { create } from "zustand"
import type { SourceBucket } from "@/types/job"

const initialBuckets: SourceBucket[] = [
  { id: "careersmw", title: "Careers Malawi", jobs: [] },
  { id: "jobsearchmalawi", title: "Job Search Malawi", jobs: [] },
  { id: "ntchito", title: "Nchito", jobs: [] },
  { id: "unicef-careers", title: "UNICEF Careers", jobs: [] },
  { id: "opportunitiesforyouth", title: "Opportunities for Youth", jobs: [] },
]

interface JobStoreState {
  sourceBuckets: SourceBucket[]
  updateSourceBucket: (bucket: SourceBucket) => void
  hasInitialized: boolean
}

export const useJobStore = create<JobStoreState>((set) => ({
  sourceBuckets: initialBuckets,
  hasInitialized: false,
  updateSourceBucket: (bucket) =>
    set((state) => ({
      sourceBuckets: state.sourceBuckets.map((b) => (b.id === bucket.id ? { ...b, jobs: bucket.jobs } : b)),
      hasInitialized: true,
    })),
}))

// Helper for external update (for use in job-services.ts)
export const updateSourceBucket = (bucket: SourceBucket): void => {
  try {
    const store = useJobStore.getState()
    if (store) {
      store.updateSourceBucket(bucket)
    } else {
      console.error("Failed to update source bucket: Store not initialized")
    }
  } catch (error) {
    console.error("Error updating source bucket:", error)
  }
}
