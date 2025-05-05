// import { FcGoogle } from "react-icons/fc"
import { FileEdit, Briefcase } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useProfileStore } from "@/store/profile-store";

interface LoginProps {
  heading?: string;
  subheading?: string;
  logo?: {
    url: string;
    src: string;
    alt: string;
  };
  loginText?: string;
  googleText?: string;
  signupText?: string;
  signupUrl?: string;
}

const Login = ({
  heading = "Welcome Back",
  subheading = "Continue tailoring your resume and applying to jobs",
  logo = {
    url: "/",
    src: "/",
    alt: "EasyApply",
  },
  loginText = "Log in to my account",
  googleText = "Log in with Google",
  signupText = "Don't have an account yet?",
  signupUrl = "/signup",
}: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useProfileStore();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      setUser(userCredential.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-background relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          alt="background pattern"
          src="https://shadcnblocks.com/images/block/patterns/square-alt-grid.svg"
          className="w-full h-full object-cover opacity-90 text-zinc-200 fill-zinc-200 stroke-zinc-300 dark:opacity-20 [mask-image:radial-gradient(75%_75%_at_center,white,transparent)]"
        />
      </div>

      {/* Frosted glass card */}
      <div className="relative w-full max-w-sm m-4 rounded-xl overflow-hidden">
        {/* Frosted glass effect */}
        <div className="absolute inset-0 backdrop-blur-md bg-white/40 dark:bg-zinc-900/50 border border-white/20 dark:border-zinc-800/30 shadow-lg"></div>

        {/* Card content */}
        <div className="relative p-8">
          <div className="mb-6">
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                <FileEdit className="h-6 w-6 text-primary" />
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold">EasyApply</span>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-center">{heading}</h1>
            <p className="text-center text-muted-foreground">{subheading}</p>
          </div>

          <form onSubmit={handleEmailLogin}>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20">
                {error}
              </div>
            )}

            <div className="grid gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                required
                className="bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border-white/20 dark:border-zinc-700/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                type="password"
                placeholder="Enter your password"
                required
                className="bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border-white/20 dark:border-zinc-700/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    className="border-muted-foreground"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>{}}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot password
                </a>
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={loading}>
                {loading ? "Logging in..." : loginText}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-zinc-800/90"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {googleText}
              </Button>
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p className="inline">{signupText}</p>{" "}
              <a
                href={signupUrl}
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export { Login };
