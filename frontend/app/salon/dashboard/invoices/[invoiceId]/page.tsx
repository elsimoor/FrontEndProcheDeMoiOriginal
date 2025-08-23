"use client";

import { useParams, useRouter } from "next/navigation";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useState, useEffect } from "react";
// Import currency helpers
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import useTranslation from "@/hooks/useTranslation";

/**
 * Query to fetch invoice details by ID for salons.  It retrieves
 * invoice items and reservation details to display.  The same
 * `invoice` query used by hotels and restaurants works here as well
 * because invoices are generic across business types.
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
        date
      }
    }
  }
`;

/**
 * Mutation to generate the PDF for a given invoice.  The server
 * returns a Base64 encoded string representing the PDF.  We then
 * trigger a browser download using a data URI.
 */
const GENERATE_INVOICE_PDF = gql`
  mutation GenerateInvoicePdf($id: ID!) {
    generateInvoicePdf(id: $id)
  }
`;

export default function SalonInvoiceDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  // Load invoice details
  const { data, loading, error } = useQuery(GET_INVOICE, {
    variables: { id: invoiceId },
  });
  const [generatePdf] = useMutation(GENERATE_INVOICE_PDF);

  /**
   * Handler to download the invoice as a PDF.  It calls the
   * `generateInvoicePdf` mutation and then uses the resulting
   * Base64 string to create a downloadable link.  If an error
   * occurs we inform the user.
   */
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
      alert(t('failedDownloadInvoice'));
    }
  };

  if (loading) {
    return <div className="p-6">{t('loading')}</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{t('unableToLoadInvoice')}</div>;
  }

  const invoice = data?.invoice;
  if (!invoice) {
    return <div className="p-6 text-red-600">{t('invoiceNotFound')}</div>;
  }

  // Fetch the current salon's currency via session and settings.  We
  // determine the businessId from the session endpoint and then
  // retrieve the settings via GraphQL.  This allows us to format
  // invoice amounts into the salon's chosen currency.
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

  // Display session loading and error states after invoice has been loaded
  if (sessionLoading) {
    return <div className="p-6">{t('loading')}</div>;
  }
  if (sessionError) {
    return (
      <div className="p-6 text-red-600">
        {sessionError.toLowerCase().includes('not associated')
          ? t('notAssociatedWithSalon')
          : t('failedToLoadSession')}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('invoice')} {invoice.id}
          </h1>
          <p className="text-sm text-gray-600">
            {t('invoiceDate')}: {new Date(invoice.date).toLocaleDateString()}
          </p>
          {invoice.reservation && (
            <p className="text-sm text-gray-600">
              {t('customer')}: {invoice.reservation.customerInfo?.name}
            </p>
          )}
          {/* For salons the reservation may use a single date or a checkIn/out pair.  We display whichever is available. */}
          {invoice.reservation?.checkIn && invoice.reservation?.checkOut ? (
            <p className="text-sm text-gray-600">
              {t('stay')}: {new Date(invoice.reservation.checkIn).toLocaleDateString()} – {new Date(invoice.reservation.checkOut).toLocaleDateString()}
            </p>
          ) : invoice.reservation?.date ? (
            <p className="text-sm text-gray-600">
              {t('invoiceDate')}: {new Date(invoice.reservation.date).toLocaleDateString()}
            </p>
          ) : null}
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            {t('back')}
          </Button>
          <Button onClick={handleDownload}>{t('download')}</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('description')}</TableHead>
              <TableHead>{t('priceLabel')}</TableHead>
              <TableHead>{t('quantity')}</TableHead>
              <TableHead className="text-right">{t('total')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{item.description}</TableCell>
                <TableCell>{formatCurrency(item.price ?? 0, currency)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.total ?? 0, currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <div className="text-xl font-semibold">
          {t('total')}: {formatCurrency(invoice.total ?? 0, currency)}
        </div>
      </div>
    </div>
  );
}