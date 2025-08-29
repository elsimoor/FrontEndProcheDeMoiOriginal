"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
// Import a specific set of icons for UI controls.  For the service icon
// selection we import the entire Lucide icon library to allow users
// to choose from any available icon.  The named imports (Plus, Edit,
// Trash2, X) are retained for other UI elements.
import * as LucideIcons from "lucide-react"
import { Plus, Edit, Trash2, X } from "lucide-react"

// Import translation hook
import useTranslation from "@/hooks/useTranslation"
// Import the react-toastify shim.  This exposes a global `toast` function
// and no-op `ToastContainer` for compatibility with the react-toastify API.
// Import toast from react-toastify.  The shim implementation wraps our
// internal useToast hook to display notifications.
import { toast } from "react-toastify"

// Apollo Client hooks for fetching and mutating data
import { gql, useQuery, useMutation } from "@apollo/client"
// Import helpers to format monetary amounts according to the selected currency
import { formatCurrency, currencySymbols } from "@/lib/currency"

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
      # View options that can be selected when booking a room.  Each
      # entry defines a type of view with a name and optional
      # description, category and price.
      roomViewOptions {
        name
        description
        category
        price
      }
      # Include hotel settings so we can access the selected currency
      settings {
        currency
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

// Represents a view option that can be selected when booking.  Each view
// has a name and may include a description, category and price.  The
// price is optional and defaults to 0 when not provided.
interface RoomViewOption {
  id: number
  name: string
  description?: string
  category?: string
  price?: number
}

// Helper function to remove __typename from an array of objects
const cleanTypename = (arr: any[]) => arr.map(({ __typename, ...rest }) => rest);

export default function HotelOptions() {
  // Translation hook
  const { t } = useTranslation();
  // Toast for loading feedback
  const [activeTab, setActiveTab] = useState("services")
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [modalType, setModalType] = useState<
    "service" | "amenity" | "policy" | "roomPaidOption" | "roomViewOption"
  >("service")

  // Build a list of icon names from the Lucide icon library.  We include
  // every exported component whose name starts with an uppercase letter.
  // Sorting the list ensures icons are grouped alphabetically.  This
  // computation is memoised so it only runs once.  We intentionally
  // avoid slicing here so that all icons are available; a search input
  // below filters the list for usability.
  const iconOptions: string[] = useMemo(() => {
    return Object.keys(LucideIcons)
      .filter((name) => /^[A-Z]/.test(name))
      .sort()
  }, [])

  // Search term for filtering icons.  When the user types in the
  // search input, we update this state.  Filtering is case‑insensitive.
  const [iconSearch, setIconSearch] = useState("")

  // Filter the list of icons according to the search term.  When no
  // search term is provided we return a subset of the full list to
  // improve performance.  Otherwise we include all matches.  The
  // filtering is memoised to avoid recomputing on every render.
  const filteredIconOptions = useMemo(() => {
    const term = iconSearch.toLowerCase()
    // When search is empty show the first 200 icons to keep the
    // dropdown manageable.  Otherwise return all matches to the
    // search term.
    const candidates = iconOptions.filter((name) =>
      name.toLowerCase().includes(term),
    )
    return term === "" ? candidates.slice(0, 200) : candidates
  }, [iconOptions, iconSearch])

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
          setSessionError(t("notAssociatedWithHotel"));
        }
      } catch (err) {
        setSessionError(t("failedToLoadSession"))
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

  // Display a loading toast when data is being fetched.  We monitor the
  // session and hotel queries; when either is loading we show a
  // brief toast to inform the user that data is loading.  The toast
  // automatically disappears after a short duration.  Because the
  // global toast limit is 1, only the most recent loading toast
  // will appear.  Note: this useEffect must be defined after
  // hotelLoading is declared to avoid referencing it before
  // initialization.
  useEffect(() => {
    if (sessionLoading || hotelLoading) {
      toast.info({
        title: 'Loading...',
        description: 'Please wait while we load your data.',
        duration: 3000,
      })
    }
  }, [sessionLoading, hotelLoading])

  // Determine the hotel's currency from settings.  Default to USD when
  // not available.  We compute a symbol for the currency using the
  // currencySymbols map; if no symbol exists we fall back to the
  // currency code itself.  These values are used throughout the
  // component to format prices and display appropriate labels.
  const currency: string = hotelData?.hotel?.settings?.currency || "USD"
  const currencySymbol: string = currencySymbols[currency] ?? currency

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

  // Local state for room view options.  These correspond to types of
  // views (e.g. City View, Garden View) that guests can select when
  // booking a room.  Initialised from hotelData.roomViewOptions when
  // the query resolves.
  const [roomViewOptions, setRoomViewOptions] = useState<RoomViewOption[]>([])

  // When the hotel data is fetched, populate the local state arrays.  We
  // assign a generated id to each item for React list rendering because
  // items in the backend do not have intrinsic identifiers.  The id is
  // derived from the array index.
  useEffect(() => {
    if (hotelData && hotelData.hotel) {
      const h = hotelData.hotel

      // Helper to derive a default icon from a service category.  If the
      // category does not match any known values we default to "Utensils".
      const getDefaultIcon = (category: string | undefined) => {
        switch (category) {
          case "Food & Beverage":
            return "Utensils"
          case "Transportation":
            return "Car"
          case "Wellness":
            return "Waves"
          case "Fitness":
            return "Dumbbell"
          case "Business":
            return "Coffee"
          case "Technology":
            return "Wifi"
          default:
            return "Utensils"
        }
      }

      // When rebuilding the services array from the fetched data, try to
      // preserve the icon chosen by the user during this session.  We
      // match on basic fields (name, description, category, price and
      // availability) to find a corresponding entry in the previous
      // services state.  If a match is found we reuse its icon; otherwise
      // we fall back to a default icon based on category.
      setServices((prevServices) => {
        return (h.services || []).map((service: any, index: number) => {
          // Determine the hotel key to use when retrieving persisted icons.
          // Prefer the current hotelId state if available; otherwise fall back
          // to the id from the fetched hotel data.  This ensures saved
          // icons can be loaded even if the hotelId state has not yet been
          // initialised when this effect runs.
          const hotelKey = hotelId || h.id
          let savedIcon: string | null = null
          try {
            if (hotelKey) {
              savedIcon = localStorage.getItem(`hotel-service-icon-${hotelKey}-${service.name}`)
            }
          } catch (e) {
            // Accessing localStorage may throw in rare cases (e.g. disabled),
            // but we silently ignore and fall back to defaults.
          }
          const existing = prevServices.find(
            (s) =>
              s.name === service.name &&
              s.description === service.description &&
              s.category === service.category &&
              s.price === service.price &&
              s.available === service.available
          )
          // Determine the icon in order of precedence:
          // 1) savedIcon from localStorage if available
          // 2) existing icon from previous state if matched
          // 3) a default icon based on category
          const icon = savedIcon || existing?.icon || getDefaultIcon(service.category)
          return {
            id: index + 1,
            icon,
            ...service,
          }
        })
      })

      setAmenities((h.amenities || []).map((amenity: any, index: number) => ({
        id: index + 1,
        ...amenity,
      })))
      setPolicies((h.policies || []).map((policy: any, index: number) => ({
        id: index + 1,
        ...policy,
      })))

      // Initialise paid room options.  Each option is assigned a unique id
      // based on its index for React list rendering.
      setRoomPaidOptions(
        (h.roomPaidOptions || []).map((opt: any, index: number) => ({
          id: index + 1,
          ...opt,
        }))
      )

      // Initialise room view options.  Each view is assigned a unique id
      // based on its index for React list rendering.
      setRoomViewOptions(
        (h.roomViewOptions || []).map((opt: any, index: number) => ({
          id: index + 1,
          ...opt,
        }))
      )
    }
  }, [hotelData])


  const IconsStringToComponent = (iconName: string) => {
    // Dynamically resolve the requested icon from the Lucide icon library.
    // If the icon name does not exist we fall back to the Utensils icon.
    const Icon = (LucideIcons as any)[iconName]
    return Icon || (LucideIcons as any).Utensils
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
      updatedRoomPaidOptions: any[],
      updatedRoomViewOptions: any[]
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
              roomViewOptions: cleanTypename(
                updatedRoomViewOptions.map(({ id, ...rest }) => rest)
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
      // Persist the chosen icon in localStorage.  Compute keys using the
      // current hotelId and service names.  When editing we remove the
      // old key if the name has changed.  We wrap calls in try/catch to
      // guard against unavailable localStorage (e.g. SSR or disabled storage).
      if (editingItem) {
        updatedServices = services.map((service) =>
          service.id === editingItem.id ? { ...service, ...formData } : service
        )
        try {
          if (hotelId) {
            // If the service name was changed, remove the old persisted key
            if (editingItem.name && editingItem.name !== formData.name) {
              localStorage.removeItem(
                `hotel-service-icon-${hotelId}-${editingItem.name}`
              )
            }
            // Save the new icon under the new name
            localStorage.setItem(
              `hotel-service-icon-${hotelId}-${formData.name}`,
              formData.icon || "Utensils"
            )
          }
        } catch (e) {
          // ignore localStorage errors
        }
      } else {
        const newId =
          services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1
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
        try {
          if (hotelId) {
            localStorage.setItem(
              `hotel-service-icon-${hotelId}-${newService.name}`,
              newService.icon
            )
          }
        } catch (e) {
          // ignore localStorage errors
        }
      }
      setServices(updatedServices)
      await persistChanges(
        updatedServices.map(({ id, icon, ...rest }) => rest),
        amenities.map(({ id, ...rest }) => rest),
        policies.map(({ id, ...rest }) => rest),
        roomPaidOptions.map(({ id, ...rest }) => rest),
        roomViewOptions.map(({ id, ...rest }) => rest)
      )
      // Notify user of successful service creation or update
      toast.success(
        editingItem
          ? t("serviceUpdatedSuccessfully") || "Service updated successfully"
          : t("serviceCreatedSuccessfully") || "Service created successfully"
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
        roomViewOptions.map(({ id, ...rest }) => rest),
      )
      // Notify user of successful amenity creation or update
      toast.success(
        editingItem
          ? t("amenityUpdatedSuccessfully") || "Amenity updated successfully"
          : t("amenityCreatedSuccessfully") || "Amenity created successfully"
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
        roomViewOptions.map(({ id, ...rest }) => rest),
      )
      // Notify user of successful policy creation or update
      toast.success(
        editingItem
          ? t("policyUpdatedSuccessfully") || "Policy updated successfully"
          : t("policyCreatedSuccessfully") || "Policy created successfully"
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
        roomViewOptions.map(({ id, ...rest }) => rest),
      )
      // Notify user of successful paid option creation or update
      toast.success(
        editingItem
          ? t("paidOptionUpdatedSuccessfully") || "Paid option updated successfully"
          : t("paidOptionCreatedSuccessfully") || "Paid option created successfully"
      )
    } else if (modalType === "roomViewOption") {
      // Handle creation or editing of a room view option
      let updatedViews: any[]
      if (editingItem) {
        updatedViews = roomViewOptions.map((opt) =>
          opt.id === editingItem.id ? { ...opt, ...formData } : opt
        )
      } else {
        const newId =
          roomViewOptions.length > 0
            ? Math.max(...roomViewOptions.map((o) => o.id)) + 1
            : 1
        const newView: RoomViewOption = {
          id: newId,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          // Price is optional for view options; default to undefined if empty or zero
          price: formData.price === undefined || formData.price === null || formData.price === "" ? undefined : formData.price,
        }
        updatedViews = [...roomViewOptions, newView]
      }
      setRoomViewOptions(updatedViews)
      await persistChanges(
        services.map(({ id, icon, ...rest }) => rest),
        amenities.map(({ id, ...rest }) => rest),
        policies.map(({ id, ...rest }) => rest),
        roomPaidOptions.map(({ id, ...rest }) => rest),
        updatedViews.map(({ id, ...rest }) => rest),
      )
      // Notify user of successful view option creation or update
      toast.success(
        editingItem
          ? t("viewOptionUpdatedSuccessfully") || "View option updated successfully"
          : t("viewOptionCreatedSuccessfully") || "View option created successfully"
      )
    }

    setShowModal(false)
    setEditingItem(null)
    setFormData({})
  }

  const handleEdit = (
    item: any,
    type: "service" | "amenity" | "policy" | "roomPaidOption" | "roomViewOption"
  ) => {
    setEditingItem(item)
    setFormData(item)
    setModalType(type)
    setShowModal(true)
  }

  const handleDelete = async (
    id: number,
    type: "service" | "amenity" | "policy" | "roomPaidOption" | "roomViewOption"
  ) => {
    if (!hotelId) return
    if (confirm(t("deleteItemConfirm"))) {
      let updatedServices = services
      let updatedAmenities = amenities
      let updatedPolicies = policies
      let updatedPaidOptions = roomPaidOptions
      let updatedViewOptions = roomViewOptions
    if (type === "service") {
        // Find the service to delete so we can remove its persisted icon
        const svc = services.find((service) => service.id === id)
        updatedServices = services.filter((service) => service.id !== id)
        setServices(updatedServices)
        try {
          if (hotelId && svc?.name) {
            localStorage.removeItem(`hotel-service-icon-${hotelId}-${svc.name}`)
          }
        } catch (e) {
          // ignore localStorage errors
        }
      } else if (type === "amenity") {
        updatedAmenities = amenities.filter((amenity) => amenity.id !== id)
        setAmenities(updatedAmenities)
      } else if (type === "policy") {
        updatedPolicies = policies.filter((policy) => policy.id !== id)
        setPolicies(updatedPolicies)
      } else if (type === "roomPaidOption") {
        updatedPaidOptions = roomPaidOptions.filter((opt) => opt.id !== id)
        setRoomPaidOptions(updatedPaidOptions)
      } else if (type === "roomViewOption") {
        updatedViewOptions = roomViewOptions.filter((opt) => opt.id !== id)
        setRoomViewOptions(updatedViewOptions)
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
                updatedPaidOptions.map(({ id, ...rest }) => rest)
              ),
              roomViewOptions: cleanTypename(
                updatedViewOptions.map(({ id, ...rest }) => rest)
              ),
            },
          },
        })
        await refetchHotel()
        // Notify user that the item was deleted
        toast.success(t("itemDeletedSuccessfully") || "Item deleted successfully")
      } catch (err) {
        console.error(err)
      }
    }
  }

  const openCreateModal = (
    type: "service" | "amenity" | "policy" | "roomPaidOption" | "roomViewOption"
  ) => {
    setEditingItem(null)
    setModalType(type)
    // Initialise form data.  When creating a service we prefill the icon
    // field with a default value so the user can choose a different icon.
    if (type === "service") {
      setFormData({ name: "", category: "", price: 0, available: true, description: "", icon: "Utensils" })
    } else if (type === "amenity") {
      setFormData({ name: "", category: "", price: 0, included: true, description: "" })
    } else if (type === "policy") {
      setFormData({ title: "", category: "", description: "" })
    } else if (type === "roomPaidOption") {
      setFormData({ name: "", category: "", price: 0, description: "" })
    } else if (type === "roomViewOption") {
      setFormData({ name: "", category: "", price: undefined, description: "" })
    } else {
      setFormData({})
    }
    setShowModal(true)
  }

  // Display loading and error states.  We wait for the session and hotel
  // queries before rendering the page.  If the user is not associated with a
  // hotel we show an error.  If GraphQL returns an error we also display it.
  if (sessionLoading || hotelLoading) {
    return <div className="p-6">{t("loading")}</div>
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>
  }
  if (hotelError) {
    return <div className="p-6 text-red-600">{t("failedLoadHotelData")}</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("hotelServicesOptionsTitle")}</h1>
          <p className="text-gray-600">
            {t("hotelServicesOptionsSubtitle")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "services", label: t("servicesTab") },
              { id: "amenities", label: t("amenitiesTab") },
              { id: "policies", label: t("policiesTab") },
              { id: "roomPaidOptions", label: t("paidRoomOptionsTab") },
              { id: "roomViewOptions", label: t("viewOptionsTab") },
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
                <h2 className="text-xl font-semibold text-gray-900">{t("hotelServices")}</h2>
                <button
                  onClick={() => openCreateModal("service")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addService")}
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
                            {service.price === 0
                              ? t("free")
                              : formatCurrency(service.price, currency, currency)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${service.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                          >
                            {service.available ? t("availableLabel") : t("unavailableLabel")}
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
                <h2 className="text-xl font-semibold text-gray-900">{t("roomAmenities")}</h2>
                <button
                  onClick={() => openCreateModal("amenity")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addAmenity")}
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
                          {amenity.included ? t("includedLabel") : t("premiumLabel")}
                        </span>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          {amenity.price === 0
                            ? t("free")
                            : formatCurrency(amenity.price, currency, currency)}
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
                <h2 className="text-xl font-semibold text-gray-900">{t("hotelPolicies")}</h2>
                <button
                  onClick={() => openCreateModal("policy")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addPolicy")}
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
                <h2 className="text-xl font-semibold text-gray-900">{t("paidRoomOptions")}</h2>
                <button
                  onClick={() => openCreateModal("roomPaidOption")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addOption")}
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
                        {option.price === 0 ? t("free") : formatCurrency(option.price, currency, currency)}
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
                  <p className="text-gray-500">{t("noPaidRoomOptions")}</p>
                )}
              </div>
            </div>
          )}

        {/* Room View Options Tab */}
        {activeTab === "roomViewOptions" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">{t("roomViewOptions")}</h2>
              <button
                onClick={() => openCreateModal("roomViewOption")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addView")}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomViewOptions.map((option) => (
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
                    {/* Price may be undefined or zero; display Free when zero, otherwise formatted price */}
                    {option.price !== undefined && (
                      <p className="mt-2 text-lg font-bold text-gray-900">
                        {option.price === 0 ? t("free") : formatCurrency(option.price, currency, currency)}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleEdit(option, "roomViewOption")}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(option.id, "roomViewOption")}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {roomViewOptions.length === 0 && (
                <p className="text-gray-500">{t("noViewOptions")}</p>
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
                {editingItem
                  ? `${t("edit")} ${t(modalType as any)}`
                  : `${t("create")} ${t(modalType as any)}`}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("serviceName")}</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("category")}</label>
                      <input
                        type="text"
                        required
                        value={formData.category || ""}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("priceLabelModal")} ({currencySymbol})</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("available")}</label>
                      <select
                        value={formData.available ? "true" : "false"}
                        onChange={(e) => setFormData({ ...formData, available: e.target.value === "true" })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="true">{t("availableLabel")}</option>
                        <option value="false">{t("unavailableLabel")}</option>
                      </select>
                    </div>
                  </div>
                  {/* Icon selection placed outside of the grid to
                      maintain a two‑column layout. */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    {/* Search input for icons.  Allows the user to filter the icon list by name. */}
                    <input
                      type="text"
                      placeholder="Search icons…"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={formData.icon || "Utensils"}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {/* Render a dropdown option for each icon available in the Lucide icon library.  We default
                          the first option to Utensils to provide a sensible starting point. */}
                      {filteredIconOptions.map((iconName) => (
                        <option key={iconName} value={iconName}>
                          {iconName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("description")}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("amenityName")}</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("category")}</label>
                    <input
                      type="text"
                      required
                      value={formData.category || ""}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("priceLabelModal")} ({currencySymbol})</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("typeLabel")}</label>
                    <select
                      value={formData.included ? "included" : "premium"}
                      onChange={(e) => setFormData({ ...formData, included: e.target.value === "included" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="included">{t("included")}</option>
                      <option value="premium">{t("premium")}</option>
                    </select>
                  </div>
                </div>
              )}

              {modalType === "policy" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("policyTitle")}</label>
                      <input
                        type="text"
                        required
                        value={formData.title || ""}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("category")}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("description")}</label>
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

              {/* Fields for paid room options */}
              {modalType === "roomPaidOption" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("optionName")}</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("category")}</label>
                      <input
                        type="text"
                        value={formData.category || ""}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("priceLabelModal")} ({currencySymbol})</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.price ?? 0}
                        onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("description")}</label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Fields for room view options */}
              {modalType === "roomViewOption" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("viewName")}</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("category")}</label>
                      <input
                        type="text"
                        value={formData.category || ""}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("priceLabelModal")} ({currencySymbol})</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.price ?? ""}
                        onChange={(e) => {
                          const value = e.target.value
                          setFormData({ ...formData, price: value === "" ? undefined : Number.parseFloat(value) })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("description")}</label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t("cancelAction")}
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editingItem ? t("update") : t("create")} {t(modalType as any)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
