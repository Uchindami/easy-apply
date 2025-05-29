"use client"

import { useEffect, useRef } from "react"
import { useProfileStore } from "@/store/profile-store"
import { shouldAutoFetchRecommendations } from "@/services/profile-services"

interface UseAutoFetchProps {
  onFetch: () => void
  hasData: boolean
  isLoading: boolean
}

export function useAutoFetchRecommendations({ onFetch, hasData, isLoading }: UseAutoFetchProps) {
  const { user, recommendation, isInitialized } = useProfileStore()
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    const shouldFetch = shouldAutoFetchRecommendations(user, recommendation, isInitialized, isLoading, hasData)

    if (shouldFetch && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      onFetch()
    }

    // Reset the flag when conditions change
    if (!shouldFetch) {
      hasFetchedRef.current = false
    }
  }, [user, recommendation, isInitialized, isLoading, hasData, onFetch])

  return { hasAutoFetched: hasFetchedRef.current }
}
