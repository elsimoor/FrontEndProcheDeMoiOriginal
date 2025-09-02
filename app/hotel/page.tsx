// "use client"

// import Link from "next/link"
// import { gql, useQuery } from "@apollo/client"
// import useTranslation from "@/hooks/useTranslation"
// import { useLanguage } from "@/context/LanguageContext"

// const GET_HOTELS = gql`
//   query GetHotels {
//     hotels {
//       id
//       name
//       description
//       images
//     }
//   }
// `

// /**
//  * Landing page for the hotel service.  This page showcases the
//  * hospitality offering and invites visitors to explore rooms and
//  * amenities.  A simple navigation bar provides links to key
//  * sections and a call‑to‑action button directs users to make a
//  * reservation.
//  */
// export default function HotelLanding() {
//   const { data, loading, error } = useQuery(GET_HOTELS)

//   // Translation and language context
//   const { t } = useTranslation()
//   const { locale, setLocale } = useLanguage()

//   if (loading) return <p>Loading...</p>
//   if (error) return <p>Error :(</p>

//   const hotels = data?.hotels || []

//   return (
//     <div className="min-h-screen flex flex-col bg-white">
//       {/* Navbar */}
//       <header className="bg-white shadow-sm sticky top-0 z-20">
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
//           <div className="flex items-center space-x-2">
//             <span className="font-bold text-xl text-blue-600">{t("stayEase")}</span>
//           </div>
//           <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
//             <Link href="/hotel" className="hover:text-blue-600">{t("home")}</Link>
//             <Link href="/hotel/services" className="hover:text-blue-600">{t("services")}</Link>
//             <Link href="/hotel/about" className="hover:text-blue-600">{t("aboutUs")}</Link>
//             <Link href="/hotel/contact" className="hover:text-blue-600">{t("contact")}</Link>
//           </nav>
//           <div className="flex items-center space-x-4">
//             {/* Language selector */}
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => setLocale("en")}
//                 className={`text-sm font-medium ${locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"}`}
//               >
//                 EN
//               </button>
//               <button
//                 onClick={() => setLocale("fr")}
//                 className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"}`}
//               >
//                 FR
//               </button>
//             </div>
//             <Link
//               href="/hotel/search"
//               className="hidden md:inline-block bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors"
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
//         <div className="relative bg-cover bg-center h-[60vh]" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1501117716987-c8e1ecfb3542')` }}>
//           <div className="absolute inset-0 bg-black bg-opacity-50"></div>
//           <div className="max-w-3xl mx-auto px-4 py-24 text-center relative z-10">
//             <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">{t("hotelLandingTitle")}</h1>
//             <p className="text-lg md:text-xl text-gray-100 mb-8">
//               {t("hotelLandingSubtitle")}
//             </p>
//             <Link
//               href="/hotel/search"
//               className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-transform transform hover:scale-105"
//             >
//               {t("findARoom")}
//             </Link>
//           </div>
//         </div>
//         {/* Featured Hotels */}
//         <section className="max-w-7xl mx-auto px-4 py-16">
//           <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">{t("featuredHotels")}</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {hotels.slice(0, 3).map((hotel: any) => (
//               <div key={hotel.id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
//                 <img
//                   src={hotel.images[0] || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511'}
//                   alt={hotel.name}
//                   className="h-56 w-full object-cover"
//                 />
//                 <div className="p-6">
//                   <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
//                   <p className="text-sm text-gray-600 mb-4 h-16 overflow-hidden">{hotel.description}</p>
//                   <Link href={`/hotel/rooms?hotelId=${hotel.id}`} className="text-blue-600 font-semibold hover:underline">
//                     {t("viewRooms")}
//                   </Link>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>
//         {/* Special Offers */}
//         <section className="bg-blue-50 py-16">
//           <div className="max-w-7xl mx-auto px-4 text-center">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4">{t("specialOffers")}</h2>
//             <p className="text-lg text-gray-600 mb-8">{t("specialOffersSubtitle")}</p>
//             <div className="inline-block bg-white p-6 rounded-lg shadow-lg">
//               <p className="text-2xl font-bold text-blue-600">{t("longStayDiscount")}</p>
//               <p className="text-gray-700 mt-2">{t("longStayDetails")}</p>
//             </div>
//           </div>
//         </section>
//         {/* Testimonials */}
//         <section className="max-w-7xl mx-auto px-4 py-16">
//           <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">{t("testimonials")}</h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <div className="bg-white p-6 rounded-lg shadow-lg">
//               <p className="text-gray-600 mb-4">"Un séjour absolument fantastique ! Le personnel était incroyable et les chambres étaient magnifiques."</p>
//               <p className="font-bold text-gray-900">- Jean Dupont</p>
//             </div>
//             <div className="bg-white p-6 rounded-lg shadow-lg">
//               <p className="text-gray-600 mb-4">"Le meilleur hôtel où j'ai séjourné. Propre, moderne et avec une vue imprenable."</p>
//               <p className="font-bold text-gray-900">- Marie Lemaire</p>
//             </div>
//             <div className="bg-white p-6 rounded-lg shadow-lg">
//               <p className="text-gray-600 mb-4">"Je recommande vivement StayEase. Un service 5 étoiles du début à la fin."</p>
//               <p className="font-bold text-gray-900">- Pierre Martin</p>
//             </div>
//           </div>
//         </section>
//       </main>
//       {/* Footer */}
//       <footer className="bg-gray-800 text-white py-10">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <p>&copy; {new Date().getFullYear()} StayEase. Tous droits réservés.</p>
//           <div className="flex justify-center space-x-6 mt-4">
//             <Link href="#" className="hover:text-blue-400">{t("privacyPolicy")}</Link>
//             <Link href="#" className="hover:text-blue-400">{t("termsOfUse")}</Link>
//             <Link href="#" className="hover:text-blue-400">{t("contactUs")}</Link>
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
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"

const GET_HOTELS = gql`
  query GetHotels {
    hotels {
      id
      name
      description
      images
    }
  }
`

/**
 * Landing page for the hotel service.  This page showcases the
 * hospitality offering and invites visitors to explore rooms and
 * amenities.  A simple navigation bar provides links to key
 * sections and a call‑to‑action button directs users to make a
 * reservation.
 */
export default function HotelLanding() {
  const { data, loading, error } = useQuery(GET_HOTELS)

  // Translation and language context
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium text-blue-600">Loading hotels...</p>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-red-600">Error loading hotels</p>
          <p className="text-gray-600 mt-2">Please try again later</p>
        </div>
      </div>
    )

  const hotels = data?.hotels || []

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-20 border-b border-white/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t("brandName")}
            </span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <Link
              href="/hotel"
              className="hover:text-blue-600 transition-colors duration-200 hover:scale-105 transform"
            >
              {t("home")}
            </Link>
            <Link
              href="/hotel/services"
              className="hover:text-blue-600 transition-colors duration-200 hover:scale-105 transform"
            >
              {t("services")}
            </Link>
            <Link
              href="/hotel/about"
              className="hover:text-blue-600 transition-colors duration-200 hover:scale-105 transform"
            >
              {t("aboutUs")}
            </Link>
            <Link
              href="/hotel/contact"
              className="hover:text-blue-600 transition-colors duration-200 hover:scale-105 transform"
            >
              {t("contact")}
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setLocale("en")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  locale === "en" ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-white hover:shadow-sm"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("fr")}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  locale === "fr" ? "bg-blue-600 text-white shadow-md" : "text-gray-700 hover:bg-white hover:shadow-sm"
                }`}
              >
                FR
              </button>
            </div>
            <Link
              href="/hotel/search"
              className="hidden md:inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t("bookNow")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200 transform hover:scale-105"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div
          className="relative bg-cover bg-center h-[70vh] overflow-hidden"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1501117716987-c8e1ecfb3542')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>

          {/* Floating elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>

          <div className="max-w-4xl mx-auto px-4 py-32 text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {t("hotelLandingTitle")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t("hotelLandingSubtitle")}
            </p>
            <Link
              href="/hotel/search"
              className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-blue-500/25"
            >
              {t("findARoom")}
            </Link>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-4">
              {t("featuredHotels")}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.slice(0, 3).map((hotel: any, index: number) => (
              <div
                key={hotel.id}
                className="group bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-3 transition-all duration-500 hover:shadow-2xl border border-gray-100"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={hotel.images[0] || "https://images.unsplash.com/photo-1505691938895-1758d7feb511"}
                    alt={hotel.name}
                    className="h-64 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                    {hotel.name}
                  </h3>
                  <p className="text-gray-600 mb-6 h-20 overflow-hidden leading-relaxed">{hotel.description}</p>
                  <Link
                    href={`/hotel/rooms?hotelId=${hotel.id}`}
                    className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors duration-200 group-hover:translate-x-1 transform"
                  >
                    {t("viewRooms")}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-indigo-300/20 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              {t("specialOffers")}
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">{t("specialOffersSubtitle")}</p>
            <div className="inline-block bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/50 hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {t("longStayDiscount")}
              </p>
              <p className="text-gray-700 text-lg">{t("longStayDetails")}</p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-4">
              {t("testimonials")}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                text: "Un séjour absolument fantastique ! Le personnel était incroyable et les chambres étaient magnifiques.",
                author: "Jean Dupont",
                rating: 5,
              },
              {
                text: "Le meilleur hôtel où j'ai séjourné. Propre, moderne et avec une vue imprenable.",
                author: "Marie Lemaire",
                rating: 5,
              },
              {
                text: "Je recommande vivement StayEase. Un service 5 étoiles du début à la fin.",
                author: "Pierre Martin",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-lg">
                      {testimonial.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-lg">- {testimonial.author}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-indigo-900/20"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              StayEase
            </span>
          </div>
          <p className="text-gray-300 mb-6">&copy; {new Date().getFullYear()} StayEase. Tous droits réservés.</p>
          <div className="flex justify-center space-x-8">
            <Link
              href="#"
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:scale-105 transform"
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              href="#"
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:scale-105 transform"
            >
              {t("termsOfUse")}
            </Link>
            <Link
              href="#"
              className="text-gray-300 hover:text-blue-400 transition-colors duration-200 hover:scale-105 transform"
            >
              {t("contactUs")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
