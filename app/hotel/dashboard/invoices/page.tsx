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

/**
 * GraphQL queries and mutations for invoice management.
 */
const GET_INVOICES = gql`
  query GetInvoices($businessId: ID!) {
    invoices(businessId: $businessId) {
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
  }
`;

const GET_RESERVATIONS = gql`
  query GetReservationsForInvoices($businessId: ID!, $businessType: String!) {
    reservations(businessId: $businessId, businessType: $businessType) {
      id
      customerInfo {
        name
      }
      checkIn
      checkOut
      totalAmount
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

  // Fetch existing invoices for this hotel
  const {
    data: invoicesData,
    loading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery(GET_INVOICES, {
    variables: { businessId },
    skip: !businessId,
  });

  // Fetch reservations to populate the invoice creation form
  const { data: reservationsData } = useQuery(GET_RESERVATIONS, {
    variables: { businessId, businessType },
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
      await refetchInvoices();
      alert(t("invoiceCreatedSuccess"));
    } catch (err) {
      console.error(err);
      alert(t("invoiceCreateFailed"));
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
      alert(t("failedDownloadInvoice"));
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

  const invoices = invoicesData?.invoices ?? [];
  const reservations = reservationsData?.reservations ?? [];

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
                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/hotel/dashboard/invoices/${inv.id}`}>{t("view")}</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(inv.id)}>{t("download")}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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