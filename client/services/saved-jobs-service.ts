import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  type DocumentData,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import type { Job, SavedJob } from "@/types/job";
import { useProfileStore } from "@/store/profile-store";

// Constants
const SAVED_JOBS_COLLECTION = "savedJobs";

const getCurrentUserId = (): string => {
  const { user } = useProfileStore.getState();
  if (!user || !user.uid) {
    throw new Error("User is not authenticated.");
  }
  return user.uid;
};

/**
 * Save a job to Firebase
 * @param job The job to save
 * @returns A promise that resolves when the job is saved
 */
export async function saveJobToFirebase(job: Job): Promise<SavedJob> {
  try {
    const userId = getCurrentUserId()
    const jobId = job.id || `${job.link}-${job.position}-${job.companyName}`.replace(/[^a-zA-Z0-9]/g, "-")

    const savedJob: SavedJob = {
      ...job,
      id: jobId,
      savedAt: new Date().toISOString(),
    }

    // Use the correct document reference structure
    const docRef = doc(db, "Users", userId, SAVED_JOBS_COLLECTION, jobId)

    await setDoc(docRef, {
      ...savedJob,
      createdAt: serverTimestamp(),
    })

    return savedJob
  } catch (error) {
    console.error("Error saving job to Firebase:", error)
    throw new Error("Failed to save job. Please try again later.")
  }
}
/**
 * Remove a saved job from Firebase
 * @param jobId The ID of the job to remove
 * @returns A promise that resolves when the job is removed
 */
export async function removeSavedJobFromFirebase(jobId: string): Promise<void> {
  const userId = getCurrentUserId();
  try {
    // const jobRef = doc(db, "Users", userId, SAVED_JOBS_COLLECTION, jobId);
    const docRef = doc(db, "Users", userId, SAVED_JOBS_COLLECTION, jobId)

    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error removing saved job from Firebase:", error);
    throw new Error("Failed to remove saved job. Please try again later.");
  }
}

/**
 * Get all saved jobs for the current user from Firebase
 * @returns A promise that resolves to an array of saved jobs
 */
export async function getSavedJobsFromFirebase(): Promise<SavedJob[]> {
  try {
    const userId = getCurrentUserId();

    // Use the correct collection reference structure
    const savedJobsRef = collection(db, "Users", userId, SAVED_JOBS_COLLECTION);
    const q = query(savedJobsRef, orderBy("createdAt", "desc"));

    const querySnapshot = await getDocs(q);
    const savedJobs: SavedJob[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData;
      savedJobs.push({
        id: doc.id,
        position: data.position || "",
        companyName: data.companyName || "",
        companyLogo: data.companyLogo || "",
        jobType: data.jobType || "",
        location: data.location || "",
        datePosted: data.datePosted || "",
        link: data.link || "",
        applicationDeadline: data.applicationDeadline || "",
        source: data.source || "",
        savedAt: data.savedAt || new Date().toISOString(),
      });
    });

    return savedJobs;
  } catch (error) {
    console.error("Error getting saved jobs from Firebase:", error);
    throw new Error("Failed to load saved jobs. Please try again later.");
  }
}

/**
 * Clear all saved jobs for the current user from Firebase
 * @returns A promise that resolves when all jobs are cleared
 */
export async function clearAllSavedJobsFromFirebase(): Promise<void> {
  try {
    const userId = getCurrentUserId()

    // Use the correct collection reference structure
    const savedJobsRef = collection(db, "Users", userId, SAVED_JOBS_COLLECTION)
    const q = query(savedJobsRef)

    const querySnapshot = await getDocs(q)

    // Use a batch to delete all documents
    const batch = writeBatch(db)
    querySnapshot.forEach((document) => {
      batch.delete(document.ref)
    })

    await batch.commit()
  } catch (error) {
    console.error("Error clearing all saved jobs from Firebase:", error)
    throw new Error("Failed to clear saved jobs. Please try again later.")
  }
}

/**
 * Check if a job is saved in Firebase
 * @param jobId The ID of the job to check
 * @returns A promise that resolves to a boolean indicating if the job is saved
 */
export async function isJobSavedInFirebase(jobId: string): Promise<boolean> {
  try {
    const userId = getCurrentUserId()

    // Use the correct document reference structure to check if it exists
    const docRef = doc(db, "Users", userId, SAVED_JOBS_COLLECTION, jobId)
    const docSnap = await getDocs(query(collection(docRef.parent, docRef.id)))

    return !docSnap.empty
  } catch (error) {
    console.error("Error checking if job is saved in Firebase:", error)
    // Return false on error to avoid blocking UI
    return false
  }
}

