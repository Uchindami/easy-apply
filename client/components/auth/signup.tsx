// import { FcGoogle } from "react-icons/fc"
import posthog from "posthog-js";
import { useState } from "react";
import { useNavigate } from "react-router";

import GoogleIcon from "@/assets/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { useProfileStore } from "@/store/profile-store";
import {
	GoogleAuthProvider,
	createUserWithEmailAndPassword,
	signInWithPopup,
} from "firebase/auth";

interface SignupProps {
	heading?: string;
	subheading?: string;
	logo?: {
		url: string;
		src: string;
		alt: string;
		title: string;
	};
	signupText?: string;
	googleText?: string;
	loginText?: string;
	loginUrl?: string;
}

const Signup = ({
	heading = "Join EasyApply",
	subheading = "Create your account to start landing interviews",
	logo = {
		url: "/",
		src: "/",
		alt: "EasyApply",
		title: "EasyApply - Resume Tailoring Made Easy",
	},
	googleText = "Sign up with Google",
	signupText = "Create my account",
	loginText = "Already have an account?",
	loginUrl = "/login",
}: SignupProps) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { setUser } = useProfileStore();

	const handleEmailSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password,
			);
			setUser(userCredential.user);
			posthog.identify(userCredential.user.uid, {
				email: userCredential.user.email,
			});
			posthog.capture("signup_success", {
				method: "email",
				user_id: userCredential.user.uid,
				email: userCredential.user.email,
			});
			navigate("/dashboard");
		} catch (err: any) {
			setError(err.message || "Failed to create account");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignup = async () => {
		setError("");
		setLoading(true);

		try {
			const provider = new GoogleAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			setUser(userCredential.user);
			posthog.identify(userCredential.user.uid, {
				email: userCredential.user.email,
			});
			posthog.capture("signup_success", {
				method: "google",
				user_id: userCredential.user.uid,
				email: userCredential.user.email,
			});
			navigate("/dashboard");
		} catch (err: any) {
			setError(err.message || "Failed to sign in with Google");
		} finally {
			setLoading(false);
		}
	};

	return (
		<section className="h-screen bg-zinc-50 dark:bg-background relative">
			{/* Background pattern */}
			<div className="absolute inset-0 pointer-events-none">
				<img
					alt="background pattern"
					src="https://shadcnblocks.com/images/block/patterns/square-alt-grid.svg"
					className="w-full h-full object-cover opacity-90 text-zinc-200 fill-zinc-200 stroke-zinc-300 dark:opacity-20 [mask-image:radial-gradient(75%_75%_at_center,white,transparent)]"
				/>
			</div>

			<div className="flex h-full items-center justify-center">
				<div className="flex w-full max-w-sm flex-col items-center gap-y-8 ">
					{/* Logo and heading */}
					<div className="flex flex-col items-center gap-y-2">
						<h1 className="text-3xl font-semibold">{heading}</h1>
						<p className="text-center text-sm text-muted-foreground">
							{subheading}
						</p>
					</div>

					{/* Frosted glass form */}
					<div className="relative w-full rounded-xl overflow-hidden">
						{/* Frosted glass effect */}
						<div className="absolute inset-0 backdrop-blur-md bg-white/40 dark:bg-zinc-900/50 border border-white/20 dark:border-zinc-800/30 shadow-lg"></div>

						{/* Form content */}
						<form
							onSubmit={handleEmailSignup}
							className="relative flex w-full flex-col gap-8 px-6 py-12"
						>
							{error && (
								<div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20">
									{error}
								</div>
							)}
							<div className="flex flex-col gap-6">
								<div className="flex flex-col gap-2">
									<Label>Email</Label>
									<Input
										type="email"
										placeholder="Enter your email"
										required
										className="bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border-white/20 dark:border-zinc-700/30"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label>Password</Label>
									<Input
										type="password"
										placeholder="Enter your password"
										required
										className="bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border-white/20 dark:border-zinc-700/30"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
									/>
								</div>
								<div className="flex flex-col gap-4">
									<Button
										type="submit"
										className="mt-2 w-full"
										disabled={loading}
									>
										{loading ? "Creating account..." : signupText}
									</Button>
									<Button
										type="button"
										variant="outline"
										className="w-full bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-zinc-800/90"
										onClick={handleGoogleSignup}
										disabled={loading}
									>
										{googleText}
										<GoogleIcon />
									</Button>
								</div>
							</div>
						</form>
					</div>

					{/* Login link */}
					<div className="flex justify-center gap-1 text-sm text-muted-foreground">
						<p>{loginText}</p>
						<a
							href={loginUrl}
							className="font-medium text-primary hover:underline"
						>
							Log in
						</a>
					</div>
				</div>
			</div>
		</section>
	);
};

export { Signup };
