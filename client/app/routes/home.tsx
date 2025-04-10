import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useNavigate } from 'react-router'
import { useAuthStore } from "@/store/auth"
import { LandingPage } from "@/components/landing-page";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Easy apply" },
    { name: "description", content: "Welcome to Easy apply" },
  ];
}

export default function Home() {
  const navigate = useNavigate()
  const { user, loading } = useAuthStore()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (user) {
    return navigate('/dashboard')
  }

  return (
    <LandingPage />
  )

}