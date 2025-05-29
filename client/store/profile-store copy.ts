import { create } from "zustand";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUserProfile,
  updateUserPreferences,
  type Preferences,
  type UserProfile,
} from "@/services/profile-services";

export type ProfileState = {
  user: User | null;
  activeResume: string | null;
  preferences: Preferences;
  isLoading: boolean;
  error: string | null;
};

export type ProfileActions = {
  setUser: (user: User | null) => void;
  setPreferences: (preferences: Preferences) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchProfile: () => Promise<void>;
  updatePreferences: (updated: Partial<Preferences>) => Promise<void>;
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

export const useProfileStore = create<ProfileState & ProfileActions>((set, get) => ({
  activeResume: null,
  user: null,
  preferences: defaultPreferences,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setPreferences: (preferences) => set({ preferences }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ error: "User not authenticated" });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const profile = await getUserProfile(user.uid);
      set({ preferences: profile.Preferences, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch profile",
      });
    }
  },

  updatePreferences: async (updated) => {
    const { user } = get();
    if (!user) {
      set({ error: "User not authenticated" });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await updateUserPreferences(user.uid, updated);
      // Refetch profile to sync state
      const profile = await getUserProfile(user.uid);
      set({ preferences: profile.Preferences, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to update preferences",
      });
    }
  },
}));

// Initialize auth state listener
onAuthStateChanged(auth, (user) => {
  useProfileStore.getState().setUser(user);
  useProfileStore.getState().setLoading(false);
  if (user) {
    useProfileStore.getState().fetchProfile();
  }
});
