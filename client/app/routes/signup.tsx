import type { Route } from ".react-router/types/app/+types/root";
import { Signup } from "@/components/auth/signup";
import { useAuthStore } from "@/store/auth";
import { Navigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - EasyApply" },
    { name: "description", content: "Create your account to start landing interviews" },
  ];
}

export default function SignupPage() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Signup />;
} 