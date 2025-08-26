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
import useTranslation from "@/hooks/useTranslation";

/**
 * Reservation management page for hotel businesses.  This page allows the
 * operator to view, create and delete reservations.  It uses session data
 * exposed via `/api/session` to determine the current hotel (business)
 * context and fetches all rooms so the user can select a room for the
 * reservation.
 */

// Query to fetch rooms for the current hotel
const GET_ROOMS = gql`
  query GetRooms($hotelId: ID!) {
    rooms(hotelId: $hotelId) {
      id
      number
      type
    }
  }
`;

// Query to fetch reservations for a business
const GET_RESERVATIONS = gql`
  query GetReservations($businessId: ID!, $businessType: String!) {
    reservations(businessId: $businessId, businessType: $businessType) {
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
  guestName: string;
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
    variables: { businessId, businessType },
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

  // Mutations
  const [createReservation] = useMutation(CREATE_RESERVATION);
  const [deleteReservation] = useMutation(DELETE_RESERVATION);

  // Translation hook for multi‑language support
  const { t } = useTranslation();
const [updateReservation] = useMutation(UPDATE_RESERVATION);

  // Form state
  const [formState, setFormState] = useState<ReservationFormState>({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    totalAmount: "",
    status: "pending",
  });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const resetForm = () => {
    setFormState({
      guestName: "",
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !businessType) return;
    try {
      const input: any = {
        businessId,
        businessType,
        customerInfo: {
          name: formState.guestName,
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
      refetchReservations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this reservation?")) {
      await deleteReservation({ variables: { id } });
      refetchReservations();
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
      refetchReservations();
    } catch (err) {
      console.error(err);
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
        {reservationsData?.reservations && reservationsData.reservations.length > 0 ? (
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
              {reservationsData.reservations
                .filter((res: any) => {
                    const searchTermLower = searchTerm.toLowerCase();
                    const guestName = res.customerInfo?.name?.toLowerCase() || '';
                    const guestEmail = res.customerInfo?.email?.toLowerCase() || '';
                    return (guestName.includes(searchTermLower) || guestEmail.includes(searchTermLower)) &&
                           (statusFilter === 'all' || res.status === statusFilter);
                })
                .map((res: any) => (
                <TableRow key={res.id}>
                  <TableCell className="font-medium">{res.customerInfo?.name}</TableCell>
                  <TableCell>{res.roomId?.number || "N/A"}</TableCell>
                  <TableCell>{res.checkIn ? new Date(res.checkIn).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell>{res.checkOut ? new Date(res.checkOut).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell>{res.guests}</TableCell>
                  <TableCell>{formatCurrency(res.totalAmount ?? 0, currency, currency)}</TableCell>
                  <TableCell>
                    <Badge variant={res.status === 'confirmed' ? 'default' : res.status === 'pending' ? 'secondary' : 'destructive'}>
                      {res.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t("openMenu")}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(res, 'confirmed')}>{t("confirmReservation")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(res, 'pending')}>{t("setToPending")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(res, 'cancelled')}>{t("cancelReservation")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(res.id)} className="text-red-600">
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p>{t("noReservationsFound")}</p>
        )}
      </section>

      {/* Form for creating a new reservation */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("newReservation")}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">{t("guestName")}</Label>
                <Input id="guestName" value={formState.guestName} onChange={(e) => setFormState({ ...formState, guestName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">{t("guestEmail")}</Label>
                <Input id="guestEmail" type="email" value={formState.guestEmail} onChange={(e) => setFormState({ ...formState, guestEmail: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestPhone">{t("guestPhone")}</Label>
              <Input id="guestPhone" value={formState.guestPhone} onChange={(e) => setFormState({ ...formState, guestPhone: e.target.value })} />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">{t("checkInDate")}</Label>
                <Input id="checkIn" type="date" value={formState.checkIn} onChange={(e) => setFormState({ ...formState, checkIn: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">{t("checkOutDate")}</Label>
                <Input id="checkOut" type="date" value={formState.checkOut} onChange={(e) => setFormState({ ...formState, checkOut: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guests">{t("guestsCountLabel")}</Label>
                <Input id="guests" type="number" value={formState.guests} onChange={(e) => setFormState({ ...formState, guests: e.target.value === "" ? "" : Number(e.target.value) })} min={1} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">{t("totalAmount")} ({currencySymbol})</Label>
                <Input id="totalAmount" type="number" value={formState.totalAmount} onChange={(e) => setFormState({ ...formState, totalAmount: e.target.value === "" ? "" : Number(e.target.value) })} min={0} />
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