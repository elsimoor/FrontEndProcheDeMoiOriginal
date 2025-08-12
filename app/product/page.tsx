"use client"

import Link from "next/link";
import {
  Hotel,
  UtensilsCrossed,
  Sparkles,
  Star,
  Users,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Search,
  ClipboardList,
  Smile,
} from "lucide-react";

/**
 * The product overview page showcases the capabilities of the multi‑business
 * management platform.  Visitors can learn about the hotel, restaurant
 * and salon modules, review core features and read testimonials.  This
 * page mirrors the original landing page but is now served at
 * `/product` so that a dedicated customer‑facing landing page can be
 * implemented at the root of the application.
 */
export default function ProductPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Complete Business
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {" "}
                Management Suite
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Streamline your hotel, restaurant, and salon operations with our
              comprehensive management platform. Everything you need to run
              your business efficiently in one powerful solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-400 hover:shadow-md transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Three Powerful Solutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you run a hotel, restaurant, or salon, we have the
              perfect management solution tailored to your industry needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Hotel Management */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Hotel className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Hotel Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Complete hotel operations management with reservation system,
                room management, guest services, and comprehensive
                reporting.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Room & Reservation Management
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Guest Profile & History
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Housekeeping & Maintenance
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Revenue Analytics
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/hotel"
                  className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl text-center font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  Learn More
                </Link>
                <Link
                  href="/hotel/dashboard"
                  className="block w-full border-2 border-blue-500 text-blue-600 py-3 px-6 rounded-xl text-center font-medium hover:bg-blue-50 transition-all duration-200 group"
                >
                  Hotel Dashboard
                  <ArrowRight className="inline h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Restaurant Management */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-red-200">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UtensilsCrossed className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Streamline your restaurant operations with table management,
                menu control, staff scheduling, and customer relationship
                tools.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Table & Reservation System
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Menu & Inventory Management
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Staff Scheduling & Payroll
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Customer Reviews & Feedback
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/restaurant"
                  className="block w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl text-center font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                >
                  Learn More
                </Link>
                <Link
                  href="/restaurant/dashboard"
                  className="block w-full border-2 border-red-500 text-red-600 py-3 px-6 rounded-xl text-center font-medium hover:bg-red-50 transition-all duration-200 group"
                >
                  Restaurant Dashboard
                  <ArrowRight className="inline h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Salon Management */}
            <div className="group bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-pink-200">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Salon Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage your beauty salon with appointment scheduling, client
                profiles, service management, and stylist coordination.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Appointment Scheduling
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Client Management & History
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Service & Pricing Management
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Stylist Performance Tracking
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/salon"
                  className="block w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 rounded-xl text-center font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-200"
                >
                  Learn More
                </Link>
                <Link
                  href="/salon/dashboard"
                  className="block w-full border-2 border-pink-500 text-pink-600 py-3 px-6 rounded-xl text-center font-medium hover:bg-pink-50 transition-all duration-200 group"
                >
                  Salon Dashboard
                  <ArrowRight className="inline h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for hospitality businesses with features that
              matter most to your operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
              <p className="text-gray-600">
                Advanced booking system with conflict detection and automated
                confirmations.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Management</h3>
              <p className="text-gray-600">
                Complete customer profiles with history, preferences, and
                communication tools.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with 99.9% uptime and automatic backups.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Round-the-clock customer support to keep your business running
                smoothly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by Businesses Worldwide</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join thousands of successful businesses that have transformed
              their operations with our platform.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Active Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Bookings Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from hospitality professionals who trust our platform to
              power their business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-50 p-8 rounded-3xl shadow-md">
              <Star className="h-6 w-6 text-yellow-500 mb-4" />
              <p className="text-gray-600 mb-4">
                “Since adopting the platform our booking efficiency has
                skyrocketed.  The dashboard is intuitive and our customers
                love the streamlined experience.”
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div>
                  <p className="font-semibold text-gray-900">Alice Martin</p>
                  <p className="text-sm text-gray-500">Hotel Manager</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl shadow-md">
              <Star className="h-6 w-6 text-yellow-500 mb-4" />
              <p className="text-gray-600 mb-4">
                “We’ve tried a lot of systems and this one stands out.  The
                support team is always there and the features keep our
                restaurant running smoothly.”
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div>
                  <p className="font-semibold text-gray-900">David Nguyen</p>
                  <p className="text-sm text-gray-500">Restaurant Owner</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl shadow-md">
              <Star className="h-6 w-6 text-yellow-500 mb-4" />
              <p className="text-gray-600 mb-4">
                “My salon clients appreciate the ease of booking and I love
                being able to manage my team and services in one place.”
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div>
                  <p className="font-semibold text-gray-900">Sophie Dubois</p>
                  <p className="text-sm text-gray-500">Salon Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}