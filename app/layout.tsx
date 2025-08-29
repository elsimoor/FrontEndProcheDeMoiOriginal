import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import ClientApolloProvider from "@/components/ClientApolloProvider"
import { LanguageProvider } from "@/context/LanguageContext"
import UseMsClarity from "@/components/Clarity"
// Import the Toaster component which renders toast notifications.  This
// must be mounted at the root of the app to display all toasts.
// Import the ToastContainer from our react-toastify shim.  This will
// render the global Toaster for toast notifications.  The
// ToastContainer is necessary because we removed the direct Toaster
// import from the layout in favour of the react-toastify API.
import { ToastContainer } from "react-toastify"
// import { AuthProvider } from "@/context/AuthContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Multi-Business Dashboard",
  description: "Comprehensive dashboard for hotel, restaurant, and salon management",
  generator: 'v0.dev'
}





export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {




  return (
    <html lang="en">

      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
       
      </head>
      <body className={inter.className}>
        <UseMsClarity />
        {/* Provide the language context to the entire application so that
            components can access and modify the current locale. */}
        <LanguageProvider>
          {/* Mount the toaster so toast notifications render across the entire app */}
          <ClientApolloProvider>
            {/* Render the ToastContainer from react-toastify.  This component mounts
                the internal Toaster so toast notifications work throughout
                the application. */}
            <ToastContainer />
            {children}
          </ClientApolloProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
