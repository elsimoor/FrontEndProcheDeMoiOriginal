"use client"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import PrivateRoute from "./components/PrivateRoute"

/* --- pages publiques --- */
import HomePage from "./pagesY/HomePage"
import LoginPage from "./pagesY/LoginPage"
import RegisterPage from "./pagesY/RegisterPage"
import RestaurantBooking from "./pagesY/RestaurantBooking"
import HotelBooking from "./pagesY/HotelBooking"
import SalonBookings from "./pagesY/salonY/SalonBookings"

/* --- Salon --- */
import SalonDashboardMain from "./pagesY/salonY/SalonDashboardMain"
import SalonServices from "./pagesY/salonY/SalonServices"
import  Salon from "./pagesY/SalonServices"
import SalonStaff from "./pagesY/salonY/SalonStaff"
import SalonClients from "./pagesY/salonY/SalonClients"

/* --- Hotel --- */
import HotelDashboardMain from "./pagesY/hotelY/HotelDashboardMain"
import HotelReservations from "./pagesY/hotelY/HotelReservations"
import HotelGuests from "./pagesY/hotelY/HotelGuests"
import HotelRooms from "./pagesY/hotelY/HotelRooms"
import HotelOptions from "./pagesY/hotelY/HotelOptions"
import HotelSettings from "./pagesY/hotelY/HotelSettings"

/* --- Restaurant --- */
import SalonDashboardLayout from "./pagesY/salonY/SalonDashboardLayout"
import HotelDashboardLayout from "./pagesY/hotelY/HotelDashboardLayout"

import RestaurantDashboardMain from "./pagesY/restaurantY/RestaurantDashboardMain"
import RestaurantReservations from "./pagesY/restaurantY/RestaurantReservations"
import RestaurantTables from "./pagesY/restaurantY/RestaurantTables"
import RestaurantMenus from "./pagesY/restaurantY/RestaurantMenus"
import RestaurantPrivatisation from "./pagesY/restaurantY/RestaurantPrivatisation"
import RestaurantAvis from "./pagesY/restaurantY/RestaurantAvis"
import RestaurantStaff from "./pagesY/restaurantY/RestaurantStaff"
import RestaurantSettings from "./pagesY/restaurantY/RestaurantSettings"
import RestaurantDashboardLayout from "./pagesY/restaurantY/HotelDashboardLayout"
import HotelRoomDetails from "./pagesY/hotelY/HotelRoomDetails"
import ClientApolloProvider from "@/components/ClientApolloProvider"

function App() {
  return (
    <ClientApolloProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* ------------ Shell public ------------- */}
          <Route path="/" >
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* Réservations publiques */}
            <Route path="salon/booking" element={<SalonBookings />} />
            <Route path="salony" element={<Salon />} />
            
            <Route path="restaurant/booking" element={<RestaurantBooking />} />
            <Route path="hotel/booking" element={<HotelBooking />} />
          </Route>

          {/* ------------ Salon (protégé) ----------- */}
          <Route
            path="salon/dashboard"
            element={
              <PrivateRoute>
                <SalonDashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<SalonDashboardMain />} />
            <Route path="services" element={<SalonServices />} />
            <Route path="staff" element={<SalonStaff />} />
            <Route path="bookings" element={<SalonBookings />} />
            <Route path="clients" element={<SalonClients />} />
          </Route>

          {/* ------------ Hôtel (protégé) ----------- */}
          <Route
            path="hotel/dashboard"
            element={
              <PrivateRoute>
                <HotelDashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<HotelDashboardMain />} />
            <Route path="reservations" element={<HotelReservations />} />
            <Route path="guests" element={<HotelGuests />} />
            <Route path="rooms" element={<HotelRooms />} />
              <Route
            path="rooms/:roomId"
            element={
              <PrivateRoute>
                <HotelRoomDetails />
              </PrivateRoute>
            }
          />
            <Route path="options" element={<HotelOptions />} />
            <Route path="settings" element={<HotelSettings />} />
          </Route>

          {/* ------------ Restaurant (protégé) ------ */}
          <Route
            path="restaurant/dashboard"
            element={
              <PrivateRoute>
                <RestaurantDashboardLayout />
              </PrivateRoute>
            }

          // Restaurant Pages

          >
            <Route index element={<RestaurantDashboardMain />} />
            <Route path="reservations" element={<RestaurantReservations />} />
            <Route path="tables" element={<RestaurantTables />} />
            <Route path="menus" element={<RestaurantMenus />} />
            <Route path="privatisation" element={<RestaurantPrivatisation />} />
            <Route path="avis" element={<RestaurantAvis />} />
            <Route path="staff" element={<RestaurantStaff />} />
            <Route path="settings" element={<RestaurantSettings />} />

          </Route>

          {/* 404 éventuel */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Router>
    </ClientApolloProvider>
  )
}

export default App
