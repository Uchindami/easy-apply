// components/protected-route.tsx
import { useProfileStore } from "@/store/profile-store";
import { Navigate, Outlet } from "react-router";
 // Your auth provider

export function ProtectedRoute() {
    const { user, isLoading } = useProfileStore()
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}