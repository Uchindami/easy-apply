import { db } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  doc,
  getDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { historyService } from "@/services/history-service"
import { create } from "zustand"
import type { HistoryData } from "@/types/history"

// =====================
// Types
// =====================
export interface Chat {
  id: string
  title: string
  timestamp?: Date
}

interface ChatState {
  chats: Chat[]
  isLoading: boolean
  isFetchingMore: boolean
  error: string | null
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
  fetchChats: (userId: string) => Promise<void>
  loadMoreChats: (userId: string) => Promise<void>
  getChatById: (userId: string, chatId: string) => Promise<Chat | null>

  updateChat: (userId: string, historyId: string, data:any) => Promise<void>;
  // deleteChat: (userId: string, historyId: string) => Promise<void>;
}

// =====================
// Helper Functions
// =====================

/**
 * Transforms a Firestore document into a Chat object.
 */
const transformChatData = (doc: QueryDocumentSnapshot<DocumentData>): Chat => {
  const data = doc.data()
  return {
    id: doc.id,
    title: data.jobDetails?.title || "Untitled Chat",
    timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : undefined,
  }
}

/**
 * Handles errors by logging and updating state.
 */
const handleError = (set: any, message: string, error: unknown, loadingKey: 'isLoading' | 'isFetchingMore') => {
  console.error(message, error)
  set({ error: message, [loadingKey]: false })
}

/**
 * Removes duplicate chats by id.
 */
function dedupeChats(chats: Chat[]): Chat[] {
  const seen = new Set<string>()
  return chats.filter(chat => {
    if (seen.has(chat.id)) return false
    seen.add(chat.id)
    return true
  })
}

// =====================
// Zustand Store
// =====================

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  isLoading: true,
  isFetchingMore: false,
  error: null,
  lastVisible: null,
  hasMore: true,

  /**
   * Fetches the initial batch of chats for a user.
   */
  fetchChats: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const historyRef = collection(db, "Users", userId, "History")
      const q = query(historyRef, orderBy("timestamp", "desc"), limit(5))
      const querySnapshot = await getDocs(q)
      const chats = querySnapshot.docs.filter((doc) => doc.exists()).map(transformChatData)
      set({
        chats: dedupeChats(chats),
        isLoading: false,
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === 5,
      })
    } catch (error) {
      handleError(set, "Failed to load chat history", error, 'isLoading')
    }
  },

  /**
   * Loads more chats for pagination.
   */
  loadMoreChats: async (userId: string) => {
    const { lastVisible, isFetchingMore, hasMore, chats: currentChats } = get()
    if (!lastVisible || isFetchingMore || !hasMore) return
    set({ isFetchingMore: true })
    try {
      const historyRef = collection(db, "Users", userId, "History")
      const q = query(historyRef, orderBy("timestamp", "desc"), startAfter(lastVisible), limit(5))
      const querySnapshot = await getDocs(q)
      const newChats = querySnapshot.docs.filter((doc) => doc.exists()).map(transformChatData)
      set((state) => ({
        chats: dedupeChats([...state.chats, ...newChats]),
        isFetchingMore: false,
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === 5,
      }))
    } catch (error) {
      handleError(set, "Failed to load more chats", error, 'isFetchingMore')
    }
  },

  /**
   * Gets a chat by its ID, fetching from Firestore if not already in state.
   */
  getChatById: async (userId: string, chatId: string) => {
    const { chats } = get()
    const existingChat = chats.find((chat) => chat.id === chatId)
    if (existingChat) return existingChat
    try {
      const chatRef = doc(db, "Users", userId, "History", chatId)
      const chatSnap = await getDoc(chatRef)
      if (!chatSnap.exists()) return null
      const chat = transformChatData(chatSnap as QueryDocumentSnapshot<DocumentData>)
      set((state) => ({ chats: dedupeChats([...state.chats, chat]) }))
      return chat
    } catch (error) {
      console.error("Error fetching chat by ID:", error)
      return null
    }
  },

  updateChat: async (userId, historyId, data) => {
    try {
      const updatedHistory = await historyService.updateHistory(userId, historyId, data);
      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === historyId ? transformToChat(updatedHistory, historyId) : chat
        ),
      }));
    } catch (error) {
      handleError(set, "Failed to update chat", error, "isLoading");
    }
  },

  // deleteChat: async (userId, historyId) => {
  //   try {
  //     await historyService.deleteHistory(userId, historyId);
  //     set(state => ({
  //       chats: state.chats.filter(chat => chat.id !== historyId),
  //     }));
  //   } catch (error) {
  //     handleError(set, "Failed to delete chat", error, "isLoading");
  //   }
  // }

}))

const transformToChat = (history: HistoryData, id: string): Chat => ({
  id,
  title: history.jobDetails?.title || "Untitled Chat",
  timestamp: history.timestamp,
});
