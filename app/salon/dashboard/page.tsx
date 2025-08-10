"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Calendar, Users, Sparkles, DollarSign } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { gql, useQuery } from "@apollo/client"

interface Reservation {
  id: string
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  date: string
  time?: string
  status: string
  serviceId?: {
    id: string
    name: string
    duration?: number
    price?: number
  } | null
  staffId?: {
    id: string
    name: string
    role?: string
  } | null
  createdAt: string
}

interface Service {
  id: string
  name: string
  duration?: number
  price?: number
  category?: string
}

interface StaffMember {
  id: string
  name: string
  role?: string
}

/**
 * Salon dashboard page.  This page fetches live reservation, service and
 * staff data via GraphQL and computes a series of statistics to display
 * in the UI.  Charts are rendered using Recharts and update
 * automatically when the underlying data changes.
 */
export default function SalonDashboard() {
  // Session state: determine which salon (client) this dashboard
  // represents.  If the user does not belong to a salon business
  // then an error message is displayed.
  const [salonId, setSalonId] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  // State to select the time range for statistics (daily, weekly or monthly)
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          setSessionLoading(false)
          return
        }
        const data = await res.json()
        if (data.businessType && data.businessType.toLowerCase() === "salon" && data.businessId) {
          setSalonId(data.businessId)
          setBusinessType(data.businessType.toLowerCase())
        } else {
          setSessionError("You are not associated with a salon business.")
        }
      } catch (err) {
        setSessionError("Failed to load session.")
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  // GraphQL queries
  const GET_RESERVATIONS = gql`
    query GetReservations($businessId: ID!, $businessType: String!) {
      reservations(businessId: $businessId, businessType: $businessType) {
        id
        customerInfo {
          name
          email
          phone
        }
        date
        time
        status
        serviceId {
          id
          name
          duration
          price
        }
        staffId {
          id
          name
          role
        }
        createdAt
      }
    }
  `
  const GET_SERVICES = gql`
    query GetServices($businessId: ID!, $businessType: String!) {
      services(businessId: $businessId, businessType: $businessType) {
        id
        name
        duration
        price
        category
      }
    }
  `
  const GET_STAFF = gql`
    query GetStaff($businessId: ID!, $businessType: String!) {
      staff(businessId: $businessId, businessType: $businessType) {
        id
        name
        role
      }
    }
  `

  const { data: reservationsData, loading: reservationsLoading, error: reservationsError } = useQuery(GET_RESERVATIONS, {
    variables: { businessId: salonId, businessType },
    skip: !salonId || !businessType,
  })
  const { data: servicesData, loading: servicesLoading, error: servicesError } = useQuery(GET_SERVICES, {
    variables: { businessId: salonId, businessType },
    skip: !salonId || !businessType,
  })
  const { data: staffData, loading: staffLoading, error: staffError } = useQuery(GET_STAFF, {
    variables: { businessId: salonId, businessType },
    skip: !salonId || !businessType,
  })

  // Derive arrays from query data
  const reservations: Reservation[] = reservationsData?.reservations ?? []
  const services: Service[] = servicesData?.services ?? []
  const staff: StaffMember[] = staffData?.staff ?? []

  /**
   * Compute filtered reservations based on the selected time range.  For "daily" we
   * include only reservations for the current day.  For "weekly" we include the
   * last seven days (inclusive), and for "monthly" we include all reservations
   * starting from the first day of the current month.  We also compute the
   * occupancy rate by comparing the total booked minutes to the theoretical
   * available minutes (assuming each staff member can work 8 hours per day).
   */
  const analytics = useMemo(() => {
    const now = new Date()
    let periodStart = new Date(now)
    if (timeRange === 'daily') {
      // start at midnight
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (timeRange === 'weekly') {
      periodStart = new Date(now)
      periodStart.setDate(now.getDate() - 6)
    } else {
      // monthly
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    const filtered = reservations.filter((r) => {
      const d = new Date(r.date)
      return d >= periodStart && d <= now
    })
    const totalBookings = filtered.length
    const totalRevenue = filtered.reduce((sum, r) => sum + (r.serviceId?.price || 0), 0)
    // Sum durations in minutes; if duration not defined default to 60
    const totalMinutes = filtered.reduce((sum, r) => sum + (r.serviceId?.duration || 60), 0)
    // available minutes: number of days * number of staff * 8 hours (480 minutes)
    const daysCount = Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const availableMinutes = daysCount * staff.length * 480
    const occupancyRate = availableMinutes > 0 ? (totalMinutes / availableMinutes) * 100 : 0
    // Service distribution: counts and percentage
    const serviceCounts: Record<string, number> = {}
    filtered.forEach((r) => {
      const name = r.serviceId?.name || 'Autre'
      serviceCounts[name] = (serviceCounts[name] || 0) + 1
    })
    const distribution = Object.entries(serviceCounts).map(([name, count]) => {
      const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0
      return { name, count, percentage }
    })
    // Booking trends: group bookings by week number (last 4 weeks) for the selected period
    const trends: { name: string; bookings: number }[] = []
    if (timeRange === 'daily') {
      // show last 4 days
      for (let i = 3; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(now.getDate() - i)
        const label = date.toLocaleDateString('default', { month: 'short', day: 'numeric' })
        const count = filtered.filter((r) => new Date(r.date).toDateString() === date.toDateString()).length
        trends.push({ name: label, bookings: count })
      }
    } else if (timeRange === 'weekly') {
      // last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const start = new Date(now)
        start.setDate(now.getDate() - i * 7)
        const end = new Date(now)
        end.setDate(now.getDate() - i * 7 + 6)
        const label = `W${getWeekNumber(end)}`
        const count = filtered.filter((r) => {
          const d = new Date(r.date)
          return d >= start && d <= end
        }).length
        trends.push({ name: label, bookings: count })
      }
    } else {
      // monthly: 4 weeks segments
      for (let i = 3; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth(), 1 + i * 7)
        const end = new Date(now.getFullYear(), now.getMonth(), Math.min(start.getDate() + 6, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()))
        const label = `Semaine ${4 - i}`
        const count = filtered.filter((r) => {
          const d = new Date(r.date)
          return d >= start && d <= end
        }).length
        trends.push({ name: label, bookings: count })
      }
    }
    // Revenue by service type
    const revenueByService: { name: string; revenue: number }[] = []
    Object.keys(serviceCounts).forEach((name) => {
      const revenue = filtered
        .filter((r) => (r.serviceId?.name || 'Autre') === name)
        .reduce((sum, r) => sum + (r.serviceId?.price || 0), 0)
      revenueByService.push({ name, revenue })
    })
    // Recent bookings (5 most recent within the period)
    const recent = [...filtered]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    return {
      periodStart,
      filtered,
      totalBookings,
      totalRevenue,
      occupancyRate,
      distribution,
      trends,
      revenueByService,
      recent,
    }
  }, [reservations, services, staff, timeRange])

  // Helper function: get ISO week number for a given date
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  // Helper to generate a deterministic colour from a name
  function generateColor(name: string) {
    const colors = ["#EC4899", "#F59E0B", "#10B981", "#8B5CF6", "#06B6D4", "#F43F5E"]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  if (sessionLoading) {
    return <div>Loading...</div>
  }
  if (sessionError) {
    return <div className="text-red-500">{sessionError}</div>
  }
  if (reservationsLoading || servicesLoading || staffLoading) {
    return <div>Loading dashboard data...</div>
  }
  if (reservationsError || servicesError || staffError) {
    return <div className="text-red-500">Error loading dashboard data.</div>
  }

  // Derive display strings for service distribution (e.g. "Haircuts: 40%, Massages: 30%, UV: 30%")
  const distributionText = analytics.distribution
    .map((d) => `${d.name}: ${d.percentage}%`)
    .join(", ")

  // Compute simple percentage change for booking trends and revenue.  We
  // compare the last data point to the previous one; if there is only
  // one data point then the change is zero.
  const bookingChange = analytics.trends.length > 1
    ? ((analytics.trends[analytics.trends.length - 1].bookings - analytics.trends[analytics.trends.length - 2].bookings) /
        Math.max(analytics.trends[analytics.trends.length - 2].bookings, 1)) * 100
    : 0
  const revenueTotals = analytics.revenueByService.map((r) => r.revenue)
  const revenueChange = revenueTotals.length > 1
    ? ((revenueTotals[revenueTotals.length - 1] - revenueTotals[revenueTotals.length - 2]) /
        Math.max(revenueTotals[revenueTotals.length - 2], 1)) * 100
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your business performance</p>
        </div>
        {/* Time range selector */}
        <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
          {(["daily", "weekly", "monthly"] as const).map((range) => (
            <button
              key={range}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === range ? "bg-pink-600 text-white" : "text-gray-700 hover:bg-pink-50"
              }`}
              onClick={() => setTimeRange(range)}
            >
              {range === "daily" ? "Daily" : range === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total bookings */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Bookings</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{analytics.totalBookings}</p>
          </div>
        </div>
        {/* Revenue */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Revenue</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">${analytics.totalRevenue.toFixed(0)}</p>
          </div>
        </div>
        {/* Occupancy Rate */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{analytics.occupancyRate.toFixed(0)}%</p>
          </div>
        </div>
        {/* Service Distribution */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Service Distribution</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-line">{distributionText}</p>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Booking Trends</h3>
            <p className={`text-sm font-medium ${bookingChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {bookingChange >= 0 ? "+" : ""}
              {bookingChange.toFixed(0)}%
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}`, "Bookings"]} />
              <Line type="monotone" dataKey="bookings" stroke="#EC4899" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Revenue by service type */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue by Service Type</h3>
            <p className={`text-sm font-medium ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {revenueChange >= 0 ? "+" : ""}
              {revenueChange.toFixed(0)}%
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.revenueByService}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.recent.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {booking.customerInfo?.name || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.serviceId?.name || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.time || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.staffId?.name || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "completed"
                          ? "bg-purple-100 text-purple-800"
                          : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : booking.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}