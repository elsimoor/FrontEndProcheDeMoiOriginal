"use client";

"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from 'next/navigation';
import { gql, useLazyQuery } from "@apollo/client";
import { toast } from "sonner";
import moment from "moment";
import { RestaurantSubnav } from "../accueil/page";

const GET_AVAILABILITY = gql`
  query Availability($restaurantId: ID!, $date: String!, $partySize: Int!) {
    availability(restaurantId: $restaurantId, date: $date, partySize: $partySize) {
      time
      available
    }
  }
`;

function ReserverContent() {
  const [personnes, setPersonnes] = useState(2);
  const [emplacement, setEmplacement] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [heure, setHeure] = useState("");
  const [availableSlots, setAvailableSlots] = useState<{time: string, available: boolean}[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');

  const [loadAvailability, { loading, error, data }] = useLazyQuery(GET_AVAILABILITY, {
    onCompleted: (data) => {
      setAvailableSlots(data.availability);
      if (data.availability.filter(s => s.available).length === 0) {
        toast.info("Aucun créneau disponible pour cette date ou ce nombre de personnes.");
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de la récupération des disponibilités.");
      console.error(error);
    }
  });

  useEffect(() => {
    if (date && personnes > 0 && restaurantId) {
      const formattedDate = moment(date).format("YYYY-MM-DD");
      loadAvailability({ variables: { restaurantId, date: formattedDate, partySize: personnes } });
    }
  }, [date, personnes, restaurantId, loadAvailability]);

  const isFormValid = date && heure && personnes > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const params = new URLSearchParams({
      restaurantId: restaurantId,
      date: date.toISOString().split("T")[0],
      heure,
      personnes: personnes.toString(),
      ...(emplacement && { emplacement }),
    });

    router.push(`/u/confirmation?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] px-6 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8">Réservez une table</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personnes & Emplacement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="personnes" className="text-lg font-medium text-gray-700">Nombre de personnes</Label>
              <Input
                id="personnes"
                type="number"
                value={personnes}
                onChange={(e) => setPersonnes(parseInt(e.target.value, 10) || 1)}
                min="1"
                max="20"
                required
                className="mt-2 p-4 text-lg rounded-xl border border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
              />
            </div>
            <div>
              <Label htmlFor="emplacement" className="text-lg font-medium text-gray-700">Endroit dans le restaurant</Label>
              <Input
                id="emplacement"
                type="text"
                value={emplacement}
                onChange={(e) => setEmplacement(e.target.value)}
                placeholder="Optionnel (ex: près de la fenêtre)"
                className="mt-2 p-4 text-lg rounded-xl border border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
              />
            </div>
          </div>
          {/* Time slots */}
          <div>
            <Label className="text-lg font-medium text-gray-700">Heure de la réservation</Label>
            <div className="flex flex-wrap gap-3 mt-3">
              {loading && <p>Chargement des créneaux...</p>}
              {error && <p className="text-red-500">Erreur de chargement.</p>}
              {/* When not loading or error, but no available slots are returned, show a friendly message. */}
              {!loading && !error && availableSlots.length === 0 && (
                <p className="text-gray-600">Aucun créneau disponible pour cette date.</p>
              )}
              {availableSlots.map((slot) => {
                const isSelected = heure === slot.time;
                return (
                  <Button
                    key={slot.time}
                    type="button"
                    onClick={() => setHeure(slot.time)}
                    disabled={!slot.available}
                    className={`rounded-full px-5 py-2 text-sm font-medium border ${
                      isSelected
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-gray-700 border-[#F2B8B6] hover:bg-red-50'
                    } ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {slot.time}
                  </Button>
                );
              })}
            </div>
          </div>
          {/* Calendar */}
          <div>
            <Label className="text-lg font-medium text-gray-700 mb-3 inline-block">Dates de la réservation</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
              className="p-0"
            />
          </div>
          {/* Submit button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              size="lg"
              className="rounded-full bg-red-500 hover:bg-red-600 text-white px-10 py-4 text-lg font-semibold shadow-none"
            >
              Réserver
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReserverPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
          <RestaurantSubnav title="Réserver une table" restaurantId={useSearchParams().get('restaurantId') || ''} />
            <ReserverContent />
        </Suspense>
    )
}
