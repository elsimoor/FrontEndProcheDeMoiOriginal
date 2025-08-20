"use client";

import { useParams, useRouter } from "next/navigation";
import React from 'react';
import useTranslation from "@/hooks/useTranslation"
import { gql, useQuery, useMutation } from "@apollo/client";
// Import currency helper to format prices consistently
import { formatCurrency, currencySymbols } from '@/lib/currency';
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

// Query to fetch restaurant settings (currency) by ID.  We use this
// to determine which currency to display invoice amounts in.  The
// restaurant ID is obtained from the session when this page is
// accessed via the dashboard.
const GET_RESTAURANT_SETTINGS = gql`
  query GetRestaurantSettings($id: ID!) {
    restaurant(id: $id) {
      settings {
        currency
      }
    }
  }
`;

export default function RestaurantInvoiceDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  // Fetch invoice details
  const { data, loading, error } = useQuery(GET_INVOICE, {
    variables: { id: invoiceId },
  });
  const [generatePdf] = useMutation(GENERATE_INVOICE_PDF);

  // Determine the current restaurant ID from the session.  We fetch
  // this via the /api/session endpoint, similar to other dashboard
  // pages.  Once known, we query the restaurant settings to obtain
  // the currency used by this restaurant.  Because this effect has
  // side effects (fetch), we place it within a useEffect hook below.
  const [restaurantId, setRestaurantId] = React.useState<string | null>(null);
  React.useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          if (data.businessType === 'restaurant' && data.businessId) {
            setRestaurantId(data.businessId);
          }
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
      }
    }
    fetchSession();
  }, []);

  // Fetch restaurant settings once we have the business id.  Skip
  // running this query until the id is known.  Default to USD when
  // currency isn't provided to ensure formatting still works.
  const { data: settingsData } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  });
  const currency: string = settingsData?.restaurant?.settings?.currency || 'USD';

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
      alert(t("downloadInvoiceFailed"));
    }
  };

  if (loading) {
    return <div className="p-6">{t("loading")}</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{t("unableToLoadInvoice")}</div>;
  }

  const invoice = data?.invoice;
  if (!invoice) {
    return <div className="p-6 text-red-600">{t("invoiceNotFound")}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("invoiceTitle")} {invoice.id}
          </h1>
          <p className="text-sm text-gray-600">
            {t("invoiceDate")}: {new Date(invoice.date).toLocaleDateString()}
          </p>
          {invoice.reservation && (
            <p className="text-sm text-gray-600">
              {t("customerLabelDetails")}: {invoice.reservation.customerInfo?.name}
            </p>
          )}
          {invoice.reservation?.checkIn && invoice.reservation?.checkOut && (
            <p className="text-sm text-gray-600">
              {t("stayLabel")}:{" "}
              {new Date(invoice.reservation.checkIn).toLocaleDateString()} – {new Date(invoice.reservation.checkOut).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            {t("backButton")}
          </Button>
          <Button onClick={handleDownload}>{t("downloadButton")}</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("descriptionColumn")}</TableHead>
              <TableHead>{t("priceColumn")}</TableHead>
              <TableHead>{t("quantityColumn")}</TableHead>
              <TableHead className="text-right">{t("totalLabel")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{item.description}</TableCell>
                {/* Format individual line prices.  The price stored on the invoice
                 * items is assumed to be in the base currency (USD).  We
                 * convert it into the restaurant's currency using
                 * formatCurrency. */}
                <TableCell>{formatCurrency(item.price ?? 0, currency)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                {/* Multiply quantity and price to show the total for the line.
                 * We use the stored total and convert it rather than
                 * recomputing here to avoid rounding discrepancies. */}
                <TableCell className="text-right">{formatCurrency(item.total ?? 0, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        {/* Display the invoice total in the restaurant's currency. */}
        <div className="text-xl font-semibold">
          {t("totalLabel")}: {formatCurrency(invoice.total ?? 0, currency)}
        </div>
      </div>
    </div>
  );
}