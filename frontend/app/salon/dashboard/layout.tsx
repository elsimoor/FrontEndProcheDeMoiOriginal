"use client";
import SalonSidebar from "@/components/salon/SalonSidebar"
import SalonNavigation from "@/components/salon/SalonNavigation"
import { useState } from "react"

export default function SalonDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Manage sidebar open state for responsive behaviour
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar with mobile support */}
      <SalonSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="md:pl-64">
        {/* Navigation bar passes control to toggle sidebar on mobile */}
        <SalonNavigation setSidebarOpen={setSidebarOpen} />
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
