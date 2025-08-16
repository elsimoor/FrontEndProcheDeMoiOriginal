"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { gql, useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import moment from 'moment';
import { RestaurantSubnav } from '../accueil/page';

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
    }
  }
`;

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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

  // Extract the currency from the settings.  Default to USD if not provided.
  const currency: string = settingsData?.restaurant?.settings?.currency || 'USD';

  const handleConfirm = async () => {
    // Validate required details before proceeding.  Missing values
    // should prevent the request and inform the user via a toast.
    if (!date || !heure || !personnes) {
      toast.error("Détails de réservation manquants.");
      return;
    }
    // When privatisation is selected, ensure all required
    // privatisation fields are present.
    if (type === 'privatisation' && (!typePrivatisation || !menuGroupe || !espace)) {
      toast.error("Détails de privatisation manquants.");
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
            },
          },
        });
        reservationId = res.data?.createReservationV2?.id;
      }
      if (!reservationId) {
        throw new Error('Échec de la création de la réservation');
      }
      // Once the reservation is created, initiate a Stripe checkout
      // session.  We compute success and cancellation URLs based on
      // the current origin so that Stripe redirects back to the
      // application.
      const origin = window.location.origin;
      const successUrl = `${origin}/payment/success`;
      const cancelUrl = `${origin}/payment/cancel`;
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
        throw new Error('Échec de l’initiation du paiement');
      }
    } catch (error: any) {
      // Display a friendly error message.  Use error.message if
      // available; otherwise fall back to a generic failure notice.
      toast.error(`Échec: ${error?.message ?? 'Une erreur est survenue'}`);
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
          <p className="text-sm font-medium text-[#B47C80]">Home / Restaurant / Reservation</p>
          <CardTitle className="text-4xl font-extrabold text-gray-800 tracking-tight mt-2">
            Confirm your reservation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-10">
          {/* Reservation details section */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Reservation Details</h3>
            <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-lg">
              <div className="space-y-1">
                <p className="font-semibold text-[#B47C80]">Date</p>
                <p className="text-gray-800">{formattedDate}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-[#B47C80]">Time</p>
                <p className="text-gray-800">{heure}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-[#B47C80]">Guests</p>
                <p className="text-gray-800">{personnes}</p>
              </div>
              {type === 'privatisation' ? (
                <>
                  <div className="space-y-1">
                    <p className="font-semibold text-[#B47C80]">Menu</p>
                    <p className="text-gray-800">{menuGroupe || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="font-semibold text-[#B47C80]">Espace</p>
                    <p className="text-gray-800">{espace || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <p className="font-semibold text-[#B47C80]">Emplacement</p>
                  <p className="text-gray-800">{emplacement || 'Aucun'}</p>
                </div>
              )}
              <div className="space-y-1 md:col-span-2">
                <p className="font-semibold text-[#B47C80]">Location</p>
                <p className="text-gray-800">123 Main Street, Anytown</p>
              </div>
            </div>
          </div>
      {/* Payment section */}
      <div className="border-t border-[#F2B8B6] pt-6 space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800">Payment</h3>
        <div className="grid grid-cols-2 gap-x-10 text-lg">
          <div>
            <p className="font-semibold text-[#B47C80]">Payment Method</p>
            <p className="text-gray-800">Credit Card ending in 1234</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#B47C80]">Total</p>
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
            {isLoading ? 'Confirmation en cours...' : 'Confirm Reservation'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <RestaurantSubnav title="Confirmation" restaurantId={useSearchParams().get('restaurantId') || ''} />
   
      <ConfirmationContent />
    </Suspense>
  )
}
