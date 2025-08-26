"use client"

import { gql, useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { useState } from 'react';

// GraphQL queries to fetch pending businesses.  These return
// businesses with isActive = false.  Admins use this page to
// approve or reject new registrations.
const GET_PENDING_HOTELS = gql`
  query GetPendingHotels {
    pendingHotels {
      id
      name
      contact {
        email
      }
    }
  }
`;
const GET_PENDING_RESTAURANTS = gql`
  query GetPendingRestaurants {
    pendingRestaurants {
      id
      name
      contact {
        email
      }
    }
  }
`;
const GET_PENDING_SALONS = gql`
  query GetPendingSalons {
    pendingSalons {
      id
      name
      contact {
        email
      }
    }
  }
`;

// Mutations to approve or reject a business.  Only isActive is
// modified; the back‑end resolves to the updated object.
const APPROVE_HOTEL = gql`
  mutation ApproveHotel($id: ID!) {
    approveHotel(id: $id) {
      id
      isActive

    }
  }
`;
const REJECT_HOTEL = gql`
  mutation RejectHotel($id: ID!) {
    rejectHotel(id: $id) {
      id
      isActive
    }
  }
`;
const APPROVE_RESTAURANT = gql`
  mutation ApproveRestaurant($id: ID!) {
    approveRestaurant(id: $id) {
      id
      isActive
    }
  }
`;
const REJECT_RESTAURANT = gql`
  mutation RejectRestaurant($id: ID!) {
    rejectRestaurant(id: $id) {
      id
      isActive
    }
  }
`;
const APPROVE_SALON = gql`
  mutation ApproveSalon($id: ID!) {
    approveSalon(id: $id) {
      id
      isActive
    }
  }
`;
const REJECT_SALON = gql`
  mutation RejectSalon($id: ID!) {
    rejectSalon(id: $id) {
      id
      isActive
    }
  }
`;

interface PendingEntry {
  id: string;
  name: string;
  type: string;
  email?: string;
}

export default function AdminApprovalsPage() {
  // Fetch pending businesses.  Each query returns an array of
  // businesses with just id and name.  We merge the results into a
  // single list with a type property for easier iteration.
  const { data: hotelsData, loading: hotelsLoading, refetch: refetchHotels } = useQuery(GET_PENDING_HOTELS);
  const { data: restaurantsData, loading: restaurantsLoading, refetch: refetchRestaurants } = useQuery(GET_PENDING_RESTAURANTS);
  const { data: salonsData, loading: salonsLoading, refetch: refetchSalons } = useQuery(GET_PENDING_SALONS);

  // Define mutation hooks.  Each returns a function we can call
  // directly when an admin clicks approve or reject.  After the
  // mutation we refetch the pending lists to update the UI.
  const [approveHotel] = useMutation(APPROVE_HOTEL, { onCompleted: () => refetchHotels() });
  const [rejectHotel] = useMutation(REJECT_HOTEL, { onCompleted: () => refetchHotels() });
  const [approveRestaurant] = useMutation(APPROVE_RESTAURANT, { onCompleted: () => refetchRestaurants() });
  const [rejectRestaurant] = useMutation(REJECT_RESTAURANT, { onCompleted: () => refetchRestaurants() });
  const [approveSalon] = useMutation(APPROVE_SALON, { onCompleted: () => refetchSalons() });

  // Detail queries for previewing a pending business.  These queries
  // fetch additional fields beyond the name/email displayed in the
  // table.  We use useLazyQuery so that they are only executed
  // when the user requests a preview.  Fields are selected to
  // provide meaningful context (description, address and contact).
  const HOTEL_DETAILS = gql`
    query HotelDetails($id: ID!) {
      hotel(id: $id) {
        id
        name
        description
        address {
          street
          city
          state
          zipCode
          country
        }
        contact {
          phone
          email
          website
        }
        settings {
          currency
          timezone
          taxRate
          serviceFee
        }
      }
    }
  `;
  const RESTAURANT_DETAILS = gql`
    query RestaurantDetails($id: ID!) {
      restaurant(id: $id) {
        id
        name
        description
        address {
          street
          city
          state
          zipCode
          country
        }
        contact {
          phone
          email
          website
        }
        settings {
          currency
          timezone
          taxRate
          serviceFee
          maxPartySize
          reservationWindow
          cancellationHours
        }
      }
    }
  `;
  const SALON_DETAILS = gql`
    query SalonDetails($id: ID!) {
      salon(id: $id) {
        id
        name
        description
        address {
          street
          city
          state
          zipCode
          country
        }
        contact {
          phone
          email
          website
        }
        settings {
          currency
          timezone
          taxRate
          serviceFee
        }
      }
    }
  `;
  const [getHotelDetails, { data: hotelDetailsData, loading: hotelDetailsLoading }] = useLazyQuery(HOTEL_DETAILS);
  const [getRestaurantDetails, { data: restaurantDetailsData, loading: restaurantDetailsLoading }] = useLazyQuery(RESTAURANT_DETAILS);
  const [getSalonDetails, { data: salonDetailsData, loading: salonDetailsLoading }] = useLazyQuery(SALON_DETAILS);

  // Track the entry currently being previewed.  When non-null a
  // modal will be displayed showing detailed information.  The
  // previewData object holds the fetched business details.
  const [previewEntry, setPreviewEntry] = useState<PendingEntry | null>(null);

  // Determine which detail data to use based on the previewEntry type.
  let previewData: any = null;
  if (previewEntry) {
    if (previewEntry.type === "hotel") previewData = hotelDetailsData?.hotel;
    else if (previewEntry.type === "restaurant") previewData = restaurantDetailsData?.restaurant;
    else if (previewEntry.type === "salon") previewData = salonDetailsData?.salon;
  }

  // Handler to initiate preview.  Executes the appropriate lazy query
  // based on the entry type and stores the entry for display.
  const handlePreview = (entry: PendingEntry) => {
    setPreviewEntry(entry);
    if (entry.type === "hotel") {
      getHotelDetails({ variables: { id: entry.id } });
    } else if (entry.type === "restaurant") {
      getRestaurantDetails({ variables: { id: entry.id } });
    } else if (entry.type === "salon") {
      getSalonDetails({ variables: { id: entry.id } });
    }
  };

  // Close the preview modal
  const handleClosePreview = () => {
    setPreviewEntry(null);
  };
  const [rejectSalon] = useMutation(REJECT_SALON, { onCompleted: () => refetchSalons() });

  // Combine all pending entries into a single array with type.
  const pendingEntries: PendingEntry[] = [];
  if (hotelsData?.pendingHotels) {
    pendingEntries.push(
      ...hotelsData.pendingHotels.map((h: any) => ({
        id: h.id,
        name: h.name,
        type: "hotel",
        email: h.contact?.email || undefined,
      }))
    );
  }
  if (restaurantsData?.pendingRestaurants) {
    pendingEntries.push(
      ...restaurantsData.pendingRestaurants.map((r: any) => ({
        id: r.id,
        name: r.name,
        type: "restaurant",
        email: r.contact?.email || undefined,
      }))
    );
  }
  if (salonsData?.pendingSalons) {
    pendingEntries.push(
      ...salonsData.pendingSalons.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: "salon",
        email: s.contact?.email || undefined,
      }))
    );
  }

  const handleApprove = (entry: PendingEntry) => {
    if (entry.type === "hotel") {
      approveHotel({ variables: { id: entry.id } });
    } else if (entry.type === "restaurant") {
      approveRestaurant({ variables: { id: entry.id } });
    } else if (entry.type === "salon") {
      approveSalon({ variables: { id: entry.id } });
    }
  };

  const handleReject = (entry: PendingEntry) => {
    if (entry.type === "hotel") {
      rejectHotel({ variables: { id: entry.id } });
    } else if (entry.type === "restaurant") {
      rejectRestaurant({ variables: { id: entry.id } });
    } else if (entry.type === "salon") {
      rejectSalon({ variables: { id: entry.id } });
    }
  };

  if (hotelsLoading || restaurantsLoading || salonsLoading) {
    return <p>Chargement des demandes en attente...</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-4">Demandes en attente</h1>
      {pendingEntries.length === 0 ? (
        <p>Aucune nouvelle demande en attente.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingEntries.map((entry) => (
                <tr key={`${entry.type}-${entry.id}`}
                    className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{entry.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 capitalize">{entry.type}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {entry.email || "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right space-x-2">
                    <button
                      onClick={() => handlePreview(entry)}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                    >
                      Aperçu
                    </button>
                    <button
                      onClick={() => handleApprove(entry)}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReject(entry)}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                    >
                      Refuser
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview modal.  Rendered when a previewEntry is selected. */}
      {previewEntry && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Détails {previewEntry.name}
              </h2>
              <button
                onClick={handleClosePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {((previewEntry.type === 'hotel' && hotelDetailsLoading) ||
              (previewEntry.type === 'restaurant' && restaurantDetailsLoading) ||
              (previewEntry.type === 'salon' && salonDetailsLoading)) ? (
              <p>Chargement des détails...</p>
            ) : previewData ? (
              <div className="space-y-3">
                <p><strong>Description:</strong> {previewData.description || '–'}</p>
                {previewData.address && (
                  <p>
                    <strong>Adresse:</strong> {[
                      previewData.address.street,
                      previewData.address.city,
                      previewData.address.state,
                      previewData.address.zipCode,
                      previewData.address.country,
                    ]
                      .filter(Boolean)
                      .join(', ') || '–'}
                  </p>
                )}
                {previewData.contact && (
                  <p>
                    <strong>Contact:</strong>{' '}
                    {[
                      previewData.contact.phone,
                      previewData.contact.email,
                      previewData.contact.website,
                    ]
                      .filter(Boolean)
                      .join(' | ') || '–'}
                  </p>
                )}
                {previewData.settings && (
                  <div>
                    <strong>Paramètres:</strong>
                    <ul className="list-disc list-inside">
                      {Object.entries(previewData.settings).map(([key, value]) => (
                        value !== null && value !== undefined ? (
                          <li key={key} className="capitalize">
                            {key}: {String(value)}
                          </li>
                        ) : null
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p>Aucun détail disponible.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}