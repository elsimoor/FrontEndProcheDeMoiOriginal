import type React from "react"
import SalonSidebar from "@/components/salon/SalonSidebar"
import SalonNavigation from "@/components/salon/SalonNavigation"

export default function SalonDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SalonSidebar />
      <div className="md:pl-64">
        <SalonNavigation />
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
