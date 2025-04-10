import type { Route } from ".react-router/types/app/+types/root";
import { Login } from "@/components/auth/login";
import { useAuthStore } from "@/store/auth";
import { Navigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - EasyApply" },
    { name: "description", content: "Log in to your EasyApply account" },
  ];
}

export default function LoginPage() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <Login />;
} 