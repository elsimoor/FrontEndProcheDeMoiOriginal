"use client"

import type React from "react"
import { useState } from "react"
import RestaurantSidebar from "@/components/restaurant/RestaurantSidebar"
import RestaurantNavigation from "@/components/restaurant/RestaurantNavigation"

export default function RestaurantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/*
        Apply left padding on medium screens and above to account for the
        sidebar width. Without this, the content will slide underneath the
        fixed sidebar. The padding is removed on smaller screens where the
        sidebar is hidden.
      */}
      <div className="md:pl-64">
        <RestaurantNavigation setSidebarOpen={setSidebarOpen} />
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
