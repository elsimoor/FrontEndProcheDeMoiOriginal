"use client"

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
// Import Link and usePathname for navigation
import Link from "next/link"
import { usePathname } from "next/navigation"
// Import icons to represent navigation entries and the brand
import {
  X,
  UtensilsCrossed,
  LayoutDashboard,
  Calendar,
  Users,
  Cog,
  FileText,
  CreditCard,
  Hotel as HotelIcon,
  Sparkles,
} from 'lucide-react'
import useTranslation from '@/hooks/useTranslation'

export default function RestaurantSidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) {
  // Determine current path to highlight active navigation entries
  const pathname = usePathname()
  const { t } = useTranslation()

  // Compute other service dashboards available for switching.  This state
  // will hold the list of business types (e.g. ['hotel', 'salon']) that
  // the user manages in addition to the restaurant.  Populated from
  // the session on mount.
  // Track additional services as objects containing type and id
  // Include isActive to indicate whether the service has been approved by admin.
  const [otherServices, setOtherServices] = useState<{ type: string; id: string; isActive: boolean }[]>([])
  const router = useRouter()
  // Define navigation with translation keys.  These keys correspond
  // to entries in the i18n catalog so labels change with the locale.
  const navigation = [
    // { key: 'dashboard', href: '/restaurant/dashboard', icon: LayoutDashboard },
    { key: 'overview', href: '/restaurant/dashboard', icon: LayoutDashboard },
    // { key: 'reservations', href: '/restaurant/dashboard/reservations', icon: Calendar },
    // { key: 'tables', href: '/restaurant/dashboard/tables', icon: LayoutDashboard },
    // { key: 'menusPage', href: '/restaurant/dashboard/menus', icon: LayoutDashboard },
    // { key: 'staffPage', href: '/restaurant/dashboard/staff', icon: Users },
    { key: 'privatisations', href: '/restaurant/dashboard/privatisations', icon: Users },
    { key: 'tablesDisponibilites', href: '/restaurant/dashboard/tables-disponibilites', icon: Calendar },
    { key: 'settings', href: '/restaurant/dashboard/settings', icon: Cog },
    { key: 'invoices', href: '/restaurant/dashboard/invoices', icon: FileText },
    { key: 'payments', href: '/restaurant/dashboard/payments', icon: CreditCard },
  ]

  // Fetch session on mount to determine additional services.  We exclude
  // the current restaurant business type from the results.  Only services
  // present in the user's services array will be listed.  Each service
  // includes its type and businessId so we can update the session when
  // switching.
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
        // Determine which services require status lookups and merge results.
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
            // Prepopulate with existing statuses if defined
            othersRaw.forEach((o) => {
              if (typeof o.isActive !== 'undefined') {
                statusMap.set(`${o.type}:${o.id}`, { type: o.type, id: o.id, isActive: o.isActive })
              }
            })
            // Override with fetched statuses
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
        console.error('Failed to fetch session for restaurant sidebar', err)
      }
    }
    fetchSession()
  }, [])

  // Switch the active business by updating the session then navigating
  const handleSwitch = async (service: { type: string; id: string; isActive: boolean }) => {
    // Block switching when the service is not yet approved
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
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-red-800">
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
                      <span className="sr-only">{t('closeSidebar')}</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex items-center flex-shrink-0 px-4">
                    <UtensilsCrossed className="h-8 w-8 text-white" />
                    <span className="ml-2 text-white text-lg font-semibold">{t('restaurantDashboard')}</span>
                    {/* Quick switch icons for other services (hotel, salon) */}
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
                              service.isActive ? 'hover:bg-red-700' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {service.type === 'hotel' && <HotelIcon className="h-5 w-5 text-white" />}
                            {service.type === 'salon' && <Sparkles className="h-5 w-5 text-white" />}
                            {service.type === 'restaurant' && <UtensilsCrossed className="h-5 w-5 text-white" />}
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
                            isActive ? 'bg-red-900 text-white' : 'text-red-100 hover:bg-red-700'
                          } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon
                            className={`${
                              isActive ? 'text-white' : 'text-red-300'
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
        <div className="flex-1 flex flex-col min-h-0 bg-red-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <UtensilsCrossed className="h-8 w-8 text-white" />
              <span className="ml-2 text-white text-lg font-semibold">{t('restaurantDashboard')}</span>
              {/* Desktop: quick switch icons for other services */}
              {otherServices.length > 0 && (
                <div className="flex items-center ml-3 space-x-2">
                  {otherServices.map((service) => (
                    <button
                      key={service.type}
                      onClick={() => handleSwitch(service)}
                      // Set title to indicate whether the service is pending approval
                      title={
                        service.isActive
                          ? `Switch to ${service.type.charAt(0).toUpperCase() + service.type.slice(1)} dashboard`
                          : `${service.type.charAt(0).toUpperCase() + service.type.slice(1)} pending approval`
                      }
                      disabled={!service.isActive}
                      className={`flex items-center justify-center h-6 w-6 rounded-md focus:outline-none ${
                        service.isActive ? 'hover:bg-red-700' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {service.type === 'hotel' && <HotelIcon className="h-5 w-5 text-white" />}
                      {service.type === 'salon' && <Sparkles className="h-5 w-5 text-white" />}
                      {service.type === 'restaurant' && <UtensilsCrossed className="h-5 w-5 text-white" />}
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
                      isActive ? 'bg-red-900 text-white' : 'text-red-100 hover:bg-red-700'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-white' : 'text-red-300'
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
