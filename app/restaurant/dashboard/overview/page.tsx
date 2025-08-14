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
import { DayContent, DayContentProps } from "react-day-picker";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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

const editReservationSchema = z.object({
  heure: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format d'heure invalide (HH:MM)"),
  personnes: z.coerce.number().min(1, "Au moins une personne."),
});

export default function RestaurantOverviewPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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
        from: selectedDate ? moment.utc(selectedDate).format("YYYY-MM-DD") : undefined,
        to: selectedDate ? moment.utc(selectedDate).format("YYYY-MM-DD") : undefined,
    },
    skip: !restaurantId || !selectedDate,
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
    const statusStyles = {
      CONFIRMEE: "bg-green-100 text-green-800",
      "EN ATTENTE": "bg-yellow-100 text-yellow-800",
      ANNULEE: "bg-gray-100 text-gray-800",
      DEFAULT: "bg-gray-100 text-gray-800"
    };
    const style = statusStyles[status] || statusStyles.DEFAULT;
    return <Badge className={`${style} hover:${style}`}>{status}</Badge>;
  };

  const handleCancelReservation = async () => {
    if (!cancelingReservationId) return;
    try {
      await cancelReservation({ variables: { id: cancelingReservationId } });
      toast.success("Réservation annulée.");
      refetchReservations();
      setCancelingReservationId(null);
    } catch (error) {
      toast.error("Erreur lors de l'annulation.");
      console.error(error);
    }
  };

  const EditReservationForm = ({ reservation, onFinished }) => {
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
            toast.success("Réservation modifiée.");
            refetchReservations();
            onFinished();
        } catch (error) {
            toast.error("Erreur lors de la modification.");
            console.error(error);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="heure" render={({field}) => (
                    <FormItem>
                        <FormLabel>Heure</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="personnes" render={({field}) => (
                    <FormItem>
                        <FormLabel>Personnes</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={updateLoading}>Enregistrer</Button>
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
        <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>
        <p className="mt-1 text-lg text-gray-500">Aperçu de vos réservations et performances</p>
      </header>

      {/* KPI Cards Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-50 shadow-sm rounded-xl border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Réservations totales</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? <Skeleton className="h-10 w-20" /> : <p className="text-4xl font-bold text-gray-800">{metrics?.reservationsTotales ?? '...'}</p>}
          </CardContent>
        </Card>
        <Card className="bg-gray-50 shadow-sm rounded-xl border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Chiffre d’affaires généré</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-4xl font-bold text-gray-800">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(metrics?.chiffreAffaires ?? 0)}</p>}
          </CardContent>
        </Card>
        <Card className="bg-gray-50 shadow-sm rounded-xl border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Taux de remplissage</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? <Skeleton className="h-10 w-24" /> : <p className="text-4xl font-bold text-gray-800">{((metrics?.tauxRemplissage ?? 0) * 100).toFixed(0)}%</p>}
          </CardContent>
        </Card>
      </section>

      {/* Calendar Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Calendrier des réservations</h2>
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Gestion des réservations</h2>
        <Card className="rounded-xl shadow-sm border-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Personnes</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservationsLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Chargement...</TableCell></TableRow>
              ) : paginatedReservations.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Aucune réservation pour cette date.</TableCell></TableRow>
              ) : (
                paginatedReservations.map((res: any) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{moment.utc(res.date).format("DD/MM/YYYY")}</TableCell>
                    <TableCell>{res.heure}</TableCell>
                    <TableCell>{res.restaurant?.name}</TableCell>
                    <TableCell>{res.personnes}</TableCell>
                    <TableCell className="text-center"><StatusPill status={res.statut} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => setEditingReservation(res)}>Modifier</Button>
                      <Button variant="link" className="p-0 h-auto text-red-600" onClick={() => setCancelingReservationId(res.id)}>Annuler</Button>
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
                    <DialogTitle>Modifier la réservation</DialogTitle>
                </DialogHeader>
                <EditReservationForm reservation={editingReservation} onFinished={() => setEditingReservation(null)} />
            </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!cancelingReservationId} onOpenChange={() => setCancelingReservationId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Annuler cette réservation ?</AlertDialogTitle>
                <AlertDialogDescription>
                    Cette action est irréversible.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Non</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelReservation} disabled={cancelLoading}>Oui, annuler</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
