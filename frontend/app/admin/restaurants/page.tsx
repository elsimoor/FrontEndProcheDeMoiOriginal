"use client"

import { useState } from "react"
import React from "react"
import { gql, useMutation, useQuery } from "@apollo/client"

// GraphQL operations for restaurants
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

const DELETE_RESTAURANT = gql`
  mutation DeleteRestaurantAdmin($id: ID!) {
    deleteRestaurant(id: $id)
  }
`

// Queries and mutation for user assignment
const GET_USERS = gql`
  query GetUsersAdmin {
    users {
      id
      firstName
      lastName
      email
      role
      businessType
      businessId
    }
  }
`

const UPDATE_USER = gql`
  mutation UpdateUserAdmin($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      businessId
      businessType
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
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("")

  // Data hooks
  const {
    data: restaurantsData,
    loading: restaurantsLoading,
    error: restaurantsError,
    refetch: refetchRestaurants,
  } = useQuery(GET_RESTAURANTS)
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery(GET_USERS)
  const [createRestaurant] = useMutation(CREATE_RESTAURANT)
  const [updateRestaurant] = useMutation(UPDATE_RESTAURANT)
  const [deleteRestaurant] = useMutation(DELETE_RESTAURANT)
  const [updateUser] = useMutation(UPDATE_USER)

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
        taxRate: restaurantFormState.taxRate ? parseFloat(restaurantFormState.taxRate) : null,
        serviceFee: restaurantFormState.serviceFee ? parseFloat(restaurantFormState.serviceFee) : null,
        maxPartySize: restaurantFormState.maxPartySize ? parseInt(restaurantFormState.maxPartySize, 10) : null,
        reservationWindow: restaurantFormState.reservationWindow
          ? parseInt(restaurantFormState.reservationWindow, 10)
          : null,
        cancellationHours: restaurantFormState.cancellationHours
          ? parseInt(restaurantFormState.cancellationHours, 10)
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
        await updateRestaurant({ variables: { id: editingRestaurantId, input } })
      } else {
        await createRestaurant({ variables: { input } })
      }
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

  const handleDelete = async (id: string) => {
    if (confirm("Delete this restaurant?")) {
      await deleteRestaurant({ variables: { id } })
      refetchRestaurants()
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedRestaurantId) return
    try {
      await updateUser({
        variables: {
          id: selectedUserId,
          input: { businessType: "restaurant", businessId: selectedRestaurantId },
        },
      })
      alert("User assigned to restaurant successfully")
      setSelectedUserId("")
      setSelectedRestaurantId("")
      refetchUsers()
    } catch (err) {
      console.error(err)
      alert("Failed to assign user to restaurant")
    }
  }

  if (restaurantsLoading) return <p>Loading restaurants...</p>
  if (restaurantsError) return <p>Error loading restaurants.</p>

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-bold">Restaurant Administration</h1>
      {/* List restaurants */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Existing Restaurants</h2>
        {restaurantsData?.restaurants && restaurantsData.restaurants.length > 0 ? (
          <ul className="space-y-2">
            {restaurantsData.restaurants.map((restaurant: any) => (
              <li
                key={restaurant.id}
                className="border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{restaurant.name}</p>
                  <p className="text-sm text-gray-600">{restaurant.description}</p>
                </div>
                <div className="space-x-2">
                  <button
                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
                    onClick={() => handleEdit(restaurant)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-red-500 text-white rounded"
                    onClick={() => handleDelete(restaurant.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No restaurants found.</p>
        )}
      </section>
      {/* Assign restaurant to user */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Assign Restaurant to User</h2>
        {usersError ? (
          <p className="text-red-500">Failed to load users for assignment.</p>
        ) : (
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">User</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    {usersLoading ? "Loading users..." : "Select a user"}
                  </option>
                  {usersData?.users?.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.email} {u.firstName || u.lastName ? `(${u.firstName ?? ''} ${u.lastName ?? ''})` : ''}
                      {u.businessType === 'restaurant' && u.businessId ? ' - assigned' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Restaurant</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedRestaurantId}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a restaurant
                  </option>
                  {restaurantsData?.restaurants?.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded"
              disabled={usersLoading || !selectedUserId || !selectedRestaurantId}
            >
              Assign Restaurant
            </button>
          </form>
        )}
      </section>
      {/* Restaurant form */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">{editingRestaurantId ? 'Edit Restaurant' : 'Create Restaurant'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={restaurantFormState.name}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <input
                type="text"
                value={restaurantFormState.description}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Street</label>
              <input
                type="text"
                value={restaurantFormState.street}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, street: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                type="text"
                value={restaurantFormState.city}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, city: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <input
                type="text"
                value={restaurantFormState.state}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, state: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Zip Code</label>
              <input
                type="text"
                value={restaurantFormState.zipCode}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, zipCode: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Country</label>
              <input
                type="text"
                value={restaurantFormState.country}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, country: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="text"
                value={restaurantFormState.phone}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, phone: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={restaurantFormState.email}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, email: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Website</label>
              <input
                type="text"
                value={restaurantFormState.website}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, website: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Currency</label>
              <input
                type="text"
                value={restaurantFormState.currency}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, currency: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Timezone</label>
              <input
                type="text"
                value={restaurantFormState.timezone}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, timezone: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Tax Rate</label>
              <input
                type="number"
                value={restaurantFormState.taxRate}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, taxRate: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Service Fee</label>
              <input
                type="number"
                value={restaurantFormState.serviceFee}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, serviceFee: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Max Party Size</label>
              <input
                type="number"
                value={restaurantFormState.maxPartySize}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, maxPartySize: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Reservation Window (days)</label>
              <input
                type="number"
                value={restaurantFormState.reservationWindow}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, reservationWindow: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Cancellation Hours</label>
              <input
                type="number"
                value={restaurantFormState.cancellationHours}
                onChange={(e) => setRestaurantFormState({ ...restaurantFormState, cancellationHours: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
            {editingRestaurantId ? 'Update Restaurant' : 'Create Restaurant'}
          </button>
        </form>
      </section>
    </div>
  )
}