"use client"

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  X,
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  UserCheck,
  Clock,
  Cog,
  CreditCard,
  Hotel as HotelIcon,
  UtensilsCrossed,
} from "lucide-react"
import useTranslation from "@/hooks/useTranslation"

/**
 * Sidebar component for the salon dashboard.  This version mirrors the
 * responsive behaviour of the hotel and restaurant sidebars by
 * supporting a mobile overlay controlled via the `sidebarOpen`
 * property.  On desktop the sidebar is always visible, while on
 * mobile it slides in from the left when triggered.  Navigation
 * entries use translation keys defined in the i18n catalog to
 * display labels appropriate to the current locale.  Colours are
 * tailored to the salon theme (pink).
 */
export default function SalonSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}) {
  const pathname = usePathname()
  const { t } = useTranslation()

  // Determine other services managed by this user (hotel, restaurant).  We
  // exclude the salon itself.  Each service includes an id and an isActive flag
  // to indicate whether admin approval has been granted.  Pending services are
  // rendered disabled in the quick switch list.
  const [otherServices, setOtherServices] = useState<{ type: string; id: string; isActive: boolean }[]>([])
  const router = useRouter()
  // Define navigation items.  Each entry holds a translation key,
  // href and icon component.  Keys correspond to i18n messages in
  // lib/i18n.ts.  See hotel and restaurant sidebars for reference.
  const navigation = [
    { key: "dashboard", href: "/salon/dashboard", icon: LayoutDashboard },
    { key: "bookings", href: "/salon/dashboard/bookings", icon: Calendar },
    { key: "clients", href: "/salon/dashboard/clients", icon: Users },
    { key: "services", href: "/salon/dashboard/services", icon: Sparkles },
    { key: "staff", href: "/salon/dashboard/staff", icon: UserCheck },
    // New schedule/calendar page for managing staff shifts
    { key: "schedule", href: "/salon/dashboard/schedule", icon: Clock },
    { key: "roomsSalon", href: "/salon/dashboard/rooms", icon: LayoutDashboard },
    { key: "optionsSalon", href: "/salon/dashboard/options", icon: Sparkles },
    { key: "invoicesSalon", href: "/salon/dashboard/invoices", icon: LayoutDashboard },
    { key: "paymentsSalon", href: "/salon/dashboard/payments", icon: CreditCard },
    { key: "settings", href: "/salon/dashboard/settings", icon: Cog },
  ]

  // Fetch session to populate other services list.  Only the services
  // present in the session will be displayed as switch icons.  The
  // current business type (salon) is excluded.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/session')
        if (!res.ok) return
        const data = await res.json()
        const currentType: string | undefined = data.businessType?.toLowerCase()
        const services: any[] = Array.isArray(data.services) ? data.services : []
        const othersRaw: { type: string; id: string; isActive?: boolean }[] = []
        services.forEach((s) => {
          const type = s?.businessType?.toLowerCase?.()
          const id = s?.businessId
          const isActive: boolean | undefined = (s as any)?.isActive
          if (
            type &&
            id &&
            type !== currentType &&
            !othersRaw.some((o) => o.type === type)
          ) {
            othersRaw.push({ type, id, isActive })
          }
        })
        // Determine which services lack an isActive flag and fetch their status
        try {
          if (othersRaw.length === 0) {
            setOtherServices([])
          } else {
            const toFetch = othersRaw.filter((o) => typeof o.isActive === 'undefined')
            let fetched: { type: string; id: string; isActive: boolean }[] = []
            if (toFetch.length > 0) {
              const resStatus = await fetch('/api/service-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ services: toFetch.map((o) => ({ businessType: o.type, businessId: o.id })) }),
              })
              if (resStatus.ok) {
                const { statuses } = await resStatus.json()
                fetched = Array.isArray(statuses) ? statuses : []
              } else {
                fetched = toFetch.map((o) => ({ type: o.type, id: o.id, isActive: false }))
              }
            }
            const statusMap = new Map<string, { type: string; id: string; isActive: boolean }>()
            othersRaw.forEach((o) => {
              if (typeof o.isActive !== 'undefined') {
                statusMap.set(`${o.type}:${o.id}`, { type: o.type, id: o.id, isActive: o.isActive })
              }
            })
            fetched.forEach((o) => {
              statusMap.set(`${o.type}:${o.id}`, o)
            })
            setOtherServices(Array.from(statusMap.values()))
          }
        } catch (err) {
          console.error('Failed to fetch service statuses', err)
          const fallback = othersRaw.map((o) => ({ type: o.type, id: o.id, isActive: o.isActive ?? false }))
          setOtherServices(fallback)
        }
      } catch (err) {
        console.error('Failed to fetch session for salon sidebar', err)
      }
    }
    fetchSession()
  }, [])

  // Switch the active business by updating the session and navigating.  Do not
  // switch if the service is not yet approved.
  const handleSwitch = async (service: { type: string; id: string; isActive: boolean }) => {
    if (!service.isActive) return
    try {
      const res = await fetch('/api/switch-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType: service.type, businessId: service.id }),
      })
      if (res.ok) {
        setSidebarOpen(false)
        router.push(`/${service.type}/dashboard`)
      }
    } catch (err) {
      console.error('Failed to switch service', err)
    }
  }
  return (
    <>
      {/* Mobile sidebar with overlay */}
      <Transition appear show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-pink-800">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">{t("closeSidebar")}</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex items-center flex-shrink-0 px-4">
                    <Sparkles className="h-8 w-8 text-white" />
                    <span className="ml-2 text-white text-lg font-semibold">{t("salonDashboard")}</span>
                    {/* Quick switch icons for other services (hotel, restaurant).  Pending services are disabled. */}
                    {otherServices.length > 0 && (
                      <div className="flex items-center ml-3 space-x-2">
                        {otherServices.map((service) => (
                          <button
                            key={service.type}
                            onClick={() => handleSwitch(service)}
                            // Set tooltip to indicate whether the service is pending approval
                            title={
                              service.isActive
                                ? `Switch to ${service.type.charAt(0).toUpperCase() + service.type.slice(1)} dashboard`
                                : `${service.type.charAt(0).toUpperCase() + service.type.slice(1)} pending approval`
                            }
                            disabled={!service.isActive}
                            className={`flex items-center justify-center h-6 w-6 rounded-md focus:outline-none ${
                              service.isActive ? 'hover:bg-pink-700' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {service.type === 'hotel' && <HotelIcon className="h-5 w-5 text-white" />}
                            {service.type === 'restaurant' && <UtensilsCrossed className="h-5 w-5 text-white" />}
                            {service.type === 'salon' && <Sparkles className="h-5 w-5 text-white" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <nav className="mt-5 flex-1 px-2 space-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`${
                            isActive ? 'bg-pink-900 text-white' : 'text-pink-100 hover:bg-pink-700'
                          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon
                          className={`${
                              isActive ? 'text-white' : 'text-pink-300'
                            } mr-3 flex-shrink-0 h-6 w-6`}
                            aria-hidden="true"
                          />
                          {t(item.key)}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" />
          </div>
        </Dialog>
      </Transition>
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-pink-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Sparkles className="h-8 w-8 text-white" />
              <span className="ml-2 text-white text-lg font-semibold">{t("salonDashboard")}</span>
              {/* Desktop: quick switch icons for other services.  Pending services disabled. */}
              {otherServices.length > 0 && (
                <div className="flex items-center ml-3 space-x-2">
                  {otherServices.map((service) => (
                    <button
                      key={service.type}
                      onClick={() => handleSwitch(service)}
                      title={
                        service.isActive
                          ? `Switch to ${service.type.charAt(0).toUpperCase() + service.type.slice(1)} dashboard`
                          : `${service.type.charAt(0).toUpperCase() + service.type.slice(1)} pending approval`
                      }
                      disabled={!service.isActive}
                      className={`flex items-center justify-center h-6 w-6 rounded-md focus:outline-none ${
                        service.isActive ? 'hover:bg-pink-700' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {service.type === 'hotel' && <HotelIcon className="h-5 w-5 text-white" />}
                      {service.type === 'restaurant' && <UtensilsCrossed className="h-5 w-5 text-white" />}
                      {service.type === 'salon' && <Sparkles className="h-5 w-5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${
                      isActive ? 'bg-pink-900 text-white' : 'text-pink-100 hover:bg-pink-700'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                    className={`${
                        isActive ? 'text-white' : 'text-pink-300'
                      } mr-3 flex-shrink-0 h-6 w-6`}
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
    </>
  )
}
