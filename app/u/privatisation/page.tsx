"use client";

"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from 'next/navigation';
import { gql, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { formatCurrency } from '@/lib/currency';
import { RestaurantSubnav } from "../accueil/page";

const GET_PRIVATISATION_OPTIONS = gql`
  query PrivatisationOptionsByRestaurant($restaurantId: ID!) {
    privatisationOptionsByRestaurant(restaurantId: $restaurantId) {
      id
      nom
      menusDeGroupe
      menusDetails {
        nom
        description
        prix
      }
      tarif
      conditions
    }
  }
`;

// Query to fetch the restaurant's currency setting.  We need this to
// format menu prices in the user's selected currency.  We request
// only the currency field to minimise payload size.
const GET_RESTAURANT_SETTINGS = gql`
  query RestaurantCurrency($id: ID!) {
    restaurant(id: $id) {
      settings {
        currency
      }
    }
  }
`;

function PrivatisationContent() {
  const [type, setType] = useState<"restaurant" | "menu" | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [menu, setMenu] = useState("");
  const [espace, setEspace] = useState("Salle entière"); // Default as per requirements

  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');

  const { loading, error, data } = useQuery(GET_PRIVATISATION_OPTIONS, {
    variables: { restaurantId },
    skip: !restaurantId,
    onError: (err) => {
      toast.error("Erreur lors du chargement des options.");
      console.error(err);
    }
  });

  // Fetch the restaurant currency for formatting menu prices.  Skip
  // until we know the restaurantId.  Default to USD if not set.
  const { data: settingsData } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  });
  const currency: string = settingsData?.restaurant?.settings?.currency || 'USD';

  const selectedOption = data?.privatisationOptionsByRestaurant.find(opt => opt.id === selectedOptionId);

  const isFormValid = type && selectedOptionId && menu && espace;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const params = new URLSearchParams({
      restaurantId: restaurantId,
      typePrivatisation: selectedOption.nom,
      menuGroupe: menu,
      espace,
      // Pass other required info for confirmation page
      personnes: "50", // Example value, this should be collected
      date: new Date().toISOString().split("T")[0], // Example
      heure: "19:00", // Example
    });

    router.push(`/u/confirmation?${params.toString()}&type=privatisation`);
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] flex items-start justify-center px-6 py-16">
      <div className="max-w-2xl w-full mx-auto">
        <Card className="border border-[#F2B8B6] rounded-3xl bg-white shadow-none">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-4xl font-extrabold text-gray-800 tracking-tight">
              Privatisation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Option selection */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Choisissez votre option</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    onClick={() => setType("restaurant")}
                    className={`flex-1 py-5 text-lg rounded-full border-2 ${
                      type === 'restaurant'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-transparent text-gray-700 border-[#F2B8B6] hover:bg-red-50'
                    }`}
                  >
                    Privatiser le restaurant
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setType("menu")}
                    className={`flex-1 py-5 text-lg rounded-full border-2 ${
                      type === 'menu'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-transparent text-gray-700 border-[#F2B8B6] hover:bg-red-50'
                    }`}
                  >
                    Réserver un menu à l’avance
                  </Button>
                </div>
              </div>

              {/* Privatisation details */}
              <div className="space-y-8">
                <h3 className="text-2xl font-semibold text-gray-800">Détails de la privatisation</h3>

                <Select onValueChange={setSelectedOptionId} value={selectedOptionId} required>
                  <SelectTrigger className="w-full p-6 text-lg rounded-xl border-2 border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder="Type de privatisation" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading && <SelectItem value="loading" disabled>Chargement...</SelectItem>}
                    {data?.privatisationOptionsByRestaurant?.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={setMenu} value={menu} disabled={!selectedOption} required>
                  <SelectTrigger className="w-full p-6 text-lg rounded-xl border-2 border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
                    <SelectValue placeholder="Menu du groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* If menusDetails exist, display them with price; otherwise fallback to menusDeGroupe */}
                    {selectedOption?.menusDetails && selectedOption.menusDetails.length > 0
                      ? selectedOption.menusDetails.map((menuDetail) => (
                          <SelectItem key={menuDetail.nom} value={menuDetail.nom}>
                            {/* Display menu name and its price converted into the restaurant's currency. */}
                            {menuDetail.nom}
                            {menuDetail.prix ? ` - ${formatCurrency(menuDetail.prix, currency)}` : ''}
                          </SelectItem>
                        ))
                      : selectedOption?.menusDeGroupe?.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={setEspace} value={espace} required>
                  <SelectTrigger className="w-full p-6 text-lg rounded-xl border-2 border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder="Choix de l'espace" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* If space management is not implemented, this is the only option */}
                    <SelectItem value="Salle entière">Salle entière</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={!isFormValid || loading}
                  size="lg"
                  className="rounded-full bg-red-500 hover:bg-red-600 text-white px-12 py-6 text-xl font-semibold shadow-none"
                >
                  Confirmer la réservation
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PrivatisationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
          <RestaurantSubnav title="Privatisation" restaurantId={useSearchParams().get('restaurantId') || ''} />
            <PrivatisationContent />
        </Suspense>
    )
}
