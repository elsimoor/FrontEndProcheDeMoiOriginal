"use client";

import { useState, useEffect } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { formatCurrency } from '@/lib/currency';
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

// GraphQL queries and mutations for restaurant invoices
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
  query GetRestaurantReservationsForInvoices($businessId: ID!, $businessType: String!) {
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

const GENERATE_INVOICE_PDF = gql`
  mutation GenerateInvoicePdf($id: ID!) {
    generateInvoicePdf(id: $id)
  }
`;

// Query to fetch restaurant settings including currency.  Used to
// determine which currency to display invoice totals in on this
// dashboard page.
const GET_RESTAURANT_SETTINGS = gql`
  query GetRestaurantSettings($id: ID!) {
    restaurant(id: $id) {
      settings {
        currency
      }
    }
  }
`;

export default function RestaurantInvoicesPage() {
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
        if (data.businessType && data.businessType.toLowerCase() === "restaurant" && data.businessId) {
          setBusinessId(data.businessId);
          setBusinessType(data.businessType);
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

  // Fetch restaurant settings for currency once the business id is known.
  const { data: settingsData } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: businessId },
    skip: !businessId,
  });
  const currency: string = settingsData?.restaurant?.settings?.currency || 'USD';

  const {
    data: invoicesData,
    loading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery(GET_INVOICES, {
    variables: { businessId },
    skip: !businessId,
  });

  const { data: reservationsData } = useQuery(GET_RESERVATIONS, {
    variables: { businessId, businessType },
    skip: !businessId || !businessType,
  });

  const [createInvoice] = useMutation(CREATE_INVOICE);
  const [generatePdf] = useMutation(GENERATE_INVOICE_PDF);

  const [showForm, setShowForm] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string>("");

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
      alert("Invoice created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create invoice.");
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
      alert("Failed to download invoice.");
    }
  };

  if (sessionLoading || invoicesLoading) {
    return <div className="p-6">Loading…</div>;
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>;
  }
  if (invoicesError) {
    return <div className="p-6 text-red-600">Failed to load invoices.</div>;
  }

  const invoices = invoicesData?.invoices ?? [];
  const reservations = reservationsData?.reservations ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <Button onClick={() => setShowForm(true)}>Create Invoice</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Reservation</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv: any) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.id}</TableCell>
                <TableCell>{inv.reservation?.customerInfo?.name || inv.reservationId}</TableCell>
                <TableCell>{new Date(inv.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(inv.total ?? 0, currency)}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/restaurant/dashboard/invoices/${inv.id}`}>View</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(inv.id)}>Download</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reservation">Select Reservation</Label>
              <Select
                value={selectedReservationId}
                onValueChange={(value) => setSelectedReservationId(value)}
              >
                <SelectTrigger id="reservation">
                  <SelectValue placeholder="Choose reservation" />
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
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice} disabled={!selectedReservationId}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}