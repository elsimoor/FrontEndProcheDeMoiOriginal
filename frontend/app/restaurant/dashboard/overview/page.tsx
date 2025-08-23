"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import moment from "moment";

// Import currency helpers to format metrics based on restaurant settings
import { formatCurrency, currencySymbols } from "@/lib/currency";
import { DayContent, DayContentProps } from "react-day-picker";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// Translation hook
import useTranslation from "@/hooks/useTranslation";

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
`;

const UPDATE_RESERVATION_DETAILS = gql`
    mutation UpdateReservationDetails($id: ID!, $input: UpdateReservationInput!) {
        updateReservationDetails(id: $id, input: $input) {
            id
        }
    }
`;

const CANCEL_RESERVATION = gql`
    mutation CancelReservation($id: ID!) {
        cancelReservation(id: $id) {
            id
        }
    }
`;

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
`;

const GET_DASHBOARD_CALENDAR = gql`
  query GetDashboardCalendar($restaurantId: ID!, $month: String!) {
    dashboardCalendar(restaurantId: $restaurantId, month: $month) {
      date
      count
    }
  }
`;

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
`;

const editReservationSchema = z.object({
  heure: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)"),
  personnes: z.coerce.number().min(1, "Au moins une personne."),
});

export default function RestaurantOverviewPage() {
  // Initialise translation
  const { t } = useTranslation();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  // Date range state for metrics filtering.  Default to the beginning
  // of the current month through today.  We still keep the
  // single selectedDate state for the calendar and reservation table.
  const [startRange, setStartRange] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [endRange, setEndRange] = useState<Date | undefined>(() => new Date());
  // Helper to quickly set a range relative to today for metrics.
  const handleQuickRange = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    setStartRange(start);
    setEndRange(end);
  };
  const [currentMonth, setCurrentMonth] = useState(moment().startOf('month').toDate());
  const [editingReservation, setEditingReservation] = useState<any>(null);
  const [cancelingReservationId, setCancelingReservationId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reservationsPerPage = 10;
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        if (res.ok) {
          const data = await res.json();
          if (data.businessType === 'restaurant' && data.businessId) {
            setRestaurantId(data.businessId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      }
    }
    fetchSession();
  }, []);

  const { data: metricsData, loading: metricsLoading, error: metricsError } = useQuery(GET_DASHBOARD_METRICS, {
    variables: {
        restaurantId,
        from: startRange ? moment.utc(startRange).format("YYYY-MM-DD") : undefined,
        to: endRange ? moment.utc(endRange).format("YYYY-MM-DD") : undefined,
    },
    skip: !restaurantId || !startRange || !endRange,
  });

  const { data: calendarData, loading: calendarLoading } = useQuery(GET_DASHBOARD_CALENDAR, {
    variables: {
        restaurantId,
        month: moment(currentMonth).format("YYYY-MM"),
    },
    skip: !restaurantId,
  });

  const { data: reservationsData, loading: reservationsLoading, refetch: refetchReservations } = useQuery(GET_RESERVATIONS_BY_DATE, {
    variables: {
        restaurantId,
        date: moment.utc(selectedDate).format("YYYY-MM-DD"),
    },
    skip: !restaurantId || !selectedDate,
  });

  const [updateReservation, { loading: updateLoading }] = useMutation(UPDATE_RESERVATION_DETAILS);
  const [cancelReservation, { loading: cancelLoading }] = useMutation(CANCEL_RESERVATION);

  const metrics = metricsData?.dashboardMetrics;
  const bookedDays = calendarData?.dashboardCalendar.map(day => moment(day.date).toDate()) || [];
  const reservations = reservationsData?.reservationsByDate || [];

  const totalPages = Math.ceil(reservations.length / reservationsPerPage);
  const paginatedReservations = reservations.slice((currentPage - 1) * reservationsPerPage, currentPage * reservationsPerPage);

  const StatusPill = ({ status }: { status: string }) => {
    // Map French status codes to translation keys
    const { t } = useTranslation();
    const statusStyles: Record<string, string> = {
      CONFIRMEE: "bg-green-100 text-green-800",
      "EN ATTENTE": "bg-yellow-100 text-yellow-800",
      ANNULEE: "bg-gray-100 text-gray-800",
      DEFAULT: "bg-gray-100 text-gray-800",
    };
    const keyMap: Record<string, string> = {
      CONFIRMEE: 'confirmedStatus',
      'EN ATTENTE': 'pendingStatus',
      ANNULEE: 'cancelledStatus',
    };
    const style = statusStyles[status] || statusStyles.DEFAULT;
    const labelKey = keyMap[status];
    const label = labelKey ? t(labelKey) : status;
    return <Badge className={`${style} hover:${style}`}>{label}</Badge>;
  };

  // Fetch restaurant settings to determine the currency.  Skip until
  // restaurantId is known.  Default to EUR if no setting is provided.
  const { data: settingsData } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  });
  const currency: string = settingsData?.restaurant?.settings?.currency || 'EUR';
  const currencySymbol: string = currencySymbols[currency] || '€';

  const handleCancelReservation = async () => {
    if (!cancelingReservationId) return;
    try {
      await cancelReservation({ variables: { id: cancelingReservationId } });
      toast.success(t("reservationCancelled"));
      refetchReservations();
      setCancelingReservationId(null);
    } catch (error) {
      toast.error(t("reservationCancelError"));
      console.error(error);
    }
  };

  const EditReservationForm = ({ reservation, onFinished }) => {
    const { t } = useTranslation();
    const form = useForm<z.infer<typeof editReservationSchema>>({
        resolver: zodResolver(editReservationSchema),
        defaultValues: {
            heure: reservation.heure,
            personnes: reservation.personnes
        }
    });

    const onSubmit = async (values: z.infer<typeof editReservationSchema>) => {
        try {
            await updateReservation({ variables: { id: reservation.id, input: values }});
            toast.success(t("reservationUpdatedSuccess"));
            refetchReservations();
            onFinished();
        } catch (error) {
            toast.error(t("reservationUpdateError"));
            console.error(error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="heure" render={({field}) => (
                    <FormItem>
                        <FormLabel>{t('timeColumn')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="personnes" render={({field}) => (
                    <FormItem>
                        <FormLabel>{t('peopleColumn')}</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={updateLoading}>{t('saveChanges')}</Button>
            </form>
        </Form>
    )
  }

  function CustomDayContent(props: DayContentProps) {
    const isBooked = bookedDays.some(d => moment.utc(d).isSame(moment.utc(props.date), 'day'));
    return (
      <div className="relative">
        <DayContent {...props} />
        {isBooked && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>}
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">{t('restaurantOverviewTitle')}</h1>
        <p className="mt-1 text-lg text-gray-500">{t('restaurantOverviewSubtitle')}</p>
        {/* Date range picker with quick filter buttons for metrics */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <label htmlFor="overview-start" className="text-sm font-medium text-gray-700">
              {t('from') || 'From'}
            </label>
            <input
              id="overview-start"
              type="date"
              value={startRange ? moment.utc(startRange).format('YYYY-MM-DD') : ''}
              onChange={(e) => setStartRange(e.target.value ? new Date(e.target.value) : undefined)}
              className="border border-gray-300 rounded-md p-2 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="overview-end" className="text-sm font-medium text-gray-700">
              {t('to') || 'To'}
            </label>
            <input
              id="overview-end"
              type="date"
              value={endRange ? moment.utc(endRange).format('YYYY-MM-DD') : ''}
              onChange={(e) => setEndRange(e.target.value ? new Date(e.target.value) : undefined)}
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
          </div>
        </div>
      </header>

      {/* KPI Cards Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-50 shadow-sm rounded-xl border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('totalReservationsOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? <Skeleton className="h-10 w-20" /> : <p className="text-4xl font-bold text-gray-800">{metrics?.reservationsTotales ?? '...'}</p>}
          </CardContent>
        </Card>
        <Card className="bg-gray-50 shadow-sm rounded-xl border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('revenueGeneratedOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-4xl font-bold text-gray-800">
                {formatCurrency(metrics?.chiffreAffaires ?? 0, currency)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-gray-50 shadow-sm rounded-xl border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{t('occupancyRateOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-bold text-gray-800">{((metrics?.tauxRemplissage ?? 0) * 100).toFixed(0)}%</p>}
          </CardContent>
        </Card>
      </section>

      {/* Calendar Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('reservationsCalendarTitle')}</h2>
        <Card className="p-4 rounded-xl shadow-sm border-none">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            numberOfMonths={isMobile ? 1 : 2}
            components={{ DayContent: CustomDayContent }}
            className="p-0"
          />
        </Card>
      </section>

      {/* Reservations Table Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('reservationsManagementTitle')}</h2>
        <Card className="rounded-xl shadow-sm border-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dateColumn')}</TableHead>
                <TableHead>{t('timeColumn')}</TableHead>
                <TableHead>{t('restaurantColumn')}</TableHead>
                <TableHead>{t('peopleColumn')}</TableHead>
                <TableHead className="text-center">{t('statusColumn')}</TableHead>
                <TableHead className="text-right">{t('actionsColumn')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservationsLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">{t('loading')}</TableCell></TableRow>
              ) : paginatedReservations.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">{t('noReservationsForDate')}</TableCell></TableRow>
              ) : (
                paginatedReservations.map((res: any) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{moment.utc(res.date).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>{res.heure}</TableCell>
                    <TableCell>{res.restaurant?.name}</TableCell>
                    <TableCell>{res.personnes}</TableCell>
                    <TableCell className="text-center"><StatusPill status={res.statut} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => setEditingReservation(res)}>{t('edit')}</Button>
                      <Button variant="link" className="p-0 h-auto text-red-600" onClick={() => setCancelingReservationId(res.id)}>{t('cancel')}</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </Card>
      </section>

      {editingReservation && (
        <Dialog open={!!editingReservation} onOpenChange={() => setEditingReservation(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('editReservationTitle')}</DialogTitle>
                </DialogHeader>
                <EditReservationForm reservation={editingReservation} onFinished={() => setEditingReservation(null)} />
            </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!cancelingReservationId} onOpenChange={() => setCancelingReservationId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('cancelReservationPrompt')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('irreversibleActionWarning')}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('noLabel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelReservation} disabled={cancelLoading}>{t('yesCancelLabel')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
