"use client";

import { useState, useEffect } from "react";
// Import currency helpers
import { formatCurrency } from "@/lib/currency";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Translation hook for localising strings
import useTranslation from "@/hooks/useTranslation";
// Import toast to display success and error notifications for invoice operations
import { toast } from "react-toastify";

/**
 * GraphQL query to list invoices for a given salon business.  It
 * retrieves invoice metadata along with the associated reservation and
 * customer name for display in the table.
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

/**
 * Query to fetch reservations for creating invoices.  It includes
 * customer info, optional check-in/out dates and a generic date
 * field for appointments, plus the totalAmount.  The `businessType`
 * variable ensures we are pulling reservations only for salons.
 */
const GET_RESERVATIONS = gql`
  query GetSalonReservationsForInvoices($businessId: ID!, $businessType: String!) {
    reservations(businessId: $businessId, businessType: $businessType) {
      id
      customerInfo {
        name
      }
      checkIn
      checkOut
      date
      totalAmount
    }
  }
`;

/**
 * Mutation to create a new invoice.  Takes an `InvoiceInput` which
 * includes reservationId, businessId and line items.  The backend
 * computes totals as needed.
 */
const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: InvoiceInput!) {
    createInvoice(input: $input) {
      id
    }
  }
`;

/**
 * Mutation to generate a PDF for a given invoice.  Returns a Base64
 * string that can be turned into a downloadable PDF file.
 */
const GENERATE_INVOICE_PDF = gql`
  mutation GenerateInvoicePdf($id: ID!) {
    generateInvoicePdf(id: $id)
  }
`;

export default function SalonInvoicesPage() {
  // Translation function
  const { t } = useTranslation();
  // Session context.  We fetch the user's session to determine the
  // current salon's ID and verify the user belongs to a salon.  If
  // they are not associated with a salon, we display an error.
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
        if (data.businessType && data.businessType.toLowerCase() === "salon" && data.businessId) {
          setBusinessId(data.businessId);
          setBusinessType(data.businessType);
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

  // GraphQL query to fetch the salon settings (currency).  We only need the
  // currency field to determine how to display monetary values throughout
  // the invoices page.
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

  // Fetch existing invoices for this salon
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

  const [createInvoice] = useMutation(CREATE_INVOICE);
  const [generatePdf] = useMutation(GENERATE_INVOICE_PDF);

  // State for managing the invoice creation dialog
  const [showForm, setShowForm] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string>("");

  /**
   * Handler invoked when the user clicks the Create button in the
   * invoice form.  We build an InvoiceInput object based on the
   * selected reservation, using its totalAmount as the line item
   * price and quantity 1.  After creation we refetch invoices.
   */
  const handleCreateInvoice = async () => {
    if (!selectedReservationId || !businessId) return;
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
      // Show a success toast after creating the invoice
      toast.success(t("invoiceCreatedSuccess") || "Invoice created successfully");
    } catch (err) {
      console.error(err);
      toast.error(t("invoiceCreateFailed") || "Failed to create invoice");
    }
  };

  /**
   * Handler to download an invoice PDF.  It calls the generate
   * mutation and triggers a browser download.  On failure it
   * notifies the user.
   */
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
      // Use a toast to inform the user if the download fails
      toast.error(t("failedDownloadInvoice") || "Failed to download invoice");
    }
  };

  if (sessionLoading || invoicesLoading) {
    return <div className="p-6">{t("loadingInvoices")}</div>;
  }
  if (sessionError) {
    return (
      <div className="p-6 text-red-600">
        {sessionError.includes('not associated') ? t('notAssociatedWithSalon') : t('failedToLoadSession')}
      </div>
    );
  }
  if (invoicesError) {
    return <div className="p-6 text-red-600">{t("errorLoadingInvoices")}</div>;
  }

  const invoices = invoicesData?.invoices ?? [];
  const reservations = reservationsData?.reservations ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{t("invoicesTitle")}</h1>
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
              <TableHead>{t("actionsLabel")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv: any) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.id}</TableCell>
                <TableCell>{inv.reservation?.customerInfo?.name || inv.reservationId}</TableCell>
                <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">{formatCurrency(inv.total ?? 0, currency)}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = `/salon/dashboard/invoices/${inv.id}`)}
                  >
                    {t("view")}
                  </Button>
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
              <Select value={selectedReservationId} onValueChange={(value) => setSelectedReservationId(value)}>
              <SelectTrigger id="reservation">
                  <SelectValue placeholder={t("chooseReservation")} />
                </SelectTrigger>
                <SelectContent>
                  {reservations.map((res: any) => (
                    <SelectItem key={res.id} value={res.id}>
                      {res.customerInfo?.name || res.id} —
                      {res.checkIn
                        ? new Date(res.checkIn).toLocaleDateString()
                        : res.date
                        ? new Date(res.date).toLocaleDateString()
                        : ""}
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