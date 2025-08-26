// "use client"

// import { useState } from "react"
// import React from "react"
// import { gql, useMutation, useQuery } from "@apollo/client"

// // GraphQL operations for hotels
// // Fetch both active and pending hotels for the admin dashboard.  The
// // `hotels` query returns only active businesses while `pendingHotels`
// // returns those awaiting approval (isActive = false).  We merge these
// // lists in the component to display all hotels regardless of status.
// const GET_HOTELS = gql`
//   query GetHotelsAdmin {
//     hotels {
//       id
//       name
//       description
//       address {
//         street
//         city
//         state
//         zipCode
//         country
//       }
//       contact {
//         phone
//         email
//         website
//       }
//       createdAt
//       updatedAt
//       isActive
//     }
//     pendingHotels {
//       id
//       name
//       description
//       address {
//         street
//         city
//         state
//         zipCode
//         country
//       }
//       contact {
//         phone
//         email
//         website
//       }
//       createdAt
//       updatedAt
//       isActive
//     }
//   }
// `;

// const CREATE_HOTEL = gql`
//   mutation CreateHotelAdmin($input: HotelInput!) {
//     createHotel(input: $input) {
//       id
//       name
//     }
//   }
// `;

// const UPDATE_HOTEL = gql`
//   mutation UpdateHotelAdmin($id: ID!, $input: HotelInput!) {
//     updateHotel(id: $id, input: $input) {
//       id
//       name
//       description
//       updatedAt
//     }
//   }
// `;

// // Deactivate a hotel.  The deleteHotel mutation marks the hotel
// // inactive (isActive = false) without removing it from the database.
// const DEACTIVATE_HOTEL = gql`
//   mutation DeactivateHotelAdmin($id: ID!) {
//     deleteHotel(id: $id)
//   }
// `;

// // Approve a pending hotel.  Approval sets isActive = true on the hotel
// // and activates all users associated with it.
// const APPROVE_HOTEL = gql`
//   mutation ApproveHotelAdmin($id: ID!) {
//     approveHotel(id: $id) {
//       id
//       isActive
//     }
//   }
// `;

// // Mutation for linking a user to a hotel.  After registering a user and
// // creating a hotel, this mutation assigns the newly created hotel’s id
// // and businessType to the user.
// const UPDATE_USER = gql`
//   mutation UpdateUserAdmin($id: ID!, $input: UserUpdateInput!) {
//     updateUser(id: $id, input: $input) {
//       id
//       businessId
//       businessType
//     }
//   }
// `

// // Register a new manager account.  Admins can create manager users
// // directly from the hotel creation form.  The user is created
// // inactive and linked to the hotel via updateUser after the hotel
// // itself is created.
// const REGISTER_USER = gql`
//   mutation RegisterUserAdmin($input: RegisterInput!) {
//     register(input: $input) {
//       user {
//         id
//       }
//     }
//   }
// `

// // Form state for creating/updating hotels
// interface HotelFormState {
//   id?: string
//   name: string
//   description: string
//   street: string
//   city: string
//   state: string
//   zipCode: string
//   country: string
//   phone: string
//   email: string
//   website: string
// }

// export default function AdminHotelsPage() {
//   const [formState, setFormState] = useState<HotelFormState>({
//     name: "",
//     description: "",
//     street: "",
//     city: "",
//     state: "",
//     zipCode: "",
//     country: "",
//     phone: "",
//     email: "",
//     website: "",
//   })
//   const [editingId, setEditingId] = useState<string | null>(null)
//   // State for the new manager account.  When creating a new hotel
//   // the admin must provide user details for the manager account.  These
//   // fields are hidden when editing an existing hotel.
//   const [userFormState, setUserFormState] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//   })

//   // Data hooks
//   const { data, loading, error, refetch } = useQuery(GET_HOTELS)
//   // Users are not fetched here because new hotels are automatically
//   // associated with newly registered manager accounts.  Existing
//   // managers are not assigned via the admin dashboard.
//   const [createHotel] = useMutation(CREATE_HOTEL)
//   const [updateHotel] = useMutation(UPDATE_HOTEL)
//   // Mutation hooks for activating and deactivating hotels.  Deactivation
//   // uses the deleteHotel mutation (renamed here) to set isActive to
//   // false.  Approval activates a pending hotel.
//   const [deactivateHotel] = useMutation(DEACTIVATE_HOTEL)
//   const [approveHotelMutation] = useMutation(APPROVE_HOTEL)
//   const [updateUser] = useMutation(UPDATE_USER)
//   const [registerUser] = useMutation(REGISTER_USER)

//   // Handle submission for creating/updating hotels
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const input = {
//       name: formState.name,
//       description: formState.description,
//       address: {
//         street: formState.street,
//         city: formState.city,
//         state: formState.state,
//         zipCode: formState.zipCode,
//         country: formState.country,
//       },
//       contact: {
//         phone: formState.phone,
//         email: formState.email,
//         website: formState.website,
//       },
//       settings: {},
//       amenities: [],
//       services: [],
//       policies: [],
//       images: [],
//       openingPeriods: [],
//     }
//     try {
//       if (editingId) {
//         // Editing an existing hotel: just update the hotel details
//         await updateHotel({ variables: { id: editingId, input } })
//       } else {
//         // Creating a new hotel: first register the manager account
//         const { data: regData } = await registerUser({
//           variables: {
//             input: {
//               firstName: userFormState.firstName,
//               lastName: userFormState.lastName,
//               email: userFormState.email,
//               password: userFormState.password,
//               businessType: "hotel",
//             },
//           },
//         })
//         const userId = regData?.register?.user?.id
//         // Then create the hotel
//         const { data: hotelData } = await createHotel({ variables: { input } })
//         const hotelId = hotelData?.createHotel?.id
//         // Assign the hotel to the new user
//         if (userId && hotelId) {
//           await updateUser({
//             variables: {
//               id: userId,
//               input: { businessId: hotelId, businessType: "hotel" },
//             },
//           })
//         }
//       }
//       // Reset form states after submission
//       setFormState({
//         name: "",
//         description: "",
//         street: "",
//         city: "",
//         state: "",
//         zipCode: "",
//         country: "",
//         phone: "",
//         email: "",
//         website: "",
//       })
//       setUserFormState({ firstName: "", lastName: "", email: "", password: "" })
//       setEditingId(null)
//       refetch()
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   const handleEdit = (hotel: any) => {
//     setEditingId(hotel.id)
//     setFormState({
//       id: hotel.id,
//       name: hotel.name || "",
//       description: hotel.description || "",
//       street: hotel.address?.street || "",
//       city: hotel.address?.city || "",
//       state: hotel.address?.state || "",
//       zipCode: hotel.address?.zipCode || "",
//       country: hotel.address?.country || "",
//       phone: hotel.contact?.phone || "",
//       email: hotel.contact?.email || "",
//       website: hotel.contact?.website || "",
//     })
//   }

//   /**
//    * Toggle the activation status of a hotel.  When the hotel is
//    * currently active, this function marks it inactive via the
//    * deactivateHotel mutation.  When the hotel is inactive it will
//    * be approved.  After the mutation completes the list is
//    * refetched to reflect the new status.
//    */
//   const toggleActivation = async (id: string, isActive: boolean) => {
//     try {
//       if (isActive) {
//         // Deactivate the hotel
//         await deactivateHotel({ variables: { id } })
//       } else {
//         // Approve (activate) the hotel
//         await approveHotelMutation({ variables: { id } })
//       }
//       await refetch()
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   // handleAssign removed because hotels are automatically linked to
//   // newly created users.  Manual assignment is no longer needed.

//   if (loading) return <p>Loading hotels...</p>
//   if (error) return <p>Error loading hotels.</p>

//   return (
//     <div className="space-y-12">
//       <h1 className="text-2xl font-bold">Hotel Administration</h1>
//       {/* List hotels */}
//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">Existing Hotels</h2>
//         {/* Merge active and pending hotels into a single list.  This ensures
//             newly created hotels (which default to inactive) appear in the
//             table immediately without requiring admin approval. */}
//         {(() => {
//           const allHotels = [
//             ...(data?.hotels || []),
//             ...(data?.pendingHotels || []),
//           ]
//           return allHotels && allHotels.length > 0 ? (
//             <ul className="space-y-2">
//               {allHotels.map((hotel: any) => (
//               <li
//                 key={hotel.id}
//                 className="border rounded p-4 flex justify-between items-center"
//               >
//                 <div>
//                   <p className="font-medium">{hotel.name}</p>
//                   <p className="text-sm text-gray-600">{hotel.description}</p>
//                     <p className="text-xs text-gray-500">Status: {hotel.isActive ? 'Active' : 'Inactive'}</p>
//                 </div>
//                 <div className="space-x-2">
//                   <button
//                     className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
//                     onClick={() => handleEdit(hotel)}
//                   >
//                     Edit
//                   </button>
//                     <button
//                       className={`px-2 py-1 text-sm ${hotel.isActive ? 'bg-yellow-500' : 'bg-green-600'} text-white rounded`}
//                       onClick={() => toggleActivation(hotel.id, hotel.isActive)}
//                     >
//                       {hotel.isActive ? 'Deactivate' : 'Activate'}
//                     </button>
//                 </div>
//               </li>
//               ))}
//             </ul>
//           ) : (
//             <p>No hotels found.</p>
//           )
//         })()}
//       </section>
//       {/* Assignment of hotels to users has been removed.  When a new hotel
//           is created the administrator simultaneously registers a manager
//           account and links it to the hotel.  Manual assignment is
//           therefore no longer necessary. */}
//       {/* Hotel form */}
//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">{editingId ? 'Edit Hotel' : 'Create Hotel'}</h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium">Name</label>
//               <input
//                 type="text"
//                 value={formState.name}
//                 onChange={(e) => setFormState({ ...formState, name: e.target.value })}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Description</label>
//               <input
//                 type="text"
//                 value={formState.description}
//                 onChange={(e) => setFormState({ ...formState, description: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Street</label>
//               <input
//                 type="text"
//                 value={formState.street}
//                 onChange={(e) => setFormState({ ...formState, street: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">City</label>
//               <input
//                 type="text"
//                 value={formState.city}
//                 onChange={(e) => setFormState({ ...formState, city: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">State</label>
//               <input
//                 type="text"
//                 value={formState.state}
//                 onChange={(e) => setFormState({ ...formState, state: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Zip Code</label>
//               <input
//                 type="text"
//                 value={formState.zipCode}
//                 onChange={(e) => setFormState({ ...formState, zipCode: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Country</label>
//               <input
//                 type="text"
//                 value={formState.country}
//                 onChange={(e) => setFormState({ ...formState, country: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Phone</label>
//               <input
//                 type="text"
//                 value={formState.phone}
//                 onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Email</label>
//               <input
//                 type="email"
//                 value={formState.email}
//                 onChange={(e) => setFormState({ ...formState, email: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Website</label>
//               <input
//                 type="text"
//                 value={formState.website}
//                 onChange={(e) => setFormState({ ...formState, website: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             {/* When creating a new hotel we also collect manager account details.
//                 These fields are hidden while editing an existing hotel. */}
//             {!editingId && (
//               <>
//                 <div>
//                   <label className="block text-sm font-medium">Manager First Name</label>
//                   <input
//                     type="text"
//                     value={userFormState.firstName}
//                     onChange={(e) => setUserFormState({ ...userFormState, firstName: e.target.value })}
//                     className="w-full p-2 border rounded"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium">Manager Last Name</label>
//                   <input
//                     type="text"
//                     value={userFormState.lastName}
//                     onChange={(e) => setUserFormState({ ...userFormState, lastName: e.target.value })}
//                     className="w-full p-2 border rounded"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium">Manager Email</label>
//                   <input
//                     type="email"
//                     value={userFormState.email}
//                     onChange={(e) => setUserFormState({ ...userFormState, email: e.target.value })}
//                     className="w-full p-2 border rounded"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium">Manager Password</label>
//                   <input
//                     type="password"
//                     value={userFormState.password}
//                     onChange={(e) => setUserFormState({ ...userFormState, password: e.target.value })}
//                     className="w-full p-2 border rounded"
//                     required
//                   />
//                 </div>
//               </>
//             )}
//           </div>
//           <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
//             {editingId ? 'Update Hotel' : 'Create Hotel'}
//           </button>
//         </form>
//       </section>
//     </div>
//   )
// }


// test1




"use client"

import { useState } from "react"
import type React from "react"
import { gql, useMutation, useQuery } from "@apollo/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Mail, Phone, Globe, MapPin, User, Plus, Edit, Power, PowerOff } from "lucide-react"

// GraphQL operations for hotels
// Fetch both active and pending hotels for the admin dashboard.  The
// `hotels` query returns only active businesses while `pendingHotels`
// returns those awaiting approval (isActive = false).  We merge these
// lists in the component to display all hotels regardless of status.
const GET_HOTELS = gql`
  query GetHotelsAdmin {
    hotels {
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
      createdAt
      updatedAt
      isActive
    }
    pendingHotels {
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
      createdAt
      updatedAt
      isActive
    }
  }
`

const CREATE_HOTEL = gql`
  mutation CreateHotelAdmin($input: HotelInput!) {
    createHotel(input: $input) {
      id
      name
    }
  }
`

const UPDATE_HOTEL = gql`
  mutation UpdateHotelAdmin($id: ID!, $input: HotelInput!) {
    updateHotel(id: $id, input: $input) {
      id
      name
      description
      updatedAt
    }
  }
`

// Deactivate a hotel.  The deleteHotel mutation marks the hotel
// inactive (isActive = false) without removing it from the database.
const DEACTIVATE_HOTEL = gql`
  mutation DeactivateHotelAdmin($id: ID!) {
    deleteHotel(id: $id)
  }
`

// Approve a pending hotel.  Approval sets isActive = true on the hotel
// and activates all users associated with it.
const APPROVE_HOTEL = gql`
  mutation ApproveHotelAdmin($id: ID!) {
    approveHotel(id: $id) {
      id
      isActive
    }
  }
`

// Mutation for linking a user to a hotel.  After registering a user and
// creating a hotel, this mutation assigns the newly created hotel’s id
// and businessType to the user.
const UPDATE_USER = gql`
  mutation UpdateUserAdmin($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      businessId
      businessType
    }
  }
`

// Register a new manager account.  Admins can create manager users
// directly from the hotel creation form.  The user is created
// inactive and linked to the hotel via updateUser after the hotel
// itself is created.
const REGISTER_USER = gql`
  mutation RegisterUserAdmin($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
      }
    }
  }
`

// Form state for creating/updating hotels
interface HotelFormState {
  id?: string
  name: string
  description: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  email: string
  website: string
}

export default function AdminHotelsPage() {
  const [formState, setFormState] = useState<HotelFormState>({
    name: "",
    description: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    email: "",
    website: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  // State for the new manager account.  When creating a new hotel
  // the admin must provide user details for the manager account.  These
  // fields are hidden when editing an existing hotel.
  const [userFormState, setUserFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

  // Data hooks
  const { data, loading, error, refetch } = useQuery(GET_HOTELS)
  // Users are not fetched here because new hotels are automatically
  // associated with newly registered manager accounts.  Existing
  // managers are not assigned via the admin dashboard.
  const [createHotel] = useMutation(CREATE_HOTEL)
  const [updateHotel] = useMutation(UPDATE_HOTEL)
  // Mutation hooks for activating and deactivating hotels.  Deactivation
  // uses the deleteHotel mutation (renamed here) to set isActive to
  // false.  Approval activates a pending hotel.
  const [deactivateHotel] = useMutation(DEACTIVATE_HOTEL)
  const [approveHotelMutation] = useMutation(APPROVE_HOTEL)
  const [updateUser] = useMutation(UPDATE_USER)
  const [registerUser] = useMutation(REGISTER_USER)

  // Handle submission for creating/updating hotels
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = {
      name: formState.name,
      description: formState.description,
      address: {
        street: formState.street,
        city: formState.city,
        state: formState.state,
        zipCode: formState.zipCode,
        country: formState.country,
      },
      contact: {
        phone: formState.phone,
        email: formState.email,
        website: formState.website,
      },
      settings: {},
      amenities: [],
      services: [],
      policies: [],
      images: [],
      openingPeriods: [],
    }
    try {
      if (editingId) {
        // Editing an existing hotel: just update the hotel details
        await updateHotel({ variables: { id: editingId, input } })
      } else {
        // Creating a new hotel: first register the manager account
        const { data: regData } = await registerUser({
          variables: {
            input: {
              firstName: userFormState.firstName,
              lastName: userFormState.lastName,
              email: userFormState.email,
              password: userFormState.password,
              businessType: "hotel",
            },
          },
        })
        const userId = regData?.register?.user?.id
        // Then create the hotel
        const { data: hotelData } = await createHotel({ variables: { input } })
        const hotelId = hotelData?.createHotel?.id
        // Assign the hotel to the new user
        if (userId && hotelId) {
          await updateUser({
            variables: {
              id: userId,
              input: { businessId: hotelId, businessType: "hotel" },
            },
          })
        }
      }
      // Reset form states after submission
      setFormState({
        name: "",
        description: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
        email: "",
        website: "",
      })
      setUserFormState({ firstName: "", lastName: "", email: "", password: "" })
      setEditingId(null)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (hotel: any) => {
    setEditingId(hotel.id)
    setFormState({
      id: hotel.id,
      name: hotel.name || "",
      description: hotel.description || "",
      street: hotel.address?.street || "",
      city: hotel.address?.city || "",
      state: hotel.address?.state || "",
      zipCode: hotel.address?.zipCode || "",
      country: hotel.address?.country || "",
      phone: hotel.contact?.phone || "",
      email: hotel.contact?.email || "",
      website: hotel.contact?.website || "",
    })
  }

  /**
   * Toggle the activation status of a hotel.  When the hotel is
   * currently active, this function marks it inactive via the
   * deactivateHotel mutation.  When the hotel is inactive it will
   * be approved.  After the mutation completes the list is
   * refetched to reflect the new status.
   */
  const toggleActivation = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        // Deactivate the hotel
        await deactivateHotel({ variables: { id } })
      } else {
        // Approve (activate) the hotel
        await approveHotelMutation({ variables: { id } })
      }
      await refetch()
    } catch (err) {
      console.error(err)
    }
  }

  // handleAssign removed because hotels are automatically linked to
  // newly created users.  Manual assignment is no longer needed.

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading hotels...</p>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-destructive">⚠️</div>
              <p className="text-destructive font-medium">Error loading hotels</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hotel Administration</h1>
          <p className="text-muted-foreground">Manage hotels and their associated manager accounts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Existing Hotels
          </CardTitle>
          <CardDescription>View and manage all hotels in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const allHotels = [...(data?.hotels || []), ...(data?.pendingHotels || [])]
            return allHotels && allHotels.length > 0 ? (
              <div className="grid gap-4">
                {allHotels.map((hotel: any) => (
                  <Card key={hotel.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{hotel.name}</h3>
                            <Badge variant={hotel.isActive ? "default" : "secondary"}>
                              {hotel.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          {hotel.description && <p className="text-muted-foreground">{hotel.description}</p>}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {hotel.address && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {[hotel.address.street, hotel.address.city, hotel.address.state]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            )}

                            {hotel.contact?.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{hotel.contact.phone}</span>
                              </div>
                            )}

                            {hotel.contact?.email && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{hotel.contact.email}</span>
                              </div>
                            )}

                            {hotel.contact?.website && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Globe className="h-4 w-4" />
                                <span>{hotel.contact.website}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(hotel)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant={hotel.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleActivation(hotel.id, hotel.isActive)}
                          >
                            {hotel.isActive ? (
                              <>
                                <PowerOff className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hotels found.</p>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingId ? "Edit Hotel" : "Create Hotel"}
          </CardTitle>
          <CardDescription>
            {editingId ? "Update hotel information and settings" : "Add a new hotel and create a manager account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hotel Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <h3 className="text-lg font-medium">Hotel Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hotel Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                    placeholder="Enter hotel name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    type="text"
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    placeholder="Brief hotel description"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Address Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <h3 className="text-lg font-medium">Address</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    type="text"
                    value={formState.street}
                    onChange={(e) => setFormState({ ...formState, street: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formState.city}
                    onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    type="text"
                    value={formState.state}
                    onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                    placeholder="State or province"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip/Postal Code</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={formState.zipCode}
                    onChange={(e) => setFormState({ ...formState, zipCode: e.target.value })}
                    placeholder="Zip or postal code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    type="text"
                    value={formState.country}
                    onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <h3 className="text-lg font-medium">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formState.website}
                    onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                    placeholder="Website URL"
                  />
                </div>
              </div>
            </div>

            {/* Manager Account Section - Only shown when creating */}
            {!editingId && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <h3 className="text-lg font-medium">Manager Account</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create a manager account that will be automatically linked to this hotel.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={userFormState.firstName}
                        onChange={(e) => setUserFormState({ ...userFormState, firstName: e.target.value })}
                        required
                        placeholder="Manager's first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={userFormState.lastName}
                        onChange={(e) => setUserFormState({ ...userFormState, lastName: e.target.value })}
                        required
                        placeholder="Manager's last name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="managerEmail">Email *</Label>
                      <Input
                        id="managerEmail"
                        type="email"
                        value={userFormState.email}
                        onChange={(e) => setUserFormState({ ...userFormState, email: e.target.value })}
                        required
                        placeholder="Manager's email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={userFormState.password}
                        onChange={(e) => setUserFormState({ ...userFormState, password: e.target.value })}
                        required
                        placeholder="Manager's password"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex items-center gap-2">
                {editingId ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Update Hotel" : "Create Hotel"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null)
                    setFormState({
                      name: "",
                      description: "",
                      street: "",
                      city: "",
                      state: "",
                      zipCode: "",
                      country: "",
                      phone: "",
                      email: "",
                      website: "",
                    })
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
