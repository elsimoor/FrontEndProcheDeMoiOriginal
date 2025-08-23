"use client";

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { gql, useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import moment from 'moment';
import { RestaurantSubnav } from '../accueil/page';
import useTranslation from "@/hooks/useTranslation";
// Import Select components for payment method selection
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

// Import Input component for collecting optional reservation file URL
import { Input } from '@/components/ui/input';

const CREATE_RESERVATION_V2 = gql`
  mutation CreateReservationV2($input: CreateReservationV2Input!) {
    createReservationV2(input: $input) {
      id
    }
  }
`;

const CREATE_PRIVATISATION_V2 = gql`
  mutation CreatePrivatisationV2($input: CreatePrivatisationV2Input!) {
    createPrivatisationV2(input: $input) {
      id
    }
  }
`;

// Mutation to initiate a Stripe checkout session.  The backend returns
// the session id and a URL to redirect the user to Stripe's hosted
// payment page.  The reservation id is provided by the previous
// reservation/privatisation mutation.
const CREATE_PAYMENT_SESSION = gql`
  mutation CreatePaymentSession($input: CreatePaymentSessionInput!) {
    createPaymentSession(input: $input) {
      sessionId
      url
    }
  }
`;

// Query to fetch the restaurant's settings.  We request both the horaires and the
// configured currency so that we can compute prices on the client and
// display them in the correct currency.
const GET_RESTAURANT_SETTINGS = gql`
  query RestaurantSettings($id: ID!) {
    restaurant(id: $id) {
      id
      settings {
        currency
        horaires {
          ouverture
          fermeture
          prix
        }
      }
      # Fetch the payment methods configured for this restaurant.
      # Each method includes its name, whether it is enabled and an
      # optional specialDate on which the method is valid (e.g. New
      # Year’s Eve).  If enabled is false or specialDate is set to a
      # different date the method should not be available to the user.
      paymentMethods {
        name
        enabled
        specialDate
      }
    }
  }
`;

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Translation hook
  const { t } = useTranslation();

  const restaurantId = searchParams.get('restaurantId');
  const customerInfo = { name: "Guest User", email: "guest@example.com", phone: "0000000000" };

  // Details from URL
  const type = searchParams.get('type') || 'standard';
  const date = searchParams.get('date');
  const heure = searchParams.get('heure');
  const personnes = searchParams.get('personnes');
  const emplacement = searchParams.get('emplacement');
  const typePrivatisation = searchParams.get('typePrivatisation');
  const menuGroupe = searchParams.get('menuGroupe');
  const espace = searchParams.get('espace');

  // Prepare the mutations without automatic completion callbacks.  We
  // explicitly handle success and error cases within the confirm
  // handler to coordinate payment creation.  Leaving out onCompleted
  // avoids unwanted redirects before the payment session is created.
  const [createReservation, { loading: reservationLoading }] = useMutation(CREATE_RESERVATION_V2);

  const [createPrivatisation, { loading: privatisationLoading }] = useMutation(CREATE_PRIVATISATION_V2);

  // Mutation to create a payment session via Stripe.  We will call
  // this after successfully creating the reservation/privatisation.
  const [createPaymentSession, { loading: paymentSessionLoading }] = useMutation(CREATE_PAYMENT_SESSION);

  // Fetch the restaurant settings to compute an accurate price per guest and to
  // determine the correct currency for display.  The query is skipped when no
  // restaurantId is available in the URL (e.g. on initial render).
  const { data: settingsData } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  });

  // Extract payment methods from restaurant settings.  The
  // `paymentMethods` field lives at the root of `restaurant`.  We
  // filter out disabled methods and those with a specialDate that
  // doesn’t match the chosen reservation date.  When no payment
  // methods are defined, an empty array will be returned.
  const availablePaymentMethods = useMemo(() => {
    const methods = settingsData?.restaurant?.paymentMethods ?? [];
    // Reservation date may not be defined (e.g. when form incomplete).  In
    // that case only methods without a specialDate will be shown.
    const resDateStr = date;
    return methods.filter((m: any) => {
      if (!m.enabled) return false;
      if (m.specialDate) {
        // Compare the special date (YYYY-MM-DD) to the reservation
        // date (which is provided as a YYYY-MM-DD string in the
        // search params).  Use moment to handle formatting.
        try {
          const special = moment(m.specialDate).format('YYYY-MM-DD');
          return resDateStr && special === resDateStr;
        } catch (err) {
          console.error('Failed to parse specialDate', err);
          return false;
        }
      }
      return true;
    });
  }, [settingsData, date]);

  // State to track the selected payment method.  Default to the first
  // available method when the list changes.
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  useEffect(() => {
    if (availablePaymentMethods && availablePaymentMethods.length > 0) {
      // If the previously selected payment method is still available, keep it
      const found = availablePaymentMethods.find((m: any) => m.name === paymentMethod);
      if (!found) {
        setPaymentMethod(availablePaymentMethods[0].name);
      }
    } else {
      setPaymentMethod('');
    }
    // We intentionally exclude paymentMethod from dependencies to avoid
    // resetting when the user changes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePaymentMethods]);

  // Optional URL for the reservation details file.  User can paste a link to a
  // document containing additional information or requirements.
  const [reservationFileUrlInput, setReservationFileUrlInput] = useState<string>('');

  // Extract the currency from the settings.  Default to USD if not provided.
  const currency: string = settingsData?.restaurant?.settings?.currency || 'USD';

  const handleConfirm = async () => {
    // Validate required details before proceeding.  Missing values
    // should prevent the request and inform the user via a toast.
    if (!date || !heure || !personnes) {
      toast.error(t("missingReservationDetails"));
      return;
    }
    // When privatisation is selected, ensure all required
    // privatisation fields are present.
    if (type === 'privatisation' && (!typePrivatisation || !menuGroupe || !espace)) {
      toast.error(t("missingPrivatisationDetails"));
      return;
    }
    try {
      let reservationId: string | undefined;
      // Construct the appropriate input based on the type of booking.  We
      // await the mutation so that we can use the returned id to
      // initiate the Stripe payment session.
      if (type === 'privatisation') {
        const res = await createPrivatisation({
          variables: {
            input: {
              restaurantId,
              date,
              heure,
              personnes: parseInt(personnes, 10),
              type: typePrivatisation,
              menu: menuGroupe,
              espace,
              dureeHeures: 4, // Example value, should be part of privatisation option
              source: 'new-ui',
              customerInfo,
              paymentMethod: paymentMethod || undefined,
              reservationFileUrl: reservationFileUrlInput || undefined,
            },
          },
        });
        reservationId = res.data?.createPrivatisationV2?.id;
      } else {
        const res = await createReservation({
          variables: {
            input: {
              restaurantId,
              date,
              heure,
              personnes: parseInt(personnes, 10),
              emplacement: emplacement || '',
              source: 'new-ui',
              customerInfo,
              paymentMethod: paymentMethod || undefined,
              reservationFileUrl: reservationFileUrlInput || undefined,
            },
          },
        });
        reservationId = res.data?.createReservationV2?.id;
      }
      if (!reservationId) {
        throw new Error(t("reservationCreationFailed"));
      }
      // Once the reservation is created, initiate a Stripe checkout
      // session.  We compute success and cancellation URLs based on
      // the current origin so that Stripe redirects back to the
      // application.
      const origin = window.location.origin;
      const successUrl = `${origin}/payment/success?reservationId=${reservationId}`;
      const cancelUrl = `${origin}/payment/cancel?reservationId=${reservationId}`;
      const paymentRes = await createPaymentSession({
        variables: {
          input: {
            reservationId,
            successUrl,
            cancelUrl,
          },
        },
      });
      const url = paymentRes.data?.createPaymentSession?.url;
      if (url) {
        // Redirect the user to the Stripe hosted checkout page.
        window.location.href = url;
      } else {
        throw new Error(t("paymentSessionFailed"));
      }
    } catch (error: any) {
      // Display a friendly error message.  Use error.message if
      // available; otherwise fall back to a generic failure notice.
      toast.error(`${error?.message ?? t('errorOccurred')}`);
      console.error(error);
    }
  };

  const isLoading = reservationLoading || privatisationLoading || paymentSessionLoading;

  const formattedDate = date ? moment(date).format("dddd, MMMM D") : "N/A";
  // Determine the number of guests.  If the parameter is missing or invalid, default to zero.
  const numGuests = personnes ? parseInt(personnes, 10) : 0;

  /**
   * Compute the price per person based on restaurant settings and reservation type.  When the
   * type is 'privatisation', a flat rate of 100 is used unless overridden by menu pricing
   * (not currently implemented).  For standard reservations, we examine the restaurant's
   * horaires to find a matching time range and use its `prix` value if it exists and is
   * positive.  Otherwise, we default to 75.  If no settings data is available or the
   * reservation time is missing, the default price is used.  This mirrors the logic on
   * the server side for computing `totalAmount` in createReservationV2.
   */
  const computePricePerPerson = (): number => {
    // Privatisation uses a higher baseline rate per guest
    if (type === 'privatisation') {
      return 100;
    }
    let defaultPrice = 75;
    const horaires = settingsData?.restaurant?.settings?.horaires || [];
    if (!heure || horaires.length === 0) {
      return defaultPrice;
    }
    // Convert a HH:mm string to minutes since midnight
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map((n) => parseInt(n, 10));
      return h * 60 + m;
    };
    const reservationTimeMinutes = toMinutes(heure);
    for (const h of horaires) {
      if (h.ouverture && h.fermeture) {
        const start = toMinutes(h.ouverture);
        const end = toMinutes(h.fermeture);
        // Determine if the reservation time falls within the current time range
        if (reservationTimeMinutes >= start && reservationTimeMinutes < end) {
          const p = h.prix;
          if (typeof p === 'number' && p > 0) {
            return p;
          }
          break;
        }
      }
    }
    return defaultPrice;
  };
  const pricePerPerson = computePricePerPerson();
  const totalPrice = numGuests * pricePerPerson;

  // Format the total price for display using the restaurant's currency.  We
  // treat the computed total as being in the base currency (USD) and convert
  // into the restaurant's currency.  If the conversion fails, the helper
  // falls back to appending the currency code.
  const formattedTotalPrice = formatCurrency(totalPrice, currency);

  return (
    <div className="min-h-screen bg-[#FFF5F5] flex items-start justify-center px-6 py-16">
      <Card className="w-full max-w-3xl border border-[#F2B8B6] rounded-3xl bg-white shadow-none">
        <CardHeader className="p-6 pb-4">
          <p className="text-sm font-medium text-[#B47C80]">{t("reservationBreadcrumb")}</p>
          <CardTitle className="text-4xl font-extrabold text-gray-800 tracking-tight mt-2">
            {t("confirmReservationTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-10">
          {/* Reservation details section */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">{t("reservationDetails")}</h3>
            <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-lg">
              <div className="space-y-1">
                <p className="font-semibold text-[#B47C80]">{t("dateLabel")}</p>
                <p className="text-gray-800">{formattedDate}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-[#B47C80]">{t("timeLabel")}</p>
                <p className="text-gray-800">{heure}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-[#B47C80]">{t("guestsLabel")}</p>
                <p className="text-gray-800">{personnes}</p>
              </div>
              {type === 'privatisation' ? (
                <>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#B47C80]">{t("menuLabel")}</p>
                    <p className="text-gray-800">{menuGroupe || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="font-semibold text-[#B47C80]">{t("spaceLabel")}</p>
                    <p className="text-gray-800">{espace || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold text-[#B47C80]">{t("seatLocationLabel")}</p>
                  <p className="text-gray-800">{emplacement || 'Aucun'}</p>
                </div>
              )}
              <div className="space-y-1 md:col-span-2">
                <p className="font-semibold text-[#B47C80]">{t("addressLabel")}</p>
                <p className="text-gray-800">123 Main Street, Anytown</p>
              </div>
            </div>
          </div>
      {/* Payment and extras section */}
      <div className="border-t border-[#F2B8B6] pt-6 space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">{t("paymentTitle")}</h3>
        <div className="grid grid-cols-2 gap-x-10 text-lg">
          {/* Left column: payment method selection and optional file URL */}
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-[#B47C80]">{t("paymentMethodLabel")}</p>
              {availablePaymentMethods && availablePaymentMethods.length > 0 ? (
                <Select onValueChange={setPaymentMethod} value={paymentMethod}>
                  <SelectTrigger className="w-full p-4 text-lg rounded-xl border-2 border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePaymentMethods.map((m: any) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-gray-800">No payment methods available</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-[#B47C80]">Reservation file URL (optional)</p>
              <Input
                type="text"
                value={reservationFileUrlInput}
                onChange={(e) => setReservationFileUrlInput(e.target.value)}
                placeholder="Paste link to reservation document"
                className="mt-2 p-4 text-lg rounded-xl border border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
              />
            </div>
          </div>
          {/* Right column: total price */}
          <div className="text-right space-y-1">
            <p className="font-semibold text-[#B47C80]">{t("totalLabel")}</p>
            <p className="text-gray-800">{formattedTotalPrice}</p>
          </div>
        </div>
      </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full rounded-full bg-red-500 hover:bg-red-600 text-white py-6 text-lg font-semibold shadow-none"
          >
            {isLoading ? t('confirmationInProgress') : t('confirmReservation')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <RestaurantSubnav title={t("confirmReservationTitle")} restaurantId={searchParams.get('restaurantId') || ''} />
      <ConfirmationContent />
    </Suspense>
  )
}
