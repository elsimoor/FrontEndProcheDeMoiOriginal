"use client"

import { Bell, Search, User } from "lucide-react"
import { useState, useEffect } from "react"

interface SessionUser {
  id: string
  firstName?: string
  lastName?: string
  email?: string
}

export default function RestaurantNavigation({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  // Session user and UI state
  const [user, setUser] = useState<SessionUser | null>(null)
  const [search, setSearch] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) return
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchSession()
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch("/api/session", { method: "DELETE" })
    } catch (err) {
      console.error(err)
    } finally {
      window.location.href = "/login"
    }
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
                <a href="/restaurant/dashboard" className="hover:text-red-600 transition-colors">Dashboard</a>
                <a href="/restaurant/dashboard/overview" className="hover:text-red-600 transition-colors">overview</a>
                <a href="/restaurant/dashboard/reservations" className="hover:text-red-600 transition-colors">Reservations</a>
                <a href="/restaurant/dashboard/tables" className="hover:text-red-600 transition-colors">Tables</a>
                <a href="/restaurant/dashboard/menus" className="hover:text-red-600 transition-colors">Menus</a>
                <a href="/restaurant/dashboard/staff" className="hover:text-red-600 transition-colors">Staff</a>
                <a href="/restaurant/dashboard/privatisations" className="hover:text-red-600 transition-colors">Privatisations</a>
                <a href="/restaurant/dashboard/tables-disponibilites" className="hover:text-red-600 transition-colors">Tables & Dispos</a>
                <a href="/restaurant/dashboard/settings" className="hover:text-red-600 transition-colors">Settings</a>
                <a href="/restaurant/dashboard/invoices" className="hover:text-red-600 transition-colors">Invoices</a>
                <a href="/restaurant/dashboard/cards" className="hover:text-red-600 transition-colors">Landing Cards</a>
            </nav>
          </div>
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Search"
                  type="search"
                />
              </div>
            </div>
          </div>
          {/* Right side: notifications and user info */}
          <div className="flex items-center">
            <button
              type="button"
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>

            <div className="ml-3 relative">
              <div className="flex items-center">
                <button
                  type="button"
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  <span className="sr-only">Open user menu</span>
                  <User className="h-8 w-8 rounded-full bg-gray-200 p-1" />
                  <span className="ml-2 text-gray-700 text-sm font-medium">
                    {user ? `${user.firstName || "User"} ${user.lastName || ""}` : "Guest"}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
