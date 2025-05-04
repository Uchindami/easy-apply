import { useProfileStore } from "@/store/profile-store";
import { Navigate, Outlet } from "react-router";

const PrivateRoutes = () => {
  const { user, isLoading } = useProfileStore();

  return user ? <Outlet /> : <Navigate to="/login" />;
};
