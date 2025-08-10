// "use client"

// import type React from "react"

// import { useState } from "react"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { Eye, EyeOff, Mail, Lock, User, Building } from "lucide-react"

// export default function RegisterPage() {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     businessType: "hotel",
//   })
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const router = useRouter()

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (formData.password !== formData.confirmPassword) {
//       alert("Passwords do not match")
//       return
//     }

//     setIsLoading(true)

//     try {
//       const res = await fetch("/api/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: formData.email,
//           password: formData.password,
//           firstName: formData.firstName,
//           lastName: formData.lastName,
//           businessType: formData.businessType,
//         }),
//       })
//       const data = await res.json()

//       console.log("Registration response:", data)

//       setIsLoading(false)
//       if (data.data?.register?.token) {
//         const role = data.data.register.user.businessType
//         if (role === "hotel") {
//           router.push("/hotel/dashboard")
//         } else if (role === "restaurant") {
//           router.push("/restaurant/dashboard")
//         } else if (role === "salon") {
//           router.push("/salon/dashboard")
//         }
//       } else {
//         console.log("data.error", data.error)
//         setError?.(data.error || "Registration failed")
//       }
//     } catch (error) {
//       setIsLoading(false)
//       console.log("Registration failed:", error)
//       setError?.("Registration failed")
//     }
//   }

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }))
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//       <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
//           <p className="text-gray-600">Join our platform today</p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//             <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
//               First Name
//             </label>
//             <div className="relative">
//               <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//               id="firstName"
//               name="firstName"
//               type="text"
//               value={formData.firstName || ""}
//               onChange={handleChange}
//               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="Enter your first name"
//               required
//               />
//             </div>
//             </div>
//             <div>
//             <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
//               Last Name
//             </label>
//             <div className="relative">
//               <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//               id="lastName"
//               name="lastName"
//               type="text"
//               value={formData.lastName || ""}
//               onChange={handleChange}
//               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="Enter your last name"
//               required
//               />
//             </div>
//             </div>

//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//               Email Address
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter your email"
//                 required
//               />
//             </div>
//           </div>

//           <div>
//             <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
//               Business Type
//             </label>
//             <div className="relative">
//               <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <select
//                 id="businessType"
//                 name="businessType"
//                 value={formData.businessType}
//                 onChange={handleChange}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 required
//               >
//                 <option value="hotel">Hotel</option>
//                 <option value="restaurant">Restaurant</option>
//                 <option value="salon">Salon</option>
//               </select>
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
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Create a password"
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

//           <div>
//             <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
//               Confirm Password
//             </label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 type={showConfirmPassword ? "text" : "password"}
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Confirm your password"
//                 required
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//               >
//                 {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
//               </button>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             {isLoading ? "Creating Account..." : "Create Account"}
//           </button>
//         </form>

//         <div className="mt-8 text-center">
//           <p className="text-gray-600">
//             Already have an account?{" "}
//             <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
//               Sign in
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
import { Eye, EyeOff, Mail, Lock, User, Building } from "lucide-react"

import SiteNavbar from "@/components/site-navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessType: "hotel",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      alert("Passwords do not match")
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessType: formData.businessType,
        }),
      })
      const data = await res.json()
      setIsLoading(false)
      if (data.data?.register?.token) {
        const role = data.data.register.user.businessType
        if (role === "hotel") {
          router.push("/hotel/dashboard")
        } else if (role === "restaurant") {
          router.push("/restaurant/dashboard")
        } else if (role === "salon") {
          router.push("/salon/dashboard")
        }
      } else {
        console.log("data.error", data.error)
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setIsLoading(false)
      console.log("Registration failed:", error)
      setError("Registration failed")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteNavbar />

      {/* Background */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        aria-label="Register section"
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
          <div className="mx-auto grid max-w-5xl items-start gap-10 md:grid-cols-2">
            {/* Brand/Benefits panel */}
            <div className="order-last hidden md:order-first md:block">
              <div className="rounded-2xl border border-blue-200/50 bg-white/60 p-8 backdrop-blur">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">Create your BusinessSuite account</h2>
                <p className="mb-6 text-gray-600">
                  Get set up in minutes and choose the solution that fits your business.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
                    Tailored for Hotels, Restaurants, and Salons
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-600" />
                    Role-based dashboards and insights
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-600" />
                    SOC 2-ready security and backups
                  </li>
                </ul>
                <div className="mt-6 text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-blue-700 underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>

            {/* Registration Card */}
            <Card className="order-first mx-auto w-full max-w-md rounded-2xl border-gray-200/80 shadow-xl md:order-last">
              <CardHeader className="space-y-2 text-center">
                <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Create Account</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Join our platform today — it only takes a minute
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                {error ? (
                  <Alert variant="destructive" role="alert" aria-live="assertive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-700">
                        First Name
                      </Label>
                      <div className="relative">
                        <User
                          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                          aria-hidden="true"
                        />
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={formData.firstName || ""}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="Enter your first name"
                          required
                          autoComplete="given-name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="mb-2 block text-sm font-medium text-gray-700">
                        Last Name
                      </Label>
                      <div className="relative">
                        <User
                          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                          aria-hidden="true"
                        />
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          value={formData.lastName || ""}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="Enter your last name"
                          required
                          autoComplete="family-name"
                        />
                      </div>
                    </div>
                  </div>

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
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="you@company.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="businessType" className="mb-2 block text-sm font-medium text-gray-700">
                      Business Type
                    </Label>
                    <div className="relative">
                      <Building
                        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                      {/* Keep native select to preserve your existing change handler */}
                      <select
                        id="businessType"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="w-full appearance-none rounded-md border border-gray-300 bg-white py-3 pl-10 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="hotel">Hotel</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="salon">Salon</option>
                      </select>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        ▾
                      </span>
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
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        placeholder="Create a password"
                        required
                        aria-describedby="password-hint"
                        autoComplete="new-password"
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

                  <div>
                    <Label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10"
                        placeholder="Confirm your password"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        aria-pressed={showConfirmPassword}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-blue-700 hover:underline">
                    Sign in
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
