// "use client"

// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
// import {
//   Calendar,
//   Users,
//   UtensilsCrossed,
//   DollarSign,
//   TrendingUp,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertTriangle,
// } from "lucide-react"

// /*
//  * This page renders the main dashboard for restaurant businesses.  It
//  * mirrors the hotel dashboard by pulling live data from the backend via
//  * GraphQL.  Statistics such as today’s reservations, current diners,
//  * completed orders and daily revenue are computed on the client from
//  * the reservations returned by the API.  Menu items are used to
//  * determine popular dishes.  Charts are rendered with recharts using
//  * the computed datasets.
//  */

// import { useState, useEffect, useMemo } from "react";
// import { gql, useQuery } from "@apollo/client";
// import useTranslation from "@/hooks/useTranslation";

// // Query to fetch reservations for a restaurant.  We request
// // minimal fields needed to compute statistics and render the
// // reservations table.
// const GET_RESERVATIONS = gql`
//   query GetReservations($businessId: ID!, $businessType: String!) {
//     reservations(businessId: $businessId, businessType: $businessType) {
//       id
//       customerInfo {
//         name
//       }
//       tableId {
//         id
//         number
//       }
//       partySize
//       date
//       time
//       status
//       totalAmount
//       createdAt
//     }
//   }
// `;

// // Query to fetch menu items for a restaurant.  We fetch only
// // fields necessary to compute the popular dishes chart.
// const GET_MENU_ITEMS = gql`
//   query GetMenuItems($restaurantId: ID!) {
//     menuItems(restaurantId: $restaurantId) {
//       id
//       name
//       category
//       popular
//     }
//   }
// `;

// // Utility functions for dates
// const parseDate = (dateStr: string | null | undefined): Date | null => {
//   return dateStr ? new Date(dateStr) : null;
// };
// const isSameDay = (d1: Date, d2: Date) =>
//   d1.getFullYear() === d2.getFullYear() &&
//   d1.getMonth() === d2.getMonth() &&
//   d1.getDate() === d2.getDate();

// // Generate an array of the last six months for the revenue chart.  This
// // function accepts an optional reference date so that the chart
// // reflects months relative to the selected date rather than always
// // starting from the current month.
// const getLastSixMonths = (referenceDate?: Date) => {
//   const months: { month: string; year: number }[] = [];
//   const date = referenceDate ? new Date(referenceDate) : new Date();
//   for (let i = 5; i >= 0; i--) {
//     const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
//     months.push({ month: d.toLocaleString(undefined, { month: "short" }), year: d.getFullYear() });
//   }
//   return months;
// };

// // Colour palette for popular dishes chart.  Extend or modify as needed.
// const DISH_COLORS = ["#EF4444", "#F59E0B", "#10B981", "#8B5CF6", "#3B82F6", "#F97316"];

// export default function RestaurantDashboard() {
//   // Acquire translation function
//   const { t } = useTranslation();
//   // Business context derived from the session.  A null restaurantId
//   // indicates loading or unauthorised access.
//   const [restaurantId, setRestaurantId] = useState<string | null>(null);
//   const [businessType, setBusinessType] = useState<string | null>(null);
//   const [sessionLoading, setSessionLoading] = useState(true);
//   const [sessionError, setSessionError] = useState<string | null>(null);

//   // Date range filter: select a start and end date for which
//   // statistics will be computed.  Defaults to the beginning of the
//   // current month through today.  Changing these values will
//   // recompute metrics based on the chosen period.
//   const [startDate, setStartDate] = useState<string>(() => {
//     const now = new Date();
//     const start = new Date(now.getFullYear(), now.getMonth(), 1);
//     return start.toISOString().split('T')[0];
//   });
//   const [endDate, setEndDate] = useState<string>(() => {
//     const now = new Date();
//     return now.toISOString().split('T')[0];
//   });
//   // Helper to quickly set a range relative to today.  The end date is
//   // always today and the start date is the given number of months ago.
//   const handleQuickRange = (months: number) => {
//     const end = new Date();
//     const start = new Date();
//     start.setMonth(start.getMonth() - months);
//     setStartDate(start.toISOString().split('T')[0]);
//     setEndDate(end.toISOString().split('T')[0]);
//   };

//   useEffect(() => {
//     async function fetchSession() {
//       try {
//         const res = await fetch("/api/session");
//         if (!res.ok) {
//           setSessionLoading(false);
//           return;
//         }
//         const data = await res.json();
//         if (data.businessType && data.businessType.toLowerCase() === "restaurant" && data.businessId) {
//           setRestaurantId(data.businessId);
//           setBusinessType(data.businessType);
//         } else {
//           setSessionError("You are not associated with a restaurant business.");
//         }
//       } catch (err) {
//         setSessionError("Failed to load session.");
//       } finally {
//         setSessionLoading(false);
//       }
//     }
//     fetchSession();
//   }, []);

//   // Fetch reservations and menu items once business context is available
//   const {
//     data: reservationsData,
//     loading: reservationsLoading,
//     error: reservationsError,
//   } = useQuery(GET_RESERVATIONS, {
//     variables: { businessId: restaurantId, businessType },
//     skip: !restaurantId || !businessType,
//   });
//   const {
//     data: menuData,
//     loading: menuLoading,
//     error: menuError,
//   } = useQuery(GET_MENU_ITEMS, {
//     variables: { restaurantId },
//     skip: !restaurantId,
//   });

//   // Compute statistics once data is loaded
//   const stats = useMemo(() => {
//     if (!reservationsData) return null;
//     const reservations = reservationsData.reservations;
//     // Parse the start and end dates; default to today if undefined.
//     const start = startDate ? new Date(startDate) : new Date();
//     const end = endDate ? new Date(endDate) : new Date();
//     // Filter reservations whose date or creation date is within the selected range.
//     const inRange = reservations.filter((r: any) => {
//       const date = parseDate(r.date);
//       const created = parseDate(r.createdAt);
//       let match = false;
//       if (date && date >= start && date <= end) match = true;
//       if (created && created >= start && created <= end) match = true;
//       return match;
//     });
//     // Current diners in range: reservations in range with statuses indicating an active diner
//     const current = inRange.filter((r: any) =>
//       (r.status === "confirmed" || r.status === "in-progress" || r.status === "seated")
//     );
//     // Completed orders in range
//     const completed = inRange.filter((r: any) => r.status === "completed");
//     // Revenue for the selected range
//     const revenueToday = inRange.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
//     // Monthly revenue for the last 6 months relative to the end date
//     const months = getLastSixMonths(end);
//     const monthlyRevenue = months.map(({ month, year }) => {
//       const total = reservations.reduce((acc: number, r: any) => {
//         const d = parseDate(r.date) || parseDate(r.createdAt);
//         if (
//           d &&
//           d.getFullYear() === year &&
//           d.toLocaleString(undefined, { month: "short" }) === month
//         ) {
//           return acc + (r.totalAmount || 0);
//         }
//         return acc;
//       }, 0);
//       return { name: month, revenue: total };
//     });
//     // Count reservations by status within the selected range
//     const statusCounts: Record<string, number> = {};
//     for (const res of inRange) {
//       const status = res.status || "pending";
//       statusCounts[status] = (statusCounts[status] || 0) + 1;
//     }
//     return {
//       todays: inRange,
//       current,
//       completed,
//       revenueToday,
//       monthlyRevenue,
//       totalReservations: inRange.length,
//       statusCounts,
//     };
//   }, [reservationsData, startDate, endDate]);

//   // Compute popular dishes once menu items load.  We group by
//   // category/name and count occurrences of the `popular` flag.
//   const dishChart = useMemo(() => {
//     if (!menuData) return [];
//     const items = menuData.menuItems;
//     const popularItems = items.filter((item: any) => item.popular);
//     // Count by category/name; fallback to name if no category
//     const counts: Record<string, number> = {};
//     for (const item of popularItems) {
//       const key = item.name || item.category || "Other";
//       counts[key] = (counts[key] || 0) + 1;
//     }
//     const entries = Object.entries(counts);
//     // Take top 6 entries
//     return entries.slice(0, 6).map(([name, value], index) => ({
//       name,
//       value,
//       color: DISH_COLORS[index % DISH_COLORS.length],
//     }));
//   }, [menuData]);

//   if (sessionLoading || reservationsLoading || menuLoading) {
//     return <div className="p-6">{t('loading')}</div>;
//   }
//   if (sessionError) {
//     // Translate known session errors when possible
//     return <div className="p-6 text-red-600">{t('notAssociatedWithRestaurant') ?? sessionError}</div>;
//   }
//   if (reservationsError) {
//     return <div className="p-6 text-red-600">{t('errorLoadingReservations')}</div>;
//   }
//   if (menuError) {
//     return <div className="p-6 text-red-600">{t('errorLoadingMenuItems')}</div>;
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">{t('restaurantDashboardTitle')}</h1>
//           <p className="text-gray-600">{t('restaurantDashboardSubtitle')}</p>
//         </div>
//         {/* Date range picker with quick filters */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
//           <div className="flex items-center space-x-2">
//             <label htmlFor="restaurant-start-date" className="text-sm font-medium text-gray-700">
//               {t('from') || 'From'}
//             </label>
//             <input
//               id="restaurant-start-date"
//               type="date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className="border border-gray-300 rounded-md p-2 text-sm"
//             />
//           </div>
//           <div className="flex items-center space-x-2">
//             <label htmlFor="restaurant-end-date" className="text-sm font-medium text-gray-700">
//               {t('to') || 'To'}
//             </label>
//             <input
//               id="restaurant-end-date"
//               type="date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className="border border-gray-300 rounded-md p-2 text-sm"
//             />
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               type="button"
//               onClick={() => handleQuickRange(1)}
//               className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
//             >
//               {t('lastMonth') || 'Last Month'}
//             </button>
//             <button
//               type="button"
//               onClick={() => handleQuickRange(3)}
//               className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
//             >
//               {t('last3Months') || 'Last 3 Months'}
//             </button>
//             <button
//               type="button"
//               onClick={() => handleQuickRange(6)}
//               className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
//             >
//               {t('last6Months') || 'Last 6 Months'}
//             </button>
//             <button
//               type="button"
//               onClick={() => handleQuickRange(12)}
//               className="px-3 py-1 border rounded-md text-sm bg-white hover:bg-gray-50"
//             >
//               {t('lastYear') || 'Last 12 Months'}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-red-100 rounded-lg">
//               <Calendar className="h-6 w-6 text-red-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">{t('todaysReservationsRestaurant')}</p>
//               <p className="text-2xl font-bold text-gray-900">{stats?.todays.length ?? 0}</p>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-orange-100 rounded-lg">
//               <Users className="h-6 w-6 text-orange-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">{t('currentDiners')}</p>
//               <p className="text-2xl font-bold text-gray-900">{stats?.current.length ?? 0}</p>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-green-100 rounded-lg">
//               <UtensilsCrossed className="h-6 w-6 text-green-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">{t('ordersCompleted')}</p>
//               <p className="text-2xl font-bold text-gray-900">{stats?.completed.length ?? 0}</p>
//             </div>
//           </div>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-purple-100 rounded-lg">
//               <DollarSign className="h-6 w-6 text-purple-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">{t('revenueTodayRestaurant')}</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 ${stats ? stats.revenueToday.toLocaleString() : 0}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Reservation Status Breakdown */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {/* Pending Reservations */}
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-yellow-100 rounded-lg">
//               <Clock className="h-6 w-6 text-yellow-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">{t('pendingStatus')}</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {stats?.statusCounts?.pending ?? 0}
//               </p>
//             </div>
//           </div>
//         </div>
//         {/* Confirmed Reservations */}
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-green-100 rounded-lg">
//               <CheckCircle className="h-6 w-6 text-green-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">{t('confirmedStatus')}</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {stats?.statusCounts?.confirmed ?? 0}
//               </p>
//             </div>
//           </div>
//         </div>
//         {/* Cancelled Reservations */}
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-red-100 rounded-lg">
//               <XCircle className="h-6 w-6 text-red-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">{t('cancelledStatus')}</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {stats?.statusCounts?.cancelled ?? 0}
//               </p>
//             </div>
//           </div>
//         </div>
//         {/* No Shows */}
//         <div className="bg-white rounded-lg shadow p-6">
//           <div className="flex items-center">
//             <div className="p-2 bg-purple-100 rounded-lg">
//               <AlertTriangle className="h-6 w-6 text-purple-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">{t('noShowStatus')}</p>
//               <p className="text-2xl font-bold text-gray-900">
//                 {stats?.statusCounts?.["no-show"] ?? 0}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('monthlyRevenueChartTitle')}</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={stats?.monthlyRevenue ?? []}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, t('revenueLabel') ?? 'Revenue']} />
//               <Bar dataKey="revenue" fill="#EF4444" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('popularDishesChartTitle')}</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={dishChart}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={60}
//                 outerRadius={120}
//                 paddingAngle={5}
//                 dataKey="value"
//               >
//                 {dishChart.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip formatter={(value: any) => [`${value}`, t('ordersLabel')]} />
//             </PieChart>
//           </ResponsiveContainer>
//           <div className="flex flex-wrap justify-center mt-4 space-x-4">
//             {dishChart.map((entry, index) => (
//               <div key={index} className="flex items-center">
//                 <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
//                 <span className="text-sm text-gray-600">{entry.name}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Today's Reservations */}
//       <div className="bg-white rounded-lg shadow">
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-900">Today's Reservations</h3>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Customer
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Table
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Time
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Guests
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {stats?.todays.map((reservation: any) => (
//                 <tr key={reservation.id}>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                     {reservation.customerInfo?.name || t('guestFallback')}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {reservation.tableId?.number ? `${t('tableLabel')} ${reservation.tableId.number}` : "–"}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {reservation.time || "–"}
//                   </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {reservation.partySize || 0}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span
//                       className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                         reservation.status === "confirmed"
//                           ? "bg-green-100 text-green-800"
//                           : reservation.status === "pending"
//                           ? "bg-yellow-100 text-yellow-800"
//                           : reservation.status === "completed"
//                           ? "bg-purple-100 text-purple-800"
//                           : reservation.status === "cancelled"
//                           ? "bg-red-100 text-red-800"
//                           : "bg-gray-100 text-gray-800"
//                       }`}
//                     >
//                       {t(reservation.status) || reservation.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//               {stats?.todays.length === 0 && (
//                 <tr>
//                   <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
//                     {t('noReservationsTodayRestaurant')}
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }




// test1


"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { gql, useMutation, useQuery } from "@apollo/client"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import moment from "moment"

// Import currency helpers to format metrics based on restaurant settings
import { formatCurrency, currencySymbols } from "@/lib/currency"
import { DayContent, type DayContentProps } from "react-day-picker"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

// Translation hook
import useTranslation from "@/hooks/useTranslation"

// Fetch metrics for a specific date range.  The optional `from` and `to`
// arguments allow the backend to compute statistics over a custom
// period instead of the default current month.  We will pass the
// selected date for both `from` and `to` to filter metrics for
// exactly that day.
const GET_DASHBOARD_METRICS = gql`
  query GetDashboardMetrics($restaurantId: ID!, $from: String, $to: String) {
    dashboardMetrics(restaurantId: $restaurantId, from: $from, to: $to) {
      reservationsTotales
      chiffreAffaires
      tauxRemplissage
    }
  }
`

const UPDATE_RESERVATION_DETAILS = gql`
    mutation UpdateReservationDetails($id: ID!, $input: UpdateReservationInput!) {
        updateReservationDetails(id: $id, input: $input) {
            id
        }
    }
`

const CANCEL_RESERVATION = gql`
    mutation CancelReservation($id: ID!) {
        cancelReservation(id: $id) {
            id
        }
    }
`

const GET_RESERVATIONS_BY_DATE = gql`
  query GetReservationsByDate($restaurantId: ID!, $date: String!) {
    reservationsByDate(restaurantId: $restaurantId, date: $date) {
      id
      date
      heure
      restaurant{
        id
        name
      }
      personnes
      statut
    }
  }
`

const GET_DASHBOARD_CALENDAR = gql`
  query GetDashboardCalendar($restaurantId: ID!, $month: String!) {
    dashboardCalendar(restaurantId: $restaurantId, month: $month) {
      date
      count
    }
  }
`

// Query to fetch restaurant settings including currency.  This will allow
// us to display the generated revenue in the correct currency.
const GET_RESTAURANT_SETTINGS = gql`
  query GetRestaurantSettings($id: ID!) {
    restaurant(id: $id) {
      settings {
        currency
      }
    }
  }
`

const editReservationSchema = z.object({
  heure: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)"),
  personnes: z.coerce.number().min(1, "Au moins une personne."),
})

export default function RestaurantOverviewPage() {
  // Initialise translation
  const { t } = useTranslation()
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  // Date range state for metrics filtering.  Default to the beginning
  // of the current month through today.  We still keep the
  // single selectedDate state for the calendar and reservation table.
  const [startRange, setStartRange] = useState<Date | undefined>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [endRange, setEndRange] = useState<Date | undefined>(() => new Date())
  // Helper to quickly set a range relative to today for metrics.
  const handleQuickRange = (months: number) => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - months)
    setStartRange(start)
    setEndRange(end)
  }
  const [currentMonth, setCurrentMonth] = useState(moment().startOf("month").toDate())
  const [editingReservation, setEditingReservation] = useState<any>(null)
  const [cancelingReservationId, setCancelingReservationId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const reservationsPerPage = 10
  const isMobile = useIsMobile()

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session")
        if (res.ok) {
          const data = await res.json()
          if (data.businessType === "restaurant" && data.businessId) {
            setRestaurantId(data.businessId)
          }
        }
      } catch (error) {
        console.error("Failed to fetch session:", error)
      }
    }
    fetchSession()
  }, [])

  const {
    data: metricsData,
    loading: metricsLoading,
    error: metricsError,
  } = useQuery(GET_DASHBOARD_METRICS, {
    variables: {
      restaurantId,
      from: startRange ? moment.utc(startRange).format("YYYY-MM-DD") : undefined,
      to: endRange ? moment.utc(endRange).format("YYYY-MM-DD") : undefined,
    },
    skip: !restaurantId || !startRange || !endRange,
  })

  const { data: calendarData, loading: calendarLoading } = useQuery(GET_DASHBOARD_CALENDAR, {
    variables: {
      restaurantId,
      month: moment(currentMonth).format("YYYY-MM"),
    },
    skip: !restaurantId,
  })

  const {
    data: reservationsData,
    loading: reservationsLoading,
    refetch: refetchReservations,
  } = useQuery(GET_RESERVATIONS_BY_DATE, {
    variables: {
      restaurantId,
      date: moment.utc(selectedDate).format("YYYY-MM-DD"),
    },
    skip: !restaurantId || !selectedDate,
  })

  const [updateReservation, { loading: updateLoading }] = useMutation(UPDATE_RESERVATION_DETAILS)
  const [cancelReservation, { loading: cancelLoading }] = useMutation(CANCEL_RESERVATION)

  const metrics = metricsData?.dashboardMetrics
  const bookedDays = calendarData?.dashboardCalendar.map((day) => moment(day.date).toDate()) || []
  const reservations = reservationsData?.reservationsByDate || []

  const totalPages = Math.ceil(reservations.length / reservationsPerPage)
  const paginatedReservations = reservations.slice(
    (currentPage - 1) * reservationsPerPage,
    currentPage * reservationsPerPage,
  )

  const StatusPill = ({ status }: { status: string }) => {
    // Map French status codes to translation keys
    const { t } = useTranslation()
    const statusStyles: Record<string, string> = {
      CONFIRMEE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      "EN ATTENTE": "bg-amber-50 text-amber-700 border border-amber-200",
      ANNULEE: "bg-slate-50 text-slate-600 border border-slate-200",
      DEFAULT: "bg-slate-50 text-slate-600 border border-slate-200",
    }
    const keyMap: Record<string, string> = {
      CONFIRMEE: "confirmedStatus",
      "EN ATTENTE": "pendingStatus",
      ANNULEE: "cancelledStatus",
    }
    const style = statusStyles[status] || statusStyles.DEFAULT
    const labelKey = keyMap[status]
    const label = labelKey ? t(labelKey) : status
    return <Badge className={`${style} hover:${style} font-medium`}>{label}</Badge>
  }

  // Fetch restaurant settings to determine the currency.  Skip until
  // restaurantId is known.  Default to EUR if no setting is provided.
  const { data: settingsData } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  })
  const currency: string = settingsData?.restaurant?.settings?.currency || "EUR"
  const currencySymbol: string = currencySymbols[currency] || "€"

  const handleCancelReservation = async () => {
    if (!cancelingReservationId) return
    try {
      await cancelReservation({ variables: { id: cancelingReservationId } })
      toast.success(t("reservationCancelled"))
      refetchReservations()
      setCancelingReservationId(null)
    } catch (error) {
      toast.error(t("reservationCancelError"))
      console.error(error)
    }
  }

  const EditReservationForm = ({ reservation, onFinished }) => {
    const { t } = useTranslation()
    const form = useForm<z.infer<typeof editReservationSchema>>({
      resolver: zodResolver(editReservationSchema),
      defaultValues: {
        heure: reservation.heure,
        personnes: reservation.personnes,
      },
    })

    const onSubmit = async (values: z.infer<typeof editReservationSchema>) => {
      try {
        await updateReservation({ variables: { id: reservation.id, input: values } })
        toast.success(t("reservationUpdatedSuccess"))
        refetchReservations()
        onFinished()
      } catch (error) {
        toast.error(t("reservationUpdateError"))
        console.error(error)
      }
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="heure"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">{t("timeColumn")}</FormLabel>
                <FormControl>
                  <Input {...field} className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="personnes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">{t("peopleColumn")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={updateLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {updateLoading ? "Saving..." : t("saveChanges")}
          </Button>
        </form>
      </Form>
    )
  }

  function CustomDayContent(props: DayContentProps) {
    const isBooked = bookedDays.some((d) => moment.utc(d).isSame(moment.utc(props.date), "day"))
    return (
      <div className="relative">
        <DayContent {...props} />
        {isBooked && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-blue-500 shadow-sm"></div>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            {t("restaurantOverviewTitle")}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t("restaurantOverviewSubtitle")}</p>

          <Card className="mt-6 bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-4">
                <div className="flex items-center space-x-3">
                  <label htmlFor="overview-start" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                    {t("from") || "From"}
                  </label>
                  <input
                    id="overview-start"
                    type="date"
                    value={startRange ? moment.utc(startRange).format("YYYY-MM-DD") : ""}
                    onChange={(e) => setStartRange(e.target.value ? new Date(e.target.value) : undefined)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <label htmlFor="overview-end" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                    {t("to") || "To"}
                  </label>
                  <input
                    id="overview-end"
                    type="date"
                    value={endRange ? moment.utc(endRange).format("YYYY-MM-DD") : ""}
                    onChange={(e) => setEndRange(e.target.value ? new Date(e.target.value) : undefined)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { months: 1, label: t("lastMonth") || "Last Month" },
                    { months: 3, label: t("last3Months") || "Last 3 Months" },
                    { months: 6, label: t("last6Months") || "Last 6 Months" },
                    { months: 12, label: t("lastYear") || "Last 12 Months" },
                  ].map(({ months, label }) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => handleQuickRange(months)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-white to-blue-50/50 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">{t("totalReservationsOverview")}</CardTitle>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-12 w-24 rounded-lg" />
              ) : (
                <p className="text-4xl font-bold text-slate-800">{metrics?.reservationsTotales ?? "..."}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-emerald-50/50 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">{t("revenueGeneratedOverview")}</CardTitle>
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-12 w-32 rounded-lg" />
              ) : (
                <p className="text-4xl font-bold text-slate-800">
                  {formatCurrency(metrics?.chiffreAffaires ?? 0, currency)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-amber-50/50 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">{t("occupancyRateOverview")}</CardTitle>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-12 w-24 rounded-lg" />
              ) : (
                <p className="text-4xl font-bold text-slate-800">
                  {((metrics?.tauxRemplissage ?? 0) * 100).toFixed(0)}%
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{t("reservationsCalendarTitle")}</h2>
          </div>
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                numberOfMonths={isMobile ? 1 : 2}
                components={{ DayContent: CustomDayContent }}
                className="p-0 [&_.rdp-day_selected]:bg-blue-500 [&_.rdp-day_selected]:text-white [&_.rdp-day]:hover:bg-blue-50"
              />
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{t("reservationsManagementTitle")}</h2>
          </div>
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-lg rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200/50">
                  <TableHead className="font-semibold text-slate-700">{t("dateColumn")}</TableHead>
                  <TableHead className="font-semibold text-slate-700">{t("timeColumn")}</TableHead>
                  <TableHead className="font-semibold text-slate-700">{t("restaurantColumn")}</TableHead>
                  <TableHead className="font-semibold text-slate-700">{t("peopleColumn")}</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">{t("statusColumn")}</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">{t("actionsColumn")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservationsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>{t("loading")}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                      {t("noReservationsForDate")}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReservations.map((res: any) => (
                    <TableRow key={res.id} className="border-slate-200/50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-800">
                        {moment.utc(res.date).format("DD/MM/YYYY")}
                      </TableCell>
                      <TableCell className="text-slate-700">{res.heure}</TableCell>
                      <TableCell className="text-slate-700">{res.restaurant?.name}</TableCell>
                      <TableCell className="text-slate-700">{res.personnes}</TableCell>
                      <TableCell className="text-center">
                        <StatusPill status={res.statut} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                          onClick={() => setEditingReservation(res)}
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
                          onClick={() => setCancelingReservationId(res.id)}
                        >
                          {t("cancel")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200/50">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }}
                        className="hover:bg-slate-50"
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(i + 1)
                          }}
                          className="hover:bg-slate-50"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }}
                        className="hover:bg-slate-50"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </Card>
        </section>

        {editingReservation && (
          <Dialog open={!!editingReservation} onOpenChange={() => setEditingReservation(null)}>
            <DialogContent className="bg-white/95 backdrop-blur-sm border-slate-200/50 rounded-2xl shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-slate-800">{t("editReservationTitle")}</DialogTitle>
              </DialogHeader>
              <EditReservationForm reservation={editingReservation} onFinished={() => setEditingReservation(null)} />
            </DialogContent>
          </Dialog>
        )}

        <AlertDialog open={!!cancelingReservationId} onOpenChange={() => setCancelingReservationId(null)}>
          <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-slate-200/50 rounded-2xl shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-slate-800">
                {t("cancelReservationPrompt")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600">
                {t("irreversibleActionWarning")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-200 hover:bg-slate-50">{t("noLabel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelReservation}
                disabled={cancelLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelLoading ? "Cancelling..." : t("yesCancelLabel")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  )
}
