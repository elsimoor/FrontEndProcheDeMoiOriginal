# Project Overview

This Next.js application serves as a multi‑tenant booking dashboard for hotels, restaurants and salons.  The backend is provided by a GraphQL API (`/procheDeMoi`) which exposes CRUD operations for a variety of entities such as hotels, rooms, tables, services and clients.  The frontend uses Apollo Client to communicate with the API and Tailwind CSS for styling.

## Getting Started

Before starting the application, ensure that you have the backend running and that the environment variable `NEXT_PUBLIC_BACKEND_URL` points to the correct host (for example `http://localhost:5000`).  The Apollo client will automatically append `/procheDeMoi` to this URL when sending GraphQL requests.

To run the Next.js app locally:

```bash
# In one terminal start the backend (not included here)
# Then in a new terminal run the frontend
npm install
npm run dev
```

The admin dashboard will be available at `/admin` when running in development mode.

## Checklist

The following table tracks the major tasks required to integrate the backend logic into the front‑end application.  Items that have been completed are marked with an `[x]`, while items still to be addressed are unchecked.

| Status | Task |
|-------|------|
| [x] | Configure Apollo Client to target the backend GraphQL endpoint using `NEXT_PUBLIC_BACKEND_URL` |
| [x] | Create an admin dashboard (`/admin`) with a form and list for managing hotels (create, read, update, delete) |
| [x] | Define GraphQL queries and mutations for hotels that match the backend schema (removed deprecated `priceRange` and `businessHours` fields) |
| [ ] | Implement pages and CRUD operations for restaurants |
| [ ] | Implement pages and CRUD operations for salons |
| [x] | Implement management of rooms (CRUD for hotel rooms) |
| [x] | Implement management of guests (CRUD for hotel guests) |
| [x] | Implement management of reservations (CRUD for hotel reservations) |
| [x] | Implement management of services, amenities and policies via the options page |
| [x] | Implement settings page for hotels, including general info, notifications, payment methods and policies |
| [x] | Implement user assignment: allow admins to assign a hotel to a user from the admin dashboard |
| [ ] | Implement management of tables, services and staff for restaurants |
| [ ] | Implement management of bookings, clients, services and staff for salons |
| [x] | Extend session data to include `businessId` and `businessType` and expose them via an `/api/session` endpoint |
| [x] | Update the login API route to persist the business identifier and type in the session |
| [x] | Modify the hotel rooms dashboard to derive the current hotel from the session instead of querying `myHotel` |
| [ ] | Integrate user authentication and role management (admin vs. employee) |
| [ ] | Link clients/tenants to their reservation modules (rooms, services, restaurant) as specified in the cahier des charges |
| [ ] | Add theme customisation (logo, primary/secondary colours, typography) per client |
| [ ] | Build reservation flows for services, rooms and restaurant tables (booking creation, modification and cancellation) |
| [ ] | Implement synchronisation with external systems (e.g. Booking.com, Google Calendar) |

Feel free to update this checklist as you address the remaining tasks.  Contributions should follow the existing patterns established in the codebase and keep the GraphQL schema in sync with the backend.