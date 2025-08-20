// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { gql, useMutation } from "@apollo/client";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";

// // GraphQL mutations reused from the admin pages.  These create a
// // business entity (hotel, restaurant or salon) and return the new
// // entity’s id.  After creation the user will be updated to link
// // their account to the created business.
// const CREATE_HOTEL = gql`
//   mutation CreateHotel($input: HotelInput!) {
//     createHotel(input: $input) {
//       id
//       name
//     }
//   }
// `;

// const CREATE_RESTAURANT = gql`
//   mutation CreateRestaurant($input: RestaurantInput!) {
//     createRestaurant(input: $input) {
//       id
//       name
//     }
//   }
// `;

// const CREATE_SALON = gql`
//   mutation CreateSalon($input: SalonInput!) {
//     createSalon(input: $input) {
//       id
//       name
//     }
//   }
// `;

// const UPDATE_USER = gql`
//   mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
//     updateUser(id: $id, input: $input) {
//       id
//       businessId
//       businessType
//     }
//   }
// `;

// /**
//  * Page component that collects business details from a newly
//  * registered user.  The user arrives here after completing the
//  * initial sign‑up form with a selected businessType (hotel,
//  * restaurant or salon).  This component renders a minimal form
//  * tailored to the selected business type, creates the corresponding
//  * business via GraphQL and then associates the new business with
//  * the current user via an updateUser mutation.  Upon success the
//  * user is redirected to a pending approval page.
//  */
// export default function BusinessSetupPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   // Determine which type of business the user chose during sign‑up.
//   const businessType = (searchParams.get("businessType") || "hotel").toLowerCase();

//   // The logged in user’s id is required to call updateUser.  It is
//   // fetched from the session API endpoint once on mount.
//   const [userId, setUserId] = useState<string | null>(null);
//   // Track loading state while waiting for mutations and session fetch.
//   const [submitting, setSubmitting] = useState(false);
//   // Simple form state covering common fields for all business types.
//   const [formState, setFormState] = useState({
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
//     // Restaurant and salon specific fields
//     currency: "",
//     timezone: "",
//     taxRate: "",
//     serviceFee: "",
//     maxPartySize: "",
//     reservationWindow: "",
//     cancellationHours: "",
//     specialties: "",
//   });

//   // Prepare GraphQL mutations.
//   const [createHotel] = useMutation(CREATE_HOTEL);
//   const [createRestaurant] = useMutation(CREATE_RESTAURANT);
//   const [createSalon] = useMutation(CREATE_SALON);
//   const [updateUser] = useMutation(UPDATE_USER);

//   // Fetch the current session to extract the user id.  If no user is
//   // logged in redirect back to the login page.  We rely on the
//   // session API because iron‑session stores data in an httpOnly
//   // cookie which is not directly accessible on the client.
//   useEffect(() => {
//     const fetchSession = async () => {
//       try {
//         const res = await fetch("/api/session");
//         if (!res.ok) {
//           router.push("/login");
//           return;
//         }
//         const data = await res.json();
//         if (data?.isLoggedIn && data.user?.id) {
//           setUserId(data.user.id);
//         } else {
//           router.push("/login");
//         }
//       } catch (err) {
//         console.error("Failed to fetch session", err);
//         router.push("/login");
//       }
//     };
//     fetchSession();
//   }, [router]);

//   // Generic change handler for inputs.
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormState((prev) => ({ ...prev, [name]: value }));
//   };

//   // Submit handler creates the appropriate business and links it to
//   // the current user.  Each mutation returns an id which we then use
//   // when calling updateUser.  On success the user sees a pending
//   // approval message.
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!userId) return;
//     setSubmitting(true);
//     try {
//       let serviceId: string | null = null;
//       if (businessType === "hotel") {
//         const input: any = {
//           name: formState.name,
//           description: formState.description || null,
//           address: {
//             street: formState.street || null,
//             city: formState.city || null,
//             state: formState.state || null,
//             zipCode: formState.zipCode || null,
//             country: formState.country || null,
//           },
//           contact: {
//             phone: formState.phone || null,
//             email: formState.email || null,
//             website: formState.website || null,
//           },
//           settings: {},
//           amenities: [],
//           services: [],
//           policies: [],
//           images: [],
//           openingPeriods: [],
//         };
//         const { data } = await createHotel({ variables: { input } });
//         serviceId = data?.createHotel?.id;
//       } else if (businessType === "restaurant") {
//         const input: any = {
//           name: formState.name,
//           description: formState.description || null,
//           address: {
//             street: formState.street || null,
//             city: formState.city || null,
//             state: formState.state || null,
//             zipCode: formState.zipCode || null,
//             country: formState.country || null,
//           },
//           contact: {
//             phone: formState.phone || null,
//             email: formState.email || null,
//             website: formState.website || null,
//           },
//           settings: {
//             currency: formState.currency || null,
//             timezone: formState.timezone || null,
//             taxRate: formState.taxRate ? parseFloat(formState.taxRate) : null,
//             serviceFee: formState.serviceFee ? parseFloat(formState.serviceFee) : null,
//             maxPartySize: formState.maxPartySize ? parseInt(formState.maxPartySize, 10) : null,
//             reservationWindow: formState.reservationWindow ? parseInt(formState.reservationWindow, 10) : null,
//             cancellationHours: formState.cancellationHours ? parseInt(formState.cancellationHours, 10) : null,
//           },
//           businessHours: [],
//           cuisine: [],
//           priceRange: "$",
//           features: [],
//           policies: [],
//           images: [],
//         };
//         const { data } = await createRestaurant({ variables: { input } });
//         serviceId = data?.createRestaurant?.id;
//       } else if (businessType === "salon") {
//         const input: any = {
//           name: formState.name,
//           description: formState.description || null,
//           address: {
//             street: formState.street || null,
//             city: formState.city || null,
//             state: formState.state || null,
//             zipCode: formState.zipCode || null,
//             country: formState.country || null,
//           },
//           contact: {
//             phone: formState.phone || null,
//             email: formState.email || null,
//             website: formState.website || null,
//           },
//           settings: {
//             currency: formState.currency || null,
//             timezone: formState.timezone || null,
//             taxRate: formState.taxRate ? parseFloat(formState.taxRate) : null,
//             serviceFee: formState.serviceFee ? parseFloat(formState.serviceFee) : null,
//             cancellationHours: formState.cancellationHours ? parseInt(formState.cancellationHours, 10) : null,
//           },
//           businessHours: [],
//           specialties: formState.specialties
//             ? formState.specialties.split(",").map((s) => s.trim())
//             : [],
//           policies: [],
//           images: [],
//         };
//         const { data } = await createSalon({ variables: { input } });
//         serviceId = data?.createSalon?.id;
//       }
//       if (serviceId) {
//         await updateUser({
//           variables: {
//             id: userId,
//             input: {
//               businessId: serviceId,
//               businessType: businessType,
//             },
//           },
//         });
//         // Redirect to a pending approval page so the user cannot
//         // immediately access the dashboard.  Admins can later flip
//         // isActive on the business to true once the details are
//         // reviewed.
//         router.push("/pending-approval");
//       } else {
//         // If no id was returned throw an error to the UI.
//         alert("Failed to create business, please try again.");
//       }
//     } catch (err) {
//       console.error("Failed to create business", err);
//       alert("An error occurred while creating your business.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-lg">
//         <h1 className="mb-6 text-2xl font-bold text-gray-900">
//           Set up your {businessType.charAt(0).toUpperCase() + businessType.slice(1)}
//         </h1>
//         <p className="mb-8 text-gray-600">
//           Please provide some basic information about your {businessType} so we can create it in the system.  A
//           moderator will review your submission before you gain full access.
//         </p>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <Label htmlFor="name">Name</Label>
//             <Input
//               id="name"
//               name="name"
//               type="text"
//               value={formState.name}
//               onChange={handleChange}
//               required
//             />
//           </div>
//           <div>
//             <Label htmlFor="description">Description</Label>
//             <Input
//               id="description"
//               name="description"
//               type="text"
//               value={formState.description}
//               onChange={handleChange}
//             />
//           </div>
//           <div>
//             <Label htmlFor="street">Street</Label>
//             <Input
//               id="street"
//               name="street"
//               type="text"
//               value={formState.street}
//               onChange={handleChange}
//             />
//           </div>
//           <div>
//             <Label htmlFor="city">City</Label>
//             <Input id="city" name="city" type="text" value={formState.city} onChange={handleChange} />
//           </div>
//           <div>
//             <Label htmlFor="state">State/Province</Label>
//             <Input id="state" name="state" type="text" value={formState.state} onChange={handleChange} />
//           </div>
//           <div>
//             <Label htmlFor="zipCode">Zip/Postal Code</Label>
//             <Input
//               id="zipCode"
//               name="zipCode"
//               type="text"
//               value={formState.zipCode}
//               onChange={handleChange}
//             />
//           </div>
//           <div>
//             <Label htmlFor="country">Country</Label>
//             <Input id="country" name="country" type="text" value={formState.country} onChange={handleChange} />
//           </div>
//           <div>
//             <Label htmlFor="phone">Phone</Label>
//             <Input id="phone" name="phone" type="text" value={formState.phone} onChange={handleChange} />
//           </div>
//           <div>
//             <Label htmlFor="email">Business Email</Label>
//             <Input id="email" name="email" type="email" value={formState.email} onChange={handleChange} />
//           </div>
//           <div>
//             <Label htmlFor="website">Website</Label>
//             <Input id="website" name="website" type="text" value={formState.website} onChange={handleChange} />
//           </div>

//           {/* Additional fields for restaurant and salon */}
//           {(businessType === "restaurant" || businessType === "salon") && (
//             <>
//               <div>
//                 <Label htmlFor="currency">Currency</Label>
//                 <Input
//                   id="currency"
//                   name="currency"
//                   type="text"
//                   value={formState.currency}
//                   onChange={handleChange}
//                   placeholder="e.g. USD"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="timezone">Timezone</Label>
//                 <Input
//                   id="timezone"
//                   name="timezone"
//                   type="text"
//                   value={formState.timezone}
//                   onChange={handleChange}
//                   placeholder="e.g. UTC"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="taxRate">Tax Rate (%)</Label>
//                 <Input
//                   id="taxRate"
//                   name="taxRate"
//                   type="number"
//                   value={formState.taxRate}
//                   onChange={handleChange}
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="serviceFee">Service Fee</Label>
//                 <Input
//                   id="serviceFee"
//                   name="serviceFee"
//                   type="number"
//                   value={formState.serviceFee}
//                   onChange={handleChange}
//                   min="0"
//                   step="0.01"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="cancellationHours">Cancellation Hours</Label>
//                 <Input
//                   id="cancellationHours"
//                   name="cancellationHours"
//                   type="number"
//                   value={formState.cancellationHours}
//                   onChange={handleChange}
//                   min="0"
//                   step="1"
//                 />
//               </div>
//             </>
//           )}
//           {businessType === "restaurant" && (
//             <>
//               <div>
//                 <Label htmlFor="maxPartySize">Max Party Size</Label>
//                 <Input
//                   id="maxPartySize"
//                   name="maxPartySize"
//                   type="number"
//                   value={formState.maxPartySize}
//                   onChange={handleChange}
//                   min="1"
//                   step="1"
//                 />
//               </div>
//               <div>
//                 <Label htmlFor="reservationWindow">Reservation Window (days)</Label>
//                 <Input
//                   id="reservationWindow"
//                   name="reservationWindow"
//                   type="number"
//                   value={formState.reservationWindow}
//                   onChange={handleChange}
//                   min="1"
//                   step="1"
//                 />
//               </div>
//             </>
//           )}
//           {businessType === "salon" && (
//             <div>
//               <Label htmlFor="specialties">Specialties (comma separated)</Label>
//               <Input
//                 id="specialties"
//                 name="specialties"
//                 type="text"
//                 value={formState.specialties}
//                 onChange={handleChange}
//                 placeholder="e.g. Haircut, Massage"
//               />
//             </div>
//           )}
//           <Button type="submit" disabled={submitting || !userId} className="w-full">
//             {submitting ? "Submitting..." : "Submit Business"}
//           </Button>
//         </form>
//       </div>
//     </div>
//   );
// }




// test1


"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { gql, useMutation } from "@apollo/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, Phone, Mail, Globe, Settings, Clock, DollarSign } from "lucide-react"

// GraphQL mutations reused from the admin pages.  These create a
// business entity (hotel, restaurant or salon) and return the new
// entity’s id.  After creation the user will be updated to link
// their account to the created business.
const CREATE_HOTEL = gql`
  mutation CreateHotel($input: HotelInput!) {
    createHotel(input: $input) {
      id
      name
    }
  }
`

const CREATE_RESTAURANT = gql`
  mutation CreateRestaurant($input: RestaurantInput!) {
    createRestaurant(input: $input) {
      id
      name
    }
  }
`

const CREATE_SALON = gql`
  mutation CreateSalon($input: SalonInput!) {
    createSalon(input: $input) {
      id
      name
    }
  }
`

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      businessId
      businessType
    }
  }
`

/**
 * Page component that collects business details from a newly
 * registered user.  The user arrives here after completing the
 * initial sign‑up form with a selected businessType (hotel,
 * restaurant or salon).  This component renders a minimal form
 * tailored to the selected business type, creates the corresponding
 * business via GraphQL and then associates the new business with
 * the current user via an updateUser mutation.  Upon success the
 * user is redirected to a pending approval page.
 */
export default function BusinessSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Determine which type of business the user chose during sign‑up.
  const businessType = (searchParams.get("businessType") || "hotel").toLowerCase()

  // The logged in user’s id is required to call updateUser.  It is
  // fetched from the session API endpoint once on mount.
  const [userId, setUserId] = useState<string | null>(null)
  // Track loading state while waiting for mutations and session fetch.
  const [submitting, setSubmitting] = useState(false)
  // Simple form state covering common fields for all business types.
  const [formState, setFormState] = useState({
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
    // Restaurant and salon specific fields
    currency: "",
    timezone: "",
    taxRate: "",
    serviceFee: "",
    maxPartySize: "",
    reservationWindow: "",
    cancellationHours: "",
    specialties: "",
  })

  // Prepare GraphQL mutations.
  const [createHotel] = useMutation(CREATE_HOTEL)
  const [createRestaurant] = useMutation(CREATE_RESTAURANT)
  const [createSalon] = useMutation(CREATE_SALON)
  const [updateUser] = useMutation(UPDATE_USER)

  // Fetch the current session to extract the user id.  If no user is
  // logged in redirect back to the login page.  We rely on the
  // session API because iron‑session stores data in an httpOnly
  // cookie which is not directly accessible on the client.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        if (data?.isLoggedIn && data.user?.id) {
          setUserId(data.user.id)
        } else {
          router.push("/login")
        }
      } catch (err) {
        console.error("Failed to fetch session", err)
        router.push("/login")
      }
    }
    fetchSession()
  }, [router])

  // Generic change handler for inputs.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  // Submit handler creates the appropriate business and links it to
  // the current user.  Each mutation returns an id which we then use
  // when calling updateUser.  On success the user sees a pending
  // approval message.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSubmitting(true)
    try {
      let serviceId: string | null = null
      if (businessType === "hotel") {
        const input: any = {
          name: formState.name,
          description: formState.description || null,
          address: {
            street: formState.street || null,
            city: formState.city || null,
            state: formState.state || null,
            zipCode: formState.zipCode || null,
            country: formState.country || null,
          },
          contact: {
            phone: formState.phone || null,
            email: formState.email || null,
            website: formState.website || null,
          },
          settings: {},
          amenities: [],
          services: [],
          policies: [],
          images: [],
          openingPeriods: [],
        }
        const { data } = await createHotel({ variables: { input } })
        serviceId = data?.createHotel?.id
      } else if (businessType === "restaurant") {
        const input: any = {
          name: formState.name,
          description: formState.description || null,
          address: {
            street: formState.street || null,
            city: formState.city || null,
            state: formState.state || null,
            zipCode: formState.zipCode || null,
            country: formState.country || null,
          },
          contact: {
            phone: formState.phone || null,
            email: formState.email || null,
            website: formState.website || null,
          },
          settings: {
            currency: formState.currency || null,
            timezone: formState.timezone || null,
            taxRate: formState.taxRate ? Number.parseFloat(formState.taxRate) : null,
            serviceFee: formState.serviceFee ? Number.parseFloat(formState.serviceFee) : null,
            maxPartySize: formState.maxPartySize ? Number.parseInt(formState.maxPartySize, 10) : null,
            reservationWindow: formState.reservationWindow ? Number.parseInt(formState.reservationWindow, 10) : null,
            cancellationHours: formState.cancellationHours ? Number.parseInt(formState.cancellationHours, 10) : null,
          },
          businessHours: [],
          cuisine: [],
          priceRange: "$",
          features: [],
          policies: [],
          images: [],
        }
        const { data } = await createRestaurant({ variables: { input } })
        serviceId = data?.createRestaurant?.id
      } else if (businessType === "salon") {
        const input: any = {
          name: formState.name,
          description: formState.description || null,
          address: {
            street: formState.street || null,
            city: formState.city || null,
            state: formState.state || null,
            zipCode: formState.zipCode || null,
            country: formState.country || null,
          },
          contact: {
            phone: formState.phone || null,
            email: formState.email || null,
            website: formState.website || null,
          },
          settings: {
            currency: formState.currency || null,
            timezone: formState.timezone || null,
            taxRate: formState.taxRate ? Number.parseFloat(formState.taxRate) : null,
            serviceFee: formState.serviceFee ? Number.parseFloat(formState.serviceFee) : null,
            cancellationHours: formState.cancellationHours ? Number.parseInt(formState.cancellationHours, 10) : null,
          },
          businessHours: [],
          specialties: formState.specialties ? formState.specialties.split(",").map((s) => s.trim()) : [],
          policies: [],
          images: [],
        }
        const { data } = await createSalon({ variables: { input } })
        serviceId = data?.createSalon?.id
      }
      if (serviceId) {
        await updateUser({
          variables: {
            id: userId,
            input: {
              businessId: serviceId,
              businessType: businessType,
            },
          },
        })
        // Redirect to a pending approval page so the user cannot
        // immediately access the dashboard.  Admins can later flip
        // isActive on the business to true once the details are
        // reviewed.
        router.push("/pending-approval")
      } else {
        // If no id was returned throw an error to the UI.
        alert("Failed to create business, please try again.")
      }
    } catch (err) {
      console.error("Failed to create business", err)
      alert("An error occurred while creating your business.")
    } finally {
      setSubmitting(false)
    }
  }

  const getBusinessColors = (type: string) => {
    switch (type) {
      case "hotel":
        return {
          primary: "#1e40af", // blue-800
          light: "#3b82f6", // blue-500
          gradient: "from-slate-50 via-blue-50 to-indigo-50",
          focus: "focus:border-blue-500 focus:ring-blue-500",
          button: "bg-blue-600 hover:bg-blue-700",
        }
      case "restaurant":
        return {
          primary: "#991b1b", // red-800
          light: "#dc2626", // red-600
          gradient: "from-slate-50 via-red-50 to-rose-50",
          focus: "focus:border-red-500 focus:ring-red-500",
          button: "bg-red-700 hover:bg-red-800",
        }
      case "salon":
        return {
          primary: "#9d174d", // pink-800
          light: "#e11d48", // pink-600
          gradient: "from-slate-50 via-pink-50 to-rose-50",
          focus: "focus:border-pink-500 focus:ring-pink-500",
          button: "bg-pink-700 hover:bg-pink-800",
        }
      default:
        return {
          primary: "#1e40af",
          light: "#3b82f6",
          gradient: "from-slate-50 via-blue-50 to-indigo-50",
          focus: "focus:border-blue-500 focus:ring-blue-500",
          button: "bg-blue-600 hover:bg-blue-700",
        }
    }
  }

  const colors = getBusinessColors(businessType)

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-2xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set up your {businessType.charAt(0).toUpperCase() + businessType.slice(1)}
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Please provide some basic information about your {businessType} so we can create it in the system. A
            moderator will review your submission before you gain full access.
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl text-gray-900">Business Information</CardTitle>
            <CardDescription className="text-gray-600">
              Fill out the details below to get started with your {businessType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5" style={{ color: colors.primary }} />
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Business Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="Enter your business name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      type="text"
                      value={formState.description}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="Brief description of your business"
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                  <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                      Street Address
                    </Label>
                    <Input
                      id="street"
                      name="street"
                      type="text"
                      value={formState.street}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      value={formState.city}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="City name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                      State/Province
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      value={formState.state}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="State or Province"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                      Zip/Postal Code
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      value={formState.zipCode}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      value={formState.country}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="Country name"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="w-5 h-5" style={{ color: colors.primary }} />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="text"
                      value={formState.phone}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Business Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="business@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      name="website"
                      type="text"
                      value={formState.website}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="https://www.yourbusiness.com"
                    />
                  </div>
                </div>
              </div>

              {/* Additional fields for restaurant and salon */}
              {(businessType === "restaurant" || businessType === "salon") && (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5" style={{ color: colors.primary }} />
                    <h3 className="text-lg font-semibold text-gray-900">Business Settings</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Currency
                      </Label>
                      <Input
                        id="currency"
                        name="currency"
                        type="text"
                        value={formState.currency}
                        onChange={handleChange}
                        placeholder="e.g. USD"
                        className={`mt-1 border-gray-300 ${colors.focus}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Timezone
                      </Label>
                      <Input
                        id="timezone"
                        name="timezone"
                        type="text"
                        value={formState.timezone}
                        onChange={handleChange}
                        placeholder="e.g. UTC"
                        className={`mt-1 border-gray-300 ${colors.focus}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxRate" className="text-sm font-medium text-gray-700">
                        Tax Rate (%)
                      </Label>
                      <Input
                        id="taxRate"
                        name="taxRate"
                        type="number"
                        value={formState.taxRate}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className={`mt-1 border-gray-300 ${colors.focus}`}
                        placeholder="8.25"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceFee" className="text-sm font-medium text-gray-700">
                        Service Fee
                      </Label>
                      <Input
                        id="serviceFee"
                        name="serviceFee"
                        type="number"
                        value={formState.serviceFee}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className={`mt-1 border-gray-300 ${colors.focus}`}
                        placeholder="2.50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cancellationHours" className="text-sm font-medium text-gray-700">
                        Cancellation Hours
                      </Label>
                      <Input
                        id="cancellationHours"
                        name="cancellationHours"
                        type="number"
                        value={formState.cancellationHours}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        className={`mt-1 border-gray-300 ${colors.focus}`}
                        placeholder="24"
                      />
                    </div>
                  </div>
                </div>
              )}

              {businessType === "restaurant" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxPartySize" className="text-sm font-medium text-gray-700">
                      Max Party Size
                    </Label>
                    <Input
                      id="maxPartySize"
                      name="maxPartySize"
                      type="number"
                      value={formState.maxPartySize}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reservationWindow" className="text-sm font-medium text-gray-700">
                      Reservation Window (days)
                    </Label>
                    <Input
                      id="reservationWindow"
                      name="reservationWindow"
                      type="number"
                      value={formState.reservationWindow}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="30"
                    />
                  </div>
                </div>
              )}

              {businessType === "salon" && (
                <div>
                  <Label htmlFor="specialties" className="text-sm font-medium text-gray-700">
                    Specialties (comma separated)
                  </Label>
                  <Input
                    id="specialties"
                    name="specialties"
                    type="text"
                    value={formState.specialties}
                    onChange={handleChange}
                    placeholder="e.g. Haircut, Massage, Facial"
                    className={`mt-1 border-gray-300 ${colors.focus}`}
                  />
                </div>
              )}

              <div className="pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={submitting || !userId}
                  className={`w-full ${colors.button} text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </div>
                  ) : (
                    `Submit ${businessType.charAt(0).toUpperCase() + businessType.slice(1)} Information`
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">Your information will be reviewed by our team before activation</p>
        </div>
      </div>
    </div>
  )
}
