"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import useTranslation from "@/hooks/useTranslation";
import { useLanguage } from "@/context/LanguageContext";
import { gql, useMutation } from '@apollo/client';
import { useEffect } from 'react';

// GraphQL mutation to cancel a reservation.  This removes the pending
// reservation and any invoice when a payment is aborted.
const CANCEL_RESERVATION = gql`
  mutation CancelReservation($id: ID!) {
    cancelReservation(id: $id)
  }
`;

/**
 * Cancellation page shown when a user aborts the payment on Stripe
 * or the checkout fails.  We inform the user that the payment was
 * cancelled and provide navigation to return to the previous page or
 * home.  The associated reservation remains in pending status in the
 * backend.
 */

export default function PaymentCancelPage() {
  const router = useRouter();
  // Translation hook and language context.  We use t() to look up
  // strings in the current locale and allow the user to switch languages.
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();

  // Read the reservationId from the query string.  When present we
  // cancel the reservation on mount to clean up any pending booking.
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId');

  const [cancelReservation] = useMutation(CANCEL_RESERVATION);
  useEffect(() => {
    if (reservationId) {
      cancelReservation({ variables: { id: reservationId } }).catch(() => {
        // Ignore errors; the reservation may already be deleted.
      });
    }
  }, [reservationId, cancelReservation]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => setLocale("en")}
          className={`text-sm font-medium ${locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"}`}
        >
          EN
        </button>
        <button
          onClick={() => setLocale("fr")}
          className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"}`}
        >
          FR
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-4">{t("paymentCancelled")}</h1>
      <p className="mb-8 text-gray-700 text-center max-w-lg">{t("paymentCancelledMsg")}</p>
      <Button onClick={() => router.push("/")}>{t("returnHome")}</Button>
    </div>
  );
}