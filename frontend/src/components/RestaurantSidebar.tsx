"use client"

import type React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Calendar,
  Table,
  Menu,
  Users,
  Star,
  UserCheck,
  Settings,
  TrendingUp,
  Clock,
} from "lucide-react"

const RestaurantSidebar: React.FC = () => {
  const location = useLocation()

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/restaurant/dashboard" },
    { icon: Calendar, label: "Réservations", path: "/restaurant/dashboard/reservations" },
    { icon: Table, label: "Tables", path: "/restaurant/dashboard/tables" },
    { icon: Menu, label: "Menus", path: "/restaurant/dashboard/menus" },
    { icon: Users, label: "Privatisations", path: "/restaurant/dashboard/privatisation" },
    { icon: Star, label: "Avis", path: "/restaurant/dashboard/avis" },
    { icon: UserCheck, label: "Personnel", path: "/restaurant/dashboard/staff" },
    { icon: Settings, label: "Paramètres", path: "/restaurant/dashboard/settings" },
  ]

  const quickStats = [
    { label: "Réservations aujourd'hui", value: "24", icon: Calendar, color: "text-blue-600" },
    { label: "Tables occupées", value: "18/25", icon: Table, color: "text-green-600" },
    { label: "Chiffre d'affaires", value: "2,450€", icon: TrendingUp, color: "text-red-600" },
  ]

  const recentActivity = [
    { action: "Nouvelle réservation", time: "Il y a 5 min", customer: "Marie Dubois" },
    { action: "Commande terminée", time: "Il y a 12 min", customer: "Table 7" },
    { action: "Avis reçu", time: "Il y a 20 min", customer: "Jean Martin" },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">R</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Restaurant Admin</h2>
            <p className="text-sm text-gray-500">Gestion complète</p>
          </div>
        </div>

        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-red-600 text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Statistiques rapides</h3>
          <div className="space-y-3">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-xs text-gray-600">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Activité récente</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="text-xs">
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600">{activity.time}</span>
                </div>
                <p className="text-gray-900 font-medium mt-1">{activity.action}</p>
                <p className="text-gray-500">{activity.customer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestaurantSidebar
