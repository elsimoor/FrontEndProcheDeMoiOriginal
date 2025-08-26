// "use client"

// import type React from "react"

// import { useState } from "react"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// // import { useAuth } from "@/context/AuthContext"
// import { Eye, EyeOff, Mail, Lock } from "lucide-react"

// export default function LoginPage() {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [showPassword, setShowPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const router = useRouter()


//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault()
//     setIsLoading(true)
//     // Accessing the input values using their IDs and type assertion
//     const emailInput = e.currentTarget.elements.namedItem("email") as HTMLInputElement | null
//     const passwordInput = e.currentTarget.elements.namedItem("password") as HTMLInputElement | null

//     try {
//       const res = await fetch("/api/login", {
//         method: "POST",
//         body: JSON.stringify({
//           email: emailInput?.value, // using the email field as username
//           password: passwordInput?.value,
//         }),
//       })
//       const data = await res.json()
//       setIsLoading(false)
//       if (res.ok && data.data?.login?.token) {
//         if (data.data.login.user.businessType === "hotel") {
//           router.push("/hotel/dashboard")
//         } else if (data.data.login.user.businessType === "restaurant") {
//           router.push("/restaurant/dashboard")
//         } else if (data.data.login.user.businessType === "salon") {
//           router.push("/salon/dashboard")
//         }
//       } else {
//         console.log("data.error", data.error)
//         setError(data.error || "Login failed")
//       }
//     } catch (err) {
//       setIsLoading(false)
//       console.error("Login error:", err)
//       setError("An unexpected error occurred")
//     }
//   }


//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//       <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
//           <p className="text-gray-600">Sign in to your account</p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//               Email Address
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 id="email"
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter your email"
//                 required
//               />
//             </div>
//           </div>

//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
//               Password
//             </label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 id="password"
//                 type={showPassword ? "text" : "password"}
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter your password"
//                 required
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//               >
//                 {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
//               </button>
//             </div>
//           </div>

//           <div className="flex items-center justify-between">
//             <label className="flex items-center">
//               <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//               <span className="ml-2 text-sm text-gray-600">Remember me</span>
//             </label>
//             <Link href="#" className="text-sm text-blue-600 hover:text-blue-500">
//               Forgot password?
//             </Link>
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             {isLoading ? "Signing in..." : "Sign In"}
//           </button>
//         </form>

//         <div className="mt-8 text-center">
//           <p className="text-gray-600">
//             Don't have an account?{" "}
//             <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
//               Sign up
//             </Link>
//           </p>
//         </div>

//         <div className="mt-6 text-center">
//           <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
//             ← Back to Home
//           </Link>
//         </div>
//       </div>
//     </div>
//   )
// }



// test1



"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
// import { useAuth } from "@/context/AuthContext"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"

import SiteNavbar from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    // Accessing the input values using their IDs and type assertion
    const emailInput = e.currentTarget.elements.namedItem("email") as HTMLInputElement | null
    const passwordInput = e.currentTarget.elements.namedItem("password") as HTMLInputElement | null
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: emailInput?.value, // using the email field as username
          password: passwordInput?.value,
        }),
      })
      const data = await res.json()
      setIsLoading(false)
      if (res.ok && data.data?.login?.token) {
        const user = data.data.login.user;
        // Redirect admins to the admin dashboard.  Managers and staff are directed
        // to their respective business dashboards based on businessType.
        if (user.role === "admin") {
          router.push("/admin");
        } else if (user.businessType === "hotel") {
          router.push("/hotel/dashboard");
        } else if (user.businessType === "restaurant") {
          router.push("/restaurant/dashboard");
        } else if (user.businessType === "salon") {
          router.push("/salon/dashboard");
        }
      } else {
        console.log("data.error", data.error)
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setIsLoading(false)
      console.error("Login error:", err)
      setError("An unexpected error occurred")
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteNavbar />

      {/* Background */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        aria-label="Login section"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div aria-hidden className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl" />

        <div className="relative container mx-auto px-4 pb-24 pt-24 md:pt-28">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            {/* Brand/Benefits panel */}
            <div className="order-last hidden md:order-first md:block">
              <div className="rounded-2xl border border-blue-200/50 bg-white/60 p-8 backdrop-blur">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">Welcome back to BusinessSuite</h2>
                <p className="mb-6 text-gray-600">
                  Sign in to manage your Hotel, Restaurant, or Salon from one powerful dashboard.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Unified dashboard for all services
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-600" />
                    Secure authentication and backups
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-600" />
                    24/7 support when you need it
                  </li>
                </ul>
                <div className="mt-6 text-sm text-gray-500">
                  New here?{" "}
                  <Link href="/register" className="font-medium text-blue-700 underline-offset-4 hover:underline">
                    Create an account
                  </Link>
                </div>
              </div>
            </div>

            {/* Auth card */}
            <Card className="order-first mx-auto w-full max-w-md rounded-2xl border-gray-200/80 shadow-xl md:order-last">
              <CardHeader className="space-y-2 text-center">
                <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Sign in</CardTitle>
                <CardDescription className="text-base text-gray-600">Access your BusinessSuite account</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {error ? (
                  <Alert variant="destructive" role="alert" aria-live="assertive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div>
                    <Label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        placeholder="you@company.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 pl-10"
                        placeholder="Enter your password"
                        required
                        aria-describedby="password-hint"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p id="password-hint" className="mt-1 text-xs text-gray-500">
                      Use at least 8 characters.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <Link href="#" className="text-sm font-medium text-blue-700 hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                  Don{"'"}t have an account?{" "}
                  <Link href="/register" className="font-medium text-blue-700 hover:underline">
                    Sign up
                  </Link>
                </div>

                <div className="mt-6 text-center">
                  <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                    {"← Back to Home"}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
