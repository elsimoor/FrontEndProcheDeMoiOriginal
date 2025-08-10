"use client"

import { gql, useQuery } from "@apollo/client"

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

  if (hotelsLoading || restaurantsLoading || salonsLoading) {
    return <p>Loading overview...</p>
  }
  if (hotelsError || restaurantsError || salonsError) {
    return <p>Error loading overview.</p>
  }
  const totalHotels = hotelsData?.hotels?.length ?? 0
  const totalRestaurants = restaurantsData?.restaurants?.length ?? 0
  const totalSalons = salonsData?.salons?.length ?? 0
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Hotels statistic card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Hotels</h2>
          <p className="text-3xl font-bold text-blue-600">{totalHotels}</p>
          <p className="text-sm text-gray-500">Total hotels in the system</p>
        </div>
        {/* Restaurants statistic card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Restaurants</h2>
          <p className="text-3xl font-bold text-red-600">{totalRestaurants}</p>
          <p className="text-sm text-gray-500">Total restaurants in the system</p>
        </div>
        {/* Salons statistic card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Salons</h2>
          <p className="text-3xl font-bold text-pink-600">{totalSalons}</p>
          <p className="text-sm text-gray-500">Total salons in the system</p>
        </div>
      </div>
    </div>
  )
}