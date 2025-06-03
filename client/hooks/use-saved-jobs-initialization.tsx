import { useState, useEffect } from 'react';
import { useSavedJobsStore } from '../store/saved-jobs-store';

export function useSavedJobsInitialization() {
  const [savedJobsInitialized, setSavedJobsInitialized] = useState(false);
  const {
    savedJobs,
    isLoading: isLoadingSavedJobs,
    fetchSavedJobs,
  } = useSavedJobsStore();

  useEffect(() => {
    fetchSavedJobs()
      .then(() => setSavedJobsInitialized(true))
      .catch((error) => {
        console.error("Error fetching saved jobs:", error);
        setSavedJobsInitialized(true);
      });
  }, [fetchSavedJobs]);

  return { savedJobs, isLoadingSavedJobs, savedJobsInitialized };
}