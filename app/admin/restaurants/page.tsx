// "use client"

// import { useState } from "react"
// import React from "react"
// import { gql, useMutation, useQuery } from "@apollo/client"

// // GraphQL operations for restaurants
// // Fetch both active and pending restaurants for the admin dashboard.  The
// // `restaurants` query returns active businesses while `pendingRestaurants`
// // returns those awaiting approval (isActive = false).  We merge these
// // lists in the component to display all restaurants regardless of status.
// const GET_RESTAURANTS = gql`
//   query GetRestaurantsAdmin {
//     restaurants {
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
//       settings {
//         currency
//         timezone
//         taxRate
//         serviceFee
//         maxPartySize
//         reservationWindow
//         cancellationHours
//       }
//       createdAt
//       updatedAt
//       isActive
//     }
//     pendingRestaurants {
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
//       settings {
//         currency
//         timezone
//         taxRate
//         serviceFee
//         maxPartySize
//         reservationWindow
//         cancellationHours
//       }
//       createdAt
//       updatedAt
//       isActive
//     }
//   }
// `;

// const CREATE_RESTAURANT = gql`
//   mutation CreateRestaurantAdmin($input: RestaurantInput!) {
//     createRestaurant(input: $input) {
//       id
//       name
//     }
//   }
// `;

// const UPDATE_RESTAURANT = gql`
//   mutation UpdateRestaurantAdmin($id: ID!, $input: RestaurantInput!) {
//     updateRestaurant(id: $id, input: $input) {
//       id
//       name
//       description
//       updatedAt
//     }
//   }
// `;

// // Deactivate a restaurant.  The deleteRestaurant mutation marks the
// // restaurant inactive (isActive = false) without removing it from
// // the database.
// const DEACTIVATE_RESTAURANT = gql`
//   mutation DeactivateRestaurantAdmin($id: ID!) {
//     deleteRestaurant(id: $id)
//   }
// `;

// // Approve a pending restaurant.  Approval sets isActive = true on
// // the restaurant and activates all users associated with it.
// const APPROVE_RESTAURANT = gql`
//   mutation ApproveRestaurantAdmin($id: ID!) {
//     approveRestaurant(id: $id) {
//       id
//       isActive
//     }
//   }
// `;

// // Mutation for linking a user to a restaurant.  After registering a
// // manager account and creating a restaurant, this mutation updates
// // the user’s businessId and businessType to point to the new
// // restaurant.
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
// // directly from the restaurant creation form.  The user is created
// // inactive and linked to the restaurant via updateUser after the
// // restaurant itself is created.
// const REGISTER_USER = gql`
//   mutation RegisterUserAdmin($input: RegisterInput!) {
//     register(input: $input) {
//       user {
//         id
//       }
//     }
//   }
// `

// // Form state for creating/updating restaurants
// interface RestaurantFormState {
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
//   currency: string
//   timezone: string
//   taxRate: string
//   serviceFee: string
//   maxPartySize: string
//   reservationWindow: string
//   cancellationHours: string
// }

// export default function AdminRestaurantsPage() {
//   const [restaurantFormState, setRestaurantFormState] = useState<RestaurantFormState>({
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
//     currency: "",
//     timezone: "",
//     taxRate: "",
//     serviceFee: "",
//     maxPartySize: "",
//     reservationWindow: "",
//     cancellationHours: "",
//   })
//   const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null)
//   // State for the manager account when creating a new restaurant.  These
//   // fields are hidden when editing an existing restaurant.
//   const [userFormState, setUserFormState] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//   })

//   // Data hooks
//   const {
//     data: restaurantsData,
//     loading: restaurantsLoading,
//     error: restaurantsError,
//     refetch: refetchRestaurants,
//   } = useQuery(GET_RESTAURANTS)
//   // We no longer fetch existing users because managers are created
//   // simultaneously with new restaurants.  Manual assignment has been
//   // removed from the admin interface.
//   const [createRestaurant] = useMutation(CREATE_RESTAURANT)
//   const [updateRestaurant] = useMutation(UPDATE_RESTAURANT)
//   // Mutation hooks for activating and deactivating restaurants.  Deactivation
//   // uses the deleteRestaurant mutation (renamed here) to set isActive to false.
//   // Approval activates a pending restaurant.
//   const [deactivateRestaurant] = useMutation(DEACTIVATE_RESTAURANT)
//   const [approveRestaurantMutation] = useMutation(APPROVE_RESTAURANT)
//   const [updateUser] = useMutation(UPDATE_USER)
//   const [registerUser] = useMutation(REGISTER_USER)

//   // Handle creation/update form submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const input: any = {
//       name: restaurantFormState.name,
//       description: restaurantFormState.description || null,
//       address: {
//         street: restaurantFormState.street || null,
//         city: restaurantFormState.city || null,
//         state: restaurantFormState.state || null,
//         zipCode: restaurantFormState.zipCode || null,
//         country: restaurantFormState.country || null,
//       },
//       contact: {
//         phone: restaurantFormState.phone || null,
//         email: restaurantFormState.email || null,
//         website: restaurantFormState.website || null,
//       },
//       settings: {
//         currency: restaurantFormState.currency || null,
//         timezone: restaurantFormState.timezone || null,
//         taxRate: restaurantFormState.taxRate ? parseFloat(restaurantFormState.taxRate) : null,
//         serviceFee: restaurantFormState.serviceFee ? parseFloat(restaurantFormState.serviceFee) : null,
//         maxPartySize: restaurantFormState.maxPartySize ? parseInt(restaurantFormState.maxPartySize, 10) : null,
//         reservationWindow: restaurantFormState.reservationWindow
//           ? parseInt(restaurantFormState.reservationWindow, 10)
//           : null,
//         cancellationHours: restaurantFormState.cancellationHours
//           ? parseInt(restaurantFormState.cancellationHours, 10)
//           : null,
//       },
//       businessHours: [],
//       cuisine: [],
//       priceRange: "$",
//       features: [],
//       policies: [],
//       images: [],
//     }
//     try {
//       if (editingRestaurantId) {
//         // Editing an existing restaurant: update only the restaurant details
//         await updateRestaurant({ variables: { id: editingRestaurantId, input } })
//       } else {
//         // Creating a new restaurant: register the manager, create the restaurant, then assign
//         const { data: regData } = await registerUser({
//           variables: {
//             input: {
//               firstName: userFormState.firstName,
//               lastName: userFormState.lastName,
//               email: userFormState.email,
//               password: userFormState.password,
//               businessType: "restaurant",
//             },
//           },
//         })
//         const userId = regData?.register?.user?.id
//         const { data: restaurantData } = await createRestaurant({ variables: { input } })
//         const restaurantId = restaurantData?.createRestaurant?.id
//         if (userId && restaurantId) {
//           await updateUser({
//             variables: {
//               id: userId,
//               input: { businessId: restaurantId, businessType: "restaurant" },
//             },
//           })
//         }
//       }
//       // Reset form state
//       setRestaurantFormState({
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
//         currency: "",
//         timezone: "",
//         taxRate: "",
//         serviceFee: "",
//         maxPartySize: "",
//         reservationWindow: "",
//         cancellationHours: "",
//       })
//       setUserFormState({ firstName: "", lastName: "", email: "", password: "" })
//       setEditingRestaurantId(null)
//       refetchRestaurants()
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   const handleEdit = (restaurant: any) => {
//     setEditingRestaurantId(restaurant.id)
//     setRestaurantFormState({
//       id: restaurant.id,
//       name: restaurant.name || "",
//       description: restaurant.description || "",
//       street: restaurant.address?.street || "",
//       city: restaurant.address?.city || "",
//       state: restaurant.address?.state || "",
//       zipCode: restaurant.address?.zipCode || "",
//       country: restaurant.address?.country || "",
//       phone: restaurant.contact?.phone || "",
//       email: restaurant.contact?.email || "",
//       website: restaurant.contact?.website || "",
//       currency: restaurant.settings?.currency || "",
//       timezone: restaurant.settings?.timezone || "",
//       taxRate: restaurant.settings?.taxRate?.toString() || "",
//       serviceFee: restaurant.settings?.serviceFee?.toString() || "",
//       maxPartySize: restaurant.settings?.maxPartySize?.toString() || "",
//       reservationWindow: restaurant.settings?.reservationWindow?.toString() || "",
//       cancellationHours: restaurant.settings?.cancellationHours?.toString() || "",
//     })
//   }

//   /**
//    * Toggle the activation status of a restaurant.  When the
//    * restaurant is currently active this marks it inactive via
//    * deactivateRestaurant; when inactive it calls approveRestaurant.
//    * After the mutation completes the restaurants list is refetched
//    * to reflect the updated status.
//    */
//   const toggleActivation = async (id: string, isActive: boolean) => {
//     try {
//       if (isActive) {
//         await deactivateRestaurant({ variables: { id } })
//       } else {
//         await approveRestaurantMutation({ variables: { id } })
//       }
//       await refetchRestaurants()
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   // handleAssign removed because restaurants are automatically linked to
//   // newly created users.  Manual assignment is no longer needed.

//   if (restaurantsLoading) return <p>Loading restaurants...</p>
//   if (restaurantsError) return <p>Error loading restaurants.</p>

//   return (
//     <div className="space-y-12">
//       <h1 className="text-2xl font-bold">Restaurant Administration</h1>
//       {/* List restaurants */}
//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">Existing Restaurants</h2>
//         {/* Merge active and pending restaurants into a single list.  This
//             ensures newly created restaurants (which default to
//             inactive) appear in the table immediately. */}
//         {(() => {
//           const allRestaurants = [
//             ...(restaurantsData?.restaurants || []),
//             ...(restaurantsData?.pendingRestaurants || []),
//           ]
//           return allRestaurants && allRestaurants.length > 0 ? (
//             <ul className="space-y-2">
//               {allRestaurants.map((restaurant: any) => (
//                 <li
//                   key={restaurant.id}
//                   className="border rounded p-4 flex justify-between items-center"
//                 >
//                   <div>
//                     <p className="font-medium">{restaurant.name}</p>
//                     <p className="text-sm text-gray-600">{restaurant.description}</p>
//                     <p className="text-xs text-gray-500">Status: {restaurant.isActive ? 'Active' : 'Inactive'}</p>
//                   </div>
//                   <div className="space-x-2">
//                     <button
//                       className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
//                       onClick={() => handleEdit(restaurant)}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       className={`px-2 py-1 text-sm ${restaurant.isActive ? 'bg-yellow-500' : 'bg-green-600'} text-white rounded`}
//                       onClick={() => toggleActivation(restaurant.id, restaurant.isActive)}
//                     >
//                       {restaurant.isActive ? 'Deactivate' : 'Activate'}
//                     </button>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p>No restaurants found.</p>
//           )
//         })()}
//       </section>
//       {/* Manual assignment of restaurants to existing users has been
//           removed.  When a new restaurant is created the admin
//           simultaneously registers a manager and links the new
//           restaurant to that account. */}
//       {/* Restaurant form */}
//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">{editingRestaurantId ? 'Edit Restaurant' : 'Create Restaurant'}</h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium">Name</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.name}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, name: e.target.value })}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Description</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.description}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, description: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Street</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.street}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, street: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">City</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.city}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, city: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">State</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.state}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, state: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Zip Code</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.zipCode}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, zipCode: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Country</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.country}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, country: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Phone</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.phone}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, phone: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Email</label>
//               <input
//                 type="email"
//                 value={restaurantFormState.email}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, email: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Website</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.website}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, website: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Currency</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.currency}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, currency: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Timezone</label>
//               <input
//                 type="text"
//                 value={restaurantFormState.timezone}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, timezone: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Tax Rate</label>
//               <input
//                 type="number"
//                 value={restaurantFormState.taxRate}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, taxRate: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Service Fee</label>
//               <input
//                 type="number"
//                 value={restaurantFormState.serviceFee}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, serviceFee: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Max Party Size</label>
//               <input
//                 type="number"
//                 value={restaurantFormState.maxPartySize}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, maxPartySize: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Reservation Window (days)</label>
//               <input
//                 type="number"
//                 value={restaurantFormState.reservationWindow}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, reservationWindow: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Cancellation Hours</label>
//               <input
//                 type="number"
//                 value={restaurantFormState.cancellationHours}
//                 onChange={(e) => setRestaurantFormState({ ...restaurantFormState, cancellationHours: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             {/* When creating a new restaurant we also collect manager account details.
//                 These fields are hidden while editing an existing restaurant. */}
//             {!editingRestaurantId && (
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
//             {editingRestaurantId ? 'Update Restaurant' : 'Create Restaurant'}
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Settings,
  Users,
  Clock,
  DollarSign,
  Edit,
  Power,
  PowerOff,
  Plus,
  Save,
  User,
} from "lucide-react"

// GraphQL operations for restaurants
// Fetch both active and pending restaurants for the admin dashboard.  The
// `restaurants` query returns active businesses while `pendingRestaurants`
// returns those awaiting approval (isActive = false).  We merge these
// lists in the component to display all restaurants regardless of status.
const GET_RESTAURANTS = gql`
  query GetRestaurantsAdmin {
    restaurants {
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
      createdAt
      updatedAt
      isActive
    }
    pendingRestaurants {
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
      createdAt
      updatedAt
      isActive
    }
  }
`

const CREATE_RESTAURANT = gql`
  mutation CreateRestaurantAdmin($input: RestaurantInput!) {
    createRestaurant(input: $input) {
      id
      name
    }
  }
`

const UPDATE_RESTAURANT = gql`
  mutation UpdateRestaurantAdmin($id: ID!, $input: RestaurantInput!) {
    updateRestaurant(id: $id, input: $input) {
      id
      name
      description
      updatedAt
    }
  }
`

// Deactivate a restaurant.  The deleteRestaurant mutation marks the
// restaurant inactive (isActive = false) without removing it from
// the database.
const DEACTIVATE_RESTAURANT = gql`
  mutation DeactivateRestaurantAdmin($id: ID!) {
    deleteRestaurant(id: $id)
  }
`

// Approve a pending restaurant.  Approval sets isActive = true on
// the restaurant and activates all users associated with it.
const APPROVE_RESTAURANT = gql`
  mutation ApproveRestaurantAdmin($id: ID!) {
    approveRestaurant(id: $id) {
      id
      isActive
    }
  }
`

// Mutation for linking a user to a restaurant.  After registering a
// manager account and creating a restaurant, this mutation updates
// the user’s businessId and businessType to point to the new
// restaurant.
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
// directly from the restaurant creation form.  The user is created
// inactive and linked to the restaurant via updateUser after the
// restaurant itself is created.
const REGISTER_USER = gql`
  mutation RegisterUserAdmin($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
      }
    }
  }
`

// Form state for creating/updating restaurants
interface RestaurantFormState {
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
  currency: string
  timezone: string
  taxRate: string
  serviceFee: string
  maxPartySize: string
  reservationWindow: string
  cancellationHours: string
}

export default function AdminRestaurantsPage() {
  const [restaurantFormState, setRestaurantFormState] = useState<RestaurantFormState>({
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
    currency: "",
    timezone: "",
    taxRate: "",
    serviceFee: "",
    maxPartySize: "",
    reservationWindow: "",
    cancellationHours: "",
  })
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null)
  // State for the manager account when creating a new restaurant.  These
  // fields are hidden when editing an existing restaurant.
  const [userFormState, setUserFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

  // Data hooks
  const {
    data: restaurantsData,
    loading: restaurantsLoading,
    error: restaurantsError,
    refetch: refetchRestaurants,
  } = useQuery(GET_RESTAURANTS)
  // We no longer fetch existing users because managers are created
  // simultaneously with new restaurants.  Manual assignment has been
  // removed from the admin interface.
  const [createRestaurant] = useMutation(CREATE_RESTAURANT)
  const [updateRestaurant] = useMutation(UPDATE_RESTAURANT)
  // Mutation hooks for activating and deactivating restaurants.  Deactivation
  // uses the deleteRestaurant mutation (renamed here) to set isActive to false.
  // Approval activates a pending restaurant.
  const [deactivateRestaurant] = useMutation(DEACTIVATE_RESTAURANT)
  const [approveRestaurantMutation] = useMutation(APPROVE_RESTAURANT)
  const [updateUser] = useMutation(UPDATE_USER)
  const [registerUser] = useMutation(REGISTER_USER)

  // Handle creation/update form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const input: any = {
      name: restaurantFormState.name,
      description: restaurantFormState.description || null,
      address: {
        street: restaurantFormState.street || null,
        city: restaurantFormState.city || null,
        state: restaurantFormState.state || null,
        zipCode: restaurantFormState.zipCode || null,
        country: restaurantFormState.country || null,
      },
      contact: {
        phone: restaurantFormState.phone || null,
        email: restaurantFormState.email || null,
        website: restaurantFormState.website || null,
      },
      settings: {
        currency: restaurantFormState.currency || null,
        timezone: restaurantFormState.timezone || null,
        taxRate: restaurantFormState.taxRate ? Number.parseFloat(restaurantFormState.taxRate) : null,
        serviceFee: restaurantFormState.serviceFee ? Number.parseFloat(restaurantFormState.serviceFee) : null,
        maxPartySize: restaurantFormState.maxPartySize ? Number.parseInt(restaurantFormState.maxPartySize, 10) : null,
        reservationWindow: restaurantFormState.reservationWindow
          ? Number.parseInt(restaurantFormState.reservationWindow, 10)
          : null,
        cancellationHours: restaurantFormState.cancellationHours
          ? Number.parseInt(restaurantFormState.cancellationHours, 10)
          : null,
      },
      businessHours: [],
      cuisine: [],
      priceRange: "$",
      features: [],
      policies: [],
      images: [],
    }
    try {
      if (editingRestaurantId) {
        // Editing an existing restaurant: update only the restaurant details
        await updateRestaurant({ variables: { id: editingRestaurantId, input } })
      } else {
        // Creating a new restaurant: register the manager, create the restaurant, then assign
        const { data: regData } = await registerUser({
          variables: {
            input: {
              firstName: userFormState.firstName,
              lastName: userFormState.lastName,
              email: userFormState.email,
              password: userFormState.password,
              businessType: "restaurant",
            },
          },
        })
        const userId = regData?.register?.user?.id
        const { data: restaurantData } = await createRestaurant({ variables: { input } })
        const restaurantId = restaurantData?.createRestaurant?.id
        if (userId && restaurantId) {
          await updateUser({
            variables: {
              id: userId,
              input: { businessId: restaurantId, businessType: "restaurant" },
            },
          })
        }
      }
      // Reset form state
      setRestaurantFormState({
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
        currency: "",
        timezone: "",
        taxRate: "",
        serviceFee: "",
        maxPartySize: "",
        reservationWindow: "",
        cancellationHours: "",
      })
      setUserFormState({ firstName: "", lastName: "", email: "", password: "" })
      setEditingRestaurantId(null)
      refetchRestaurants()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (restaurant: any) => {
    setEditingRestaurantId(restaurant.id)
    setRestaurantFormState({
      id: restaurant.id,
      name: restaurant.name || "",
      description: restaurant.description || "",
      street: restaurant.address?.street || "",
      city: restaurant.address?.city || "",
      state: restaurant.address?.state || "",
      zipCode: restaurant.address?.zipCode || "",
      country: restaurant.address?.country || "",
      phone: restaurant.contact?.phone || "",
      email: restaurant.contact?.email || "",
      website: restaurant.contact?.website || "",
      currency: restaurant.settings?.currency || "",
      timezone: restaurant.settings?.timezone || "",
      taxRate: restaurant.settings?.taxRate?.toString() || "",
      serviceFee: restaurant.settings?.serviceFee?.toString() || "",
      maxPartySize: restaurant.settings?.maxPartySize?.toString() || "",
      reservationWindow: restaurant.settings?.reservationWindow?.toString() || "",
      cancellationHours: restaurant.settings?.cancellationHours?.toString() || "",
    })
  }

  /**
   * Toggle the activation status of a restaurant.  When the
   * restaurant is currently active this marks it inactive via
   * deactivateRestaurant; when inactive it calls approveRestaurant.
   * After the mutation completes the restaurants list is refetched
   * to reflect the updated status.
   */
  const toggleActivation = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateRestaurant({ variables: { id } })
      } else {
        await approveRestaurantMutation({ variables: { id } })
      }
      await refetchRestaurants()
    } catch (err) {
      console.error(err)
    }
  }

  // handleAssign removed because restaurants are automatically linked to
  // newly created users.  Manual assignment is no longer needed.

  if (restaurantsLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading restaurants...</p>
        </div>
      </div>
    )

  if (restaurantsError)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-medium">Error loading restaurants</p>
              <p className="text-sm text-muted-foreground mt-1">{restaurantsError.message}</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Administration</h1>
          <p className="text-muted-foreground">Manage restaurants and their settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Existing Restaurants
          </CardTitle>
          <CardDescription>View and manage all restaurants in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const allRestaurants = [
              ...(restaurantsData?.restaurants || []),
              ...(restaurantsData?.pendingRestaurants || []),
            ]
            return allRestaurants && allRestaurants.length > 0 ? (
              <div className="grid gap-4">
                {allRestaurants.map((restaurant: any) => (
                  <Card key={restaurant.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                            <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                              {restaurant.isActive ? "Active" : "Pending"}
                            </Badge>
                          </div>

                          {restaurant.description && <p className="text-muted-foreground">{restaurant.description}</p>}

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {restaurant.address?.city && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {restaurant.address.city}, {restaurant.address.state}
                                </span>
                              </div>
                            )}
                            {restaurant.contact?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{restaurant.contact.phone}</span>
                              </div>
                            )}
                            {restaurant.contact?.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{restaurant.contact.email}</span>
                              </div>
                            )}
                            {restaurant.settings?.maxPartySize && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>Max {restaurant.settings.maxPartySize} guests</span>
                              </div>
                            )}
                            {restaurant.settings?.currency && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span>{restaurant.settings.currency}</span>
                              </div>
                            )}
                            {restaurant.settings?.timezone && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{restaurant.settings.timezone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(restaurant)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant={restaurant.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleActivation(restaurant.id, restaurant.isActive)}
                          >
                            {restaurant.isActive ? (
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
                <p className="text-muted-foreground">No restaurants found</p>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingRestaurantId ? (
              <>
                <Edit className="h-5 w-5" />
                Edit Restaurant
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create Restaurant
              </>
            )}
          </CardTitle>
          <CardDescription>
            {editingRestaurantId
              ? "Update restaurant information and settings"
              : "Add a new restaurant with manager account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={restaurantFormState.name}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, name: e.target.value })}
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    type="text"
                    value={restaurantFormState.description}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, description: e.target.value })}
                    placeholder="Brief description of the restaurant"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Address</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    type="text"
                    value={restaurantFormState.street}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, street: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={restaurantFormState.city}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    value={restaurantFormState.state}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={restaurantFormState.zipCode}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, zipCode: e.target.value })}
                    placeholder="Zip code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    type="text"
                    value={restaurantFormState.country}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="text"
                    value={restaurantFormState.phone}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={restaurantFormState.email}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, email: e.target.value })}
                    placeholder="Email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="text"
                    value={restaurantFormState.website}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, website: e.target.value })}
                    placeholder="Website URL"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Restaurant Settings</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    type="text"
                    value={restaurantFormState.currency}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, currency: e.target.value })}
                    placeholder="USD"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    type="text"
                    value={restaurantFormState.timezone}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, timezone: e.target.value })}
                    placeholder="America/New_York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={restaurantFormState.taxRate}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, taxRate: e.target.value })}
                    placeholder="8.25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceFee">Service Fee (%)</Label>
                  <Input
                    id="serviceFee"
                    type="number"
                    step="0.01"
                    value={restaurantFormState.serviceFee}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, serviceFee: e.target.value })}
                    placeholder="18.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPartySize">Max Party Size</Label>
                  <Input
                    id="maxPartySize"
                    type="number"
                    value={restaurantFormState.maxPartySize}
                    onChange={(e) => setRestaurantFormState({ ...restaurantFormState, maxPartySize: e.target.value })}
                    placeholder="8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reservationWindow">Reservation Window (days)</Label>
                  <Input
                    id="reservationWindow"
                    type="number"
                    value={restaurantFormState.reservationWindow}
                    onChange={(e) =>
                      setRestaurantFormState({ ...restaurantFormState, reservationWindow: e.target.value })
                    }
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancellationHours">Cancellation Hours</Label>
                  <Input
                    id="cancellationHours"
                    type="number"
                    value={restaurantFormState.cancellationHours}
                    onChange={(e) =>
                      setRestaurantFormState({ ...restaurantFormState, cancellationHours: e.target.value })
                    }
                    placeholder="24"
                  />
                </div>
              </div>
            </div>

            {!editingRestaurantId && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Manager Account</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={userFormState.firstName}
                        onChange={(e) => setUserFormState({ ...userFormState, firstName: e.target.value })}
                        placeholder="Manager's first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={userFormState.lastName}
                        onChange={(e) => setUserFormState({ ...userFormState, lastName: e.target.value })}
                        placeholder="Manager's last name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="managerEmail">Email *</Label>
                      <Input
                        id="managerEmail"
                        type="email"
                        value={userFormState.email}
                        onChange={(e) => setUserFormState({ ...userFormState, email: e.target.value })}
                        placeholder="Manager's email address"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={userFormState.password}
                        onChange={(e) => setUserFormState({ ...userFormState, password: e.target.value })}
                        placeholder="Manager's password"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" className="min-w-[150px]">
                <Save className="h-4 w-4 mr-2" />
                {editingRestaurantId ? "Update Restaurant" : "Create Restaurant"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
