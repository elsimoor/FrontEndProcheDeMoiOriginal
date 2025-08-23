"use client"

import type React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Bell, Building } from 'lucide-react'

const HotelNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { key: "dashboard", label: "Dashboard", path: "/hotel/dashboard" },
    { key: "reservations", label: "Reservations", path: "/hotel/dashboard/reservations" },
    { key: "guests", label: "Guests", path: "/hotel/dashboard/guests" },
    { key: "rooms", label: "Rooms", path: "/hotel/dashboard/rooms" },
    { key: "options", label: "Options", path: "/hotel/dashboard/options" },
    { key: "settings", label: "Settings", path: "/hotel/dashboard/settings" },
  ]

  const isActive = (path: string) => {
    if (path === "/hotel/dashboard") {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Building className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Hotel Admin</span>
          </div>

          <div className="flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`text-sm font-medium ${
                  isActive(item.path) ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Bell className="h-5 w-5 text-gray-400" />
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </nav>
  )
}

export default HotelNavigation
