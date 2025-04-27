// historyService.ts
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  getDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { HistoryData } from "@/types/history"; // Import your types

// =====================
// Utility Functions
// =====================

const convertTimestamp = (data: any): any => {
  if (data?.toDate) return data.toDate();
  if (Array.isArray(data)) return data.map(convertTimestamp);
  if (typeof data === "object" && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, convertTimestamp(value)])
    );
  }
  return data;
};

// =====================
// CRUD Operations
// =====================

export const historyService = {
  // createHistory: async (userId: string, data: Omit<HistoryData, "id" | "timestamp">) => {
  //   try {
  //     const historyRef = collection(db, "Users", userId, "History");
  //     const docRef = await addDoc(historyRef, {
  //       ...data,
  //       timestamp: serverTimestamp(),
  //     });
  //     const newDoc = await getDoc(docRef);
  //     return { id: docRef.id, ...convertTimestamp(newDoc.data()) } as HistoryData;
  //   } catch (error) {
  //     console.error("Error creating history:", error);
  //     throw error;
  //   }
  // },

  updateHistory: async (userId: string, historyId: string, data:any) => {
    console.log(data)
    try {
      const docRef = doc(db, "Users", userId, "History", historyId);
      await updateDoc(docRef, data);
      const updatedDoc = await getDoc(docRef);

      return { id: historyId, ...convertTimestamp(updatedDoc.data()) } as HistoryData;
    } catch (error) {
      console.error("Error updating history:", error);
      throw error;
    }
  },

  // deleteHistory: async (userId: string, historyId: string) => {
  //   try {
  //     const docRef = doc(db, "Users", userId, "History", historyId);
  //     await deleteDoc(docRef);
  //   } catch (error) {
  //     console.error("Error deleting history:", error);
  //     throw error;
  //   }
  // },

  // getPaginatedHistory: async (
  //   userId: string,
  //   pageSize: number,
  //   lastVisible?: QueryDocumentSnapshot<DocumentData>
  // ) => {
  //   try {
  //     let q = query(
  //       collection(db, "Users", userId, "History"),
  //       orderBy("timestamp", "desc"),
  //       limit(pageSize)
  //     );
      
  //     if (lastVisible) q = query(q, startAfter(lastVisible));

  //     const snapshot = await getDocs(q);
  //     const results = snapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...convertTimestamp(doc.data())
  //     })) as HistoryData[];

  //     return {
  //       results,
  //       lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
  //       hasMore: snapshot.docs.length === pageSize,
  //     };
  //   } catch (error) {
  //     console.error("Error fetching history:", error);
  //     throw error;
  //   }
  // }
};