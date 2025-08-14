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

export default function RestaurantSidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) {
  // Determine current path to highlight active navigation entries
  const pathname = usePathname()
  // Define the navigation items for the restaurant dashboard.  Icons are chosen
  // to intuitively represent each page.  These items were previously shown
  // horizontally in the navigation bar but are now moved to this sidebar.
  const navigation = [
    { name: 'Dashboard', href: '/restaurant/dashboard', icon: LayoutDashboard },
    { name: 'Overview', href: '/restaurant/dashboard/overview', icon: LayoutDashboard },
    { name: 'Reservations', href: '/restaurant/dashboard/reservations', icon: Calendar },
    { name: 'Tables', href: '/restaurant/dashboard/tables', icon: LayoutDashboard },
    { name: 'Menus', href: '/restaurant/dashboard/menus', icon: LayoutDashboard },
    { name: 'Staff', href: '/restaurant/dashboard/staff', icon: Users },
    { name: 'Privatisations', href: '/restaurant/dashboard/privatisations', icon: Users },
    { name: 'Tables & Dispos', href: '/restaurant/dashboard/tables-disponibilites', icon: Calendar },
    { name: 'Settings', href: '/restaurant/dashboard/settings', icon: Cog },
    { name: 'Invoices', href: '/restaurant/dashboard/invoices', icon: FileText },
    // New payments view for tracking completed transactions
    { name: 'Payments', href: '/restaurant/dashboard/payments', icon: CreditCard },
    // { name: 'Landing Cards', href: '/restaurant/dashboard/cards', icon: Image },
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
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex items-center flex-shrink-0 px-4">
                    <UtensilsCrossed className="h-8 w-8 text-white" />
                    <span className="ml-2 text-white text-lg font-semibold">Restaurant Dashboard</span>
                  </div>
                  <nav className="mt-5 flex-1 px-2 space-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
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
      </Transition.Root>
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-red-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <UtensilsCrossed className="h-8 w-8 text-white" />
              <span className="ml-2 text-white text-lg font-semibold">Restaurant Dashboard</span>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
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
