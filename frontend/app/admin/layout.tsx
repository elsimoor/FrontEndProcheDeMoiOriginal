import type React from "react"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminNavigation from "@/components/admin/AdminNavigation"

/**
 * AdminLayout provides a consistent two-pane layout for all admin pages.
 * A fixed sidebar appears on the left for navigation between
 * overview/hotels/restaurants/salons.  The top navigation bar
 * displays the current user and a search box.  Content is rendered
 * within the main area.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="md:pl-64">
        <AdminNavigation />
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}