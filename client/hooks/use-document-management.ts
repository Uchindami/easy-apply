"use client"

import { useCallback } from "react"
import { useProfileStore } from "@/store/profile-store"

export function useDocumentManagement() {
  const { currentDocument, recommendation, clearRecommendation, setCurrentDocument } = useProfileStore()

  const changeDocument = useCallback(() => {
    // Clear the recommendation.industry to trigger resume upload UI
    clearRecommendation()
  }, [clearRecommendation])

  const updateCurrentDocument = useCallback(
    (documentName: string) => {
      setCurrentDocument(documentName)
    },
    [setCurrentDocument],
  )

  return {
    currentDocument,
    recommendation,
    changeDocument,
    updateCurrentDocument,
    hasDocument: Boolean(currentDocument || recommendation?.industry),
  }
}
