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
import type { Job, RecommendationResponse } from "@/types/job"

const JOB_SOURCES = [
  { id: "careersmw", title: "Careers Malawi" },
  { id: "jobsearchmalawi", title: "Job Search Malawi" },
  { id: "ntchito", title: "Nchito" },
  { id: "unicef-careers", title: "UNICEF Careers" },
  { id: "opportunitiesforyouth", title: "Opportunities for Youth" },
] as const

type JobSource = (typeof JOB_SOURCES)[number]

const transformJobData = (doc: DocumentData, sourceId: string): Job => {
  const data = doc.data()
  return {
    id: doc.id,
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
}

export function listenToJobListings(): () => void {
  const unsubscribers: Unsubscribe[] = []

  try {
    JOB_SOURCES.forEach(({ id, title }) => {
      const listingsRef = collection(db, "jobs", id, "listings")
      const q = query(listingsRef, orderBy("datePosted", "desc"), limit(20))

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          try {
            const jobs: Job[] = snapshot.docs.map((doc) => transformJobData(doc, id))
            updateSourceBucket({ id, title, jobs })
          } catch (error) {
            console.error(`Error processing jobs for source "${id}":`, error)
            updateSourceBucket({ id, title, jobs: [] })
          }
        },
        (error) => {
          console.error(`Error listening to jobs for source "${id}":`, error)
          updateSourceBucket({ id, title, jobs: [] })
        },
      )

      unsubscribers.push(unsubscribe)
    })
  } catch (error) {
    console.error("Error setting up job listeners:", error)
  }

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

export function listenToSourceJobs(sourceId: string): Unsubscribe | undefined {
  try {
    const source = JOB_SOURCES.find((s) => s.id === sourceId)
    if (!source) {
      console.error(`Source with ID "${sourceId}" not found`)
      return undefined
    }

    const listingsRef = collection(db, "jobs", sourceId, "listings")
    const q = query(listingsRef, orderBy("applicationDeadline", "desc"), limit(20))

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        try {
          const jobs: Job[] = snapshot.docs.map((doc) => transformJobData(doc, sourceId))
          updateSourceBucket({ id: sourceId, title: source.title, jobs })
        } catch (error) {
          console.error(`Error processing jobs for source "${sourceId}":`, error)
          updateSourceBucket({ id: sourceId, title: source.title, jobs: [] })
        }
      },
      (error) => {
        console.error(`Error listening to jobs for source "${sourceId}":`, error)
        updateSourceBucket({ id: sourceId, title: source.title, jobs: [] })
      },
    )
  } catch (error) {
    console.error(`Error setting up listener for source "${sourceId}":`, error)
    return undefined
  }
}

export function getJobSources(): readonly JobSource[] {
  return JOB_SOURCES
}

export async function fetchJobRecommendations(
  userId: string,
  resumeFile: File | string,
): Promise<RecommendationResponse> {
  try {
    const formData = new FormData()
    formData.append("userId", userId)

    if (typeof resumeFile === "string") {
      formData.append("resume", resumeFile)
    } else {
      formData.append("resumeFile", resumeFile)
    }
    
    if(typeof resumeFile === "string") {
      formData.append("requestType", "saved")
    } else{
      formData.append("requestType", "new")
    }

    const response = await fetch("http://localhost:8080/recommendations", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch recommendations: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching job recommendations:", error)
    throw error instanceof Error ? error : new Error("An unexpected error occurred while fetching recommendations")
  }
}
