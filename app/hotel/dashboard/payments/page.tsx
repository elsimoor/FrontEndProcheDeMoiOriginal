"use client";

import { useState, useEffect } from "react";
import useTranslation from "@/hooks/useTranslation"
import { gql, useQuery } from "@apollo/client";
// Import currency helper to format payment amounts consistently
import { formatCurrency } from "@/lib/currency";
// Importing useQuery twice is unnecessary; we will reuse useQuery for both payment
// and settings queries.

// Query to fetch hotel settings including the preferred currency.  We use this
// to convert payment amounts into the hotel's configured currency.  The
// settings are keyed off of the business ID returned from the session.
const GET_HOTEL_SETTINGS = gql`
  query GetHotelSettings($id: ID!) {
    hotel(id: $id) {
      settings {
        currency
      }
    }
  }
`;
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

/**
 * Payments page for the hotel dashboard.
 *
 * This view lists all payment transactions associated with the current
 * hotel business.  Payment information is retrieved via the
 * `payments` GraphQL query which returns completed and pending
 * payments.  The page first fetches the session via the
 * `/api/session` endpoint to determine the hotel businessId.  If the
 * user is not associated with a hotel or the session cannot be
 * retrieved, an error is displayed.
 */

const GET_PAYMENTS = gql`
  query GetPayments($businessId: ID!) {
    payments(businessId: $businessId) {
      id
      amount
      currency
      status
      paymentMethod
      createdAt
      reservationId
      reservation {
        id
        customerInfo {
          name
        }
      }
    }
  }
`;

export default function HotelPaymentsPage() {
  const { t } = useTranslation();
  // Business context from the session.  We derive the current hotel id
  // by calling the /api/session endpoint.  Errors are displayed if the
  // user is not associated with a hotel.
  const [businessId, setBusinessId] = useState<string | null>(null);
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
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setBusinessId(data.businessId);
        } else {
          setSessionError(t("notAssociatedWithHotel"));
        }
      } catch (err) {
        setSessionError(t("failedToLoadSession"));
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  // Fetch payments once we have a businessId
  const { data, loading, error } = useQuery(GET_PAYMENTS, {
    variables: { businessId },
    skip: !businessId,
  });

  // Fetch the hotel's currency once we know the businessId.  If the query
  // hasn't run yet or no currency is configured, default to USD.
  const { data: settingsData } = useQuery(GET_HOTEL_SETTINGS, {
    variables: { id: businessId },
    skip: !businessId,
  });
  const currency: string = settingsData?.hotel?.settings?.currency || 'USD';

  if (sessionLoading || loading) {
    return <div className="p-6">{t("loading")}</div>;
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{t("failedLoadPayments")}</div>;
  }

  const payments = data?.payments ?? [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("payments")}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("reservationColumn")}</TableHead>
            <TableHead>{t("customerColumn")}</TableHead>
            <TableHead>{t("amountColumn")}</TableHead>
            <TableHead>{t("currencyColumn")}</TableHead>
            <TableHead>{t("methodColumn")}</TableHead>
            <TableHead>{t("paymentStatus")}</TableHead>
            <TableHead>{t("dateColumn")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment: any) => {
            const reservationId = payment.reservationId;
            const customerName = payment.reservation?.customerInfo?.name || "N/A";
            const dateStr = new Date(payment.createdAt).toLocaleString();
            return (
              <TableRow key={payment.id}>
                <TableCell>{reservationId}</TableCell>
                <TableCell>{customerName}</TableCell>
                {/* Format the payment amount into the hotel's currency.  Payments may originate in a different
                 * currency (e.g. USD or MAD) depending on the Stripe configuration.  We convert the
                 * `payment.amount` from its reported `payment.currency` into the hotel's configured currency
                 * using our `formatCurrency` helper.  The baseCurrency parameter is set to the original
                 * payment currency to ensure the conversion is accurate.  The resulting amount will display
                 * the proper symbol for the hotel's currency (e.g. DH for MAD). */}
                <TableCell>
                  {formatCurrency(
                    payment.amount ?? 0,
                    currency,
                    payment.currency?.toUpperCase() || 'USD'
                  )}
                </TableCell>
                {/* Display the hotel's currency code for clarity */}
                <TableCell>{currency?.toUpperCase()}</TableCell>
                <TableCell>{payment.paymentMethod || ""}</TableCell>
                <TableCell>{t(payment.status.toLowerCase()) || payment.status}</TableCell>
                <TableCell>{dateStr}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {payments.length === 0 && (
        <p className="text-gray-600">{t("noPaymentsFound")}</p>
      )}
    </div>
  );
}