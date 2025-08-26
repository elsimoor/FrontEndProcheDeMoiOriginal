// "use client"

// import { useState, useMemo } from "react";
// import Link from "next/link";
// import { gql, useQuery } from "@apollo/client";
// import {
//   Search,
//   CheckCircle,
//   Calendar,
//   Users,
//   Shield,
//   Clock,
// } from "lucide-react";

// // GraphQL queries to fetch hotels, restaurants and salons.  We only
// // request the minimal fields needed for the landing page: id, name,
// // description and the first image.  The same queries are used in
// // dedicated module landing pages so this page remains consistent.
// const GET_HOTELS = gql`
//   query GetHotels {
//     hotels {
//       id
//       name
//       description
//       images
//     }
//   }
// `;

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

// const GET_SALONS = gql`
//   query GetSalons {
//     salons {
//       id
//       name
//       description
//       images
//     }
//   }
// `;

// /**
//  * The root landing page provides a unified search and discovery
//  * experience across hotels, restaurants and salons.  Visitors can
//  * filter by category and search by name.  Below the search area
//  * featured entries for each category are displayed with call‑to‑action
//  * links.  Additional sections highlight key platform benefits and
//  * encourage users to explore further.
//  */
// export default function LandingPage() {
//   // Execute the GraphQL queries concurrently.  Apollo will cache
//   // responses and avoid redundant network requests when navigating to
//   // individual module pages.
//   const { data: hotelsData, loading: hotelsLoading, error: hotelsError } = useQuery(GET_HOTELS);
//   const { data: restaurantsData, loading: restaurantsLoading, error: restaurantsError } = useQuery(GET_RESTAURANTS);
//   const { data: salonsData, loading: salonsLoading, error: salonsError } = useQuery(GET_SALONS);

//   // Local state for the search term and selected categories.  The
//   // selectedTypes set contains the categories the user wants to see.
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(["hotel", "restaurant", "salon"]));

//   // Sort option for results.  Users can choose to sort alphabetically
//   // ascending or descending.  Additional sort options could be added
//   // here in the future (e.g. by rating or price) when such data
//   // becomes available.
//   const [sortOption, setSortOption] = useState<string>("nameAsc");

//   // Helper to toggle a category on or off.  We use a Set to ensure
//   // uniqueness and efficient updates.  When a category is removed
//   // the corresponding items will no longer appear in the results.
//   const toggleType = (type: string) => {
//     setSelectedTypes((prev) => {
//       const set = new Set(prev);
//       if (set.has(type)) {
//         set.delete(type);
//       } else {
//         set.add(type);
//       }
//       return set;
//     });
//   };

//   // Derived arrays of hotels, restaurants and salons with optional
//   // filtering by search term and selected categories.  The filtering
//   // runs in a `useMemo` hook to avoid unnecessary work on every
//   // re‑render.  Each entry includes its type so we can easily
//   // categorise them later.
//   const hotels = hotelsData?.hotels ?? [];
//   const restaurants = restaurantsData?.restaurants ?? [];
//   const salons = salonsData?.salons ?? [];

//   const filteredHotels = useMemo(() => {
//     if (!selectedTypes.has("hotel")) return [];
//     return hotels.filter((h: any) =>
//       h.name.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [hotels, searchTerm, selectedTypes]);

//   const filteredRestaurants = useMemo(() => {
//     if (!selectedTypes.has("restaurant")) return [];
//     return restaurants.filter((r: any) =>
//       r.name.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [restaurants, searchTerm, selectedTypes]);

//   const filteredSalons = useMemo(() => {
//     if (!selectedTypes.has("salon")) return [];
//     return salons.filter((s: any) =>
//       s.name.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [salons, searchTerm, selectedTypes]);

//   // Sort the filtered results according to the selected sort option.  We
//   // copy arrays before sorting to avoid mutating the original filtered
//   // arrays.  Sorting by name is case‑insensitive.
//   const sortedHotels = useMemo(() => {
//     const list = [...filteredHotels];
//     list.sort((a, b) => {
//       const nameA = a.name.toLowerCase();
//       const nameB = b.name.toLowerCase();
//       if (sortOption === "nameDesc") {
//         if (nameA < nameB) return 1;
//         if (nameA > nameB) return -1;
//         return 0;
//       }
//       // Default to ascending
//       if (nameA < nameB) return -1;
//       if (nameA > nameB) return 1;
//       return 0;
//     });
//     return list;
//   }, [filteredHotels, sortOption]);

//   const sortedRestaurants = useMemo(() => {
//     const list = [...filteredRestaurants];
//     list.sort((a, b) => {
//       const nameA = a.name.toLowerCase();
//       const nameB = b.name.toLowerCase();
//       if (sortOption === "nameDesc") {
//         if (nameA < nameB) return 1;
//         if (nameA > nameB) return -1;
//         return 0;
//       }
//       if (nameA < nameB) return -1;
//       if (nameA > nameB) return 1;
//       return 0;
//     });
//     return list;
//   }, [filteredRestaurants, sortOption]);

//   const sortedSalons = useMemo(() => {
//     const list = [...filteredSalons];
//     list.sort((a, b) => {
//       const nameA = a.name.toLowerCase();
//       const nameB = b.name.toLowerCase();
//       if (sortOption === "nameDesc") {
//         if (nameA < nameB) return 1;
//         if (nameA > nameB) return -1;
//         return 0;
//       }
//       if (nameA < nameB) return -1;
//       if (nameA > nameB) return 1;
//       return 0;
//     });
//     return list;
//   }, [filteredSalons, sortOption]);

//   // Handle loading and error states gracefully.  A minimal
//   // implementation is sufficient for demonstration; in a real app
//   // skeleton screens and more descriptive errors could be added.
//   if (hotelsLoading || restaurantsLoading || salonsLoading) {
//     return <p className="p-8 text-center">Loading...</p>;
//   }
//   if (hotelsError || restaurantsError || salonsError) {
//     return <p className="p-8 text-center text-red-500">Une erreur est survenue lors du chargement des données.</p>;
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-white">
//       {/* Navbar */}
//       <header className="bg-white shadow-sm sticky top-0 z-20">
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
//           <div className="flex items-center space-x-2">
//             <span className="font-bold text-xl text-blue-600">ProcheDeMoi</span>
//           </div>
//           <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
//             <Link href="/" className="hover:text-blue-600">Accueil</Link>
//             <Link href="/product" className="hover:text-blue-600">Produit</Link>
//             <Link href="/hotel" className="hover:text-blue-600">Hotels</Link>
//             <Link href="/restaurant" className="hover:text-blue-600">Restaurants</Link>
//             <Link href="/salon" className="hover:text-blue-600">Salons</Link>
//           </nav>
//           <div className="flex items-center space-x-4">
//             <Link
//               href="/login"
//               className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
//             >
//               Se connecter
//             </Link>
//           </div>
//         </div>
//       </header>
//       {/* Hero and Search */}
//       <main className="flex-1">
//         <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
//           <div className="max-w-3xl mx-auto text-center mb-8">
//             <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
//               Découvrez et réservez votre prochaine expérience
//             </h1>
//             <p className="text-lg text-gray-600">
//               Trouvez le meilleur hôtel, restaurant ou salon de beauté et réservez en quelques clics.
//             </p>
//           </div>
//           <div className="max-w-5xl mx-auto flex flex-col gap-4">
//             {/* Primary search row */}
//             <div className="flex flex-col sm:flex-row items-stretch gap-4">
//               <div className="relative flex-1 w-full">
//                 <input
//                   type="text"
//                   placeholder="Rechercher par nom..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full border border-gray-300 rounded-full py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 />
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
//               </div>
//               {/* Sort dropdown */}
//               <div className="flex items-center space-x-2">
//                 <label htmlFor="sort" className="text-sm text-gray-700 whitespace-nowrap">Trier par:</label>
//                 <select
//                   id="sort"
//                   value={sortOption}
//                   onChange={(e) => setSortOption(e.target.value)}
//                   className="border border-gray-300 rounded-full py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
//                 >
//                   <option value="nameAsc">Nom A → Z</option>
//                   <option value="nameDesc">Nom Z → A</option>
//                 </select>
//               </div>
//             </div>
//             {/* Category filters */}
//             <div className="flex flex-wrap items-center gap-4">
//               {[
//                 { type: "hotel", label: "Hôtels", color: "blue" },
//                 { type: "restaurant", label: "Restaurants", color: "red" },
//                 { type: "salon", label: "Salons", color: "pink" },
//               ].map(({ type, label }) => (
//                 <label key={type} className="flex items-center space-x-2 cursor-pointer select-none text-sm">
//                   <input
//                     type="checkbox"
//                     checked={selectedTypes.has(type)}
//                     onChange={() => toggleType(type)}
//                     className="h-4 w-4 border-gray-300 rounded"
//                   />
//                   <span className="capitalize">{label}</span>
//                 </label>
//               ))}
//             </div>
//           </div>
//         </section>
//         {/* Hotels Section */}
//         <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           <h2 className="text-3xl font-bold text-gray-900 mb-6">Hôtels</h2>
//           {filteredHotels.length === 0 ? (
//             <p className="text-gray-600">Aucun hôtel ne correspond à votre recherche.</p>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {sortedHotels.map((hotel: any) => (
//                 <div
//                   key={hotel.id}
//                   className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
//                 >
//                   <img
//                     src={hotel.images?.[0] || "/placeholder.jpg"}
//                     alt={hotel.name}
//                     className="h-48 w-full object-cover"
//                   />
//                   <div className="p-6 flex flex-col flex-1">
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2 flex-1">{hotel.name}</h3>
//                     <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
//                       {hotel.description}
//                     </p>
//                     <Link
//                       href={`/hotel/rooms?hotelId=${hotel.id}`}
//                       className="mt-auto inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
//                     >
//                       Voir les chambres
//                     </Link>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//         {/* Restaurants Section */}
//         <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
//           <h2 className="text-3xl font-bold text-gray-900 mb-6">Restaurants</h2>
//           {filteredRestaurants.length === 0 ? (
//             <p className="text-gray-600">Aucun restaurant ne correspond à votre recherche.</p>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {sortedRestaurants.map((restaurant: any) => (
//                 <div
//                   key={restaurant.id}
//                   className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
//                 >
//                   <img
//                     src={restaurant.images?.[0] || "/placeholder.jpg"}
//                     alt={restaurant.name}
//                     className="h-48 w-full object-cover"
//                   />
//                   <div className="p-6 flex flex-col flex-1">
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2 flex-1">{restaurant.name}</h3>
//                     <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
//                       {restaurant.description}
//                     </p>
//                     <Link
//                       href={`/restaurant/booking?restaurantId=${restaurant.id}`}
//                       className="mt-auto inline-block bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
//                     >
//                       Réserver une table
//                     </Link>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//         {/* Salons Section */}
//         <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           <h2 className="text-3xl font-bold text-gray-900 mb-6">Salons</h2>
//           {filteredSalons.length === 0 ? (
//             <p className="text-gray-600">Aucun salon ne correspond à votre recherche.</p>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {sortedSalons.map((salon: any) => (
//                 <div
//                   key={salon.id}
//                   className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col"
//                 >
//                   <img
//                     src={salon.images?.[0] || "/placeholder.jpg"}
//                     alt={salon.name}
//                     className="h-48 w-full object-cover"
//                   />
//                   <div className="p-6 flex flex-col flex-1">
//                     <h3 className="text-xl font-semibold text-gray-900 mb-2 flex-1">{salon.name}</h3>
//                     <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
//                       {salon.description}
//                     </p>
//                     <Link
//                       href="/salon/booking"
//                       className="mt-auto inline-block bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-700 transition-colors"
//                     >
//                       Réserver un service
//                     </Link>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//         {/* Features Section */}
//         <section className="bg-gray-100 py-16">
//           <div className="max-w-7xl mx-auto px-4 text-center">
//             <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Pourquoi choisir ProcheDeMoi ?</h2>
//             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
//               <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
//                 <Calendar className="h-8 w-8 text-blue-600 mb-3" />
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion intelligente des réservations</h3>
//                 <p className="text-sm text-gray-600">
//                   Planifiez vos rendez‑vous, chambres et tables avec un système qui évite les conflits et envoie des confirmations automatiques.
//                 </p>
//               </div>
//               <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
//                 <Users className="h-8 w-8 text-green-600 mb-3" />
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">Fidélisez vos clients</h3>
//                 <p className="text-sm text-gray-600">
//                   Accédez à l’historique et aux préférences de vos clients et créez des expériences personnalisées qui les feront revenir.
//                 </p>
//               </div>
//               <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
//                 <Shield className="h-8 w-8 text-purple-600 mb-3" />
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">Sécurisé et fiable</h3>
//                 <p className="text-sm text-gray-600">
//                   Profitez d’une infrastructure de niveau entreprise avec sauvegardes automatiques et disponibilité garantie.
//                 </p>
//               </div>
//               <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
//                 <Clock className="h-8 w-8 text-orange-600 mb-3" />
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">Assistance 24/7</h3>
//                 <p className="text-sm text-gray-600">
//                   Une équipe à votre écoute à toute heure pour que votre activité ne connaisse aucune interruption.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>
//       </main>
//       {/* Footer */}
//       <footer className="bg-gray-800 text-white py-8">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <p>&copy; {new Date().getFullYear()} ProcheDeMoi. Tous droits réservés.</p>
//           <div className="flex justify-center space-x-6 mt-4 text-sm">
//             <Link href="#" className="hover:text-blue-400">Politique de confidentialité</Link>
//             <Link href="#" className="hover:text-blue-400">Conditions d’utilisation</Link>
//             <Link href="#" className="hover:text-blue-400">Nous contacter</Link>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }






// test1






"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import Link from "next/link"
import { gql, useQuery } from "@apollo/client"
import {
  Search,
  X,
  MapPin,
  Star,
  DollarSign,
  Calendar,
  Users,
  Shield,
  Clock,
  SlidersHorizontal,
  Grid,
  List,
  Zap,
  Heart,
  Bookmark,
  TrendingUp,
  Award,
  Utensils,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const GET_HOTELS = gql`
  query GetHotels {
    hotels {
      id
      name
      description
      images
      # Fetch the featured landing card for each hotel.  This card is
      # selected by the hotel manager via the dashboard and contains
      # promotional information such as rating, price, location, tags
      # and amenities.  If no card has been set as featured this
      # field will be null.
      featuredLandingCard {
        id
        title
        description
        image
        price
        rating
        location
        tags
        amenities
        specialOffer
      }
    }
  }
`

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

interface FilterState {
  searchTerm: string
  categories: Set<string>
  priceRange: [number, number]
  ratingMin: number
  locations: Set<string>
  amenities: Set<string>
  tags: Set<string>
  sortBy: string
  viewMode: "grid" | "list"
  availability: string
  specialOffers: boolean
  instantBooking: boolean
  popularityMin: number
  distanceMax: number
  openNow: boolean
  searchHistory: string[]
}

const initialFilterState: FilterState = {
  searchTerm: "",
  categories: new Set(["hotel", "restaurant", "salon"]),
  priceRange: [0, 500],
  ratingMin: 0,
  locations: new Set(),
  amenities: new Set(),
  tags: new Set(),
  sortBy: "relevance",
  viewMode: "grid",
  availability: "any",
  specialOffers: false,
  instantBooking: false,
  popularityMin: 0,
  distanceMax: 50,
  openNow: false,
  searchHistory: [],
}

const quickFilters = [
  { id: "popular", label: "Populaires", icon: TrendingUp, filters: { ratingMin: 4.0, popularityMin: 70 } },
  { id: "luxury", label: "Luxe", icon: Award, filters: { priceRange: [200, 500], tags: new Set(["Luxe"]) } },
  { id: "budget", label: "Économique", icon: DollarSign, filters: { priceRange: [0, 100] } },
  { id: "nearby", label: "À proximité", icon: MapPin, filters: { distanceMax: 10 } },
  { id: "offers", label: "Offres spéciales", icon: Zap, filters: { specialOffers: true } },
  { id: "instant", label: "Réservation immédiate", icon: Clock, filters: { instantBooking: true } },
]

export default function EnhancedLandingPage() {
  const { data: hotelsData, loading: hotelsLoading, error: hotelsError } = useQuery(GET_HOTELS)
  const { data: restaurantsData, loading: restaurantsLoading, error: restaurantsError } = useQuery(GET_RESTAURANTS)
  const { data: salonsData, loading: salonsLoading, error: salonsError } = useQuery(GET_SALONS)

  const [filters, setFilters] = useState<FilterState>(initialFilterState)
  const [showFilters, setShowFilters] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [savedSearches, setSavedSearches] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: false,
    rating: false,
    location: false,
    amenities: false,
    tags: false,
    advanced: false,
  })

  const hotels = useMemo(() => {
    const cityList = ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux", "Toulouse"]
    return (hotelsData?.hotels ?? []).map((hotel: any, index: number) => {
      const card = hotel.featuredLandingCard
      // Use card values when available, otherwise fall back to default/random values
      const rating = typeof card?.rating === 'number' ? card.rating : 3.5 + Math.random() * 1.5
      const price = typeof card?.price === 'number' ? card.price : Math.floor(80 + Math.random() * 320)
      const location = card?.location || cityList[index % cityList.length]
      const amenities = Array.isArray(card?.amenities) && card.amenities.length > 0
        ? card.amenities
        : [
            "WiFi",
            "Parking",
            "Piscine",
            "Spa",
            "Restaurant",
            "Climatisation",
            "Room Service",
          ].slice(0, 3 + Math.floor(Math.random() * 4))
      const tags = Array.isArray(card?.tags) && card.tags.length > 0
        ? card.tags
        : ["Luxe", "Familial", "Business", "Romantique", "Écologique", "Moderne"].slice(
            0,
            2 + Math.floor(Math.random() * 2),
          )
      const specialOffer = typeof card?.specialOffer === 'boolean' ? card.specialOffer : Math.random() > 0.7
      return {
        ...hotel,
        type: "hotel",
        // Use the card's rating/price for sorting and display.  The rest of the
        // properties remain the same as before.  The priceRange property is
        // simplified to a number to match the original structure used in
        // filters and sorting.
        rating,
        priceRange: price,
        location,
        amenities,
        tags,
        popularity: Math.floor(30 + Math.random() * 70),
        distance: Math.floor(1 + Math.random() * 45),
        specialOffer,
        instantBooking: Math.random() > 0.6,
        openNow: Math.random() > 0.3,
        cuisine: null,
        services: null,
      }
    })
  }, [hotelsData])

  const restaurants = useMemo(() => {
    return (restaurantsData?.restaurants ?? []).map((restaurant: any, index: number) => ({
      ...restaurant,
      type: "restaurant",
      rating: 3.0 + Math.random() * 2.0,
      priceRange: Math.floor(15 + Math.random() * 85),
      location: ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux", "Toulouse"][index % 6],
      cuisine: ["Française", "Italienne", "Asiatique", "Méditerranéenne", "Japonaise", "Indienne"][index % 6],
      amenities: ["Terrasse", "Parking", "WiFi", "Climatisation", "Livraison", "À emporter"].slice(
        0,
        2 + Math.floor(Math.random() * 3),
      ),
      tags: ["Gastronomique", "Familial", "Romantique", "Décontracté", "Végétarien", "Bio"].slice(
        0,
        2 + Math.floor(Math.random() * 2),
      ),
      popularity: Math.floor(25 + Math.random() * 75),
      distance: Math.floor(1 + Math.random() * 40),
      specialOffer: Math.random() > 0.6,
      instantBooking: Math.random() > 0.5,
      openNow: Math.random() > 0.4,
      services: null,
    }))
  }, [restaurantsData])

  const salons = useMemo(() => {
    return (salonsData?.salons ?? []).map((salon: any, index: number) => ({
      ...salon,
      type: "salon",
      rating: 3.8 + Math.random() * 1.2,
      priceRange: Math.floor(25 + Math.random() * 125),
      location: ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux", "Toulouse"][index % 6],
      services: ["Coiffure", "Manucure", "Massage", "Soins du visage", "Épilation", "Maquillage"].slice(
        0,
        3 + Math.floor(Math.random() * 3),
      ),
      amenities: ["WiFi", "Parking", "Climatisation", "Produits bio", "Café offert"].slice(
        0,
        2 + Math.floor(Math.random() * 3),
      ),
      tags: ["Luxe", "Bio", "Tendance", "Relaxant", "Unisexe", "Spécialisé"].slice(
        0,
        2 + Math.floor(Math.random() * 2),
      ),
      popularity: Math.floor(35 + Math.random() * 65),
      distance: Math.floor(1 + Math.random() * 35),
      specialOffer: Math.random() > 0.65,
      instantBooking: Math.random() > 0.7,
      openNow: Math.random() > 0.5,
      cuisine: null,
    }))
  }, [salonsData])

  const generateSearchSuggestions = useCallback(
    (term: string) => {
      if (!term || term.length < 2) {
        setSearchSuggestions([])
        return
      }

      const allItems = [...hotels, ...restaurants, ...salons]
      const suggestions = new Set<string>()

      allItems.forEach((item) => {
        // Name suggestions
        if (item.name.toLowerCase().includes(term.toLowerCase())) {
          suggestions.add(item.name)
        }

        // Tag suggestions
        if (Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            if (tag.toLowerCase().includes(term.toLowerCase())) {
              suggestions.add(tag)
            }
          })
        }

        // Location suggestions
        if (item.location.toLowerCase().includes(term.toLowerCase())) {
          suggestions.add(item.location)
        }

        // Cuisine/Services suggestions
        if (item.cuisine && item.cuisine.toLowerCase().includes(term.toLowerCase())) {
          suggestions.add(item.cuisine)
        }

        if (Array.isArray(item.services)) {
          item.services.forEach((service: string) => {
            if (service.toLowerCase().includes(term.toLowerCase())) {
              suggestions.add(service)
            }
          })
        }
      })

      setSearchSuggestions(Array.from(suggestions).slice(0, 8))
    },
    [hotels, restaurants, salons],
  )

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      generateSearchSuggestions(filters.searchTerm)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [filters.searchTerm, generateSearchSuggestions])

  const filteredAndSortedResults = useMemo(() => {
    let allItems: any[] = []

    if (filters.categories.has("hotel")) allItems.push(...hotels)
    if (filters.categories.has("restaurant")) allItems.push(...restaurants)
    if (filters.categories.has("salon")) allItems.push(...salons)

    // Enhanced search - fuzzy matching across multiple fields
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      allItems = allItems.filter((item) => {
        const searchableText = [
          item.name,
          item.description,
          item.location,
          item.cuisine,
          ...(Array.isArray(item.tags) ? item.tags : []),
          ...(Array.isArray(item.services) ? item.services : []),
          ...(Array.isArray(item.amenities) ? item.amenities : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return searchableText.includes(searchLower)
      })
    }

    // Apply all filters
    allItems = allItems.filter((item) => {
      return (
        item.priceRange >= filters.priceRange[0] &&
        item.priceRange <= filters.priceRange[1] &&
        item.rating >= filters.ratingMin &&
        item.popularity >= filters.popularityMin &&
        item.distance <= filters.distanceMax &&
        (filters.locations.size === 0 || filters.locations.has(item.location)) &&
        (filters.amenities.size === 0 ||
          Array.from(filters.amenities).some((amenity) =>
            Array.isArray(item.amenities) ? item.amenities.includes(amenity) : item.amenities === amenity,
          )) &&
        (filters.tags.size === 0 ||
          Array.from(filters.tags).some((tag) =>
            Array.isArray(item.tags) ? item.tags.includes(tag) : item.tags === tag,
          )) &&
        (!filters.specialOffers || item.specialOffer) &&
        (!filters.instantBooking || item.instantBooking) &&
        (!filters.openNow || item.openNow)
      )
    })

    // Enhanced sorting with more options
    allItems.sort((a, b) => {
      switch (filters.sortBy) {
        case "nameDesc":
          return b.name.localeCompare(a.name)
        case "ratingDesc":
          return b.rating - a.rating
        case "ratingAsc":
          return a.rating - b.rating
        case "priceAsc":
          return a.priceRange - b.priceRange
        case "priceDesc":
          return b.priceRange - a.priceRange
        case "popularityDesc":
          return b.popularity - a.popularity
        case "distanceAsc":
          return a.distance - b.distance
        case "relevance":
          // Relevance based on rating, popularity, and special offers
          const scoreA = a.rating * 0.4 + (a.popularity / 100) * 0.3 + (a.specialOffer ? 0.3 : 0)
          const scoreB = b.rating * 0.4 + (b.popularity / 100) * 0.3 + (b.specialOffer ? 0.3 : 0)
          return scoreB - scoreA
        default: // nameAsc
          return a.name.localeCompare(b.name)
      }
    })

    return allItems
  }, [hotels, restaurants, salons, filters])

  const filterOptions = useMemo(() => {
    const allItems = [...hotels, ...restaurants, ...salons]
    return {
      locations: [...new Set(allItems.map((item) => item.location))].sort(),
      amenities: [
        ...new Set(allItems.flatMap((item) => (Array.isArray(item.amenities) ? item.amenities : [item.amenities]))),
      ]
        .filter(Boolean)
        .sort(),
      tags: [...new Set(allItems.flatMap((item) => (Array.isArray(item.tags) ? item.tags : [item.tags])))]
        .filter(Boolean)
        .sort(),
    }
  }, [hotels, restaurants, salons])

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleSetFilter = useCallback((key: "categories" | "locations" | "amenities" | "tags", value: string) => {
    setFilters((prev) => {
      const newSet = new Set(prev[key])
      if (newSet.has(value)) {
        newSet.delete(value)
      } else {
        newSet.add(value)
      }
      return { ...prev, [key]: newSet }
    })
  }, [])

  const applyQuickFilter = useCallback((filterId: string) => {
    const quickFilter = quickFilters.find((f) => f.id === filterId)
    if (quickFilter) {
      setFilters((prev) => ({ ...prev, ...quickFilter.filters }))
    }
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilterState)
  }, [])

  const saveCurrentSearch = useCallback(() => {
    if (filters.searchTerm && !savedSearches.includes(filters.searchTerm)) {
      setSavedSearches((prev) => [filters.searchTerm, ...prev.slice(0, 4)])
    }
  }, [filters.searchTerm, savedSearches])

  const getActiveFiltersCount = useMemo(() => {
    let count = 0
    if (filters.searchTerm) count++
    if (filters.categories.size !== 3) count++
    if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 500) count++
    if (filters.ratingMin > 0) count++
    if (filters.popularityMin > 0) count++
    if (filters.distanceMax < 50) count++
    if (filters.locations.size > 0) count++
    if (filters.amenities.size > 0) count++
    if (filters.tags.size > 0) count++
    if (filters.specialOffers) count++
    if (filters.instantBooking) count++
    if (filters.openNow) count++
    return count
  }, [filters])

  if (hotelsLoading || restaurantsLoading || salonsLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (hotelsError || restaurantsError || salonsError) {
    return <div className="p-8 text-center text-red-500">Une erreur est survenue lors du chargement des données.</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl text-blue-600">ProcheDeMoi</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
            <Link href="/" className="hover:text-blue-600">
              Accueil
            </Link>
            <Link href="/product" className="hover:text-blue-600">
              Produit
            </Link>
            <Link href="/hotel" className="hover:text-blue-600">
              Hotels
            </Link>
            <Link href="/u/accueil" className="hover:text-blue-600">
              Restaurants
            </Link>
            <Link href="/salon" className="hover:text-blue-600">
              Salons
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero and Search */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Découvrez et réservez votre prochaine expérience
            </h1>
            <p className="text-lg text-gray-600">
              Trouvez le meilleur hôtel, restaurant ou salon de beauté avec nos filtres intelligents.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="relative mb-6">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Rechercher par nom, lieu, cuisine, services..."
                  value={filters.searchTerm}
                  onChange={(e) => {
                    updateFilter("searchTerm", e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="pl-12 pr-20 h-14 text-base shadow-lg border-0 focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                {filters.searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter("searchTerm", "")}
                    className="absolute right-12 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={saveCurrentSearch}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>

              {/* Search suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-10 shadow-lg">
                  <CardContent className="p-2">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          updateFilter("searchTerm", suggestion)
                          setShowSuggestions(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                      >
                        <Search className="h-4 w-4 inline mr-2 text-gray-400" />
                        {suggestion}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickFilter(filter.id)}
                  className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <filter.icon className="h-4 w-4" />
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Control bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex items-center gap-2 flex-1">
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-12 px-4 shadow-sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filtres avancés
                  {getActiveFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {getActiveFiltersCount}
                    </Badge>
                  )}
                </Button>

                {/* Saved searches */}
                {savedSearches.length > 0 && (
                  <Select onValueChange={(value) => updateFilter("searchTerm", value)}>
                    <SelectTrigger className="w-48 h-12">
                      <SelectValue placeholder="Recherches sauvées" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedSearches.map((search, index) => (
                        <SelectItem key={index} value={search}>
                          <div className="flex items-center">
                            <Bookmark className="h-4 w-4 mr-2" />
                            {search}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
                  <SelectTrigger className="w-56 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Pertinence</SelectItem>
                    <SelectItem value="nameAsc">Nom A → Z</SelectItem>
                    <SelectItem value="nameDesc">Nom Z → A</SelectItem>
                    <SelectItem value="ratingDesc">Note ↓</SelectItem>
                    <SelectItem value="ratingAsc">Note ↑</SelectItem>
                    <SelectItem value="priceAsc">Prix ↑</SelectItem>
                    <SelectItem value="priceDesc">Prix ↓</SelectItem>
                    <SelectItem value="popularityDesc">Popularité ↓</SelectItem>
                    <SelectItem value="distanceAsc">Distance ↑</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-lg shadow-sm">
                  <Button
                    variant={filters.viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => updateFilter("viewMode", "grid")}
                    className="rounded-r-none h-12"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={filters.viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => updateFilter("viewMode", "list")}
                    className="rounded-l-none h-12"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {showFilters && (
              <Card className="mb-6 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Filtres avancés</h3>
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Effacer tout
                    </Button>
                  </div>

                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Filtres de base</TabsTrigger>
                      <TabsTrigger value="location">Lieu & Distance</TabsTrigger>
                      <TabsTrigger value="advanced">Avancés</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Categories */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Catégories</h4>
                          {[
                            { type: "hotel", label: "Hôtels" },
                            { type: "restaurant", label: "Restaurants" },
                            { type: "salon", label: "Salons" },
                          ].map(({ type, label }) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={type}
                                checked={filters.categories.has(type)}
                                onCheckedChange={() => toggleSetFilter("categories", type)}
                              />
                              <label htmlFor={type} className="text-sm cursor-pointer">
                                {label}
                              </label>
                            </div>
                          ))}
                        </div>

                        {/* Price Range */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Prix (€)</h4>
                          <div className="px-2">
                            <Slider
                              value={filters.priceRange}
                              onValueChange={(value) => updateFilter("priceRange", value)}
                              max={500}
                              min={0}
                              step={10}
                              className="mb-2"
                            />
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{filters.priceRange[0]}€</span>
                              <span>{filters.priceRange[1]}€</span>
                            </div>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Note minimum</h4>
                          <div className="px-2">
                            <Slider
                              value={[filters.ratingMin]}
                              onValueChange={(value) => updateFilter("ratingMin", value[0])}
                              max={5}
                              min={0}
                              step={0.5}
                              className="mb-2"
                            />
                            <div className="flex items-center text-sm text-gray-600">
                              <Star className="h-4 w-4 mr-1 text-yellow-400" />
                              {filters.ratingMin} et plus
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="location" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Locations */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Villes</h4>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {filterOptions.locations.map((location) => (
                              <div key={location} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`location-${location}`}
                                  checked={filters.locations.has(location)}
                                  onCheckedChange={() => toggleSetFilter("locations", location)}
                                />
                                <label htmlFor={`location-${location}`} className="text-sm cursor-pointer">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {location}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Distance */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Distance maximale (km)</h4>
                          <div className="px-2">
                            <Slider
                              value={[filters.distanceMax]}
                              onValueChange={(value) => updateFilter("distanceMax", value[0])}
                              max={50}
                              min={1}
                              step={1}
                              className="mb-2"
                            />
                            <div className="text-sm text-gray-600">Jusqu'à {filters.distanceMax} km</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Quick toggles */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Options rapides</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="specialOffers"
                                checked={filters.specialOffers}
                                onCheckedChange={(checked) => updateFilter("specialOffers", checked)}
                              />
                              <label htmlFor="specialOffers" className="text-sm cursor-pointer">
                                <Zap className="h-3 w-3 inline mr-1 text-yellow-500" />
                                Offres spéciales
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="instantBooking"
                                checked={filters.instantBooking}
                                onCheckedChange={(checked) => updateFilter("instantBooking", checked)}
                              />
                              <label htmlFor="instantBooking" className="text-sm cursor-pointer">
                                <Clock className="h-3 w-3 inline mr-1 text-green-500" />
                                Réservation immédiate
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="openNow"
                                checked={filters.openNow}
                                onCheckedChange={(checked) => updateFilter("openNow", checked)}
                              />
                              <label htmlFor="openNow" className="text-sm cursor-pointer">
                                <Clock className="h-3 w-3 inline mr-1 text-blue-500" />
                                Ouvert maintenant
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Popularity */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Popularité minimum</h4>
                          <div className="px-2">
                            <Slider
                              value={[filters.popularityMin]}
                              onValueChange={(value) => updateFilter("popularityMin", value[0])}
                              max={100}
                              min={0}
                              step={10}
                              className="mb-2"
                            />
                            <div className="text-sm text-gray-600">{filters.popularityMin}% et plus</div>
                          </div>
                        </div>

                        {/* Amenities & Tags */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Équipements</h4>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {filterOptions.amenities.slice(0, 8).map((amenity) => (
                                <div key={amenity} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`amenity-${amenity}`}
                                    checked={filters.amenities.has(amenity)}
                                    onCheckedChange={() => toggleSetFilter("amenities", amenity)}
                                  />
                                  <label htmlFor={`amenity-${amenity}`} className="text-xs cursor-pointer">
                                    {amenity}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {getActiveFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.searchTerm && (
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    <Search className="h-3 w-3 mr-1" />"{filters.searchTerm}"
                    <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => updateFilter("searchTerm", "")} />
                  </Badge>
                )}
                {filters.specialOffers && (
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    <Zap className="h-3 w-3 mr-1" />
                    Offres spéciales
                    <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => updateFilter("specialOffers", false)} />
                  </Badge>
                )}
                {filters.instantBooking && (
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    Réservation immédiate
                    <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => updateFilter("instantBooking", false)} />
                  </Badge>
                )}
                {Array.from(filters.locations).map((location) => (
                  <Badge key={location} variant="secondary" className="px-3 py-1 text-sm">
                    <MapPin className="h-3 w-3 mr-1" />
                    {location}
                    <X className="h-3 w-3 ml-2 cursor-pointer" onClick={() => toggleSetFilter("locations", location)} />
                  </Badge>
                ))}
                {Array.from(filters.amenities)
                  .slice(0, 3)
                  .map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="px-3 py-1 text-sm">
                      {amenity}
                      <X
                        className="h-3 w-3 ml-2 cursor-pointer"
                        onClick={() => toggleSetFilter("amenities", amenity)}
                      />
                    </Badge>
                  ))}
                {filters.amenities.size > 3 && (
                  <Badge variant="outline" className="px-3 py-1 text-sm">
                    +{filters.amenities.size - 3} autres
                  </Badge>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Results Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Résultats ({filteredAndSortedResults.length})
              {filters.searchTerm && (
                <span className="text-base font-normal text-gray-600 ml-2">pour "{filters.searchTerm}"</span>
              )}
            </h2>
          </div>

          {filteredAndSortedResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="h-20 w-20 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Essayez de modifier vos critères de recherche, d'élargir votre zone géographique ou de supprimer
                certains filtres.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={clearAllFilters} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Effacer tous les filtres
                </Button>
                <Button onClick={() => updateFilter("distanceMax", 50)} variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Élargir la zone
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={
                filters.viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"
              }
            >
              {filteredAndSortedResults.map((item: any) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 ${
                    filters.viewMode === "list" ? "flex" : "flex flex-col"
                  } ${item.specialOffer ? "ring-2 ring-yellow-200" : ""}`}
                >
                  <div className="relative">
                    <img
                      src={item.images?.[0] || "/placeholder.jpg"}
                      alt={item.name}
                      className={
                        filters.viewMode === "list"
                          ? "h-32 w-48 object-cover flex-shrink-0"
                          : "h-48 w-full object-cover"
                      }
                    />
                    {item.specialOffer && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
                        <Zap className="h-3 w-3 mr-1" />
                        Offre spéciale
                      </Badge>
                    )}
                    {item.instantBooking && (
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Immédiat
                      </Badge>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 flex-1">{item.name}</h3>
                      <div className="flex items-center ml-2">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2 flex-wrap gap-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {item.location} • {item.distance}km
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {item.priceRange}€
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {item.popularity}% populaire
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{item.description}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {(Array.isArray(item.tags) ? item.tags : [item.tags])
                        .slice(0, 3)
                        .map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      {item.cuisine && (
                        <Badge variant="outline" className="text-xs">
                          <Utensils className="h-3 w-3 mr-1" />
                          {item.cuisine}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Link
                        href={
                          item.type === "hotel"
                            ? `/hotel/rooms?hotelId=${item.id}`
                            : item.type === "restaurant"
                              ? `/restaurant/booking?restaurantId=${item.id}`
                              : "/salon/booking"
                        }
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          item.type === "hotel"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : item.type === "restaurant"
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-pink-600 hover:bg-pink-700 text-white"
                        }`}
                      >
                        {item.type === "hotel"
                          ? "Voir les chambres"
                          : item.type === "restaurant"
                            ? "Réserver une table"
                            : "Réserver un service"}
                      </Link>

                      <Button variant="ghost" size="sm">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Pourquoi choisir ProcheDeMoi ?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
                <Calendar className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion intelligente des réservations</h3>
                <p className="text-sm text-gray-600">
                  Planifiez vos rendez‑vous, chambres et tables avec un système qui évite les conflits et envoie des
                  confirmations automatiques.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
                <Users className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fidélisez vos clients</h3>
                <p className="text-sm text-gray-600">
                  Accédez à l'historique et aux préférences de vos clients et créez des expériences personnalisées qui
                  les feront revenir.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
                <Shield className="h-8 w-8 text-purple-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sécurisé et fiable</h3>
                <p className="text-sm text-gray-600">
                  Profitez d'une infrastructure de niveau entreprise avec sauvegardes automatiques et disponibilité
                  garantie.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow">
                <Clock className="h-8 w-8 text-orange-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Assistance 24/7</h3>
                <p className="text-sm text-gray-600">
                  Une équipe à votre écoute à toute heure pour que votre activité ne connaisse aucune interruption.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} ProcheDeMoi. Tous droits réservés.</p>
          <div className="flex justify-center space-x-6 mt-4 text-sm">
            <Link href="#" className="hover:text-blue-400">
              Politique de confidentialité
            </Link>
            <Link href="#" className="hover:text-blue-400">
              Conditions d'utilisation
            </Link>
            <Link href="#" className="hover:text-blue-400">
              Nous contacter
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
