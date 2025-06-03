import { useState, useEffect, useCallback } from "react";
import { useProfileStore } from "@/store/profile-store";
import { fetchJobRecommendations } from "@/services/job-services";
import type { RecommendationResponse } from "@/types/job";

// Helper function
const getIndustrySource = (
  resumeFile?: File,
  recommendation?: any
): File | string | null => {
  if (resumeFile) return resumeFile;
  if (recommendation?.industry) return recommendation.industry;
  return null;
};

export function useRecommendations() {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoFecht, setIsAutoFetch] = useState(false);

  const {
    user,
    recommendation,
    clearRecommendation,
    isLoading: profileLoading,
    fetchProfile,
    isInitialized,
    clearError,
    currentDocument,
  } = useProfileStore();

  const fetchRecommendations = useCallback(
    async (resumeFile?: File) => {
      if (!user) {
        setError("You must be logged in to get recommendations.");
        return;
      }

      setLoading(true);
      setError(null);
      clearError();

      try {
        const industryToSend = getIndustrySource(resumeFile, recommendation);

        if (!industryToSend) {
          setError("Please upload a resume to get recommendations.");
          setLoading(false);
          return;
        }

        const response = await fetchJobRecommendations(
          user.uid,
          industryToSend
        );

        if (!error && isAutoFecht) {
          // If not auto-fetching, fetch profile after recommendations
          await fetchProfile(); // Ensure profile is fetched after recommendations
          console.log("Profile fetched after recommendations.");
        }
        setData(response);
      } catch (err: any) {
        const errorMessage =
          err?.message || "Failed to load recommendations. Please try again.";
        setError(errorMessage);
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    },
    [user, recommendation, clearError]
  );

  const clearRecommendationData = useCallback(() => {
    clearRecommendation();
    setData(null);
    setError(null);
  }, [clearRecommendation]);

  // Auto-fetch recommendations when conditions are met
  useEffect(() => {
    const shouldAutoFetch =
      user && recommendation?.industry && isInitialized && !loading && !data;

    if (shouldAutoFetch) {
      setIsAutoFetch(true);
      fetchRecommendations();
    }
  }, [
    user,
    recommendation,
    isInitialized,
    loading,
    data,
    fetchRecommendations,
  ]);

  return {
    data,
    loading,
    error,
    user,
    recommendation,
    profileLoading,
    isInitialized,
    currentDocument,
    fetchRecommendations,
    clearRecommendationData,
  };
}
