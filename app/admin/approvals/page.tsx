"use client"

import { gql, useQuery, useMutation } from "@apollo/client";
import { useEffect, useState } from "react";

// GraphQL queries to fetch pending businesses.  These return
// businesses with isActive = false.  Admins use this page to
// approve or reject new registrations.
const GET_PENDING_HOTELS = gql`
  query GetPendingHotels {
    pendingHotels {
      id
      name
      
    }
  }
`;
const GET_PENDING_RESTAURANTS = gql`
  query GetPendingRestaurants {
    pendingRestaurants {
      id
      name
      
    }
  }
`;
const GET_PENDING_SALONS = gql`
  query GetPendingSalons {
    pendingSalons {
      id
      name
      
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
  const [rejectSalon] = useMutation(REJECT_SALON, { onCompleted: () => refetchSalons() });

  // Combine all pending entries into a single array with type.
  const pendingEntries: PendingEntry[] = [];
  if (hotelsData?.pendingHotels) {
    pendingEntries.push(...hotelsData.pendingHotels.map((h: any) => ({ id: h.id, name: h.name, type: "hotel" })));
  }
  if (restaurantsData?.pendingRestaurants) {
    pendingEntries.push(...restaurantsData.pendingRestaurants.map((r: any) => ({ id: r.id, name: r.name, type: "restaurant" })));
  }
  if (salonsData?.pendingSalons) {
    pendingEntries.push(...salonsData.pendingSalons.map((s: any) => ({ id: s.id, name: s.name, type: "salon" })));
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
                    {entry.type === "hotel" ? hotelsData?.pendingHotels.find((h: any) => h.id === entry.id)?.email :
                     entry.type === "restaurant" ? restaurantsData?.pendingRestaurants.find((r: any) => r.id === entry.id)?.email :
                     salonsData?.pendingSalons.find((s: any) => s.id === entry.id)?.email}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right space-x-2">
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
    </div>
  );
}