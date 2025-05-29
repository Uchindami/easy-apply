"use client"

import { useEffect } from "react"
import { initializeAuth, cleanupAuth } from "@/store/profile-store"

export const useAuthInitialization = () => {
  useEffect(() => {
    initializeAuth()
    return cleanupAuth
  }, [])
}
