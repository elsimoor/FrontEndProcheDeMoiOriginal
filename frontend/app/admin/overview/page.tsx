"use client"

import { gql, useQuery } from "@apollo/client"
import useTranslation from "@/hooks/useTranslation"
import { useLanguage } from "@/context/LanguageContext"

// Queries to fetch counts of each business type.  We reuse the
// existing queries from the backend that return full lists of hotels,
// restaurants and salons.  Only the length of the arrays is used for
// displaying simple statistics.
const GET_HOTELS = gql`
  query GetHotelsForOverview {
    hotels {
      id
    }
  }
`

const GET_RESTAURANTS = gql`
  query GetRestaurantsForOverview {
    restaurants {
      id
    }
  }
`

const GET_SALONS = gql`
  query GetSalonsForOverview {
    salons {
      id
    }
  }
`

export default function AdminOverviewPage() {
  const { data: hotelsData, loading: hotelsLoading, error: hotelsError } = useQuery(GET_HOTELS)
  const {
    data: restaurantsData,
    loading: restaurantsLoading,
    error: restaurantsError,
  } = useQuery(GET_RESTAURANTS)
  const { data: salonsData, loading: salonsLoading, error: salonsError } = useQuery(GET_SALONS)

  // Translation and language context.  Hooks must be called unconditionally
  const { t } = useTranslation()
  const { locale, setLocale } = useLanguage()

  if (hotelsLoading || restaurantsLoading || salonsLoading) {
    // Display loading message with translation and language toggle when data is fetching
    return (
      <div className="relative p-4">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => setLocale("en")}
            className={`text-sm font-medium ${locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale("fr")}
            className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"}`}
          >
            FR
          </button>
        </div>
        <p>{t("loadingOverview")}</p>
      </div>
    )
  }
  if (hotelsError || restaurantsError || salonsError) {
    // Display error message with translation and language toggle when there's an error
    return (
      <div className="relative p-4">
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => setLocale("en")}
            className={`text-sm font-medium ${locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale("fr")}
            className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"}`}
          >
            FR
          </button>
        </div>
        <p>{t("errorLoadingOverview")}</p>
      </div>
    )
  }
  const totalHotels = hotelsData?.hotels?.length ?? 0
  const totalRestaurants = restaurantsData?.restaurants?.length ?? 0
  const totalSalons = salonsData?.salons?.length ?? 0
  return (
    <div className="relative space-y-8">
      {/* Language toggle */}
      <div className="absolute top-0 right-0 flex space-x-2">
        <button
          onClick={() => setLocale("en")}
          className={`text-sm font-medium ${locale === "en" ? "font-semibold text-blue-600" : "text-gray-700"}`}
        >
          EN
        </button>
        <button
          onClick={() => setLocale("fr")}
          className={`text-sm font-medium ${locale === "fr" ? "font-semibold text-blue-600" : "text-gray-700"}`}
        >
          FR
        </button>
      </div>
      <h1 className="text-2xl font-bold">{t("overview")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Hotels statistic card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">{t("hotels")}</h2>
          <p className="text-3xl font-bold text-blue-600">{totalHotels}</p>
          <p className="text-sm text-gray-500">{t("totalHotels")}</p>
        </div>
        {/* Restaurants statistic card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">{t("restaurants")}</h2>
          <p className="text-3xl font-bold text-red-600">{totalRestaurants}</p>
          <p className="text-sm text-gray-500">{t("totalRestaurants")}</p>
        </div>
        {/* Salons statistic card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">{t("salons")}</h2>
          <p className="text-3xl font-bold text-pink-600">{totalSalons}</p>
          <p className="text-sm text-gray-500">{t("totalSalons")}</p>
        </div>
      </div>
    </div>
  )
}