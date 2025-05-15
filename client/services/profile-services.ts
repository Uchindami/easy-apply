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

export type UserProfile = {
  createdAt: any;
  Preferences: Preferences;
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
