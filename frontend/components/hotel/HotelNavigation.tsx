"use client"

import { useState, useEffect } from "react"
import { Bell, Search, User, Menu, Hotel as HotelIcon, PlusCircle, UtensilsCrossed, Sparkles } from "lucide-react"
// Replace headless UI dialog and transition with our Radix-based dialog components.
// The Dialog components from our UI library provide a stable API for modals
// without requiring additional transition wrappers.  We import only the
// components we need to build the add‑service modal.
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import LanguageSelector from "@/components/LanguageSelector"
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
  // Track whether the add service modal is visible
  const [addServiceOpen, setAddServiceOpen] = useState(false)
  // List of service types that the user can add.  Derived from the session.
  const [availableServices, setAvailableServices] = useState<string[]>([])
  const router = useRouter()

  // Translation hook for text content
  const { t } = useTranslation()
  // Consume useLanguage to subscribe to locale changes.  The actual
  // switching is handled by the LanguageSelector component.
  useLanguage()

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) return
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
        }
        // Determine which services can be added.  The current
        // business type and any existing services are removed from
        // the full set of [hotel, restaurant, salon].
        const currentType: string | undefined = data.businessType?.toLowerCase()
        const services: any[] = Array.isArray(data.services) ? data.services : []
        const existingTypes = new Set<string>()
        if (currentType) existingTypes.add(currentType)
        services.forEach((s) => {
          if (s?.businessType) existingTypes.add(String(s.businessType).toLowerCase())
        })
        const allTypes = ["hotel", "restaurant", "salon"]
        const available = allTypes.filter((t) => !existingTypes.has(t))
        setAvailableServices(available)
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

  // Handler for selecting a service type from the add service modal.
  const handleAddServiceSelect = (type: string) => {
    setAddServiceOpen(false)
    // Redirect to the add service page with query parameter
    router.push(`/dashboard/add-service?type=${type}`)
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
          {/*
            Center the search bar on all screen sizes.  Previously the
            search input was right-aligned on large screens via
            `lg:justify-end` and had an extra left margin applied.  This
            prevented the search bar from remaining centered when the
            viewport widened.  Removing the large‑screen margin and
            alignment classes ensures the search bar stays centered on
            desktops as well as mobile.  We keep the flex container to
            allow the input to expand while still constraining its
            maximum width.
          */}
          <div className="flex-1 flex justify-center px-2">
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
          {/* Right side: notifications, language selector and user info */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <button
              type="button"
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="sr-only">{t("viewNotifications")}</span>
              <Bell className="h-6 w-6" />
            </button>
            {/* Desktop language selector */}
            <div className="hidden md:block">
              <LanguageSelector colorClass="blue" />
            </div>
            {/* Add Service button.  Visible only when there are available services to add. */}
            {availableServices.length > 0 && (
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setAddServiceOpen(true)}
              >
                <span className="sr-only">{t("addService") || "Add Service"}</span>
                <PlusCircle className="h-6 w-6" />
              </button>
            )}
            <div className="ml-1 relative">
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
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
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
                    {/* Language selector inside dropdown for mobile.  Hidden on desktop to avoid duplicate display */}
                    <div className="border-t border-gray-100 mt-1 px-4 py-1 md:hidden">
                      <LanguageSelector colorClass="blue" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Add Service Modal */}
      <Dialog open={addServiceOpen} onOpenChange={setAddServiceOpen}>
        <DialogContent className="sm:max-w-sm w-full p-6">
          <DialogHeader>
            <DialogTitle>{t("chooseService") || "Choose a service to add"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {availableServices.map((type) => (
              <button
                key={type}
                onClick={() => handleAddServiceSelect(type)}
                className="w-full flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {type === 'restaurant' && <UtensilsCrossed className="h-5 w-5 text-blue-500 mr-2" />}
                {type === 'salon' && <Sparkles className="h-5 w-5 text-blue-500 mr-2" />}
                {type === 'hotel' && <HotelIcon className="h-5 w-5 text-blue-500 mr-2" />}
                <span className="capitalize">{t(type) || type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

