// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { gql, useQuery, useMutation } from "@apollo/client";

// /**
//  * This page provides CRUD (create, read, update, delete) operations for hotel
//  * rooms.  It fetches the currently authenticated hotel via the `myHotel`
//  * query, then retrieves all rooms belonging to that hotel using the
//  * `rooms(hotelId: ID!)` query.  A simple form allows the user to add a new
//  * room or edit an existing one.  After each mutation the rooms list is
//  * refetched to keep the UI in sync with the backend.
//  */

// // We intentionally omit the `myHotel` query here.  Instead we derive the
// // current hotel identifier from the session via the `/api/session` endpoint.

// const GET_HOTEL_AMENITIES = gql`
//   query GetHotelAmenities($hotelId: ID!) {
//     hotel(id: $hotelId) {
//       id
//       amenities {
//         name
//       }
//     }
//   }
// `;

// // Query to fetch rooms for a particular hotel
// const GET_ROOMS = gql`
//   query GetRooms($hotelId: ID!) {
//     rooms(hotelId: $hotelId) {
//       id
//       number
//       type
//       floor
//       capacity
//       price
//       status
//       amenities
//       images
//       bedType
//       numberOfBeds
//       numberOfBathrooms
//       description
//       isActive
//     }
//   }
// `;

// // Mutation to create a new room
// const CREATE_ROOM = gql`
//   mutation CreateRoom($input: RoomInput!) {
//     createRoom(input: $input) {
//       id
//       number
//       type
//       floor
//       capacity
//       price
//       status
//       amenities
//       images
//       bedType
//       numberOfBeds
//       numberOfBathrooms
//       description
//     }
//   }
// `;

// // Mutation to update an existing room
// const UPDATE_ROOM = gql`
//   mutation UpdateRoom($id: ID!, $input: RoomInput!) {
//     updateRoom(id: $id, input: $input) {
//       id
//       number
//       type
//       floor
//       capacity
//       price
//       status
//       amenities
//       images
//       bedType
//       numberOfBeds
//       numberOfBathrooms
//       description
//     }
//   }
// `;

// // Mutation to soft delete a room
// const DELETE_ROOM = gql`
//   mutation DeleteRoom($id: ID!) {
//     deleteRoom(id: $id)
//   }
// `;

// // Define the shape of our form state for TypeScript
// interface RoomFormState {
//   id?: string;
//   number: string;
//   type: string;
//   floor: number | "";
//   capacity: number | "";
//   price: number | "";
//   status: string;
//   amenities: string[];
//   images: string;

//   // Additional descriptive fields
//   bedType: string[];
//   numberOfBeds: number | "";
//   numberOfBathrooms: number | "";
//   description: string;
// }

// const bedTypes = ["Single", "Double", "Queen", "King"];

// export default function HotelRoomsPage() {
//   // Business context from the session.  We derive the current hotelId once
//   // the session is loaded.  If the user is not associated with a hotel
//   // account we display an error message.
//   const [hotelId, setHotelId] = useState<string | null>(null);
//   const [sessionLoading, setSessionLoading] = useState(true);
//   const [sessionError, setSessionError] = useState<string | null>(null);

//   useEffect(() => {
//     async function fetchSession() {
//       try {
//         const res = await fetch("/api/session");
//         if (!res.ok) {
//           setSessionLoading(false);
//           return;
//         }
//         const data = await res.json();
//         if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
//           setHotelId(data.businessId);
//         } else {
//           setSessionError("You are not associated with a hotel business.");
//         }
//       } catch (err) {
//         setSessionError("Failed to load session.");
//       } finally {
//         setSessionLoading(false);
//       }
//     }
//     fetchSession();
//   }, []);

//   // Fetch rooms once we have a hotelId
//   const {
//     data: roomsData,
//     loading: roomsLoading,
//     error: roomsError,
//     refetch: refetchRooms,
//   } = useQuery(GET_ROOMS, {
//     variables: { hotelId },
//     skip: !hotelId,
//   });

//   // Fetch hotel amenities
//   const { data: hotelData, loading: hotelLoading } = useQuery(GET_HOTEL_AMENITIES, {
//     variables: { hotelId },
//     skip: !hotelId,
//   });

//   // Prepare mutations
//   const [createRoom] = useMutation(CREATE_ROOM);
//   const [updateRoom] = useMutation(UPDATE_ROOM);
//   const [deleteRoom] = useMutation(DELETE_ROOM);

//   // Local form state and edit mode
//   const [formState, setFormState] = useState<RoomFormState>({
//     number: "",
//     type: "Standard",
//     floor: "",
//     capacity: "",
//     price: "",
//     status: "available",
//     amenities: [],
//     images: "",
//     bedType: [],
//     numberOfBeds: "",
//     numberOfBathrooms: "",
//     description: "",
//   });
//   const [editingId, setEditingId] = useState<string | null>(null);

//   // Router for navigating to room details
//   const router = useRouter();

//   // Reset the form when leaving edit mode
//   const resetForm = () => {
//     setFormState({
//       number: "",
//       type: "Standard",
//       floor: "",
//       capacity: "",
//       price: "",
//       status: "available",
//       amenities: [],
//       images: "",
//       bedType: [],
//       numberOfBeds: "",
//       numberOfBathrooms: "",
//       description: "",
//     });
//     setEditingId(null);
//   };

//   // Handle form submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!hotelId) return;
//     // Convert the comma‑separated amenities and images into arrays
//     const imagesArray = formState.images
//       ? formState.images.split(",").map((i) => i.trim()).filter(Boolean)
//       : [];
//     // Build the input object matching RoomInput
//     const input: any = {
//       hotelId,
//       number: formState.number,
//       type: formState.type,
//       floor: formState.floor !== "" ? Number(formState.floor) : undefined,
//       capacity: formState.capacity !== "" ? Number(formState.capacity) : undefined,
//       // Price is required in the backend (Float!), so default to 0 when empty
//       price: formState.price !== "" ? Number(formState.price) : 0,
//       status: formState.status,
//       amenities: formState.amenities,
//       features: [],
//       condition: "good",
//       images: imagesArray,

//       // New descriptive fields
//       bedType: formState.bedType,
//       numberOfBeds: formState.numberOfBeds !== "" ? Number(formState.numberOfBeds) : undefined,
//       numberOfBathrooms: formState.numberOfBathrooms !== "" ? Number(formState.numberOfBathrooms) : undefined,
//       description: formState.description || undefined,
//     };
//     try {
//       if (editingId) {
//         await updateRoom({ variables: { id: editingId, input } });
//       } else {
//         await createRoom({ variables: { input } });
//       }
//       resetForm();
//       refetchRooms();
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Handle editing a room
//   const handleEdit = (room: any) => {
//     setEditingId(room.id);
//     setFormState({
//       id: room.id,
//       number: room.number || "",
//       type: room.type || "Standard",
//       floor: room.floor ?? "",
//       capacity: room.capacity ?? "",
//       price: room.price ?? "",
//       status: room.status || "available",
//       amenities: Array.isArray(room.amenities) ? room.amenities : [],
//       images: room.images?.join(", ") || "",
//       // Populate new descriptive fields when editing
//       bedType: Array.isArray(room.bedType) ? room.bedType : [],
//       numberOfBeds: room.numberOfBeds ?? "",
//       numberOfBathrooms: room.numberOfBathrooms ?? "",
//       description: room.description || "",
//     });
//   };

//   // Handle deletion of a room
//   const handleDelete = async (id: string) => {
//     if (confirm("Delete this room?")) {
//       await deleteRoom({ variables: { id } });
//       refetchRooms();
//     }
//   };

//   // Render loading and error states
//   if (sessionLoading || roomsLoading || hotelLoading) {
//     return <div className="p-6">Loading...</div>;
//   }
//   if (sessionError) {
//     return <div className="p-6 text-red-600">{sessionError}</div>;
//   }
//   if (roomsError) {
//     return <div className="p-6 text-red-600">Error loading rooms.</div>;
//   }

//   return (
//     <div className="p-6 space-y-8">
//       {/* Page Header */}
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">Rooms Management</h1>
//         <p className="text-gray-600">Manage your hotel’s room inventory, including adding new rooms, editing existing ones, and adjusting availability.</p>
//       </div>

//       {/* Existing Rooms Table */}
//       <div className="bg-white rounded-lg shadow-sm border p-4">
//         <h2 className="text-lg font-medium text-gray-900 mb-4">Existing Rooms</h2>
//         {roomsData?.rooms && roomsData.rooms.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm text-left">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-2 font-medium text-gray-700">Room Number</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">Type</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">Capacity</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">Amenities</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">Status</th>
//                   <th className="px-4 py-2 font-medium text-gray-700">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {roomsData.rooms.map((room: any) => (
//                   <tr key={room.id} className="border-t">
//                     <td className="px-4 py-2">{room.number}</td>
//                     <td className="px-4 py-2">{room.type}</td>
//                     <td className="px-4 py-2">{room.capacity ?? '-'}</td>
//                     <td className="px-4 py-2">
//                       {room.amenities && room.amenities.length > 0 ? room.amenities.join(", ") : "-"}
//                     </td>
//                     <td className="px-4 py-2 capitalize">
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           room.status === "occupied"
//                             ? "bg-red-100 text-red-800"
//                             : room.status === "maintenance"
//                             ? "bg-yellow-100 text-yellow-800"
//                             : "bg-green-100 text-green-800"
//                         }`}
//                       >
//                         {room.status}
//                       </span>
//                     </td>
//                     <td className="px-4 py-2 space-x-2 whitespace-nowrap">
//                       <button
//                         className="text-blue-600 hover:underline"
//                         onClick={() => handleEdit(room)}
//                       >
//                         Edit
//                       </button>
//                       <span>|</span>
//                       <button
//                         className="text-red-600 hover:underline"
//                         onClick={() => handleDelete(room.id)}
//                       >
//                         Delete
//                       </button>
//                       <span>|</span>
//                       <button
//                         className="text-green-600 hover:underline"
//                         onClick={() => router.push(`/hotel/dashboard/rooms/${room.id}`)}
//                       >
//                         Details
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <p>No rooms found.</p>
//         )}
//       </div>

//       {/* Add / Edit Room Form */}
//       <div className="bg-white rounded-lg shadow-sm border p-4">
//         <h2 className="text-lg font-medium text-gray-900 mb-4">
//           {editingId ? "Edit Room" : "Add New Room"}
//         </h2>
//         <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
//             <input
//               type="text"
//               value={formState.number}
//               onChange={(e) => setFormState({ ...formState, number: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
//             <select
//               value={formState.type}
//               onChange={(e) => setFormState({ ...formState, type: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="Standard">Standard</option>
//               <option value="Deluxe">Deluxe</option>
//               <option value="Suite">Suite</option>
//               <option value="Executive">Executive</option>
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
//             <input
//               type="number"
//               value={formState.capacity}
//               onChange={(e) =>
//                 setFormState({ ...formState, capacity: e.target.value === "" ? "" : Number(e.target.value) })
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
//             <input
//               type="number"
//               value={formState.price}
//               onChange={(e) =>
//                 setFormState({ ...formState, price: e.target.value === "" ? "" : Number(e.target.value) })
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
//             <div className="grid grid-cols-2 gap-2">
//               {hotelLoading ? (
//                 <p>Loading amenities...</p>
//               ) : (
//                 hotelData?.hotel?.amenities.map((amenity: any) => (
//                   <label key={amenity.name} className="flex items-center space-x-2">
//                     <input
//                       type="checkbox"
//                       checked={formState.amenities.includes(amenity.name)}
//                       onChange={(e) => {
//                         const checked = e.target.checked;
//                         setFormState((prevState) => {
//                           const newAmenities = checked
//                             ? [...prevState.amenities, amenity.name]
//                             : prevState.amenities.filter((a) => a !== amenity.name);
//                           return { ...prevState, amenities: newAmenities };
//                         });
//                       }}
//                       className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//                     />
//                     <span>{amenity.name}</span>
//                   </label>
//                 ))
//               )}
//             </div>
//           </div>
//         {/* Additional descriptive fields for the room.  These allow the hotelier
//             to specify details like bed type, number of beds, number of
//             bathrooms and a description. */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
//           <div className="grid grid-cols-2 gap-2">
//             {bedTypes.map((bedType) => (
//               <label key={bedType} className="flex items-center space-x-2">
//                 <input
//                   type="checkbox"
//                   checked={formState.bedType.includes(bedType)}
//                   onChange={(e) => {
//                     const checked = e.target.checked;
//                     setFormState((prevState) => {
//                       const newBedTypes = checked
//                         ? [...prevState.bedType, bedType]
//                         : prevState.bedType.filter((bt) => bt !== bedType);
//                       return { ...prevState, bedType: newBedTypes };
//                     });
//                   }}
//                   className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
//                 />
//                 <span>{bedType}</span>
//               </label>
//             ))}
//           </div>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Number of Beds</label>
//           <input
//             type="number"
//             value={formState.numberOfBeds}
//             onChange={(e) => setFormState({ ...formState, numberOfBeds: e.target.value === "" ? "" : Number(e.target.value) })}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Number of Bathrooms</label>
//           <input
//             type="number"
//             value={formState.numberOfBathrooms}
//             onChange={(e) => setFormState({ ...formState, numberOfBathrooms: e.target.value === "" ? "" : Number(e.target.value) })}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
//         <div className="md:col-span-2">
//           <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//           <textarea
//             value={formState.description}
//             onChange={(e) => setFormState({ ...formState, description: e.target.value })}
//             rows={3}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           />
//         </div>
//           <div className="md:col-span-2 flex items-center space-x-4">
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
//             >
//               {editingId ? "Update Room" : "Add Room"}
//             </button>
//             {editingId && (
//               <button
//                 type="button"
//                 onClick={resetForm}
//                 className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
//               >
//                 Cancel
//               </button>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }




// test1




"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { gql, useQuery, useMutation } from "@apollo/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Bed, Users, Edit, Trash2, Eye, Hotel, Sparkles } from "lucide-react"
import useTranslation from "@/hooks/useTranslation";
// Import dialog components for the AI generation modal
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
// Import toast hook to display success/error messages
import { useToast } from "@/hooks/use-toast"

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
`

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
      # Fetch paid options configured for each room so that they can be
      # pre‑selected when editing.  Each option includes its name,
      # optional description and category, and a price.
      paidOptions {
        name
        description
        category
        price
      }
    }
  }
`

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
`

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
`

// Mutation to soft delete a room
const DELETE_ROOM = gql`
  mutation DeleteRoom($id: ID!) {
    deleteRoom(id: $id)
  }
`

// Query to fetch custom room types defined by the hotel.  Falls back to
// an empty array when none are defined.  These names populate the
// room type select in the form below.
const GET_ROOM_TYPES = gql`
  query GetRoomTypes($hotelId: ID!) {
    roomTypes(hotelId: $hotelId) {
      id
      name
    }
  }
`

// Query to fetch the hotel's paid room options.  These options are defined
// on the parent hotel and can be attached to rooms as add‑ons.  We
// fetch them separately so that they can be displayed in the room
// creation and editing form.
const GET_HOTEL_PAID_OPTIONS = gql`
  query GetHotelPaidOptions($id: ID!) {
    hotel(id: $id) {
      id
      roomPaidOptions {
        name
        description
        category
        price
      }
    }
  }
`

// Define the shape of our form state for TypeScript
interface RoomFormState {
  id?: string
  number: string
  type: string
  floor: number | ""
  capacity: number | ""
  price: number | ""
  status: string
  amenities: string[]
  images: string
  // Additional descriptive fields
  bedType: { id: string; type: string }[]
  numberOfBeds: number | ""
  numberOfBathrooms: number | ""
  description: string
  /**
   * Paid options selected for this room.  Each entry corresponds to a
   * purchasable add‑on defined on the hotel.  When no options are
   * selected this array is empty.  Each object stores the option's
   * name, optional description and category, and price.
   */
  paidOptions: { name: string; description?: string | null; category?: string | null; price: number }[]
}

const bedTypes = ["Single", "Double", "Queen", "King", "Twin Beds", "Bunk Bed", "Sofa Bed", "Murphy Bed"]

export default function HotelRoomsPage() {
  // Business context from the session.  We derive the current hotelId once
  // the session is loaded.  If the user is not associated with a hotel
  // account we display an error message.
  const [hotelId, setHotelId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const editFormRef = useRef<HTMLDivElement>(null)

  // Reference to the AI conversation container.  We use this to
  // automatically scroll to the bottom when new messages are added,
  // ensuring that the latest assistant response is always visible.
  const conversationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          setSessionLoading(false)
          return
        }
        const data = await res.json()
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setHotelId(data.businessId)
        } else {
          setSessionError("You are not associated with a hotel business.")
        }
      } catch (err) {
        setSessionError("Failed to load session.")
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  // We'll define the scroll effect later after aiMessages and aiSending are declared

  // Fetch rooms once we have a hotelId
  const {
    data: roomsData,
    loading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms,
  } = useQuery(GET_ROOMS, {
    variables: { hotelId },
    skip: !hotelId,
  })

  // Fetch custom room types defined for this hotel.  When no types
  // exist the result will be an empty array.  We skip the query
  // entirely until a hotelId is present.
  const {
    data: roomTypesData,
    loading: roomTypesLoading,
    error: roomTypesError,
    refetch: refetchRoomTypes,
  } = useQuery(GET_ROOM_TYPES, {
    variables: { hotelId },
    skip: !hotelId,
  })

  // Fetch hotel amenities
  const { data: hotelData, loading: hotelLoading } = useQuery(GET_HOTEL_AMENITIES, {
    variables: { hotelId },
    skip: !hotelId,
  })

  // Fetch hotel paid room options.  We skip this query until we
  // have a hotelId from the session.  If no options are defined
  // the resulting array will be empty.
  const {
    data: hotelOptionsData,
    loading: hotelOptionsLoading,
    error: hotelOptionsError,
  } = useQuery(GET_HOTEL_PAID_OPTIONS, {
    variables: { id: hotelId },
    skip: !hotelId,
  })

  // Prepare mutations
  const [createRoom] = useMutation(CREATE_ROOM)
  const [updateRoom] = useMutation(UPDATE_ROOM)
  const [deleteRoom] = useMutation(DELETE_ROOM)

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
    // Initialize with no paid options selected
    paidOptions: [],
  })

  const [editingId, setEditingId] = useState<string | null>(null)

  // Router for navigating to room details
  const router = useRouter()

  // Translation hook
  const { t } = useTranslation()

  // Toast for user feedback
  const { toast } = useToast()

  // AI generation modal state
  const [aiModalOpen, setAiModalOpen] = useState(false)
  // Conversation history for the AI assistant.  Each message has a role
  // (either 'user' or 'assistant') and a content string.  When the
  // assistant returns rooms the conversation will reset.
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  // Current input for the next message to send to the assistant
  const [aiInput, setAiInput] = useState("")
  // Loading state while awaiting a response from the assistant
  const [aiSending, setAiSending] = useState(false)

  // When the AI returns a set of rooms we store them here for review.  The
  // user can edit these room objects before committing them to the
  // backend.  Each object includes at least the fields returned by
  // the assistant: number, type, floor, capacity, price, status,
  // amenities, images, bedType, numberOfBeds, numberOfBathrooms and
  // description.  Additional fields will be carried through
  // unchanged.
  const [generatedRooms, setGeneratedRooms] = useState<any[]>([])

  // Scroll the conversation container to the bottom whenever new AI
  // messages arrive or a message is being sent.  This improves
  // usability by always showing the latest assistant response.
  useEffect(() => {
    if (conversationRef.current) {
      const el = conversationRef.current
      el.scrollTop = el.scrollHeight
    }
  }, [aiMessages, aiSending])

  /**
   * Send the current user input to the AI assistant.  This posts
   * the conversation history (including the new user message) to
   * `/api/generate-rooms`.  The server will respond with the
   * assistant's reply and optionally a list of generated rooms.  When
   * rooms are returned they are created via the createRoom mutation
   * and the conversation resets.  Otherwise the conversation
   * continues with the assistant's question or comment.
   */
  const handleAiSend = async () => {
    const trimmed = aiInput.trim()
    if (!trimmed) return
    if (!hotelId) return
    // Append the user's message to the conversation.  We don't commit
    // the assistant's response until after we see whether rooms were returned
    const updatedMessages = [...aiMessages, { role: "user", content: trimmed }]
    setAiMessages(updatedMessages)
    setAiInput("")
    setAiSending(true)
    try {
      const res = await fetch("/api/generate-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to communicate with AI")
      }
      const data = await res.json()
      const assistantMessage: string = data.message || ""
      // If the assistant produced rooms, populate them into the review state
      // instead of immediately creating them.  This allows the user to
      // inspect and modify the generated rooms before they are saved to
      // the backend.  We return early to avoid showing the raw JSON
      // message in the conversation.  Instead we display a friendly
      // notice below the chat.
      if (Array.isArray(data.rooms) && data.rooms.length > 0) {
        const rooms: any[] = data.rooms
        // Deduplicate rooms to avoid creating duplicates.  We compare
        // entire room objects via JSON serialization.
        const uniqueRooms: any[] = []
        const seen = new Set<string>()
        for (const room of rooms) {
          const key = JSON.stringify(room)
          if (!seen.has(key)) {
            seen.add(key)
            uniqueRooms.push(room)
          }
        }
        setGeneratedRooms(uniqueRooms)
        toast({
          title: t("roomsGeneratedSuccessfully") || "Rooms generated",
          description:
            uniqueRooms.length > 0
              ? `${uniqueRooms.length} room${uniqueRooms.length > 1 ? "s" : ""} generated. Please review and edit them before creating.`
              : "No rooms were generated from the description.",
        })
        // Append a friendly notice to the conversation instead of the raw JSON
        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              t("aiRoomsGeneratedNotice") ||
              "I have generated the rooms based on your descriptions. Please review and edit them below before creating.",
          },
        ])
        return
      }
      // Otherwise, append the assistant's reply as normal
      setAiMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }])
    } catch (error) {
      console.error(error)
      toast({
        title: t("errorGeneratingRooms") || "Error",
        description: t("somethingWentWrongPleaseTryAgain") || "Something went wrong, please try again.",
        variant: "destructive",
      })
    } finally {
      setAiSending(false)
    }
  }

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
      paidOptions: [],
    })
    setEditingId(null)
  }

  const handleBedTypeSelect = (bedType: string) => {
    setFormState((prev) => ({
      ...prev,
      bedType: [...prev.bedType, { id: Date.now().toString() + Math.random(), type: bedType }],
    }))
  }

  const removeBedType = (bedTypeId: string) => {
    setFormState((prev) => ({
      ...prev,
      bedType: prev.bedType.filter((bed) => bed.id !== bedTypeId),
    }))
  }

  /**
   * Update a field on one of the AI‑generated rooms currently being
   * reviewed.  The index identifies which room in the generatedRooms
   * array to update.  The field name and value are passed through to
   * create a new room object, ensuring React state immutability.  If
   * the field does not already exist on the room object it will be
   * added.
   */
  const handleGeneratedRoomChange = (index: number, field: string, value: any) => {
    setGeneratedRooms((prev) => {
      const newRooms = [...prev]
      const room = { ...newRooms[index], [field]: value }
      newRooms[index] = room
      return newRooms
    })
  }

  /**
   * Toggle an amenity for a generated room on or off.  When checked
   * the amenity is appended to the amenities array if not already
   * present.  When unchecked the amenity is removed from the array.
   */
  const toggleGeneratedRoomAmenity = (index: number, amenity: string, isChecked: boolean) => {
    setGeneratedRooms((prev) => {
      const newRooms = [...prev]
      const room = { ...newRooms[index] }
      const currentAmenities: string[] = Array.isArray(room.amenities) ? room.amenities : []
      let updated: string[]
      if (isChecked) {
        updated = currentAmenities.includes(amenity) ? currentAmenities : [...currentAmenities, amenity]
      } else {
        updated = currentAmenities.filter((a) => a !== amenity)
      }
      room.amenities = updated
      newRooms[index] = room
      return newRooms
    })
  }

  /**
   * Toggle a bed type for a generated room on or off.  When checked
   * the bed type is appended to the bedType array if not already
   * present.  When unchecked the bed type is removed from the array.
   */
  const toggleGeneratedRoomBedType = (index: number, bedType: string, isChecked: boolean) => {
    setGeneratedRooms((prev) => {
      const newRooms = [...prev]
      const room = { ...newRooms[index] }
      const currentBeds: string[] = Array.isArray(room.bedType) ? room.bedType : []
      let updated: string[]
      if (isChecked) {
        updated = currentBeds.includes(bedType) ? currentBeds : [...currentBeds, bedType]
      } else {
        updated = currentBeds.filter((b) => b !== bedType)
      }
      room.bedType = updated
      newRooms[index] = room
      return newRooms
    })
  }

  /**
   * Remove a generated room from the review list by index.  This
   * allows the hotel manager to discard any rooms that are not
   * desired before saving to the backend.
   */
  const removeGeneratedRoom = (index: number) => {
    setGeneratedRooms((prev) => prev.filter((_, i) => i !== index))
  }

  /**
   * Persist all AI‑generated rooms currently being reviewed.  For
   * each room we build an input object compatible with the GraphQL
   * mutation.  After all rooms are created the list is cleared, the
   * modal is closed and the rooms are refetched.  A toast notifies
   * the user of success.
   */
  const handleCreateGeneratedRooms = async () => {
    if (!hotelId) return
    if (generatedRooms.length === 0) return
    try {
      // Deduplicate rooms again before creation to avoid duplicate room
      // submissions.  Use JSON serialization for comparison.
      const uniqueRooms: any[] = []
      const seen = new Set<string>()
      generatedRooms.forEach((room) => {
        const key = JSON.stringify(room)
        if (!seen.has(key)) {
          seen.add(key)
          uniqueRooms.push(room)
        }
      })
      for (const [idx, room] of uniqueRooms.entries()) {
        const input: any = {
          hotelId,
          // Ensure the room number is a numeric value when possible.  If the
          // AI provided a string that represents a number, convert it.  If
          // conversion fails or the field is empty, generate a unique
          // fallback using the timestamp.  This prevents non-numeric
          // identifiers being sent to the backend.
          number:
            `${room.number}` || `AI-${Date.now()}-${idx + 1}`,
          type: room.type || "Standard",
          floor: typeof room.floor === "number" ? room.floor : room.floor !== undefined && room.floor !== null && room.floor !== "" ? Number(room.floor) : undefined,
          capacity: typeof room.capacity === "number" ? room.capacity : room.capacity !== undefined && room.capacity !== null && room.capacity !== "" ? Number(room.capacity) : undefined,
          price: typeof room.price === "number" ? room.price : room.price !== undefined && room.price !== null && room.price !== "" ? Number(room.price) : 0,
          status: room.status || "available",
          amenities: Array.isArray(room.amenities) ? room.amenities : [],
          features: [],
          condition: "good",
          images: Array.isArray(room.images) ? room.images : [],
          bedType: Array.isArray(room.bedType) ? room.bedType : [],
          numberOfBeds:
            typeof room.numberOfBeds === "number"
              ? room.numberOfBeds
              : room.numberOfBeds !== undefined && room.numberOfBeds !== null && room.numberOfBeds !== ""
                ? Number(room.numberOfBeds)
                : undefined,
          numberOfBathrooms:
            typeof room.numberOfBathrooms === "number"
              ? room.numberOfBathrooms
              : room.numberOfBathrooms !== undefined && room.numberOfBathrooms !== null && room.numberOfBathrooms !== ""
                ? Number(room.numberOfBathrooms)
                : undefined,
          description: room.description || undefined,
        }
        await createRoom({ variables: { input } })
      }
      toast({
        title: t("roomsCreatedSuccessfully") || "Rooms created",
        description:
          uniqueRooms.length > 0
            ? `${uniqueRooms.length} room${uniqueRooms.length > 1 ? "s" : ""} added successfully.`
            : "No rooms were created.",
      })
      await refetchRooms()
      setGeneratedRooms([])
      setAiModalOpen(false)
      // Clear AI conversation after creation
      setAiMessages([])
    } catch (error) {
      console.error(error)
      toast({
        title: t("errorCreatingRooms") || "Error",
        description: t("somethingWentWrongPleaseTryAgain") || "Something went wrong, please try again.",
        variant: "destructive",
      })
    }
  }

  /**
   * Toggle a paid option on or off in the form state.  When the option is
   * checked we append it to the existing array, ensuring no duplicates
   * based on the option name.  When unchecked we remove any option with
   * the matching name.  This allows the user to select multiple
   * paid add‑ons for a room.
   */
  const handlePaidOptionToggle = (option: any, isChecked: boolean) => {
    setFormState((prev) => {
      let newOptions: typeof prev.paidOptions
      if (isChecked) {
        // Avoid duplicates by checking if the option is already selected
        if (prev.paidOptions.some((o) => o.name === option.name)) {
          newOptions = prev.paidOptions
        } else {
          newOptions = [...prev.paidOptions, option]
        }
      } else {
        newOptions = prev.paidOptions.filter((o) => o.name !== option.name)
      }
      return { ...prev, paidOptions: newOptions }
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hotelId) return

    // Convert the comma‑separated amenities and images into arrays
    const imagesArray = formState.images
      ? formState.images
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean)
      : []

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
      // New descriptive fields - extract type strings from bed type objects
      bedType: formState.bedType.map((bed) => bed.type),
      numberOfBeds: formState.numberOfBeds !== "" ? Number(formState.numberOfBeds) : undefined,
      numberOfBathrooms: formState.numberOfBathrooms !== "" ? Number(formState.numberOfBathrooms) : undefined,
      description: formState.description || undefined,
      // Include selected paid options when creating or updating a room.
      // We map each selected option to a plain object containing its
      // name, description, category and price.  When no options are
      // selected the resulting array will be empty.
      paidOptions: formState.paidOptions.map((o) => ({
        name: o.name,
        description: o.description ?? undefined,
        category: o.category ?? undefined,
        price: o.price,
      })),
    }

    try {
      if (editingId) {
        await updateRoom({ variables: { id: editingId, input } })
      } else {
        await createRoom({ variables: { input } })
      }
      resetForm()
      refetchRooms()
    } catch (err) {
      console.error(err)
    }
  }

  // Handle editing a room
  const handleEdit = (room: any) => {
    setEditingId(room.id)
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
      // Convert bed type strings to objects with unique IDs
      bedType: Array.isArray(room.bedType)
        ? room.bedType.map((type: string, index: number) => ({
          id: `${room.id}-${type}-${index}`,
          type,
        }))
        : [],
      numberOfBeds: room.numberOfBeds ?? "",
      numberOfBathrooms: room.numberOfBathrooms ?? "",
      description: room.description || "",
      // Populate selected paid options when editing.  Fallback to an empty
      // array if the field is undefined to avoid leaving stale options.
      paidOptions: Array.isArray(room.paidOptions) ? room.paidOptions : [],
    })

    setTimeout(() => {
      editFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
  }

  // Handle deletion of a room
  const handleDelete = async (id: string) => {
    if (confirm(t("deleteRoomConfirm"))) {
      await deleteRoom({ variables: { id } })
      refetchRooms()
    }
  }

  // Render loading and error states
  if (sessionLoading || roomsLoading || hotelLoading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("loading")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-semibold text-gray-700">
            {t("paidRoomOptions")}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {hotelOptionsLoading ? (
              <p className="col-span-full text-gray-500">{t("loadingPaidOptions")}</p>
            ) : hotelOptionsData?.hotel?.roomPaidOptions?.length ? (
              hotelOptionsData.hotel.roomPaidOptions.map((option: any) => (
                <label
                  key={option.name}
                  className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formState.paidOptions.some((o) => o.name === option.name)}
                    onChange={(e) => handlePaidOptionToggle(option, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {option.name} (${option.price})
                  </span>
                </label>
              ))
            ) : (
              <p className="col-span-full text-gray-500">{t("noPaidOptionsDefined")}</p>
            )}
          </div>
        </div>
      </>
    )
  }

  if (sessionError) {
    // Determine the translated message based on known session error strings
    const errorMsg = sessionError === "You are not associated with a hotel business."
      ? t("notAssociatedWithHotel")
      : sessionError === "Failed to load session."
        ? t("failedToLoadSession")
        : sessionError
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">{errorMsg}</div>
        </div>
      </div>
    )
  }

  if (roomsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">{t("errorLoadingRooms")}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br ">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Hotel className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t("roomsManagementTitle")}
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t("roomsManagementDescription")}
          </p>
          {/* AI Rooms generation button centered below the header */}
          <div className="mt-6 flex justify-center">
            <Dialog
              open={aiModalOpen}
              onOpenChange={(open) => {
                setAiModalOpen(open)
                // When closing the modal, reset the AI conversation state
                if (!open) {
                  setAiMessages([])
                  setAiInput("")
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 transition-colors"
                >
                  <Sparkles className="h-5 w-5" />
                  {t("generateRoomsWithAI") || "Generate Rooms with AI"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl w-full">
                <DialogHeader>
                  <DialogTitle>{t("aiGenerateRoomsTitle") || "Generate Rooms with AI"}</DialogTitle>
                  <DialogDescription>
                    {t("aiGenerateRoomsDescription") ||
                      "Describe the types of rooms you would like to create. The AI will ask follow‑up questions to gather any missing details. When you have provided all information, type 'done' to generate the rooms."}
                  </DialogDescription>
                </DialogHeader>
                {generatedRooms.length === 0 ? (
                  <>
                    {/* Conversation history */}
                    <div
                      className="mt-4 max-h-60 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg border"
                      ref={conversationRef}
                    >
                      {aiMessages.length === 0 && (
                        <p className="text-gray-500 text-sm">
                          {t("aiConversationEmpty") ||
                            "Start the conversation by describing the room(s) you want to create."}
                        </p>
                      )}
                      {aiMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${msg.role === "user"
                            ? "bg-blue-100 text-blue-900 self-end"
                            : "bg-gray-100 text-gray-800 self-start"
                            }`}
                        >
                          <span className="font-semibold mr-1">
                            {msg.role === "user" ? (t("you") || "You") : (t("assistant") || "Assistant")}:
                          </span>
                          {msg.content}
                        </div>
                      ))}
                      {aiSending && (
                        <div className="rounded-lg p-3 bg-gray-100 text-gray-500 italic text-sm">
                          {t("aiTyping") || "AI is typing..."}
                        </div>
                      )}
                    </div>
                    {/* Message input */}
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="ai-input" className="text-sm font-semibold text-gray-700">
                        {t("yourMessageLabel") || "Your Message"}
                      </Label>
                      <Textarea
                        id="ai-input"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        rows={3}
                        className="w-full border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                        placeholder={
                          t("aiInputPlaceholder") ||
                          "Describe your rooms or answer the assistant's question..."
                        }
                      />
                    </div>
                    <DialogFooter className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAiModalOpen(false)
                          setAiMessages([])
                          setAiInput("")
                        }}
                        className="px-6 py-2"
                      >
                        {t("cancel") || "Cancel"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAiSend}
                        disabled={aiSending || !aiInput.trim()}
                        className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2"
                      >
                        {aiSending ? (t("sending") || "Sending...") : (t("send") || "Send")}
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    {/* Review generated rooms */}
                    <div className="mt-4 space-y-4 max-h-96 overflow-y-auto p-2">
                      {generatedRooms.map((room, idx) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-4 space-y-4 bg-gray-50"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-gray-700">
                              {t("generatedRoomLabel", { number: idx + 1 }) || `Room ${idx + 1}`}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGeneratedRoom(idx)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                {t("roomNumberLabel") || "Room Number"}
                              </Label>
                              <Input
                                value={room.number || ""}
                                onChange={(e) =>
                                  handleGeneratedRoomChange(idx, "number", e.target.value)
                                }
                                placeholder="e.g., 101"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                {t("roomTypeLabel") || "Room Type"}
                              </Label>
                              <Select
                                value={room.type || "Standard"}
                                onValueChange={(value) =>
                                  handleGeneratedRoomChange(idx, "type", value)
                                }
                              >
                                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 transition-colors">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roomTypesData?.roomTypes && roomTypesData.roomTypes.length > 0 ? (
                                    roomTypesData.roomTypes.map((rt: any) => (
                                      <SelectItem key={rt.id} value={rt.name}>
                                        {rt.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <>
                                      <SelectItem value="Standard">Standard</SelectItem>
                                      <SelectItem value="Deluxe">Deluxe</SelectItem>
                                      <SelectItem value="Suite">Suite</SelectItem>
                                      <SelectItem value="Executive">Executive</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                {t("capacityLabel") || "Capacity"}
                              </Label>
                              <Input
                                type="number"
                                value={room.capacity ?? ""}
                                onChange={(e) =>
                                  handleGeneratedRoomChange(
                                    idx,
                                    "capacity",
                                    e.target.value === "" ? "" : Number(e.target.value)
                                  )
                                }
                                placeholder="2"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                {t("priceLabel") || "Price"}
                              </Label>
                              <Input
                                type="number"
                                value={room.price ?? ""}
                                onChange={(e) =>
                                  handleGeneratedRoomChange(
                                    idx,
                                    "price",
                                    e.target.value === "" ? "" : Number(e.target.value)
                                  )
                                }
                                placeholder="150"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                {t("floorLabel") || "Floor"}
                              </Label>
                              <Input
                                type="number"
                                value={room.floor ?? ""}
                                onChange={(e) =>
                                  handleGeneratedRoomChange(
                                    idx,
                                    "floor",
                                    e.target.value === "" ? "" : Number(e.target.value)
                                  )
                                }
                                placeholder="1"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                {t("statusLabel") || "Status"}
                              </Label>
                              <Select
                                value={room.status || "available"}
                                onValueChange={(value) =>
                                  handleGeneratedRoomChange(idx, "status", value)
                                }
                              >
                                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 transition-colors">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">{t("available") || "Available"}</SelectItem>
                                  <SelectItem value="occupied">{t("occupied") || "Occupied"}</SelectItem>
                                  <SelectItem value="maintenance">{t("maintenance") || "Maintenance"}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {/* Amenities */}
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-gray-700">
                              {t("amenitiesLabel") || "Amenities"}
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              {hotelLoading ? (
                                <p className="col-span-full text-gray-500">
                                  {t("loadingAmenities")}
                                </p>
                              ) : (
                                hotelData?.hotel?.amenities.map((amenity: any) => (
                                  <label key={amenity.name} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={Array.isArray(room.amenities) && room.amenities.includes(amenity.name)}
                                      onChange={(e) =>
                                        toggleGeneratedRoomAmenity(idx, amenity.name, e.target.checked)
                                      }
                                      className="rounded border-gray-300 text-blue-600"
                                    />
                                    <span className="text-sm">{amenity.name}</span>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>
                          {/* Bed types */}
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-gray-700">
                              {t("bedTypesLabel") || "Bed Types"}
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                              {bedTypes.map((bt) => (
                                <label key={bt} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={Array.isArray(room.bedType) && room.bedType.includes(bt)}
                                    onChange={(e) =>
                                      toggleGeneratedRoomBedType(idx, bt, e.target.checked)
                                    }
                                    className="rounded border-gray-300 text-blue-600"
                                  />
                                  <span className="text-sm">{bt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          {/* Number of beds and bathrooms */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                {t("numberOfBedsLabel") || "Number of Beds"}
                              </Label>
                              <Input
                                type="number"
                                value={room.numberOfBeds ?? ""}
                                onChange={(e) =>
                                  handleGeneratedRoomChange(
                                    idx,
                                    "numberOfBeds",
                                    e.target.value === "" ? "" : Number(e.target.value)
                                  )
                                }
                                placeholder="1"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm font-medium text-gray-700">
                                {t("numberOfBathroomsLabel") || "Number of Bathrooms"}
                              </Label>
                              <Input
                                type="number"
                                value={room.numberOfBathrooms ?? ""}
                                onChange={(e) =>
                                  handleGeneratedRoomChange(
                                    idx,
                                    "numberOfBathrooms",
                                    e.target.value === "" ? "" : Number(e.target.value)
                                  )
                                }
                                placeholder="1"
                              />
                            </div>
                          </div>
                          {/* Description */}
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-gray-700">
                              {t("roomDescriptionLabel") || "Description"}
                            </Label>
                            <Textarea
                              rows={3}
                              value={room.description || ""}
                              onChange={(e) =>
                                handleGeneratedRoomChange(idx, "description", e.target.value)
                              }
                              className="w-full border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                              placeholder="Describe the room features, view, and unique amenities..."
                            />
                          </div>
                        </div>
                      ))}
                      <DialogFooter className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setGeneratedRooms([])
                            setAiModalOpen(false)
                          }}
                          className="px-6 py-2"
                        >
                          {t("cancel") || "Cancel"}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCreateGeneratedRooms}
                          className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2"
                        >
                          {t("createRoomsButton", { count: generatedRooms.length }) ||
                            `Create ${generatedRooms.length} Room${generatedRooms.length > 1 ? "s" : ""}`}
                        </Button>
                      </DialogFooter>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-xl font-semibold">{t("existingRoomsTitle")}</CardTitle>
            <CardDescription className="text-blue-100">{t("existingRoomsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {roomsData?.rooms && roomsData.rooms.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 rounded-lg">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">{t("roomNumberColumn")}</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">{t("typeColumn")}</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">{t("capacityColumn")}</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">{t("amenitiesColumn")}</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">{t("statusColumn")}</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">{t("actionsColumn")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {roomsData.rooms.map((room: any) => (
                      <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{room.number}</td>
                        <td className="px-6 py-4 text-gray-700">{room.type}</td>
                        <td className="px-6 py-4 text-gray-700">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {room.capacity ?? "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {room.amenities && room.amenities.length > 0 ? room.amenities.join(", ") : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              room.status === "occupied"
                                ? "destructive"
                                : room.status === "maintenance"
                                  ? "secondary"
                                  : "default"
                            }
                            className={`${room.status === "occupied"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : room.status === "maintenance"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                              }`}
                          >
                            {room.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(room)}
                              className="hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(room.id)}
                              className="hover:bg-red-50 hover:border-red-300 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/hotel/dashboard/rooms/${room.id}`)}
                              className="hover:bg-green-50 hover:border-green-300 text-green-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{t("noRoomsFound")}</p>
                <p className="text-gray-400">{t("createFirstRoom")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card ref={editFormRef} className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Plus className="h-6 w-6" />
              {editingId ? t("editRoom") : t("addNewRoom")}
            </CardTitle>
            <CardDescription className="text-indigo-100">
              {editingId ? t("updateRoomInformation") : t("fillAddNewRoom")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-sm font-semibold text-gray-700">
                    {t("roomNumberLabel")}
                  </Label>
                  <Input
                    id="number"
                    type="text"
                    value={formState.number}
                    onChange={(e) => setFormState({ ...formState, number: e.target.value })}
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    placeholder="e.g., 101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold text-gray-700">
                    {t("roomTypeLabel")}
                  </Label>
                  <Select value={formState.type} onValueChange={(value) => setFormState({ ...formState, type: value })}>
                    <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypesData?.roomTypes && roomTypesData.roomTypes.length > 0 ? (
                        roomTypesData.roomTypes.map((rt: any) => (
                          <SelectItem key={rt.id} value={rt.name}>{rt.name}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Deluxe">Deluxe</SelectItem>
                          <SelectItem value="Suite">Suite</SelectItem>
                          <SelectItem value="Executive">Executive</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-sm font-semibold text-gray-700">
                    <Users className="inline h-4 w-4 mr-1" />
                    {t("capacityLabel")}
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formState.capacity}
                    onChange={(e) =>
                      setFormState({ ...formState, capacity: e.target.value === "" ? "" : Number(e.target.value) })
                    }
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                    {t("priceLabel")}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formState.price}
                    onChange={(e) =>
                      setFormState({ ...formState, price: e.target.value === "" ? "" : Number(e.target.value) })
                    }
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    placeholder="150"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor" className="text-sm font-semibold text-gray-700">
                    {t("floorLabel")}
                  </Label>
                  <Input
                    id="floor"
                    type="number"
                    value={formState.floor}
                    onChange={(e) =>
                      setFormState({ ...formState, floor: e.target.value === "" ? "" : Number(e.target.value) })
                    }
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700">{t("amenitiesLabel")}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {hotelLoading ? (
                    <p className="col-span-full text-gray-500">{t("loadingAmenities")}</p>
                  ) : (
                    hotelData?.hotel?.amenities.map((amenity: any) => (
                      <label
                        key={amenity.name}
                        className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formState.amenities.includes(amenity.name)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setFormState((prevState) => {
                              const newAmenities = checked
                                ? [...prevState.amenities, amenity.name]
                                : prevState.amenities.filter((a) => a !== amenity.name)
                              return { ...prevState, amenities: newAmenities }
                            })
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm font-medium text-gray-700">{amenity.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700">
                  <Bed className="inline h-4 w-4 mr-1" />
                  {t("bedTypesLabel")}
                </Label>
                {/* Selected Bed Types Display */}
                {formState.bedType.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    {formState.bedType.map((bed) => (
                      <Badge
                        key={bed.id}
                        variant="secondary"
                        className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 text-sm flex items-center gap-2"
                      >
                        <Bed className="h-3 w-3" />
                        {bed.type}
                        <button
                          type="button"
                          onClick={() => removeBedType(bed.id)}
                          className="hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {/* Bed Type Select */}
                <Select onValueChange={handleBedTypeSelect}>
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 transition-colors">
                    <SelectValue placeholder={t("selectBedTypesPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {bedTypes.map((bedType) => (
                      <SelectItem key={bedType} value={bedType}>
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4" />
                          {bedType}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Room Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="numberOfBeds" className="text-sm font-semibold text-gray-700">
                    {t("numberOfBedsLabel")}
                  </Label>
                  <Input
                    id="numberOfBeds"
                    type="number"
                    value={formState.numberOfBeds}
                    onChange={(e) =>
                      setFormState({ ...formState, numberOfBeds: e.target.value === "" ? "" : Number(e.target.value) })
                    }
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfBathrooms" className="text-sm font-semibold text-gray-700">
                    {t("numberOfBathroomsLabel")}
                  </Label>
                  <Input
                    id="numberOfBathrooms"
                    type="number"
                    value={formState.numberOfBathrooms}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        numberOfBathrooms: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                  {t("roomDescriptionLabel")}
                </Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  rows={4}
                  className="border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Describe the room features, view, and unique amenities..."
                />
              </div>

              {/* Images */}
              {/* <div className="space-y-2">
                <Label htmlFor="images" className="text-sm font-semibold text-gray-700">
                  Image URLs (comma-separated)
                </Label>
                <Textarea
                  id="images"
                  value={formState.images}
                  onChange={(e) => setFormState({ ...formState, images: e.target.value })}
                  rows={2}
                  className="border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
                  placeholder="https://example.com/room1.jpg, https://example.com/room2.jpg"
                />
              </div> */}

              {/* Submit Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  {editingId ? (
                    <>
                      <Edit className="h-5 w-5 mr-2" />
                      {t("updateRoomButton")}
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      {t("addRoomButton")}
                    </>
                  )}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 transition-colors bg-transparent"
                  >
                    {t("cancel")}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
