"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gql, useQuery, useMutation } from "@apollo/client";

/**
 * This page provides CRUD (create, read, update, delete) operations for hotel
 * rooms.  It fetches the currently authenticated hotel via the `myHotel`
 * query, then retrieves all rooms belonging to that hotel using the
 * `rooms(hotelId: ID!)` query.  A simple form allows the user to add a new
 * room or edit an existing one.  After each mutation the rooms list is
 * refetched to keep the UI in sync with the backend.
 */

// We intentionally omit the `myHotel` query here.  Instead we derive the
// current hotel identifier from the session via the `/api/session` endpoint.

const GET_HOTEL_AMENITIES = gql`
  query GetHotelAmenities($hotelId: ID!) {
    hotel(id: $hotelId) {
      id
      amenities {
        name
      }
    }
  }
`;

// Query to fetch rooms for a particular hotel
const GET_ROOMS = gql`
  query GetRooms($hotelId: ID!) {
    rooms(hotelId: $hotelId) {
      id
      number
      type
      floor
      capacity
      price
      status
      amenities
      images
      bedType
      numberOfBeds
      numberOfBathrooms
      description
      isActive
    }
  }
`;

// Mutation to create a new room
const CREATE_ROOM = gql`
  mutation CreateRoom($input: RoomInput!) {
    createRoom(input: $input) {
      id
      number
      type
      floor
      capacity
      price
      status
      amenities
      images
      bedType
      numberOfBeds
      numberOfBathrooms
      description
    }
  }
`;

// Mutation to update an existing room
const UPDATE_ROOM = gql`
  mutation UpdateRoom($id: ID!, $input: RoomInput!) {
    updateRoom(id: $id, input: $input) {
      id
      number
      type
      floor
      capacity
      price
      status
      amenities
      images
      bedType
      numberOfBeds
      numberOfBathrooms
      description
    }
  }
`;

// Mutation to soft delete a room
const DELETE_ROOM = gql`
  mutation DeleteRoom($id: ID!) {
    deleteRoom(id: $id)
  }
`;

// Define the shape of our form state for TypeScript
interface RoomFormState {
  id?: string;
  number: string;
  type: string;
  floor: number | "";
  capacity: number | "";
  price: number | "";
  status: string;
  amenities: string[];
  images: string;

  // Additional descriptive fields
  bedType: string[];
  numberOfBeds: number | "";
  numberOfBathrooms: number | "";
  description: string;
}

const bedTypes = ["Single", "Double", "Queen", "King"];

export default function HotelRoomsPage() {
  // Business context from the session.  We derive the current hotelId once
  // the session is loaded.  If the user is not associated with a hotel
  // account we display an error message.
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          setSessionLoading(false);
          return;
        }
        const data = await res.json();
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setHotelId(data.businessId);
        } else {
          setSessionError("You are not associated with a hotel business.");
        }
      } catch (err) {
        setSessionError("Failed to load session.");
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  // Fetch rooms once we have a hotelId
  const {
    data: roomsData,
    loading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms,
  } = useQuery(GET_ROOMS, {
    variables: { hotelId },
    skip: !hotelId,
  });

  // Fetch hotel amenities
  const { data: hotelData, loading: hotelLoading } = useQuery(GET_HOTEL_AMENITIES, {
    variables: { hotelId },
    skip: !hotelId,
  });

  // Prepare mutations
  const [createRoom] = useMutation(CREATE_ROOM);
  const [updateRoom] = useMutation(UPDATE_ROOM);
  const [deleteRoom] = useMutation(DELETE_ROOM);

  // Local form state and edit mode
  const [formState, setFormState] = useState<RoomFormState>({
    number: "",
    type: "Standard",
    floor: "",
    capacity: "",
    price: "",
    status: "available",
    amenities: [],
    images: "",
    bedType: [],
    numberOfBeds: "",
    numberOfBathrooms: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Router for navigating to room details
  const router = useRouter();

  // Reset the form when leaving edit mode
  const resetForm = () => {
    setFormState({
      number: "",
      type: "Standard",
      floor: "",
      capacity: "",
      price: "",
      status: "available",
      amenities: [],
      images: "",
      bedType: [],
      numberOfBeds: "",
      numberOfBathrooms: "",
      description: "",
    });
    setEditingId(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    // Convert the comma‑separated amenities and images into arrays
    const imagesArray = formState.images
      ? formState.images.split(",").map((i) => i.trim()).filter(Boolean)
      : [];
    // Build the input object matching RoomInput
    const input: any = {
      hotelId,
      number: formState.number,
      type: formState.type,
      floor: formState.floor !== "" ? Number(formState.floor) : undefined,
      capacity: formState.capacity !== "" ? Number(formState.capacity) : undefined,
      // Price is required in the backend (Float!), so default to 0 when empty
      price: formState.price !== "" ? Number(formState.price) : 0,
      status: formState.status,
      amenities: formState.amenities,
      features: [],
      condition: "good",
      images: imagesArray,

      // New descriptive fields
      bedType: formState.bedType,
      numberOfBeds: formState.numberOfBeds !== "" ? Number(formState.numberOfBeds) : undefined,
      numberOfBathrooms: formState.numberOfBathrooms !== "" ? Number(formState.numberOfBathrooms) : undefined,
      description: formState.description || undefined,
    };
    try {
      if (editingId) {
        await updateRoom({ variables: { id: editingId, input } });
      } else {
        await createRoom({ variables: { input } });
      }
      resetForm();
      refetchRooms();
    } catch (err) {
      console.error(err);
    }
  };
  
  // Handle editing a room
  const handleEdit = (room: any) => {
    setEditingId(room.id);
    setFormState({
      id: room.id,
      number: room.number || "",
      type: room.type || "Standard",
      floor: room.floor ?? "",
      capacity: room.capacity ?? "",
      price: room.price ?? "",
      status: room.status || "available",
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
      images: room.images?.join(", ") || "",
      // Populate new descriptive fields when editing
      bedType: Array.isArray(room.bedType) ? room.bedType : [],
      numberOfBeds: room.numberOfBeds ?? "",
      numberOfBathrooms: room.numberOfBathrooms ?? "",
      description: room.description || "",
    });
  };

  // Handle deletion of a room
  const handleDelete = async (id: string) => {
    if (confirm("Delete this room?")) {
      await deleteRoom({ variables: { id } });
      refetchRooms();
    }
  };

  // Render loading and error states
  if (sessionLoading || roomsLoading || hotelLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>;
  }
  if (roomsError) {
    return <div className="p-6 text-red-600">Error loading rooms.</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
        <p className="text-gray-600">Manage your hotel’s room inventory, including adding new rooms, editing existing ones, and adjusting availability.</p>
      </div>

      {/* Existing Rooms Table */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Existing Rooms</h2>
        {roomsData?.rooms && roomsData.rooms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700">Room Number</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Type</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Capacity</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Amenities</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roomsData.rooms.map((room: any) => (
                  <tr key={room.id} className="border-t">
                    <td className="px-4 py-2">{room.number}</td>
                    <td className="px-4 py-2">{room.type}</td>
                    <td className="px-4 py-2">{room.capacity ?? '-'}</td>
                    <td className="px-4 py-2">
                      {room.amenities && room.amenities.length > 0 ? room.amenities.join(", ") : "-"}
                    </td>
                    <td className="px-4 py-2 capitalize">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          room.status === "occupied"
                            ? "bg-red-100 text-red-800"
                            : room.status === "maintenance"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 space-x-2 whitespace-nowrap">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => handleEdit(room)}
                      >
                        Edit
                      </button>
                      <span>|</span>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => handleDelete(room.id)}
                      >
                        Delete
                      </button>
                      <span>|</span>
                      <button
                        className="text-green-600 hover:underline"
                        onClick={() => router.push(`/hotel/dashboard/rooms/${room.id}`)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No rooms found.</p>
        )}
      </div>

      {/* Add / Edit Room Form */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {editingId ? "Edit Room" : "Add New Room"}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
            <input
              type="text"
              value={formState.number}
              onChange={(e) => setFormState({ ...formState, number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
            <select
              value={formState.type}
              onChange={(e) => setFormState({ ...formState, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
              <option value="Executive">Executive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              value={formState.capacity}
              onChange={(e) =>
                setFormState({ ...formState, capacity: e.target.value === "" ? "" : Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              value={formState.price}
              onChange={(e) =>
                setFormState({ ...formState, price: e.target.value === "" ? "" : Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {hotelLoading ? (
                <p>Loading amenities...</p>
              ) : (
                hotelData?.hotel?.amenities.map((amenity: any) => (
                  <label key={amenity.name} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formState.amenities.includes(amenity.name)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormState((prevState) => {
                          const newAmenities = checked
                            ? [...prevState.amenities, amenity.name]
                            : prevState.amenities.filter((a) => a !== amenity.name);
                          return { ...prevState, amenities: newAmenities };
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span>{amenity.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        {/* Additional descriptive fields for the room.  These allow the hotelier
            to specify details like bed type, number of beds, number of
            bathrooms and a description. */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
          <div className="grid grid-cols-2 gap-2">
            {bedTypes.map((bedType) => (
              <label key={bedType} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formState.bedType.includes(bedType)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormState((prevState) => {
                      const newBedTypes = checked
                        ? [...prevState.bedType, bedType]
                        : prevState.bedType.filter((bt) => bt !== bedType);
                      return { ...prevState, bedType: newBedTypes };
                    });
                  }}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span>{bedType}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Beds</label>
          <input
            type="number"
            value={formState.numberOfBeds}
            onChange={(e) => setFormState({ ...formState, numberOfBeds: e.target.value === "" ? "" : Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Bathrooms</label>
          <input
            type="number"
            value={formState.numberOfBathrooms}
            onChange={(e) => setFormState({ ...formState, numberOfBathrooms: e.target.value === "" ? "" : Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formState.description}
            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
          <div className="md:col-span-2 flex items-center space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {editingId ? "Update Room" : "Add Room"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}