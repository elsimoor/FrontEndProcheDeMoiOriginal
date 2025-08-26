
// "use client"

// import Link from "next/link"
// import Image from "next/image"
// import { useState } from "react"
// import { gql, useQuery } from "@apollo/client"
// import { Menu, X } from "lucide-react"

// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
// import useTranslation from "@/hooks/useTranslation"
// import { useLanguage } from "@/context/LanguageContext"

// const GET_RESTAURANTS = gql`
//   query GetRestaurants {
//     restaurants {
//       id
//       name
//       description
//       images
//     }
//   }
// `

// // Utils
// function truncate(str: string, max = 160) {
//   if (!str) return ""
//   return str.length > max ? str.slice(0, max - 1).trimEnd() + "…" : str
// }

// // Loading Skeleton
// function LoadingSkeleton() {
//   return (
//     <div className="bg-[#FFF5F5]">
//       {/* Hero skeleton */}
//       <section className="px-4 pt-6 sm:px-6 lg:px-8">
//         <div className="relative overflow-hidden rounded-3xl">
//           <div className="aspect-[16/9] w-full animate-pulse rounded-3xl bg-gray-200" />
//         </div>
//       </section>

//       {/* Cards skeleton */}
//       <section className="px-4 py-14 sm:px-6 lg:px-8">
//         <div className="mx-auto max-w-7xl">
//           <div className="mx-auto mb-10 h-10 w-72 animate-pulse rounded bg-gray-200" />
//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
//             {Array.from({ length: 6 }).map((_, i) => (
//               <Card key={i} className="overflow-hidden rounded-3xl">
//                 <div className="aspect-[16/10] w-full animate-pulse bg-gray-200" />
//                 <CardHeader className="p-6 pb-0">
//                   <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
//                 </CardHeader>
//                 <CardContent className="px-6 pb-6 pt-4">
//                   <div className="space-y-2">
//                     <div className="h-4 animate-pulse rounded bg-gray-200" />
//                     <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
//                     <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
//                   </div>
//                 </CardContent>
//                 <CardFooter className="bg-[#FFF5F5] p-6">
//                   <div className="h-10 w-full animate-pulse rounded-full bg-gray-200" />
//                 </CardFooter>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   )
// }

// // Error and Empty states
// function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
//   return (
//     <div className="flex min-h-[60vh] items-center justify-center bg-[#FFF5F5] px-6">
//       <div className="max-w-md text-center">
//         <h2 className="mb-2 text-xl font-semibold text-gray-800">Oups, une erreur est survenue</h2>
//         <p className="mb-6 break-words text-gray-600">{message}</p>
//         <Button onClick={onRetry} className="rounded-full">
//           Réessayer
//         </Button>
//       </div>
//     </div>
//   )
// }

// function EmptyState() {
//   return (
//     <div className="flex min-h-[60vh] items-center justify-center bg-[#FFF5F5] px-6">
//       <div className="max-w-md text-center">
//         <h2 className="mb-2 text-2xl font-bold text-gray-800">Aucun restaurant disponible</h2>
//         <p className="text-gray-600">Revenez plus tard ou contactez-nous pour plus d’informations.</p>
//       </div>
//     </div>
//   )
// }

// // Sub-Navbar focused on restaurant anchors and CTAs (below the global SiteNavbar)
// export function RestaurantSubnav({ title, restaurantId }: { title: string; restaurantId: string }) {
//   const [open, setOpen] = useState(false);
//   const { t } = useTranslation();
//   const { locale, setLocale } = useLanguage();
//   return (
//     <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b">
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
//         <Link href="/" className="flex items-center gap-2">
//           <span className="text-xl sm:text-2xl font-bold text-gray-900">{title}</span>
//         </Link>

//         {/* Desktop nav */}
//         <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
//           <Link href="#" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
//             {t("home")}
//           </Link>
//           <Link href="#menus" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
//             {t("menus")}
//           </Link>
//           <Link href="#galerie" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
//             {t("gallery")}
//           </Link>
//           <Link href="#contact" className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
//             {t("contact")}
//           </Link>
//           <Link
//             href={`/u/privatisation?restaurantId=${restaurantId}`}
//             className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
//           >
//             {t("privatize")}
//           </Link>
//           <Link
//             href={`/u/reserver?restaurantId=${restaurantId}`}
//             className="px-4 py-2 rounded-full border border-red-600 text-red-600 hover:bg-red-50 transition"
//           >
//             {t("reserve")}
//           </Link>
//         </nav>

//         {/* Language selector on desktop */}
//         <div className="hidden md:flex items-center gap-3">
//           <button
//             onClick={() => setLocale("en")}
//             className={`text-sm font-medium ${locale === "en" ? "font-semibold text-red-600" : "text-gray-700"}`}
//           >
//             EN
//           </button>
//           <button
//             onClick={() => setLocale("fr")}
//             className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-red-600" : "text-gray-700"}`}
//           >
//             FR
//           </button>
//         </div>

//         {/* Avatar placeholder */}
//         <div className="hidden md:block w-8 h-8 rounded-full bg-gray-300" />

//         {/* Mobile menu button */}
//         <button
//           className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-gray-300"
//           aria-label={t("openMenu")}
//           onClick={() => setOpen((v) => !v)}
//         >
//           <span className="sr-only">{t("openMenu")}</span>
//           <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
//             <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
//           </svg>
//         </button>
//       </div>

//       {/* Mobile dropdown */}
//       {open && (
//         <div className="md:hidden border-t bg-white">
//           <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-2">
//             <Link href="#" className="py-2 hover:text-red-600">{t("home")}</Link>
//             <Link href="#menus" className="py-2 hover:text-red-600">{t("menus")}</Link>
//             <Link href="#galerie" className="py-2 hover:text-red-600">{t("gallery")}</Link>
//             <Link href="#contact" className="py-2 hover:text-red-600">{t("contact")}</Link>
//             <div className="flex gap-3 pt-2">
//               <Link
//                 href={`/u/privatisation?restaurantId=${restaurantId}`}
//                 className="flex-1 text-center px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
//               >
//                 {t("privatize")}
//               </Link>
//               <Link
//                 href={`/u/reserver?restaurantId=${restaurantId}`}
//                 className="flex-1 text-center px-4 py-2 rounded-full border border-red-600 text-red-600 hover:bg-red-50"
//               >
//                 {t("reserve")}
//               </Link>
//             </div>
//             <div className="flex items-center gap-3 pt-2">
//               <button
//                 onClick={() => setLocale("en")}
//                 className={`flex-1 text-center text-sm font-medium ${
//                   locale === "en" ? "font-semibold text-red-600" : "text-gray-700"
//                 }`}
//               >
//                 EN
//               </button>
//               <button
//                 onClick={() => setLocale("fr")}
//                 className={`flex-1 text-center text-sm font-medium ${
//                   locale === "fr" ? "font-semibold text-red-600" : "text-gray-700"
//                 }`}
//               >
//                 FR
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </header>
//   );
// }

// // Hero
// function Hero({ name, image }: { name: string; image?: string }) {
//   const heroImage = image || "/placeholder.svg?height=720&width=1280"
//   return (
//     <section className="relative px-4 pt-6 sm:px-6 lg:px-8">
//       <div className="relative overflow-hidden rounded-3xl">
//         <div className="aspect-[16/9] w-full">
//           <Image
//             src={heroImage || "/placeholder.svg"}
//             alt={`Photo de ${name}`}
//             fill
//             priority
//             sizes="(max-width: 1024px) 100vw, 1024px"
//             className="object-cover"
//           />
//         </div>
//         {/* Overlay + content */}
//         <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
//         <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center sm:gap-6 sm:px-8">
//           <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
//             Découvrez une Expérience Culinaire Inoubliable
//           </h1>
//           <p className="max-w-2xl text-base text-white/90 sm:text-lg md:text-xl">
//             Savourez des plats exquis dans un cadre élégant et chaleureux. Réservez votre table dès aujourd’hui pour une
//             soirée mémorable.
//           </p>
//           <Link
//             href="#restaurants"
//             className="inline-block rounded-full bg-red-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-red-700 sm:px-8 sm:py-4 sm:text-lg"
//           >
//             Réserver
//           </Link>
//         </div>
//       </div>
//     </section>
//   )
// }

// // Restaurants grid
// function RestaurantsGrid({ restaurants }: { restaurants: any[] }) {
//   if (!restaurants?.length) return <EmptyState />
//   return (
//     <section id="restaurants" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
//       <div className="mx-auto max-w-7xl">
//         <h2 className="mb-6 text-center text-2xl font-extrabold text-gray-900 sm:mb-10 sm:text-3xl md:text-4xl">
//           Nos Restaurants
//         </h2>
//         <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3">
//           {restaurants.map((rest) => {
//             const cover = rest.images?.[0] || "/placeholder.svg?height=400&width=640"
//             const short = truncate(rest.description ?? "", 160)
//             return (
//               <Card
//                 key={rest.id}
//                 className="overflow-hidden rounded-3xl border border-[#F2B8B6] bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
//               >
//                 <div className="relative aspect-[16/10] w-full">
//                   <Image
//                     src={cover || "/placeholder.svg"}
//                     alt={`Photo du restaurant ${rest.name}`}
//                     fill
//                     sizes="(max-width: 1024px) 100vw, 33vw"
//                     className="object-cover"
//                   />
//                 </div>
//                 <CardHeader className="p-6 pb-0">
//                   <CardTitle className="text-xl font-semibold text-gray-900 sm:text-2xl">{rest.name}</CardTitle>
//                 </CardHeader>
//                 <CardContent className="px-6 pb-6 pt-4">
//                   <p className="text-gray-600">{short}</p>
//                 </CardContent>
//                 <CardFooter className="bg-[#FFF5F5] p-6">
//                   <Button
//                     asChild
//                     className="w-full rounded-full bg-red-600 py-3 text-sm font-semibold text-white shadow-none hover:bg-red-700 sm:py-4 sm:text-base"
//                   >
//                     <Link href={`/u/reserver?restaurantId=${rest.id}`}>Réserver une table</Link>
//                   </Button>
//                 </CardFooter>
//               </Card>
//             )
//           })}
//         </div>
//       </div>
//     </section>
//   )
// }

// // Additional anchor sections for the sub-nav
// function MenuHighlights() {
//   return (
//     <section id="menus" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
//       <div className="mx-auto max-w-7xl">
//         <h3 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Menus à la Une</h3>
//         <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
//           {["Entrées", "Plats", "Desserts"].map((title, i) => (
//             <div
//               key={title}
//               className="rounded-2xl border border-[#F2B8B6] bg-white p-6 text-center shadow-sm transition hover:shadow-md"
//             >
//               <div className="relative mx-auto mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl">
//                 <Image
//                   src={`/placeholder.svg?height=320&width=640&query=${encodeURIComponent(
//                     `french cuisine ${title.toLowerCase()}`,
//                   )}`}
//                   alt={`Photo ${title}`}
//                   fill
//                   sizes="(max-width: 1024px) 100vw, 33vw"
//                   className="object-cover"
//                 />
//               </div>
//               <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
//               <p className="mt-2 text-sm text-gray-600">
//                 Sélection {i === 0 ? "raffinée" : i === 1 ? "gourmande" : "sucrée"} préparée avec des ingrédients frais.
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

// function Galerie() {
//   const images = Array.from({ length: 6 }).map((_, i) => ({
//     src: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent("restaurant interior ambience " + (i + 1))}`,
//     alt: `Galerie ${i + 1}`,
//   }))
//   return (
//     <section id="galerie" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
//       <div className="mx-auto max-w-7xl">
//         <h3 className="mb-8 text-center text-2xl font-bold text-gray-900 sm:text-3xl">Galerie</h3>
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           {images.map((img) => (
//             <div key={img.alt} className="relative aspect-[4/3] overflow-hidden rounded-xl">
//               <Image
//                 src={img.src || "/placeholder.svg"}
//                 alt={img.alt}
//                 fill
//                 sizes="(max-width: 1024px) 100vw, 33vw"
//                 className="object-cover"
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   )
// }

// function Contact() {
//   return (
//     <section id="contact" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
//       <div className="mx-auto max-w-7xl">
//         <div className="rounded-3xl border border-[#F2B8B6] bg-white p-8 text-center shadow-sm">
//           <h3 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Contact</h3>
//           <p className="mx-auto mb-6 max-w-2xl text-gray-600">
//             Une question ou une demande spéciale ? Contactez-nous — nous sommes ravis de vous aider.
//           </p>
//           <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
//             <Link
//               href="#"
//               className="w-full rounded-full border border-red-600 px-6 py-3 text-center font-semibold text-red-600 transition hover:bg-red-50 sm:w-auto"
//             >
//               01 23 45 67 89
//             </Link>
//             <Link
//               href="#"
//               className="w-full rounded-full bg-red-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-red-700 sm:w-auto"
//             >
//               Envoyer un email
//             </Link>
//           </div>
//         </div>
//       </div>
//     </section>
//   )
// }

// // Data + Page
// function AccueilContent() {
//   const { loading, error, data, refetch } = useQuery(GET_RESTAURANTS)

//   if (loading) return <LoadingSkeleton />
//   if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />

//   const restaurants = data?.restaurants ?? []
//   if (!restaurants.length) return <EmptyState />

//   const heroRestaurant = restaurants[1] || restaurants[0]

//   return (
//     <>
//       <RestaurantSubnav title={heroRestaurant.name} restaurantId={heroRestaurant.id} />
//       <Hero name={heroRestaurant.name} image={heroRestaurant.images?.[0]} />
//       <RestaurantsGrid restaurants={restaurants} />
//       <MenuHighlights />
//       <Galerie />
//       <Contact />
//     </>
//   )
// }

// export default function RestaurantAccueilPage() {
//   return (
//     <div className="min-h-screen bg-[#FFF5F5]">
//       {/* Global brand navbar */}
//       {/* <SiteNavbar /> */}
//       {/* Page content */}
//       <AccueilContent />
//     </div>
//   )
// }



// test1



"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { gql, useQuery } from "@apollo/client"
import { Menu, X, Phone, Mail, MapPin, Star, Clock, Users } from "lucide-react"

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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Hero skeleton */}
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <div className="aspect-[16/9] w-full animate-pulse rounded-3xl bg-gradient-to-r from-gray-200 to-gray-300" />
        </div>
      </section>

      {/* Cards skeleton */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 h-10 w-72 animate-pulse rounded-xl bg-gradient-to-r from-gray-200 to-gray-300" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <div className="aspect-[16/10] w-full animate-pulse bg-gradient-to-r from-gray-200 to-gray-300" />
                <CardHeader className="p-6 pb-0">
                  <div className="h-7 w-40 animate-pulse rounded-xl bg-gradient-to-r from-gray-200 to-gray-300" />
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4">
                  <div className="space-y-2">
                    <div className="h-4 animate-pulse rounded-lg bg-gradient-to-r from-gray-200 to-gray-300" />
                    <div className="h-4 w-5/6 animate-pulse rounded-lg bg-gradient-to-r from-gray-200 to-gray-300" />
                    <div className="h-4 w-2/3 animate-pulse rounded-lg bg-gradient-to-r from-gray-200 to-gray-300" />
                  </div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-rose-50 to-orange-50 p-6">
                  <div className="h-12 w-full animate-pulse rounded-full bg-gradient-to-r from-gray-200 to-gray-300" />
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
    <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 px-6">
      <div className="max-w-md text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
          <X className="w-8 h-8 text-white" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">Oups, une erreur est survenue</h2>
        <p className="mb-6 break-words text-gray-600">{message}</p>
        <Button
          onClick={onRetry}
          className="rounded-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Réessayer
        </Button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 px-6">
      <div className="max-w-md text-center bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Aucun restaurant disponible</h2>
        <p className="text-gray-600">Revenez plus tard ou contactez-nous pour plus d'informations.</p>
      </div>
    </div>
  )
}

// Sub-Navbar focused on restaurant anchors and CTAs (below the global SiteNavbar)
export function RestaurantSubnav({ title, restaurantId }: { title: string; restaurantId: string }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-white/20 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            {title}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link
            href="#"
            className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg px-3 py-2 transition-all duration-200"
          >
            {t("home")}
          </Link>
          <Link
            href="#menus"
            className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg px-3 py-2 transition-all duration-200"
          >
            {t("menus")}
          </Link>
          <Link
            href="#galerie"
            className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg px-3 py-2 transition-all duration-200"
          >
            {t("gallery")}
          </Link>
          <Link
            href="#contact"
            className="hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg px-3 py-2 transition-all duration-200"
          >
            {t("contact")}
          </Link>
          <Link
            href={`/u/privatisation?restaurantId=${restaurantId}`}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
          >
            {t("privatize")}
          </Link>
          <Link
            href={`/u/reserver?restaurantId=${restaurantId}`}
            className="px-6 py-2 rounded-full border-2 border-red-600 text-red-600 hover:bg-red-50 transition-all duration-200 font-semibold"
          >
            {t("reserve")}
          </Link>
        </nav>

        {/* Language selector on desktop */}
        <div className="hidden md:flex items-center gap-3 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setLocale("en")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
              locale === "en"
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md"
                : "text-gray-700 hover:bg-white"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale("fr")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
              locale === "fr"
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md"
                : "text-gray-700 hover:bg-white"
            }`}
          >
            FR
          </button>
        </div>

        {/* Avatar placeholder */}
        <div className="hidden md:block w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-orange-600 shadow-lg" />

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border-2 border-gray-300 hover:border-red-600 transition-colors duration-200"
          aria-label={t("openMenu")}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{t("openMenu")}</span>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t bg-white/95 backdrop-blur-xl shadow-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-2">
            <Link
              href="#"
              className="py-3 px-4 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
            >
              {t("home")}
            </Link>
            <Link
              href="#menus"
              className="py-3 px-4 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
            >
              {t("menus")}
            </Link>
            <Link
              href="#galerie"
              className="py-3 px-4 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
            >
              {t("gallery")}
            </Link>
            <Link
              href="#contact"
              className="py-3 px-4 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium"
            >
              {t("contact")}
            </Link>
            <div className="flex gap-3 pt-2">
              <Link
                href={`/u/privatisation?restaurantId=${restaurantId}`}
                className="flex-1 text-center px-4 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 font-semibold shadow-lg"
              >
                {t("privatize")}
              </Link>
              <Link
                href={`/u/reserver?restaurantId=${restaurantId}`}
                className="flex-1 text-center px-4 py-3 rounded-full border-2 border-red-600 text-red-600 hover:bg-red-50 font-semibold"
              >
                {t("reserve")}
              </Link>
            </div>
            <div className="flex items-center gap-3 pt-2 bg-gray-100 rounded-full p-1 mt-2">
              <button
                onClick={() => setLocale("en")}
                className={`flex-1 text-center py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  locale === "en"
                    ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-white"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("fr")}
                className={`flex-1 text-center py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  locale === "fr"
                    ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-white"
                }`}
              >
                FR
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

// Hero
function Hero({ name, image }: { name: string; image?: string }) {
  const heroImage = image || "/placeholder.svg?height=720&width=1280"
  return (
    <section className="relative px-4 pt-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl shadow-2xl">
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
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-[1px]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center sm:gap-6 sm:px-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl mb-4">
              Découvrez une Expérience Culinaire Inoubliable
            </h1>
            <p className="max-w-2xl text-base text-white/90 sm:text-lg md:text-xl mb-6">
              Savourez des plats exquis dans un cadre élégant et chaleureux. Réservez votre table dès aujourd'hui pour
              une soirée mémorable.
            </p>
            <Link
              href="#restaurants"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-orange-600 px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:from-red-700 hover:to-orange-700 hover:scale-105 shadow-2xl hover:shadow-3xl sm:px-10 sm:py-5 sm:text-lg"
            >
              <Star className="w-5 h-5" />
              Réserver Maintenant
            </Link>
          </div>
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
        <div className="text-center mb-12">
          <h2 className="mb-4 text-3xl font-extrabold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent sm:text-4xl md:text-5xl">
            Nos Restaurants
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez notre sélection de restaurants d'exception, chacun offrant une expérience culinaire unique
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {restaurants.map((rest, index) => {
            const cover = rest.images?.[0] || "/placeholder.svg?height=400&width=640"
            const short = truncate(rest.description ?? "", 160)
            return (
              <Card
                key={rest.id}
                className="group overflow-hidden rounded-3xl border-0 bg-white/80 backdrop-blur-sm shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-white/90"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={cover || "/placeholder.svg"}
                    alt={`Photo du restaurant ${rest.name}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold text-gray-800">4.{8 + index}</span>
                  </div>
                </div>
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-xl font-bold text-gray-900 sm:text-2xl group-hover:text-red-600 transition-colors duration-200">
                    {rest.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-4">
                  <p className="text-gray-600 leading-relaxed">{short}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>18h-23h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>Centre-ville</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-rose-50 to-orange-50 p-6">
                  <Button
                    asChild
                    className="w-full rounded-full bg-gradient-to-r from-red-600 to-orange-600 py-4 text-sm font-bold text-white shadow-lg hover:from-red-700 hover:to-orange-700 hover:shadow-xl transition-all duration-200 hover:scale-105 sm:text-base"
                  >
                    <Link href={`/u/reserver?restaurantId=${rest.id}`}>
                      <Users className="w-4 h-4 mr-2" />
                      Réserver une table
                    </Link>
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
        <div className="text-center mb-12">
          <h3 className="mb-4 text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent sm:text-4xl">
            Menus à la Une
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Une sélection raffinée de nos spécialités culinaires préparées avec passion
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {["Entrées", "Plats", "Desserts"].map((title, i) => (
            <div
              key={title}
              className="group rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-8 text-center shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-white/90"
            >
              <div className="relative mx-auto mb-6 aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-lg">
                <Image
                  src={`/abstract-geometric-shapes.png?key=9yah0&height=320&width=640&query=${encodeURIComponent(
                    `french cuisine ${title.toLowerCase()}`,
                  )}`}
                  alt={`Photo ${title}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors duration-200">
                {title}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Sélection {i === 0 ? "raffinée" : i === 1 ? "gourmande" : "sucrée"} préparée avec des ingrédients frais
                et de saison.
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
        <div className="text-center mb-12">
          <h3 className="mb-4 text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent sm:text-4xl">
            Galerie
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Plongez dans l'atmosphère unique de nos restaurants à travers ces images
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, index) => (
            <div
              key={img.alt}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <Image
                src={img.src || "/placeholder.svg"}
                alt={img.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-semibold">Ambiance {index + 1}</p>
              </div>
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
        <div className="rounded-3xl border-0 bg-white/80 backdrop-blur-sm p-12 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h3 className="mb-4 text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent sm:text-4xl">
            Contact
          </h3>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 leading-relaxed">
            Une question ou une demande spéciale ? Contactez-nous — nous sommes ravis de vous aider à créer une
            expérience mémorable.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#"
              className="group w-full sm:w-auto rounded-full border-2 border-red-600 px-8 py-4 text-center font-bold text-red-600 transition-all duration-200 hover:bg-red-50 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Phone className="w-5 h-5 inline mr-2 group-hover:animate-pulse" />
              01 23 45 67 89
            </Link>
            <Link
              href="#"
              className="group w-full sm:w-auto rounded-full bg-gradient-to-r from-red-600 to-orange-600 px-8 py-4 text-center font-bold text-white transition-all duration-200 hover:from-red-700 hover:to-orange-700 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Mail className="w-5 h-5 inline mr-2 group-hover:animate-pulse" />
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Global brand navbar */}
      {/* <SiteNavbar /> */}
      {/* Page content */}
      <AccueilContent />
    </div>
  )
}
