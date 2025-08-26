// "use client";

// import { useState, useEffect, Suspense } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Calendar } from "@/components/ui/calendar";
// import { useRouter, useSearchParams } from 'next/navigation';
// import { gql, useLazyQuery } from "@apollo/client";
// import { toast } from "sonner";
// import moment from "moment";
// import { RestaurantSubnav } from "../accueil/page";
// import useTranslation from "@/hooks/useTranslation";

// const GET_AVAILABILITY = gql`
//   query Availability($restaurantId: ID!, $date: String!, $partySize: Int!) {
//     availability(restaurantId: $restaurantId, date: $date, partySize: $partySize) {
//       time
//       available
//     }
//   }
// `;

// function ReserverContent() {
//   const [personnes, setPersonnes] = useState(2);
//   const [emplacement, setEmplacement] = useState("");
//   const [date, setDate] = useState<Date | undefined>(new Date());
//   const [heure, setHeure] = useState("");
//   const [availableSlots, setAvailableSlots] = useState<{time: string, available: boolean}[]>([]);

//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const restaurantId = searchParams.get('restaurantId');

//   // Translation hook
//   const { t } = useTranslation();

//   const [loadAvailability, { loading, error, data }] = useLazyQuery(GET_AVAILABILITY, {
//     onCompleted: (data) => {
//       setAvailableSlots(data.availability);
//       if (data.availability.filter(s => s.available).length === 0) {
//         toast.info(t("noSlotsAvailableWithPeople"));
//       }
//     },
//     onError: (error) => {
//       toast.error(t("errorLoadingAvailability"));
//       console.error(error);
//     }
//   });

//   useEffect(() => {
//     if (date && personnes > 0 && restaurantId) {
//       const formattedDate = moment(date).format("YYYY-MM-DD");
//       loadAvailability({ variables: { restaurantId, date: formattedDate, partySize: personnes } });
//     }
//   }, [date, personnes, restaurantId, loadAvailability]);

//   const isFormValid = date && heure && personnes > 0;

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!isFormValid) return;

//     const params = new URLSearchParams({
//       restaurantId: restaurantId,
//       date: date.toISOString().split("T")[0],
//       heure,
//       personnes: personnes.toString(),
//       ...(emplacement && { emplacement }),
//     });

//     router.push(`/u/confirmation?${params.toString()}`);
//   };

//   return (
//     <div className="min-h-screen bg-[#FFF5F5] px-6 py-12">
//       <div className="max-w-5xl mx-auto">
//         {/* Heading */}
//         <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8">{t("reserveTableTitle")}</h1>
//         <form onSubmit={handleSubmit} className="space-y-8">
//           {/* Personnes & Emplacement */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <Label htmlFor="personnes" className="text-lg font-medium text-gray-700">{t("numPeopleLabel")}</Label>
//               <Input
//                 id="personnes"
//                 type="number"
//                 value={personnes}
//                 onChange={(e) => setPersonnes(parseInt(e.target.value, 10) || 1)}
//                 min="1"
//                 max="20"
//                 required
//                 className="mt-2 p-4 text-lg rounded-xl border border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
//               />
//             </div>
//             <div>
//               <Label htmlFor="emplacement" className="text-lg font-medium text-gray-700">{t("locationInRestaurantLabel")}</Label>
//               <Input
//                 id="emplacement"
//                 type="text"
//                 value={emplacement}
//                 onChange={(e) => setEmplacement(e.target.value)}
//                 placeholder="Optionnel (ex: près de la fenêtre)"
//                 className="mt-2 p-4 text-lg rounded-xl border border-[#F2B8B6] focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
//               />
//             </div>
//           </div>
//           {/* Time slots */}
//           <div>
//             <Label className="text-lg font-medium text-gray-700">{t("reservationTimeLabel")}</Label>
//             <div className="flex flex-wrap gap-3 mt-3">
//               {loading && <p>{t("loadingSlotsMessage")}</p>}
//               {error && <p className="text-red-500">{t("errorLoadingMessage")}</p>}
//               {/* When not loading or error, but no available slots are returned, show a friendly message. */}
//               {!loading && !error && availableSlots.length === 0 && (
//                 <p className="text-gray-600">{t("noSlotsAvailableMessage")}</p>
//               )}
//               {availableSlots.map((slot) => {
//                 const isSelected = heure === slot.time;
//                 return (
//                   <Button
//                     key={slot.time}
//                     type="button"
//                     onClick={() => setHeure(slot.time)}
//                     disabled={!slot.available}
//                     className={`rounded-full px-5 py-2 text-sm font-medium border ${
//                       isSelected
//                         ? 'bg-red-500 text-white border-red-500'
//                         : 'bg-white text-gray-700 border-[#F2B8B6] hover:bg-red-50'
//                     } ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}`}
//                   >
//                     {slot.time}
//                   </Button>
//                 );
//               })}
//             </div>
//           </div>
//           {/* Calendar */}
//           <div>
//             <Label className="text-lg font-medium text-gray-700 mb-3 inline-block">{t("reservationDatesLabel")}</Label>
//             <Calendar
//               mode="single"
//               selected={date}
//               onSelect={setDate}
//               numberOfMonths={2}
//               disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
//               className="p-0"
//             />
//           </div>
//           {/* Submit button */}
//           <div className="flex justify-end pt-4">
//             <Button
//               type="submit"
//               disabled={!isFormValid || loading}
//               size="lg"
//               className="rounded-full bg-red-500 hover:bg-red-600 text-white px-10 py-4 text-lg font-semibold shadow-none"
//             >
//               {t("reservationButtonLabel")}
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default function ReserverPage() {
//     // Translation for the page title and subnav
//     const { t } = useTranslation();
//     // Access search parameters for restaurantId
//     const searchParams = useSearchParams();
//     return (
//         <Suspense fallback={<div>Loading...</div>}>
//           <RestaurantSubnav
//             title={t("reserveTableTitle")}
//             restaurantId={searchParams.get('restaurantId') || ''}
//           />
//           <ReserverContent />
//         </Suspense>
//     );
// }




// test1




"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { useRouter, useSearchParams } from "next/navigation"
import { gql, useLazyQuery } from "@apollo/client"
import { toast } from "sonner"
import moment from "moment"
import { RestaurantSubnav } from "../accueil/page"
import useTranslation from "@/hooks/useTranslation"
import { Users, MapPin, Clock, CalendarDays, Loader2 } from "lucide-react"

const GET_AVAILABILITY = gql`
  query Availability($restaurantId: ID!, $date: String!, $partySize: Int!) {
    availability(restaurantId: $restaurantId, date: $date, partySize: $partySize) {
      time
      available
    }
  }
`

function ReserverContent() {
  const [personnes, setPersonnes] = useState(2)
  const [emplacement, setEmplacement] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [heure, setHeure] = useState("")
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([])

  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get("restaurantId")

  // Translation hook
  const { t } = useTranslation()

  const [loadAvailability, { loading, error, data }] = useLazyQuery(GET_AVAILABILITY, {
    onCompleted: (data) => {
      setAvailableSlots(data.availability)
      if (data.availability.filter((s) => s.available).length === 0) {
        toast.info(t("noSlotsAvailableWithPeople"))
      }
    },
    onError: (error) => {
      toast.error(t("errorLoadingAvailability"))
      console.error(error)
    },
  })

  useEffect(() => {
    if (date && personnes > 0 && restaurantId) {
      const formattedDate = moment(date).format("YYYY-MM-DD")
      loadAvailability({ variables: { restaurantId, date: formattedDate, partySize: personnes } })
    }
  }, [date, personnes, restaurantId, loadAvailability])

  const isFormValid = date && heure && personnes > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    const params = new URLSearchParams({
      restaurantId: restaurantId,
      date: date.toISOString().split("T")[0],
      heure,
      personnes: personnes.toString(),
      ...(emplacement && { emplacement }),
    })

    router.push(`/u/confirmation?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-indigo-100 px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
            {t("reserveTableTitle")}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Sélectionnez votre date, heure et préférences pour une expérience culinaire inoubliable
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="personnes" className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                  <Users className="w-5 h-5 text-orange-600" />
                  {t("numPeopleLabel")}
                </Label>
                <Input
                  id="personnes"
                  type="number"
                  value={personnes}
                  onChange={(e) => setPersonnes(Number.parseInt(e.target.value, 10) || 1)}
                  min="1"
                  max="20"
                  required
                  className="h-14 text-lg rounded-2xl border-2 border-slate-200 focus:orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 bg-white/50"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="emplacement" className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  {t("locationInRestaurantLabel")}
                </Label>
                <Input
                  id="emplacement"
                  type="text"
                  value={emplacement}
                  onChange={(e) => setEmplacement(e.target.value)}
                  placeholder="Optionnel (ex: près de la fenêtre)"
                  className="h-14 text-lg rounded-2xl border-2 border-slate-200 focus:orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 bg-white/50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                <Clock className="w-5 h-5 text-orange-600" />
                {t("reservationTimeLabel")}
              </Label>
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200">
                {loading && (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                    <p className="text-slate-600">{t("loadingSlotsMessage")}</p>
                  </div>
                )}
                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-500 font-medium">{t("errorLoadingMessage")}</p>
                  </div>
                )}
                {!loading && !error && availableSlots.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-600">{t("noSlotsAvailableMessage")}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {availableSlots.map((slot) => {
                    const isSelected = heure === slot.time
                    return (
                      <Button
                        key={slot.time}
                        type="button"
                        onClick={() => setHeure(slot.time)}
                        disabled={!slot.available}
                        className={`rounded-full px-6 py-3 text-sm font-semibold border-2 transition-all duration-200 ${
                          isSelected
                            ? "bg-gradient-to-r from-red-600 to-orange-600 text-white orange-600 shadow-lg scale-105"
                            : "bg-white text-slate-700 border-slate-200 hover:orange-300 hover:bg-orange-50 hover:scale-105"
                        } ${!slot.available ? "opacity-40 cursor-not-allowed hover:scale-100" : "shadow-md hover:shadow-lg"}`}
                      >
                        {slot.time}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                <CalendarDays className="w-5 h-5 text-orange-600" />
                {t("reservationDatesLabel")}
              </Label>
              <div className="bg-white/70 rounded-2xl p-6 border border-slate-200 shadow-inner">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  disabled={(d) => d < new Date(new Date().setDate(new Date().getDate() - 1))}
                  className="p-0 [&_.rdp-day_selected]:bg-gradient-to-r [&_.rdp-day_selected]:from-orange-600 [&_.rdp-day_selected]:to-indigo-600 [&_.rdp-day_selected]:text-white [&_.rdp-day]:rounded-xl [&_.rdp-day:hover]:bg-orange-50 [&_.rdp-day:hover]:scale-105 [&_.rdp-day]:transition-all [&_.rdp-day]:duration-200"
                />
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={!isFormValid || loading}
                size="lg"
                className="rounded-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-orange-700 hover:to-indigo-700 text-white px-12 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Chargement...
                  </div>
                ) : (
                  t("reservationButtonLabel")
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ReserverPage() {
  // Translation for the page title and subnav
  const { t } = useTranslation()
  // Access search parameters for restaurantId
  const searchParams = useSearchParams()
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RestaurantSubnav title={t("reserveTableTitle")} restaurantId={searchParams.get("restaurantId") || ""} />
      <ReserverContent />
    </Suspense>
  )
}
