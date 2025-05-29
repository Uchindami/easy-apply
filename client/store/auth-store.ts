import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { User } from "firebase/auth"

type AuthState = {
  user: User | null
  isInitialized: boolean
  isLoading: boolean
}

type AuthActions = {
  setUser: (user: User | null) => void
  setInitialized: (initialized: boolean) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

const initialState: AuthState = {
  user: null,
  isInitialized: false,
  isLoading: true,
}

export const useAuthStore = create<AuthState & AuthActions>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setUser: (user) => set({ user }),
    setInitialized: (isInitialized) => set({ isInitialized }),
    setLoading: (isLoading) => set({ isLoading }),
    reset: () => set(initialState),
  })),
)
