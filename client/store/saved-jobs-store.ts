import { create } from "zustand"
import type { Job, SavedJob } from "@/types/job"
import {
  saveJobToFirebase,
  removeSavedJobFromFirebase,
  getSavedJobsFromFirebase,
  clearAllSavedJobsFromFirebase,
} from "@/services/saved-jobs-service"

interface SavedJobsState {
  savedJobs: SavedJob[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchSavedJobs: () => Promise<void>
  saveJob: (job: Job) => Promise<void>
  unsaveJob: (jobId: string) => Promise<void>
  isJobSaved: (jobId: string) => boolean
  clearAllSavedJobs: () => Promise<void>

  // Local cache management (not persisted, just for runtime performance)
  cachedSavedJobIds: Set<string>
  addToLocalCache: (jobId: string) => void
  removeFromLocalCache: (jobId: string) => void
  clearLocalCache: () => void
}

// Helper to generate a unique ID for a job
const generateJobId = (job: Job): string => {
  return job.id || `${job.link}-${job.position}-${job.companyName}`.replace(/[^a-zA-Z0-9]/g, "-")
}

export const useSavedJobsStore = create<SavedJobsState>((set, get) => ({
  savedJobs: [],
  isLoading: false,
  error: null,
  cachedSavedJobIds: new Set<string>(),

  fetchSavedJobs: async () => {
    set({ isLoading: true, error: null })

    try {
      const jobs = await getSavedJobsFromFirebase()

      // Update the local cache with the fetched job IDs
      const jobIds = new Set(jobs.map((job) => job.id || ""))

      set({
        savedJobs: jobs,
        isLoading: false,
        cachedSavedJobIds: jobIds,
      })
    } catch (error) {
      console.error("Error fetching saved jobs:", error)
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load saved jobs",
      })
    }
  },

  saveJob: async (job: Job) => {
    const jobId = generateJobId(job)

    // Check if job is already saved in local cache
    if (get().cachedSavedJobIds.has(jobId)) return

    set({ isLoading: true, error: null })

    try {
      // Optimistically update UI
      const savedJob: SavedJob = {
        ...job,
        id: jobId,
        savedAt: new Date().toISOString(),
      }

      set((state) => ({
        savedJobs: [savedJob, ...state.savedJobs],
      }))

      // Add to local cache
      get().addToLocalCache(jobId)

      // Save to Firebase
      await saveJobToFirebase(job)

      set({ isLoading: false })
    } catch (error) {
      console.error("Error saving job:", error)

      // Revert optimistic update
      set((state) => ({
        savedJobs: state.savedJobs.filter((j) => j.id !== jobId),
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to save job",
      }))

      // Remove from local cache
      get().removeFromLocalCache(jobId)
    }
  },

  unsaveJob: async (jobId: string) => {
    set({ isLoading: true, error: null })

    try {
      // Optimistically update UI
      const previousJobs = [...get().savedJobs]

      set((state) => ({
        savedJobs: state.savedJobs.filter((job) => job.id !== jobId),
      }))

      // Remove from local cache
      get().removeFromLocalCache(jobId)

      // Remove from Firebase
      await removeSavedJobFromFirebase(jobId)

      set({ isLoading: false })
    } catch (error) {
      console.error("Error unsaving job:", error)

      // Revert optimistic update on error
      set((state) => ({
        savedJobs: state.savedJobs,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to remove saved job",
      }))

      // Re-add to local cache
      get().addToLocalCache(jobId)
    }
  },

  isJobSaved: (jobId: string) => {
    // Check local cache for performance
    return get().cachedSavedJobIds.has(jobId)
  },

  clearAllSavedJobs: async () => {
    set({ isLoading: true, error: null })

    try {
      // Optimistically update UI
      const previousJobs = [...get().savedJobs]

      set({ savedJobs: [] })

      // Clear local cache
      get().clearLocalCache()

      // Clear from Firebase
      await clearAllSavedJobsFromFirebase()

      set({ isLoading: false })
    } catch (error) {
      console.error("Error clearing saved jobs:", error)

      // Revert optimistic update on error
      set((state) => ({
        savedJobs: state.savedJobs,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to clear saved jobs",
      }))
    }
  },

  // Local cache management
  addToLocalCache: (jobId: string) => {
    set((state) => {
      const newCache = new Set(state.cachedSavedJobIds)
      newCache.add(jobId)
      return { cachedSavedJobIds: newCache }
    })
  },

  removeFromLocalCache: (jobId: string) => {
    set((state) => {
      const newCache = new Set(state.cachedSavedJobIds)
      newCache.delete(jobId)
      return { cachedSavedJobIds: newCache }
    })
  },

  clearLocalCache: () => {
    set({ cachedSavedJobIds: new Set() })
  },
}))
