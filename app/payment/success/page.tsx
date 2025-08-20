"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import useTranslation from "@/hooks/useTranslation";
import { useLanguage } from "@/context/LanguageContext";
import { gql, useMutation } from '@apollo/client';
import { useEffect } from 'react';

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
`;

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
  const router = useRouter();
  // Translation hook and language context.  Use t() to resolve keys
  // into the current language and provide a language toggle.
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();

  // Read the reservationId from the query string.  Stripe will
  // redirect to this page with reservationId as a parameter.  We
  // confirm the reservation on load when this id is present.
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId');

  const [confirmReservation] = useMutation(CONFIRM_RESERVATION);

  useEffect(() => {
    // If we have a reservationId, call the confirmReservation
    // mutation.  We ignore errors here because the payment webhook
    // already updates the status server side; this call ensures the
    // reservation is finalised for cases where the webhook is
    // delayed or fails.  After confirming we do not redirect.
    if (reservationId) {
      confirmReservation({ variables: { id: reservationId } }).catch(() => {
        // Silently ignore errors; the user is still shown a success message.
      });
    }
  }, [reservationId, confirmReservation]);

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
      <h1 className="text-3xl font-bold mb-4">{t("paymentSuccessful")}</h1>
      <p className="mb-8 text-gray-700 text-center max-w-lg">{t("paymentSuccessfulMsg")}</p>
      <Button onClick={() => router.push("/")}>{t("returnHome")}</Button>
    </div>
  );
}