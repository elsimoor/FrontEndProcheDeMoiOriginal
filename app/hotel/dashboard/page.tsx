"use client";

import { useState, useEffect, useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// Import currency helpers to format amounts based on hotel settings
import { formatCurrency, currencySymbols, convertAmount } from "@/lib/currency";
import { Calendar, Users, Bed, DollarSign } from "lucide-react";
import useTranslation from "@/hooks/useTranslation";

/**
 * This page renders the main dashboard for hotel businesses.  It pulls
 * real‑time data from the backend via GraphQL to compute high level
 * statistics such as today’s bookings, current guests, occupancy rate,
 * daily revenue and revenue by month.  Charts are used to visualise
 * room type distribution and monthly revenue.  A table lists today’s
 * reservations with guest and status information.
 */

// Query to fetch all rooms for a hotel.  We fetch minimal fields
// necessary for computing statistics.
const GET_ROOMS = gql`
  query GetRooms($hotelId: ID!) {
    rooms(hotelId: $hotelId) {
      id
      type
      status
    }
  }
`;

// Query to fetch all reservations for a business (hotel).  We fetch
// enough fields to compute metrics and render the reservations table.
const GET_RESERVATIONS = gql`
  query GetReservations($businessId: ID!, $businessType: String!) {
    reservations(businessId: $businessId, businessType: $businessType) {
      id
      customerInfo {
        name
      }
      roomId {
        id
        number
      }
      checkIn
      checkOut
      guests
      status
      totalAmount
      createdAt
    }
  }
`;

// Utility to format a date string into a Date object.  GraphQL strings
// are ISO 8601 so the Date constructor is sufficient.
const parseDate = (dateStr: string | null | undefined): Date | null => {
  return dateStr ? new Date(dateStr) : null;
};

// Helper to determine if two dates represent the same calendar day.
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

// Produce an array of the last six months (including the month of the
// provided reference date).  If no reference date is supplied the
// current date is used.  Each entry has a month name (e.g. "Jan")
// and a year.
const getLastSixMonths = (referenceDate: Date = new Date()) => {
  const months: { month: string; year: number }[] = [];
  // Start from the first day of the reference month
  const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push({ month: d.toLocaleString(undefined, { month: "short" }), year: d.getFullYear() });
  }
  return months;
};

// Colour palette for pie chart slices.  Extend or modify as needed.
const TYPE_COLORS: { [key: string]: string } = {
  Standard: "#3b82f6", // blue
  Deluxe: "#10b981", // green
  Suite: "#f59e0b", // amber
  Executive: "#ef4444", // red
  Other: "#8b5cf6", // purple
};

// GraphQL query to fetch hotel settings including currency.  We will use
// this to display revenue and chart values in the correct currency.
const GET_HOTEL_SETTINGS = gql`
  query GetHotelSettings($id: ID!) {
    hotel(id: $id) {
      settings {
        currency
      }
    }
  }
`;

export default function HotelDashboardPage() {
  // Business context derived from the session.  We store the hotel
  // identifier and business type once loaded.  A null hotelId means
  // either the session is still loading or the user is not associated
  // with a hotel account.
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Selected date for filtering dashboard statistics.  Defaults to
  // today (ISO format).  Changing this value will recompute
  // statistics based on the chosen day.
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });

  // Use translation hook to retrieve text labels based on the current locale.
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          setSessionLoading(false);
          return;
        }
        const data = await res.json();
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setHotelId(data.businessId);
          setBusinessType(data.businessType);
        } else {
          setSessionError(t("notAssociatedWithHotel"));
        }
      } catch (err) {
        setSessionError(t("failedToLoadSession"));
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  // Fetch rooms when the hotelId is available
  const {
    data: roomsData,
    loading: roomsLoading,
    error: roomsError,
  } = useQuery(GET_ROOMS, {
    variables: { hotelId },
    skip: !hotelId,
  });

  // Fetch reservations when the business context is available
  const {
    data: reservationsData,
    loading: reservationsLoading,
    error: reservationsError,
  } = useQuery(GET_RESERVATIONS, {
    variables: { businessId: hotelId, businessType },
    skip: !hotelId || !businessType,
  });

  // Fetch hotel settings to determine the currency.  Skip until
  // hotelId is known.  Provide sensible defaults if settings are
  // unavailable.
  const { data: settingsData } = useQuery(GET_HOTEL_SETTINGS, {
    variables: { id: hotelId },
    skip: !hotelId,
  });
  const currency: string = settingsData?.hotel?.settings?.currency || 'USD';
  const currencySymbol: string = currencySymbols[currency] || '$';

  // Compute statistics once data is loaded.  useMemo avoids
  // recomputation on every render.
  const stats = useMemo(() => {
    if (!roomsData || !reservationsData) return null;
    const rooms = roomsData.rooms;
    const reservations = reservationsData.reservations;
    // Use the selected date as the reference for filtering.  If
    // selectedDate is empty (should not happen) fall back to today.
    const refDate = selectedDate ? new Date(selectedDate) : new Date();

    // Reservations occurring on the selected date.  Consider both
    // reservation creation date and check‑in date for the definition of
    // a booking on a given day.
    const todaysReservations = reservations.filter((r: any) => {
      const createdAt = parseDate(r.createdAt);
      const checkIn = parseDate(r.checkIn);
      return (
        (createdAt && isSameDay(createdAt, refDate)) ||
        (checkIn && isSameDay(checkIn, refDate))
      );
    });

    // Guests currently staying on the selected date: check if the
    // reference date is within the reservation interval.  Exclude
    // cancelled reservations.
    const currentGuests = reservations.filter((r: any) => {
      const checkIn = parseDate(r.checkIn);
      const checkOut = parseDate(r.checkOut);
      if (!checkIn || !checkOut) return false;
      return checkIn <= refDate && refDate <= checkOut && r.status !== "cancelled";
    });

    // Occupied rooms count for occupancy rate
    const occupiedRoomIds = new Set(
      currentGuests.map((r: any) => r.roomId?.id).filter(Boolean),
    );
    const occupancyRate = rooms.length > 0 ? (occupiedRoomIds.size / rooms.length) * 100 : 0;

    // Revenue for the selected date: sum of totalAmount for
    // reservations starting on the reference date.
    const revenueToday = todaysReservations.reduce(
      (sum: number, r: any) => sum + (r.totalAmount || 0),
      0,
    );

    // Monthly revenue for the last six months relative to the selected
    // date.  Each month is represented as an object with a label and
    // total revenue aggregated from reservations with check‑in or
    // creation dates in that month.
    const months = getLastSixMonths(refDate);
    const monthlyRevenue = months.map(({ month, year }) => {
      const total = reservations.reduce((acc: number, r: any) => {
        const checkIn = parseDate(r.checkIn);
        const createdAt = parseDate(r.createdAt);
        const date = checkIn || createdAt;
        if (
          date &&
          date.getFullYear() === year &&
          date.toLocaleString(undefined, { month: "short" }) === month
        ) {
          return acc + (r.totalAmount || 0);
        }
        return acc;
      }, 0);
      return { month: `${month} ${year.toString().slice(-2)}`, revenue: total };
    });

    // Room type distribution remains constant regardless of the selected date.
    const typeCounts: { [key: string]: number } = {};
    rooms.forEach((room: any) => {
      const type = room.type || "Other";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const roomTypeData = Object.keys(typeCounts).map((type) => ({
      name: type,
      value: typeCounts[type],
    }));

    return {
      todaysReservations,
      todaysBookingsCount: todaysReservations.length,
      currentGuestsCount: currentGuests.reduce((acc: number, r: any) => acc + (r.guests || 0), 0),
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      revenueToday,
      monthlyRevenue,
      roomTypeData,
    };
  }, [roomsData, reservationsData, selectedDate]);

  // Loading and error states
  if (sessionLoading || roomsLoading || reservationsLoading) {
    return <div className="p-6">{t("loading")}</div>;
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>;
  }
  if (roomsError || reservationsError || !stats) {
    return <div className="p-6 text-red-600">{t("failedToLoadDashboardData")}</div>;
  }

  // Helper to get status color classes
  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("hotelDashboard")}</h1>
        <p className="text-gray-600">{t("hotelDashboardSubtitle")}</p>
        {/* Date filter: select a specific day to view statistics */}
        <div className="mt-2 flex items-center space-x-2">
          <label htmlFor="hotel-date-filter" className="text-sm text-gray-600">
            {t("filterDate")}:
          </label>
          <input
            id="hotel-date-filter"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          />
        </div>
      </div>
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Today’s Bookings */}
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t("todaysBookings")}</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.todaysBookingsCount}</p>
          </div>
          <Calendar className="h-8 w-8 text-blue-500" />
        </div>
        {/* Current Guests */}
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t("currentGuests")}</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.currentGuestsCount}</p>
          </div>
          <Users className="h-8 w-8 text-green-500" />
        </div>
        {/* Occupancy Rate */}
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t("occupancyRate")}</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.occupancyRate}%</p>
          </div>
          <Bed className="h-8 w-8 text-yellow-500" />
        </div>
        {/* Revenue Today */}
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t("revenueToday")}</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.revenueToday, currency)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-purple-500" />
        </div>
      </div>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t("monthlyRevenue")}</h2>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyRevenue.map((m: any) => ({ ...m, revenue: convertAmount(m.revenue, 'USD', currency) }))}>
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <RechartTooltip formatter={(value: any) => formatCurrency(value as number, currency)} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Room Type Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t("roomTypeDistribution")}</h2>
          <div className="w-full h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.roomTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name} (${entry.value})`}
                >
                  {stats.roomTypeData.map((entry: any, index: number) => {
                    const color = TYPE_COLORS[entry.name] || TYPE_COLORS["Other"];
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <RechartTooltip formatter={(value: any) => value} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Today’s Reservations Table */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{t("todaysReservations")}</h2>
        {stats.todaysReservations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700">{t("guest")}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t("room")}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t("checkIn")}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t("checkOut")}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t("guestsCount")}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t("amount")}</th>
                  <th className="px-4 py-2 font-medium text-gray-700">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.todaysReservations.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2">{r.customerInfo?.name || t("na")}</td>
                    <td className="px-4 py-2">{r.roomId?.number || t("na")}</td>
                    <td className="px-4 py-2">
                      {parseDate(r.checkIn)?.toLocaleDateString() || ""}
                    </td>
                    <td className="px-4 py-2">
                      {parseDate(r.checkOut)?.toLocaleDateString() || ""}
                    </td>
                    <td className="px-4 py-2">{r.guests}</td>
                    <td className="px-4 py-2">{formatCurrency(r.totalAmount ?? 0, currency)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(r.status)}`}>
                        {t(r.status.toLowerCase())}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{t("noReservationsToday")}</p>
        )}
      </div>
    </div>
  );
}