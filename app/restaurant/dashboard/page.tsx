"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  Calendar,
  Users,
  UtensilsCrossed,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"

/*
 * This page renders the main dashboard for restaurant businesses.  It
 * mirrors the hotel dashboard by pulling live data from the backend via
 * GraphQL.  Statistics such as today’s reservations, current diners,
 * completed orders and daily revenue are computed on the client from
 * the reservations returned by the API.  Menu items are used to
 * determine popular dishes.  Charts are rendered with recharts using
 * the computed datasets.
 */

import { useState, useEffect, useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import useTranslation from "@/hooks/useTranslation";

// Query to fetch reservations for a restaurant.  We request
// minimal fields needed to compute statistics and render the
// reservations table.
const GET_RESERVATIONS = gql`
  query GetReservations($businessId: ID!, $businessType: String!) {
    reservations(businessId: $businessId, businessType: $businessType) {
      id
      customerInfo {
        name
      }
      tableId {
        id
        number
      }
      partySize
      date
      time
      status
      totalAmount
      createdAt
    }
  }
`;

// Query to fetch menu items for a restaurant.  We fetch only
// fields necessary to compute the popular dishes chart.
const GET_MENU_ITEMS = gql`
  query GetMenuItems($restaurantId: ID!) {
    menuItems(restaurantId: $restaurantId) {
      id
      name
      category
      popular
    }
  }
`;

// Utility functions for dates
const parseDate = (dateStr: string | null | undefined): Date | null => {
  return dateStr ? new Date(dateStr) : null;
};
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

// Generate an array of the last six months for the revenue chart.  This
// function accepts an optional reference date so that the chart
// reflects months relative to the selected date rather than always
// starting from the current month.
const getLastSixMonths = (referenceDate?: Date) => {
  const months: { month: string; year: number }[] = [];
  const date = referenceDate ? new Date(referenceDate) : new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push({ month: d.toLocaleString(undefined, { month: "short" }), year: d.getFullYear() });
  }
  return months;
};

// Colour palette for popular dishes chart.  Extend or modify as needed.
const DISH_COLORS = ["#EF4444", "#F59E0B", "#10B981", "#8B5CF6", "#3B82F6", "#F97316"];

export default function RestaurantDashboard() {
  // Acquire translation function
  const { t } = useTranslation();
  // Business context derived from the session.  A null restaurantId
  // indicates loading or unauthorised access.
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Date filter: allows the user to select a specific day for which
  // statistics will be computed.  Defaults to today when the page
  // first loads.  Changing this value will recompute the metrics
  // based on the chosen date.
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          setSessionLoading(false);
          return;
        }
        const data = await res.json();
        if (data.businessType && data.businessType.toLowerCase() === "restaurant" && data.businessId) {
          setRestaurantId(data.businessId);
          setBusinessType(data.businessType);
        } else {
          setSessionError("You are not associated with a restaurant business.");
        }
      } catch (err) {
        setSessionError("Failed to load session.");
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  // Fetch reservations and menu items once business context is available
  const {
    data: reservationsData,
    loading: reservationsLoading,
    error: reservationsError,
  } = useQuery(GET_RESERVATIONS, {
    variables: { businessId: restaurantId, businessType },
    skip: !restaurantId || !businessType,
  });
  const {
    data: menuData,
    loading: menuLoading,
    error: menuError,
  } = useQuery(GET_MENU_ITEMS, {
    variables: { restaurantId },
    skip: !restaurantId,
  });

  // Compute statistics once data is loaded
  const stats = useMemo(() => {
    if (!reservationsData) return null;
    const reservations = reservationsData.reservations;
    // Use the selected date as the reference; fall back to today if undefined
    const now = selectedDate ? new Date(selectedDate) : new Date();
    // Filter reservations for the selected day
    const todays = reservations.filter((r: any) => {
      const date = parseDate(r.date);
      return date && isSameDay(date, now);
    });
    // Current diners: reservations on the selected day with statuses indicating an active diner
    const current = reservations.filter((r: any) => {
      const date = parseDate(r.date);
      return (
        date &&
        isSameDay(date, now) &&
        (r.status === "confirmed" || r.status === "in-progress" || r.status === "seated")
      );
    });
    // Completed orders: reservations marked completed on the selected day
    const completed = reservations.filter((r: any) => {
      const date = parseDate(r.date);
      return date && isSameDay(date, now) && r.status === "completed";
    });
    // Revenue for the selected day: sum totalAmount for today's reservations
    const revenueToday = todays.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
    // Monthly revenue for the last 6 months relative to the selected date
    const months = getLastSixMonths(now);
    const monthlyRevenue = months.map(({ month, year }) => {
      const total = reservations.reduce((acc: number, r: any) => {
        const date = parseDate(r.date) || parseDate(r.createdAt);
        if (
          date &&
          date.getFullYear() === year &&
          date.toLocaleString(undefined, { month: "short" }) === month
        ) {
          return acc + (r.totalAmount || 0);
        }
        return acc;
      }, 0);
      return { name: month, revenue: total };
    });
    // Count reservations by status for the selected day
    const statusCounts: Record<string, number> = {};
    for (const res of reservations) {
      const date = parseDate(res.date);
      if (date && isSameDay(date, now)) {
        const status = res.status || "pending";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    }
    return {
      todays,
      current,
      completed,
      revenueToday,
      monthlyRevenue,
      totalReservations: todays.length,
      statusCounts,
    };
  }, [reservationsData, selectedDate]);

  // Compute popular dishes once menu items load.  We group by
  // category/name and count occurrences of the `popular` flag.
  const dishChart = useMemo(() => {
    if (!menuData) return [];
    const items = menuData.menuItems;
    const popularItems = items.filter((item: any) => item.popular);
    // Count by category/name; fallback to name if no category
    const counts: Record<string, number> = {};
    for (const item of popularItems) {
      const key = item.name || item.category || "Other";
      counts[key] = (counts[key] || 0) + 1;
    }
    const entries = Object.entries(counts);
    // Take top 6 entries
    return entries.slice(0, 6).map(([name, value], index) => ({
      name,
      value,
      color: DISH_COLORS[index % DISH_COLORS.length],
    }));
  }, [menuData]);

  if (sessionLoading || reservationsLoading || menuLoading) {
    return <div className="p-6">{t('loading')}</div>;
  }
  if (sessionError) {
    // Translate known session errors when possible
    return <div className="p-6 text-red-600">{t('notAssociatedWithRestaurant') ?? sessionError}</div>;
  }
  if (reservationsError) {
    return <div className="p-6 text-red-600">{t('errorLoadingReservations')}</div>;
  }
  if (menuError) {
    return <div className="p-6 text-red-600">{t('errorLoadingMenuItems')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('restaurantDashboardTitle')}</h1>
          <p className="text-gray-600">{t('restaurantDashboardSubtitle')}</p>
        </div>
        {/* Date Picker */}
        <div className="flex items-center space-x-2">
          <label htmlFor="restaurant-date" className="text-sm font-medium text-gray-700">
            {t('dateLabel')}
          </label>
          <input
            id="restaurant-date"
            type="date"
            value={selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedDate(value ? new Date(value) : undefined);
            }}
            className="border border-gray-300 rounded-md p-2 text-sm"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('todaysReservationsRestaurant')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.todays.length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('currentDiners')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.current.length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UtensilsCrossed className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('ordersCompleted')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completed.length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('revenueTodayRestaurant')}</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats ? stats.revenueToday.toLocaleString() : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Reservations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('pendingStatus')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.statusCounts?.pending ?? 0}
              </p>
            </div>
          </div>
        </div>
        {/* Confirmed Reservations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('confirmedStatus')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.statusCounts?.confirmed ?? 0}
              </p>
            </div>
          </div>
        </div>
        {/* Cancelled Reservations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('cancelledStatus')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.statusCounts?.cancelled ?? 0}
              </p>
            </div>
          </div>
        </div>
        {/* No Shows */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('noShowStatus')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.statusCounts?.["no-show"] ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('monthlyRevenueChartTitle')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.monthlyRevenue ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, t('revenueLabel') ?? 'Revenue']} />
              <Bar dataKey="revenue" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('popularDishesChartTitle')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dishChart}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {dishChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value}`, t('ordersLabel')]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center mt-4 space-x-4">
            {dishChart.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Reservations */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Today's Reservations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.todays.map((reservation: any) => (
                <tr key={reservation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reservation.customerInfo?.name || t('guestFallback')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.tableId?.number ? `${t('tableLabel')} ${reservation.tableId.number}` : "–"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.time || "–"}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.partySize || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reservation.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : reservation.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : reservation.status === "completed"
                          ? "bg-purple-100 text-purple-800"
                          : reservation.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {t(reservation.status) || reservation.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats?.todays.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    {t('noReservationsTodayRestaurant')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
