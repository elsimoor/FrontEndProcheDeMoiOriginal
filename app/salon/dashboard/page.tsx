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
import useTranslation from "@/hooks/useTranslation"
// Import currency helpers to format amounts and perform conversions.  The
// formatCurrency function converts a value from a base currency
// (defaulting to USD) into a target currency and prepends the
// appropriate symbol.  convertAmount returns a numeric value in the
// target currency without formatting.  These helpers ensure
// consistency across the dashboard when displaying monetary values.
import { formatCurrency, convertAmount } from "@/lib/currency"
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
  const { t } = useTranslation()
  // Session state: determine which salon (client) this dashboard
  // represents.  If the user does not belong to a salon business
  // then an error message is displayed.
  const [salonId, setSalonId] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  // Date range for filtering dashboard statistics.  Defaults to today
  // for both start and end.  This aligns the salon dashboard
  // overview with the revenue recognition policy used across
  // modules, showing bookings made today by default.  Users can
  // still extend the range via the date inputs or quick range buttons.
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const now = new Date()
    // Initialise the start date to today at 00:00 local time.  Setting
    // the time explicitly prevents toISOString() from shifting the
    // date into the previous day when converting to UTC.  This value
    // will later be normalised to the start of the day within the
    // analytics computation.
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const now = new Date()
    // Initialise the end date to the very end of today (23:59:59.999).
    // Without this, the default time of 00:00 would cause the
    // analytics filter to exclude bookings created later in the day.
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setHours(23, 59, 59, 999)
    return d
  })
  // Helper to quickly set a range relative to today.  The end date is
  // always today and the start date is the given number of months ago.
  const handleQuickRange = (months: number) => {
    // Quickly set a range spanning the given number of months back from today.
    // The start date is normalised to 00:00 and the end date to
    // 23:59:59.999 to ensure all reservations created on the end day
    // are included.  Without adjusting the time components the end
    // date would default to midnight, excluding bookings later in the
    // day and forcing users to extend the range by one day to see
    // today’s reservations.
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()
    start.setMonth(start.getMonth() - months)
    start.setHours(0, 0, 0, 0)
    setStartDate(start)
    setEndDate(end)
  }

  // Query the salon settings to determine the preferred currency.  We
  // include only the currency field from the settings object.  If the
  // query is skipped (before salonId is known) or no currency is
  // returned, we fall back to USD.
  const GET_SALON_SETTINGS = gql`
    query GetSalonSettings($id: ID!) {
      salon(id: $id) {
        id
        settings {
          currency
        }
      }
    }
  `
  const { data: settingsData } = useQuery(GET_SALON_SETTINGS, {
    variables: { id: salonId },
    skip: !salonId,
  })
  const currency = settingsData?.salon?.settings?.currency || 'USD'

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
   * Compute filtered reservations based on the selected date range.  We
   * include only reservations whose date falls between the start and
   * end dates (inclusive).  The occupancy rate compares the total
   * booked minutes to the available minutes within the period (each
   * staff member can work 8 hours per day).  Trends are derived by
   * grouping bookings by month for up to the last four months in the
   * range.
   */
  const analytics = useMemo(() => {
    // If no range is selected, default to the current month through today.
    // Convert the start and end dates to Date objects and normalise
    // them to span the entire day.  The start date is set to
    // midnight (00:00) and the end date is set to 23:59:59.999.  If
    // we leave the default time at 00:00 for the end date, any
    // reservation created later in the same day would not satisfy
    // `d <= end` and thus be excluded from the filtered set.  This
    // adjustment ensures that selecting a date range like
    // 2025‑08‑27 to 2025‑08‑27 includes all bookings created on
    // 2025‑08‑27 regardless of their creation time.
    const start = startDate ? new Date(startDate) : new Date()
    start.setHours(0, 0, 0, 0)
    const end = endDate ? new Date(endDate) : new Date()
    end.setHours(23, 59, 59, 999)
    // Ensure start is not after end
    if (start > end) {
      return {
        filtered: [],
        totalBookings: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        distribution: [],
        trends: [],
        revenueByService: [],
        recent: [],
      }
    }
    // Filter reservations within the selected period based on when the
    // booking was created rather than the service date.  Using
    // r.createdAt ensures that bookings scheduled in the future are
    // attributed to the day they were made.  If createdAt is missing
    // (which should be rare) we exclude the reservation from the
    // filtered set.
    const filtered = reservations.filter((r) => {
      if (!r.createdAt) return false
      const d = new Date(r.createdAt)
      return d >= start && d <= end
    })
    const totalBookings = filtered.length
    const totalRevenue = filtered.reduce((sum, r) => sum + (r.serviceId?.price || 0), 0)
    // Sum durations in minutes; default to 60 minutes if undefined
    const totalMinutes = filtered.reduce((sum, r) => sum + (r.serviceId?.duration || 60), 0)
    // available minutes: number of days * number of staff * 8 hours (480 minutes)
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
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
    // Trends by month: compute bookings for up to the last four months in the range
    const trends: { name: string; bookings: number }[] = []
    // Determine the number of months between start and end (inclusive)
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    const monthsToShow = Math.min(diffMonths + 1, 4)
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = new Date(end.getFullYear(), end.getMonth() - i, 1)
      const label = monthDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      const count = filtered.filter((r) => {
        if (!r.createdAt) return false
        const d = new Date(r.createdAt)
        return d >= monthStart && d <= monthEnd
      }).length
      trends.push({ name: label, bookings: count })
    }
    // Revenue by service type: compute totals based on filtered
    // reservations.  Each reservation contributes its service price if
    // the booking was created within the selected period.  Service
    // names default to "Autre" when undefined.
    const revenueByService: { name: string; revenue: number }[] = []
    Object.keys(serviceCounts).forEach((name) => {
      const revenue = filtered
        .filter((r) => (r.serviceId?.name || 'Autre') === name)
        .reduce((sum, r) => sum + (r.serviceId?.price || 0), 0)
      revenueByService.push({ name, revenue })
    })
    // Recent bookings (5 most recent within the period) based on creation date
    const recent = [...filtered]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return db - da
      })
      .slice(0, 5)
    return {
      /*
       * Include the full list of reservations that fall within the selected
       * date range.  This mirrors the hotel dashboard’s behaviour of
       * displaying all bookings created today by default and allows the
       * table below to list every matching reservation instead of a
       * truncated “recent” subset.  The `reservationsInRange` array is
       * identical to the filtered list computed above.
       */
      reservationsInRange: filtered,
      totalBookings,
      totalRevenue,
      occupancyRate,
      distribution,
      trends,
      revenueByService,
      /*
       * Keep the recent bookings list for compatibility with the
       * existing “Réservations récentes” section.  This list is the
       * 5 most recently created reservations within the period and is
       * sorted in descending order by createdAt.
       */
      recent,
    }
  }, [reservations, services, staff, startDate, endDate])

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
    // Show generic loading message
    return <div>{t('loading')}</div>
  }
  if (sessionError) {
    // Translate known session errors
    return (
      <div className="text-red-500">
        {sessionError.includes('not associated') ? t('notAssociatedWithSalon') : t('failedToLoadSession')}
      </div>
    )
  }
  if (reservationsLoading || servicesLoading || staffLoading) {
    return <div>{t('loading')}</div>
  }
  if (reservationsError || servicesError || staffError) {
    return <div className="text-red-500">{t('failedToLoadDashboardData')}</div>
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
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('salonDashboard')}</h1>
          <p className="text-gray-600">{t('dashboardOverview')}</p>
        </div>
        {/* Date range picker for dashboard metrics.  Users can select a custom
            period using two date inputs or quickly apply predefined ranges
            via the Last Month/3 Months/6 Months buttons. */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="salon-start" className="text-sm font-medium text-gray-700">
              {t('from') || 'From'}
            </label>
            <input
              id="salon-start"
              type="date"
              value={startDate
                ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
                : ''}
              onChange={(e) => {
                const value = e.target.value
                if (value) {
                  const d = new Date(value)
                  // Normalise the start date to the beginning of the selected day
                  d.setHours(0, 0, 0, 0)
                  setStartDate(d)
                } else {
                  setStartDate(undefined)
                }
              }}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="salon-end" className="text-sm font-medium text-gray-700">
              {t('to') || 'To'}
            </label>
            <input
              id="salon-end"
              type="date"
              value={endDate
                ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
                : ''}
              onChange={(e) => {
                const value = e.target.value
                if (value) {
                  const d = new Date(value)
                  // Normalise the end date to the end of the selected day
                  d.setHours(23, 59, 59, 999)
                  setEndDate(d)
                } else {
                  setEndDate(undefined)
                }
              }}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleQuickRange(1)}
              className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
            >
              {t('lastMonth') || 'Last Month'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickRange(3)}
              className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
            >
              {t('last3Months') || 'Last 3 Months'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickRange(6)}
              className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
            >
              {t('last6Months') || 'Last 6 Months'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickRange(12)}
              className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
            >
              {t('lastYear') || 'Last 12 Months'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total bookings */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('totalBookings')}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{analytics.totalBookings}</p>
          </div>
        </div>
        {/* Revenue */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('revenueLabel')}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {
                /*
                 * Display the total revenue in the salon’s selected currency.  The
                 * `formatCurrency` helper automatically converts the revenue (assumed
                 * to be stored in USD) into the target currency and prefixes the
                 * appropriate symbol.  If no currency is defined the value will
                 * remain in USD.
                 */
              }
              {formatCurrency(analytics.totalRevenue ?? 0, currency)}
            </p>
          </div>
        </div>
        {/* Occupancy Rate */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('occupancyRateLabel')}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{analytics.occupancyRate.toFixed(0)}%</p>
          </div>
        </div>
        {/* Service Distribution */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('serviceDistributionLabel')}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 whitespace-pre-line">{distributionText}</p>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('bookingTrends')}</h3>
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
            <h3 className="text-lg font-semibold text-gray-900">{t('revenueByServiceType')}</h3>
            <p className={`text-sm font-medium ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {revenueChange >= 0 ? "+" : ""}
              {revenueChange.toFixed(0)}%
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {
              /*
               * Convert each revenue value into the selected currency before
               * rendering the bar chart.  The conversion uses USD as the
               * base currency for all service prices and scales according
               * to the salon’s currency.  The Tooltip is customised to
               * display the formatted value with the appropriate symbol.
               */
            }
            <BarChart
              data={analytics.revenueByService.map((item) => ({
                ...item,
                revenue: convertAmount(item.revenue, 'USD', currency),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number, currency), 'Revenue']} />
              <Bar dataKey="revenue" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/*
       * Reservations table for the selected date range.  This mirrors the
       * hotel dashboard by listing all reservations whose creation
       * date falls between the chosen start and end dates.  When the
       * range spans only a single day (the default), the table
       * effectively shows today’s bookings.  If there are no
       * reservations in the period a friendly message is displayed.
       */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{t('todaysReservations')}</h2>
        {analytics.reservationsInRange.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700">{t('clientLabel')}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t('serviceLabel')}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t('dateLabelColumn')}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t('timeLabel')}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t('staffLabel')}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t('amount') || 'Amount'}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t('statusLabelColumn')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.reservationsInRange.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                      {booking.customerInfo?.name || '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      {booking.serviceId?.name || '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      {booking.date}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      {booking.time || '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      {booking.staffId?.name || '—'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      {formatCurrency(booking.serviceId?.price || 0, currency)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'completed'
                            ? 'bg-purple-100 text-purple-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {t(booking.status as any)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t('noReservationsToday')}</p>
        )}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('recentBookings')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('clientLabel')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('serviceLabel')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dateLabelColumn')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('timeLabel')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('staffLabel')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('statusLabelColumn')}
                </th>
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
                      {t(booking.status as any)}
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