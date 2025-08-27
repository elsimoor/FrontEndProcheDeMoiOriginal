// "use client";

// "use client";

// import { useState, useEffect, Suspense } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useRouter, useSearchParams } from 'next/navigation';
// import { gql, useQuery } from "@apollo/client";
// import { toast } from "sonner";
// import { formatCurrency } from '@/lib/currency';
// import { RestaurantSubnav } from "../accueil/page";
// import useTranslation from "@/hooks/useTranslation";

// const GET_PRIVATISATION_OPTIONS = gql`
//   query PrivatisationOptionsByRestaurant($restaurantId: ID!) {
//     privatisationOptionsByRestaurant(restaurantId: $restaurantId) {
//       id
//       nom
//       menusDeGroupe
//       menusDetails {
//         nom
//         description
//         prix
//       }
//       tarif
//       conditions
//     }
//   }
// `;

// // Query to fetch the restaurant's currency setting.  We need this to
// // format menu prices in the user's selected currency.  We request
// // only the currency field to minimise payload size.
// const GET_RESTAURANT_SETTINGS = gql`
//   query RestaurantCurrency($id: ID!) {
//     restaurant(id: $id) {
//       settings {
//         currency
//       }
//     }
//   }
// `;

// function PrivatisationContent() {
//   const [type, setType] = useState<"restaurant" | "menu" | null>(null);
//   const [selectedOptionId, setSelectedOptionId] = useState("");
//   const [menu, setMenu] = useState("");
//   const [espace, setEspace] = useState("Salle entière"); // Default as per requirements

//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const restaurantId = searchParams.get('restaurantId');

//   const { t } = useTranslation();
//   const { loading, error, data } = useQuery(GET_PRIVATISATION_OPTIONS, {
//     variables: { restaurantId },
//     skip: !restaurantId,
//     onError: (err) => {
//       toast.error(t("errorLoadingOptions"));
//       console.error(err);
//     }
//   });

//   // Fetch the restaurant currency for formatting menu prices.  Skip
//   // until we know the restaurantId.  Default to USD if not set.
//   const { data: settingsData } = useQuery(GET_RESTAURANT_SETTINGS, {
//     variables: { id: restaurantId },
//     skip: !restaurantId,
//   });
//   const currency: string = settingsData?.restaurant?.settings?.currency || 'USD';

//   const selectedOption = data?.privatisationOptionsByRestaurant.find(opt => opt.id === selectedOptionId);

//   const isFormValid = type && selectedOptionId && menu && espace;

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!isFormValid) return;

//     const params = new URLSearchParams({
//       restaurantId: restaurantId,
//       typePrivatisation: selectedOption.nom,
//       menuGroupe: menu,
//       espace,
//       // Pass other required info for confirmation page
//       personnes: "50", // Example value, this should be collected
//       date: new Date().toISOString().split("T")[0], // Example
//       heure: "19:00", // Example
//     });

//     router.push(`/u/confirmation?${params.toString()}&type=privatisation`);
//   };

//   return (
//     <div className="min-h-screen bg-[#FFF5F5] flex items-start justify-center px-6 py-16">
//       <div className="max-w-2xl w-full mx-auto">
//         <Card className="border border-[#F2B8B6] rounded-3xl bg-white shadow-none">
//           <CardHeader className="p-6 pb-4">
//             <CardTitle className="text-4xl font-extrabold text-gray-800 tracking-tight">
//               {t("privatisation")}
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="p-6">
//             <form onSubmit={handleSubmit} className="space-y-12">
//               {/* Option selection */}
//               <div>
//                 <h3 className="text-2xl font-semibold text-gray-800 mb-4">{t("chooseYourOption")}</h3>
//                 <div className="flex flex-col sm:flex-row gap-4">
//                   <Button
//                     type="button"
//                     onClick={() => setType("restaurant")}
//                     className={`flex-1 py-5 text-lg rounded-full border-2 ${
//                       type === 'restaurant'
//                         ? 'bg-red-500 text-white border-red-500'
//                         : 'bg-transparent text-gray-700 border-[#F2B8B6] hover:bg-red-50'
//                     }`}
//                   >
//                     {t("privatiseRestaurant")}
//                   </Button>
//                   <Button
//                     type="button"
//                     onClick={() => setType("menu")}
//                     className={`flex-1 py-5 text-lg rounded-full border-2 ${
//                       type === 'menu'
//                         ? 'bg-red-500 text-white border-red-500'
//                         : 'bg-transparent text-gray-700 border-[#F2B8B6] hover:bg-red-50'
//                     }`}
//                   >
//                     {t("reserveMenuInAdvance")}
//                   </Button>
//                 </div>
//               </div>

//               {/* Privatisation details */}
//               <div className="space-y-8">
//                 <h3 className="text-2xl font-semibold text-gray-800">{t("privatisationDetails")}</h3>

//                 <Select onValueChange={setSelectedOptionId} value={selectedOptionId} required>
//                   <SelectTrigger className="w-full p-6 text-lg rounded-xl border-2 border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500">
//                     <SelectValue placeholder={t("selectPrivatisationType")} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {loading && <SelectItem value="loading" disabled>{t("loading")}</SelectItem>}
//                     {data?.privatisationOptionsByRestaurant?.map((opt) => (
//                       <SelectItem key={opt.id} value={opt.id}>{opt.nom}</SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>

//                 <Select onValueChange={setMenu} value={menu} disabled={!selectedOption} required>
//                   <SelectTrigger className="w-full p-6 text-lg rounded-xl border-2 border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
//                     <SelectValue placeholder={t("selectGroupMenu")} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {/* If menusDetails exist, display them with price; otherwise fallback to menusDeGroupe */}
//                     {selectedOption?.menusDetails && selectedOption.menusDetails.length > 0
//                       ? selectedOption.menusDetails.map((menuDetail) => (
//                           <SelectItem key={menuDetail.nom} value={menuDetail.nom}>
//                             {/* Display menu name and its price converted into the restaurant's currency. */}
//                             {menuDetail.nom}
//                             {menuDetail.prix ? ` - ${formatCurrency(menuDetail.prix, currency, currency)}` : ''}
//                           </SelectItem>
//                         ))
//                       : selectedOption?.menusDeGroupe?.map((m) => (
//                           <SelectItem key={m} value={m}>{m}</SelectItem>
//                         ))}
//                   </SelectContent>
//                 </Select>

//                 <Select onValueChange={setEspace} value={espace} required>
//                   <SelectTrigger className="w-full p-6 text-lg rounded-xl border-2 border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500">
//                     <SelectValue placeholder={t("selectSpace")} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {/* If space management is not implemented, this is the only option */}
//                     <SelectItem value="Salle entière">{t("fullHallOption")}</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Submit */}
//               <div className="flex justify-end pt-6">
//                 <Button
//                   type="submit"
//                   disabled={!isFormValid || loading}
//                   size="lg"
//                   className="rounded-full bg-red-500 hover:bg-red-600 text-white px-12 py-6 text-xl font-semibold shadow-none"
//                 >
//                   {t("confirmReservation")}
//                 </Button>
//               </div>
//             </form>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// export default function PrivatisationPage() {
//     const { t } = useTranslation();
//     const searchParams = useSearchParams();
//     return (
//         <Suspense fallback={<div>Loading...</div>}>
//           <RestaurantSubnav title={t("privatisation")} restaurantId={searchParams.get('restaurantId') || ''} />
//           <PrivatisationContent />
//         </Suspense>
//     )
// }




// test1




"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { gql, useQuery } from "@apollo/client"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/currency"
import { RestaurantSubnav } from "../accueil/page"
import useTranslation from "@/hooks/useTranslation"

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
`

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
`

function PrivatisationContent() {
  const [type, setType] = useState<"restaurant" | "menu" | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState("")
  const [menu, setMenu] = useState("")
  const [espace, setEspace] = useState("Salle entière") // Default as per requirements

  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get("restaurantId")

  const { t } = useTranslation()
  const { loading, error, data } = useQuery(GET_PRIVATISATION_OPTIONS, {
    variables: { restaurantId },
    skip: !restaurantId,
    onError: (err) => {
      toast.error(t("errorLoadingOptions"))
      console.error(err)
    },
  })

  // Fetch the restaurant currency for formatting menu prices.  Skip
  // until we know the restaurantId.  Default to MAD (Dirham) if not set.
  const { data: settingsData } = useQuery(GET_RESTAURANT_SETTINGS, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  })
  const currency: string = settingsData?.restaurant?.settings?.currency || "MAD"

  const selectedOption = data?.privatisationOptionsByRestaurant.find((opt) => opt.id === selectedOptionId)

  const isFormValid = type && selectedOptionId && menu && espace

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    const params = new URLSearchParams({
      restaurantId: restaurantId,
      typePrivatisation: selectedOption.nom,
      menuGroupe: menu,
      espace,
      // Pass other required info for confirmation page
      personnes: "50", // Example value, this should be collected
      date: new Date().toISOString().split("T")[0], // Example
      heure: "19:00", // Example
    })

    router.push(`/u/confirmation?${params.toString()}&type=privatisation`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-start justify-center px-6 py-16">
      <div className="max-w-2xl w-full mx-auto">
        <Card className="border-2 border-orange-200 rounded-3xl bg-white/95 backdrop-blur-sm shadow-xl shadow-orange-100/50 hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-300">
          <CardHeader className="p-8 pb-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-t-3xl" />
            <CardTitle className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent tracking-tight relative z-10">
              {t("privatisation")}
            </CardTitle>
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-xl" />
            <div className="absolute top-8 right-8 w-12 h-12 bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-full blur-lg" />
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent mb-6">
                  {t("chooseYourOption")}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    onClick={() => setType("restaurant")}
                    className={`flex-1 py-6 text-lg font-semibold rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      type === "restaurant"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-lg shadow-orange-200"
                        : "bg-white text-orange-700 border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:border-orange-400 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {t("privatiseRestaurant")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setType("menu")}
                    className={`flex-1 py-6 text-lg font-semibold rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      type === "menu"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-lg shadow-orange-200"
                        : "bg-white text-orange-700 border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 hover:border-orange-400 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {t("reserveMenuInAdvance")}
                  </Button>
                </div>
              </div>

              <div className="space-y-8">
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
                  {t("privatisationDetails")}
                </h3>

                <div className="relative">
                  <Select onValueChange={setSelectedOptionId} value={selectedOptionId} required>
                    <SelectTrigger className="w-full p-6 text-lg rounded-2xl border-2 border-orange-200 bg-white hover:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all duration-200 shadow-sm hover:shadow-md">
                      <SelectValue placeholder={t("selectPrivatisationType")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-orange-200 shadow-xl">
                      {loading && (
                        <SelectItem value="loading" disabled>
                          {t("loading")}
                        </SelectItem>
                      )}
                      {data?.privatisationOptionsByRestaurant?.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id} className="hover:bg-orange-50 focus:bg-orange-50">
                          {opt.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Select onValueChange={setMenu} value={menu} disabled={!selectedOption} required>
                    <SelectTrigger className="w-full p-6 text-lg rounded-2xl border-2 border-orange-200 bg-white hover:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                      <SelectValue placeholder={t("selectGroupMenu")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-orange-200 shadow-xl">
                      {selectedOption?.menusDetails && selectedOption.menusDetails.length > 0
                        ? selectedOption.menusDetails.map((menuDetail) => (
                            <SelectItem
                              key={menuDetail.nom}
                              value={menuDetail.nom}
                              className="hover:bg-orange-50 focus:bg-orange-50"
                            >
                              <div className="flex justify-between items-center w-full">
                                <span>{menuDetail.nom}</span>
                                {menuDetail.prix && (
                                  <span className="text-orange-600 font-semibold ml-2">
                                    {/* Prices stored on privatisation options are already expressed in the restaurant's currency.  Passing
                                     * the currency as both the target and base prevents conversion (e.g. USD→MAD). */}
                                    {formatCurrency(menuDetail.prix, currency, currency)}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        : selectedOption?.menusDeGroupe?.map((m) => (
                            <SelectItem key={m} value={m} className="hover:bg-orange-50 focus:bg-orange-50">
                              {m}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Select onValueChange={setEspace} value={espace} required>
                    <SelectTrigger className="w-full p-6 text-lg rounded-2xl border-2 border-orange-200 bg-white hover:border-orange-300 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all duration-200 shadow-sm hover:shadow-md">
                      <SelectValue placeholder={t("selectSpace")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-orange-200 shadow-xl">
                      <SelectItem value="Salle entière" className="hover:bg-orange-50 focus:bg-orange-50">
                        {t("fullHallOption")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <Button
                  type="submit"
                  disabled={!isFormValid || loading}
                  size="lg"
                  className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-12 py-6 text-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {t("confirmReservation")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PrivatisationPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RestaurantSubnav title={t("privatisation")} restaurantId={searchParams.get("restaurantId") || ""} />
      <PrivatisationContent />
    </Suspense>
  )
}
