"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Calendar, Users, Sparkles, UserCheck, Cog, CreditCard } from "lucide-react"
import useTranslation from "@/hooks/useTranslation"

// Navigation configuration for the salon dashboard.  Instead of
// hard‑coded names we specify translation keys.  These keys map
// directly into the i18n catalog (see lib/i18n.ts) so the UI can
// render labels in the current language.
const navigation = [
  { key: "dashboard", href: "/salon/dashboard", icon: LayoutDashboard },
  { key: "bookings", href: "/salon/dashboard/bookings", icon: Calendar },
  { key: "clients", href: "/salon/dashboard/clients", icon: Users },
  { key: "services", href: "/salon/dashboard/services", icon: Sparkles },
  { key: "staff", href: "/salon/dashboard/staff", icon: UserCheck },
  { key: "roomsSalon", href: "/salon/dashboard/rooms", icon: LayoutDashboard },
  { key: "optionsSalon", href: "/salon/dashboard/options", icon: Sparkles },
  { key: "invoicesSalon", href: "/salon/dashboard/invoices", icon: LayoutDashboard },
  { key: "paymentsSalon", href: "/salon/dashboard/payments", icon: CreditCard },
  { key: "settings", href: "/salon/dashboard/settings", icon: Cog },
]

export default function SalonSidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-pink-800">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
            <Sparkles className="h-8 w-8 text-white" />
            <span className="ml-2 text-white text-lg font-semibold">{t("salonDashboard")}</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${
                    isActive ? "bg-pink-900 text-white" : "text-pink-100 hover:bg-pink-700"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${isActive ? "text-white" : "text-pink-300"} mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {t(item.key)}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
