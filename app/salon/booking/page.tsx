"use client"
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  Calendar as CalendarIcon,
  User,
  Mail,
  Phone,
}     from "lucide-react";

// Currency helper to format amounts according to the salon's selected currency
import { formatCurrency } from "@/lib/currency";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * This page implements a multi‑step appointment booking flow for the salon.
 * Users progress through the following steps:
 *   0. Choose a service from the list of available salon services.
 *   1. Select a stylist for the chosen service (or let the salon choose).
 *   2. Pick a date and time from the available slots.
 *   3. Add any optional service add‑ons.
 *   4. Review a summary of their booking and provide contact details before confirming.
 *
 * At each step the relevant information is fetched via GraphQL.  Once confirmed,
 * a reservation is created in the backend and the user is shown a success message.
 */

// GraphQL: Fetch all active salons to derive a default salonId.  We assume the
// first salon is the one to use for booking.  If your application supports
// multiple salons you may want to let the user choose explicitly.
const GET_SALONS = gql`
  query GetSalons {
    salons {
      id
      name
      description
      images
      settings {
        currency
      }
    }
  }
`;

// GraphQL: Fetch the list of services offered by a business.  We include
// details needed for display and option customisation.
const GET_SERVICES = gql`
  query GetServices($businessId: ID!, $businessType: String!) {
    services(businessId: $businessId, businessType: $businessType) {
      id
      name
      description
      duration
      price
      category
      images
      options {
        name
        price
        durationImpact
      }
    }
  }
`;

// GraphQL: Fetch all staff for a given business.  These are the stylists the
// user can select during booking.  We only need id, name and role for
// presentation.
const GET_STAFF = gql`
  query GetStaff($businessId: ID!, $businessType: String!) {
    staff(businessId: $businessId, businessType: $businessType) {
      id
      name
      role
      avatar
    }
  }
`;

// GraphQL: Fetch existing reservations for a business.  The backend now
// returns a ReservationPagination object when page/limit arguments are
// provided.  We request only the docs array to get the list of
// reservations.  Supplying a high limit retrieves all reservations
// needed to compute unavailable time slots.  Adjust the limit if your
// salon handles more than 1000 bookings at once.
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
        date
        time
        status
        duration
        serviceId {
          id
          duration
        }
      }
    }
  }
`;

// GraphQL: Mutation to create a new reservation.
const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationInput!) {
    createReservation(input: $input) {
      id
      status
    }
  }
`;

// GraphQL: Mutation to create a payment session after a reservation.  Used
// to redirect the user to Stripe for payment.
const CREATE_PAYMENT_SESSION = gql`
  mutation CreatePaymentSession($input: CreatePaymentSessionInput!) {
    createPaymentSession(input: $input) {
      sessionId
      url
    }
  }
`;

export default function SalonBookingPage() {
  // Track the current step in the booking flow.  Steps are numbered 0–4.
  const [step, setStep] = useState(0);

  // Keep track of all user selections.  This state will be built up over
  // multiple steps and eventually sent to the backend when the reservation is
  // confirmed.
  const [bookingData, setBookingData] = useState({
    serviceId: "",
    staffId: "",
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Selected option names for the chosen service.  The selected service
  // contains an array of option objects; this array holds the names the user
  // has toggled on.
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Read query parameters from the URL.  When a serviceId is provided
  // (e.g. from the landing page), skip the service selection step and
  // preselect the service, moving directly to stylist selection.
  const searchParams = useSearchParams();

  // Determine which salon to book.  We fetch all salons and pick the first
  // active salon for demonstration purposes.
  const [salonId, setSalonId] = useState<string | null>(null);
  // The currency used by the salon.  Defaults to USD until the salons query returns.
  const [currency, setCurrency] = useState<string>('USD');
  const { data: salonsData, loading: salonsLoading } = useQuery(GET_SALONS);
  useEffect(() => {
    if (!salonsLoading && salonsData?.salons && salonsData.salons.length > 0 && !salonId) {
      setSalonId(salonsData.salons[0].id);
    }
    // When the salons query resolves update the currency state if available
    if (!salonsLoading && salonsData?.salons && salonsData.salons.length > 0) {
      const c = salonsData.salons[0].settings?.currency;
      if (c) {
        setCurrency(c as string);
      }
    }
  }, [salonsLoading, salonsData, salonId]);

  // Fetch services, staff and reservations once we have a salonId.  These
  // queries are skipped until the salonId is defined.
  const { data: servicesData } = useQuery(GET_SERVICES, {
    variables: { businessId: salonId, businessType: "salon" },
    skip: !salonId,
  });
  const { data: staffData } = useQuery(GET_STAFF, {
    variables: { businessId: salonId, businessType: "salon" },
    skip: !salonId,
  });
  const { data: reservationsData } = useQuery(GET_RESERVATIONS, {
    // Request all reservations with a high limit so that time slot
    // availability is computed accurately.  If your salon has more than
    // 1000 bookings at once you may increase the limit or implement
    // client‑side pagination for this view.  The businessType is fixed
    // to "salon" on this page.
    variables: { businessId: salonId, businessType: "salon", page: 1, limit: 1000 },
    skip: !salonId,
  });

  // Set up the mutation for reservation creation.
  const [createReservation] = useMutation(CREATE_RESERVATION);
  const [createPaymentSession] = useMutation(CREATE_PAYMENT_SESSION);

  // Derive lists from GraphQL data.  Provide fallbacks to empty arrays if
  // queries haven't loaded yet.
  const services = servicesData?.services ?? [];
  const stylists = staffData?.staff ?? [];

  // Find the currently selected service and stylist objects based on the ids
  // stored in bookingData.
  const selectedService = useMemo(
    () => services.find((s: any) => s.id === bookingData.serviceId),
    [services, bookingData.serviceId]
  );
  const selectedStaff = useMemo(
    () => stylists.find((s: any) => s.id === bookingData.staffId),
    [stylists, bookingData.staffId]
  );

  // When arriving at the booking page with a serviceId query param,
  // automatically preselect that service and advance to the next step.
  useEffect(() => {
    const paramId = searchParams.get("serviceId");
    // Only preselect if we haven't already selected a service
    if (paramId && bookingData.serviceId === "" && services.length > 0) {
      const exists = services.some((s: any) => s.id === paramId);
      if (exists) {
        setBookingData((prev) => ({ ...prev, serviceId: paramId }));
        setStep(1);
      }
    }
  }, [searchParams, services, bookingData.serviceId]);

  // Compute reserved intervals for the chosen date.  Each reservation
  // blocks a contiguous span of time from its start to its start
  // plus its duration.  The duration is read from the reservation
  // itself if available, otherwise we attempt to look up the duration
  // via the serviceId.  If both are missing a 30 minute default is
  // used.  Intervals are represented as minutes since midnight.
  const reservedIntervals = useMemo(() => {
    // reservations now returns a ReservationPagination object with a docs array.
    // Guard against undefined to handle the initial loading state gracefully.
    if (!reservationsData?.reservations?.docs) return [] as { start: number; end: number }[];
    return reservationsData.reservations.docs
      .filter((r: any) => {
        // Only consider reservations on the selected date for the same service.
        // If no serviceId is selected yet we consider all reservations to avoid false negatives.
        const sameDate = r.date.slice(0, 10) === bookingData.date;
        if (!sameDate) return false;
        // GraphQL may return serviceId as an object with id and duration or as an ID string.
        const rServiceId =
          typeof r.serviceId === 'string' || typeof r.serviceId === 'number'
            ? r.serviceId
            : r.serviceId?.id;
        if (!bookingData.serviceId) return true;
        return rServiceId === bookingData.serviceId;
      })
      .map((r: any) => {
        // Parse the reservation start time (HH:mm) to minutes since midnight
        const [h, m] = r.time.split(':').map((x: string) => parseInt(x, 10));
        const start = h * 60 + m;
        // Determine the duration: use reservation.duration if set; else
        // use the duration from the serviceId field; else fallback to 30.
        let dur = 30;
        if (typeof r.duration === 'number' && !isNaN(r.duration)) {
          dur = r.duration;
        } else if (r.serviceId && typeof r.serviceId === 'object' && r.serviceId.duration) {
          dur = r.serviceId.duration;
        } else {
          // Attempt to find the service in the loaded services list
          const srv = services.find((s: any) =>
            s.id === (typeof r.serviceId === 'object' ? r.serviceId.id : r.serviceId)
          );
          if (srv?.duration) dur = srv.duration;
        }
        return { start, end: start + dur };
      });
  }, [reservationsData, bookingData.date, bookingData.serviceId, services]);

  // When the selected service changes we reset the option selections to
  // prevent options from bleeding across services.
  useEffect(() => {
    setSelectedOptions([]);
  }, [bookingData.serviceId]);

  // Compute the list of option objects the user has selected based on the
  // current service.  This uses the names stored in selectedOptions and
  // filters the service options accordingly.  Placing this ahead of
  // selectedDurationMinutes allows that computation to reference
  // selectedOptionObjects safely.
  const selectedOptionObjects = useMemo(() => {
    if (!selectedService?.options) return [];
    return selectedService.options.filter((opt: any) => selectedOptions.includes(opt.name));
  }, [selectedService, selectedOptions]);

  /**
   * Compute the effective duration of the selected service including any
   * option impacts.  This value is used to generate appropriate time
   * slots and to persist the duration with the reservation.  If no
   * service is selected the duration falls back to 30 minutes so that
   * the UI remains usable during the initial step.
   */
  const selectedDurationMinutes = useMemo(() => {
    const base = selectedService?.duration ?? 30;
    const optionMinutes = selectedOptionObjects.reduce(
      (sum: number, opt: any) => sum + (opt.durationImpact || 0),
      0,
    );
    return base + optionMinutes;
  }, [selectedService, selectedOptionObjects]);

  /**
   * Generate available time slots based on the business hours (9:00 to
   * 18:00) and the selected service duration.  The last appointment
   * must finish before closing, so we stop generating start times once
   * the service would overrun the closing time.  We iterate in
   * half‑hour increments to offer flexibility while still respecting
   * longer services.
   */
  const timeSlots = useMemo(() => {
    const openMinutes = 9 * 60;
    const closeMinutes = 18 * 60;
    const slots: string[] = [];
    for (let m = openMinutes; m <= closeMinutes - selectedDurationMinutes; m += 30) {
      const hrs = Math.floor(m / 60)
        .toString()
        .padStart(2, "0");
      const mins = (m % 60).toString().padStart(2, "0");
      slots.push(`${hrs}:${mins}`);
    }
    return slots;
  }, [selectedDurationMinutes]);

  // Calculate the total price of the service plus selected add‑ons.  If an
  // option has no defined price it contributes zero.
  const totalPrice = useMemo(() => {
    const base = selectedService?.price ?? 0;
    const optionsTotal = selectedOptionObjects.reduce((sum: number, opt: any) => sum + (opt.price || 0), 0);
    return base + optionsTotal;
  }, [selectedService, selectedOptionObjects]);

  /**
   * Reset the booking flow back to the first step.  Useful after a
   * successful reservation or when the user cancels mid‑process.
   */
  const resetBooking = () => {
    setStep(0);
    setBookingData({ serviceId: "", staffId: "", date: "", time: "", name: "", email: "", phone: "", notes: "" });
    setSelectedOptions([]);
  };

  /**
   * Helper to advance to the next step if all required fields for the
   * current step are satisfied.  Displays alerts if data is missing.
   */
  const proceedToNext = () => {
    if (step === 0 && !bookingData.serviceId) {
      alert("Veuillez sélectionner un service pour continuer.");
      return;
    }
    if (step === 1 && !bookingData.staffId) {
      // staffId can be empty to mean any stylist; in that case we set it to an empty string explicitly.
      setBookingData((prev) => ({ ...prev, staffId: "" }));
    }
    if (step === 2 && (!bookingData.date || !bookingData.time)) {
      alert("Veuillez sélectionner la date et l'heure.");
      return;
    }
    if (step === 4) return; // final step handled separately
    setStep((prev) => prev + 1);
  };

  /**
   * Submit the reservation to the backend.  This is called from the final
   * step once the user has filled out their contact information.  Upon
   * success, we reset the flow and display a success message.  Errors are
   * caught and surfaced to the user.
   */
  const confirmReservation = async () => {
    if (!salonId || !selectedService) return;
    if (!bookingData.name || !bookingData.email || !bookingData.phone) {
      alert("Merci de renseigner votre nom, votre email et votre téléphone.");
      return;
    }
    try {
      // Compose notes: include selected option names for easy reference.
      const optionNotes = selectedOptions.length > 0 ? `Options: ${selectedOptions.join(", ")}` : "";
      const combinedNotes = [bookingData.notes, optionNotes].filter(Boolean).join(" | ") || undefined;
      const input: any = {
        businessId: salonId,
        businessType: "salon",
        customerInfo: {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
        },
        date: bookingData.date,
        time: bookingData.time,
        serviceId: bookingData.serviceId || null,
        staffId: bookingData.staffId || null,
        status: "pending",
        notes: combinedNotes,
        source: "website",
        totalAmount: totalPrice,
        // Persist the computed duration (base service duration plus any
        // selected options) so that the backend knows how long to
        // allocate for this appointment.  Without this field overlapping
        // reservations cannot be detected reliably.
        duration: selectedDurationMinutes,
      };
      const res = await createReservation({ variables: { input } });
      const reservationId = res.data?.createReservation?.id;
      if (!reservationId) {
        throw new Error("Failed to create reservation");
      }
      // Initiate Stripe checkout session
      const origin = window.location.origin;
      // Append the reservationId to the success and cancel URLs so that
      // the payment pages can confirm or cancel the booking appropriately.
      const successUrl = `${origin}/payment/success?reservationId=${reservationId}`;
      const cancelUrl = `${origin}/payment/cancel?reservationId=${reservationId}`;
      const { data: paymentData } = await createPaymentSession({
        variables: {
          input: {
            reservationId,
            successUrl,
            cancelUrl,
          },
        },
      });
      const url = paymentData?.createPaymentSession?.url;
      resetBooking();
      if (url) {
        window.location.href = url;
      } else {
        alert("Erreur lors de l'initialisation du paiement.");
      }
    } catch (err) {
      console.error(err);
      alert("La réservation a échoué. Veuillez réessayer.");
    }
  };

  // State for calendar month offset
  const [monthOffset, setMonthOffset] = useState(0);

  // State for calendar month offset

  // Helper to get the current and next month Date objects based on offset
  const monthDates = useMemo(() => {
    const now = new Date();
    const firstMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const secondMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);
    return [firstMonth, secondMonth];
  }, [monthOffset]);

  // Render loading state whilst salon and service data are loading.  The rest
  // of the flow is gated on services being available.
  if (salonsLoading || !salonId) {
    return <p className="py-10 text-center text-gray-500">Chargement...</p>;
  }

  // If there are no services configured for the salon, inform the user.
  if (services.length === 0) {
    return <p className="py-10 text-center text-gray-500">Aucun service n'est disponible pour le moment.</p>;
  }

  /**
   * Step 0: Service selection.  Display a list/grid of services with
   * descriptive cards.  Clicking a card selects the service and moves to
   * the next step.
   */
  const renderServiceSelection = () => (
    <div className="max-w-5xl mx-auto py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Choisissez votre service</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service: any) => (
          <button
            key={service.id}
            onClick={() => {
              setBookingData((prev) => ({ ...prev, serviceId: service.id }));
              setStep(1);
            }}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left"
          >
            {service.images && service.images.length > 0 ? (
              <img
                src={service.images[0]}
                alt={service.name}
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="h-44 bg-pink-50 flex items-center justify-center text-pink-500 text-4xl font-bold">
                {service.name.charAt(0)}
              </div>
            )}
            <div className="p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-600 h-16 overflow-hidden leading-snug">{service.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-pink-600 font-bold">{formatCurrency(service.price, currency)}</span>
                <span className="text-sm text-gray-500">{service.duration || 0} min</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  /**
   * Step 1: Stylist selection.  Show details of the chosen service and list
   * available stylists.  Users can also choose "N'importe quel styliste" to
   * let the salon decide.  Proceeding without a selection defaults to any
   * stylist.
   */
  const renderStylistSelection = () => (
    <div className="max-w-4xl mx-auto py-12">
      <button onClick={() => setStep(0)} className="text-pink-600 hover:text-pink-500 mb-6">← Retour</button>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <span>Services</span>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium">{selectedService?.name}</span>
      </nav>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 capitalize">{selectedService?.name}</h1>
      <p className="text-gray-600 mb-6 max-w-2xl leading-relaxed">{selectedService?.description}</p>
      {/* Service details */}
      <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Description</p>
          <p className="text-gray-800 leading-relaxed text-sm">{selectedService?.description}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Prix</p>
          <p className="text-gray-900 font-semibold text-lg">{selectedService?.price != null ? formatCurrency(selectedService.price, currency) : ''}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Durée</p>
          <p className="text-gray-900 font-semibold text-lg">{selectedService?.duration || 0} min</p>
        </div>
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">Sélectionnez un styliste</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {/* Option to let salon choose */}
        <button
          onClick={() => {
            setBookingData((prev) => ({ ...prev, staffId: "" }));
            proceedToNext();
          }}
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium flex items-center justify-center hover:bg-pink-50 transition-colors"
        >
          N'importe quel styliste
        </button>
        {stylists.length > 0 ? (
          stylists.map((staff: any) => (
            <button
              key={staff.id}
              onClick={() => {
                setBookingData((prev) => ({ ...prev, staffId: staff.id }));
                proceedToNext();
              }}
              className="border border-gray-300 rounded-lg px-4 py-3 flex items-center space-x-3 hover:bg-pink-50 transition-colors"
            >
              <img
                src={staff.avatar || "/placeholder-user.jpg"}
                alt={staff.name}
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="text-gray-800 font-medium">{staff.name}</span>
            </button>
          ))
        ) : (
          <p className="col-span-full text-gray-600">Aucun styliste disponible.</p>
        )}
      </div>
    </div>
  );

  // State for calendar month offset


  /**
   * Helper to generate a grid of weeks for a given month.
   * Returns an array of weeks, each week is an array of day numbers or null for empty slots.
   */
  function getMonthGrid(monthDate: Date) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];
    // Fill initial empty days
    for (let i = 0; i < firstDay.getDay(); i++) {
      week.push(null);
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    // Fill trailing empty days
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }
    return weeks;
  }

  /**
   * Step 2: Date and time selection.  Presents a date picker input and a
   * scrollable list of time slots with availability labels.  Reserved slots
   * are disabled.  Proceeding requires both a date and a time selection.
   */
  const renderDateTimeSelection = () => (
    <div className="max-w-4xl mx-auto py-12">
      <button onClick={() => setStep(1)} className="text-pink-600 hover:text-pink-500 mb-6">← Retour</button>
      <nav className="text-sm text-gray-500 mb-4">
        <span>Réservation</span>
        <span className="mx-1">/</span>
        <span>{selectedService?.name}</span>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium">Date & heure</span>
      </nav>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Planifiez votre rendez‑vous</h1>
      <div className="space-y-10">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthOffset((prev) => prev - 1)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div className="text-lg font-semibold text-gray-900 text-center flex-1">
              {monthDates[0].toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
              {" · "}
              {monthDates[1].toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => setMonthOffset((prev) => prev + 1)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {monthDates.map((monthDate, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="text-center font-semibold text-gray-800 mb-2 capitalize">
                  {monthDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                </div>
                {/* Days of week header */}
                <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-1">
                  <div>Dim</div>
                  <div>Lun</div>
                  <div>Mar</div>
                  <div>Mer</div>
                  <div>Jeu</div>
                  <div>Ven</div>
                  <div>Sam</div>
                </div>
                {getMonthGrid(monthDate).map((week, wIndex) => (
                  <div key={wIndex} className="grid grid-cols-7">
                    {week.map((day, dIndex) => {
                      const dateObj = day
                        ? new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
                        : null;
                      const dateString =
                        dateObj &&
                        `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(
                          dateObj.getDate()
                        ).padStart(2, '0')}`;
                      const isSelected = bookingData.date === dateString;
                      const isPast =
                        dateObj &&
                        new Date(dateObj.toDateString()) < new Date(new Date().toDateString());
                      return (
                        <button
                          key={dIndex}
                          onClick={() => {
                            if (day && !isPast) {
                              setBookingData((prev) => ({ ...prev, date: dateString || '', time: '' }));
                            }
                          }}
                          disabled={!day || isPast}
                          className={`h-10 flex items-center justify-center text-sm rounded transition-colors
                          ${day ? '' : 'cursor-default'}
                          ${day && !isPast ? 'hover:bg-pink-50 cursor-pointer' : ''}
                          ${isSelected ? 'bg-pink-600 text-white' : ''}
                          ${isPast ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {day || ''}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Time table */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Horaires disponibles</label>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-left">Heure</th>
                  <th className="px-4 py-2 font-medium text-left">Disponibilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {timeSlots.map((slot) => {
                  // Determine if this slot conflicts with any existing reservation.
                  // Convert the candidate start and end times into minutes since midnight.
                  const [sh, sm] = slot.split(":").map((x) => parseInt(x, 10));
                  const startMin = sh * 60 + sm;
                  const endMin = startMin + selectedDurationMinutes;
                  const conflict = reservedIntervals.some((interval) => startMin < interval.end && endMin > interval.start);
                  const isSelected = bookingData.time === slot;
                  return (
                    <tr
                      key={slot}
                      className={
                        conflict
                          ? 'bg-gray-50 text-gray-400'
                          : isSelected
                          ? 'bg-pink-50 text-pink-700'
                          : 'hover:bg-pink-50 cursor-pointer'
                      }
                      onClick={() => {
                        if (!conflict) {
                          setBookingData((prev) => ({ ...prev, time: slot }));
                        }
                      }}
                    >
                      <td className="px-4 py-3">{slot}</td>
                      <td className="px-4 py-3">
                        {conflict ? (
                          <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-400">Réservé</span>
                        ) : (
                          <span className="inline-block px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Disponible</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-10 text-right">
        <button
          onClick={proceedToNext}
          className="bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors"
        >
          Continuer
        </button>
      </div>
    </div>
  );

  /**
   * Step 3: Option selection.  Lists any available add‑on options for the
   * chosen service.  The user can check multiple options.  A small summary
   * below recaps the base service and selected options with pricing.  A
   * continuation button leads to the confirmation step.
   */
  const renderOptionsSelection = () => (
    <div className="max-w-4xl mx-auto py-12">
      <button onClick={() => setStep(2)} className="text-pink-600 hover:text-pink-500 mb-6">← Retour</button>
      <nav className="text-sm text-gray-500 mb-4">
        <span>Réservation</span>
        <span className="mx-1">/</span>
        <span>{selectedService?.name}</span>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium">Options</span>
      </nav>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Personnalisez votre {selectedService?.name?.toLowerCase()}</h1>
      {/* Options list */}
      {selectedService?.options && selectedService.options.length > 0 ? (
        <>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Choisissez vos options</h3>
          <div className="divide-y divide-gray-100 mb-10">
            {selectedService.options.map((opt: any) => {
              const checked = selectedOptions.includes(opt.name);
              return (
                <label key={opt.name} className="flex items-center justify-between py-3 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-pink-600 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      checked={checked}
                      onChange={() => {
                        setSelectedOptions((prev) => {
                          if (prev.includes(opt.name)) {
                            return prev.filter((n) => n !== opt.name);
                          }
                          return [...prev, opt.name];
                        });
                      }}
                    />
                    <span className="text-gray-800 text-base">{opt.name}</span>
                  </div>
                  <span className="text-gray-600 text-base">
                    {opt.price ? `+${formatCurrency(opt.price, currency)}` : 'Gratuit'}
                  </span>
                </label>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-gray-600 mb-8">Aucune option supplémentaire pour ce service.</p>
      )}
      {/* Summary */}
      <div className="border-t border-gray-200 pt-8 mt-4">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">Récapitulatif</h3>
        <dl className="space-y-4 text-sm text-gray-700">
          <div className="flex justify-between">
            <dt>Service</dt>
            <dd className="font-medium">{selectedService?.name}</dd>
          </div>
          {selectedOptionObjects.length > 0 && (
            <div className="flex justify-between">
              <dt>Options</dt>
              <dd className="text-right">{selectedOptionObjects.map((o: any) => o.name).join(', ')}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Durée</dt>
            <dd className="text-right">
              {selectedService?.duration || 0}
              {selectedOptionObjects.reduce((sum: number, opt: any) => sum + (opt.durationImpact || 0), 0) > 0
                ? ` + ${selectedOptionObjects.reduce((sum: number, opt: any) => sum + (opt.durationImpact || 0), 0)} min`
                : ''}
              min
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Date & heure</dt>
            <dd className="text-right">{bookingData.date || ''}{bookingData.date && bookingData.time ? ` · ${bookingData.time}` : bookingData.time}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-4 mt-4">
            <dt className="font-semibold">Total</dt>
            <dd className="font-semibold">{formatCurrency(totalPrice, currency)}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-10 text-right">
        <button
          onClick={proceedToNext}
          className="bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors"
        >
          Continuer
        </button>
      </div>
    </div>
  );

  /**
   * Step 4: Confirmation.  Summarises the user's selections (service, staff,
   * date, time, options) and gathers contact information.  The user can
   * submit the reservation which will trigger the mutation.  A back
   * button allows returning to the previous step to adjust options.
   */
  const renderConfirmation = () => (
    <div className="max-w-4xl mx-auto py-12">
      <button onClick={() => setStep(3)} className="text-pink-600 hover:text-pink-500 mb-6">← Retour</button>
      <nav className="text-sm text-gray-500 mb-4">
        <span>Réserver</span>
        <span className="mx-1">/</span>
        <span>{selectedService?.name}</span>
        <span className="mx-1">/</span>
        <span className="text-gray-700 font-medium">Résumé</span>
      </nav>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10">Votre réservation</h1>
      <div className="space-y-12 mb-10">
        {/* Booking details */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Détails de la réservation</h2>
          <dl className="space-y-4 text-sm text-gray-700">
            {/* Service */}
            <div className="flex justify-between items-start">
              <dt className="font-medium text-gray-900">Service</dt>
              <dd className="flex items-center space-x-4">
                {selectedService?.images && selectedService.images.length > 0 ? (
                  <img
                    src={selectedService.images[0]}
                    alt={selectedService.name}
                    className="w-14 h-14 rounded object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded bg-pink-50 flex items-center justify-center text-pink-500 font-bold">
                    {selectedService?.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{selectedService?.name}</p>
                  <p className="text-xs text-gray-500">{selectedService?.category || 'Service'}</p>
                </div>
              </dd>
            </div>
            {/* Prestataire */}
            <div className="flex justify-between items-start">
              <dt className="font-medium text-gray-900">Prestataire</dt>
              <dd>
                {selectedStaff ? (
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedStaff.avatar || '/placeholder-user.jpg'}
                      alt={selectedStaff.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-gray-900">{selectedStaff.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-700">Attribué par le salon</span>
                )}
              </dd>
            </div>
            {/* Date & heure */}
            <div className="flex justify-between items-start">
              <dt className="font-medium text-gray-900">Date & heure</dt>
              <dd className="text-right">
                {bookingData.date
                  ? new Date(bookingData.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                  : ''}
                {bookingData.date && bookingData.time ? ` · ${bookingData.time}` : bookingData.time}
              </dd>
            </div>
            {/* Options */}
            {selectedOptionObjects.length > 0 && (
              <div className="flex justify-between items-start">
                <dt className="font-medium text-gray-900">Options</dt>
                <dd className="text-right">{selectedOptionObjects.map((o: any) => o.name).join(', ')}</dd>
              </div>
            )}
            {/* Total */}
            <div className="flex justify-between items-start border-t border-gray-200 pt-4 mt-4">
              <dt className="font-semibold text-gray-900">Total</dt>
              <dd className="font-semibold text-gray-900">{formatCurrency(totalPrice, currency)}</dd>
            </div>
          </dl>
        </div>
        {/* Contact info */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Informations de contact</h2>
          <div className="space-y-4 text-gray-700">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nom complet"
                value={bookingData.name}
                onChange={(e) => setBookingData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Adresse email"
                value={bookingData.email}
                onChange={(e) => setBookingData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                placeholder="Numéro de téléphone"
                value={bookingData.phone}
                onChange={(e) => setBookingData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={confirmReservation}
        className="w-full bg-pink-600 text-white py-4 rounded-full font-medium hover:bg-pink-700 transition-colors"
      >
        Confirmer la réservation
      </button>
    </div>
  );

  // Render the appropriate step component based on the current step.
  const renderStep = () => {
    switch (step) {
      case 0:
        return renderServiceSelection();
      case 1:
        return renderStylistSelection();
      case 2:
        return renderDateTimeSelection();
      case 3:
        return renderOptionsSelection();
      case 4:
      default:
        return renderConfirmation();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Shared header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg md:text-xl text-pink-600">Salon&nbsp;Zenith</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <Link href="/salon" className="hover:text-pink-600">Accueil</Link>
            <Link href="/salon/services" className="hover:text-pink-600">Services</Link>
            <Link href="/salon/about" className="hover:text-pink-600">À propos de nous</Link>
            <Link href="/salon/contact" className="hover:text-pink-600">Contact</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link
              href="/salon/booking"
              className="hidden md:inline-block bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-pink-700 transition-colors"
            >
              Réserver maintenant
            </Link>
            <Link
              href="/login"
              className="inline-block border border-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 sm:px-6 lg:px-8">{renderStep()}</main>
      {/* Footer link back to home */}
      <div className="text-center py-8">
       <Link href="/" className="text-pink-600 hover:text-pink-500 font-medium">
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );

}

