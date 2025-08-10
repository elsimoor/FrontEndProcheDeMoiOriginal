"use client"

import { useState } from "react"
import React from "react"
import { gql, useMutation, useQuery } from "@apollo/client"

// GraphQL operations for salons
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

const DELETE_SALON = gql`
  mutation DeleteSalonAdmin($id: ID!) {
    deleteSalon(id: $id)
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
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedSalonId, setSelectedSalonId] = useState<string>("")

  // Data hooks
  const {
    data: salonsData,
    loading: salonsLoading,
    error: salonsError,
    refetch: refetchSalons,
  } = useQuery(GET_SALONS)
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery(GET_USERS)
  const [createSalon] = useMutation(CREATE_SALON)
  const [updateSalon] = useMutation(UPDATE_SALON)
  const [deleteSalon] = useMutation(DELETE_SALON)
  const [updateUser] = useMutation(UPDATE_USER)

  // Handle create/update submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        taxRate: salonFormState.taxRate ? parseFloat(salonFormState.taxRate) : null,
        serviceFee: salonFormState.serviceFee ? parseFloat(salonFormState.serviceFee) : null,
        cancellationHours: salonFormState.cancellationHours
          ? parseInt(salonFormState.cancellationHours, 10)
          : null,
      },
      businessHours: [],
      specialties: salonFormState.specialties
        ? salonFormState.specialties.split(",").map((s) => s.trim())
        : [],
      policies: [],
      images: [],
    }
    try {
      if (editingSalonId) {
        await updateSalon({ variables: { id: editingSalonId, input } })
      } else {
        await createSalon({ variables: { input } })
      }
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
      setEditingSalonId(null)
      refetchSalons()
    } catch (err) {
      console.error(err)
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

  const handleDelete = async (id: string) => {
    if (confirm("Delete this salon?")) {
      await deleteSalon({ variables: { id } })
      refetchSalons()
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedSalonId) return
    try {
      await updateUser({
        variables: {
          id: selectedUserId,
          input: { businessType: "salon", businessId: selectedSalonId },
        },
      })
      alert("User assigned to salon successfully")
      setSelectedUserId("")
      setSelectedSalonId("")
      refetchUsers()
    } catch (err) {
      console.error(err)
      alert("Failed to assign user to salon")
    }
  }

  if (salonsLoading) return <p>Loading salons...</p>
  if (salonsError) return <p>Error loading salons.</p>

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-bold">Salon Administration</h1>
      {/* List salons */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Existing Salons</h2>
        {salonsData?.salons && salonsData.salons.length > 0 ? (
          <ul className="space-y-2">
            {salonsData.salons.map((salon: any) => (
              <li
                key={salon.id}
                className="border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{salon.name}</p>
                  <p className="text-sm text-gray-600">{salon.description}</p>
                </div>
                <div className="space-x-2">
                  <button
                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
                    onClick={() => handleEdit(salon)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-red-500 text-white rounded"
                    onClick={() => handleDelete(salon.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No salons found.</p>
        )}
      </section>
      {/* Assign salon to user */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Assign Salon to User</h2>
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
                      {u.businessType === 'salon' && u.businessId ? ' - assigned' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Salon</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedSalonId}
                  onChange={(e) => setSelectedSalonId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a salon
                  </option>
                  {salonsData?.salons?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded"
              disabled={usersLoading || !selectedUserId || !selectedSalonId}
            >
              Assign Salon
            </button>
          </form>
        )}
      </section>
      {/* Salon form */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">{editingSalonId ? 'Edit Salon' : 'Create Salon'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={salonFormState.name}
                onChange={(e) => setSalonFormState({ ...salonFormState, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <input
                type="text"
                value={salonFormState.description}
                onChange={(e) => setSalonFormState({ ...salonFormState, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Street</label>
              <input
                type="text"
                value={salonFormState.street}
                onChange={(e) => setSalonFormState({ ...salonFormState, street: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                type="text"
                value={salonFormState.city}
                onChange={(e) => setSalonFormState({ ...salonFormState, city: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <input
                type="text"
                value={salonFormState.state}
                onChange={(e) => setSalonFormState({ ...salonFormState, state: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Zip Code</label>
              <input
                type="text"
                value={salonFormState.zipCode}
                onChange={(e) => setSalonFormState({ ...salonFormState, zipCode: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Country</label>
              <input
                type="text"
                value={salonFormState.country}
                onChange={(e) => setSalonFormState({ ...salonFormState, country: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="text"
                value={salonFormState.phone}
                onChange={(e) => setSalonFormState({ ...salonFormState, phone: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={salonFormState.email}
                onChange={(e) => setSalonFormState({ ...salonFormState, email: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Website</label>
              <input
                type="text"
                value={salonFormState.website}
                onChange={(e) => setSalonFormState({ ...salonFormState, website: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Currency</label>
              <input
                type="text"
                value={salonFormState.currency}
                onChange={(e) => setSalonFormState({ ...salonFormState, currency: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Timezone</label>
              <input
                type="text"
                value={salonFormState.timezone}
                onChange={(e) => setSalonFormState({ ...salonFormState, timezone: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Tax Rate</label>
              <input
                type="number"
                value={salonFormState.taxRate}
                onChange={(e) => setSalonFormState({ ...salonFormState, taxRate: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Service Fee</label>
              <input
                type="number"
                value={salonFormState.serviceFee}
                onChange={(e) => setSalonFormState({ ...salonFormState, serviceFee: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Cancellation Hours</label>
              <input
                type="number"
                value={salonFormState.cancellationHours}
                onChange={(e) => setSalonFormState({ ...salonFormState, cancellationHours: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Specialties (comma separated)</label>
              <input
                type="text"
                value={salonFormState.specialties}
                onChange={(e) => setSalonFormState({ ...salonFormState, specialties: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
            {editingSalonId ? 'Update Salon' : 'Create Salon'}
          </button>
        </form>
      </section>
    </div>
  )
}