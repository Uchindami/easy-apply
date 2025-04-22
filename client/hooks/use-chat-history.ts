"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useProfileStore } from "@/store/profile-store"
import { useChatStore } from "@/store/chat-store"

export function useChatHistory(chatId: string | undefined) {
  const { user } = useProfileStore()
  const { getChatById } = useChatStore()
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistoryData = useCallback(async () => {
    if (!user?.uid || !chatId) {
      setError("Invalid user or chat ID")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // First, try to get the chat title from the store
      await getChatById(user.uid, chatId)

      // Then fetch the full history data
      const historyRef = doc(db, "Users", user.uid, "History", chatId)
      const historySnap = await getDoc(historyRef)

      if (!historySnap.exists()) {
        setError("History not found")
        setLoading(false)
        return
      }

      const data = historySnap.data()
      setHistoryData({
        timestamp: data.timestamp?.toDate() || new Date(),
        status: data.status || "processing",
        original: data.original || { resumePath: "", jobLink: "" },
        generated: data.generated || { resumePath: "", coverLetterPath: "" },
        jobDetails: data.jobDetails || { title: "", company: "", source: "" },
      })
    } catch (err) {
      console.error("Error fetching history:", err)
      setError("Failed to load history data")
    } finally {
      setLoading(false)
    }
  }, [chatId, user, getChatById])

  useEffect(() => {
    fetchHistoryData()
  }, [fetchHistoryData])

  const retry = useCallback(() => {
    fetchHistoryData()
  }, [fetchHistoryData])

  return { historyData, loading, error, retry }
}
