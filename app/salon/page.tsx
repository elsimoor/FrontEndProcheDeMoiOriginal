// "use client"

// import Link from "next/link"
// import { gql, useQuery } from "@apollo/client"
// import { useState, useEffect, useMemo } from "react"
// import useTranslation from "@/hooks/useTranslation"
// import { useLanguage } from "@/context/LanguageContext"
// import { useRouter } from "next/navigation"
// import {
//   Carousel,
//   CarouselContent,
//   CarouselItem,
//   CarouselPrevious,
//   CarouselNext,
// } from "@/components/ui/carousel"

// const GET_SALONS = gql`
//   query GetSalons {
//     salons {
//       id
//       name
//       description
//       images
//     }
//   }
// `

// const GET_SERVICES = gql`
//     query GetServices($businessId: ID!, $businessType: String!) {
//         services(businessId: $businessId, businessType: $businessType) {
//             id
//             name
//             description
//             price
//             duration
//             category
//             images
//         }
//     }
// `

// /**
//  * Landing page for the salon service.  Presents a luxurious hero
//  * section and showcases top salon services with a consistent pink
//  * colour scheme.  Visitors are encouraged to book appointments or
//  * browse services.
//  */
// export default function SalonLanding() {
//   const { data: salonsData, loading: salonsLoading, error: salonsError } = useQuery(GET_SALONS)

//   const salons = salonsData?.salons || []
//   const salon = salons[0] || {}

//   // Router instance to programmatically navigate.  This allows us
//   // to redirect to the booking page with a preselected service.
//   const router = useRouter()

//   const { data: servicesData, loading: servicesLoading, error: servicesError } = useQuery(GET_SERVICES, {
//     variables: { businessId: salon.id, businessType: "salon" },
//     skip: !salon.id,
//   })

//   const services = servicesData?.services || []

//   // Category filtering for services.  Collect all unique categories and
//   // allow the user to filter services by category.  A "Tous" (all)
//   // category is provided to reset the filter.  Categories default to
//   // "Autres" when none is defined on a service.

//   const [selectedCategory, setSelectedCategory] = useState<string>("Tous")
//   const filteredServices = useMemo(() => {
//     if (selectedCategory === "Tous") return services
//     return services.filter((s: any) => (s.category || "Autres") === selectedCategory)
//   }, [services, selectedCategory])

  
//   const categories = useMemo(() => {
//     const set = new Set<string>()
//     services.forEach((s: any) => {
//       set.add(s.category || "Autres")
//     })
//     return ["Tous", ...Array.from(set)]
//   }, [services])

//   if (salonsLoading || servicesLoading) return <p>Loading...</p>
//   if (salonsError || servicesError) return <p>Error :(</p>

//   // Translation and language for this page
//   const { t } = useTranslation()
//   const { locale, setLocale } = useLanguage()

//   return (
//     <div className="min-h-screen flex flex-col bg-white">
//       {/* Navbar */}
//       <header className="bg-white shadow-sm sticky top-0 z-20">
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
//           <div className="flex items-center space-x-2">
//             <span className="font-bold text-xl text-pink-600">{salon.name || "Salon Zenith"}</span>
//           </div>
//           <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
//             <Link href="/salon" className="hover:text-pink-600">{t("home")}</Link>
//             <Link href="/salon/services" className="hover:text-pink-600">{t("services")}</Link>
//             <Link href="/salon/about" className="hover:text-pink-600">{t("aboutUs")}</Link>
//             <Link href="/salon/contact" className="hover:text-pink-600">{t("contact")}</Link>
//           </nav>
//           <div className="flex items-center space-x-4">
//             {/* Language selector on salon landing page */}
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => setLocale("en")}
//                 className={`text-sm font-medium ${
//                   locale === "en" ? "font-semibold text-pink-600" : "text-gray-700"
//                 }`}
//               >
//                 EN
//               </button>
//               <button
//                 onClick={() => setLocale("fr")}
//                 className={`text-sm font-medium ${
//                   locale === "fr" ? "font-semibold text-pink-600" : "text-gray-700"
//                 }`}
//               >
//                 FR
//               </button>
//             </div>
//             <Link
//               href="/salon/booking"
//               className="hidden md:inline-block bg-pink-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-pink-700 transition-colors"
//             >
//               {t("bookNow")}
//             </Link>
//             <Link
//               href="/login"
//               className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
//             >
//               {t("signIn")}
//             </Link>
//           </div>
//         </div>
//       </header>
//       {/* Hero */}
//       <main className="flex-1">
//         <div
//           className="relative bg-cover bg-center h-[70vh]"
//           style={{ backgroundImage: `url('${salon.images?.[0] || 'https://images.unsplash.com/photo-1583267743713-0f36bcbc89e4'}')` }}
//         >
//           <div className="absolute inset-0 bg-black bg-opacity-40"></div>
//           <div className="max-w-3xl mx-auto px-4 py-24 text-center relative z-10">
//             <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
//               {salon.name || t("salonHeroTitle")}
//             </h1>
//             <p className="text-lg md:text-xl text-gray-100 mb-8">
//               {salon.description || t("salonHeroDescription")}
//             </p>
//             <Link
//               href="/salon/booking"
//               className="inline-block bg-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-pink-700 transition-transform transform hover:scale-105"
//             >
//               {t("bookNow")}
//             </Link>
//           </div>
//         </div>
//         {/* Services */}
//         <section className="max-w-7xl mx-auto px-4 py-16">
//           <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">{t("ourServices")}</h2>
//           {/* Category filters */}
//           <div className="flex flex-wrap justify-center gap-4 mb-10">
//             {categories.map((cat) => {
//               // Translate "Tous" and "Autres" categories, otherwise show the category name as is
//               let displayCat: string
//               if (cat === "Tous") {
//                 displayCat = t("all")
//               } else if (cat === "Autres") {
//                 displayCat = t("others")
//               } else {
//                 displayCat = cat
//               }
//               return (
//                 <button
//                   key={cat}
//                   onClick={() => setSelectedCategory(cat)}
//                   className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border
//                 ${selectedCategory === cat ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
//                 >
//                   {displayCat}
//                 </button>
//               )
//             })}
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {filteredServices.map((service: any) => (
//               <div
//                 key={service.id}
//                 onClick={() => router.push(`/salon/booking?serviceId=${service.id}`)}
//                 className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
//               >
//                 {service.images && service.images.length > 0 ? (
//                   <div className="relative">
//                     {/* Carousel for service images */}
//                     <Carousel className="w-full">
//                       <CarouselContent>
//                         {service.images.map((img: string, index: number) => (
//                           <CarouselItem key={index}>
//                             <img
//                               src={img}
//                               alt={service.name}
//                               className="h-48 w-full object-cover"
//                             />
//                           </CarouselItem>
//                         ))}
//                       </CarouselContent>
//                       {/* Show navigation controls only if multiple images */}
//                       {service.images.length > 1 && (
//                         <>
//                           <CarouselPrevious />
//                           <CarouselNext />
//                         </>
//                       )}
//                     </Carousel>
//                   </div>
//                 ) : (
//                   <div className="h-48 bg-pink-100 flex items-center justify-center text-pink-500 text-4xl font-bold">
//                     {service.name.charAt(0)}
//                   </div>
//                 )}
//                 <div className="p-6 space-y-3">
//                   <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
//                   <p className="text-sm text-gray-600 h-16 overflow-hidden leading-relaxed">{service.description}</p>
//                   <div className="flex justify-between items-center mt-4">
//                     <span className="text-lg font-bold text-pink-600">{service.price}€</span>
//                     {/* The reserve button is purely decorative; clicking anywhere on the card will navigate */}
//                     <span className="inline-block bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium">
//                       Réserver
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>
//         {/* Stylists */}
//         <section className="bg-pink-50 py-16">
//             <div className="max-w-7xl mx-auto px-4 text-center">
//                 <h2 className="text-4xl font-bold text-gray-900 mb-10">{t("ourExpertStylists")}</h2>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//                     <div className="text-center">
//                         <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61" alt="Stylist 1" className="w-32 h-32 rounded-full mx-auto mb-4" />
//                         <h3 className="text-xl font-bold">Jessica</h3>
//                         <p className="text-gray-600">Spécialiste couleur</p>
//                     </div>
//                     <div className="text-center">
//                         <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e" alt="Stylist 2" className="w-32 h-32 rounded-full mx-auto mb-4" />
//                         <h3 className="text-xl font-bold">Marc</h3>
//                         <p className="text-gray-600">Expert en coupe</p>
//                     </div>
//                     <div className="text-center">
//                         <img src="https://images.unsplash.com/photo-1521119989659-a83eee488004" alt="Stylist 3" className="w-32 h-32 rounded-full mx-auto mb-4" />
//                         <h3 className="text-xl font-bold">Sophie</h3>
//                         <p className="text-gray-600">Maître styliste</p>
//                     </div>
//                 </div>
//             </div>
//         </section>
//         {/* Testimonials */}
//         <section className="max-w-7xl mx-auto px-4 py-16">
//           <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">{t("whatClientsSay")}</h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <div className="bg-white p-6 rounded-lg shadow-lg">
//               <p className="text-gray-600 mb-4">"Une expérience incroyable ! Je suis tellement contente de ma nouvelle coupe."</p>
//               <p className="font-bold text-gray-900">- Chloé</p>
//             </div>
//             <div className="bg-white p-6 rounded-lg shadow-lg">
//               <p className="text-gray-600 mb-4">"Le meilleur salon de la ville. Le personnel est sympathique et professionnel."</p>
//               <p className="font-bold text-gray-900">- Isabelle</p>
//             </div>
//             <div className="bg-white p-6 rounded-lg shadow-lg">
//               <p className="text-gray-600 mb-4">"Je me sens comme une nouvelle femme ! Merci Salon Zenith."</p>
//               <p className="font-bold text-gray-900">- Amélie</p>
//             </div>
//           </div>
//         </section>
//       </main>
//       {/* Footer */}
//       <footer className="bg-gray-800 text-white py-10">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <p>&copy; {new Date().getFullYear()} Salon Zenith. Tous droits réservés.</p>
//           <div className="flex justify-center space-x-6 mt-4">
//             <Link href="#" className="hover:text-pink-400">{t("privacyPolicy")}</Link>
//             <Link href="#" className="hover:text-pink-400">{t("termsOfUse")}</Link>
//             <Link href="#" className="hover:text-pink-400">{t("contactUs")}</Link>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }




// test1



"use client"

import Link from "next/link"
import { gql, useQuery } from "@apollo/client"
import { useState, useMemo } from "react"
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"
import { useRouter } from "next/navigation"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"

const GET_SALONS = gql`
  query GetSalons {
    salons {
      id
      name
      description
      images
    }
  }
`

const GET_SERVICES = gql`
    query GetServices($businessId: ID!, $businessType: String!) {
        services(businessId: $businessId, businessType: $businessType) {
            id
            name
            description
            price
            duration
            category
            images
        }
    }
`

/**
 * Landing page for the salon service.  Presents a luxurious hero
 * section and showcases top salon services with a consistent pink
 * colour scheme.  Visitors are encouraged to book appointments or
 * browse services.
 */
export default function SalonLanding() {
  // Translation and language for this page
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()

  // Router instance to programmatically navigate.  This allows us
  // to redirect to the booking page with a preselected service.
  const router = useRouter()

  const { data: salonsData, loading: salonsLoading, error: salonsError } = useQuery(GET_SALONS)

  const salons = salonsData?.salons || []
  const salon = salons[0] || {}

  const {
    data: servicesData,
    loading: servicesLoading,
    error: servicesError,
  } = useQuery(GET_SERVICES, {
    variables: { businessId: salon.id, businessType: "salon" },
    skip: !salon.id,
  })

  const services = servicesData?.services || []

  // Category filtering for services.  Collect all unique categories and
  // allow the user to filter services by category.  A "Tous" (all)
  // category is provided to reset the filter.  Categories default to
  // "Autres" when none is defined on a service.

  const [selectedCategory, setSelectedCategory] = useState<string>("Tous")
  const filteredServices = useMemo(() => {
    if (selectedCategory === "Tous") return services
    return services.filter((s: any) => (s.category || "Autres") === selectedCategory)
  }, [services, selectedCategory])

  const categories = useMemo(() => {
    const set = new Set<string>()
    services.forEach((s: any) => {
      set.add(s.category || "Autres")
    })
    return ["Tous", ...Array.from(set)]
  }, [services])

  if (salonsLoading || servicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-xl font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Chargement...
          </p>
        </div>
      </div>
    )
  }

  if (salonsError || servicesError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <p className="text-xl font-semibold text-red-600 mb-2">Erreur de chargement</p>
          <p className="text-gray-600">Impossible de charger les données du salon</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-20 border-b border-pink-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">✨</span>
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              {salon.name || "Salon Zenith"}
            </span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <Link href="/salon" className="hover:text-pink-600 transition-colors duration-200 relative group">
              {t("home")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link href="/salon/services" className="hover:text-pink-600 transition-colors duration-200 relative group">
              {t("services")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link href="/salon/about" className="hover:text-pink-600 transition-colors duration-200 relative group">
              {t("aboutUs")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link href="/salon/contact" className="hover:text-pink-600 transition-colors duration-200 relative group">
              {t("contact")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-600 transition-all duration-200 group-hover:w-full"></span>
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setLocale("en")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  locale === "en" ? "bg-white text-pink-600 shadow-sm" : "text-gray-600 hover:text-pink-600"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("fr")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  locale === "fr" ? "bg-white text-pink-600 shadow-sm" : "text-gray-600 hover:text-pink-600"
                }`}
              >
                FR
              </button>
            </div>
            <Link
              href="/salon/booking"
              className="hidden md:inline-block bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:from-pink-700 hover:to-rose-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t("bookNow")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-pink-300 transition-all duration-200"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="relative overflow-hidden">
          <div
            className="relative bg-cover bg-center h-[80vh] flex items-center"
            style={{
              backgroundImage: `url('${salon.images?.[0] || "https://images.unsplash.com/photo-1583267743713-0f36bcbc89e4"}')`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

            {/* Floating elements for visual interest */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-pink-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-32 right-16 w-32 h-32 bg-rose-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>

            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                <span className="block text-balance">{salon.name || t("salonHeroTitle")}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
                {salon.description || t("salonHeroDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/salon/booking"
                  className="inline-block bg-gradient-to-r from-pink-600 to-rose-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-pink-500/25"
                >
                  {t("bookNow")} ✨
                </Link>
                <Link
                  href="/salon/services"
                  className="inline-block bg-white/10 backdrop-blur-sm text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20"
                >
                  Découvrir nos services
                </Link>
              </div>
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              {t("ourServices")}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez notre gamme complète de services de beauté professionnels
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => {
              // Translate "Tous" and "Autres" categories, otherwise show the category name as is
              let displayCat: string
              if (cat === "Tous") {
                displayCat = t("all")
              } else if (cat === "Autres") {
                displayCat = t("others")
              } else {
                displayCat = cat
              }
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/25"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 shadow-sm"
                  }`}
                >
                  {displayCat}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service: any, index: number) => (
              <div
                key={service.id}
                onClick={() => router.push(`/salon/booking?serviceId=${service.id}`)}
                className="group bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {service.images && service.images.length > 0 ? (
                  <div className="relative overflow-hidden">
                    {/* Carousel for service images */}
                    <Carousel className="w-full">
                      <CarouselContent>
                        {service.images.map((img: string, index: number) => (
                          <CarouselItem key={index}>
                            <div className="relative">
                              <img
                                src={img || "/placeholder.svg"}
                                alt={service.name}
                                className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {/* Show navigation controls only if multiple images */}
                      {service.images.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2 bg-white/80 hover:bg-white" />
                          <CarouselNext className="right-2 bg-white/80 hover:bg-white" />
                        </>
                      )}
                    </Carousel>
                  </div>
                ) : (
                  <div className="h-56 bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-pink-600 text-5xl font-bold">
                    {service.name.charAt(0)}
                  </div>
                )}
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors duration-300">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600 h-16 overflow-hidden leading-relaxed">{service.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                      {service.price}€
                    </span>
                    {/* The reserve button is purely decorative; clicking anywhere on the card will navigate */}
                    <span className="inline-flex items-center bg-gradient-to-r from-pink-600 to-rose-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold group-hover:from-pink-700 group-hover:to-rose-700 transition-all duration-300 transform group-hover:scale-105">
                      Réserver
                      <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="mb-16">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                {t("ourExpertStylists")}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Rencontrez notre équipe de professionnels passionnés
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="group text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="relative mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61"
                    alt="Stylist 1"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-pink-200 group-hover:border-pink-400 transition-all duration-300"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✨</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Jessica</h3>
                <p className="text-pink-600 font-semibold mb-3">Spécialiste couleur</p>
                <p className="text-gray-600 text-sm">Expert en colorimétrie avec 8 ans d'expérience</p>
              </div>
              <div className="group text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="relative mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
                    alt="Stylist 2"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-pink-200 group-hover:border-pink-400 transition-all duration-300"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✂️</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Marc</h3>
                <p className="text-pink-600 font-semibold mb-3">Expert en coupe</p>
                <p className="text-gray-600 text-sm">Maître dans l'art de la coupe moderne et classique</p>
              </div>
              <div className="group text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className="relative mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1521119989659-a83eee488004"
                    alt="Stylist 3"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-pink-200 group-hover:border-pink-400 transition-all duration-300"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👑</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sophie</h3>
                <p className="text-pink-600 font-semibold mb-3">Maître styliste</p>
                <p className="text-gray-600 text-sm">15 ans d'expérience en coiffure de luxe</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              {t("whatClientsSay")}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez les témoignages de nos clients satisfaits
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">
                    ⭐
                  </span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed italic">
                "Une expérience incroyable ! Je suis tellement contente de ma nouvelle coupe."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  C
                </div>
                <div>
                  <p className="font-bold text-gray-900">Chloé</p>
                  <p className="text-sm text-gray-500">Cliente fidèle</p>
                </div>
              </div>
            </div>
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">
                    ⭐
                  </span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed italic">
                "Le meilleur salon de la ville. Le personnel est sympathique et professionnel."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  I
                </div>
                <div>
                  <p className="font-bold text-gray-900">Isabelle</p>
                  <p className="text-sm text-gray-500">Cliente VIP</p>
                </div>
              </div>
            </div>
            <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">
                    ⭐
                  </span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed italic">
                "Je me sens comme une nouvelle femme ! Merci Salon Zenith."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  A
                </div>
                <div>
                  <p className="font-bold text-gray-900">Amélie</p>
                  <p className="text-sm text-gray-500">Nouvelle cliente</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">✨</span>
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                Salon Zenith
              </span>
            </div>
            <p className="text-gray-300 mb-6">Votre beauté, notre passion</p>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400 mb-4">&copy; {new Date().getFullYear()} Salon Zenith. Tous droits réservés.</p>
            <div className="flex justify-center space-x-8">
              <Link href="#" className="text-gray-400 hover:text-pink-400 transition-colors duration-200">
                {t("privacyPolicy")}
              </Link>
              <Link href="#" className="text-gray-400 hover:text-pink-400 transition-colors duration-200">
                {t("termsOfUse")}
              </Link>
              <Link href="#" className="text-gray-400 hover:text-pink-400 transition-colors duration-200">
                {t("contactUs")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
