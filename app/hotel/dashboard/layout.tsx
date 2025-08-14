"use client"

import type React from "react"
import { useState } from "react"
import HotelSidebar from "@/components/hotel/HotelSidebar"
import HotelNavigation from "@/components/hotel/HotelNavigation"

export default function HotelDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <HotelSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/*
        On medium screens and above, add left padding equal to the sidebar
        width (64) so the main content doesn’t overlap the fixed sidebar. On
        small screens the sidebar is hidden and the content spans the full
        width, so we omit the padding. See the salon dashboard for reference.
      */}
      <div className="md:pl-64">
        {/* Pass setSidebarOpen to the navigation so it can trigger the sidebar on mobile */}
        <HotelNavigation setSidebarOpen={setSidebarOpen} />
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
