"use client"

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
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
  Image,
  CreditCard,
} from 'lucide-react'
import useTranslation from '@/hooks/useTranslation'

export default function RestaurantSidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) {
  // Determine current path to highlight active navigation entries
  const pathname = usePathname()
  const { t } = useTranslation()
  // Define navigation with translation keys.  These keys correspond
  // to entries in the i18n catalog so labels change with the locale.
  const navigation = [
    { key: 'dashboard', href: '/restaurant/dashboard', icon: LayoutDashboard },
    { key: 'overview', href: '/restaurant/dashboard/overview', icon: LayoutDashboard },
    { key: 'reservations', href: '/restaurant/dashboard/reservations', icon: Calendar },
    { key: 'tables', href: '/restaurant/dashboard/tables', icon: LayoutDashboard },
    { key: 'menusPage', href: '/restaurant/dashboard/menus', icon: LayoutDashboard },
    { key: 'staffPage', href: '/restaurant/dashboard/staff', icon: Users },
    { key: 'privatisations', href: '/restaurant/dashboard/privatisations', icon: Users },
    { key: 'tablesDisponibilites', href: '/restaurant/dashboard/tables-disponibilites', icon: Calendar },
    { key: 'settings', href: '/restaurant/dashboard/settings', icon: Cog },
    { key: 'invoices', href: '/restaurant/dashboard/invoices', icon: FileText },
    { key: 'payments', href: '/restaurant/dashboard/payments', icon: CreditCard },
  ]
  return (
    <>
      {/* Mobile sidebar with overlay */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
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
      </Transition.Root>
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-red-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <UtensilsCrossed className="h-8 w-8 text-white" />
              <span className="ml-2 text-white text-lg font-semibold">{t('restaurantDashboard')}</span>
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
