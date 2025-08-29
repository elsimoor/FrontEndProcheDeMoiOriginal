// "use client";

// import { useState, useEffect, useMemo } from "react";
// import { gql, useQuery } from "@apollo/client";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip as RechartTooltip,
//   PieChart,
//   Pie,
//   Cell,
//   ResponsiveContainer,
// } from "recharts";

// // Import currency helpers to format amounts based on hotel settings
// import { formatCurrency, currencySymbols, convertAmount } from "@/lib/currency";
// import { Calendar, Users, Bed, DollarSign } from "lucide-react";
// import useTranslation from "@/hooks/useTranslation";

// /**
//  * This page renders the main dashboard for hotel businesses.  It pulls
//  * real‑time data from the backend via GraphQL to compute high level
//  * statistics such as today’s bookings, current guests, occupancy rate,
//  * daily revenue and revenue by month.  Charts are used to visualise
//  * room type distribution and monthly revenue.  A table lists today’s
//  * reservations with guest and status information.
//  */

// // Query to fetch all rooms for a hotel.  We fetch minimal fields
// // necessary for computing statistics.
// const GET_ROOMS = gql`
//   query GetRooms($hotelId: ID!) {
//     rooms(hotelId: $hotelId) {
//       id
//       type
//       status
//     }
//   }
// `;

// // Query to fetch all reservations for a business (hotel).  We fetch
// // enough fields to compute metrics and render the reservations table.
// const GET_RESERVATIONS = gql`
//   query GetReservations($businessId: ID!, $businessType: String!) {
//     reservations(businessId: $businessId, businessType: $businessType) {
//       id
//       customerInfo {
//         name
//       }
//       roomId {
//         id
//         number
//       }
//       checkIn
//       checkOut
//       guests
//       status
//       totalAmount
//       createdAt
//     }
//   }
// `;

// // Utility to format a date string into a Date object.  GraphQL strings
// // are ISO 8601 so the Date constructor is sufficient.
// const parseDate = (dateStr: string | null | undefined): Date | null => {
//   return dateStr ? new Date(dateStr) : null;
// };

// // Helper to determine if two dates represent the same calendar day.
// const isSameDay = (d1: Date, d2: Date) =>
//   d1.getFullYear() === d2.getFullYear() &&
//   d1.getMonth() === d2.getMonth() &&
//   d1.getDate() === d2.getDate();

// // Produce an array of the last six months (including the month of the
// // provided reference date).  If no reference date is supplied the
// // current date is used.  Each entry has a month name (e.g. "Jan")
// // and a year.
// const getLastSixMonths = (referenceDate: Date = new Date()) => {
//   const months: { month: string; year: number }[] = [];
//   // Start from the first day of the reference month
//   const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
//   for (let i = 5; i >= 0; i--) {
//     const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
//     months.push({ month: d.toLocaleString(undefined, { month: "short" }), year: d.getFullYear() });
//   }
//   return months;
// };

// // Colour palette for pie chart slices.  Extend or modify as needed.
// const TYPE_COLORS: { [key: string]: string } = {
//   Standard: "#3b82f6", // blue
//   Deluxe: "#10b981", // green
//   Suite: "#f59e0b", // amber
//   Executive: "#ef4444", // red
//   Other: "#8b5cf6", // purple
// };

// // GraphQL query to fetch hotel settings including currency.  We will use
// // this to display revenue and chart values in the correct currency.
// const GET_HOTEL_SETTINGS = gql`
//   query GetHotelSettings($id: ID!) {
//     hotel(id: $id) {
//       settings {
//         currency
//       }
//     }
//   }
// `;

// export default function HotelDashboardPage() {
//   // Business context derived from the session.  We store the hotel
//   // identifier and business type once loaded.  A null hotelId means
//   // either the session is still loading or the user is not associated
//   // with a hotel account.
//   const [hotelId, setHotelId] = useState<string | null>(null);
//   const [businessType, setBusinessType] = useState<string | null>(null);
//   const [sessionLoading, setSessionLoading] = useState(true);
//   const [sessionError, setSessionError] = useState<string | null>(null);

//   // Date range for filtering dashboard statistics.  Defaults to today for
//   // both the start and end date.  This ensures that the dashboard
//   // overview initially reflects bookings made today instead of the
//   // entire month.  The user can still expand the range via the
//   // date inputs and quick range buttons.
//   const [startDate, setStartDate] = useState<string>(() => {
//     const now = new Date();
//     return now.toISOString().split("T")[0];
//   });
//   const [endDate, setEndDate] = useState<string>(() => {
//     const now = new Date();
//     return now.toISOString().split("T")[0];
//   });

//   // Helper to quickly set a range relative to today.  Pass the
//   // number of months to look back (e.g. 1 for last month, 3 for the
//   // last three months, etc.).  The end date is always today.
//   const handleQuickRange = (months: number) => {
//     const end = new Date();
//     const start = new Date();
//     start.setMonth(start.getMonth() - months);
//     // Ensure the day exists in previous month (e.g. 31st of March -> 28/29th Feb)
//     // by setting date after month change.  JavaScript will handle overflow.
//     setStartDate(start.toISOString().split('T')[0]);
//     setEndDate(end.toISOString().split('T')[0]);
//   };

//   // Use translation hook to retrieve text labels based on the current locale.
//   const { t } = useTranslation();

//   useEffect(() => {
//     async function fetchSession() {
//       try {
//         const res = await fetch("/api/session");
//         if (!res.ok) {
//           setSessionLoading(false);
//           return;
//         }
//         const data = await res.json();
//         if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
//           setHotelId(data.businessId);
//           setBusinessType(data.businessType);
//         } else {
//           setSessionError(t("notAssociatedWithHotel"));
//         }
//       } catch (err) {
//         setSessionError(t("failedToLoadSession"));
//       } finally {
//         setSessionLoading(false);
//       }
//     }
//     fetchSession();
//   }, []);

//   // Fetch rooms when the hotelId is available
//   const {
//     data: roomsData,
//     loading: roomsLoading,
//     error: roomsError,
//   } = useQuery(GET_ROOMS, {
//     variables: { hotelId },
//     skip: !hotelId,
//   });

//   // Fetch reservations when the business context is available
//   const {
//     data: reservationsData,
//     loading: reservationsLoading,
//     error: reservationsError,
//   } = useQuery(GET_RESERVATIONS, {
//     variables: { businessId: hotelId, businessType },
//     skip: !hotelId || !businessType,
//   });

//   // Fetch hotel settings to determine the currency.  Skip until
//   // hotelId is known.  Provide sensible defaults if settings are
//   // unavailable.
//   const { data: settingsData } = useQuery(GET_HOTEL_SETTINGS, {
//     variables: { id: hotelId },
//     skip: !hotelId,
//   });
//   const currency: string = settingsData?.hotel?.settings?.currency || 'USD';
//   const currencySymbol: string = currencySymbols[currency] || '$';

//   // Compute statistics once data is loaded.  useMemo avoids
//   // recomputation on every render.
//   const stats = useMemo(() => {
//     if (!roomsData || !reservationsData) return null;
//     const rooms = roomsData.rooms;
//     const reservations = reservationsData.reservations;
//     // Parse the start and end dates.  If they are empty strings
//     // (which should not happen), default to today so comparisons
//     // always have a valid date object.
//     // Parse the start and end dates and normalise them to full‑day
//     // boundaries.  Without adjusting the end time to the last
//     // millisecond of the selected day, the filter below would
//     // exclude reservations created later on the same day (e.g. a
//     // booking at 15:00 would not satisfy `createdAt <= end` when
//     // `end` is 00:00).  We therefore set the start to 00:00 and the
//     // end to 23:59:59.999 to make the range inclusive of the entire
//     // end date.  When either startDate or endDate is undefined we
//     // fall back to today.
//     const start = startDate ? new Date(startDate) : new Date();
//     // Normalise start to the beginning of the day
//     start.setHours(0, 0, 0, 0);
//     const end = endDate ? new Date(endDate) : new Date();
//     // Normalise end to the end of the day to include all times on
//     // that date
//     end.setHours(23, 59, 59, 999);

//     // Filter reservations whose creation date falls within the selected range.
//     // Previously we included reservations based on either their creation or
//     // check‑in date, which caused bookings made earlier but checking in
//     // today to appear in today’s revenue.  To accurately reflect
//     // revenue generated on the day the booking was placed, we only
//     // match on the reservation’s createdAt timestamp.  Reservations
//     // lacking a createdAt (unlikely) are excluded from the range.
//     const reservationsInRange = reservations.filter((r: any) => {
//       const createdAt = parseDate(r.createdAt);
//       if (!createdAt) return false;
//       return createdAt >= start && createdAt <= end;
//     });

//     // Guests currently staying within the range: a reservation counts
//     // if its check‑in is on or before the end date and its check‑out
//     // is on or after the start date.  Cancelled reservations are
//     // excluded from the occupancy calculation.
//     const currentGuests = reservations.filter((r: any) => {
//       const checkIn = parseDate(r.checkIn);
//       const checkOut = parseDate(r.checkOut);
//       if (!checkIn || !checkOut) return false;
//       return checkIn <= end && checkOut >= start && r.status !== "cancelled";
//     });

//     // Occupied rooms count for occupancy rate within the range.  We
//     // take the set of distinct room IDs from currentGuests.  For a
//     // more precise occupancy measure we would divide by the total
//     // number of room‑days available; here we approximate by
//     // comparing the number of unique occupied rooms to the total
//     // number of rooms.
//     const occupiedRoomIds = new Set(
//       currentGuests.map((r: any) => r.roomId?.id).filter(Boolean),
//     );
//     const occupancyRate = rooms.length > 0 ? (occupiedRoomIds.size / rooms.length) * 100 : 0;

//     // Revenue for the selected range: sum of totalAmount for
//     // reservations in the range.  If totalAmount is undefined it is
//     // treated as zero.
//     const revenueInRange = reservationsInRange.reduce(
//       (sum: number, r: any) => sum + (r.totalAmount || 0),
//       0,
//     );

//     // Monthly revenue for the last six months relative to the end
//     // date.  Each month is represented as an object with a label and
//     // total revenue aggregated from reservations based on their
//     // creation date rather than check‑in.  Using createdAt aligns the
//     // monthly revenue chart with the revenue recognition policy used
//     // elsewhere in the dashboard.  If createdAt is missing we ignore
//     // the reservation for monthly totals.
//     const months = getLastSixMonths(end);
//     const monthlyRevenue = months.map(({ month, year }) => {
//       const total = reservations.reduce((acc: number, r: any) => {
//         const createdAt = parseDate(r.createdAt);
//         if (
//           createdAt &&
//           createdAt.getFullYear() === year &&
//           createdAt.toLocaleString(undefined, { month: "short" }) === month
//         ) {
//           return acc + (r.totalAmount || 0);
//         }
//         return acc;
//       }, 0);
//       return { month: `${month} ${year.toString().slice(-2)}`, revenue: total };
//     });

//     // Room type distribution remains constant regardless of the selected date range.
//     const typeCounts: { [key: string]: number } = {};
//     rooms.forEach((room: any) => {
//       const type = room.type || "Other";
//       typeCounts[type] = (typeCounts[type] || 0) + 1;
//     });
//     const roomTypeData = Object.keys(typeCounts).map((type) => ({
//       name: type,
//       value: typeCounts[type],
//     }));

//     return {
//       todaysReservations: reservationsInRange,
//       todaysBookingsCount: reservationsInRange.length,
//       currentGuestsCount: currentGuests.reduce((acc: number, r: any) => acc + (r.guests || 0), 0),
//       occupancyRate: Math.round(occupancyRate * 10) / 10,
//       revenueToday: revenueInRange,
//       monthlyRevenue,
//       roomTypeData,
//     };
//   }, [roomsData, reservationsData, startDate, endDate]);

//   // Loading and error states
//   if (sessionLoading || roomsLoading || reservationsLoading) {
//     return <div className="p-6">{t("loading")}</div>;
//   }
//   if (sessionError) {
//     return <div className="p-6 text-red-600">{sessionError}</div>;
//   }
//   if (roomsError || reservationsError || !stats) {
//     return <div className="p-6 text-red-600">{t("failedToLoadDashboardData")}</div>;
//   }

//   // Helper to get status color classes
//   const getStatusClasses = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "confirmed":
//       case "completed":
//         return "bg-green-100 text-green-800";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800";
//       case "cancelled":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   return (
//     <div className="p-6 space-y-8">
//       {/* Header */}
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">{t("hotelDashboard")}</h1>
//         <p className="text-gray-600">{t("hotelDashboardSubtitle")}</p>
//         {/* Date range filter: allow the user to select a start and end date. */}
//         <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
//           <div className="flex items-center space-x-2">
//             <label htmlFor="hotel-start-date" className="text-sm text-gray-600">
//               {t("from") || "From"}:
//             </label>
//             <input
//               id="hotel-start-date"
//               type="date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className="border rounded-md px-2 py-1 text-sm"
//             />
//           </div>
//           <div className="flex items-center space-x-2">
//             <label htmlFor="hotel-end-date" className="text-sm text-gray-600">
//               {t("to") || "To"}:
//             </label>
//             <input
//               id="hotel-end-date"
//               type="date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className="border rounded-md px-2 py-1 text-sm"
//             />
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               type="button"
//               onClick={() => handleQuickRange(1)}
//               className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
//             >
//               {t("lastMonth") || "Last Month"}
//             </button>
//             <button
//               type="button"
//               onClick={() => handleQuickRange(3)}
//               className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
//             >
//               {t("last3Months") || "Last 3 Months"}
//             </button>
//             <button
//               type="button"
//               onClick={() => handleQuickRange(6)}
//               className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
//             >
//               {t("last6Months") || "Last 6 Months"}
//             </button>
//             <button
//               type="button"
//               onClick={() => handleQuickRange(12)}
//               className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
//             >
//               {t("lastYear") || "Last 12 Months"}
//             </button>
//           </div>
//         </div>
//       </div>
//       {/* Metrics Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         {/* Today’s Bookings */}
//         <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
//           <div>
//             <p className="text-sm text-gray-500">{t("todaysBookings")}</p>
//             <p className="text-2xl font-semibold text-gray-900">{stats.todaysBookingsCount}</p>
//           </div>
//           <Calendar className="h-8 w-8 text-blue-500" />
//         </div>
//         {/* Current Guests */}
//         <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
//           <div>
//             <p className="text-sm text-gray-500">{t("currentGuests")}</p>
//             <p className="text-2xl font-semibold text-gray-900">{stats.currentGuestsCount}</p>
//           </div>
//           <Users className="h-8 w-8 text-green-500" />
//         </div>
//         {/* Occupancy Rate */}
//         <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
//           <div>
//             <p className="text-sm text-gray-500">{t("occupancyRate")}</p>
//             <p className="text-2xl font-semibold text-gray-900">{stats.occupancyRate}%</p>
//           </div>
//           <Bed className="h-8 w-8 text-yellow-500" />
//         </div>
//         {/* Revenue Today */}
//         <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
//           <div>
//             <p className="text-sm text-gray-500">{t("revenueToday")}</p>
//             <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.revenueToday, currency, currency)}</p>
//           </div>
//           <DollarSign className="h-8 w-8 text-purple-500" />
//         </div>
//       </div>
//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Monthly Revenue Bar Chart */}
//         <div className="bg-white rounded-lg shadow-sm border p-4">
//           <h2 className="text-lg font-medium text-gray-900 mb-4">{t("monthlyRevenue")}</h2>
//           <div className="w-full h-80">
//             <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={stats.monthlyRevenue.map((m: any) => ({ ...m, revenue: convertAmount(m.revenue, 'USD', currency) }))}>
//                 <XAxis dataKey="month" stroke="#6b7280" />
//                 <YAxis stroke="#6b7280" />
//                 <RechartTooltip formatter={(value: any) => formatCurrency(value as number, currency, currency)} />
//                 <Bar dataKey="revenue" fill="#3b82f6" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//         {/* Room Type Pie Chart */}
//         <div className="bg-white rounded-lg shadow-sm border p-4">
//           <h2 className="text-lg font-medium text-gray-900 mb-4">{t("roomTypeDistribution")}</h2>
//           <div className="w-full h-80 flex items-center justify-center">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={stats.roomTypeData}
//                   dataKey="value"
//                   nameKey="name"
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={80}
//                   label={(entry) => `${entry.name} (${entry.value})`}
//                 >
//                   {stats.roomTypeData.map((entry: any, index: number) => {
//                     const color = TYPE_COLORS[entry.name] || TYPE_COLORS["Other"];
//                     return <Cell key={`cell-${index}`} fill={color} />;
//                   })}
//                 </Pie>
//                 <RechartTooltip formatter={(value: any) => value} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>
//       {/* Today’s Reservations Table */}
//       <div className="bg-white rounded-lg shadow-sm border p-4">
//         <h2 className="text-lg font-medium text-gray-900 mb-4">{t("todaysReservations")}</h2>
//         {stats.todaysReservations.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm text-left">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-2 font-medium text-gray-700">{t("guest")}</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">{t("room")}</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">{t("checkIn")}</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">{t("checkOut")}</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">{t("guestsCount")}</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">{t("amount")}</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">{t("status")}</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {stats.todaysReservations.map((r: any) => (
//                   <tr key={r.id} className="border-t">
//                     <td className="px-4 py-2">{r.customerInfo?.name || t("na")}</td>
//                     <td className="px-4 py-2">{r.roomId?.number || t("na")}</td>
//                     <td className="px-4 py-2">
//                       {parseDate(r.checkIn)?.toLocaleDateString() || ""}
//                     </td>
//                     <td className="px-4 py-2">
//                       {parseDate(r.checkOut)?.toLocaleDateString() || ""}
//                     </td>
//                     <td className="px-4 py-2">{r.guests}</td>
//                     <td className="px-4 py-2">{formatCurrency(r.totalAmount ?? 0, currency, currency)}</td>
//                     <td className="px-4 py-2">
//                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(r.status)}`}>
//                         {t(r.status.toLowerCase())}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <p>{t("noReservationsToday")}</p>
//         )}
//       </div>
//     </div>
//   );
// }




// test1




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

// GraphQL queries for fetching rooms, reservations, and hotel settings
const GET_ROOMS = gql`
  query GetRooms($hotelId: ID!) {
    rooms(hotelId: $hotelId) {
      id
      type
      status
    }
  }
`;

// Query to fetch paginated reservations for the dashboard.  Since the
// backend now returns a ReservationPagination object, we must
// request the docs array and supply page/limit variables.  We
// specify a large limit to retrieve all reservations for the date
// range and metrics computation.  Adjust the limit if your hotel
// expects more than 1000 reservations at once.
const GET_RESERVATIONS = gql`
  query GetReservations(
    $businessId: ID!
    $businessType: String!
    $page: Int
    $limit: Int
  ) {
    reservations(
      businessId: $businessId
      businessType: $businessType
      page: $page
      limit: $limit
    ) {
      docs {
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
  }
`;

const GET_HOTEL_SETTINGS = gql`
  query GetHotelSettings($id: ID!) {
    hotel(id: $id) {
      settings {
        currency
      }
    }
  }
`;



// Helper to determine if two dates represent the same calendar day.


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

export default function HotelDashboardPage() {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);

  const handleQuickRange = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

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

  const { data: roomsData, loading: roomsLoading, error: roomsError } = useQuery(GET_ROOMS, {
    variables: { hotelId },
    skip: !hotelId,
  });

  const { data: reservationsData, loading: reservationsLoading, error: reservationsError } = useQuery(GET_RESERVATIONS, {
    // Supply pagination parameters.  We request page 1 and a large
    // limit to retrieve all reservations for the dashboard metrics.
    variables: { businessId: hotelId, businessType, page: 1, limit: 1000 },
    skip: !hotelId || !businessType,
  });

  const { data: settingsData } = useQuery(GET_HOTEL_SETTINGS, {
    variables: { id: hotelId },
    skip: !hotelId,
  });

  const currency: string = settingsData?.hotel?.settings?.currency || 'USD';
  const currencySymbol: string = currencySymbols[currency] || '$';

  const stats = useMemo(() => {
    if (!roomsData || !reservationsData) return null;
    const rooms = roomsData.rooms;
    // Extract the reservations array from the paginated response.  When
    // docs is undefined fallback to an empty array to avoid errors.
    const reservations = reservationsData.reservations?.docs ?? [];

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const reservationsInRange = reservations.filter((r: any) => {
      const createdAt = new Date(r.createdAt);
      return createdAt >= start && createdAt <= end;
    });

    const currentGuests = reservations.filter((r: any) => {
      const checkIn = new Date(r.checkIn);
      const checkOut = new Date(r.checkOut);
      return checkIn <= end && checkOut >= start && r.status !== "cancelled";
    });

    const occupiedRoomIds = new Set(
      currentGuests.map((r: any) => r.roomId?.id).filter(Boolean),
    );
    const occupancyRate = rooms.length > 0 ? (occupiedRoomIds.size / rooms.length) * 100 : 0;

    const revenueInRange = reservationsInRange.reduce(
      (sum: number, r: any) => sum + (r.totalAmount || 0),
      0,
    );

    const months = getLastSixMonths(end);
    const monthlyRevenue = months.map(({ month, year }) => {
      const total = reservations.reduce((acc: number, r: any) => {
        const createdAt = new Date(r.createdAt);
        if (
          createdAt &&
          createdAt.getFullYear() === year &&
          createdAt.toLocaleString(undefined, { month: "short" }) === month
        ) {
          return acc + (r.totalAmount || 0);
        }
        return acc;
      }, 0);
      return { month: `${month} ${year.toString().slice(-2)}`, revenue: total };
    });

    const typeCounts: { [key: string]: number } = {};
    rooms.forEach((room: any) => {
      const type = room.type || "Other";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const roomTypeData = Object.keys(typeCounts).map((type) => ({ name: type, value: typeCounts[type] }));

    return {
      todaysReservations: reservationsInRange,
      todaysBookingsCount: reservationsInRange.length,
      currentGuestsCount: currentGuests.reduce((acc: number, r: any) => acc + (r.guests || 0), 0),
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      revenueToday: revenueInRange,
      monthlyRevenue,
      roomTypeData,
    };
  }, [roomsData, reservationsData, startDate, endDate]);

  if (sessionLoading || roomsLoading || reservationsLoading) {
    return <div className="p-6">{t("loading")}</div>;
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>;
  }
  if (roomsError || reservationsError || !stats) {
    return <div className="p-6 text-red-600">{t("failedToLoadDashboardData")}</div>;
  }

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
        {/* Date range filter */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <label htmlFor="hotel-start-date" className="text-sm text-gray-600">
              {t("from") || "From"}:
            </label>
            <input
              id="hotel-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="hotel-end-date" className="text-sm text-gray-600">
              {t("to") || "To"}:
            </label>
            <input
              id="hotel-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleQuickRange(1)}
              className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
            >
              {t("lastMonth") || "Last Month"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickRange(3)}
              className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
            >
              {t("last3Months") || "Last 3 Months"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickRange(6)}
              className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
            >
              {t("last6Months") || "Last 6 Months"}
            </button>
            <button
              type="button"
              onClick={() => handleQuickRange(12)}
              className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
            >
              {t("lastYear") || "Last 12 Months"}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Today's Bookings */}
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
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(stats.revenueToday, currency, currency)}
            </p>
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
                <RechartTooltip formatter={(value: any) => formatCurrency(value as number, currency, currency)} />
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

      {/* Today's Reservations Table */}
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
                      {new Date(r.checkIn).toLocaleDateString() || ""}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(r.checkOut).toLocaleDateString() || ""}
                    </td>
                    <td className="px-4 py-2">{r.guests}</td>
                    <td className="px-4 py-2">
                      {formatCurrency(r.totalAmount ?? 0, currency, currency)}
                    </td>
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
