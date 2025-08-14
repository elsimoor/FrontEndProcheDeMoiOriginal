"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, Sparkles, UserCheck, Cog, CreditCard } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/salon/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/salon/dashboard/bookings", icon: Calendar },
  { name: "Clients", href: "/salon/dashboard/clients", icon: Users },
  { name: "Services", href: "/salon/dashboard/services", icon: Sparkles },
  { name: "Staff", href: "/salon/dashboard/staff", icon: UserCheck },
  // Newly added pages for room and option management
  { name: "Rooms", href: "/salon/dashboard/rooms", icon: LayoutDashboard },
  { name: "Options", href: "/salon/dashboard/options", icon: Sparkles },
  // Invoices page for salon
  { name: "Invoices", href: "/salon/dashboard/invoices", icon: LayoutDashboard },
  // Payments view to monitor completed transactions for salon services
  { name: "Payments", href: "/salon/dashboard/payments", icon: CreditCard },
  // Manage promotional landing cards for salon
  // { name: "Landing Cards", href: "/salon/dashboard/cards", icon: Sparkles },
  // Settings page for salon, to edit general info, notification
  // preferences, payment methods and policies.
  { name: "Settings", href: "/salon/dashboard/settings", icon: Cog },
]

export default function SalonSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-pink-800">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Sparkles className="h-8 w-8 text-white" />
            <span className="ml-2 text-white text-lg font-semibold">Salon Dashboard</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive ? "bg-pink-900 text-white" : "text-pink-100 hover:bg-pink-700"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${isActive ? "text-white" : "text-pink-300"} mr-3 flex-shrink-0 h-6 w-6`}
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
