"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Wifi, Car, Coffee, Dumbbell, Waves, Utensils, X } from "lucide-react"

// Apollo Client hooks for fetching and mutating data
import { gql, useQuery, useMutation } from "@apollo/client"

/**
 * GraphQL query to load a single hotel by its identifier.  We request only
 * the fields relevant to this page: services, amenities and policies.  These
 * arrays are stored on the hotel document and can be updated in bulk via
 * the updateHotel mutation.
 */
const GET_HOTEL = gql`
  query GetHotel($id: ID!) {
    hotel(id: $id) {
      id
      services {
        name
        description
        price
        category
        available
      }
      amenities {
        name
        description
        included
        category
        price
      }
      policies {
        title
        description
        category
      }
      roomPaidOptions {
        name
        description
        category
        price
      }
    }
  }
`

/**
 * GraphQL mutation to update a hotel.  The backend accepts a partial
 * `HotelInput` object; here we send only the fields we wish to update.
 */
const UPDATE_HOTEL = gql`
  mutation UpdateHotel($id: ID!, $input: HotelInput!) {
    updateHotel(id: $id, input: $input) {
      id
    }
  }
`

interface Service {
  id: number
  name: string
  description: string
  price: number
  category: string
  available: boolean
  icon: any
}

interface Amenity {
  id: number
  name: string
  included: boolean
  category: string
  price: number

}

interface Policy {
  id: number
  title: string
  description: string
  category: string
}

// Represents a paid room option.  These are add-ons such as petals,
// champagne boxes, etc.  Price is required; description and category are optional.
interface RoomPaidOption {
  id: number
  name: string
  description?: string
  category?: string
  price: number
}

// Helper function to remove __typename from an array of objects
const cleanTypename = (arr: any[]) => arr.map(({ __typename, ...rest }) => rest);

export default function HotelOptions() {
  const [activeTab, setActiveTab] = useState("services")
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<
    "service" | "amenity" | "policy" | "roomPaidOption"
  >("service")

  // Business identifier for the currently logged in hotel.  This is derived
  // from the server session via the /api/session endpoint.  We default to
  // null until the session is loaded.
  const [hotelId, setHotelId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  // Fetch the session on component mount to determine which hotel the user
  // manages.  This uses the same mechanism as the rooms/guests/reservations
  // pages.  If the logged in user is not associated with a hotel the page
  // displays an error.
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          setSessionLoading(false)
          return
        }
        const data = await res.json()
        // Session's businessType is stored in lower case; perform a
        // case‑insensitive comparison to detect hotel accounts.
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setHotelId(data.businessId);
        } else {
          setSessionError("You are not associated with a hotel business.");
        }
      } catch (err) {
        setSessionError("Failed to load session.")
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  // Query the hotel once the hotelId is available.  We skip the query
  // entirely while loading the session or if hotelId is null.
  const {
    data: hotelData,
    loading: hotelLoading,
    error: hotelError,
    refetch: refetchHotel,
  } = useQuery(GET_HOTEL, {
    variables: { id: hotelId },
    skip: !hotelId,
  })

  // Prepare the update mutation.  We use this whenever the user creates,
  // edits or deletes a service, amenity or policy.  After each mutation the
  // hotel is refetched to keep the UI in sync with the backend.
  const [updateHotel] = useMutation(UPDATE_HOTEL)

  // Local state for services, amenities and policies.  These are
  // initialised from the query result when it becomes available.
  const [services, setServices] = useState<Service[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])

  // Local state for paid room options.  These correspond to purchasable
  // add-ons configured by the hotel manager.  Initialised from
  // hotelData.roomPaidOptions when the query resolves.
  const [roomPaidOptions, setRoomPaidOptions] = useState<RoomPaidOption[]>([])

  // When the hotel data is fetched, populate the local state arrays.  We
  // assign a generated id to each item for React list rendering because
  // items in the backend do not have intrinsic identifiers.  The id is
  // derived from the array index.
  useEffect(() => {
    if (hotelData && hotelData.hotel) {
      const h = hotelData.hotel
      setServices(
        (h.services || []).map((service: any, index: number) => ({
          id: index + 1,
          icon: service.category === "Food & Beverage"
            ? "Utensils"
            : service.category === "Transportation"
              ? "Car"
              : service.category === "Wellness"
                ? "Waves"
                : service.category === "Fitness"
                  ? "Dumbbell"
                  : service.category === "Business"
                    ? "Coffee"
                    : service.category === "Technology"
                      ? "Wifi"
                      : "Utensils",
          ...service,
        }))
      )
      setAmenities(
        (h.amenities || []).map((amenity: any, index: number) => ({
          id: index + 1,
          ...amenity,
        }))
      )
      setPolicies(
        (h.policies || []).map((policy: any, index: number) => ({
          id: index + 1,
          ...policy,
        }))
      )

      // Initialise paid room options.  Each option is assigned a unique id
      // based on its index for React list rendering.
      setRoomPaidOptions(
        (h.roomPaidOptions || []).map((opt: any, index: number) => ({
          id: index + 1,
          ...opt,
        }))
      )
    }
  }, [hotelData])


  const IconsStringToComponent = (iconName: string) => {
    switch (iconName) {
      case "Utensils":
        return Utensils
      case "Car":
        return Car
      case "Coffee":
        return Coffee
      case "Dumbbell":
        return Dumbbell
      case "Waves":
        return Waves
      case "Wifi":
        return Wifi
      default:
        return Utensils // Default icon if not found
    }
  }


  // The amenities and policies state is initialised when hotelData changes.

  const [formData, setFormData] = useState<any>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hotelId) return

    // Helper to persist changes to the backend.  We build a new array for
    // each item type and then call updateHotel.  After updating we refetch
    // the hotel to refresh local state.
    const persistChanges = async (
      updatedServices: any[],
      updatedAmenities: any[],
      updatedPolicies: any[],
      updatedRoomPaidOptions: any[]
    ) => {
      try {
        await updateHotel({
          variables: {
            id: hotelId,
            input: {
              services: cleanTypename(
                updatedServices.map(({ id, icon, ...rest }) => rest)
              ),
              amenities: cleanTypename(
                updatedAmenities.map(({ id, ...rest }) => rest)
              ),
              policies: cleanTypename(
                updatedPolicies.map(({ id, ...rest }) => rest)
              ),
              roomPaidOptions: cleanTypename(
                updatedRoomPaidOptions.map(({ id, ...rest }) => rest)
              ),
            },
          },
        })
        await refetchHotel()
      } catch (err) {
        console.error(err)
      }
    }

    if (modalType === "service") {
      let updatedServices: any[]
      if (editingItem) {
        updatedServices = services.map((service) => (service.id === editingItem.id ? { ...service, ...formData } : service))
      } else {
        const newId = services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1
        const newService: Service = {
          id: newId,
          icon: formData.icon || "Utensils",
          name: formData.name,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          available: formData.available,
        }
        updatedServices = [...services, newService]
      }
      setServices(updatedServices)
      await persistChanges(
        updatedServices.map(({ id, icon, ...rest }) => rest),
        amenities.map(({ id, ...rest }) => rest),
        policies.map(({ id, ...rest }) => rest),
        roomPaidOptions.map(({ id, ...rest }) => rest),
      )
    } else if (modalType === "amenity") {
      let updatedAmenities: any[]
      if (editingItem) {
        updatedAmenities = amenities.map((amenity) => (amenity.id === editingItem.id ? { ...amenity, ...formData } : amenity))
      } else {
        const newId = amenities.length > 0 ? Math.max(...amenities.map((a) => a.id)) + 1 : 1
        const newAmenity: Amenity = {
          id: newId,
          name: formData.name,
          description: formData.description,
          included: formData.included ?? true,
          category: formData.category,
          price: formData.price,
        }
        updatedAmenities = [...amenities, newAmenity]
      }
      setAmenities(updatedAmenities)
      await persistChanges(
        services.map(({ id, icon, ...rest }) => rest),
        updatedAmenities.map(({ id, ...rest }) => rest),
        policies.map(({ id, ...rest }) => rest),
        roomPaidOptions.map(({ id, ...rest }) => rest),
      )
    } else if (modalType === "policy") {
      let updatedPolicies: any[]
      if (editingItem) {
        updatedPolicies = policies.map((policy) => (policy.id === editingItem.id ? { ...policy, ...formData } : policy))
      } else {
        const newId = policies.length > 0 ? Math.max(...policies.map((p) => p.id)) + 1 : 1
        const newPolicy: Policy = {
          id: newId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
        }
        updatedPolicies = [...policies, newPolicy]
      }
      setPolicies(updatedPolicies)
      await persistChanges(
        services.map(({ id, icon, ...rest }) => rest),
        amenities.map(({ id, ...rest }) => rest),
        updatedPolicies.map(({ id, ...rest }) => rest),
        roomPaidOptions.map(({ id, ...rest }) => rest),
      )
    } else if (modalType === "roomPaidOption") {
      // Handle creation or editing of a paid room option
      let updatedOptions: any[]
      if (editingItem) {
        updatedOptions = roomPaidOptions.map((opt) =>
          opt.id === editingItem.id ? { ...opt, ...formData } : opt
        )
      } else {
        const newId =
          roomPaidOptions.length > 0
            ? Math.max(...roomPaidOptions.map((o) => o.id)) + 1
            : 1
        const newOption: RoomPaidOption = {
          id: newId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: formData.price,
        }
        updatedOptions = [...roomPaidOptions, newOption]
      }
      setRoomPaidOptions(updatedOptions)
      await persistChanges(
        services.map(({ id, icon, ...rest }) => rest),
        amenities.map(({ id, ...rest }) => rest),
        policies.map(({ id, ...rest }) => rest),
        updatedOptions.map(({ id, ...rest }) => rest),
      )
    }

    setShowModal(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleEdit = (
    item: any,
    type: "service" | "amenity" | "policy" | "roomPaidOption"
  ) => {
    setEditingItem(item)
    setFormData(item)
    setModalType(type)
    setShowModal(true)
  }

  const handleDelete = async (
    id: number,
    type: "service" | "amenity" | "policy" | "roomPaidOption"
  ) => {
    if (!hotelId) return
    if (confirm("Are you sure you want to delete this item?")) {
      let updatedServices = services
      let updatedAmenities = amenities
      let updatedPolicies = policies
      let updatedOptions = roomPaidOptions
      if (type === "service") {
        updatedServices = services.filter((service) => service.id !== id)
        setServices(updatedServices)
      } else if (type === "amenity") {
        updatedAmenities = amenities.filter((amenity) => amenity.id !== id)
        setAmenities(updatedAmenities)
      } else if (type === "policy") {
        updatedPolicies = policies.filter((policy) => policy.id !== id)
        setPolicies(updatedPolicies)
      } else if (type === "roomPaidOption") {
        updatedOptions = roomPaidOptions.filter((opt) => opt.id !== id)
        setRoomPaidOptions(updatedOptions)
      }
      try {
        await updateHotel({
          variables: {
            id: hotelId,
            input: {
              services: cleanTypename(
                updatedServices.map(({ id, icon, ...rest }) => rest)
              ),
              amenities: cleanTypename(
                updatedAmenities.map(({ id, ...rest }) => rest)
              ),
              policies: cleanTypename(
                updatedPolicies.map(({ id, ...rest }) => rest)
              ),
              roomPaidOptions: cleanTypename(
                updatedOptions.map(({ id, ...rest }) => rest)
              ),
            },
          },
        })
        await refetchHotel()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const openCreateModal = (
    type: "service" | "amenity" | "policy" | "roomPaidOption"
  ) => {
    setEditingItem(null)
    setModalType(type)
    setFormData({})
    setShowModal(true)
  }

  // Display loading and error states.  We wait for the session and hotel
  // queries before rendering the page.  If the user is not associated with a
  // hotel we show an error.  If GraphQL returns an error we also display it.
  if (sessionLoading || hotelLoading) {
    return <div className="p-6">Loading...</div>
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>
  }
  if (hotelError) {
    return <div className="p-6 text-red-600">Failed to load hotel data.</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Services & Options</h1>
          <p className="text-gray-600">
            Manage services, amenities, policies and paid room options
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "services", label: "Services" },
              { id: "amenities", label: "Amenities" },
              { id: "policies", label: "Policies" },
              { id: "roomPaidOptions", label: "Paid Room Options" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Hotel Services</h2>
                <button
                  onClick={() => openCreateModal("service")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => {
                  const Icon = IconsStringToComponent(service.icon);

                  return (
                    <div
                      key={service.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-500">{service.category}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(service, "service")}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id, "service")}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{service.description}</p>

                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            {service.price === 0 ? "Free" : `$${service.price}`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${service.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                          >
                            {service.available ? "Available" : "Unavailable"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Amenities Tab */}
          {activeTab === "amenities" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Room Amenities</h2>
                <button
                  onClick={() => openCreateModal("amenity")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Amenity
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{amenity.name}</h3>
                        <p className="text-sm text-gray-500">{amenity.category}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(amenity, "amenity")}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(amenity.id, "amenity")}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${amenity.included
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                            }`}
                        >
                          {amenity.included ? "Included" : "Premium"}
                        </span>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          {amenity.price === 0 ? "Free" : `$${amenity.price}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === "policies" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Hotel Policies</h2>
                <button
                  onClick={() => openCreateModal("policy")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </button>
              </div>

              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{policy.title}</h3>
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded mt-1">
                          {policy.category}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(policy, "policy")}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.id, "policy")}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600">{policy.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paid Room Options Tab */}
          {activeTab === "roomPaidOptions" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Paid Room Options</h2>
                <button
                  onClick={() => openCreateModal("roomPaidOption")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomPaidOptions.map((option) => (
                  <div
                    key={option.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{option.name}</h3>
                      {option.category && (
                        <p className="text-sm text-gray-500">{option.category}</p>
                      )}
                      {option.description && (
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      )}
                      <p className="mt-2 text-lg font-bold text-gray-900">
                        {option.price === 0 ? "Free" : `$${option.price}`}
                      </p>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => handleEdit(option, "roomPaidOption")}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(option.id, "roomPaidOption")}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {roomPaidOptions.length === 0 && (
                  <p className="text-gray-500">No paid room options configured.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? `Edit ${modalType}` : `Create New ${modalType}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === "service" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category || ""}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.price || 0}
                        onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Available</label>
                      <select
                        value={formData.available ? "true" : "false"}
                        onChange={(e) => setFormData({ ...formData, available: e.target.value === "true" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="true">Available</option>
                        <option value="false">Unavailable</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      required
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {modalType === "amenity" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amenity Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={formData.category || ""}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.price || 0}
                      onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.included ? "included" : "premium"}
                      onChange={(e) => setFormData({ ...formData, included: e.target.value === "included" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="included">Included</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                </div>
              )}

              {modalType === "policy" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Policy Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ""}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category || ""}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      required
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editingItem ? "Update" : "Create"} {modalType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

              {modalType === "roomPaidOption" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.price ?? 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: Number.parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
    </div>
  )
}
