// "use client"

// import { useState } from "react"
// import React from "react"
// import { gql, useMutation, useQuery } from "@apollo/client"

// // GraphQL operations for salons
// // Fetch both active and pending salons for the admin dashboard.  The
// // `salons` query returns active businesses while `pendingSalons`
// // returns those awaiting approval (isActive = false).  We merge these
// // lists in the component to display all salons regardless of status.
// const GET_SALONS = gql`
//   query GetSalonsAdmin {
//     salons {
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
//         cancellationHours
//       }
//       specialties
//       createdAt
//       updatedAt
//       isActive
//     }
//     pendingSalons {
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
//         cancellationHours
//       }
//       specialties
//       createdAt
//       updatedAt
//       isActive
//     }
//   }
// `;

// const CREATE_SALON = gql`
//   mutation CreateSalonAdmin($input: SalonInput!) {
//     createSalon(input: $input) {
//       id
//       name
//     }
//   }
// `;

// const UPDATE_SALON = gql`
//   mutation UpdateSalonAdmin($id: ID!, $input: SalonInput!) {
//     updateSalon(id: $id, input: $input) {
//       id
//       name
//       description
//       updatedAt
//     }
//   }
// `;

// // Deactivate a salon.  The deleteSalon mutation marks the salon inactive
// // (isActive = false) without removing it from the database.
// const DEACTIVATE_SALON = gql`
//   mutation DeactivateSalonAdmin($id: ID!) {
//     deleteSalon(id: $id)
//   }
// `;

// // Approve a pending salon.  Approval sets isActive = true on the salon
// // and activates all users associated with it.
// const APPROVE_SALON = gql`
//   mutation ApproveSalonAdmin($id: ID!) {
//     approveSalon(id: $id) {
//       id
//       isActive
//     }
//   }
// `;

// // Mutation for linking a user to a salon.  After registering a
// // manager account and creating a salon, this mutation updates
// // the user’s businessId and businessType to point to the new salon.
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
// // directly from the salon creation form.  The user is created inactive
// // and linked to the salon via updateUser after the salon itself is created.
// const REGISTER_USER = gql`
//   mutation RegisterUserAdmin($input: RegisterInput!) {
//     register(input: $input) {
//       user {
//         id
//       }
//     }
//   }
// `

// // Form state for creating/updating salons
// interface SalonFormState {
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
//   cancellationHours: string
//   specialties: string
// }

// export default function AdminSalonsPage() {
//   const [salonFormState, setSalonFormState] = useState<SalonFormState>({
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
//     cancellationHours: "",
//     specialties: "",
//   })
//   const [editingSalonId, setEditingSalonId] = useState<string | null>(null)
//   // When creating a new salon we also collect manager account details.
//   // These fields are used only when creating a new salon (editingSalonId is null).
//   const [userFormState, setUserFormState] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//   })

//   // Data hooks
//   const {
//     data: salonsData,
//     loading: salonsLoading,
//     error: salonsError,
//     refetch: refetchSalons,
//   } = useQuery(GET_SALONS)
//   // We no longer fetch a list of users for assignment because new salons
//   // are automatically linked to newly registered manager accounts.  Manual
//   // assignment via the admin dashboard is no longer necessary.
//   const [createSalon] = useMutation(CREATE_SALON)
//   const [updateSalon] = useMutation(UPDATE_SALON)
//   // Mutation hooks for activating and deactivating salons.  Deactivation
//   // uses the deleteSalon mutation (renamed here) to set isActive to false.
//   // Approval activates a pending salon.
//   const [deactivateSalon] = useMutation(DEACTIVATE_SALON)
//   const [approveSalonMutation] = useMutation(APPROVE_SALON)
//   const [updateUser] = useMutation(UPDATE_USER)
//   const [registerUser] = useMutation(REGISTER_USER)

//   // Handle create/update submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     // Build the salon input from the form state.  Optional fields are
//     // converted to null when empty.  Specialties are split on commas.
//     const input: any = {
//       name: salonFormState.name,
//       description: salonFormState.description || null,
//       address: {
//         street: salonFormState.street || null,
//         city: salonFormState.city || null,
//         state: salonFormState.state || null,
//         zipCode: salonFormState.zipCode || null,
//         country: salonFormState.country || null,
//       },
//       contact: {
//         phone: salonFormState.phone || null,
//         email: salonFormState.email || null,
//         website: salonFormState.website || null,
//       },
//       settings: {
//         currency: salonFormState.currency || null,
//         timezone: salonFormState.timezone || null,
//         taxRate: salonFormState.taxRate ? parseFloat(salonFormState.taxRate) : null,
//         serviceFee: salonFormState.serviceFee ? parseFloat(salonFormState.serviceFee) : null,
//         cancellationHours: salonFormState.cancellationHours
//           ? parseInt(salonFormState.cancellationHours, 10)
//           : null,
//       },
//       businessHours: [],
//       specialties: salonFormState.specialties
//         ? salonFormState.specialties.split(",").map((s) => s.trim())
//         : [],
//       policies: [],
//       images: [],
//     }
//     try {
//       if (editingSalonId) {
//         // Editing an existing salon: just update the salon details
//         await updateSalon({ variables: { id: editingSalonId, input } })
//       } else {
//         // Creating a new salon: first register the manager account
//         const { data: regData } = await registerUser({
//           variables: {
//             input: {
//               firstName: userFormState.firstName,
//               lastName: userFormState.lastName,
//               email: userFormState.email,
//               password: userFormState.password,
//               businessType: "salon",
//             },
//           },
//         })
//         const userId = regData?.register?.user?.id
//         // Then create the salon
//         const { data: salonData } = await createSalon({ variables: { input } })
//         const salonId = salonData?.createSalon?.id
//         // Assign the salon to the new user
//         if (userId && salonId) {
//           await updateUser({
//             variables: {
//               id: userId,
//               input: { businessId: salonId, businessType: "salon" },
//             },
//           })
//         }
//       }
//       // Reset form states after submission
//       setSalonFormState({
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
//         cancellationHours: "",
//         specialties: "",
//       })
//       setUserFormState({ firstName: "", lastName: "", email: "", password: "" })
//       setEditingSalonId(null)
//       refetchSalons()
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   const handleEdit = (salon: any) => {
//     setEditingSalonId(salon.id)
//     setSalonFormState({
//       id: salon.id,
//       name: salon.name || "",
//       description: salon.description || "",
//       street: salon.address?.street || "",
//       city: salon.address?.city || "",
//       state: salon.address?.state || "",
//       zipCode: salon.address?.zipCode || "",
//       country: salon.address?.country || "",
//       phone: salon.contact?.phone || "",
//       email: salon.contact?.email || "",
//       website: salon.contact?.website || "",
//       currency: salon.settings?.currency || "",
//       timezone: salon.settings?.timezone || "",
//       taxRate: salon.settings?.taxRate?.toString() || "",
//       serviceFee: salon.settings?.serviceFee?.toString() || "",
//       cancellationHours: salon.settings?.cancellationHours?.toString() || "",
//       specialties: salon.specialties?.join(", ") || "",
//     })
//   }

//   /**
//    * Toggle the activation status of a salon.  When the salon is currently
//    * active this marks it inactive via deactivateSalon; when inactive it
//    * calls approveSalon.  After the mutation completes the salons list is
//    * refetched to reflect the updated status.
//    */
//   const toggleActivation = async (id: string, isActive: boolean) => {
//     try {
//       if (isActive) {
//         await deactivateSalon({ variables: { id } })
//       } else {
//         await approveSalonMutation({ variables: { id } })
//       }
//       await refetchSalons()
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   // handleAssign removed because salons are automatically linked to
//   // newly created manager accounts.  Manual assignment is no longer needed.

//   if (salonsLoading) return <p>Loading salons...</p>
//   if (salonsError) return <p>Error loading salons.</p>

//   return (
//     <div className="space-y-12">
//       <h1 className="text-2xl font-bold">Salon Administration</h1>
//       {/* List salons */}
//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">Existing Salons</h2>
//         {/* Merge active and pending salons into a single list.  This ensures
//             newly created salons (which default to inactive) appear in the
//             table immediately without requiring admin approval. */}
//         {(() => {
//           const allSalons = [
//             ...(salonsData?.salons || []),
//             ...(salonsData?.pendingSalons || []),
//           ]
//           return allSalons && allSalons.length > 0 ? (
//             <ul className="space-y-2">
//               {allSalons.map((salon: any) => (
//                 <li
//                   key={salon.id}
//                   className="border rounded p-4 flex justify-between items-center"
//                 >
//                   <div>
//                     <p className="font-medium">{salon.name}</p>
//                     <p className="text-sm text-gray-600">{salon.description}</p>
//                     <p className="text-xs text-gray-500">
//                       Status: {salon.isActive ? 'Active' : 'Inactive'}
//                     </p>
//                   </div>
//                   <div className="space-x-2">
//                     <button
//                       className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
//                       onClick={() => handleEdit(salon)}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       className={`px-2 py-1 text-sm ${salon.isActive ? 'bg-yellow-500' : 'bg-green-600'} text-white rounded`}
//                       onClick={() => toggleActivation(salon.id, salon.isActive)}
//                     >
//                       {salon.isActive ? 'Deactivate' : 'Activate'}
//                     </button>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p>No salons found.</p>
//           )
//         })()}
//       </section>
//       {/* Assignment section removed.  When creating a new salon the administrator
//           simultaneously registers a manager account and links it to the salon.
//           Manual assignment via the admin dashboard is therefore no longer
//           required. */}
//       {/* Salon form */}
//       <section className="space-y-4">
//         <h2 className="text-lg font-medium">{editingSalonId ? 'Edit Salon' : 'Create Salon'}</h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium">Name</label>
//               <input
//                 type="text"
//                 value={salonFormState.name}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, name: e.target.value })}
//                 className="w-full p-2 border rounded"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Description</label>
//               <input
//                 type="text"
//                 value={salonFormState.description}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, description: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Street</label>
//               <input
//                 type="text"
//                 value={salonFormState.street}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, street: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">City</label>
//               <input
//                 type="text"
//                 value={salonFormState.city}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, city: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">State</label>
//               <input
//                 type="text"
//                 value={salonFormState.state}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, state: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Zip Code</label>
//               <input
//                 type="text"
//                 value={salonFormState.zipCode}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, zipCode: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Country</label>
//               <input
//                 type="text"
//                 value={salonFormState.country}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, country: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Phone</label>
//               <input
//                 type="text"
//                 value={salonFormState.phone}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, phone: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Email</label>
//               <input
//                 type="email"
//                 value={salonFormState.email}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, email: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Website</label>
//               <input
//                 type="text"
//                 value={salonFormState.website}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, website: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             {/* When creating a new salon we also collect manager account details.  These fields
//                 are hidden when editing an existing salon. */}
//             {!editingSalonId && (
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
//             <div>
//               <label className="block text-sm font-medium">Currency</label>
//               <input
//                 type="text"
//                 value={salonFormState.currency}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, currency: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Timezone</label>
//               <input
//                 type="text"
//                 value={salonFormState.timezone}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, timezone: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Tax Rate</label>
//               <input
//                 type="number"
//                 value={salonFormState.taxRate}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, taxRate: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Service Fee</label>
//               <input
//                 type="number"
//                 value={salonFormState.serviceFee}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, serviceFee: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Cancellation Hours</label>
//               <input
//                 type="number"
//                 value={salonFormState.cancellationHours}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, cancellationHours: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Specialties (comma separated)</label>
//               <input
//                 type="text"
//                 value={salonFormState.specialties}
//                 onChange={(e) => setSalonFormState({ ...salonFormState, specialties: e.target.value })}
//                 className="w-full p-2 border rounded"
//               />
//             </div>
//           </div>
//           <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
//             {editingSalonId ? 'Update Salon' : 'Create Salon'}
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Scissors, MapPin, Phone, Mail, Globe, Settings, User, Edit, Power, PowerOff, Loader2 } from "lucide-react"

// GraphQL operations for salons
// Fetch both active and pending salons for the admin dashboard.  The
// `salons` query returns active businesses while `pendingSalons`
// returns those awaiting approval (isActive = false).  We merge these
// lists in the component to display all salons regardless of status.
const GET_SALONS = gql`
  query GetSalonsAdmin {
    salons {
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
        cancellationHours
      }
      specialties
      createdAt
      updatedAt
      isActive
    }
    pendingSalons {
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
        cancellationHours
      }
      specialties
      createdAt
      updatedAt
      isActive
    }
  }
`

const CREATE_SALON = gql`
  mutation CreateSalonAdmin($input: SalonInput!) {
    createSalon(input: $input) {
      id
      name
    }
  }
`

const UPDATE_SALON = gql`
  mutation UpdateSalonAdmin($id: ID!, $input: SalonInput!) {
    updateSalon(id: $id, input: $input) {
      id
      name
      description
      updatedAt
    }
  }
`

// Deactivate a salon.  The deleteSalon mutation marks the salon inactive
// (isActive = false) without removing it from the database.
const DEACTIVATE_SALON = gql`
  mutation DeactivateSalonAdmin($id: ID!) {
    deleteSalon(id: $id)
  }
`

// Approve a pending salon.  Approval sets isActive = true on the salon
// and activates all users associated with it.
const APPROVE_SALON = gql`
  mutation ApproveSalonAdmin($id: ID!) {
    approveSalon(id: $id) {
      id
      isActive
    }
  }
`

// Mutation for linking a user to a salon.  After registering a
// manager account and creating a salon, this mutation updates
// the user’s businessId and businessType to point to the new salon.
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
// directly from the salon creation form.  The user is created inactive
// and linked to the salon via updateUser after the salon itself is created.
const REGISTER_USER = gql`
  mutation RegisterUserAdmin($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
      }
    }
  }
`

// Form state for creating/updating salons
interface SalonFormState {
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
  cancellationHours: string
  specialties: string
}

export default function AdminSalonsPage() {
  const [salonFormState, setSalonFormState] = useState<SalonFormState>({
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
    cancellationHours: "",
    specialties: "",
  })
  const [editingSalonId, setEditingSalonId] = useState<string | null>(null)
  const [userFormState, setUserFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Data hooks
  const { data: salonsData, loading: salonsLoading, error: salonsError, refetch: refetchSalons } = useQuery(GET_SALONS)
  // We no longer fetch a list of users for assignment because new salons
  // are automatically linked to newly registered manager accounts.  Manual
  // assignment via the admin dashboard is no longer necessary.
  const [createSalon] = useMutation(CREATE_SALON)
  const [updateSalon] = useMutation(UPDATE_SALON)
  // Mutation hooks for activating and deactivating salons.  Deactivation
  // uses the deleteSalon mutation (renamed here) to set isActive to false.
  // Approval activates a pending salon.
  const [deactivateSalon] = useMutation(DEACTIVATE_SALON)
  const [approveSalonMutation] = useMutation(APPROVE_SALON)
  const [updateUser] = useMutation(UPDATE_USER)
  const [registerUser] = useMutation(REGISTER_USER)

  // Handle create/update submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const input: any = {
      name: salonFormState.name,
      description: salonFormState.description || null,
      address: {
        street: salonFormState.street || null,
        city: salonFormState.city || null,
        state: salonFormState.state || null,
        zipCode: salonFormState.zipCode || null,
        country: salonFormState.country || null,
      },
      contact: {
        phone: salonFormState.phone || null,
        email: salonFormState.email || null,
        website: salonFormState.website || null,
      },
      settings: {
        currency: salonFormState.currency || null,
        timezone: salonFormState.timezone || null,
        taxRate: salonFormState.taxRate ? Number.parseFloat(salonFormState.taxRate) : null,
        serviceFee: salonFormState.serviceFee ? Number.parseFloat(salonFormState.serviceFee) : null,
        cancellationHours: salonFormState.cancellationHours
          ? Number.parseInt(salonFormState.cancellationHours, 10)
          : null,
      },
      businessHours: [],
      specialties: salonFormState.specialties ? salonFormState.specialties.split(",").map((s) => s.trim()) : [],
      policies: [],
      images: [],
    }

    try {
      if (editingSalonId) {
        // Editing an existing salon: just update the salon details
        await updateSalon({ variables: { id: editingSalonId, input } })
      } else {
        // Creating a new salon: first register the manager account
        const { data: regData } = await registerUser({
          variables: {
            input: {
              firstName: userFormState.firstName,
              lastName: userFormState.lastName,
              email: userFormState.email,
              password: userFormState.password,
              businessType: "salon",
            },
          },
        })
        const userId = regData?.register?.user?.id
        // Then create the salon
        const { data: salonData } = await createSalon({ variables: { input } })
        const salonId = salonData?.createSalon?.id
        // Assign the salon to the new user
        if (userId && salonId) {
          await updateUser({
            variables: {
              id: userId,
              input: { businessId: salonId, businessType: "salon" },
            },
          })
        }
      }
      // Reset form states after submission
      setSalonFormState({
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
        cancellationHours: "",
        specialties: "",
      })
      setUserFormState({ firstName: "", lastName: "", email: "", password: "" })
      setEditingSalonId(null)
      refetchSalons()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (salon: any) => {
    setEditingSalonId(salon.id)
    setSalonFormState({
      id: salon.id,
      name: salon.name || "",
      description: salon.description || "",
      street: salon.address?.street || "",
      city: salon.address?.city || "",
      state: salon.address?.state || "",
      zipCode: salon.address?.zipCode || "",
      country: salon.address?.country || "",
      phone: salon.contact?.phone || "",
      email: salon.contact?.email || "",
      website: salon.contact?.website || "",
      currency: salon.settings?.currency || "",
      timezone: salon.settings?.timezone || "",
      taxRate: salon.settings?.taxRate?.toString() || "",
      serviceFee: salon.settings?.serviceFee?.toString() || "",
      cancellationHours: salon.settings?.cancellationHours?.toString() || "",
      specialties: salon.specialties?.join(", ") || "",
    })
  }

  /**
   * Toggle the activation status of a salon.  When the salon is currently
   * active this marks it inactive via deactivateSalon; when inactive it
   * calls approveSalon.  After the mutation completes the salons list is
   * refetched to reflect the updated status.
   */
  const toggleActivation = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateSalon({ variables: { id } })
      } else {
        await approveSalonMutation({ variables: { id } })
      }
      await refetchSalons()
    } catch (err) {
      console.error(err)
    }
  }

  // handleAssign removed because salons are automatically linked to
  // newly created manager accounts.  Manual assignment is no longer needed.

  if (salonsLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading salons...</span>
        </div>
      </div>
    )

  if (salonsError)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium">Error loading salons</div>
          <p className="text-muted-foreground mt-2">{salonsError.message}</p>
        </div>
      </div>
    )

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-pink-100 rounded-lg">
          <Scissors className="h-6 w-6 text-pink-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Salon Administration</h1>
          <p className="text-muted-foreground">Manage salon listings and operations</p>
        </div>
      </div>

      {/* Existing Salons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Existing Salons
          </CardTitle>
          <CardDescription>View and manage all salon listings</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const allSalons = [...(salonsData?.salons || []), ...(salonsData?.pendingSalons || [])]
            return allSalons && allSalons.length > 0 ? (
              <div className="grid gap-4">
                {allSalons.map((salon: any) => (
                  <Card key={salon.id} className="border-l-4 border-l-pink-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold">{salon.name}</h3>
                            <Badge variant={salon.isActive ? "default" : "secondary"}>
                              {salon.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          {salon.description && <p className="text-muted-foreground">{salon.description}</p>}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {salon.address && (salon.address.street || salon.address.city) && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {[salon.address.street, salon.address.city, salon.address.state]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            )}

                            {salon.contact?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{salon.contact.phone}</span>
                              </div>
                            )}

                            {salon.contact?.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{salon.contact.email}</span>
                              </div>
                            )}

                            {salon.contact?.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span>{salon.contact.website}</span>
                              </div>
                            )}
                          </div>

                          {salon.specialties && salon.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {salon.specialties.map((specialty: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(salon)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant={salon.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleActivation(salon.id, salon.isActive)}
                            className="flex items-center gap-1"
                          >
                            {salon.isActive ? (
                              <>
                                <PowerOff className="h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4" />
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
                <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No salons found.</p>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Salon Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingSalonId ? (
              <>
                <Edit className="h-5 w-5" />
                Edit Salon
              </>
            ) : (
              <>
                <Scissors className="h-5 w-5" />
                Create New Salon
              </>
            )}
          </CardTitle>
          <CardDescription>
            {editingSalonId ? "Update salon information and settings" : "Add a new salon with manager account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Salon Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={salonFormState.name}
                    onChange={(e) => setSalonFormState({ ...salonFormState, name: e.target.value })}
                    placeholder="Enter salon name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    type="text"
                    value={salonFormState.description}
                    onChange={(e) => setSalonFormState({ ...salonFormState, description: e.target.value })}
                    placeholder="Brief description of the salon"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    type="text"
                    value={salonFormState.street}
                    onChange={(e) => setSalonFormState({ ...salonFormState, street: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={salonFormState.city}
                    onChange={(e) => setSalonFormState({ ...salonFormState, city: e.target.value })}
                    placeholder="City name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    type="text"
                    value={salonFormState.state}
                    onChange={(e) => setSalonFormState({ ...salonFormState, state: e.target.value })}
                    placeholder="State or province"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={salonFormState.zipCode}
                    onChange={(e) => setSalonFormState({ ...salonFormState, zipCode: e.target.value })}
                    placeholder="12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    type="text"
                    value={salonFormState.country}
                    onChange={(e) => setSalonFormState({ ...salonFormState, country: e.target.value })}
                    placeholder="Country name"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={salonFormState.phone}
                    onChange={(e) => setSalonFormState({ ...salonFormState, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={salonFormState.email}
                    onChange={(e) => setSalonFormState({ ...salonFormState, email: e.target.value })}
                    placeholder="contact@salon.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={salonFormState.website}
                    onChange={(e) => setSalonFormState({ ...salonFormState, website: e.target.value })}
                    placeholder="https://www.salon.com"
                  />
                </div>
              </div>
            </div>

            {!editingSalonId && (
              <>
                <Separator />
                {/* Manager Account */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Manager Account
                  </h3>
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
                      <Label htmlFor="managerEmail">Manager Email *</Label>
                      <Input
                        id="managerEmail"
                        type="email"
                        value={userFormState.email}
                        onChange={(e) => setUserFormState({ ...userFormState, email: e.target.value })}
                        placeholder="manager@salon.com"
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
                        placeholder="Secure password"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Business Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Business Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    type="text"
                    value={salonFormState.currency}
                    onChange={(e) => setSalonFormState({ ...salonFormState, currency: e.target.value })}
                    placeholder="USD"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    type="text"
                    value={salonFormState.timezone}
                    onChange={(e) => setSalonFormState({ ...salonFormState, timezone: e.target.value })}
                    placeholder="America/New_York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={salonFormState.taxRate}
                    onChange={(e) => setSalonFormState({ ...salonFormState, taxRate: e.target.value })}
                    placeholder="8.25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceFee">Service Fee (%)</Label>
                  <Input
                    id="serviceFee"
                    type="number"
                    step="0.01"
                    value={salonFormState.serviceFee}
                    onChange={(e) => setSalonFormState({ ...salonFormState, serviceFee: e.target.value })}
                    placeholder="2.50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancellationHours">Cancellation Hours</Label>
                  <Input
                    id="cancellationHours"
                    type="number"
                    value={salonFormState.cancellationHours}
                    onChange={(e) => setSalonFormState({ ...salonFormState, cancellationHours: e.target.value })}
                    placeholder="24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialties">Specialties</Label>
                  <Input
                    id="specialties"
                    type="text"
                    value={salonFormState.specialties}
                    onChange={(e) => setSalonFormState({ ...salonFormState, specialties: e.target.value })}
                    placeholder="Hair Cut, Hair Color, Styling"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingSalonId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4" />
                    {editingSalonId ? "Update Salon" : "Create Salon"}
                  </>
                )}
              </Button>
              {editingSalonId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingSalonId(null)
                    setSalonFormState({
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
                      cancellationHours: "",
                      specialties: "",
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
