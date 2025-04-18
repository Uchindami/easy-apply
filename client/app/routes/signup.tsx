import type { Route } from ".react-router/types/app/+types/root";
import { Signup } from "@/components/auth/signup";
import { useProfileStore } from "@/store/profile-store";
import { Navigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - EasyApply" },
    { name: "description", content: "Create your account to start landing interviews" },
  ];
}

export default function SignupPage() {
  const { user, isLoading } = useProfileStore();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Signup />;
} 