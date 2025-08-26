// "use client"

// import { gql, useQuery, useMutation, useLazyQuery } from "@apollo/client";
// import { useState } from 'react';

// // GraphQL queries to fetch pending businesses.  These return
// // businesses with isActive = false.  Admins use this page to
// // approve or reject new registrations.
// const GET_PENDING_HOTELS = gql`
//   query GetPendingHotels {
//     pendingHotels {
//       id
//       name
//       contact {
//         email
//       }
//     }
//   }
// `;
// const GET_PENDING_RESTAURANTS = gql`
//   query GetPendingRestaurants {
//     pendingRestaurants {
//       id
//       name
//       contact {
//         email
//       }
//     }
//   }
// `;
// const GET_PENDING_SALONS = gql`
//   query GetPendingSalons {
//     pendingSalons {
//       id
//       name
//       contact {
//         email
//       }
//     }
//   }
// `;

// // Mutations to approve or reject a business.  Only isActive is
// // modified; the back‑end resolves to the updated object.
// const APPROVE_HOTEL = gql`
//   mutation ApproveHotel($id: ID!) {
//     approveHotel(id: $id) {
//       id
//       isActive

//     }
//   }
// `;
// const REJECT_HOTEL = gql`
//   mutation RejectHotel($id: ID!) {
//     rejectHotel(id: $id) {
//       id
//       isActive
//     }
//   }
// `;
// const APPROVE_RESTAURANT = gql`
//   mutation ApproveRestaurant($id: ID!) {
//     approveRestaurant(id: $id) {
//       id
//       isActive
//     }
//   }
// `;
// const REJECT_RESTAURANT = gql`
//   mutation RejectRestaurant($id: ID!) {
//     rejectRestaurant(id: $id) {
//       id
//       isActive
//     }
//   }
// `;
// const APPROVE_SALON = gql`
//   mutation ApproveSalon($id: ID!) {
//     approveSalon(id: $id) {
//       id
//       isActive
//     }
//   }
// `;
// const REJECT_SALON = gql`
//   mutation RejectSalon($id: ID!) {
//     rejectSalon(id: $id) {
//       id
//       isActive
//     }
//   }
// `;

// interface PendingEntry {
//   id: string;
//   name: string;
//   type: string;
//   email?: string;
// }

// export default function AdminApprovalsPage() {
//   // Fetch pending businesses.  Each query returns an array of
//   // businesses with just id and name.  We merge the results into a
//   // single list with a type property for easier iteration.
//   const { data: hotelsData, loading: hotelsLoading, refetch: refetchHotels } = useQuery(GET_PENDING_HOTELS);
//   const { data: restaurantsData, loading: restaurantsLoading, refetch: refetchRestaurants } = useQuery(GET_PENDING_RESTAURANTS);
//   const { data: salonsData, loading: salonsLoading, refetch: refetchSalons } = useQuery(GET_PENDING_SALONS);

//   // Define mutation hooks.  Each returns a function we can call
//   // directly when an admin clicks approve or reject.  After the
//   // mutation we refetch the pending lists to update the UI.
//   const [approveHotel] = useMutation(APPROVE_HOTEL, { onCompleted: () => refetchHotels() });
//   const [rejectHotel] = useMutation(REJECT_HOTEL, { onCompleted: () => refetchHotels() });
//   const [approveRestaurant] = useMutation(APPROVE_RESTAURANT, { onCompleted: () => refetchRestaurants() });
//   const [rejectRestaurant] = useMutation(REJECT_RESTAURANT, { onCompleted: () => refetchRestaurants() });
//   const [approveSalon] = useMutation(APPROVE_SALON, { onCompleted: () => refetchSalons() });

//   // Detail queries for previewing a pending business.  These queries
//   // fetch additional fields beyond the name/email displayed in the
//   // table.  We use useLazyQuery so that they are only executed
//   // when the user requests a preview.  Fields are selected to
//   // provide meaningful context (description, address and contact).
//   const HOTEL_DETAILS = gql`
//     query HotelDetails($id: ID!) {
//       hotel(id: $id) {
//         id
//         name
//         description
//         address {
//           street
//           city
//           state
//           zipCode
//           country
//         }
//         contact {
//           phone
//           email
//           website
//         }
//         settings {
//           currency
//           timezone
//           taxRate
//           serviceFee
//         }
//       }
//     }
//   `;
//   const RESTAURANT_DETAILS = gql`
//     query RestaurantDetails($id: ID!) {
//       restaurant(id: $id) {
//         id
//         name
//         description
//         address {
//           street
//           city
//           state
//           zipCode
//           country
//         }
//         contact {
//           phone
//           email
//           website
//         }
//         settings {
//           currency
//           timezone
//           taxRate
//           serviceFee
//           maxPartySize
//           reservationWindow
//           cancellationHours
//         }
//       }
//     }
//   `;
//   const SALON_DETAILS = gql`
//     query SalonDetails($id: ID!) {
//       salon(id: $id) {
//         id
//         name
//         description
//         address {
//           street
//           city
//           state
//           zipCode
//           country
//         }
//         contact {
//           phone
//           email
//           website
//         }
//         settings {
//           currency
//           timezone
//           taxRate
//           serviceFee
//         }
//       }
//     }
//   `;
//   const [getHotelDetails, { data: hotelDetailsData, loading: hotelDetailsLoading }] = useLazyQuery(HOTEL_DETAILS);
//   const [getRestaurantDetails, { data: restaurantDetailsData, loading: restaurantDetailsLoading }] = useLazyQuery(RESTAURANT_DETAILS);
//   const [getSalonDetails, { data: salonDetailsData, loading: salonDetailsLoading }] = useLazyQuery(SALON_DETAILS);

//   // Track the entry currently being previewed.  When non-null a
//   // modal will be displayed showing detailed information.  The
//   // previewData object holds the fetched business details.
//   const [previewEntry, setPreviewEntry] = useState<PendingEntry | null>(null);

//   // Determine which detail data to use based on the previewEntry type.
//   let previewData: any = null;
//   if (previewEntry) {
//     if (previewEntry.type === "hotel") previewData = hotelDetailsData?.hotel;
//     else if (previewEntry.type === "restaurant") previewData = restaurantDetailsData?.restaurant;
//     else if (previewEntry.type === "salon") previewData = salonDetailsData?.salon;
//   }

//   // Handler to initiate preview.  Executes the appropriate lazy query
//   // based on the entry type and stores the entry for display.
//   const handlePreview = (entry: PendingEntry) => {
//     setPreviewEntry(entry);
//     if (entry.type === "hotel") {
//       getHotelDetails({ variables: { id: entry.id } });
//     } else if (entry.type === "restaurant") {
//       getRestaurantDetails({ variables: { id: entry.id } });
//     } else if (entry.type === "salon") {
//       getSalonDetails({ variables: { id: entry.id } });
//     }
//   };

//   // Close the preview modal
//   const handleClosePreview = () => {
//     setPreviewEntry(null);
//   };
//   const [rejectSalon] = useMutation(REJECT_SALON, { onCompleted: () => refetchSalons() });

//   // Combine all pending entries into a single array with type.
//   const pendingEntries: PendingEntry[] = [];
//   if (hotelsData?.pendingHotels) {
//     pendingEntries.push(
//       ...hotelsData.pendingHotels.map((h: any) => ({
//         id: h.id,
//         name: h.name,
//         type: "hotel",
//         email: h.contact?.email || undefined,
//       }))
//     );
//   }
//   if (restaurantsData?.pendingRestaurants) {
//     pendingEntries.push(
//       ...restaurantsData.pendingRestaurants.map((r: any) => ({
//         id: r.id,
//         name: r.name,
//         type: "restaurant",
//         email: r.contact?.email || undefined,
//       }))
//     );
//   }
//   if (salonsData?.pendingSalons) {
//     pendingEntries.push(
//       ...salonsData.pendingSalons.map((s: any) => ({
//         id: s.id,
//         name: s.name,
//         type: "salon",
//         email: s.contact?.email || undefined,
//       }))
//     );
//   }

//   const handleApprove = (entry: PendingEntry) => {
//     if (entry.type === "hotel") {
//       approveHotel({ variables: { id: entry.id } });
//     } else if (entry.type === "restaurant") {
//       approveRestaurant({ variables: { id: entry.id } });
//     } else if (entry.type === "salon") {
//       approveSalon({ variables: { id: entry.id } });
//     }
//   };

//   const handleReject = (entry: PendingEntry) => {
//     if (entry.type === "hotel") {
//       rejectHotel({ variables: { id: entry.id } });
//     } else if (entry.type === "restaurant") {
//       rejectRestaurant({ variables: { id: entry.id } });
//     } else if (entry.type === "salon") {
//       rejectSalon({ variables: { id: entry.id } });
//     }
//   };

//   if (hotelsLoading || restaurantsLoading || salonsLoading) {
//     return <p>Chargement des demandes en attente...</p>;
//   }

//   return (
//     <div className="space-y-8">
//       <h1 className="text-2xl font-bold mb-4">Demandes en attente</h1>
//       {pendingEntries.length === 0 ? (
//         <p>Aucune nouvelle demande en attente.</p>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200 border">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
//                 <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
//                 <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//                 <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {pendingEntries.map((entry) => (
//                 <tr key={`${entry.type}-${entry.id}`}
//                     className="hover:bg-gray-50">
//                   <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{entry.name}</td>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 capitalize">{entry.type}</td>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
//                     {entry.email || "-"}
//                   </td>
//                   <td className="px-4 py-2 whitespace-nowrap text-sm text-right space-x-2">
//                     <button
//                       onClick={() => handlePreview(entry)}
//                       className="inline-flex items-center px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
//                     >
//                       Aperçu
//                     </button>
//                     <button
//                       onClick={() => handleApprove(entry)}
//                       className="inline-flex items-center px-3 py-1 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700"
//                     >
//                       Approuver
//                     </button>
//                     <button
//                       onClick={() => handleReject(entry)}
//                       className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700"
//                     >
//                       Refuser
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Preview modal.  Rendered when a previewEntry is selected. */}
//       {previewEntry && (
//         <div
//           className="fixed inset-0 flex items-center justify-center z-50"
//           style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
//         >
//           <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 overflow-y-auto max-h-[90vh]">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">
//                 Détails {previewEntry.name}
//               </h2>
//               <button
//                 onClick={handleClosePreview}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 ✕
//               </button>
//             </div>
//             {((previewEntry.type === 'hotel' && hotelDetailsLoading) ||
//               (previewEntry.type === 'restaurant' && restaurantDetailsLoading) ||
//               (previewEntry.type === 'salon' && salonDetailsLoading)) ? (
//               <p>Chargement des détails...</p>
//             ) : previewData ? (
//               <div className="space-y-3">
//                 <p><strong>Description:</strong> {previewData.description || '–'}</p>
//                 {previewData.address && (
//                   <p>
//                     <strong>Adresse:</strong> {[
//                       previewData.address.street,
//                       previewData.address.city,
//                       previewData.address.state,
//                       previewData.address.zipCode,
//                       previewData.address.country,
//                     ]
//                       .filter(Boolean)
//                       .join(', ') || '–'}
//                   </p>
//                 )}
//                 {previewData.contact && (
//                   <p>
//                     <strong>Contact:</strong>{' '}
//                     {[
//                       previewData.contact.phone,
//                       previewData.contact.email,
//                       previewData.contact.website,
//                     ]
//                       .filter(Boolean)
//                       .join(' | ') || '–'}
//                   </p>
//                 )}
//                 {previewData.settings && (
//                   <div>
//                     <strong>Paramètres:</strong>
//                     <ul className="list-disc list-inside">
//                       {Object.entries(previewData.settings).map(([key, value]) => (
//                         value !== null && value !== undefined ? (
//                           <li key={key} className="capitalize">
//                             {key}: {String(value)}
//                           </li>
//                         ) : null
//                       ))}
//                     </ul>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <p>Aucun détail disponible.</p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




// test1



"use client"

import { gql, useQuery, useMutation, useLazyQuery } from "@apollo/client"
import { useState } from "react"

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
`
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
`
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
`

// Mutations to approve or reject a business.  Only isActive is
// modified; the back‑end resolves to the updated object.
const APPROVE_HOTEL = gql`
  mutation ApproveHotel($id: ID!) {
    approveHotel(id: $id) {
      id
      isActive

    }
  }
`
const REJECT_HOTEL = gql`
  mutation RejectHotel($id: ID!) {
    rejectHotel(id: $id) {
      id
      isActive
    }
  }
`
const APPROVE_RESTAURANT = gql`
  mutation ApproveRestaurant($id: ID!) {
    approveRestaurant(id: $id) {
      id
      isActive
    }
  }
`
const REJECT_RESTAURANT = gql`
  mutation RejectRestaurant($id: ID!) {
    rejectRestaurant(id: $id) {
      id
      isActive
    }
  }
`
const APPROVE_SALON = gql`
  mutation ApproveSalon($id: ID!) {
    approveSalon(id: $id) {
      id
      isActive
    }
  }
`
const REJECT_SALON = gql`
  mutation RejectSalon($id: ID!) {
    rejectSalon(id: $id) {
      id
      isActive
    }
  }
`

interface PendingEntry {
  id: string
  name: string
  type: string
  email?: string
}

export default function AdminApprovalsPage() {
  // Fetch pending businesses.  Each query returns an array of
  // businesses with just id and name.  We merge the results into a
  // single list with a type property for easier iteration.
  const { data: hotelsData, loading: hotelsLoading, refetch: refetchHotels } = useQuery(GET_PENDING_HOTELS)
  const {
    data: restaurantsData,
    loading: restaurantsLoading,
    refetch: refetchRestaurants,
  } = useQuery(GET_PENDING_RESTAURANTS)
  const { data: salonsData, loading: salonsLoading, refetch: refetchSalons } = useQuery(GET_PENDING_SALONS)

  // Define mutation hooks.  Each returns a function we can call
  // directly when an admin clicks approve or reject.  After the
  // mutation we refetch the pending lists to update the UI.
  const [approveHotel] = useMutation(APPROVE_HOTEL, { onCompleted: () => refetchHotels() })
  const [rejectHotel] = useMutation(REJECT_HOTEL, { onCompleted: () => refetchHotels() })
  const [approveRestaurant] = useMutation(APPROVE_RESTAURANT, { onCompleted: () => refetchRestaurants() })
  const [rejectRestaurant] = useMutation(REJECT_RESTAURANT, { onCompleted: () => refetchRestaurants() })
  const [approveSalon] = useMutation(APPROVE_SALON, { onCompleted: () => refetchSalons() })
  const [rejectSalon] = useMutation(REJECT_SALON, { onCompleted: () => refetchSalons() })

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
  `
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
  `
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
  `
  const [getHotelDetails, { data: hotelDetailsData, loading: hotelDetailsLoading }] = useLazyQuery(HOTEL_DETAILS)
  const [getRestaurantDetails, { data: restaurantDetailsData, loading: restaurantDetailsLoading }] =
    useLazyQuery(RESTAURANT_DETAILS)
  const [getSalonDetails, { data: salonDetailsData, loading: salonDetailsLoading }] = useLazyQuery(SALON_DETAILS)

  // Track the entry currently being previewed.  When non-null a
  // modal will be displayed showing detailed information.  The
  // previewData object holds the fetched business details.
  const [previewEntry, setPreviewEntry] = useState<PendingEntry | null>(null)

  // Determine which detail data to use based on the previewEntry type.
  let previewData: any = null
  if (previewEntry) {
    if (previewEntry.type === "hotel") previewData = hotelDetailsData?.hotel
    else if (previewEntry.type === "restaurant") previewData = restaurantDetailsData?.restaurant
    else if (previewEntry.type === "salon") previewData = salonDetailsData?.salon
  }

  // Handler to initiate preview.  Executes the appropriate lazy query
  // based on the entry type and stores the entry for display.
  const handlePreview = (entry: PendingEntry) => {
    setPreviewEntry(entry)
    if (entry.type === "hotel") {
      getHotelDetails({ variables: { id: entry.id } })
    } else if (entry.type === "restaurant") {
      getRestaurantDetails({ variables: { id: entry.id } })
    } else if (entry.type === "salon") {
      getSalonDetails({ variables: { id: entry.id } })
    }
  }

  // Close the preview modal
  const handleClosePreview = () => {
    setPreviewEntry(null)
  }

  // Combine all pending entries into a single array with type.
  const pendingEntries: PendingEntry[] = []
  if (hotelsData?.pendingHotels) {
    pendingEntries.push(
      ...hotelsData.pendingHotels.map((h: any) => ({
        id: h.id,
        name: h.name,
        type: "hotel",
        email: h.contact?.email || undefined,
      })),
    )
  }
  if (restaurantsData?.pendingRestaurants) {
    pendingEntries.push(
      ...restaurantsData.pendingRestaurants.map((r: any) => ({
        id: r.id,
        name: r.name,
        type: "restaurant",
        email: r.contact?.email || undefined,
      })),
    )
  }
  if (salonsData?.pendingSalons) {
    pendingEntries.push(
      ...salonsData.pendingSalons.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: "salon",
        email: s.contact?.email || undefined,
      })),
    )
  }

  const handleApprove = (entry: PendingEntry) => {
    if (entry.type === "hotel") {
      approveHotel({ variables: { id: entry.id } })
    } else if (entry.type === "restaurant") {
      approveRestaurant({ variables: { id: entry.id } })
    } else if (entry.type === "salon") {
      approveSalon({ variables: { id: entry.id } })
    }
  }

  const handleReject = (entry: PendingEntry) => {
    if (entry.type === "hotel") {
      rejectHotel({ variables: { id: entry.id } })
    } else if (entry.type === "restaurant") {
      rejectRestaurant({ variables: { id: entry.id } })
    } else if (entry.type === "salon") {
      rejectSalon({ variables: { id: entry.id } })
    }
  }

  if (hotelsLoading || restaurantsLoading || salonsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600 font-medium">Chargement des demandes en attente...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-balance">Demandes en attente</h1>
              <p className="mt-2 text-base text-gray-600">Gérez les nouvelles inscriptions d'entreprises</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>
                {pendingEntries.length} demande{pendingEntries.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {pendingEntries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune nouvelle demande</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Toutes les demandes d'inscription ont été traitées. Revenez plus tard pour voir les nouvelles soumissions.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Mobile view */}
            <div className="block sm:hidden">
              <div className="divide-y divide-gray-200">
                {pendingEntries.map((entry) => (
                  <div key={`${entry.type}-${entry.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{entry.name}</h3>
                        <div className="flex items-center mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {entry.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    {entry.email && <p className="text-sm text-gray-600 mb-3 truncate">{entry.email}</p>}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handlePreview(entry)}
                        className="flex-1 min-w-0 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Aperçu
                      </button>
                      <button
                        onClick={() => handleApprove(entry)}
                        className="inline-flex items-center px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReject(entry)}
                        className="inline-flex items-center px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      Entreprise
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingEntries.map((entry) => (
                    <tr key={`${entry.type}-${entry.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {entry.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{entry.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.email || "–"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handlePreview(entry)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Aperçu
                        </button>
                        <button
                          onClick={() => handleApprove(entry)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approuver
                        </button>
                        <button
                          onClick={() => handleReject(entry)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Refuser
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {previewEntry && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={handleClosePreview}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    {previewEntry.type === "hotel" && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                    )}
                    {previewEntry.type === "restaurant" && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    )}
                    {previewEntry.type === "salon" && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{previewEntry.name}</h2>
                    <p className="text-blue-100 text-sm capitalize">{previewEntry.type}</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePreview}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {(previewEntry.type === "hotel" && hotelDetailsLoading) ||
              (previewEntry.type === "restaurant" && restaurantDetailsLoading) ||
              (previewEntry.type === "salon" && salonDetailsLoading) ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Chargement des détails...</span>
                  </div>
                </div>
              ) : previewData ? (
                <div className="space-y-6">
                  {/* Description */}
                  {previewData.description && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">Description</h3>
                          <p className="text-gray-700 leading-relaxed">{previewData.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {previewData.address && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">Adresse</h3>
                          <p className="text-gray-700">
                            {[
                              previewData.address.street,
                              previewData.address.city,
                              previewData.address.state,
                              previewData.address.zipCode,
                              previewData.address.country,
                            ]
                              .filter(Boolean)
                              .join(", ") || "–"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  {previewData.contact && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">Contact</h3>
                          <div className="space-y-2">
                            {previewData.contact.phone && (
                              <div className="flex items-center space-x-2 text-sm">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                <span className="text-gray-700">{previewData.contact.phone}</span>
                              </div>
                            )}
                            {previewData.contact.email && (
                              <div className="flex items-center space-x-2 text-sm">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                  />
                                </svg>
                                <span className="text-gray-700">{previewData.contact.email}</span>
                              </div>
                            )}
                            {previewData.contact.website && (
                              <div className="flex items-center space-x-2 text-sm">
                                <svg
                                  className="w-4 h-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9"
                                  />
                                </svg>
                                <span className="text-gray-700">{previewData.contact.website}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Settings */}
                  {previewData.settings && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg
                            className="w-4 h-4 text-orange-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-3">Paramètres</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(previewData.settings).map(([key, value]) =>
                              value !== null && value !== undefined ? (
                                <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">{String(value)}</div>
                                </div>
                              ) : null,
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 text-gray-300 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-gray-500">Aucun détail disponible.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with action buttons */}
            {previewData && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      handleApprove(previewEntry)
                      handleClosePreview()
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approuver
                  </button>
                  <button
                    onClick={() => {
                      handleReject(previewEntry)
                      handleClosePreview()
                    }}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Refuser
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
