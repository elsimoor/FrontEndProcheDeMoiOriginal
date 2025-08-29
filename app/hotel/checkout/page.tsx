// "use client"

// import { useEffect, useMemo, useState } from "react";
// import { useRouter } from "next/navigation";
// import { gql, useMutation, useQuery } from "@apollo/client";
// import { getBooking, clearBooking } from "../../../lib/booking";

// // Helper to format amounts according to the hotel's selected currency
// import { formatCurrency } from "@/lib/currency";
// // Translation hooks
// import useTranslation from "@/hooks/useTranslation"
// import { useLanguage } from "@/context/LanguageContext"

// /*
//  * Checkout page
//  *
//  * Presents a summary of the user’s stay including dates, selected
//  * room, extras and computed pricing.  The user can confirm the
//  * reservation which will create a record on the backend via the
//  * GraphQL API.  Upon completion the booking data is cleared and
//  * the user is returned to the hotel landing page with a success
//  * notification.
//  */

// // Fetch a single room by id and include pricing sessions needed for
// // dynamic price calculations.  We include specialPrices and
// // monthlyPrices so the frontend can compute the correct total for
// // stays that fall within date‑specific or monthly promotional periods.
// const GET_ROOM = gql`
//   query GetRoom($id: ID!) {
//     room(id: $id) {
//       id
//       type
//       price
//       images
//       hotelId {
//         settings {
//           currency
//         }
//       }
//       # View options are fetched so we can determine the cost of the
//       # selected view during checkout.  Only name and price are needed
//       # here because descriptions/categories are not used in pricing.
//       viewOptions {
//         name
//         price
//       }
//       # Special date‑range pricing periods
//       specialPrices {
//         startMonth
//         startDay
//         endMonth
//         endDay
//         price
//       }
//       # Monthly pricing sessions
//       monthlyPrices {
//         startMonth
//         endMonth
//         price
//       }
//     }
//   }
// `;

// const CREATE_RESERVATION = gql`
//   mutation CreateReservation($input: ReservationInput!) {
//     createReservation(input: $input) {
//       id
//       status
//     }
//   }
// `;

// // GraphQL mutation to create a payment session via Stripe.  After a
// // reservation is created we call this mutation to obtain a checkout
// // session URL which the user will be redirected to for payment.
// const CREATE_PAYMENT_SESSION = gql`
//   mutation CreatePaymentSession($input: CreatePaymentSessionInput!) {
//     createPaymentSession(input: $input) {
//       sessionId
//       url
//     }
//   }
// `;

// export default function CheckoutPage() {
//   const router = useRouter();
//   const booking = typeof window !== "undefined" ? getBooking() : {};

//   useEffect(() => {
//     // Ensure required data exists
//     if (!booking.checkIn || !booking.checkOut || !booking.roomId) {
//       router.replace("/hotel/search");
//     }
//   }, [booking, router]);

//   const { data, loading, error } = useQuery(GET_ROOM, {
//     variables: { id: booking.roomId || "" },
//     skip: !booking.roomId,
//   });

//   const [createReservation, { loading: creating }] = useMutation(CREATE_RESERVATION);

//   // Mutation hook for creating a Stripe checkout session.  This will
//   // redirect the user to Stripe after the reservation is recorded.
//   const [createPaymentSession] = useMutation(CREATE_PAYMENT_SESSION);

//   // Guest information state.  This captures the name, email and phone
//   // number of the person making the reservation.  Without these
//   // details the reservation would default to a generic guest which
//   // prevents the business from contacting the customer.
//   const [guestInfo, setGuestInfo] = useState({
//     name: "",
//     email: "",
//     phone: "",
//   });

//   // Handle guest info changes
//   const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setGuestInfo((prev) => ({ ...prev, [name]: value }));
//   };

//   // Compute nights and cost
//   const nights = useMemo(() => {
//     if (!booking.checkIn || !booking.checkOut) return 0;
//     const inDate = new Date(booking.checkIn);
//     const outDate = new Date(booking.checkOut);
//     const diff = outDate.getTime() - inDate.getTime();
//     return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
//   }, [booking.checkIn, booking.checkOut]);
//   const room = data?.room;
//   // Determine the currency from the hotel's settings.  Default to USD if not set.
//   const currency: string = room?.hotelId?.settings?.currency || 'USD';

//   console.log("currency:", currency);
//   /**
//    * Calculate the total cost of a stay for a given room.  For each night,
//    * pricing follows a hierarchy: use a special price if the date falls
//    * within a special period; otherwise use a monthly pricing session if
//    * available; otherwise use the default price.  Handles date ranges
//    * crossing year boundaries.
//    */
//   function calculatePriceForStay(room: any, checkIn: string, checkOut: string): number {
//     if (!room || !checkIn || !checkOut) return 0;
//     const start = new Date(checkIn);
//     const end = new Date(checkOut);
//     let total = 0;
//     for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
//       const m = date.getMonth() + 1;
//       const d = date.getDate();
//       let nightly = room.price;
//       let appliedSpecial = false;
//       if (Array.isArray(room.specialPrices) && room.specialPrices.length > 0) {
//         const spSession = room.specialPrices.find((sp: any) => {
//           const { startMonth, startDay, endMonth, endDay } = sp;
//           if (startMonth < endMonth || (startMonth === endMonth && startDay <= endDay)) {
//             return (
//               (m > startMonth || (m === startMonth && d >= startDay)) &&
//               (m < endMonth || (m === endMonth && d <= endDay))
//             );
//           } else {
//             return (
//               (m > startMonth || (m === startMonth && d >= startDay)) ||
//               (m < endMonth || (m === endMonth && d <= endDay))
//             );
//           }
//         });
//         if (spSession) {
//           nightly = spSession.price;
//           appliedSpecial = true;
//         }
//       }
//       if (!appliedSpecial && Array.isArray(room.monthlyPrices) && room.monthlyPrices.length > 0) {
//         const mpSession = room.monthlyPrices.find((mp: any) => m >= mp.startMonth && m <= mp.endMonth);
//         if (mpSession) nightly = mpSession.price;
//       }
//       total += nightly;
//     }
//     return total;
//   }

//   // Compute the base price using dynamic pricing based on booking dates.
//   const basePrice = useMemo(() => {
//     if (!room || !booking.checkIn || !booking.checkOut) return 0;
//     return calculatePriceForStay(room, booking.checkIn, booking.checkOut);
//   }, [room, booking.checkIn, booking.checkOut]);
//   // Selected extras (amenities) from the booking.  These are stored
//   // as an array of amenity objects when present; default to empty
//   // array otherwise.  The extras may include items like parking or
//   // breakfast that were chosen on the room detail page.
//   const extras = booking.extras || [];
//   const extrasCost = extras.reduce((total: number, amenity: any) => total + (amenity.price || 0), 0);

//   // Selected paid room options.  These are additional add‑ons such as
//   // petals or champagne boxes that the guest chose.  Each option
//   // includes a price which we sum to derive the paid options cost.
//   const paidOptions = booking.paidOptions || [];
//   const paidOptionsCost = paidOptions.reduce((sum: number, opt: any) => sum + (opt.price || 0), 0);

//   // Determine the price of the selected view.  We look up the view
//   // name stored on the booking in the room's viewOptions array to
//   // retrieve the associated price.  When no view is selected or the
//   // view has no price the cost defaults to zero.
//   const selectedView: string | undefined = booking.view;
//   const viewPrice = useMemo(() => {
//     if (!selectedView || !room || !room.viewOptions) return 0;
//     const match = room.viewOptions.find((v: any) => v.name === selectedView);
//     return match && match.price ? match.price : 0;
//   }, [selectedView, room]);

//   // Simple tax estimate (€10/night) to match the mockup.  In a real
//   // application this would be computed based on the hotel's tax rate.
//   const tax = nights * 10;

//   // Compute the total price including base room cost, extras, paid
//   // options, view cost and taxes.
//   const total = basePrice + extrasCost + paidOptionsCost + viewPrice + tax;

//   // Translation context
//   const { t } = useTranslation();
//   const { locale, setLocale } = useLanguage();

//   const handleReserve = async () => {
//     if (!room) return;
//     // Basic validation: ensure guest information is provided
//     if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
//       alert("Please provide your name, email and phone number to complete the booking.");
//       return;
//     }
//     try {
//       // First create the reservation.  We await the result so we can
//       // obtain the reservation ID for payment.  If the creation
//       // succeeds we proceed to generate a payment session.
//       const res = await createReservation({
//         variables: {
//           input: {
//             businessId: booking.hotelId,
//             businessType: "hotel",
//             customerInfo: {
//               name: guestInfo.name,
//               email: guestInfo.email,
//               phone: guestInfo.phone,
//             },
//             roomId: booking.roomId,
//             checkIn: booking.checkIn,
//             checkOut: booking.checkOut,
//             guests: booking.guests || booking.adults + booking.children || 1,
//             date: booking.checkIn,
//             totalAmount: total,
//             status: "pending",
//             paymentStatus: "pending",
//             notes: extras.map((amenity: any) => amenity.name).join(", "),
//           },
//         },
//       });
//       const reservationId = res.data?.createReservation?.id;
//       if (!reservationId) {
//         throw new Error("Failed to create reservation");
//       }
//       // After successfully creating the reservation, initiate the
//       // payment session.  Compute success and cancel URLs based on
//       // the current origin so that the user returns to our app after
//       // completing or cancelling payment.  Append the reservationId
//       // to these URLs so that the payment pages can confirm or
//       // cancel the reservation appropriately.
//       const origin = window.location.origin;
//       const successUrl = `${origin}/payment/success?reservationId=${reservationId}`;
//       const cancelUrl = `${origin}/payment/cancel?reservationId=${reservationId}`;
//       const { data: paymentData } = await createPaymentSession({
//         variables: {
//           input: {
//             reservationId: reservationId,
//             successUrl: successUrl,
//             cancelUrl: cancelUrl,
//           },
//         },
//       });
//       const url = paymentData?.createPaymentSession?.url;
//       clearBooking();
//       if (url) {
//         // Redirect the user to the Stripe hosted checkout page
//         window.location.href = url;
//       } else {
//         alert("Failed to initiate payment session.");
//       }
//     } catch (e: any) {
//       console.error(e);
//       alert(e.message || "Failed to create reservation");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Header */}
//       <header className="sticky top-0 bg-white z-10 shadow-md">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
//           <div className="flex items-center space-x-2">
//             <span className="font-bold text-2xl text-gray-900">{t("stayEase")}</span>
//           </div>
//           <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
//             <a href="#" className="hover:text-blue-600 transition-colors">{t("explore")}</a>
//             <a href="#" className="hover:text-blue-600 transition-colors">{t("wishlists")}</a>
//             <a href="#" className="hover:text-blue-600 transition-colors">{t("trips")}</a>
//             <a href="#" className="hover:text-blue-600 transition-colors">{t("messages")}</a>
//           </nav>
//           <div className="flex items-center space-x-4">
//             {/* Language selector */}
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => setLocale("en")}
//                 className={`text-sm font-medium transition-colors hover:text-blue-600 ${
//                   locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"
//                 }`}
//               >
//                 EN
//               </button>
//               <button
//                 onClick={() => setLocale("fr")}
//                 className={`text-sm font-medium transition-colors hover:text-blue-600 ${
//                   locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"
//                 }`}
//               >
//                 FR
//               </button>
//             </div>
//             <a
//               href="/login"
//               className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
//             >
//               {t("signIn")}
//             </a>
//           </div>
//         </div>
//       </header>
//       <main className="max-w-4xl mx-auto px-4 py-12">
//         <h1 className="text-3xl font-bold text-gray-900 mb-6">{t("bookYourStay")}</h1>
//         {loading ? (
//           <p>{t("loading")}</p>
//         ) : error || !room ? (
//           <p className="text-red-600">{t("unableToLoadReservation")}</p>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             <div>
//               <h2 className="text-lg font-semibold mb-2">{t("yourStay")}</h2>
//               <p className="mb-4">
//                 {nights} {nights === 1 ? t("nightSingular") : t("nightsPlural")}
//                 <br />
//                 {new Date(booking.checkIn!).toLocaleDateString()} – {new Date(booking.checkOut!).toLocaleDateString()}
//               </p>
//               <h3 className="text-lg font-semibold mb-2">{t("roomLabel")}</h3>
//               <p className="mb-4">
//                 {room.type}
//                 <br />
//                 {booking.guests || booking.adults + booking.children || 1} {t("guestsLabel")}
//               </p>
//               <h3 className="text-lg font-semibold mb-2">{t("options")}</h3>
//               <div className="text-sm text-gray-700 space-y-1">
//                 {/* List selected extras (amenities) */}
//                 {extras && extras.length > 0 && (
//                   <>
//                     {extras.map((amenity: any) => (
//                       <div key={amenity.name} className="flex justify-between">
//                         <span>{amenity.name}</span>
//                         <span>{formatCurrency(amenity.price || 0, currency, currency)}</span>
//                       </div>
//                     ))}
//                   </>
//                 )}
//                 {/* List selected paid room options */}
//                 {paidOptions && paidOptions.length > 0 && (
//                   <>
//                     {paidOptions.map((opt: any) => (
//                       <div key={opt.name} className="flex justify-between">
//                         <span>{opt.name}</span>
//                         <span>{formatCurrency(opt.price || 0, currency, currency)}</span>
//                       </div>
//                     ))}
//                   </>
//                 )}
//                 {/* Display selected view if present */}
//                 {selectedView && (
//                   <div className="flex justify-between">
//                     <span>{selectedView}</span>
//                     <span>
//                       {viewPrice > 0 ? formatCurrency(viewPrice, currency, currency) : t("included")}
//                     </span>
//                   </div>
//                 )}
//                 {/* If no options selected show a message */}
//                 {!extras.length && !paidOptions.length && !selectedView && (
//                   <p>{t("noExtrasSelected")}</p>
//                 )}
//               </div>
//               <h3 className="text-lg font-semibold mb-2 mt-4">{t("priceLabelCheckout")}</h3>
//               <div className="text-sm text-gray-700 space-y-1 border-t pt-2">
//                 <div className="flex justify-between">
//                   <span>{t("basePriceLabel")}</span>
//                   <span>{formatCurrency(basePrice, currency, currency)}</span>
//                 </div>
//                 {/* Cost of selected amenities */}
//                 {extrasCost > 0 && (
//                   <div className="flex justify-between">
//                     <span>{t("extrasLabel")}</span>
//                     <span>{formatCurrency(extrasCost, currency, currency)}</span>
//                   </div>
//                 )}
//                 {/* Cost of selected paid room options */}
//                 {paidOptionsCost > 0 && (
//                   <div className="flex justify-between">
//                     <span>{t("paidOptionsCostLabel")}</span>
//                     <span>{formatCurrency(paidOptionsCost, currency, currency)}</span>
//                   </div>
//                 )}
//                 {/* Cost of selected view */}
//                 {viewPrice > 0 && (
//                   <div className="flex justify-between">
//                     <span>{t("viewLabel")}</span>
//                     <span>{formatCurrency(viewPrice, currency, currency)}</span>
//                   </div>
//                 )}
//                 <div className="flex justify-between">
//                   <span>{t("taxesFeesLabel")}</span>
//                   <span>{formatCurrency(tax, currency, currency)}</span>
//                 </div>
//                 <div className="flex justify-between font-semibold mt-2 border-t pt-2">
//                   <span>{t("totalPriceLabel")}</span>
//                   <span>{formatCurrency(total, currency, currency)}</span>
//                 </div>
//               </div>
//             </div>
//             {/* Guest Information Section */}
//             <div className="mt-8 bg-white rounded-lg shadow-md p-4 space-y-4">
//               <h3 className="text-lg font-semibold">Guest Information</h3>
//               <input
//                 type="text"
//                 name="name"
//                 placeholder="Full Name"
//                 value={guestInfo.name}
//                 onChange={handleGuestChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//               <input
//                 type="email"
//                 name="email"
//                 placeholder="Email Address"
//                 value={guestInfo.email}
//                 onChange={handleGuestChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//               <input
//                 type="tel"
//                 name="phone"
//                 placeholder="Phone Number"
//                 value={guestInfo.phone}
//                 onChange={handleGuestChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>
//             <div className="flex justify-center items-start">
//               {room.images && room.images.length > 0 ? (
//                 <img
//                   src={room.images[0]}
//                   alt={room.type}
//                   className="w-full h-auto object-cover rounded-lg"
//                 />
//               ) : (
//                 <div className="w-full h-64 bg-gray-200 rounded-lg" />
//               )}
//             </div>
//           </div>
//         )}
//         <div className="mt-8">
//           <button
//             type="button"
//             onClick={handleReserve}
//             className="bg-blue-600 text-white rounded-full px-6 py-3 font-medium hover:bg-blue-700"
//             disabled={creating || !room}
//           >
//             {creating ? t("processing") : t("bookYourStay")}
//           </button>
//         </div>
//       </main>
//     </div>
//   );
// }




// test1



"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { gql, useMutation, useQuery } from "@apollo/client"
import { getBooking, clearBooking } from "../../../lib/booking"

// Helper to format amounts according to the hotel's selected currency
import { formatCurrency } from "@/lib/currency"
// Translation hooks
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"

// Toast notifications for user feedback
import { toast } from "react-toastify"

/*
 * Checkout page
 *
 * Presents a summary of the user's stay including dates, selected
 * room, extras and computed pricing.  The user can confirm the
 * reservation which will create a record on the backend via the
 * GraphQL API.  Upon completion the booking data is cleared and
 * the user is returned to the hotel landing page with a success
 * notification.
 */

// Fetch a single room by id and include pricing sessions needed for
// dynamic price calculations.  We include specialPrices and
// monthlyPrices so the frontend can compute the correct total for
// stays that fall within date‑specific or monthly promotional periods.
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
      # View options are fetched so we can determine the cost of the
      # selected view during checkout.  Only name and price are needed
      # here because descriptions/categories are not used in pricing.
      viewOptions {
        name
        price
      }
      # Special date‑range pricing periods
      specialPrices {
        startMonth
        startDay
        endMonth
        endDay
        price
      }
      # Monthly pricing sessions
      monthlyPrices {
        startMonth
        endMonth
        price
      }
    }
  }
`

const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationInput!) {
    createReservation(input: $input) {
      id
      status
    }
  }
`

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
`

export default function CheckoutPage() {
  const router = useRouter()
  const booking = typeof window !== "undefined" ? getBooking() : {}

  useEffect(() => {
    // Ensure required data exists
    if (!booking.checkIn || !booking.checkOut || !booking.roomId) {
      router.replace("/hotel/search")
    }
  }, [booking, router])

  const { data, loading, error } = useQuery(GET_ROOM, {
    variables: { id: booking.roomId || "" },
    skip: !booking.roomId,
  })

  const [createReservation, { loading: creating }] = useMutation(CREATE_RESERVATION)

  // Mutation hook for creating a Stripe checkout session.  This will
  // redirect the user to Stripe after the reservation is recorded.
  const [createPaymentSession] = useMutation(CREATE_PAYMENT_SESSION)

  // Guest information state.  This captures the name, email and phone
  // number of the person making the reservation.  Without these
  // details the reservation would default to a generic guest which
  // prevents the business from contacting the customer.
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: "",
  })

  // Handle guest info changes
  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setGuestInfo((prev) => ({ ...prev, [name]: value }))
  }

  // Compute nights and cost
  const nights = useMemo(() => {
    if (!booking.checkIn || !booking.checkOut) return 0
    const inDate = new Date(booking.checkIn)
    const outDate = new Date(booking.checkOut)
    const diff = outDate.getTime() - inDate.getTime()
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [booking.checkIn, booking.checkOut])

  const room = data?.room
  // Determine the currency from the hotel's settings.  Default to USD if not set.
  const currency: string = room?.hotelId?.settings?.currency || "USD"

  console.log("currency:", currency)

  /**
   * Calculate the total cost of a stay for a given room.  For each night,
   * pricing follows a hierarchy: use a special price if the date falls
   * within a special period; otherwise use a monthly pricing session if
   * available; otherwise use the default price.  Handles date ranges
   * crossing year boundaries.
   */
  function calculatePriceForStay(room: any, checkIn: string, checkOut: string): number {
    if (!room || !checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    let total = 0
    for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
      const m = date.getMonth() + 1
      const d = date.getDate()
      let nightly = room.price
      let appliedSpecial = false
      if (Array.isArray(room.specialPrices) && room.specialPrices.length > 0) {
        const spSession = room.specialPrices.find((sp: any) => {
          const { startMonth, startDay, endMonth, endDay } = sp
          if (startMonth < endMonth || (startMonth === endMonth && startDay <= endDay)) {
            return (
              (m > startMonth || (m === startMonth && d >= startDay)) &&
              (m < endMonth || (m === endMonth && d <= endDay))
            )
          } else {
            return (
              m > startMonth || (m === startMonth && d >= startDay) || m < endMonth || (m === endMonth && d <= endDay)
            )
          }
        })
        if (spSession) {
          nightly = spSession.price
          appliedSpecial = true
        }
      }
      if (!appliedSpecial && Array.isArray(room.monthlyPrices) && room.monthlyPrices.length > 0) {
        const mpSession = room.monthlyPrices.find((mp: any) => m >= mp.startMonth && m <= mp.endMonth)
        if (mpSession) nightly = mpSession.price
      }
      total += nightly
    }
    return total
  }

  // Compute the base price using dynamic pricing based on booking dates.
  const basePrice = useMemo(() => {
    if (!room || !booking.checkIn || !booking.checkOut) return 0
    return calculatePriceForStay(room, booking.checkIn, booking.checkOut)
  }, [room, booking.checkIn, booking.checkOut])

  // Selected extras (amenities) from the booking.  These are stored
  // as an array of amenity objects when present; default to empty
  // array otherwise.  The extras may include items like parking or
  // breakfast that were chosen on the room detail page.
  const extras = booking.extras || []
  const extrasCost = extras.reduce((total: number, amenity: any) => total + (amenity.price || 0), 0)

  // Selected paid room options.  These are additional add‑ons such as
  // petals or champagne boxes that the guest chose.  Each option
  // includes a price which we sum to derive the paid options cost.
  const paidOptions = booking.paidOptions || []
  const paidOptionsCost = paidOptions.reduce((sum: number, opt: any) => sum + (opt.price || 0), 0)

  // Determine the price of the selected view.  We look up the view
  // name stored on the booking in the room's viewOptions array to
  // retrieve the associated price.  When no view is selected or the
  // view has no price the cost defaults to zero.
  const selectedView: string | undefined = booking.view
  const viewPrice = useMemo(() => {
    if (!selectedView || !room || !room.viewOptions) return 0
    const match = room.viewOptions.find((v: any) => v.name === selectedView)
    return match && match.price ? match.price : 0
  }, [selectedView, room])

  // Simple tax estimate (€10/night) to match the mockup.  In a real
  // application this would be computed based on the hotel's tax rate.
  const tax = nights * 10

  // Compute the total price including base room cost, extras, paid
  // options, view cost and taxes.
  const total = basePrice + extrasCost + paidOptionsCost + viewPrice + tax

  // Translation context
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()

  const handleReserve = async () => {
    if (!room) return
    // Basic validation: ensure guest information is provided
    if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      // Show an error toast when required fields are missing
      toast.error("Please provide your name, email and phone number to complete the booking.")
      return
    }
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
              name: guestInfo.name,
              email: guestInfo.email,
              phone: guestInfo.phone,
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
      })
      const reservationId = res.data?.createReservation?.id
      if (!reservationId) {
        throw new Error("Failed to create reservation")
      }
      // After successfully creating the reservation, initiate the
      // payment session.  Compute success and cancel URLs based on
      // the current origin so that the user returns to our app after
      // completing or cancelling payment.  Append the reservationId
      // to these URLs so that the payment pages can confirm or
      // cancel the reservation appropriately.
      const origin = window.location.origin
      const successUrl = `${origin}/payment/success?reservationId=${reservationId}`
      const cancelUrl = `${origin}/payment/cancel?reservationId=${reservationId}`
      const { data: paymentData } = await createPaymentSession({
        variables: {
          input: {
            reservationId: reservationId,
            successUrl: successUrl,
            cancelUrl: cancelUrl,
          },
        },
      })
      const url = paymentData?.createPaymentSession?.url
      clearBooking()
      if (url) {
        // Redirect the user to the Stripe hosted checkout page
        window.location.href = url
      } else {
        // Notify the user if the payment session could not be created
        toast.error("Failed to initiate payment session.")
      }
    } catch (e: any) {
      console.error(e)
      // Display an error toast when the reservation fails
      toast.error(e.message || "Failed to create reservation")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t("stayEase")}
            </span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600 transition-colors duration-200">
              {t("explore")}
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors duration-200">
              {t("wishlists")}
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors duration-200">
              {t("trips")}
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors duration-200">
              {t("messages")}
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            {/* Language selector */}
            <div className="flex items-center space-x-1 bg-slate-100 rounded-full p-1">
              <button
                onClick={() => setLocale("en")}
                className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 ${
                  locale === "en" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-blue-600"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("fr")}
                className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 ${
                  locale === "fr" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-blue-600"
                }`}
              >
                FR
              </button>
            </div>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
            >
              {t("signIn")}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{t("bookYourStay")}</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Complete your reservation details and secure your perfect stay
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-lg text-slate-600">{t("loading")}</span>
          </div>
        ) : error || !room ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠</span>
            </div>
            <p className="text-red-600 text-lg">{t("unableToLoadReservation")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Stay Details Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-lg">📅</span>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">{t("yourStay")}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-1">Duration</p>
                    <p className="font-semibold text-slate-900">
                      {nights} {nights === 1 ? t("nightSingular") : t("nightsPlural")}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-1">Dates</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(booking.checkIn!).toLocaleDateString()} –{" "}
                      {new Date(booking.checkOut!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Room Details Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 text-lg">🏨</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{t("roomLabel")}</h3>
                </div>
                <div className="flex items-start space-x-4">
                  {room.images && room.images.length > 0 ? (
                    <img
                      src={room.images[0] || "/placeholder.svg"}
                      alt={room.type}
                      className="w-24 h-24 object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center">
                      <span className="text-slate-400 text-2xl">🏨</span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">{room.type}</p>
                    <p className="text-slate-600">
                      {booking.guests || booking.adults + booking.children || 1} {t("guestsLabel")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Options Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 text-lg">⭐</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{t("options")}</h3>
                </div>
                <div className="space-y-3">
                  {/* List selected extras (amenities) */}
                  {extras && extras.length > 0 && (
                    <>
                      {extras.map((amenity: any) => (
                        <div
                          key={amenity.name}
                          className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0"
                        >
                          <span className="text-slate-700">{amenity.name}</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(amenity.price || 0, currency, currency)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  {/* List selected paid room options */}
                  {paidOptions && paidOptions.length > 0 && (
                    <>
                      {paidOptions.map((opt: any) => (
                        <div
                          key={opt.name}
                          className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0"
                        >
                          <span className="text-slate-700">{opt.name}</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(opt.price || 0, currency, currency)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Display selected view if present */}
                  {selectedView && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <span className="text-slate-700">{selectedView}</span>
                      <span className="font-semibold text-slate-900">
                        {viewPrice > 0 ? formatCurrency(viewPrice, currency, currency) : t("included")}
                      </span>
                    </div>
                  )}
                  {/* If no options selected show a message */}
                  {!extras.length && !paidOptions.length && !selectedView && (
                    <div className="text-center py-8">
                      <p className="text-slate-500">{t("noExtrasSelected")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Guest Information Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-orange-600 text-lg">👤</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Guest Information</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={guestInfo.name}
                      onChange={handleGuestChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={guestInfo.email}
                      onChange={handleGuestChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={guestInfo.phone}
                      onChange={handleGuestChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Summary Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-lg">💰</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{t("priceLabelCheckout")}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600">{t("basePriceLabel")}</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(basePrice, currency, currency)}
                    </span>
                  </div>
                  {/* Cost of selected amenities */}
                  {extrasCost > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">{t("extrasLabel")}</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(extrasCost, currency, currency)}
                      </span>
                    </div>
                  )}
                  {/* Cost of selected paid room options */}
                  {paidOptionsCost > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">{t("paidOptionsCostLabel")}</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(paidOptionsCost, currency, currency)}
                      </span>
                    </div>
                  )}
                  {/* Cost of selected view */}
                  {viewPrice > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">{t("viewLabel")}</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(viewPrice, currency, currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600">{t("taxesFeesLabel")}</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(tax, currency, currency)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-slate-900">{t("totalPriceLabel")}</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(total, currency, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReserve}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-6 py-4 font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={creating || !room}
              >
                {creating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    {t("processing")}
                  </div>
                ) : (
                  t("bookYourStay")
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
