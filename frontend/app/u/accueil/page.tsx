// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { useMemo, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
// import { gql, useQuery } from "@apollo/client";

// const GET_RESTAURANTS = gql`
//   query GetRestaurants {
//     restaurants {
//       id
//       name
//       description
//       images
//     }
//   }
// `;

// function LoadingSkeleton() {
//   return (
//     <div className="min-h-screen bg-[#FFF5F5]">
//       <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b">
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
//           <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
//           <div className="hidden md:flex gap-6">
//             {Array.from({ length: 5 }).map((_, i) => (
//               <div key={i} className="h-8 w-24 rounded-full bg-gray-200 animate-pulse" />
//             ))}
//           </div>
//           <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
//         </div>
//       </header>

//       <section className="px-4 sm:px-6 lg:px-8 pt-6">
//         <div className="relative w-full overflow-hidden rounded-3xl">
//           <div className="aspect-[16/9] w-full bg-gray-200 animate-pulse rounded-3xl" />
//         </div>
//       </section>

//       <section className="py-14 px-4 sm:px-6 lg:px-8">
//         <div className="mx-auto max-w-7xl">
//           <div className="h-10 w-72 bg-gray-200 rounded animate-pulse mx-auto mb-10" />
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
//             {Array.from({ length: 6 }).map((_, i) => (
//               <Card key={i} className="overflow-hidden rounded-3xl">
//                 <div className="aspect-[16/10] w-full bg-gray-200 animate-pulse" />
//                 <CardHeader className="p-6 pb-0">
//                   <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
//                 </CardHeader>
//                 <CardContent className="px-6 pt-4 pb-6">
//                   <div className="space-y-2">
//                     <div className="h-4 bg-gray-200 rounded animate-pulse" />
//                     <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
//                     <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
//                   </div>
//                 </CardContent>
//                 <CardFooter className="bg-[#FFF5F5] p-6">
//                   <div className="h-10 w-full bg-gray-200 rounded-full animate-pulse" />
//                 </CardFooter>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

// function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
//   return (
//     <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center px-6">
//       <div className="max-w-md text-center">
//         <h2 className="text-xl font-semibold text-gray-800 mb-2">Oups, une erreur est survenue</h2>
//         <p className="text-gray-600 mb-6 break-words">{message}</p>
//         <Button onClick={onRetry} className="rounded-full">
//           Réessayer
//         </Button>
//       </div>
//     </div>
//   );
// }

// function EmptyState() {
//   return (
//     <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center px-6">
//       <div className="max-w-md text-center">
//         <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun restaurant disponible</h2>
//         <p className="text-gray-600">
//           Revenez plus tard ou contactez-nous pour plus d’informations.
//         </p>
//       </div>
//     </div>
//   );
// }

// function Navbar({ title, restaurantId }: { title: string; restaurantId: string }) {
  // const [open, setOpen] = useState(false);

  // return (
  //   <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b">
  //     <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
  //       <Link href="/" className="flex items-center gap-2">
  //         <span className="text-xl sm:text-2xl font-bold text-gray-900">{title}</span>
  //       </Link>

  //       {/* Desktop nav */}
  //       <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
  //         <Link href="#" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
  //           Accueil
  //         </Link>
  //         <Link href="#menus" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
  //           Menus
  //         </Link>
  //         <Link href="#galerie" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
  //           Galerie
  //         </Link>
  //         <Link href="#contact" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
  //           Contact
  //         </Link>
  //         <Link
  //           href={`/u/privatisation?restaurantId=${restaurantId}`}
  //           className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
  //         >
  //           Privatiser
  //         </Link>
  //         <Link
  //           href={`/u/reserver?restaurantId=${restaurantId}`}
  //           className="px-4 py-2 rounded-full border border-red-600 text-red-600 hover:bg-red-50 transition"
  //         >
  //           Réserver
  //         </Link>
  //       </nav>

  //       {/* Avatar placeholder */}
  //       <div className="hidden md:block w-8 h-8 rounded-full bg-gray-300" />

  //       {/* Mobile menu button */}
  //       <button
  //         className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-300"
  //         aria-label="Ouvrir le menu"
  //         onClick={() => setOpen((v) => !v)}
  //       >
  //         <span className="sr-only">Open menu</span>
  //         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  //           <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  //         </svg>
  //       </button>
  //     </div>

  //     {/* Mobile dropdown */}
  //     {open && (
  //       <div className="md:hidden border-t bg-white">
  //         <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-2">
  //           <Link href="#" className="py-2 hover:text-red-600">Accueil</Link>
  //           <Link href="#menus" className="py-2 hover:text-red-600">Menus</Link>
  //           <Link href="#galerie" className="py-2 hover:text-red-600">Galerie</Link>
  //           <Link href="#contact" className="py-2 hover:text-red-600">Contact</Link>
  //           <div className="flex gap-3 pt-2">
  //             <Link
  //               href={`/u/privatisation?restaurantId=${restaurantId}`}
  //               className="flex-1 text-center px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
  //             >
  //               Privatiser
  //             </Link>
  //             <Link
  //               href={`/u/reserver?restaurantId=${restaurantId}`}
  //               className="flex-1 text-center px-4 py-2 rounded-full border border-red-600 text-red-600 hover:bg-red-50"
  //             >
  //               Réserver
  //             </Link>
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </header>
  // );
// }

// function Hero({ name, image }: { name: string; image?: string }) {
//   const heroImage = image || "/placeholder.jpg";
//   return (
//     <section className="relative px-4 sm:px-6 lg:px-8 pt-6">
//       <div className="relative overflow-hidden rounded-3xl">
//         <div className="aspect-[16/9] w-full">
//           <Image
//             src={heroImage}
//             alt={name}
//             fill
//             priority
//             sizes="(max-width: 1024px) 100vw, 1024px"
//             className="object-cover"
//           />
//         </div>

//         {/* Overlay + content */}
//         <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
//         <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 gap-4 sm:gap-6">
//           <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white max-w-3xl leading-tight">
//             Découvrez une Expérience Culinaire Inoubliable
//           </h1>
//           <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl">
//             Savourez des plats exquis dans un cadre élégant et chaleureux. Réservez votre table dès aujourd’hui pour une soirée mémorable.
//           </p>
//           <Link
//             href="#restaurants"
//             className="inline-block rounded-full bg-red-600 hover:bg-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition"
//           >
//             Réserver
//           </Link>
//         </div>
//       </div>
//     </section>
//   );
// }

// function RestaurantsGrid({ restaurants }: { restaurants: any[] }) {
//   if (!restaurants?.length) return <EmptyState />;

//   return (
//     <section id="restaurants" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-7xl">
//         <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 sm:mb-10 text-center">
//           Nos Restaurants
//         </h2>

//         <div className="grid grid-cols-1 gap-5 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
//           {restaurants.map((rest) => {
//             const cover = rest.images?.[0] || "/placeholder.jpg";
//             const desc = rest.description ?? "";
//             const short = useMemo(
//               () => (desc.length > 160 ? `${desc.slice(0, 157)}…` : desc),
//               [desc]
//             );

//             return (
//               <Card
//                 key={rest.id}
//                 className="overflow-hidden rounded-3xl border border-[#F2B8B6] bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
//               >
//                 <div className="relative w-full aspect-[16/10]">
//                   <Image
//                     src={cover}
//                     alt={rest.name}
//                     fill
//                     sizes="(max-width: 1024px) 100vw, 33vw"
//                     className="object-cover"
//                   />
//                 </div>

//                 <CardHeader className="p-6 pb-0">
//                   <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
//                     {rest.name}
//                   </CardTitle>
//                 </CardHeader>

//                 <CardContent className="px-6 pt-4 pb-6">
//                   <p className="text-gray-600">
//                     {short}
//                   </p>
//                 </CardContent>

//                 <CardFooter className="bg-[#FFF5F5] p-6">
//                   <Button asChild className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 text-sm sm:text-base font-semibold shadow-none">
//                     <Link href={`/u/reserver?restaurantId=${rest.id}`}>
//                       Réserver une table
//                     </Link>
//                   </Button>
//                 </CardFooter>
//               </Card>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// }

// function AccueilContent() {
//   const { loading, error, data, refetch } = useQuery(GET_RESTAURANTS);

//   if (loading) return <LoadingSkeleton />;
//   if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />;

//   const restaurants = data?.restaurants ?? [];
//   const heroRestaurant = restaurants[1];

//   return (
//     <div className="min-h-screen bg-[#FFF5F5]">
//       {heroRestaurant ? (
//         <>
//           <Navbar title={heroRestaurant.name} restaurantId={heroRestaurant.id} />
//           <Hero name={heroRestaurant.name} image={heroRestaurant.images?.[0]} />
//           <RestaurantsGrid restaurants={restaurants} />
//         </>
//       ) : (
//         <EmptyState />
//       )}
//     </div>
//   );
// }

// export default function AccueilPage() {
//   // Note: useQuery isn’t suspenseful by default; we keep Suspense minimal for future migration.
//   return <AccueilContent />;
// }



// test1




"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { gql, useQuery } from "@apollo/client"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"

const GET_RESTAURANTS = gql`
  query GetRestaurants {
    restaurants {
      id
      name
      description
      images
    }
  }
`

// Utils
function truncate(str: string, max = 160) {
  if (!str) return ""
  return str.length > max ? str.slice(0, max - 1).trimEnd() + "…" : str
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="bg-[#FFF5F5]">
      {/* Hero skeleton */}
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="aspect-[16/9] w-full animate-pulse rounded-3xl bg-gray-200" />
        </div>
      </section>

      {/* Cards skeleton */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 h-10 w-72 animate-pulse rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden rounded-3xl">
                <div className="aspect-[16/10] w-full animate-pulse bg-gray-200" />
                <CardHeader className="p-6 pb-0">
                  <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4">
                  <div className="space-y-2">
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  </div>
                </CardContent>
                <CardFooter className="bg-[#FFF5F5] p-6">
                  <div className="h-10 w-full animate-pulse rounded-full bg-gray-200" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// Error and Empty states
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#FFF5F5] px-6">
      <div className="max-w-md text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-800">Oups, une erreur est survenue</h2>
        <p className="mb-6 break-words text-gray-600">{message}</p>
        <Button onClick={onRetry} className="rounded-full">
          Réessayer
        </Button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#FFF5F5] px-6">
      <div className="max-w-md text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Aucun restaurant disponible</h2>
        <p className="text-gray-600">Revenez plus tard ou contactez-nous pour plus d’informations.</p>
      </div>
    </div>
  )
}

// Sub-Navbar focused on restaurant anchors and CTAs (below the global SiteNavbar)
export function RestaurantSubnav({ title, restaurantId }: { title: string; restaurantId: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();
  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-bold text-gray-900">{title}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="#" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
            {t("home")}
          </Link>
          <Link href="#menus" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
            {t("menus")}
          </Link>
          <Link href="#galerie" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
            {t("gallery")}
          </Link>
          <Link href="#contact" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
            {t("contact")}
          </Link>
          <Link
            href={`/u/privatisation?restaurantId=${restaurantId}`}
            className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
          >
            {t("privatize")}
          </Link>
          <Link
            href={`/u/reserver?restaurantId=${restaurantId}`}
            className="px-4 py-2 rounded-full border border-red-600 text-red-600 hover:bg-red-50 transition"
          >
            {t("reserve")}
          </Link>
        </nav>

        {/* Language selector on desktop */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setLocale("en")}
            className={`text-sm font-medium ${locale === "en" ? "font-semibold text-red-600" : "text-gray-700"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale("fr")}
            className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-red-600" : "text-gray-700"}`}
          >
            FR
          </button>
        </div>

        {/* Avatar placeholder */}
        <div className="hidden md:block w-8 h-8 rounded-full bg-gray-300" />

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-300"
          aria-label={t("openMenu")}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{t("openMenu")}</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-2">
            <Link href="#" className="py-2 hover:text-red-600">{t("home")}</Link>
            <Link href="#menus" className="py-2 hover:text-red-600">{t("menus")}</Link>
            <Link href="#galerie" className="py-2 hover:text-red-600">{t("gallery")}</Link>
            <Link href="#contact" className="py-2 hover:text-red-600">{t("contact")}</Link>
            <div className="flex gap-3 pt-2">
              <Link
                href={`/u/privatisation?restaurantId=${restaurantId}`}
                className="flex-1 text-center px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
              >
                {t("privatize")}
              </Link>
              <Link
                href={`/u/reserver?restaurantId=${restaurantId}`}
                className="flex-1 text-center px-4 py-2 rounded-full border border-red-600 text-red-600 hover:bg-red-50"
              >
                {t("reserve")}
              </Link>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setLocale("en")}
                className={`flex-1 text-center text-sm font-medium ${
                  locale === "en" ? "font-semibold text-red-600" : "text-gray-700"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("fr")}
                className={`flex-1 text-center text-sm font-medium ${
                  locale === "fr" ? "font-semibold text-red-600" : "text-gray-700"
                }`}
              >
                FR
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Hero
function Hero({ name, image }: { name: string; image?: string }) {
  const heroImage = image || "/placeholder.svg?height=720&width=1280"
  return (
    <section className="relative px-4 pt-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl">
        <div className="aspect-[16/9] w-full">
          <Image
            src={heroImage || "/placeholder.svg"}
            alt={`Photo de ${name}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>
        {/* Overlay + content */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center sm:gap-6 sm:px-8">
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
            Découvrez une Expérience Culinaire Inoubliable
          </h1>
          <p className="max-w-2xl text-base text-white/90 sm:text-lg md:text-xl">
            Savourez des plats exquis dans un cadre élégant et chaleureux. Réservez votre table dès aujourd’hui pour une
            soirée mémorable.
          </p>
          <Link
            href="#restaurants"
            className="inline-block rounded-full bg-red-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-red-700 sm:px-8 sm:py-4 sm:text-lg"
          >
            Réserver
          </Link>
        </div>
      </div>
    </section>
  )
}

// Restaurants grid
function RestaurantsGrid({ restaurants }: { restaurants: any[] }) {
  if (!restaurants?.length) return <EmptyState />
  return (
    <section id="restaurants" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 text-center text-2xl font-extrabold text-gray-900 sm:mb-10 sm:text-3xl md:text-4xl">
          Nos Restaurants
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3">
          {restaurants.map((rest) => {
            const cover = rest.images?.[0] || "/placeholder.svg?height=400&width=640"
            const short = truncate(rest.description ?? "", 160)
            return (
              <Card
                key={rest.id}
                className="overflow-hidden rounded-3xl border border-[#F2B8B6] bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={cover || "/placeholder.svg"}
                    alt={`Photo du restaurant ${rest.name}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-xl font-semibold text-gray-900 sm:text-2xl">{rest.name}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4">
                  <p className="text-gray-600">{short}</p>
                </CardContent>
                <CardFooter className="bg-[#FFF5F5] p-6">
                  <Button
                    asChild
                    className="w-full rounded-full bg-red-600 py-3 text-sm font-semibold text-white shadow-none hover:bg-red-700 sm:py-4 sm:text-base"
                  >
                    <Link href={`/u/reserver?restaurantId=${rest.id}`}>Réserver une table</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Additional anchor sections for the sub-nav
function MenuHighlights() {
  return (
    <section id="menus" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h3 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Menus à la Une</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {["Entrées", "Plats", "Desserts"].map((title, i) => (
            <div
              key={title}
              className="rounded-2xl border border-[#F2B8B6] bg-white p-6 text-center shadow-sm transition hover:shadow-md"
            >
              <div className="relative mx-auto mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl">
                <Image
                  src={`/placeholder.svg?height=320&width=640&query=${encodeURIComponent(
                    `french cuisine ${title.toLowerCase()}`,
                  )}`}
                  alt={`Photo ${title}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
              <p className="mt-2 text-sm text-gray-600">
                Sélection {i === 0 ? "raffinée" : i === 1 ? "gourmande" : "sucrée"} préparée avec des ingrédients frais.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Galerie() {
  const images = Array.from({ length: 6 }).map((_, i) => ({
    src: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent("restaurant interior ambience " + (i + 1))}`,
    alt: `Galerie ${i + 1}`,
  }))
  return (
    <section id="galerie" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h3 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Galerie</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.alt} className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={img.src || "/placeholder.svg"}
                alt={img.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-[#F2B8B6] bg-white p-8 text-center shadow-sm">
          <h3 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Contact</h3>
          <p className="mx-auto mb-6 max-w-2xl text-gray-600">
            Une question ou une demande spéciale ? Contactez-nous — nous sommes ravis de vous aider.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#"
              className="w-full rounded-full border border-red-600 px-6 py-3 text-center font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
            >
              01 23 45 67 89
            </Link>
            <Link
              href="#"
              className="w-full rounded-full bg-red-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-red-700 sm:w-auto"
            >
              Envoyer un email
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Data + Page
function AccueilContent() {
  const { loading, error, data, refetch } = useQuery(GET_RESTAURANTS)

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />

  const restaurants = data?.restaurants ?? []
  if (!restaurants.length) return <EmptyState />

  const heroRestaurant = restaurants[1] || restaurants[0]

  return (
    <>
      <RestaurantSubnav title={heroRestaurant.name} restaurantId={heroRestaurant.id} />
      <Hero name={heroRestaurant.name} image={heroRestaurant.images?.[0]} />
      <RestaurantsGrid restaurants={restaurants} />
      <MenuHighlights />
      <Galerie />
      <Contact />
    </>
  )
}

export default function RestaurantAccueilPage() {
  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      {/* Global brand navbar */}
      {/* <SiteNavbar /> */}
      {/* Page content */}
      <AccueilContent />
    </div>
  )
}
