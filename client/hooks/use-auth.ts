"use client"

import { useEffect, useRef } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useProfileStore } from "@/store/profile-store"
import { initializeUserProfile } from "@/services/profile-services"

export function useAuth() {
  const initializingRef = useRef(false)

  const {
    setUser,
    setInitialized,
    setLoading,
    setError,
    setPreferences,
    setRecommendation,
    setCurrentDocument,
    resetStore,
  } = useProfileStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      // Prevent multiple simultaneous initializations
      if (initializingRef.current) return

      if (user) {
        initializingRef.current = true
        setUser(user)
        setLoading(true)
        setError(null)

        try {
          const profile = await initializeUserProfile(user.uid)
          setPreferences(profile.Preferences)
          setRecommendation(profile.Recommendation || null)
          setCurrentDocument(profile.currentDocument || null)
        } catch (error) {
          console.error("Error initializing user profile:", error)
          setError(error instanceof Error ? error.message : "Failed to initialize profile")
        } finally {
          setLoading(false)
          setInitialized(true)
          initializingRef.current = false
        }
      } else {
        initializingRef.current = false
        resetStore()
        setInitialized(true)
        setLoading(false)
      }
    })

    return unsubscribe
  }, []) // Empty dependency array - only run once

  return useProfileStore((state) => ({
    user: state.user,
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
  }))
}
