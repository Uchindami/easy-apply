import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export type SocialAccount = {
  platform: "google" | "facebook";
  connected: boolean;
  username?: string;
};

export type Preferences = {
  username: string;
  country: string;
  socialAccounts: SocialAccount[];
  webPushNotifications: boolean;
  emailNotifications: boolean;
};

export type RecommendationData = {
  industry: string;
  skills?: string[];
  experience?: string;
  confidence: string; // Optional field for confidence level
  // Add other recommendation fields as needed
};

export type UserProfile = {
  createdAt: any;
  Preferences: Preferences;
  Recommendation?: RecommendationData | null;
  currentDocument?: string | null; // Optional field for current document
};

const defaultPreferences: Preferences = {
  username: "",
  country: "Malawi",
  socialAccounts: [
    { platform: "google", connected: false },
    { platform: "facebook", connected: false },
  ],
  webPushNotifications: true,
  emailNotifications: true,
};

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const userRef = doc(db, "Users", userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // Create user doc with default Preferences
    const newProfile: UserProfile = {
      createdAt: serverTimestamp(),
      Preferences: defaultPreferences,
      Recommendation: null,
      currentDocument: null, // Initialize currentDocument as null
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
  
  const data = userSnap.data();
  
  // Ensure Preferences exists
  if (!data.Preferences) {
    await updateDoc(userRef, { Preferences: defaultPreferences });
    data.Preferences = defaultPreferences;
  }
  
  return {
    createdAt: data.createdAt,
    Preferences: data.Preferences,
    Recommendation: data.Recommendation || null,
    currentDocument: data.currentDocument || null, // Ensure currentDocument is defined
  };
}

export async function updateUserPreferences(
  userId: string,
  updatedPreferences: Partial<Preferences>
): Promise<void> {
  const userRef = doc(db, "Users", userId);
  await updateDoc(userRef, {
    ["Preferences"]: {
      ...defaultPreferences,
      ...(await getDoc(userRef)).data()?.Preferences,
      ...updatedPreferences,
    },
  });
}

export async function updateRecommendation(
  userId: string,
  recommendation: RecommendationData | null
): Promise<void> {
  const userRef = doc(db, "Users", userId);
  await updateDoc(userRef, {
    Recommendation: recommendation,
  });
}