"use client";

import { useState, useEffect } from "react";
import useTranslation from "@/hooks/useTranslation";
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

// Query to fetch paginated payments for a salon business.  The
// backend returns a PaymentPagination object, so we request the docs
// array along with pagination metadata.  Pagination variables
// `page` and `limit` allow the backend to control the slice of
// payments returned.  Here we fetch all payments by specifying
// page=1 and a high limit (e.g., 1000) when invoking the query.
const GET_PAYMENTS = gql`
  query GetPayments($businessId: ID!, $page: Int, $limit: Int) {
    payments(businessId: $businessId, page: $page, limit: $limit) {
      docs {
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
      totalDocs
      totalPages
      page
      limit
      hasPrevPage
      hasNextPage
      prevPage
      nextPage
    }
  }
`;

export default function SalonPaymentsPage() {
  const { t } = useTranslation();
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
    // Request all payments with a large limit.  If client-side
    // pagination is added in the future, adjust page and limit
    // accordingly.
    variables: { businessId, page: 1, limit: 1000 },
    skip: !businessId,
  });

  if (sessionLoading || loading) {
    return <div className="p-6">{t('loading')}</div>;
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{t('failedLoadPayments')}</div>;
  }

  // Extract payment documents from the paginated response.  When
  // payments or docs is undefined, default to an empty array.
  const payments = data?.payments?.docs ?? [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('paymentsTitle')}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('reservationColumn')}</TableHead>
            <TableHead>{t('customerColumn')}</TableHead>
            <TableHead>{t('amountColumn')}</TableHead>
            <TableHead>{t('currencyColumn')}</TableHead>
            <TableHead>{t('methodColumn')}</TableHead>
            <TableHead>{t('statusLabelColumn')}</TableHead>
            <TableHead>{t('dateColumn')}</TableHead>
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
                <TableCell>{t(payment.status as any)}</TableCell>
                <TableCell>{dateStr}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {payments.length === 0 && (
        <p className="text-gray-600">{t('noPaymentsFound')}</p>
      )}
    </div>
  );
}