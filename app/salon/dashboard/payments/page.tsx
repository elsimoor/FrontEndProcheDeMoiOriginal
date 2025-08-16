"use client";

import { useState, useEffect } from "react";
// Import currency helpers to format and convert amounts
import { formatCurrency } from "@/lib/currency";
import { gql, useQuery } from "@apollo/client";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

/**
 * Payments page for the salon dashboard.
 *
 * Presents a list of all payment transactions for the current salon
 * business.  Payments include information about the reservation
 * associated with the payment along with amounts, currency and
 * status.  The session is queried from `/api/session` to derive the
 * salon's businessId and ensure the user is authorised to view
 * payments for this business.
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

export default function SalonPaymentsPage() {
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
        if (data.businessType && data.businessType.toLowerCase() === "salon" && data.businessId) {
          setBusinessId(data.businessId);
        } else {
          setSessionError("You are not associated with a salon business.");
        }
      } catch (err) {
        setSessionError("Failed to load session.");
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  // Query the salon settings to retrieve the default currency.  We will
  // convert incoming payment amounts into this currency when
  // displaying them.  Only the currency field is required here.
  const GET_SALON_SETTINGS = gql`
    query GetSalonSettings($id: ID!) {
      salon(id: $id) {
        id
        settings {
          currency
        }
      }
    }
  `;
  const { data: settingsData } = useQuery(GET_SALON_SETTINGS, {
    variables: { id: businessId },
    skip: !businessId,
  });
  const currency = settingsData?.salon?.settings?.currency || 'USD';

  const { data, loading, error } = useQuery(GET_PAYMENTS, {
    variables: { businessId },
    skip: !businessId,
  });

  if (sessionLoading || loading) {
    return <div className="p-6">Loading…</div>;
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">Failed to load payments.</div>;
  }

  const payments = data?.payments ?? [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reservation</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
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
                <TableCell>
                  {
                    /*
                     * Convert each payment amount into the salon’s selected currency.
                     * The amount is originally denominated in `payment.currency`.  By
                     * passing this as the base currency into `formatCurrency` we
                     * prevent double conversion and ensure the numeric value is
                     * scaled appropriately into the salon’s currency.
                     */
                  }
                  {formatCurrency(
                    payment.amount ?? 0,
                    currency,
                    payment.currency?.toUpperCase() || 'USD'
                  )}
                </TableCell>
                {/* Display the salon’s currency code for clarity */}
                <TableCell>{currency.toUpperCase()}</TableCell>
                <TableCell>{payment.paymentMethod || ""}</TableCell>
                <TableCell>{payment.status}</TableCell>
                <TableCell>{dateStr}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {payments.length === 0 && (
        <p className="text-gray-600">No payments found.</p>
      )}
    </div>
  );
}