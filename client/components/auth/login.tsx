// import { FcGoogle } from "react-icons/fc"
import { FileEdit, Briefcase } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useProfileStore } from "@/store/profile-store"

interface LoginProps {
  heading?: string
  subheading?: string
  logo?: {
    url: string
    src: string
    alt: string
  }
  loginText?: string
  googleText?: string
  signupText?: string
  signupUrl?: string
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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useProfileStore()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to log in")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      setUser(userCredential.user)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-32 bg-zinc-50 dark:bg-background">
      <div className="container">
        <div className="flex flex-col gap-4">
          <div className="mx-auto w-full max-w-sm rounded-md border border-muted bg-white p-6 shadow dark:bg-zinc-900">
            <div className="mb-6 flex flex-col items-center">
              <div className="mb-6 flex items-center gap-2">
                <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                  <FileEdit className="h-6 w-6 text-primary" />
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xl font-bold">EasyApply</span>
              </div>
              <h1 className="mb-2 text-2xl font-bold">{heading}</h1>
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
                  className="bg-white dark:bg-zinc-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="bg-white dark:bg-zinc-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      className="border-muted-foreground"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
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
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  {/* <FcGoogle className="mr-2 size-5" /> */}
                  {googleText}
                </Button>
              </div>
              <div className="mx-auto mt-8 flex justify-center gap-1 text-sm text-muted-foreground">
                <p>{signupText}</p>
                <a href={signupUrl} className="font-medium text-primary hover:underline">
                  Sign up
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Login } 