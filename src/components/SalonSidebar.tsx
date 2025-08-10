"use client"

import type React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { BarChart3, Calendar, Users, Scissors, Sparkles } from "lucide-react"

const SalonSidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { key: "dashboard", label: "Tableau de bord", icon: BarChart3, path: "/salon/dashboard" },
    { key: "bookings", label: "Réservations", icon: Calendar, path: "/salon/dashboard/bookings" },
    { key: "clients", label: "Clients", icon: Users, path: "/salon/dashboard/clients" },
    { key: "staff", label: "Employés", icon: Users, path: "/salon/dashboard/staff" },
    { key: "services", label: "Services", icon: Scissors, path: "/salon/dashboard/services" },
  ]

  const isActive = (path: string) => {
    if (path === "/salon/dashboard") {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-pink-600 rounded flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Salon de coiffure</h2>
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
                    ? "bg-pink-50 text-pink-700 border-r-2 border-pink-500"
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

export default SalonSidebar
