"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Calendar, Users, Bed, Wifi, Car, Coffee, Dumbbell, Waves } from "lucide-react";
import { gql, useQuery, useMutation } from "@apollo/client";

// Query to fetch rooms for the current hotel.  We only need id, type and price.
const GET_ROOMS = gql`
  query GetRooms($hotelId: ID!) {
    rooms(hotelId: $hotelId) {
      id
      type
      price
      status
      images
      amenities
    }
  }
`;

// Query to fetch all active hotels.  We use this to determine
// which hotel should be selected for booking when the user is not
// logged in.  For now we simply choose the first active hotel.
const GET_HOTELS = gql`
  query GetHotels {
    hotels {
      id
      name
      openingPeriods {
        startDate
        endDate
      }
      amenities {
        name
        description
        included
        category
      }
    }
  }
`;


// Mutation to create a reservation
const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationInput!) {
    createReservation(input: $input) {
      id
      status
    }
  }
`;

export default function HotelBookingPage() {
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    guests: 1,
    roomType: "", // room type id; will default to first available type once rooms load
    name: "",
    email: "",
    phone: "",
  });

  // The current hotel identifier.  When the user is not logged in we
  // derive this from the list of active hotels.  Initially null until
  // hotels are fetched.
  const [hotelId, setHotelId] = useState<string | null>(null);

  // Fetch the list of active hotels.  We skip nothing because we
  // always need this to determine a default hotel.
  const {
    data: hotelsData,
    loading: hotelsLoading,
    error: hotelsError,
  } = useQuery(GET_HOTELS);

  // When hotels load for the first time, choose the first hotel as
  // the default booking target.  If there are no hotels then hotelId
  // remains null.
  useEffect(() => {
    if (!hotelsLoading && hotelsData?.hotels && hotelsData.hotels.length > 0 && !hotelId) {
      setHotelId(hotelsData.hotels[0].id);
    }
  }, [hotelsLoading, hotelsData, hotelId]);

  // Fetch rooms when a hotel is selected.
  const {
    data: roomsData,
    loading: roomsLoading,
    error: roomsError,
  } = useQuery(GET_ROOMS, {
    variables: { hotelId },
    skip: !hotelId,
  });

  // Derive the selected hotel data from the list of hotels.
  const hotelData = useMemo(() => {
    if (!hotelId || !hotelsData?.hotels) return undefined;
    const hotel = hotelsData.hotels.find((h: any) => h.id === hotelId);
    return hotel ? { hotel } : undefined;
  }, [hotelsData, hotelId]);

  // Mutation for reservation creation
  const [createReservation] = useMutation(CREATE_RESERVATION);

  // Derived room types from backend data
  const roomTypes = roomsData?.rooms
    ? Array.from(
        roomsData.rooms.reduce((map: Map<string, any>, room: any) => {
          if (!map.has(room.type)) {
            map.set(room.type, {
              id: room.type.toLowerCase(),
              name: `${room.type} Room`,
              price: room.price,
              description: `${room.type} room`,
              rooms: [],
              images: [] as string[],
            });
          }
          const typeEntry = map.get(room.type);
          // Use the last price encountered for this type; assume uniform pricing per type
          typeEntry.price = room.price;
          typeEntry.rooms.push(room);
          // Aggregate images from each room for this type
          if (room.images && Array.isArray(room.images)) {
            for (const img of room.images) {
              if (img && !typeEntry.images.includes(img)) {
                typeEntry.images.push(img);
              }
            }
          }
          return map;
        }, new Map()).values()
      )
    : [];

  // When roomsData loads, set default room type if not set
  useEffect(() => {
    if (roomTypes && roomTypes.length > 0 && !bookingData.roomType) {
      setBookingData((prev) => ({ ...prev, roomType: roomTypes[0].id }));
    }
  }, [roomsData]);

  // Compute nights and total price
  const selectedType = roomTypes.find((r: any) => r.id === bookingData.roomType);
  const nights = bookingData.checkIn && bookingData.checkOut
    ? Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = selectedType ? selectedType.price * nights : 0;

  // State for previewing room images
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Validate that selected dates fall within one of the hotel's opening periods
  const isWithinOpeningPeriod = () => {
    if (!hotelData || !hotelData.hotel || !hotelData.hotel.openingPeriods || hotelData.hotel.openingPeriods.length === 0) {
      return true; // if no opening periods defined, hotel is always open
    }
    if (!bookingData.checkIn || !bookingData.checkOut) return true;
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    return hotelData.hotel.openingPeriods.some((period: any) => {
      const periodStart = new Date(period.startDate);
      const periodEnd = new Date(period.endDate);
      return checkIn >= periodStart && checkOut <= periodEnd;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    // Validate open periods
    if (!isWithinOpeningPeriod()) {
      alert("Hotel is not open for the selected dates");
      return;
    }
    // Find a room id for the selected type (pick first available).  If no rooms exist, error.
    const selectedRoomType = roomTypes.find((r: any) => r.id === bookingData.roomType);
    if (!selectedRoomType || !selectedRoomType.rooms || selectedRoomType.rooms.length === 0) {
      alert("No rooms available for the selected type");
      return;
    }
    const room = selectedRoomType.rooms[0];
    try {
      await createReservation({
        variables: {
          input: {
            businessId: hotelId,
            businessType: "hotel",
            customerInfo: {
              name: bookingData.name,
              email: bookingData.email,
              phone: bookingData.phone,
            },
            roomId: room.id,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            guests: Number(bookingData.guests),
            date: bookingData.checkIn, // store checkIn as date for convenience
            totalAmount: totalPrice,
            status: "pending",
            paymentStatus: "pending",
          },
        },
      });
      alert("Booking request submitted successfully!");
      // Optionally reset form
      setBookingData({
        checkIn: "",
        checkOut: "",
        guests: 1,
        roomType: roomTypes.length > 0 ? roomTypes[0].id : "",
        name: "",
        email: "",
        phone: "",
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to create reservation");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBookingData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Book Your Perfect Stay</h1>
            <p className="text-xl text-blue-100">Experience luxury and comfort at our premium hotel</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Booking Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Reservation</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Check-in/Check-out */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="checkIn"
                        value={bookingData.checkIn}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="checkOut"
                        value={bookingData.checkOut}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="guests"
                      value={bookingData.guests}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} Guest{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Room Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                  <div className="space-y-3">
                    {roomTypes && roomTypes.length > 0 ? (
                      roomTypes.map((room: any) => (
                        <label
                          key={room.id}
                          className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name="roomType"
                            value={room.id}
                            checked={bookingData.roomType === room.id}
                            onChange={handleChange}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{room.name}</h4>
                                <p className="text-sm text-gray-600">{room.description}</p>
                              </div>
                              <span className="text-lg font-bold text-blue-600">
                                ${room.price}/night
                              </span>
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p>No rooms available.</p>
                    )}
                  </div>
                </div>

                {/* Guest Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Guest Information</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={bookingData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={bookingData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={bookingData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors"
                >
                  Book Now{totalPrice > 0 ? ` - $${totalPrice}` : ""}
                </button>
              </form>
            </div>

            {/* Hotel Information */}
            <div className="space-y-8">
              {/* Selected Room Details */}
              {selectedType && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Selected Room</h3>
                  {/* Room images preview.  Show thumbnails and allow clicking to preview. */}
                  {selectedType.images && selectedType.images.length > 0 ? (
                    <>
                      <div className="flex space-x-2 mb-4 overflow-x-auto">
                        {selectedType.images.map((img: string, idx: number) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Room image ${idx + 1}`}
                            className="h-24 w-32 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setPreviewImage(img)}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <img
                      src="/placeholder.svg?height=200&width=300"
                      alt={selectedType.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h4 className="font-medium text-gray-900 mb-2">{selectedType.name}</h4>
                  <p className="text-gray-600 mb-4">{selectedType.description}</p>
                  {nights > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>
                          ${selectedType.price} × {nights} nights
                        </span>
                        <span className="font-medium">${totalPrice}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hotel Amenities (static for now) */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Hotel Amenities</h3>
                {hotelData?.hotel?.amenities && hotelData.hotel.amenities.length > 0 ? (
                  <ul className="space-y-2">
                    {hotelData.hotel.amenities.map((amenity: any, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        {/* Use icons conditionally based on amenity category or name */}
                        <span className="text-blue-600">
                          {amenity.name === 'WiFi' && <Wifi className="h-5 w-5" />}
                          {amenity.name.toLowerCase().includes('parking') && <Car className="h-5 w-5" />}
                          {amenity.name.toLowerCase().includes('restaurant') && <Coffee className="h-5 w-5" />}
                          {amenity.name.toLowerCase().includes('fitness') && <Dumbbell className="h-5 w-5" />}
                          {amenity.name.toLowerCase().includes('pool') && <Waves className="h-5 w-5" />}
                          {amenity.name.toLowerCase().includes('room service') && <Bed className="h-5 w-5" />}
                        </span>
                        <div>
                          <span className="font-medium text-gray-800">{amenity.name}</span>
                          {amenity.description && (
                            <p className="text-sm text-gray-600">{amenity.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No amenities listed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="text-center pb-12">
        <Link href="/" className="text-blue-600 hover:text-blue-500 font-medium">
          ← Back to Home
        </Link>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full">
            <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
