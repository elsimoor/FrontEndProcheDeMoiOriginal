"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Hotel } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/hotel/dashboard" },
  { name: "Reservations", href: "/hotel/dashboard/reservations" },
  { name: "Guests", href: "/hotel/dashboard/guests" },
  { name: "Rooms", href: "/hotel/dashboard/rooms" },
  { name: "Options", href: "/hotel/dashboard/options"},
  { name: "Opening Hours", href: "/hotel/dashboard/opening-hours" },
  { name: "Pricing", href: "/hotel/dashboard/pricing" },
  { name: "Reviews", href: "/hotel/dashboard/reviews" },
  { name: "Invoices", href: "/hotel/dashboard/invoices" },
  // Page for managing promotional landing cards
  { name: "Landing Cards", href: "/hotel/dashboard/cards" },
  // { name: "Settings", href: "/hotel/dashboard/settings" },

]




export default function HotelNavigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Hotel className="h-8 w-auto text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">HotelAdmin</span>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  pathname === item.href
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center">
            <div className="ml-4 flex items-center sm:ml-6">
              <div className="flex-shrink-0">
                <button
                  type="button"
                  className="relative rounded-full bg-peach-500 p-1 text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View notifications</span>
                  <div className="h-8 w-8 rounded-full bg-orange-200" />
                </button>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="block h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="space-y-1 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
                  pathname === item.href
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                }`}
                aria-current={pathname === item.href ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
