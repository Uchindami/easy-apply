import type { Route } from ".react-router/types/app/+types/root";
import { Login } from "@/components/auth/login";
import { useProfileStore } from "@/store/profile-store";
import { Navigate } from "react-router";

export function meta() {
	return [
		{ title: "Login - EasyApply" },
		{ name: "description", content: "Log in to your EasyApply account" },
	];
}

export default function LoginPage() {
	const { user, isLoading } = useProfileStore();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				Loading...
			</div>
		);
	}

	if (user) {
		return <Navigate to="/home" replace />;
	}

	return <Login />;
}
