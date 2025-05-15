import { db } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore"
import { updateSourceBucket } from "@/store/job-store"
import type { Job } from "@/types/job"

const sources = [
  { id: "careersmw", title: "Careers Malawi" },
  { id: "jobsearchmalawi", title: "Job Search Malawi" },
  { id: "ntchito", title: "Nchito" },
  { id: "unicef-careers", title: "UNICEF Careers" },
  { id: "opportunitiesforyouth", title: "Opportunities for Youth" },
]

/**
 * Start real-time listeners for each job source
 * @returns A function to unsubscribe from all listeners
 */
export function listenToJobListings(): () => void {
  const unsubscribers: Unsubscribe[] = []

  try {
    sources.forEach(({ id, title }) => {
      const listingsRef = collection(db, "jobs", id, "listings")
      const q = query(listingsRef, orderBy("uploadedAt", "desc"), limit(12))

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          try {
            const jobs: Job[] = snapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                link: data.link || "",
                companyLogo: data.companyLogo || "",
                position: data.position || "",
                companyName: data.companyName || "",
                location: data.location || "",
                jobType: data.jobType || "",
                datePosted: data.datePosted || "",
                applicationDeadline: data.applicationDeadline || "",
                source: data.source || id,
              }
            })

            updateSourceBucket({
              id,
              title,
              jobs,
            })
          } catch (error) {
            console.error(`Error processing jobs for source "${id}":`, error)
            // Update with empty jobs array to prevent UI from waiting indefinitely
            updateSourceBucket({
              id,
              title,
              jobs: [],
            })
          }
        },
        (error) => {
          console.error(`Error listening to jobs for source "${id}":`, error)
          // Update with empty jobs array on error
          updateSourceBucket({
            id,
            title,
            jobs: [],
          })
        },
      )

      unsubscribers.push(unsubscribe)
    })
  } catch (error) {
    console.error("Error setting up job listeners:", error)
  }

  // Return a cleanup function that unsubscribes from all listeners
  return () => {
    unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe()
      } catch (error) {
        console.error("Error unsubscribing from job listener:", error)
      }
    })
  }
}

/**
 * Fetch jobs for a specific source
 * @param sourceId The ID of the source to fetch jobs for
 * @returns A function to unsubscribe from the listener
 */
export function listenToSourceJobs(sourceId: string): Unsubscribe | undefined {
  try {
    const source = sources.find((s) => s.id === sourceId)
    if (!source) {
      console.error(`Source with ID "${sourceId}" not found`)
      return undefined
    }

    const listingsRef = collection(db, "jobs", sourceId, "listings")
    const q = query(listingsRef, orderBy("uploadedAt", "desc"), limit(12))

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const jobs: Job[] = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              link: data.link || "",
              companyLogo: data.companyLogo || "",
              position: data.position || "",
              companyName: data.companyName || "",
              location: data.location || "",
              jobType: data.jobType || "",
              datePosted: data.datePosted || "",
              applicationDeadline: data.applicationDeadline || "",
              source: data.source || sourceId,
            }
          })

          updateSourceBucket({
            id: sourceId,
            title: source.title,
            jobs,
          })
        } catch (error) {
          console.error(`Error processing jobs for source "${sourceId}":`, error)
          updateSourceBucket({
            id: sourceId,
            title: source.title,
            jobs: [],
          })
        }
      },
      (error) => {
        console.error(`Error listening to jobs for source "${sourceId}":`, error)
        updateSourceBucket({
          id: sourceId,
          title: source.title,
          jobs: [],
        })
      },
    )
  } catch (error) {
    console.error(`Error setting up listener for source "${sourceId}":`, error)
    return undefined
  }
}

/**
 * Get all available job sources
 */
export function getJobSources(): { id: string; title: string }[] {
  return [...sources]
}
