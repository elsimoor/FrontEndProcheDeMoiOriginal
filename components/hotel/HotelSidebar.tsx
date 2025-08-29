"use client"

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
// Bring in Link and usePathname for navigation handling
import Link from "next/link"
import { usePathname } from "next/navigation"
// Import icons used in the navigation sidebar.  We alias the Hotel icon to avoid
// name collisions with the component.  Additional icons are selected to
// represent each navigation entry.
import {
  X,
  Hotel as HotelIcon,
  LayoutDashboard,
  Calendar,
  Users,
  BedDouble,
  Tag,
  Cog,
  Clock,
  ShoppingCart,
  Star,
  FileText,
  CreditCard,
  UtensilsCrossed,
  Sparkles,
  Ban,
} from "lucide-react"
import useTranslation from "@/hooks/useTranslation"

export default function HotelSidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) {
  // Determine the current path to highlight the active navigation entry
  const pathname = usePathname()
  // Access the translation function and current locale
  const { t } = useTranslation()
  // Compute other service dashboards available for switching.  This
  // state holds the list of business types (e.g. ['restaurant', 'salon'])
  // that the current user manages in addition to the hotel.  These
  // values are retrieved from the session on mount.
  // Hold the list of additional services managed by the user.  Each entry
  // includes both the business type and its identifier so that a
  // switch request can update the session before navigation.
  // Extend otherServices to include an isActive flag so that pending
  // services can be shown disabled until an admin approves them.
  const [otherServices, setOtherServices] = useState<{ type: string; id: string; isActive: boolean }[]>([])
  // Router for programmatic navigation after updating the session
  const router = useRouter()
  // Define the navigation items with associated icons.  These entries mirror
  // the links previously rendered in the top navigation bar but are now
  // displayed vertically in a sidebar.  Icons help users quickly
  // recognise each section.
  const navigation = [
    { name: t("dashboard"), href: "/hotel/dashboard", icon: LayoutDashboard },
    { name: t("reservations"), href: "/hotel/dashboard/reservations", icon: Calendar },
    { name: t("guests"), href: "/hotel/dashboard/guests", icon: Users },
    { name: t("rooms"), href: "/hotel/dashboard/rooms", icon: BedDouble },
    { name: t("roomTypes"), href: "/hotel/dashboard/room-types", icon: Tag },
    { name: t("options"), href: "/hotel/dashboard/options", icon: Cog },
    { name: t("openingHours"), href: "/hotel/dashboard/opening-hours", icon: Clock },
    // { name: t("pricing"), href: "/hotel/dashboard/pricing", icon: ShoppingCart },
    // { name: t("reviews"), href: "/hotel/dashboard/reviews", icon: Star },
    { name: t("invoices"), href: "/hotel/dashboard/invoices", icon: FileText },
    // Provide a payments view so owners can track completed transactions
    { name: t("payments"), href: "/hotel/dashboard/payments", icon: CreditCard },
    // { name: "Landing Cards", href: "/hotel/dashboard/cards", icon: Image },
    // Expose the settings page for hotel owners.  This page allows them
    // to update general information, notification preferences and policies.
    { name: t("settings"), href: "/hotel/dashboard/settings", icon: Cog },

    // Cancellation policies allow owners to configure refund rules for guest cancellations
    { name: t("cancellationPolicies"), href: "/hotel/dashboard/cancellation", icon: Ban },
  ]

  // On mount fetch the session to determine which other services this
  // user manages.  We exclude the current hotel business from the
  // results.  The resulting array will be used to render quick
  // dashboard switchers in the sidebar header.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/session')
        if (!res.ok) return
        const data = await res.json()
        const currentType: string | undefined = data.businessType?.toLowerCase()
        const services: any[] = Array.isArray(data.services) ? data.services : []
        // Build a list of other services.  Preserve any existing isActive
        // flag stored in the session so that the previous service remains
        // enabled without querying the backend.
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
        // Determine which services need to be checked via the backend.  Any
        // service that already has an isActive flag defined is trusted;
        // others are looked up via the service‑status API.  Once
        // retrieved, combine the results into a single list.
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
                // default to inactive for all entries if the call fails
                fetched = toFetch.map((o) => ({ type: o.type, id: o.id, isActive: false }))
              }
            }
            // Build a map to merge fetched statuses with those already
            // containing isActive.  Use a key based on type and id to
            // ensure uniqueness when there are multiple businesses of the
            // same type (unlikely but future‑proof).
            const statusMap = new Map<string, { type: string; id: string; isActive: boolean }>()
            // First add the preexisting statuses
            othersRaw.forEach((o) => {
              if (typeof o.isActive !== 'undefined') {
                statusMap.set(`${o.type}:${o.id}`, { type: o.type, id: o.id, isActive: o.isActive })
              }
            })
            // Then add/overwrite with fetched statuses
            fetched.forEach((o) => {
              statusMap.set(`${o.type}:${o.id}`, o)
            })
            setOtherServices(Array.from(statusMap.values()))
          }
        } catch (err) {
          console.error('Failed to fetch service statuses', err)
          // On error, fallback to using any existing isActive flags.  If none
          // exist, default to inactive.
          const fallback = othersRaw.map((o) => ({ type: o.type, id: o.id, isActive: o.isActive ?? false }))
          setOtherServices(fallback)
        }
      } catch (err) {
        console.error('Failed to fetch session for sidebar', err)
      }
    }
    fetchSession()
  }, [])

  // Perform a service switch by updating the server‑side session and
  // navigating to the selected dashboard.  Pending services (isActive=false)
  // are disabled and will not trigger a switch.  This avoids
  // redirecting to the login page in the middleware because the session
  // will now reflect the chosen businessType and businessId.
  const handleSwitch = async (service: { type: string; id: string; isActive: boolean }) => {
    // Do nothing if the service has not been approved by admin.
    if (!service.isActive) return
    try {
      const res = await fetch('/api/switch-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType: service.type, businessId: service.id }),
      })
      if (res.ok) {
        // Close the sidebar on mobile after switching to reduce clutter
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
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-blue-800">
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
                    <HotelIcon className="h-8 w-8 text-white" />
                    <span className="ml-2 text-white text-lg font-semibold">{t("hotelDashboard")}</span>
                    {/* Render icons for other services (e.g. restaurant, salon) so managers can quickly switch dashboards. */}
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
                              service.isActive ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {service.type === 'restaurant' && <UtensilsCrossed className="h-5 w-5 text-white" />}
                            {service.type === 'salon' && <Sparkles className="h-5 w-5 text-white" />}
                            {service.type === 'hotel' && <HotelIcon className="h-5 w-5 text-white" />}
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
                          key={item.name}
                          href={item.href}
                          className={`${
                            isActive ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-700'
                          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon
                            className={`${
                              isActive ? 'text-white' : 'text-blue-300'
                            } mr-3 flex-shrink-0 h-6 w-6`}
                            aria-hidden="true"
                          />
                          {item.name}
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
        <div className="flex-1 flex flex-col min-h-0 bg-blue-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <HotelIcon className="h-8 w-8 text-white" />
              <span className="ml-2 text-white text-lg font-semibold">{t("hotelDashboard")}</span>
              {/* Desktop: render quick dashboard switcher icons */}
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
                        service.isActive ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {service.type === 'restaurant' && <UtensilsCrossed className="h-5 w-5 text-white" />}
                      {service.type === 'salon' && <Sparkles className="h-5 w-5 text-white" />}
                      {service.type === 'hotel' && <HotelIcon className="h-5 w-5 text-white" />}
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
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-700'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-white' : 'text-blue-300'
                      } mr-3 flex-shrink-0 h-6 w-6`}
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
    </>
  )
}