"use client"

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { gql, useMutation, useQuery } from "@apollo/client";
import { getBooking, clearBooking } from "../../../lib/booking";

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
  const basePrice = room ? room.price * nights : 0;
  const extras = booking.extras || [];
  const extrasCost = extras.reduce((total: number, amenity: any) => total + amenity.price, 0);
  const tax = nights * 10; // simple tax estimate (€10/night) to match mockup
  const total = basePrice + extrasCost + tax;

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
              <span className="font-bold text-2xl text-gray-900">StayEase</span>
            </div>
            <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
              <a href="#" className="hover:text-blue-600 transition-colors">Explore</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Wishlists</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Trips</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Messages</a>
            </nav>
            <div className="flex items-center space-x-4">
              <a href="/login" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                Log in
              </a>
            </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Réserver votre séjour
        </h1>
        {loading ? (
          <p>Loading…</p>
        ) : error || !room ? (
          <p className="text-red-600">Unable to load reservation.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-2">Votre séjour</h2>
              <p className="mb-4">
                {nights} night{nights > 1 ? "s" : ""} <br />
                {new Date(booking.checkIn!).toLocaleDateString()} – {new Date(booking.checkOut!).toLocaleDateString()}
              </p>
              <h3 className="text-lg font-semibold mb-2">Chambre</h3>
              <p className="mb-4">
                {room.type} <br />
                {booking.guests || booking.adults + booking.children || 1} guest{(booking.guests || booking.adults + booking.children || 1) > 1 ? "s" : ""}
              </p>
              <h3 className="text-lg font-semibold mb-2">Options</h3>
              <div className="text-sm text-gray-700 space-y-1">
                {extras.length > 0 ? (
                  extras.map((amenity: any) => (
                    <div key={amenity.name} className="flex justify-between">
                      <span>{amenity.name}</span>
                      <span>${amenity.price.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p>No extras selected</p>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2 mt-4">Price</h3>
              <div className="text-sm text-gray-700 space-y-1 border-t pt-2">
                <div className="flex justify-between">
                  <span>Base price</span>
                  <span>${basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Extras</span>
                  <span>${extrasCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & fees</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold mt-2 border-t pt-2">
                  <span>Total price</span>
                  <span>${total.toFixed(2)}</span>
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
            {creating ? "Processing…" : "Réserver"}
          </button>
        </div>
      </main>
    </div>
  );
}