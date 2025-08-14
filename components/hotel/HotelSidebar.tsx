"use client"

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
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
  Image,
  CreditCard,
} from "lucide-react"

export default function HotelSidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }) {
  // Determine the current path to highlight the active navigation entry
  const pathname = usePathname()
  // Define the navigation items with associated icons.  These entries mirror
  // the links previously rendered in the top navigation bar but are now
  // displayed vertically in a sidebar.  Icons help users quickly
  // recognise each section.
  const navigation = [
    { name: "Dashboard", href: "/hotel/dashboard", icon: LayoutDashboard },
    { name: "Reservations", href: "/hotel/dashboard/reservations", icon: Calendar },
    { name: "Guests", href: "/hotel/dashboard/guests", icon: Users },
    { name: "Rooms", href: "/hotel/dashboard/rooms", icon: BedDouble },
    { name: "Room Types", href: "/hotel/dashboard/room-types", icon: Tag },
    { name: "Options", href: "/hotel/dashboard/options", icon: Cog },
    { name: "Opening Hours", href: "/hotel/dashboard/opening-hours", icon: Clock },
    { name: "Pricing", href: "/hotel/dashboard/pricing", icon: ShoppingCart },
    { name: "Reviews", href: "/hotel/dashboard/reviews", icon: Star },
    { name: "Invoices", href: "/hotel/dashboard/invoices", icon: FileText },
    // Provide a payments view so owners can track completed transactions
    { name: "Payments", href: "/hotel/dashboard/payments", icon: CreditCard },
    // { name: "Landing Cards", href: "/hotel/dashboard/cards", icon: Image },
    // Expose the settings page for hotel owners.  This page allows them
    // to update general information, notification preferences and policies.
    { name: "Settings", href: "/hotel/dashboard/settings", icon: Cog },
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
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex items-center flex-shrink-0 px-4">
                    <HotelIcon className="h-8 w-8 text-white" />
                    <span className="ml-2 text-white text-lg font-semibold">Hotel Dashboard</span>
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
      </Transition.Root>
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-blue-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <HotelIcon className="h-8 w-8 text-white" />
              <span className="ml-2 text-white text-lg font-semibold">Hotel Dashboard</span>
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