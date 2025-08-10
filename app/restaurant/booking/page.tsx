"use client"

import type React from "react"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, Users, Phone, Mail, User } from "lucide-react";
import { gql, useMutation, useQuery } from "@apollo/client";

// GraphQL mutation to create a restaurant reservation.  The backend
// accepts a generic ReservationInput, so we supply only the fields
// relevant to restaurants.  Additional optional fields (e.g. notes or
// specialRequests) can be passed if desired.
const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationInput!) {
    createReservation(input: $input) {
      id
      status
    }
  }
`;

export default function RestaurantBookingPage() {
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    guests: 2,
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
  })

  // Determine which restaurant to use for reservations.  Instead of
  // relying on a logged‑in user session, we fetch the list of active
  // restaurants from the backend and select the first one by default.
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // GraphQL query to fetch all active restaurants.  We keep the
  // fields minimal since we only need the identifier.
  const GET_RESTAURANTS = gql`
    query GetRestaurants {
      restaurants {
        id
        name
      }
    }
  `;
  const { data: restaurantsData, loading: restaurantsLoading, error: restaurantsError } = useQuery(GET_RESTAURANTS);

  useEffect(() => {
    if (!restaurantsLoading && restaurantsData?.restaurants && restaurantsData.restaurants.length > 0 && !restaurantId) {
      setRestaurantId(restaurantsData.restaurants[0].id);
    }
  }, [restaurantsLoading, restaurantsData, restaurantId]);

  // Prepare the createReservation mutation.  After a successful
  // reservation the form is reset and a confirmation alert is shown.
  const [createReservation] = useMutation(CREATE_RESERVATION)

  const timeSlots = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure that a restaurant has been selected.  If none is
    // available then alert the user and abort.
    if (!restaurantId) {
      alert("Reservation failed: no restaurant available.");
      return;
    }
    try {
      // Assemble the reservation input.  We set the business type
      // explicitly to "restaurant" since we are on the restaurant
      // booking page.
      const input: any = {
        businessId: restaurantId,
        businessType: "restaurant",
        customerInfo: {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
        },
        partySize: +bookingData.guests,
        date: bookingData.date,
        time: bookingData.time,
        status: "pending",
        specialRequests: bookingData.specialRequests || undefined,
        source: "website",
      };
      await createReservation({ variables: { input } });
      // Reset form on success
      setBookingData({
        date: "",
        time: "",
        guests: 2,
        name: "",
        email: "",
        phone: "",
        specialRequests: "",
      });
      alert("Reservation request submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit reservation. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setBookingData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Reserve Your Table</h1>
            <p className="text-xl text-red-100">Experience exceptional dining at our restaurant</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Booking Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Reservation</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date and Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        name="date"
                        value={bookingData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        name="time"
                        value={bookingData.time}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select time</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="guests"
                      value={bookingData.guests}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} Guest{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Guest Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={bookingData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={bookingData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={bookingData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests (Optional)</label>
                  <textarea
                    name="specialRequests"
                    value={bookingData.specialRequests}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any dietary restrictions, allergies, or special occasions..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-red-700 transition-colors"
                >
                  Reserve Table
                </button>
              </form>
            </div>

            {/* Restaurant Information */}
            <div className="space-y-8">
              {/* Restaurant Details */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Restaurant Information</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Opening Hours</h4>
                    <p className="text-gray-600">Monday - Thursday: 5:00 PM - 10:00 PM</p>
                    <p className="text-gray-600">Friday - Saturday: 5:00 PM - 11:00 PM</p>
                    <p className="text-gray-600">Sunday: 5:00 PM - 9:00 PM</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Contact</h4>
                    <p className="text-gray-600">Phone: (555) 123-4567</p>
                    <p className="text-gray-600">Email: reservations@restaurant.com</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Address</h4>
                    <p className="text-gray-600">123 Gourmet Street</p>
                    <p className="text-gray-600">Culinary District, CD 12345</p>
                  </div>
                </div>
              </div>

              {/* Cuisine Highlights */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Our Cuisine</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Contemporary European</h4>
                      <p className="text-sm text-gray-600">Modern interpretations of classic European dishes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Fresh Seasonal Ingredients</h4>
                      <p className="text-sm text-gray-600">Locally sourced, organic produce</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Extensive Wine Selection</h4>
                      <p className="text-sm text-gray-600">Curated wines from around the world</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">Chef's Tasting Menu</h4>
                      <p className="text-sm text-gray-600">Multi-course culinary journey</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policies */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Reservation Policies</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Reservations can be cancelled up to 2 hours before your booking time</p>
                  <p>• Tables are held for 15 minutes past reservation time</p>
                  <p>• Large parties (8+ guests) may require a deposit</p>
                  <p>• Smart casual dress code preferred</p>
                  <p>• Please inform us of any dietary restrictions when booking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Home */}
      <div className="text-center pb-12">
        <Link href="/" className="text-red-600 hover:text-red-500 font-medium">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
