"use client";

import { useState, useEffect } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
// Import pagination components to navigate through pages of invoices
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Currency helpers to format amounts according to hotel settings
import { formatCurrency, currencySymbols } from "@/lib/currency";

// Translation hook
import useTranslation from "@/hooks/useTranslation";
// Import toast from react-toastify.  This shim provides notifications for
// loading, success and error events in the invoices page.
import { toast } from "react-toastify";

/**
 * GraphQL queries and mutations for invoice management.
 */
// Query to fetch paginated invoices for a business.  Returns an
// InvoicePagination object containing a docs array and pagination
// metadata.  The optional page and limit arguments allow the client
// to request a specific page of results.  The server sorts invoices
// by creation date descending (latest first).
const GET_INVOICES = gql`
  query GetInvoices($businessId: ID!, $page: Int, $limit: Int) {
    invoices(businessId: $businessId, page: $page, limit: $limit) {
      docs {
        id
        reservationId
        date
        total
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

// Query to fetch reservations for invoice selection.  We request
// a large limit to ensure that enough reservations are available
// for invoice creation.  The server will return paginated
// reservations sorted by creation date descending.  Since we do not
// need pagination in the dropdown, we pass a high limit (e.g. 1000)
// via variables when executing this query.
const GET_RESERVATIONS = gql`
  query GetReservationsForInvoices($businessId: ID!, $businessType: String!, $page: Int, $limit: Int) {
    reservations(businessId: $businessId, businessType: $businessType, page: $page, limit: $limit) {
      docs {
        id
        customerInfo {
          name
        }
        checkIn
        checkOut
        totalAmount
      }
      totalPages
    }
  }
`;

const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: InvoiceInput!) {
    createInvoice(input: $input) {
      id
    }
  }
`;

// Query to fetch hotel settings including currency
const GET_HOTEL_SETTINGS = gql`
  query GetHotelSettings($id: ID!) {
    hotel(id: $id) {
      settings {
        currency
      }
    }
  }
`;

const GENERATE_INVOICE_PDF = gql`
  mutation GenerateInvoicePdf($id: ID!) {
    generateInvoicePdf(id: $id)
  }
`;

export default function HotelInvoicesPage() {
  const { t } = useTranslation();
  // Business context from the session.  We derive the current hotel id and
  // businessType by calling the /api/session endpoint.  Errors are
  // displayed if the user is not associated with a hotel.
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Pagination state for invoices.  currentPage is 1-indexed.  A
  // fixed number of invoices per page is specified by itemsPerPage.
  // Adjust itemsPerPage to display more or fewer rows per page.
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
          setBusinessType(data.businessType);
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

  // Fetch existing invoices for this hotel with pagination.  The page
  // and limit variables control which slice of results is returned.
  const {
    data: invoicesData,
    loading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery(GET_INVOICES, {
    variables: { businessId, page: currentPage, limit: itemsPerPage },
    skip: !businessId,
  });

  // Refetch invoices whenever the currentPage changes.  This ensures
  // that navigating through pagination updates the displayed
  // invoices.  We skip refetching when businessId is not yet set.
  useEffect(() => {
    if (!businessId) return;
    refetchInvoices({ businessId, page: currentPage, limit: itemsPerPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Fetch reservations to populate the invoice creation form
  const { data: reservationsData } = useQuery(GET_RESERVATIONS, {
    variables: { businessId, businessType, page: 1, limit: 1000 },
    skip: !businessId || !businessType,
  });

  // Fetch hotel settings to determine currency.  Skip until businessId is known.
  const { data: settingsData } = useQuery(GET_HOTEL_SETTINGS, {
    variables: { id: businessId },
    skip: !businessId,
  });
  const currency: string = settingsData?.hotel?.settings?.currency || 'USD';
  const currencySymbol: string = currencySymbols[currency] || '$';

  const [createInvoice] = useMutation(CREATE_INVOICE);
  const [generatePdf] = useMutation(GENERATE_INVOICE_PDF);

  // Form state for creating a new invoice.  We allow the operator to
  // select a reservation from a dropdown.  Additional items could be
  // added but for simplicity we generate a single line item based on
  // the reservation's totalAmount on the server.
  const [showForm, setShowForm] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string>("");

  // Show a loading toast while session or invoices are loading.  This effect
  // runs whenever the loading flags change and triggers a brief info
  // notification to inform the user that data is being fetched.
  useEffect(() => {
    if (sessionLoading || invoicesLoading) {
      toast.info({
        title: 'Loading...',
        description: t('pleaseWaitWhileWeLoadYourData') || 'Please wait while we load your data.',
        duration: 3000,
      });
    }
  }, [sessionLoading, invoicesLoading]);

  const handleCreateInvoice = async () => {
    if (!selectedReservationId || !businessId) return;
    // Find the reservation to extract its totalAmount.  If no
    // reservation is found we fallback to zero; the backend will
    // compute the total based on the provided items.
    const reservation = reservationsData?.reservations?.find((r: any) => r.id === selectedReservationId);
    const totalAmount = reservation?.totalAmount ?? 0;
    const input: any = {
      reservationId: selectedReservationId,
      businessId: businessId,
      items: [
        {
          description: `Reservation ${selectedReservationId}`,
          price: totalAmount,
          quantity: 1,
        },
      ],
      total: totalAmount,
    };
    try {
      await createInvoice({ variables: { input } });
      setShowForm(false);
      setSelectedReservationId("");
      await refetchInvoices({
        businessId,
        page: currentPage,
        limit: itemsPerPage,
      });
      // Notify the user that the invoice was created successfully
      toast.success(t("invoiceCreatedSuccess") || "Invoice created successfully");
    } catch (err) {
      console.error(err);
      toast.error(t("invoiceCreateFailed") || "Failed to create invoice");
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      const { data } = await generatePdf({ variables: { id: invoiceId } });
      if (data && data.generateInvoicePdf) {
        const pdfData = data.generateInvoicePdf;
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${pdfData}`;
        link.download = `invoice-${invoiceId}.pdf`;
        link.click();
      }
    } catch (err) {
      console.error(err);
      toast.error(t("failedDownloadInvoice") || "Failed to download invoice");
    }
  };

  if (sessionLoading || invoicesLoading) {
    return <div className="p-6">{t("loading")}</div>;
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>;
  }
  if (invoicesError) {
    return <div className="p-6 text-red-600">{t("failedLoadInvoices")}</div>;
  }

  // Extract the list of invoice documents from the paginated response.
  const invoices = invoicesData?.invoices?.docs ?? [];
  // Extract the reservation documents from the paginated response.
  const reservations = reservationsData?.reservations?.docs ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{t("invoices")}</h1>
        <Button onClick={() => setShowForm(true)}>{t("createInvoice")}</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("invoiceId")}</TableHead>
              <TableHead>{t("reservation")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv: any) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.id}</TableCell>
                <TableCell>{inv.reservation?.customerInfo?.name || inv.reservationId}</TableCell>
                <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">{formatCurrency(inv.total ?? 0, currency, currency)}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = `/hotel/dashboard/invoices/${inv.id}`)}
                  >
                    {t("view")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(inv.id)}>
                    {t("download")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls for invoices */}
      {invoicesData?.invoices?.totalPages > 1 && (
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
            {Array.from({ length: invoicesData.invoices.totalPages }, (_, idx) => idx + 1).map(
              (pageNum) => (
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
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const totalPages = invoicesData.invoices.totalPages;
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Dialog for creating an invoice */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("createInvoice")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reservation">{t("selectReservation")}</Label>
              <Select
                value={selectedReservationId}
                onValueChange={(value) => setSelectedReservationId(value)}
              >
                <SelectTrigger id="reservation">
                  <SelectValue placeholder={t("chooseReservation")} />
                </SelectTrigger>
                <SelectContent>
                  {reservations.map((res: any) => (
                    <SelectItem key={res.id} value={res.id}>
                      {res.customerInfo?.name || res.id} — {res.checkIn ? new Date(res.checkIn).toLocaleDateString() : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleCreateInvoice} disabled={!selectedReservationId}>
                {t("create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}