"use client";

import { useState, useEffect } from "react";
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

// Currency helpers to format amounts according to the hotel's selected currency
import { formatCurrency, currencySymbols } from "@/lib/currency";

// Translation hook
import useTranslation from "@/hooks/useTranslation";

// GraphQL query to fetch the hotel's settings (namely the currency) for the current business
const GET_HOTEL_SETTINGS = gql`
  query GetHotelSettings($id: ID!) {
    hotel(id: $id) {
      settings {
        currency
      }
    }
  }
`;

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

const GENERATE_INVOICE_PDF = gql`
  mutation GenerateInvoicePdf($id: ID!) {
    generateInvoicePdf(id: $id)
  }
`;

export default function InvoiceDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  const { data, loading, error } = useQuery(GET_INVOICE, {
    variables: { id: invoiceId },
  });
  const [generatePdf] = useMutation(GENERATE_INVOICE_PDF);

  // Determine the current hotel id from the session.  The invoice page
  // itself does not carry business context, so we call /api/session to
  // retrieve the associated hotel.  If no hotel is found the
  // component continues to use USD as a fallback currency.
  const [hotelId, setHotelId] = useState<string | null>(null);
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
          setHotelId(data.businessId);
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

  // Fetch the hotel currency once the hotelId is known.  We skip
  // execution until the session has loaded and the hotelId is set.
  const { data: settingsData } = useQuery(GET_HOTEL_SETTINGS, {
    variables: { id: hotelId },
    skip: !hotelId,
  });
  const currency: string = settingsData?.hotel?.settings?.currency || 'USD';
  const currencySymbol: string = currencySymbols[currency] || currency;

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
      alert(t("failedDownloadInvoice"));
    }
  };

  // Show loading or error states.  We also block rendering until the
  // session has loaded so that currency can be determined before
  // amounts are formatted.  If there is a session error we display
  // it below, otherwise we fall back to USD.
  if (loading || sessionLoading) {
    return <div className="p-6">{t("loading")}</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{t("unableToLoadInvoice")}</div>;
  }
  if (sessionError) {
    // We still render the invoice details but amounts will default to USD
    console.warn(sessionError);
  }
  const invoice = data?.invoice;
  if (!invoice) {
    return <div className="p-6 text-red-600">{t("invoiceNotFound")}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t("invoice")} {invoice.id}</h1>
          <p className="text-sm text-gray-600">{t("date")}: {new Date(invoice.date).toLocaleDateString()}</p>
          {invoice.reservation && (
            <p className="text-sm text-gray-600">{t("customer")}: {invoice.reservation.customerInfo?.name}</p>
          )}
          {invoice.reservation?.checkIn && invoice.reservation?.checkOut && (
            <p className="text-sm text-gray-600">
              {t("stay")}: {new Date(invoice.reservation.checkIn).toLocaleDateString()} – {new Date(invoice.reservation.checkOut).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>{t("back")}</Button>
          <Button onClick={handleDownload}>{t("download")}</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("description")}</TableHead>
              <TableHead>{t("priceLabel")}</TableHead>
              <TableHead>{t("quantity")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{item.description}</TableCell>
                <TableCell>{formatCurrency(item.price ?? 0, currency, currency)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.total ?? 0, currency, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <div className="text-xl font-semibold">{t("total")}: {formatCurrency(invoice.total ?? 0, currency, currency)}</div>
      </div>
    </div>
  );
}