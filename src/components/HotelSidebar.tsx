"use client"

import type React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BarChart3, Calendar, Users, Building, Settings, Plus } from 'lucide-react'

const HotelSidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3, path: "/hotel/dashboard" },
    { key: "reservations", label: "Reservations", icon: Calendar, path: "/hotel/dashboard/reservations" },
    { key: "guests", label: "Guests", icon: Users, path: "/hotel/dashboard/guests" },
    { key: "rooms", label: "Rooms", icon: Building, path: "/hotel/dashboard/rooms" },
    { key: "options", label: "Options", icon: Plus, path: "/hotel/dashboard/options" },
    { key: "settings", label: "Settings", icon: Settings, path: "/hotel/dashboard/settings" },
  ]

  const isActive = (path: string) => {
    if (path === "/hotel/dashboard") {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Building className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Hotel Admin</h2>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default HotelSidebar
