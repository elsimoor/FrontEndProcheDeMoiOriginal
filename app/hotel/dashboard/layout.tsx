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
      <div>
        <HotelNavigation />
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
