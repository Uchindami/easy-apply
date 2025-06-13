import type { Route } from "./+types/home";
import { useNavigate } from "react-router";
import { useProfileStore } from "@/store/profile-store";
import { LandingPage } from "@/components/landing-page";

export function meta() {
	return [
		{ title: "Easy apply" },
		{ name: "description", content: "Welcome to Easy apply" },
	];
}

export default function Home() {
	const navigate = useNavigate();
	const { user, isLoading } = useProfileStore();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				Loading...
			</div>
		);
	}

	if (user) {
		return navigate("/dashboard");
	}

	return <LandingPage />;
}
