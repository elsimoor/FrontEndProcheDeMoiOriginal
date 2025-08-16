"use client"

import { useState, useEffect } from "react"
import { Bell, Search, User, Menu, Hotel as HotelIcon } from "lucide-react"
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"

interface SessionUser {
  id: string
  firstName?: string
  lastName?: string
  email?: string
}

// The hotel dashboard navigation bar now mirrors the salon and restaurant
// navigation components.  It removes the horizontal list of page links and
// instead provides a compact header with a brand, search bar, notification
// bell and user menu.  A hamburger button opens the sidebar on mobile.
export default function HotelNavigation({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [search, setSearch] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)

  // Translation hook for text content
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()

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
              className="md:hidden bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">{t("openSidebar")}</span>
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden md:flex items-center">
              <HotelIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">{t("hotelDashboard")}</span>
            </div>
          </div>
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t("searchPlaceholder")}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          {/* Right side: notifications and user info */}
          <div className="flex items-center">
            <button
              type="button"
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="sr-only">{t("viewNotifications")}</span>
              <Bell className="h-6 w-6" />
            </button>
            <div className="ml-3 relative">
              <div className="flex items-center">
                <button
                  type="button"
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                      {t("profile")}
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t("logout")}
                    </button>
                    {/* Language selection buttons.  These allow the user to
                        switch between English and French at runtime.  The
                        active language is indicated by a bold font. */}
                    <div className="border-t border-gray-100 mt-1" />
                    <button
                      onClick={() => setLocale("en")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLocale("fr")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"
                      }`}
                    >
                      Français
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
