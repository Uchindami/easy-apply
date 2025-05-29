import { create } from "zustand";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type SocialAccount = {
  platform: "facebook" | "twitter" | "instagram" | "linkedin";
  connected: boolean;
  username?: string;
};

export type ProfileState = {
  user: User | null;
  username: string;
  country: string;
  socialAccounts: SocialAccount[];
  webPushNotifications: boolean;
  emailNotifications: boolean;
  isLoading: boolean;
  error: string | null;
};

export type ProfileActions = {
  setUser: (user: User | null) => void;
  setUsername: (username: string) => void;
  toggleSocialConnection: (platform: SocialAccount["platform"]) => void;
  toggleWebPushNotifications: () => void;
  toggleEmailNotifications: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateProfile: () => Promise<void>;
};

export const useProfileStore = create<ProfileState & ProfileActions>(
  (set, get) => ({
    user: null,
    username: "",
    country: "Malawi",
    socialAccounts: [
      { platform: "facebook", connected: false },
      { platform: "twitter", connected: false },
      { platform: "instagram", connected: false },
      { platform: "linkedin", connected: false },
    ],
    webPushNotifications: true,
    emailNotifications: true,
    isLoading: true,
    error: null,

    setUser: (user) => set({ user }),
    setUsername: (username) => set({ username }),
    toggleSocialConnection: (platform) => {
      set((state) => ({
        socialAccounts: state.socialAccounts.map((account) =>
          account.platform === platform
            ? { ...account, connected: !account.connected }
            : account
        ),
      }));
    },
    toggleWebPushNotifications: () =>
      set((state) => ({ webPushNotifications: !state.webPushNotifications })),
    toggleEmailNotifications: () =>
      set((state) => ({ emailNotifications: !state.emailNotifications })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    updateProfile: async () => {
      const {
        user,
        username,
        socialAccounts,
        webPushNotifications,
        emailNotifications,
      } = get();

      if (!user) {
        set({ error: "User not authenticated" });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        // Here you would update the user profile in Firebase
        // For example:
        // await updateDoc(doc(db, 'users', user.uid), {
        //   username,
        //   socialAccounts,
        //   webPushNotifications,
        //   emailNotifications,
        // })

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        set({ isLoading: false });
      } catch (error) {
        set({
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to update profile",
        });
      }
    },
  })
);

// Initialize auth state listener
onAuthStateChanged(auth, (user) => {
  useProfileStore.getState().setUser(user);
  useProfileStore.getState().setLoading(false);
});