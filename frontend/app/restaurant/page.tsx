// "use client"

// import Link from "next/link"
// import { gql, useQuery } from "@apollo/client"

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

// const GET_MENU_ITEMS = gql`
//     query GetMenuItems($restaurantId: ID!) {
//         menuItems(restaurantId: $restaurantId) {
//             name
//             description
//             images
//             price
//         }
//     }
// `

// const GET_TABLES = gql`
//     query GetTables($restaurantId: ID!) {
//         tables(restaurantId: $restaurantId) {
//             id
//             number
//             capacity
//             status
//         }
//     }
// `

// /**
//  * Landing page for the restaurant service.  Highlights the cuisine and
//  * atmosphere of the restaurant and encourages guests to book a table.
//  */
// const RestaurantSection = ({ restaurant }: { restaurant: any }) => {
//   const { data: menuItemsData, loading: menuItemsLoading, error: menuItemsError } = useQuery(GET_MENU_ITEMS, {
//     variables: { restaurantId: restaurant.id },
//   });

//   const { data: tablesData, loading: tablesLoading, error: tablesError } = useQuery(GET_TABLES, {
//     variables: { restaurantId: restaurant.id },
//   });

//   if (menuItemsLoading || tablesLoading) return <p>Loading...</p>;
//   if (menuItemsError || tablesError) return <p>Error :(</p>;

//   const menuItems = menuItemsData?.menuItems || [];
//   const tables = tablesData?.tables || [];

//   return (
//     <div className="mb-16">
//       <div
//         className="relative bg-cover bg-center h-[70vh]"
//         style={{ backgroundImage: `url('${restaurant.images?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5'}')` }}
//       >
//         <div className="absolute inset-0 bg-black bg-opacity-40"></div>
//         <div className="max-w-3xl mx-auto px-4 py-24 text-center relative z-10">
//           <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
//             {restaurant.name}
//           </h1>
//           <p className="text-lg md:text-xl text-gray-100 mb-8">
//             {restaurant.description}
//           </p>
//           <Link
//             href={`/restaurant/booking?restaurantId=${restaurant.id}`}
//             className="inline-block bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-700 transition-transform transform hover:scale-105"
//           >
//             Réserver une table
//           </Link>
//         </div>
//       </div>
//       <section className="max-w-7xl mx-auto px-4 py-16">
//         <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">Notre Menu</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//           {menuItems.slice(0, 6).map((item: any) => (
//             <div key={item.name} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
//               <div className="p-6">
//                 <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
//                 <p className="text-sm text-gray-600 mb-4 h-16 overflow-hidden">{item.description}</p>
//                 <div className="flex justify-between items-center">
//                   <span className="text-lg font-bold text-red-600">{item.price}€</span>
//                   <Link href={`/restaurant/menus?restaurantId=${restaurant.id}`} className="text-red-600 font-semibold hover:underline">
//                     Voir le menu
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>
//       <section className="bg-gray-100 py-16">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <h2 className="text-4xl font-bold text-gray-900 mb-10">Nos Tables</h2>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
//             {tables.map((table: any) => (
//               <div key={table.id} className="bg-white rounded-lg shadow-lg p-6">
//                 <h3 className="text-2xl font-bold mb-2">Table {table.number}</h3>
//                 <p className="text-gray-600">Capacité: {table.capacity}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   )
// }

// export default function RestaurantLanding() {
//   const { data: restaurantsData, loading: restaurantsLoading, error: restaurantsError } = useQuery(GET_RESTAURANTS)

//   if (restaurantsLoading) return <p>Loading...</p>
//   if (restaurantsError) return <p>Error :(</p>

//   const restaurants = restaurantsData?.restaurants || []

//   return (
//     <div className="min-h-screen flex flex-col bg-white">
//       {/* Navbar */}
//       <header className="bg-white shadow-sm sticky top-0 z-20">
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
//           <div className="flex items-center space-x-2">
//             <span className="font-bold text-xl text-red-600">Gastronomie</span>
//           </div>
//           <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
//             <Link href="/restaurant" className="hover:text-red-600">Accueil</Link>
//             <Link href="/restaurant/menus" className="hover:text-red-600">Menus</Link>
//             <Link href="/restaurant/gallery" className="hover:text-red-600">Galerie</Link>
//             <Link href="/restaurant/contact" className="hover:text-red-600">Contact</Link>
//           </nav>
//           <div className="flex items-center space-x-4">
//             <Link
//               href="/restaurant/booking"
//               className="hidden md:inline-block bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition-colors"
//             >
//               Réserver
//             </Link>
//             <Link
//               href="/login"
//               className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
//             >
//               Se connecter
//             </Link>
//           </div>
//         </div>
//       </header>
//       {/* Hero */}
//       <main className="flex-1">
//         {restaurants.map((restaurant: any) => (
//             <RestaurantSection key={restaurant.id} restaurant={restaurant} />
//         ))}
//         {/* Reservation Info */}
//         <section className="max-w-7xl mx-auto px-4 py-16 text-center">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4">Réservez Votre Table</h2>
//             <p className="text-lg text-gray-600 mb-8">Appelez-nous au <a href="tel:+123456789" className="text-red-600 hover:underline">123-456-789</a> ou réservez en ligne.</p>
//             <Link href="/restaurant/booking" className="inline-block bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-700 transition-transform transform hover:scale-105">
//                 Réserver en ligne
//             </Link>
//         </section>
//       </main>
//       {/* Footer */}
//       <footer className="bg-gray-800 text-white py-10">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <p>&copy; {new Date().getFullYear()} Gastronomie. Tous droits réservés.</p>
//           <div className="flex justify-center space-x-6 mt-4">
//             <Link href="#" className="hover:text-red-400">Politique de confidentialité</Link>
//             <Link href="#" className="hover:text-red-400">Conditions d’utilisation</Link>
//             <Link href="#" className="hover:text-red-400">Nous contacter</Link>
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
import { useState, useRef } from "react"
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

const GET_MENU_ITEMS = gql`
  query GetMenuItems($restaurantId: ID!) {
    menuItems(restaurantId: $restaurantId) {
      name
      description
      images
      price
    }
  }
`

const GET_TABLES = gql`
  query GetTables($restaurantId: ID!) {
    tables(restaurantId: $restaurantId) {
      id
      number
      capacity
      status
    }
  }
`

/** ---------- MiniCarousel (drop-in, no libs) ---------- */
function MiniCarousel({
  images = [],
  alt = "",
  heightClass = "h-40 md:h-48",
}: {
  images?: string[]
  alt?: string
  heightClass?: string
}) {
  const safeImages =
    images && images.length > 0
      ? images
      : ["https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop"] // fallback

  const [idx, setIdx] = useState(0)
  const clamp = (n: number) => (n + safeImages.length) % safeImages.length

  const startX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) > 40) {
      setIdx((i) => clamp(i + (dx < 0 ? 1 : -1)))
    }
    startX.current = null
  }

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden bg-gray-100`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${idx * 100}%)` }}
      >
        {safeImages.map((src, i) => (
          <div key={i} className="min-w-full h-full">
            {/* Use <img> to avoid Next Image domain config */}
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      {safeImages.length > 1 && (
        <>
          <button
            aria-label="Previous image"
            onClick={() => setIdx((i) => clamp(i - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white px-2 py-1 text-sm hover:bg-black/60"
          >
            ‹
          </button>
          <button
            aria-label="Next image"
            onClick={() => setIdx((i) => clamp(i + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white px-2 py-1 text-sm hover:bg-black/60"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {safeImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {safeImages.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Landing page for the restaurant service. Highlights the cuisine and atmosphere.
 */
const RestaurantSection = ({ restaurant }: { restaurant: any }) => {
  const { t } = useTranslation();
  const { data: menuItemsData, loading: menuItemsLoading, error: menuItemsError } = useQuery(GET_MENU_ITEMS, {
    variables: { restaurantId: restaurant.id },
  })

  const { data: tablesData, loading: tablesLoading, error: tablesError } = useQuery(GET_TABLES, {
    variables: { restaurantId: restaurant.id },
  })

  if (menuItemsLoading || tablesLoading) return <p>Loading...</p>
  if (menuItemsError || tablesError) return <p>Error :(</p>

  const menuItems = menuItemsData?.menuItems || []
  const tables = tablesData?.tables || []

  return (
    <div className="mb-16">
      <div
        className="relative bg-cover bg-center h-[70vh]"
        style={{
          backgroundImage: `url('${
            restaurant.images?.[0] ||
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
          }')`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {restaurant.name}
          </h1>
          <p className="text-lg md:text-xl text-gray-100 mb-8">
            {restaurant.description}
          </p>
          <Link
            href={`/restaurant/booking?restaurantId=${restaurant.id}`}
            className="inline-block bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-700 transition-transform transform hover:scale-105"
          >
            {t("bookTable")}
          </Link>
        </div>
      </div>

      {/* -------- Menu with image carousels -------- */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">{t("ourMenu")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.slice(0, 6).map((item: any) => (
            <div
              key={item.name}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300"
            >
              {/* Carousel on the card */}
              <MiniCarousel images={item.images} alt={item.name} />

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-4 h-16 overflow-hidden">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-red-600">{item.price}€</span>
                  <Link
                    href={`/restaurant/menus?restaurantId=${restaurant.id}`}
                    className="text-red-600 font-semibold hover:underline"
                  >
                    {t("viewMenu")}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tables */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-10">{t("ourTables")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {tables.map((table: any) => (
              <div key={table.id} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-2">{t("table")} {table.number}</h3>
                <p className="text-gray-600">{t("capacity")}: {table.capacity}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default function RestaurantLanding() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();
  const { data: restaurantsData, loading: restaurantsLoading, error: restaurantsError } = useQuery(GET_RESTAURANTS)

  if (restaurantsLoading) return <p>Loading...</p>
  if (restaurantsError) return <p>Error :(</p>

  const restaurants = restaurantsData?.restaurants || []

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-red-600">Gastronomie</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <Link href="/restaurant" className="hover:text-red-600">{t("home")}</Link>
            <Link href="/restaurant/menus" className="hover:text-red-600">{t("menus")}</Link>
            <Link href="/restaurant/gallery" className="hover:text-red-600">{t("gallery")}</Link>
            <Link href="/restaurant/contact" className="hover:text-red-600">{t("contact")}</Link>
          </nav>
          <div className="flex items-center space-x-4">
            {/* Language selector */}
            <div className="flex items-center space-x-2">
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
            <Link
              href="/restaurant/booking"
              className="hidden md:inline-block bg-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              {t("reserve")}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + sections */}
      <main className="flex-1">
        {restaurants.map((restaurant: any) => (
          <RestaurantSection key={restaurant.id} restaurant={restaurant} />
        ))}

        {/* Reservation Info */}
        <section className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Réservez Votre Table</h2>
          <p className="text-lg text-gray-600 mb-8">
            Appelez-nous au <a href="tel:+123456789" className="text-red-600 hover:underline">123-456-789</a> ou réservez en ligne.
          </p>
          <Link
            href="/restaurant/booking"
            className="inline-block bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-700 transition-transform transform hover:scale-105"
          >
            Réserver en ligne
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Gastronomie. Tous droits réservés.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link href="#" className="hover:text-red-400">Politique de confidentialité</Link>
            <Link href="#" className="hover:text-red-400">Conditions d’utilisation</Link>
            <Link href="#" className="hover:text-red-400">Nous contacter</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
