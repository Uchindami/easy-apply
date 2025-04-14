// import { FcGoogle } from "react-icons/fc"
import { FileEdit, Briefcase } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useProfileStore } from "@/store/profile-store"

interface SignupProps {
  heading?: string
  subheading?: string
  logo?: {
    url: string
    src: string
    alt: string
    title: string
  }
  signupText?: string
  googleText?: string
  loginText?: string
  loginUrl?: string
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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useProfileStore()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      setUser(userCredential.user)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
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
    <section className="h-screen bg-zinc-50 dark:bg-background">
      <div className="flex h-full items-center justify-center">
        <div className="flex w-full max-w-sm flex-col items-center gap-y-8">
          <div className="flex flex-col items-center gap-y-2">
            {/* Logo */}
            <div className="flex items-center gap-2 lg:justify-start">
              <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                <FileEdit className="h-6 w-6 text-primary" />
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold">EasyApply</span>
            </div>
            <h1 className="text-3xl font-semibold">{heading}</h1>
            <p className="text-center text-sm text-muted-foreground">{subheading}</p>
          </div>
          <form onSubmit={handleEmailSignup} className="flex w-full flex-col gap-8 rounded-md border border-muted bg-white px-6 py-12 shadow-md dark:bg-zinc-900">
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
                  className="bg-white dark:bg-zinc-800"
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
                  className="bg-white dark:bg-zinc-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-4">
                <Button type="submit" className="mt-2 w-full" disabled={loading}>
                  {loading ? "Creating account..." : signupText}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                >
                  {/* <FcGoogle className="mr-2 size-5" /> */}
                  {googleText}
                </Button>
              </div>
            </div>
          </form>
          <div className="flex justify-center gap-1 text-sm text-muted-foreground">
            <p>{loginText}</p>
            <a href={loginUrl} className="font-medium text-primary hover:underline">
              Log in
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export { Signup } 