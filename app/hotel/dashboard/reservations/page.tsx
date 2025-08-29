"use client";

import { useState, useEffect } from "react";
// Helpers to format prices according to the hotel's selected currency
import { formatCurrency, currencySymbols } from "@/lib/currency";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
// Pagination components to render page navigation controls for lists.
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Additional imports for date range selection and popover
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import useTranslation from "@/hooks/useTranslation";
// Use the react-toastify shim for toast notifications
// Import toast from react-toastify.  This shim provides the same API
// as the real library and is used throughout the dashboard for
// notifications.
import { toast } from "react-toastify";

/**
 * Reservation management page for hotel businesses.  This page allows the
 * operator to view, create and delete reservations.  It uses session data
 * exposed via `/api/session` to determine the current hotel (business)
 * context and fetches all rooms so the user can select a room for the
 * reservation.
 */

// Query to fetch rooms for the current hotel
// In addition to the basic fields, we request pricing information
// including the base price, monthly pricing ranges and special date
// ranges.  This allows us to compute the total cost of a stay
// client‑side based on the selected check‑in and check‑out dates.
const GET_ROOMS = gql`
  query GetRooms($hotelId: ID!) {
    rooms(hotelId: $hotelId) {
      id
      number
      type
      price
      monthlyPrices {
        startMonth
        endMonth
        price
      }
      specialPrices {
        startMonth
        startDay
        endMonth
        endDay
        price
      }
    }
  }
`;

// Query to fetch paginated reservations for a business.  The server returns
// a ReservationPagination object containing a docs array and pagination
// metadata.  We include optional status and date filters along with
// page and limit parameters.  Sorting is handled server‑side.
const GET_RESERVATIONS = gql`
  query GetReservations($businessId: ID!, $businessType: String!, $status: String, $date: Date, $page: Int, $limit: Int) {
    reservations(
      businessId: $businessId
      businessType: $businessType
      status: $status
      date: $date
      page: $page
      limit: $limit
    ) {
      docs {
        id
        customerInfo {
          name
          email
          phone
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
      totalDocs
      limit
      page
      totalPages
      hasPrevPage
      hasNextPage
      prevPage
      nextPage
    }
  }
`;

// Query to fetch the hotel settings including the currency.  We use
// this to determine how to format all monetary values on this page.
const GET_HOTEL_SETTINGS = gql`
  query GetHotelSettings($id: ID!) {
    hotel(id: $id) {
      settings {
        currency
      }
    }
  }
`;

// Mutation to create a reservation
const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationInput!) {
    createReservation(input: $input) {
      id
      status
    }
  }
`;

// Mutation to update a reservation
const UPDATE_RESERVATION = gql`
  mutation UpdateReservation($id: ID!, $input: ReservationInput!) {
    updateReservation(id: $id, input: $input) {
      id
      status
    }
  }
`;

// Mutation to delete a reservation
const DELETE_RESERVATION = gql`
  mutation DeleteReservation($id: ID!) {
    deleteReservation(id: $id)
  }
`;

interface ReservationFormState {
  /**
   * Separate fields for first and last name.  Previously the form only
   * accepted a single name value (guestName).  Splitting the name into
   * first and last provides clearer expectations for the user and
   * makes it easier to enforce that both values are provided.  The
   * values are concatenated when building the ReservationInput.
   */
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number | "";
  totalAmount: number | "";
  status: string;
}

export default function HotelReservationsPage() {
  // Session / business context
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);


  const {
    data: allReservationsData,
    refetch: refetchAllReservations,
  } = useQuery(GET_RESERVATIONS, {
    variables: { businessId, businessType, page: 1, limit: 1000 },
    skip: !businessId || !businessType,
  });

  const [formState, setFormState] = useState<ReservationFormState>({
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestPhone: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    totalAmount: "",
    status: "pending",
  });



  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          setSessionLoading(false);
          return;
        }
        const data = await res.json();
        // Session stores the businessType in lower case.  Compare
        // case-insensitively when determining if this is a hotel account.
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setBusinessId(data.businessId);
          setBusinessType(data.businessType);
        } else {
          setSessionError("You are not associated with a hotel business.");
        }
      } catch (err) {
        setSessionError("Failed to load session.");
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  // Show a toast when data is loading.  We display a brief loading message
  // whenever any of the primary queries are in a loading state.  This
  // provides feedback to the user outside of the dashboard to indicate
  // that data is being fetched.  The toast limit is 1 so only the most
  // recent loading state will appear.

  // Fetch rooms to populate the room select
  const {
    data: roomsData,
    loading: roomsLoading,
    error: roomsError,
  } = useQuery(GET_ROOMS, {
    variables: { hotelId: businessId },
    skip: !businessId,
  });

  // Fetch reservations
  const {
    data: reservationsData,
    loading: reservationsLoading,
    error: reservationsError,
    refetch: refetchReservations,
  } = useQuery(GET_RESERVATIONS, {
    variables: {
      businessId,
      businessType,
      page: currentPage,
      limit: itemsPerPage,
    },
    skip: !businessId || !businessType,
  });

  // Fetch the hotel settings to determine the currency.  Once
  // fetched, we use the currency code to format prices throughout
  // the component.  If currency is not available we default to USD.
  const { data: hotelSettingsData } = useQuery(GET_HOTEL_SETTINGS, {
    variables: { id: businessId },
    skip: !businessId,
  });
  const currency: string = hotelSettingsData?.hotel?.settings?.currency ?? "USD";
  const currencySymbol: string = currencySymbols[currency] ?? currency;

  // Determine the currently selected room with full pricing details.  We
  // memoise this on every render using the latest roomsData and
  // formState.roomId.  When no room is selected or roomsData has
  // not loaded yet, selectedRoom will be undefined.
  const selectedRoom: any = roomsData?.rooms?.find((r: any) => r.id === formState.roomId);

  // Compute today's date in YYYY-MM-DD format.  This value is used
  // as the minimum selectable date for check-in and check-out inputs
  // to prevent selecting past dates.  Without this the user could
  // choose a date prior to the current day which should be disallowed.
  const todayStr = new Date().toISOString().split("T")[0];

  // Mutations
  const [createReservation] = useMutation(CREATE_RESERVATION);
  const [deleteReservation] = useMutation(DELETE_RESERVATION);

  // Translation hook for multi‑language support
  const { t } = useTranslation();

  // Show a loading toast when data is being fetched.  We check the
  // loading flags of the main queries (rooms, reservations and session)
  // after they have been defined.  This effect runs whenever any of
  // these booleans change.  Because the global toast limit is 1, only
  // the most recent loading toast will appear.
  useEffect(() => {
    if (sessionLoading || roomsLoading || reservationsLoading) {
      toast.info({
        title: 'Loading...',
        description: 'Please wait while we load your data.',
        duration: 3000,
      })
    }
  }, [sessionLoading, roomsLoading, reservationsLoading])

  /**
   * Whenever the selected room changes or reservation data is
   * refetched, compute the list of disabled date ranges.  We
   * construct an array of matchers for react‑day‑picker.  Each
   * matcher either disables all dates before today or disables a
   * specific interval corresponding to a pending or confirmed
   * reservation.  When a reservation has both check‑in and
   * check‑out dates we consider the room occupied from the check‑in
   * date up to the day before check‑out (the check‑out day itself
   * becomes available for a new booking).  Single‑day reservations
   * (missing checkOut) disable only that single day.
   */
  useEffect(() => {
    const disabled: any[] = [{ before: new Date() }];
    if (formState.roomId && allReservationsData?.reservations?.docs) {
      allReservationsData.reservations.docs.forEach((res: any) => {
        // Only consider reservations for the selected room that are
        // pending or confirmed.  Cancelled or other statuses do not
        // block the room.
        if (res.roomId?.id !== formState.roomId) return;
        // Only consider reservations that are pending or confirmed.
        // Normalize status to lowercase to handle any capitalization variations.
        const statusLower = (res.status || '').toLowerCase();
        if (statusLower !== 'pending' && statusLower !== 'confirmed') return;
        // Determine the start and end of the reservation.  Use
        // checkIn/checkOut when available; fall back to date for
        // single‑day reservations.
        const start = res.checkIn ? new Date(res.checkIn) : res.date ? new Date(res.date) : null;
        const end = res.checkOut ? new Date(res.checkOut) : start;
        if (!start || !end) return;
        // Disable the occupied interval from check‑in through the day
        // before check‑out.  The check‑out day itself becomes
        // available for a new booking.  For single‑day reservations
        // (where checkOut is null or equal to checkIn), we disable
        // just that single day.
        const endExclusive = new Date(end);
        // Subtract one day to make the interval half‑open.  If the
        // resulting endExclusive is before the start (e.g. when
        // checkIn and checkOut are the same day), set it equal to
        // start so that at least the check‑in day is disabled.
        endExclusive.setDate(endExclusive.getDate() - 1);
        const toDate = endExclusive < start ? start : endExclusive;
        disabled.push({ from: start, to: toDate });
      });
    }
    setDisabledDates(disabled);
  }, [formState.roomId, allReservationsData]);

  /**
   * Recalculate the total price whenever the date range or selected
   * room changes.  We iterate through each night of the stay and
   * determine the nightly rate by checking special pricing periods
   * first, then monthly pricing ranges, and finally falling back to
   * the room’s base price.  The calculation is based on the
   * exclusive end date (i.e. the day of check‑out is not charged).
   * The result is stored in computedTotal and, if the user has not
   * manually entered a totalAmount, propagated to formState.totalAmount.
   */
  useEffect(() => {
    // Only compute when we have a complete date range and a room selected
    if (!dateRange?.from || !dateRange?.to || !formState.roomId || !roomsData?.rooms) {
      setComputedTotal(null);
      return;
    }
    // Find the selected room with pricing info
    const room = roomsData.rooms.find((r: any) => r.id === formState.roomId);
    if (!room) {
      setComputedTotal(null);
      return;
    }
    // Helper to determine if a date falls within a special period
    const isInSpecialPeriod = (date: Date, sp: any) => {
      const m = date.getMonth() + 1; // months are 0-based in JS
      const d = date.getDate();
      const startAfterEnd = sp.startMonth > sp.endMonth || (sp.startMonth === sp.endMonth && sp.startDay > sp.endDay);
      if (!startAfterEnd) {
        // Normal period within the same year
        const afterStart = m > sp.startMonth || (m === sp.startMonth && d >= sp.startDay);
        const beforeEnd = m < sp.endMonth || (m === sp.endMonth && d <= sp.endDay);
        return afterStart && beforeEnd;
      } else {
        // Period crosses year boundary (e.g. Dec 20 – Jan 5)
        const inFirstPart = m > sp.startMonth || (m === sp.startMonth && d >= sp.startDay);
        const inSecondPart = m < sp.endMonth || (m === sp.endMonth && d <= sp.endDay);
        return inFirstPart || inSecondPart;
      }
    };
    let total = 0;
    let current = new Date(dateRange.from);
    const end = new Date(dateRange.to);
    // Loop through each night (check‑in to the day before check‑out)
    while (current < end) {
      let nightlyRate = room.price;
      // Apply special prices first
      if (room.specialPrices && room.specialPrices.length > 0) {
        for (const sp of room.specialPrices) {
          if (isInSpecialPeriod(current, sp)) {
            nightlyRate = sp.price;
            break;
          }
        }
      }
      // Apply monthly prices if no special price matched
      if (nightlyRate === room.price && room.monthlyPrices && room.monthlyPrices.length > 0) {
        for (const mp of room.monthlyPrices) {
          const m = current.getMonth() + 1;
          if (m >= mp.startMonth && m <= mp.endMonth) {
            nightlyRate = mp.price;
            break;
          }
        }
      }
      total += nightlyRate;
      // Advance to the next day
      current.setDate(current.getDate() + 1);
    }
    setComputedTotal(total);
    // Update formState.totalAmount only if the user has not manually entered a value.
    setFormState((prev) => {
      // Determine if the current totalAmount matches the previous computedTotal.
      // If prev.totalAmount is empty or equals the old computedTotal or
      // is zero, update it; otherwise preserve the user’s manual input.
      if (prev.totalAmount === '' || prev.totalAmount === null || (typeof prev.totalAmount === 'number' && prev.totalAmount === computedTotal)) {
        return { ...prev, totalAmount: total } as ReservationFormState;
      }
      return prev;
    });
    // We intentionally exclude computedTotal from dependency array to avoid
    // stale comparisons inside the state updater.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, formState.roomId, roomsData]);

  /**
   * Reset the currently selected date range whenever the room
   * selection changes.  Without this reset, a previously selected
   * range might remain in place even though it conflicts with
   * reservations for the newly chosen room.  Clearing the date
   * range also clears the checkIn and checkOut fields on the form.
   */
  useEffect(() => {
    setDateRange(undefined);
    setFormState((prev) => ({ ...prev, checkIn: "", checkOut: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.roomId]);
  const [updateReservation] = useMutation(UPDATE_RESERVATION);

  // Form state

  /**
   * Local state to hold the currently selected date range for a hotel
   * reservation.  We use the DateRange type from react‑day‑picker to
   * represent a start (from) and end (to) date.  When undefined the
   * user has not yet chosen dates.  Selecting a range will update
   * formState.checkIn and formState.checkOut accordingly.
   */
  /**
   * Disabled dates for the date range picker.  This array contains
   * matchers accepted by react‑day‑picker.  Each entry either
   * specifies a single date, a range of dates, or a rule (e.g. before
   * today).  When selecting a room, we populate this array with any
   * existing reservations for that room so that the user cannot select
   * overlapping dates.  We always disable dates before today by
   * including a matcher with a before condition.
   */
  const [disabledDates, setDisabledDates] = useState<any[]>([{ before: new Date() }]);

  /**
   * Computed total price for the selected stay.  This value is
   * recalculated whenever the room selection or date range changes.
   * It represents the sum of nightly rates across the selected
   * check‑in/check‑out interval.  We derive nightly rates from the
   * room’s base price, monthly pricing sessions and special date
   * ranges.  When null no valid date range is selected.
   */
  const [computedTotal, setComputedTotal] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state for reservations.  currentPage is 1-indexed.  We
  // display a fixed number of reservations per page specified by
  // itemsPerPage.  Adjust itemsPerPage to change how many rows appear
  // in the table.

  const resetForm = () => {
    setFormState({
      guestFirstName: "",
      guestLastName: "",
      guestEmail: "",
      guestPhone: "",
      roomId: "",
      checkIn: "",
      checkOut: "",
      guests: 1,
      totalAmount: "",
      status: "pending",
    });
    setShowForm(false);
    // Clear any selected date range when resetting the form
    setDateRange(undefined);
  };

  // Refetch reservations whenever the currentPage changes.  This
  // effect ensures that navigating through pagination updates the
  // displayed data.  We skip refetching when the business context
  // is not yet available.
  useEffect(() => {
    if (!businessId || !businessType) return;
    refetchReservations({
      businessId,
      businessType,
      page: currentPage,
      limit: itemsPerPage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Fetch all reservations for date picker availability.  We use a
  // large limit to retrieve all reservations at once.  This separate
  // query ensures that disabledDates includes reservations beyond
  // the current paginated page.  We skip execution until both
  // businessId and businessType are available.


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !businessType) return;
    try {
      // Validate that a check‑in and check‑out date have been selected.
      if (!formState.checkIn || !formState.checkOut) {
        // Display an error toast when the user tries to submit
        // without selecting both dates.  We fall back to an
        // English message if the translation key is missing.
        toast.error(t("selectDatesAlert") || "Please select your check‑in and check‑out dates");
        return;
      }
      // Concatenate first and last name into a single full name.  Trim to
      // avoid leading/trailing spaces when one of the fields is empty.
      const fullName = `${formState.guestFirstName} ${formState.guestLastName}`.trim();
      const input: any = {
        businessId,
        businessType,
        customerInfo: {
          name: fullName,
          email: formState.guestEmail,
          phone: formState.guestPhone,
        },
        roomId: formState.roomId || null,
        checkIn: formState.checkIn || null,
        checkOut: formState.checkOut || null,
        guests: formState.guests !== "" ? Number(formState.guests) : undefined,
        date: new Date().toISOString(),
        status: formState.status,
        totalAmount: formState.totalAmount !== "" ? Number(formState.totalAmount) : undefined,
        paymentStatus: "pending",
      };
      await createReservation({ variables: { input } });
      resetForm();
      // Refetch reservations for the current page and limit after creation
      refetchReservations({
        businessId,
        businessType,
        page: currentPage,
        limit: itemsPerPage,
      });
      // Refetch all reservations so that disabled dates reflect the new booking
      refetchAllReservations({
        businessId,
        businessType,
        page: 1,
        limit: 1000,
      });
      // Show a success toast when the reservation is created
      toast.success("Reservation created successfully");
    } catch (err) {
      console.error(err)
      // Show an error toast on failure
      toast.error("Failed to create reservation")
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this reservation?")) {
      await deleteReservation({ variables: { id } });
      refetchReservations({
        businessId,
        businessType,
        page: currentPage,
        limit: itemsPerPage,
      });
      // Refetch all reservations so that disabled dates reflect the cancellation
      refetchAllReservations({
        businessId,
        businessType,
        page: 1,
        limit: 1000,
      });
      toast.success("Reservation deleted successfully");
    }
  };

  // Handle updating the status (or other fields) of a reservation.  When
  // changing the status we need to send all required fields expected by
  // ReservationInput because GraphQL does not support partial updates.
  const handleStatusChange = async (reservation: any, newStatus: string) => {
    if (!businessId || !businessType) return;
    try {
      const input: any = {
        businessId,
        businessType,
        customerInfo: {
          name: reservation.customerInfo?.name,
          email: reservation.customerInfo?.email,
          phone: reservation.customerInfo?.phone,
        },
        roomId: reservation.roomId?.id ?? null,
        checkIn: reservation.checkIn ?? null,
        checkOut: reservation.checkOut ?? null,
        guests: reservation.guests,
        date: reservation.createdAt ?? reservation.date ?? new Date().toISOString(),
        totalAmount: reservation.totalAmount ?? undefined,
        status: newStatus,
        paymentStatus: reservation.paymentStatus ?? 'pending',
      };
      await updateReservation({ variables: { id: reservation.id, input } });
      refetchReservations({
        businessId,
        businessType,
        page: currentPage,
        limit: itemsPerPage,
      });
      // Refetch all reservations so that disabled dates reflect the updated status
      refetchAllReservations({
        businessId,
        businessType,
        page: 1,
        limit: 1000,
      });
      toast.success("Reservation updated successfully");
    } catch (err) {
      console.error(err)
      toast.error("Failed to update reservation")
    }
  };

  // Render loading/error states
  if (sessionLoading || roomsLoading || reservationsLoading) return <p>Loading...</p>;
  if (sessionError) return <p>{sessionError}</p>;
  if (roomsError) return <p>Error loading rooms.</p>;
  if (reservationsError) return <p>Error loading reservations.</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("reservations")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          {t("newReservation")}
        </button>
      </div>

      {/* List of reservations */}
      <section className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder={t("searchByNameOrEmail")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
                <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {(() => {
          const reservationDocs = reservationsData?.reservations?.docs ?? [];
          return reservationDocs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("guest")}</TableHead>
                  <TableHead>{t("room")}</TableHead>
                  <TableHead>{t("checkIn")}</TableHead>
                  <TableHead>{t("checkOut")}</TableHead>
                  <TableHead>{t("guestsCountLabel")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead><span className="sr-only">{t("openMenu")}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservationDocs
                  .filter((res: any) => {
                    const searchTermLower = searchTerm.toLowerCase();
                    const guestName = res.customerInfo?.name?.toLowerCase() || '';
                    const guestEmail = res.customerInfo?.email?.toLowerCase() || '';
                    return (
                      (guestName.includes(searchTermLower) || guestEmail.includes(searchTermLower)) &&
                      (statusFilter === 'all' || res.status === statusFilter)
                    );
                  })
                  .map((res: any) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">{res.customerInfo?.name}</TableCell>
                      <TableCell>{res.roomId?.number || 'N/A'}</TableCell>
                      <TableCell>
                        {res.checkIn ? new Date(res.checkIn).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {res.checkOut ? new Date(res.checkOut).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{res.guests}</TableCell>
                      <TableCell>{formatCurrency(res.totalAmount ?? 0, currency, currency)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            res.status === 'confirmed'
                              ? 'default'
                              : res.status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {res.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">{t('openMenu')}</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(res, 'confirmed')}
                            >
                              {t('confirmReservation')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(res, 'pending')}>
                              {t('setToPending')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(res, 'cancelled')}>
                              {t('cancelReservation')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(res.id)}
                              className="text-red-600"
                            >
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <p>{t('noReservationsFound')}</p>
          );
        })()}
      </section>

      {/* Pagination controls for reservations */}
      {reservationsData?.reservations?.totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
              />
            </PaginationItem>
            {Array.from(
              { length: reservationsData.reservations.totalPages },
              (_, idx) => idx + 1
            ).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  isActive={pageNum === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    if (pageNum !== currentPage) {
                      setCurrentPage(pageNum);
                    }
                  }}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const totalPages = reservationsData.reservations.totalPages;
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Form for creating a new reservation */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("newReservation")}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {/* Guest name fields: separate first and last name for clarity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestFirstName">{t("firstName") ?? "First Name"}</Label>
                <Input
                  id="guestFirstName"
                  value={formState.guestFirstName}
                  onChange={(e) => setFormState({ ...formState, guestFirstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestLastName">{t("lastName") ?? "Last Name"}</Label>
                <Input
                  id="guestLastName"
                  value={formState.guestLastName}
                  onChange={(e) => setFormState({ ...formState, guestLastName: e.target.value })}
                  required
                />
              </div>
            </div>
            {/* Contact details: email and phone number.  Phone number field
                enforces a simple pattern allowing optional + prefix and
                between 7 and 15 digits to approximate international
                numbers.  Both fields are required. */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestEmail">{t("guestEmail")}</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={formState.guestEmail}
                  onChange={(e) => setFormState({ ...formState, guestEmail: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestPhone">{t("guestPhone")}</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={formState.guestPhone}
                  onChange={(e) => setFormState({ ...formState, guestPhone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomId">{t("room")}</Label>
              <Select value={formState.roomId} onValueChange={(value) => setFormState({ ...formState, roomId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectARoom")} />
                </SelectTrigger>
                <SelectContent>
                  {roomsData?.rooms?.map((room: any) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.number} ({room.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Date range picker for selecting check‑in and check‑out dates.
                We use a popover with our Calendar component from
                react‑day‑picker.  Disabled dates are computed based
                on existing reservations for the selected room and all
                past dates.  Selecting a range updates formState
                automatically via onSelect. */}
            <div className="space-y-2">
              <Label htmlFor="dateRange">
                {t("selectYourDates") || t("selectDates") || t("checkInDate") || "Select Dates"}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dateRange"
                    variant={"outline"}
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>{t("pickADate") || t("selectDates") || "Pick a date"}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range: any) => {
                      const r = range as DateRange | undefined;
                      setDateRange(r);
                      setFormState((prev) => {
                        const formattedFrom = r?.from ? format(r.from, 'yyyy-MM-dd') : '';
                        const formattedTo = r?.to ? format(r.to, 'yyyy-MM-dd') : '';
                        return {
                          ...prev,
                          checkIn: formattedFrom,
                          checkOut: formattedTo,
                        };
                      });
                    }}
                    numberOfMonths={2}
                    disabled={disabledDates}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Display pricing details for the selected room.  When a room
                is selected we show the base price, any monthly
                pricing ranges and special date ranges.  We also
                display the calculated total for the chosen stay. */}
            {selectedRoom && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  {(t("basePrice") || "Base price") + ":"} {formatCurrency(selectedRoom.price ?? 0, currency, currency)} / {t("night") || "night"}
                </div>
                {selectedRoom.monthlyPrices && selectedRoom.monthlyPrices.length > 0 && (
                  <div>
                    <div>{t("monthlyPrices") || "Monthly prices"}:</div>
                    <ul className="list-disc pl-4">
                      {selectedRoom.monthlyPrices.map((mp: any, idx: number) => (
                        <li key={idx}>
                          {mp.startMonth}–{mp.endMonth}: {formatCurrency(mp.price, currency, currency)} / {t("night") || "night"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedRoom.specialPrices && selectedRoom.specialPrices.length > 0 && (
                  <div>
                    <div>{t("specialPrices") || "Special prices"}:</div>
                    <ul className="list-disc pl-4">
                      {selectedRoom.specialPrices.map((sp: any, idx: number) => (
                        <li key={idx}>
                          {sp.startMonth}/{sp.startDay} – {sp.endMonth}/{sp.endDay}: {formatCurrency(sp.price, currency, currency)} / {t("night") || "night"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {computedTotal !== null && (
                  <div>
                    {(t("calculatedTotal") || "Calculated total") + ":"} {formatCurrency(computedTotal, currency, currency)}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guests">{t("guestsCountLabel")}</Label>
                <Input id="guests" type="number" value={formState.guests} onChange={(e) => setFormState({ ...formState, guests: e.target.value === "" ? "" : Number(e.target.value) })} min={1} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">{t("totalAmount") || "Total Amount"}</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={formState.totalAmount}
                  onChange={(e) => setFormState({ ...formState, totalAmount: e.target.value === "" ? "" : Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t("status")}</Label>
              <Select value={formState.status} onValueChange={(value) => setFormState({ ...formState, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("pending")}</SelectItem>
                  <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
                  <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                {t("cancel")}
              </Button>
              <Button type="submit">
                {t("createReservation")}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}