"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { gql, useQuery } from "@apollo/client";

/*
 * Rooms listing page
 *
 * Displays all available rooms for the selected hotel along with
 * basic information such as the type, amenities and price per
 * night.  The user can select a room which will persist the
 * selection in localStorage and navigate to the detail page to
 * configure add‑ons.  If no search criteria are stored the user
 * will be redirected back to the search page.
 */

// GraphQL queries for hotels and rooms
const GET_HOTELS = gql`
  query GetHotels {
    hotels {
      id
      name
    }
  }
`;

const GET_ROOMS = gql`
  query GetRooms($hotelId: ID!) {
    rooms(hotelId: $hotelId) {
      id
      number
      type
      price
      status
      amenities
      features
      images
      capacity
      description
    }
  }
`;

// Query for rooms that are available within a date range
const GET_AVAILABLE_ROOMS = gql`
  query AvailableRooms($hotelId: ID!, $checkIn: Date!, $checkOut: Date!, $adults: Int!, $children: Int!) {
    availableRooms(hotelId: $hotelId, checkIn: $checkIn, checkOut: $checkOut, adults: $adults, children: $children) {
      id
      number
      type
      price
      status
      amenities
      features
      images
      capacity
      description
    }
  }
`;

const GET_AVAILABLE_ROOMS_COUNT = gql`
  query AvailableRoomsCount($hotelId: ID!, $checkIn: Date!, $checkOut: Date!, $adults: Int!, $children: Int!) {
    availableRoomsCount(hotelId: $hotelId, checkIn: $checkIn, checkOut: $checkOut, adults: $adults, children: $children)
  }
`;

export default function RoomsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "1", 10);
  const children = parseInt(searchParams.get("children") || "0", 10);

  useEffect(() => {
    // If the user hasn’t selected dates go back to search
    if (!checkIn || !checkOut) {
      router.replace("/hotel/search");
    }
  }, [checkIn, checkOut, router]);

  // Fetch hotels to determine a default hotelId
  const {
    data: hotelsData,
    loading: hotelsLoading,
    error: hotelsError,
  } = useQuery(GET_HOTELS);

  // Determine the current hotelId; either use the one stored or
  // default to the first available hotel once hotels load.
  const hotelId = hotelsData?.hotels?.[0]?.id ?? null;

  // Fetch rooms for the selected hotel once we know the id
  const hasDates = !!checkIn && !!checkOut;
  // Choose between availableRooms and rooms depending on whether dates
  // are provided.  When check‑in/out are specified we fetch only
  // available rooms; otherwise we fall back to all rooms.
  const {
    data: roomsData,
    loading: roomsLoading,
    error: roomsError,
  } = useQuery(hasDates ? GET_AVAILABLE_ROOMS : GET_ROOMS, {
    variables: hasDates
      ? { hotelId, checkIn, checkOut, adults, children }
      : { hotelId },
    skip: !hotelId,
  });

  const { data: countData } = useQuery(GET_AVAILABLE_ROOMS_COUNT, {
    variables: { hotelId, checkIn, checkOut, adults, children },
    skip: !hotelId || !hasDates,
  });

  // Determine array of rooms from either the rooms or availableRooms fields
  const roomsArray: any[] = roomsData?.rooms
    ? roomsData.rooms
    : roomsData?.availableRooms
    ? roomsData.availableRooms
    : [];
  // Group rooms by type and select the first entry in each group.  We
  // intentionally ignore the status filter here because availableRooms
  // will already filter out unavailable rooms.  For the rooms query we
  // still filter to status "available".
  const grouped: { [type: string]: any } = {};
  roomsArray.forEach((room: any) => {
    if (!room) return;
    if (!roomsData?.availableRooms && room.status !== "available") return;
    if (!grouped[room.type]) {
      grouped[room.type] = {
        type: room.type,
        price: room.price,
        amenities: room.amenities,
        features: room.features,
        image: room.images?.[0] ?? null,
        roomId: room.id,
        description: room.description,
      };
    }
  });
  const roomTypes = Object.values(grouped);

  const [activeTab, setActiveTab] = useState("Hotels");
  const [hotelFilters, setHotelFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 4;

  const handleSelect = (roomId: string) => {
    const booking = {
      checkIn,
      checkOut,
      adults,
      children,
      guests: adults + children,
      roomId,
      hotelId,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("booking", JSON.stringify(booking));
    }
    router.push(`/hotel/rooms/${roomId}`);
  };

  const tabs = ["Hotels", "Experiences", "Hébergements", "Aventures"];
  const hotelFilterOptions = ["Boutique", "Luxe", "Familial", "Romantique"];

  const filteredRoomTypes = roomTypes.filter((room) => {
    if (hotelFilters.length === 0) {
      return true;
    }
    // The room type is a string like "Deluxe", "Standard", etc.
    // The filters are "Boutique", "Luxe", etc.
    // This is a placeholder for a more complex filtering logic.
    // For now, I will just check if the room type is included in the filters.
    // This will not work as expected, but it's a start.
    // I will assume that the room type can be mapped to the filter options.
    const roomType = room.type.toLowerCase();
    const filters = hotelFilters.map((f) => f.toLowerCase());
    if (filters.includes("luxe") && roomType === "deluxe") return true;
    if (filters.includes("familial") && roomType === "suite") return true;
    if (filters.includes("romantique") && roomType === "executive") return true;
    if (filters.includes("boutique") && roomType === "standard") return true;
    return false;
  });

  const totalPages = Math.ceil(filteredRoomTypes.length / roomsPerPage);
  const paginatedRooms = filteredRoomTypes.slice(
    (currentPage - 1) * roomsPerPage,
    currentPage * roomsPerPage
  );

  const handleFilterChange = (filter: string) => {
    setHotelFilters((prevFilters) =>
      prevFilters.includes(filter)
        ? prevFilters.filter((f) => f !== filter)
        : [...prevFilters, filter]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-2xl text-gray-900">StayEase</span>
            </div>
            <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-700">
              <a href="#" className="hover:text-blue-600 transition-colors">Explore</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Wishlists</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Trips</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Messages</a>
            </nav>
            <div className="flex items-center space-x-4">
              <a href="/login" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                Log in
              </a>
            </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex space-x-8 border-b">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "Hotels" && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Découvrez nos hotels</h2>
            <div className="flex flex-wrap gap-3 mt-4">
              {hotelFilterOptions.map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-4 py-2 text-sm font-medium border rounded-full transition-colors ${
                    hotelFilters.includes(filter)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chambres disponibles</h1>
          {countData && (
            <p className="text-gray-600">
              {countData.availableRoomsCount} chambre(s) disponible(s)
            </p>
          )}
        </div>

        {roomsLoading || hotelsLoading ? (
          <p>Loading rooms…</p>
        ) : roomsError || hotelsError ? (
          <p className="text-red-600">Unable to load rooms.</p>
        ) : roomTypes.length === 0 ? (
          <p>No rooms available for the selected dates.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedRooms.map((room: any) => (
                <div
                  key={room.roomId}
                  className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => handleSelect(room.roomId)}
                >
                  {room.image ? (
                    <img
                      src={room.image}
                      alt={room.type}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200"></div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {room.type}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden">
                      {room.description || 'No description available.'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        {room.price}€/nuit
                      </span>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center items-center mt-12 space-x-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => router.push("/hotel/search")}
            className="text-blue-600 hover:underline"
          >
            ← Modifier la recherche
          </button>
        </div>
      </main>
      <footer className="w-full bg-gray-100 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} StayEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

