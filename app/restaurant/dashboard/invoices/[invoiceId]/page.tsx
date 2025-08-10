"use client";

import { useParams, useRouter } from "next/navigation";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

/**
 * GraphQL query to fetch a single invoice by ID.  This query mirrors
 * the hotel implementation but is reused for restaurants.  We
 * retrieve invoice metadata, its line items and associated
 * reservation details.  The `reservation` field is optional and may
 * be null if the invoice was created without a reservation.
 */
const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      id
      date
      total
      items {
        description
        price
        quantity
        total
      }
      reservation {
        id
        customerInfo {
          name
        }
        checkIn
        checkOut
      }
    }
  }
`;

/**
 * GraphQL mutation to generate a PDF for an invoice.  The server
 * responds with a Base64 encoded string representing the PDF file.
 */
const GENERATE_INVOICE_PDF = gql`
  mutation GenerateInvoicePdf($id: ID!) {
    generateInvoicePdf(id: $id)
  }
`;

export default function RestaurantInvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  // Fetch invoice details
  const { data, loading, error } = useQuery(GET_INVOICE, {
    variables: { id: invoiceId },
  });
  const [generatePdf] = useMutation(GENERATE_INVOICE_PDF);

  // Handler to download the invoice PDF.  It calls the
  // `generateInvoicePdf` mutation and then triggers a file download in
  // the browser using a data URI.
  const handleDownload = async () => {
    try {
      const { data: pdfData } = await generatePdf({ variables: { id: invoiceId } });
      if (pdfData && pdfData.generateInvoicePdf) {
        const base64 = pdfData.generateInvoicePdf;
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${base64}`;
        link.download = `invoice-${invoiceId}.pdf`;
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to download invoice.");
    }
  };

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">Unable to load invoice details.</div>;
  }

  const invoice = data?.invoice;
  if (!invoice) {
    return <div className="p-6 text-red-600">Invoice not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoice {invoice.id}</h1>
          <p className="text-sm text-gray-600">Date: {new Date(invoice.date).toLocaleDateString()}</p>
          {invoice.reservation && (
            <p className="text-sm text-gray-600">Customer: {invoice.reservation.customerInfo?.name}</p>
          )}
          {invoice.reservation?.checkIn && invoice.reservation?.checkOut && (
            <p className="text-sm text-gray-600">
              Stay: {new Date(invoice.reservation.checkIn).toLocaleDateString()} – {new Date(invoice.reservation.checkOut).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={handleDownload}>Download</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{item.description}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <div className="text-xl font-semibold">Total: ${invoice.total.toFixed(2)}</div>
      </div>
    </div>
  );
}