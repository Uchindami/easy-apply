import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUserProfile,
  updateUserPreferences,
  type Preferences,
} from "@/services/profile-services";

export type RecommendationData = {
  industry: string;
  confidence: string;
};

export type ProfileState = {
  user: User | null;
  recommendation: RecommendationData | null;
  preferences: Preferences;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  currentDocument?: string | null; // Optional field for current document
};

export type ProfileActions = {
  setUser: (user: User | null) => void;
  setRecommendation: (recommendation: RecommendationData | null) => void;
  setPreferences: (preferences: Preferences) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  fetchProfile: () => Promise<void>;
  updatePreferences: (updated: Partial<Preferences>) => Promise<void>;
  resetStore: () => void;
  clearError: () => void;
  clearRecommendation: () => void;
  setLogout: () => void; // Logout action
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

const initialState: ProfileState = {
  recommendation: null,
  user: null,
  preferences: defaultPreferences,
  isLoading: true,
  error: null,
  isInitialized: false,
  currentDocument: null,
};

export const useProfileStore = create<ProfileState & ProfileActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setUser: (user) => set({ user }),
    setRecommendation: (recommendation) => set({ recommendation }),
    setPreferences: (preferences) => set({ preferences }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setInitialized: (initialized) => set({ isInitialized: initialized }),
    clearError: () => set({ error: null }),
    clearRecommendation: () => set({ recommendation: null }),
    setLogout: async () => {
      const { resetStore } = get();
      try {
        await auth.signOut();
        cleanupAuth();
        resetStore();
        set({ isInitialized: false });
        window.location.href = "/"; // Navigate to root
      } catch (error) {
        console.error("Error during logout:", error);
        set({
          error: error instanceof Error ? error.message : "Failed to logout",
        });
      }
    },

    fetchProfile: async () => {
      const { user } = get();
      if (!user) {
        set({ error: "User not authenticated", isLoading: false });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const profile = await getUserProfile(user.uid);
        set({
          preferences: profile.Preferences || defaultPreferences,
          recommendation: profile.Recommendation || null,
          isLoading: false,
          currentDocument: profile.currentDocument || null,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        set({
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch profile",
        });
      }
    },

    updatePreferences: async (updated) => {
      const { user, preferences } = get();
      if (!user) {
        set({ error: "User not authenticated" });
        return;
      }

      // Optimistic update
      const newPreferences = { ...preferences, ...updated };
      set({ preferences: newPreferences, error: null });

      try {
        await updateUserPreferences(user.uid, updated);
      } catch (error) {
        console.error("Error updating preferences:", error);
        // Revert optimistic update
        set({
          preferences,
          error:
            error instanceof Error
              ? error.message
              : "Failed to update preferences",
        });
      }
    },

    resetStore: () => set({ ...initialState, isInitialized: false }),
  }))
);

// Initialize auth state listener
let authUnsubscribe: (() => void) | null = null;

export const initializeAuth = () => {
  if (authUnsubscribe) return; // Already initialized

  authUnsubscribe = onAuthStateChanged(auth, (user) => {
    const store = useProfileStore.getState();

    if (user) {
      store.setUser(user);
      store.setInitialized(true);
      store.fetchProfile();
    } else {
      store.resetStore();
      store.setInitialized(true);
      store.setLoading(false);
    }
  });
};

export const cleanupAuth = () => {
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }
};

// Initialize auth state listener
onAuthStateChanged(auth, (user) => {
  useProfileStore.getState().setUser(user);
  useProfileStore.getState().setLoading(false);
  if (user) {
    useProfileStore.getState().fetchProfile();
  }
});
