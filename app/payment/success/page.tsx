// "use client";

// import { useRouter, useSearchParams } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import useTranslation from "@/hooks/useTranslation";
// import { useLanguage } from "@/context/LanguageContext";
// import { gql, useMutation, useQuery } from '@apollo/client';
// import { useEffect } from 'react';

// // GraphQL mutation to confirm a reservation after payment success.  This
// // updates the reservation status to confirmed, marks the payment as
// // paid and generates an invoice.  Returns the reservation id on
// // completion.
// const CONFIRM_RESERVATION = gql`
//   mutation ConfirmReservation($id: ID!) {
//     confirmReservation(id: $id) {
//       id
//     }
//   }
// `;

// // Query to fetch reservation details so we can display a recap on
// // the success page.  We request basic fields including customer
// // info, dates and totalAmount.  Additional fields can be added as
// // needed.
// const GET_RESERVATION = gql`
//   query GetReservation($id: ID!) {
//     reservation(id: $id) {
//       id
//       businessType
//       status
//       totalAmount
//       customerInfo {
//         name
//         email
//         phone
//       }
//       checkIn
//       checkOut
//       guests
//       date
//       time
//       duration
//       notes
//     }
//   }
// `;

// // Mutation to generate a PDF summary of the reservation.  Returns
// // a base64‑encoded string which can be downloaded as a PDF file.
// const GENERATE_RESERVATION_PDF = gql`
//   mutation GenerateReservationPdf($id: ID!) {
//     generateReservationPdf(id: $id)
//   }
// `;

// /**
//  * Generic success page displayed after a user completes a payment on
//  * Stripe.  The Stripe checkout is configured to redirect here upon
//  * success.  We display a thank you message and a button to return
//  * home or to the appropriate module.  In a real application you
//  * might verify the session_id query parameter via an API call to
//  * confirm the payment, but because the backend webhook updates the
//  * payment status we do not perform any additional checks here.
//  */

// export default function PaymentSuccessPage() {
//   const router = useRouter();
//   // Translation hook and language context.  Use t() to resolve keys
//   // into the current language and provide a language toggle.
//   const { t } = useTranslation();
//   const { locale, setLocale } = useLanguage();

//   // Read the reservationId from the query string.  Stripe will
//   // redirect to this page with reservationId as a parameter.  We
//   // confirm the reservation on load when this id is present.
//   const searchParams = useSearchParams();
//   const reservationId = searchParams.get('reservationId');

//   const [confirmReservation] = useMutation(CONFIRM_RESERVATION);
//   // Fetch reservation details when reservationId is present.  Skip
//   // the query entirely until we know the id to avoid an error.  We
//   // also expose a refetch function so we can refresh the data after
//   // confirming the reservation.
//   const { data: reservationData, refetch: refetchReservation } = useQuery(GET_RESERVATION, {
//     variables: { id: reservationId ?? '' },
//     skip: !reservationId,
//   });
//   // Mutation for generating a reservation PDF.  We call this on
//   // demand from the download button below.
//   const [generatePdf] = useMutation(GENERATE_RESERVATION_PDF);

//   useEffect(() => {
//     // If we have a reservationId, call the confirmReservation
//     // mutation.  We ignore errors here because the payment webhook
//     // already updates the status server side; this call ensures the
//     // reservation is finalised for cases where the webhook is
//     // delayed or fails.  After confirming we do not redirect.
//     if (reservationId) {
//       confirmReservation({ variables: { id: reservationId } }).catch(() => {
//         // Silently ignore errors; the user is still shown a success message.
//       });
//       // Refresh the reservation details once the status has been updated
//       // so that the recap reflects the finalised booking.
//       refetchReservation();
//     }
//   }, [reservationId, confirmReservation, refetchReservation]);

//   return (
//     <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
//       {/* Language toggle */}
//       <div className="absolute top-4 right-4 flex space-x-2">
//         <button
//           onClick={() => setLocale("en")}
//           className={`text-sm font-medium ${locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"}`}
//         >
//           EN
//         </button>
//         <button
//           onClick={() => setLocale("fr")}
//           className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"}`}
//         >
//           FR
//         </button>
//       </div>
//       <h1 className="text-3xl font-bold mb-4">{t("paymentSuccessful")}</h1>
//       {/* If we have reservation details show a recap.  The summary
//           includes the customer info, dates and total amount. */}
//       {reservationData?.reservation && (
//         <div className="mb-8 w-full max-w-lg bg-white shadow rounded-lg p-4 text-left space-y-2">
//           <h2 className="text-xl font-semibold">Reservation Summary</h2>
//           <p><span className="font-medium">Name:</span> {reservationData.reservation.customerInfo?.name}</p>
//           <p><span className="font-medium">Email:</span> {reservationData.reservation.customerInfo?.email}</p>
//           {reservationData.reservation.businessType === 'hotel' ? (
//             <>
//               <p><span className="font-medium">Check‑in:</span> {reservationData.reservation.checkIn ? new Date(reservationData.reservation.checkIn).toLocaleDateString() : '-'}</p>
//               <p><span className="font-medium">Check‑out:</span> {reservationData.reservation.checkOut ? new Date(reservationData.reservation.checkOut).toLocaleDateString() : '-'}</p>
//               <p><span className="font-medium">Guests:</span> {reservationData.reservation.guests ?? '-'}</p>
//             </>
//           ) : (
//             <>
//               <p><span className="font-medium">Date:</span> {reservationData.reservation.date ? new Date(reservationData.reservation.date).toLocaleDateString() : '-'}</p>
//               {reservationData.reservation.time && <p><span className="font-medium">Time:</span> {reservationData.reservation.time}</p>}
//               {reservationData.reservation.duration && <p><span className="font-medium">Duration:</span> {reservationData.reservation.duration} minutes</p>}
//             </>
//           )}
//           {typeof reservationData.reservation.totalAmount === 'number' && (
//             <p><span className="font-medium">Total:</span> {reservationData.reservation.totalAmount.toFixed(2)} MAD</p>
//           )}
//           {reservationData.reservation.notes && (
//             <p><span className="font-medium">Notes:</span> {reservationData.reservation.notes}</p>
//           )}
//           {/* Download PDF button */}
//           <button
//             onClick={async () => {
//               if (!reservationId) return;
//               try {
//                 const pdfRes = await generatePdf({ variables: { id: reservationId } });
//                 const base64 = pdfRes.data?.generateReservationPdf;
//                 if (base64) {
//                   // Convert base64 to binary and create a blob for download
//                   const binary = atob(base64);
//                   const len = binary.length;
//                   const bytes = new Uint8Array(len);
//                   for (let i = 0; i < len; i++) {
//                     bytes[i] = binary.charCodeAt(i);
//                   }
//                   const blob = new Blob([bytes], { type: 'application/pdf' });
//                   const url = window.URL.createObjectURL(blob);
//                   const link = document.createElement('a');
//                   link.href = url;
//                   link.download = `reservation_${reservationId}.pdf`;
//                   document.body.appendChild(link);
//                   link.click();
//                   document.body.removeChild(link);
//                   window.URL.revokeObjectURL(url);
//                 }
//               } catch (err) {
//                 console.error(err);
//               }
//             }}
//             className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             Download PDF
//           </button>
//         </div>
//       )}
//       <p className="mb-8 text-gray-700 text-center max-w-lg">{t("paymentSuccessfulMsg")}</p>
//       <Button onClick={() => router.push("/")}>{t("returnHome")}</Button>
//     </div>
//   );
// }


// test1




"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"
import { gql, useMutation, useQuery } from "@apollo/client"
import { useEffect } from "react"
import { CheckCircle, Download, Calendar, Clock, Users, FileText, Mail, User } from "lucide-react"
// Import currency helpers to format the total amount correctly
import { formatCurrency, currencySymbols } from '@/lib/currency'

// GraphQL mutation to confirm a reservation after payment success.  This
// updates the reservation status to confirmed, marks the payment as
// paid and generates an invoice.  Returns the reservation id on
// completion.
const CONFIRM_RESERVATION = gql`
  mutation ConfirmReservation($id: ID!) {
    confirmReservation(id: $id) {
      id
    }
  }
`

// Query to fetch reservation details so we can display a recap on
// the success page.  We request basic fields including customer
// info, dates and totalAmount.  Additional fields can be added as
// needed.
const GET_RESERVATION = gql`
  query GetReservation($id: ID!) {
    reservation(id: $id) {
      id
      businessType
      status
      totalAmount
      currency
      customerInfo {
        name
        email
        phone
      }
      checkIn
      checkOut
      guests
      date
      time
      duration
      notes
    }
  }
`

// Mutation to generate a PDF summary of the reservation.  Returns
// a base64‑encoded string which can be downloaded as a PDF file.
const GENERATE_RESERVATION_PDF = gql`
  mutation GenerateReservationPdf($id: ID!) {
    generateReservationPdf(id: $id)
  }
`

/**
 * Generic success page displayed after a user completes a payment on
 * Stripe.  The Stripe checkout is configured to redirect here upon
 * success.  We display a thank you message and a button to return
 * home or to the appropriate module.  In a real application you
 * might verify the session_id query parameter via an API call to
 * confirm the payment, but because the backend webhook updates the
 * payment status we do not perform any additional checks here.
 */

export default function PaymentSuccessPage() {
  const router = useRouter()
  // Translation hook and language context.  Use t() to resolve keys
  // into the current language and provide a language toggle.
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()

  // Read the reservationId from the query string.  Stripe will
  // redirect to this page with reservationId as a parameter.  We
  // confirm the reservation on load when this id is present.
  const searchParams = useSearchParams()
  const reservationId = searchParams.get("reservationId")

  const [confirmReservation] = useMutation(CONFIRM_RESERVATION)
  // Fetch reservation details when reservationId is present.  Skip
  // the query entirely until we know the id to avoid an error.  We
  // also expose a refetch function so we can refresh the data after
  // confirming the reservation.
  const { data: reservationData, refetch: refetchReservation } = useQuery(GET_RESERVATION, {
    variables: { id: reservationId ?? "" },
    skip: !reservationId,
  })
  // Mutation for generating a reservation PDF.  We call this on
  // demand from the download button below.
  const [generatePdf] = useMutation(GENERATE_RESERVATION_PDF)

  useEffect(() => {
    // If we have a reservationId, call the confirmReservation
    // mutation.  We ignore errors here because the payment webhook
    // already updates the status server side; this call ensures the
    // reservation is finalised for cases where the webhook is
    // delayed or fails.  After confirming we do not redirect.
    if (reservationId) {
      confirmReservation({ variables: { id: reservationId } }).catch(() => {
        // Silently ignore errors; the user is still shown a success message.
      })
      // Refresh the reservation details once the status has been updated
      // so that the recap reflects the finalised booking.
      refetchReservation()
    }
  }, [reservationId, confirmReservation, refetchReservation])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="absolute top-6 right-6 flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm border border-gray-200">
        <button
          onClick={() => setLocale("en")}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
            locale === "en" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLocale("fr")}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
            locale === "fr" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          FR
        </button>
      </div>

      <div className="text-center mb-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6 animate-in zoom-in-50 duration-500 delay-200">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">{t("paymentSuccessful")}</h1>
        <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mx-auto"></div>
      </div>

      {reservationData?.reservation && (
        <div className="mb-8 w-full max-w-2xl bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-300">
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("reservationSummary")}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("nameLabel")}</p>
                  <p className="font-medium text-gray-900">{reservationData.reservation.customerInfo?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("emailLabel")}</p>
                  <p className="font-medium text-gray-900">{reservationData.reservation.customerInfo?.email}</p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="border-t pt-4">
              {reservationData.reservation.businessType === "hotel" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("checkInLabel")}</p>
                      <p className="font-medium text-gray-900">
                        {reservationData.reservation.checkIn
                          ? new Date(reservationData.reservation.checkIn).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("checkOutLabel")}</p>
                      <p className="font-medium text-gray-900">
                        {reservationData.reservation.checkOut
                          ? new Date(reservationData.reservation.checkOut).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("guestsLabelGeneral")}</p>
                      <p className="font-medium text-gray-900">{reservationData.reservation.guests ?? "-"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t("dateLabelGeneral")}</p>
                      <p className="font-medium text-gray-900">
                        {reservationData.reservation.date
                          ? new Date(reservationData.reservation.date).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {reservationData.reservation.time && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium text-gray-900">{reservationData.reservation.time}</p>
                      </div>
                    </div>
                  )}

                  {reservationData.reservation.duration && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900">{reservationData.reservation.duration} minutes</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total Amount */}
            {typeof reservationData.reservation.totalAmount === "number" && (
              <div className="border-t pt-4">
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-gray-700">{t("totalAmountLabel")}</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {
                        (() => {
                          // Display the amount using the currency derived from the reservation.
                          // The backend resolver provides the currency code directly (e.g. "MAD" or "USD").
                          // We avoid any conversion by passing the same code as both the target and base.
                          const cur = reservationData.reservation.currency || 'USD'
                          return formatCurrency(
                            reservationData.reservation.totalAmount ?? 0,
                            cur,
                            cur
                          )
                        })()
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {reservationData.reservation.notes && (
              <div className="border-t pt-4">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 mb-1">{t("notesLabel")}</p>
                  <p className="text-amber-700">{reservationData.reservation.notes}</p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <button
                onClick={async () => {
                  if (!reservationId) return
                  try {
                    const pdfRes = await generatePdf({ variables: { id: reservationId } })
                    const base64 = pdfRes.data?.generateReservationPdf
                    if (base64) {
                      // Convert base64 to binary and create a blob for download
                      const binary = atob(base64)
                      const len = binary.length
                      const bytes = new Uint8Array(len)
                      for (let i = 0; i < len; i++) {
                        bytes[i] = binary.charCodeAt(i)
                      }
                      const blob = new Blob([bytes], { type: "application/pdf" })
                      const url = window.URL.createObjectURL(blob)
                      const link = document.createElement("a")
                      link.href = url
                      link.download = `reservation_${reservationId}.pdf`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      window.URL.revokeObjectURL(url)
                    }
                  } catch (err) {
                    console.error(err)
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Download className="w-4 h-4" />
                {t("downloadPdf")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-500">
        <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">{t("paymentSuccessfulMsg")}</p>
      </div>

      <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-700">
        <Button
          onClick={() => router.push("/")}
          className="px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
        >
          {t("returnHome")}
        </Button>
      </div>
    </div>
  )
}
