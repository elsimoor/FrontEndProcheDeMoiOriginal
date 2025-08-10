"use client"

import { useState } from "react"
import React from "react"
import { gql, useMutation, useQuery } from "@apollo/client"

// GraphQL operations for hotels
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

const DELETE_HOTEL = gql`
  mutation DeleteHotelAdmin($id: ID!) {
    deleteHotel(id: $id)
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
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedHotelId, setSelectedHotelId] = useState<string>("")

  // Data hooks
  const { data, loading, error, refetch } = useQuery(GET_HOTELS)
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery(GET_USERS)
  const [createHotel] = useMutation(CREATE_HOTEL)
  const [updateHotel] = useMutation(UPDATE_HOTEL)
  const [deleteHotel] = useMutation(DELETE_HOTEL)
  const [updateUser] = useMutation(UPDATE_USER)

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
        await updateHotel({ variables: { id: editingId, input } })
      } else {
        await createHotel({ variables: { input } })
      }
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

  const handleDelete = async (id: string) => {
    if (confirm("Delete this hotel?")) {
      await deleteHotel({ variables: { id } })
      refetch()
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedHotelId) return
    try {
      await updateUser({
        variables: {
          id: selectedUserId,
          input: { businessType: "hotel", businessId: selectedHotelId },
        },
      })
      alert("User assigned to hotel successfully")
      setSelectedUserId("")
      setSelectedHotelId("")
      refetchUsers()
    } catch (err) {
      console.error(err)
      alert("Failed to assign user to hotel")
    }
  }

  if (loading) return <p>Loading hotels...</p>
  if (error) return <p>Error loading hotels.</p>

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-bold">Hotel Administration</h1>
      {/* List hotels */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Existing Hotels</h2>
        {data?.hotels && data.hotels.length > 0 ? (
          <ul className="space-y-2">
            {data.hotels.map((hotel: any) => (
              <li
                key={hotel.id}
                className="border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{hotel.name}</p>
                  <p className="text-sm text-gray-600">{hotel.description}</p>
                </div>
                <div className="space-x-2">
                  <button
                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
                    onClick={() => handleEdit(hotel)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-red-500 text-white rounded"
                    onClick={() => handleDelete(hotel.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hotels found.</p>
        )}
      </section>
      {/* Assign hotel to user */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Assign Hotel to User</h2>
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
                      {u.businessType === 'hotel' && u.businessId ? ' - assigned' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Hotel</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedHotelId}
                  onChange={(e) => setSelectedHotelId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a hotel
                  </option>
                  {data?.hotels?.map((h: any) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded"
              disabled={usersLoading || !selectedUserId || !selectedHotelId}
            >
              Assign Hotel
            </button>
          </form>
        )}
      </section>
      {/* Hotel form */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">{editingId ? 'Edit Hotel' : 'Create Hotel'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <input
                type="text"
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Street</label>
              <input
                type="text"
                value={formState.street}
                onChange={(e) => setFormState({ ...formState, street: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                type="text"
                value={formState.city}
                onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <input
                type="text"
                value={formState.state}
                onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Zip Code</label>
              <input
                type="text"
                value={formState.zipCode}
                onChange={(e) => setFormState({ ...formState, zipCode: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Country</label>
              <input
                type="text"
                value={formState.country}
                onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="text"
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Website</label>
              <input
                type="text"
                value={formState.website}
                onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
            {editingId ? 'Update Hotel' : 'Create Hotel'}
          </button>
        </form>
      </section>
    </div>
  )
}