"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { gql, useMutation } from '@apollo/client';
import { toast } from 'sonner';
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

  const [createReservation, { loading: reservationLoading }] = useMutation(CREATE_RESERVATION_V2, {
    onCompleted: () => {
      toast.success("Réservation confirmée avec succès !");
      router.push('/'); // Redirect to a success page or home
    },
    onError: (error) => {
      toast.error(`Échec: ${error.message}`);
      console.error(error);
    }
  });

  const [createPrivatisation, { loading: privatisationLoading }] = useMutation(CREATE_PRIVATISATION_V2, {
     onCompleted: () => {
      toast.success("Demande de privatisation envoyée !");
      router.push('/');
    },
    onError: (error) => {
      toast.error(`Échec: ${error.message}`);
      console.error(error);
    }
  });

  const handleConfirm = () => {
    if (!date || !heure || !personnes) {
        toast.error("Détails de réservation manquants.");
        return;
    }

    if (type === 'privatisation') {
      if (!typePrivatisation || !menuGroupe || !espace) {
        toast.error("Détails de privatisation manquants.");
        return;
      }
      createPrivatisation({
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
          }
        }
      });
    } else {
      createReservation({
        variables: {
          input: {
            restaurantId,
            date,
            heure,
            personnes: parseInt(personnes, 10),
            emplacement: emplacement || '',
            source: 'new-ui',
            customerInfo,
          }
        }
      });
    }
  };

  const isLoading = reservationLoading || privatisationLoading;

  const formattedDate = date ? moment(date).format("dddd, MMMM D") : "N/A";

  // Compute a rough price for the reservation based on the number of guests and the type.
  const numGuests = personnes ? parseInt(personnes, 10) : 0;
  const pricePerPerson = type === 'privatisation' ? 100 : 75;
  const totalPrice = numGuests * pricePerPerson;

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
            <p className="text-gray-800">${totalPrice.toFixed(2)}</p>
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
