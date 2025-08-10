"use client"

import type React from "react"
import type { ReactNode } from "react"
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { LogOut, User, Bell, Search } from "lucide-react"

interface LayoutProps {
  children?: ReactNode
  title?: string
  showSidebar?: boolean
  sidebarItems?: Array<{
    label?: string
    icon?: React.ReactNode
    href?: string
    active?: boolean
  }>
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title = "Booking Platform",
  showSidebar = false,
  sidebarItems = [],
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const isRestaurantPage = location.pathname.includes("restaurant")
  const isHotelPage = location.pathname.includes("hotel")
  const isSalonPage = location.pathname.includes("salon")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and main nav */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900">Réservation</span>
              </Link>

              {/* Main Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                <Link
                  to="/"
                  className={`text-sm font-medium ${location.pathname === "/" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Accueil
                </Link>
                <Link
                  to="/restaurant/booking"
                  className={`text-sm font-medium ${isRestaurantPage ? "text-red-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Restaurant
                </Link>
                <Link
                  to="/hotel/booking"
                  className={`text-sm font-medium ${isHotelPage ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Hôtel
                </Link>
                <Link
                  to="/salon/booking"
                  className={`text-sm font-medium ${isSalonPage ? "text-pink-600" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Salon de beauté
                </Link>
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  À propos
                </a>
                <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Contact
                </a>
              </div>
            </div>

            {/* Right side - Search, notifications, user menu */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  </div>
                  <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {isRestaurantPage ? "Restaurant" : isHotelPage ? "Hôtel" : isSalonPage ? "Salon" : "Menu"}
              </h2>
              <nav className="space-y-2">
                {sidebarItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.href || "#"}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active
                        ? isRestaurantPage
                          ? "bg-red-50 text-red-700 border-r-2 border-red-500"
                          : isHotelPage
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500"
                            : isSalonPage
                              ? "bg-pink-50 text-pink-700 border-r-2 border-pink-500"
                              : "bg-gray-50 text-gray-700 border-r-2 border-gray-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 ${showSidebar ? "" : "max-w-7xl mx-auto"}`}>
          {/* Render children if passed directly, otherwise use Outlet for routing */}
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
