import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  type DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { create } from "zustand";

interface Chat {
  id: string;
  title: string;
  timestamp?: Date; // Optional, but useful for pagination
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
}

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
      const q = query(
        historyRef,
        orderBy("timestamp", "desc"),
        limit(5) // Initial batch size
      );
      const querySnapshot = await getDocs(q);

      const chats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        if (!doc.exists()) return;

        const data = doc.data();
        const title = data.jobDetails?.title || "Untitled Chat";

        // Validate timestamp (if needed)
        const timestamp = data.timestamp?.toDate?.();

        chats.push({
          id: doc.id,
          title,
          ...(timestamp && { timestamp }), // Optional: include if exists
        });
      });

      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      set({
        chats,
        isLoading: false,
        lastVisible: newLastVisible,
        hasMore: querySnapshot.docs.length === 5, // If we got 5, there might be more
      });
    } catch (error) {
      console.error("Error fetching chats:", error);
      set({
        error: "Failed to load chat history",
        isLoading: false,
      });
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
        limit(5) // Next batch size
      );
      const querySnapshot = await getDocs(q);

      const newChats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        if (!doc.exists()) return;

        const data = doc.data();
        const title = data.jobDetails?.title || "Untitled Chat";

        newChats.push({
          id: doc.id,
          title,
        });
      });

      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      set((state) => ({
        chats: [...state.chats, ...newChats],
        isFetchingMore: false,
        lastVisible: newLastVisible,
        hasMore: querySnapshot.docs.length === 5, // If we got 5, there might be more
      }));
    } catch (error) {
      console.error("Error loading more chats:", error);
      set({
        error: "Failed to load more chats",
        isFetchingMore: false,
      });
    }
  },
}));
