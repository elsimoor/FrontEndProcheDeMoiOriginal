"use client"

import { Bell, Search, User } from "lucide-react"
import { useEffect, useState } from "react"

/**
 * AdminNavigation renders a top navigation bar for the admin dashboard.
 * It includes a search box (desktop only), a notifications icon, and
 * displays the logged in user's name with a profile dropdown.  The
 * dropdown contains links for viewing the profile and logging out.  The
 * styling stays neutral to avoid clashing with the coloured sidebars.
 */
interface SessionUser {
  id: string
  firstName?: string
  lastName?: string
  email?: string
}

export default function AdminNavigation() {
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
          {/* Left: search (desktop) */}
          <div className="flex items-center">
            {/* Mobile menu button placeholder for responsive sidebar toggle */}
            <div className="flex-shrink-0 md:hidden">
              <button
                type="button"
                className="bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
            {/* Desktop search input */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search..."
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Right: notifications and user menu */}
          <div className="flex items-center">
            <button
              type="button"
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>
            <div className="ml-3 relative">
              <div className="flex items-center">
                <button
                  type="button"
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  <span className="sr-only">Open user menu</span>
                  {/* Avatar placeholder using User icon */}
                  <User className="h-8 w-8 rounded-full bg-gray-200 p-1 text-gray-500" />
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