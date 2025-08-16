"use client"

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { gql, useMutation, useQuery } from "@apollo/client";
import { getBooking, clearBooking } from "../../../lib/booking";

// Helper to format amounts according to the hotel's selected currency
import { formatCurrency } from "@/lib/currency";
// Translation hooks
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"

/*
 * Checkout page
 *
 * Presents a summary of the user’s stay including dates, selected
 * room, extras and computed pricing.  The user can confirm the
 * reservation which will create a record on the backend via the
 * GraphQL API.  Upon completion the booking data is cleared and
 * the user is returned to the hotel landing page with a success
 * notification.
 */

const GET_ROOM = gql`
  query GetRoom($id: ID!) {
    room(id: $id) {
      id
      type
      price
      images
      hotelId {
        settings {
          currency
        }
      }
      # Include view options so we can determine the cost of the
      # selected view during checkout.  Each option provides its
      # name and optional price.  Additional fields such as
      # description or category are omitted here because they are
      # not needed for pricing.
      viewOptions {
        name
        price
      }
    }
  }
`;

const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationInput!) {
    createReservation(input: $input) {
      id
      status
    }
  }
`;

// GraphQL mutation to create a payment session via Stripe.  After a
// reservation is created we call this mutation to obtain a checkout
// session URL which the user will be redirected to for payment.
const CREATE_PAYMENT_SESSION = gql`
  mutation CreatePaymentSession($input: CreatePaymentSessionInput!) {
    createPaymentSession(input: $input) {
      sessionId
      url
    }
  }
`;

export default function CheckoutPage() {
  const router = useRouter();
  const booking = typeof window !== "undefined" ? getBooking() : {};

  useEffect(() => {
    // Ensure required data exists
    if (!booking.checkIn || !booking.checkOut || !booking.roomId) {
      router.replace("/hotel/search");
    }
  }, [booking, router]);

  const { data, loading, error } = useQuery(GET_ROOM, {
    variables: { id: booking.roomId || "" },
    skip: !booking.roomId,
  });

  const [createReservation, { loading: creating }] = useMutation(CREATE_RESERVATION);

  // Mutation hook for creating a Stripe checkout session.  This will
  // redirect the user to Stripe after the reservation is recorded.
  const [createPaymentSession] = useMutation(CREATE_PAYMENT_SESSION);

  // Compute nights and cost
  const nights = useMemo(() => {
    if (!booking.checkIn || !booking.checkOut) return 0;
    const inDate = new Date(booking.checkIn);
    const outDate = new Date(booking.checkOut);
    const diff = outDate.getTime() - inDate.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [booking.checkIn, booking.checkOut]);
  const room = data?.room;
  // Determine the currency from the hotel's settings.  Default to USD if not set.
  const currency: string = room?.hotelId?.settings?.currency || 'USD';

  console.log("currency:", currency);
  const basePrice = room ? room.price * nights : 0;
  // Selected extras (amenities) from the booking.  These are stored
  // as an array of amenity objects when present; default to empty
  // array otherwise.  The extras may include items like parking or
  // breakfast that were chosen on the room detail page.
  const extras = booking.extras || [];
  const extrasCost = extras.reduce((total: number, amenity: any) => total + (amenity.price || 0), 0);

  // Selected paid room options.  These are additional add‑ons such as
  // petals or champagne boxes that the guest chose.  Each option
  // includes a price which we sum to derive the paid options cost.
  const paidOptions = booking.paidOptions || [];
  const paidOptionsCost = paidOptions.reduce((sum: number, opt: any) => sum + (opt.price || 0), 0);

  // Determine the price of the selected view.  We look up the view
  // name stored on the booking in the room's viewOptions array to
  // retrieve the associated price.  When no view is selected or the
  // view has no price the cost defaults to zero.
  const selectedView: string | undefined = booking.view;
  const viewPrice = useMemo(() => {
    if (!selectedView || !room || !room.viewOptions) return 0;
    const match = room.viewOptions.find((v: any) => v.name === selectedView);
    return match && match.price ? match.price : 0;
  }, [selectedView, room]);

  // Simple tax estimate (€10/night) to match the mockup.  In a real
  // application this would be computed based on the hotel's tax rate.
  const tax = nights * 10;

  // Compute the total price including base room cost, extras, paid
  // options, view cost and taxes.
  const total = basePrice + extrasCost + paidOptionsCost + viewPrice + tax;

  // Translation context
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();

  const handleReserve = async () => {
    if (!room) return;
    try {
      // First create the reservation.  We await the result so we can
      // obtain the reservation ID for payment.  If the creation
      // succeeds we proceed to generate a payment session.
      const res = await createReservation({
        variables: {
          input: {
            businessId: booking.hotelId,
            businessType: "hotel",
            customerInfo: {
              name: "Guest",
              email: "guest@example.com",
              phone: "0000000000",
            },
            roomId: booking.roomId,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            guests: booking.guests || booking.adults + booking.children || 1,
            date: booking.checkIn,
            totalAmount: total,
            status: "pending",
            paymentStatus: "pending",
            notes: extras.map((amenity: any) => amenity.name).join(", "),
          },
        },
      });
      const reservationId = res.data?.createReservation?.id;
      if (!reservationId) {
        throw new Error("Failed to create reservation");
      }
      // After successfully creating the reservation, initiate the
      // payment session.  Compute success and cancel URLs based on
      // the current origin so that the user returns to our app after
      // completing or cancelling payment.
      const origin = window.location.origin;
      const successUrl = `${origin}/payment/success`;
      const cancelUrl = `${origin}/payment/cancel`;
      const { data: paymentData } = await createPaymentSession({
        variables: {
          input: {
            reservationId: reservationId,
            successUrl: successUrl,
            cancelUrl: cancelUrl,
          },
        },
      });
      const url = paymentData?.createPaymentSession?.url;
      clearBooking();
      if (url) {
        // Redirect the user to the Stripe hosted checkout page
        window.location.href = url;
      } else {
        alert("Failed to initiate payment session.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to create reservation");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-gray-900">{t("stayEase")}</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <a href="#" className="hover:text-blue-600 transition-colors">{t("explore")}</a>
            <a href="#" className="hover:text-blue-600 transition-colors">{t("wishlists")}</a>
            <a href="#" className="hover:text-blue-600 transition-colors">{t("trips")}</a>
            <a href="#" className="hover:text-blue-600 transition-colors">{t("messages")}</a>
          </nav>
          <div className="flex items-center space-x-4">
            {/* Language selector */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLocale("en")}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("fr")}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"
                }`}
              >
                FR
              </button>
            </div>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {t("signIn")}
            </a>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("bookYourStay")}</h1>
        {loading ? (
          <p>{t("loading")}</p>
        ) : error || !room ? (
          <p className="text-red-600">{t("unableToLoadReservation")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-2">{t("yourStay")}</h2>
              <p className="mb-4">
                {nights} {nights === 1 ? t("nightSingular") : t("nightsPlural")}
                <br />
                {new Date(booking.checkIn!).toLocaleDateString()} – {new Date(booking.checkOut!).toLocaleDateString()}
              </p>
              <h3 className="text-lg font-semibold mb-2">{t("roomLabel")}</h3>
              <p className="mb-4">
                {room.type}
                <br />
                {booking.guests || booking.adults + booking.children || 1} {t("guestsLabel")}
              </p>
              <h3 className="text-lg font-semibold mb-2">{t("options")}</h3>
              <div className="text-sm text-gray-700 space-y-1">
                {/* List selected extras (amenities) */}
                {extras && extras.length > 0 && (
                  <>
                    {extras.map((amenity: any) => (
                      <div key={amenity.name} className="flex justify-between">
                        <span>{amenity.name}</span>
                        <span>{formatCurrency(amenity.price || 0, currency)}</span>
                      </div>
                    ))}
                  </>
                )}
                {/* List selected paid room options */}
                {paidOptions && paidOptions.length > 0 && (
                  <>
                    {paidOptions.map((opt: any) => (
                      <div key={opt.name} className="flex justify-between">
                        <span>{opt.name}</span>
                        <span>{formatCurrency(opt.price || 0, currency)}</span>
                      </div>
                    ))}
                  </>
                )}
                {/* Display selected view if present */}
                {selectedView && (
                  <div className="flex justify-between">
                    <span>{selectedView}</span>
                    <span>
                      {viewPrice > 0 ? formatCurrency(viewPrice, currency) : t("included")}
                    </span>
                  </div>
                )}
                {/* If no options selected show a message */}
                {!extras.length && !paidOptions.length && !selectedView && (
                  <p>{t("noExtrasSelected")}</p>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2 mt-4">{t("priceLabelCheckout")}</h3>
              <div className="text-sm text-gray-700 space-y-1 border-t pt-2">
                <div className="flex justify-between">
                  <span>{t("basePriceLabel")}</span>
                  <span>{formatCurrency(basePrice, currency)}</span>
                </div>
                {/* Cost of selected amenities */}
                {extrasCost > 0 && (
                  <div className="flex justify-between">
                    <span>{t("extrasLabel")}</span>
                    <span>{formatCurrency(extrasCost, currency)}</span>
                  </div>
                )}
                {/* Cost of selected paid room options */}
                {paidOptionsCost > 0 && (
                  <div className="flex justify-between">
                    <span>{t("paidOptionsCostLabel")}</span>
                    <span>{formatCurrency(paidOptionsCost, currency)}</span>
                  </div>
                )}
                {/* Cost of selected view */}
                {viewPrice > 0 && (
                  <div className="flex justify-between">
                    <span>{t("viewLabel")}</span>
                    <span>{formatCurrency(viewPrice, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t("taxesFeesLabel")}</span>
                  <span>{formatCurrency(tax, currency)}</span>
                </div>
                <div className="flex justify-between font-semibold mt-2 border-t pt-2">
                  <span>{t("totalPriceLabel")}</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-start">
              {room.images && room.images.length > 0 ? (
                <img
                  src={room.images[0]}
                  alt={room.type}
                  className="w-full h-auto object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg" />
              )}
            </div>
          </div>
        )}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleReserve}
            className="bg-blue-600 text-white rounded-full px-6 py-3 font-medium hover:bg-blue-700"
            disabled={creating || !room}
          >
            {creating ? t("processing") : t("bookYourStay")}
          </button>
        </div>
      </main>
    </div>
  );
}