"use client";

import { useState, useEffect } from "react";
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
 * Payments page for the restaurant dashboard.
 *
 * Lists all payment transactions associated with the current
 * restaurant business.  Uses the same GraphQL query as the hotel
 * version but filters by the restaurant's businessId.  The session
 * endpoint is used to derive the active business context.
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

export default function RestaurantPaymentsPage() {
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
        if (data.businessType && data.businessType.toLowerCase() === "restaurant" && data.businessId) {
          setBusinessId(data.businessId);
        } else {
          setSessionError("You are not associated with a restaurant business.");
        }
      } catch (err) {
        setSessionError("Failed to load session.");
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

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
                  {payment.amount.toFixed(2)} {payment.currency?.toUpperCase()}
                </TableCell>
                <TableCell>{payment.currency?.toUpperCase()}</TableCell>
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