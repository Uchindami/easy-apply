"use client";

import { useState, useCallback, useRef } from "react";
import { useProfileStore } from "@/store/profile-store";
import {
  getJobRecommendations,
  retryJobRecommendations,
  validateRecommendationRequest,
} from "@/services/profile-services";
import type { RecommendationResponse } from "@/types/job";

export function useJobRecommendations() {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const { user, recommendation, clearError } = useProfileStore();

  const fetchRecommendations = useCallback(
    async (resumeFile?: File) => {
      // Prevent multiple simultaneous requests
      if (loadingRef.current) return;

      // Validate the request
      const validation = validateRecommendationRequest(
        user,
        recommendation,
        resumeFile
      );

      if (!validation.isValid) {
        setError(validation.error || "Invalid request");
        return;
      }

      loadingRef.current = true;
      setLoading(true);
      setError(null);
      clearError();

      try {
        if (!user) {
          setError("User not found.");
          return;
        }
        const response = await getJobRecommendations(
          user.uid,
          validation.industryToSend!,
          resumeFile?.name
        );
        setData(response);
      } catch (err: any) {
        const errorMessage =
          err?.message || "Failed to load recommendations. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [user, recommendation, clearError] // Stable dependencies only
  );

  const retry = useCallback(async () => {
    if (!user || !recommendation || loadingRef.current) {
      if (!user || !recommendation) {
        setError("Cannot retry: missing user or recommendation data");
      }
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    clearError();

    try {
      const response = await retryJobRecommendations(user.uid, recommendation);
      setData(response);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to retry recommendations.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user, recommendation, clearError]); // Stable dependencies only

  return {
    data,
    loading,
    error,
    fetchRecommendations,
    retry,
    canFetch: Boolean(user && recommendation?.industry),
  };
}
