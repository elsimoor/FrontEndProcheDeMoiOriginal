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
// Pagination components for navigating through pages of payments
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

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

// Query to fetch paginated payments for a business.  Returns a
// PaymentPagination object with a docs array and pagination
// metadata.  The optional page and limit arguments allow clients to
// request specific pages.  Payments are sorted by newest first.
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
      limit
      page
      totalPages
      hasPrevPage
      hasNextPage
      prevPage
      nextPage
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

  // Pagination state for payments.  currentPage is 1-indexed and
  // itemsPerPage controls how many payment rows are displayed per page.
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

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

  // Fetch payments once we have a businessId with pagination.  The
  // page and limit variables allow us to fetch a specific slice of
  // payment data.  Sorting is handled server‑side.
  const {
    data,
    loading,
    error,
    refetch: refetchPayments,
  } = useQuery(GET_PAYMENTS, {
    variables: { businessId, page: currentPage, limit: itemsPerPage },
    skip: !businessId,
  });

  // Refetch payments whenever the currentPage changes to ensure the
  // displayed data matches the selected page.  Skip when businessId is
  // not yet available.
  useEffect(() => {
    if (!businessId) return;
    refetchPayments({ businessId, page: currentPage, limit: itemsPerPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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

  // Extract the payment documents from the paginated response.  When
  // no payments are present the result is an empty array.
  const payments = data?.payments?.docs ?? [];

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

      {/* Pagination controls for payments */}
      {data?.payments?.totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
              />
            </PaginationItem>
            {Array.from({ length: data.payments.totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  isActive={pageNum === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    if (pageNum !== currentPage) {
                      setCurrentPage(pageNum);
                    }
                  }}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const totalPages = data.payments.totalPages;
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}