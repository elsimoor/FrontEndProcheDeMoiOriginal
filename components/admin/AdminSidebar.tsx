"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
// Import icons from lucide-react for navigation items
import {
  LayoutDashboard,
  Hotel,
  UtensilsCrossed,
  Scissors,
} from "lucide-react"

/**
 * AdminSidebar renders a fixed side navigation panel for the admin portal.
 * It displays links to the overview page and separate management pages
 * for hotels, restaurants and salons.  The active link is highlighted
 * based on the current pathname.  The colour palette is neutral to
 * differentiate from the coloured dashboards of each service.
 */
export default function AdminSidebar() {
  const pathname = usePathname()
  const navigation = [
    { name: "Overview", href: "/admin/overview", icon: LayoutDashboard },
    { name: "Hotels", href: "/admin/hotels", icon: Hotel },
    { name: "Restaurants", href: "/admin/restaurants", icon: UtensilsCrossed },
    { name: "Salons", href: "/admin/salons", icon: Scissors },
  ]
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            {/* Dashboard title */}
            <LayoutDashboard className="h-8 w-8 text-white" />
            <span className="ml-2 text-white text-lg font-semibold">Admin</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300"} mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}