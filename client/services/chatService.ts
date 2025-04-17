import { db } from "@/lib/firebase";
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
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { create } from "zustand";

// Types
export interface Chat {
  id: string;
  title: string;
  timestamp?: Date;
}

interface ChatState {
  chats: Chat[];
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  fetchChats: (userId: string) => Promise<void>;
  loadMoreChats: (userId: string) => Promise<void>;
  getChatById: (userId: string, chatId: string) => Promise<Chat | null>;
}

// Helper functions
const transformChatData = (doc: QueryDocumentSnapshot<DocumentData>): Chat => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.jobDetails?.title || "Untitled Chat",
    ...(data.timestamp?.toDate?.() && { timestamp: data.timestamp.toDate() }),
  };
};

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  isLoading: true,
  isFetchingMore: false,
  error: null,
  lastVisible: null,
  hasMore: true,

  fetchChats: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const historyRef = collection(db, "Users", userId, "History");
      const q = query(historyRef, orderBy("timestamp", "desc"), limit(5));
      const querySnapshot = await getDocs(q);

      const chats = querySnapshot.docs
        .filter(doc => doc.exists())
        .map(transformChatData);

      set({
        chats,
        isLoading: false,
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === 5,
      });
    } catch (error) {
      console.error("Error fetching chats:", error);
      set({ error: "Failed to load chat history", isLoading: false });
    }
  },

  loadMoreChats: async (userId: string) => {
    const { lastVisible, isFetchingMore, hasMore } = get();
    if (!lastVisible || isFetchingMore || !hasMore) return;

    set({ isFetchingMore: true });

    try {
      const historyRef = collection(db, "Users", userId, "History");
      const q = query(
        historyRef,
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(5)
      );
      const querySnapshot = await getDocs(q);

      const newChats = querySnapshot.docs
        .filter(doc => doc.exists())
        .map(transformChatData);

      set((state) => ({
        chats: [...state.chats, ...newChats],
        isFetchingMore: false,
        lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === 5,
      }));
    } catch (error) {
      console.error("Error loading more chats:", error);
      set({ error: "Failed to load more chats", isFetchingMore: false });
    }
  },

  getChatById: async (userId: string, chatId: string) => {
    const { chats } = get();
    const existingChat = chats.find((chat) => chat.id === chatId);
    if (existingChat) return existingChat;

    try {
      const chatRef = doc(db, "Users", userId, "History", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) return null;

      const chat = transformChatData(chatSnap);
      set((state) => ({ chats: [...state.chats, chat] }));
      return chat;
    } catch (error) {
      console.error("Error fetching chat by ID:", error);
      return null;
    }
  },
}));