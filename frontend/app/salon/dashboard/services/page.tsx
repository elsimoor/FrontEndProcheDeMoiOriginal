"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import useTranslation from "@/hooks/useTranslation"
import { gql, useQuery, useMutation } from "@apollo/client"
// Helpers to format prices according to the salon's selected currency
import { formatCurrency, currencySymbols } from "@/lib/currency"
import { Search, Plus, Edit, Trash2, X, Clock, DollarSign, Star, Scissors } from "lucide-react"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { uploadImage, deleteImage } from "@/app/lib/firebase"

interface Service {
  id: string
  name: string
  category: string
  description?: string
  duration?: number
  price: number
  available?: boolean
  popular?: boolean
  /**
   * IDs of staff roles required to perform this service.  For example,
   * ["hairstylist"] or ["masseuse", "assistant"].  Optional.
   */
  staffRequired?: string[]
  /**
   * Array of image URLs associated with this service.  Used for
   * showcasing services on the public website.  Optional.
   */
  images?: string[]
  /**
   * Default staff member assigned when clients do not choose a stylist.
   * This is the staff ID.  Optional.
   */
  defaultEmployee?: string
  /**
   * Default room assigned for the service when clients do not choose a
   * room.  Uses the table model as rooms in the backend.  Optional.
   */
  defaultRoom?: string
  /**
   * Whether clients are allowed to choose their own stylist/room.  If
   * false, the default assignments are used.  Optional.
   */
  allowClientChoose?: boolean
}

/**
 * SalonServices page displays a list of all services offered by the salon
 * and provides CRUD operations via GraphQL.  Services are grouped by
 * category and can be filtered using a search bar.  A modal allows
 * creating and editing services.
 */
export default function SalonServices() {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [salonId, setSalonId] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          setSessionLoading(false)
          return
        }
        const data = await res.json()
        if (data.businessType && data.businessType.toLowerCase() === "salon" && data.businessId) {
          setSalonId(data.businessId)
          setBusinessType(data.businessType.toLowerCase())
        } else {
          setSessionError("You are not associated with a salon business.")
        }
      } catch (err) {
        setSessionError("Failed to load session.")
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  // GraphQL queries and mutations
  const GET_SERVICES = gql`
    query GetServices($businessId: ID!, $businessType: String!) {
      services(businessId: $businessId, businessType: $businessType) {
        id
        name
        description
        category
        duration
        price
        available
        popular
        staffRequired
        images
        defaultEmployee
        defaultRoom
        allowClientChoose
      }
    }
  `

// Query to fetch only the salon's currency setting.  Used to
// dynamically format service prices based on the selected currency.
const GET_SALON_SETTINGS = gql`
  query GetSalonSettings($id: ID!) {
    salon(id: $id) {
      settings {
        currency
      }
    }
  }
`;

  // Fetch staff list for default employee selection.  We re-use the staff query
  // from other pages to populate a dropdown of employees.
  const GET_STAFF = gql`
    query GetStaff($businessId: ID!, $businessType: String!) {
      staff(businessId: $businessId, businessType: $businessType) {
        id
        name
        role
      }
    }
  `
  // Fetch rooms (tables) list for default room selection.  In the backend
  // salon rooms are stored using the table model with restaurantId equal
  // to the salonId, so we query tables by restaurantId.  Only id and
  // location (name) are needed for the dropdown.
  const GET_ROOMS = gql`
    query GetTables($restaurantId: ID!) {
      tables(restaurantId: $restaurantId) {
        id
        location
        capacity
      }
    }
  `
  const CREATE_SERVICE = gql`
    mutation CreateService($input: ServiceInput!) {
      createService(input: $input) {
        id
      }
    }
  `
  const UPDATE_SERVICE = gql`
    mutation UpdateService($id: ID!, $input: ServiceInput!) {
      updateService(id: $id, input: $input) {
        id
      }
    }
  `
  const DELETE_SERVICE = gql`
    mutation DeleteService($id: ID!) {
      deleteService(id: $id)
    }
  `

  const { data: servicesData, loading: servicesLoading, error: servicesError, refetch: refetchServices } = useQuery(GET_SERVICES, {
    variables: { businessId: salonId, businessType },
    skip: !salonId || !businessType,
  })

  // staff query for default employee field
  const { data: staffData } = useQuery(GET_STAFF, {
    variables: { businessId: salonId, businessType },
    skip: !salonId || !businessType,
  })
  const { data: roomsData } = useQuery(GET_ROOMS, {
    variables: { restaurantId: salonId },
    skip: !salonId,
  })
  const [createService] = useMutation(CREATE_SERVICE)
  const [updateService] = useMutation(UPDATE_SERVICE)
  const [deleteService] = useMutation(DELETE_SERVICE)

  const services: Service[] = servicesData?.services ?? []

  // Fetch the salon's currency settings to format service prices.  We
  // skip this query until the salonId is available.
  const { data: settingsData } = useQuery(GET_SALON_SETTINGS, {
    variables: { id: salonId },
    skip: !salonId,
  })

  // Determine the currency and symbol.  Default to USD when the
  // setting is not defined.  Used in price labels and formatting.
  const currency: string = settingsData?.salon?.settings?.currency || 'USD'
  const currencySymbol: string = currencySymbols[currency] ?? currency

  // Compute categories list from services
  const categories = useMemo(() => {
    const map: Record<string, number> = {}
    services.forEach((service) => {
      const cat = service.category || "other"
      map[cat] = (map[cat] || 0) + 1
    })
    const result = Object.entries(map).map(([id, count]) => ({ id, name: id[0].toUpperCase() + id.slice(1), count }))
    // Set default active category if not already set
    if (!activeCategory && result.length > 0) {
      setActiveCategory(result[0].id)
    }
    return result
  }, [services, activeCategory])

  // Form data for create/edit service
  const [formData, setFormData] = useState<Partial<Service>>({
    name: "",
    category: "",
    description: "",
    duration: 60,
    price: 0,
    available: true,
    popular: false,
    staffRequired: [],
    images: [],
    defaultEmployee: "",
    defaultRoom: "",
    allowClientChoose: true,
  })

  // Local state for tracking image uploads
  const [uploading, setUploading] = useState(false)

  /**
   * Upload selected files to Firebase storage.  Uploaded image URLs are
   * appended to the images array in the form state.  We target the
   * `services` folder so that service photos are grouped in the
   * bucket.  If an upload fails an alert is shown and the error is
   * logged.
   */
  const handleUpload = async (files: File[]) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const url = await uploadImage(file, "services")
        urls.push(url)
      }
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...urls],
      }))
    } catch (err) {
      console.error(err)
      alert("Failed to upload images")
    } finally {
      setUploading(false)
    }
  }

  /**
   * Remove an image from both Firebase storage and the local form
   * state.  A confirmation prompt prevents accidental deletion.  On
   * failure an alert is displayed.
   */
  const handleDeleteImage = async (url: string) => {
    if (!confirm("Remove this image?")) return
    try {
      await deleteImage(url)
      setFormData((prev) => ({
        ...prev,
        images: (prev.images || []).filter((img) => img !== url),
      }))
    } catch (err) {
      console.error(err)
      alert("Failed to delete image")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: activeCategory,
      description: "",
      duration: 60,
      price: 0,
      available: true,
      popular: false,
      staffRequired: [],
      images: [],
      defaultEmployee: "",
      defaultRoom: "",
      allowClientChoose: true,
    })
  }

  const openCreateModal = () => {
    setEditingService(null)
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({ ...service })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return
    try {
      await deleteService({ variables: { id } })
      await refetchServices()
    } catch (err) {
      console.error(err)
      alert("Failed to delete service")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!salonId || !businessType) {
      alert("Unable to save service: salon context unavailable.")
      return
    }
    const input = {
      businessId: salonId,
      businessType: "salon",
      name: formData.name || "",
      description: formData.description || "",
      category: formData.category || "other",
      duration: formData.duration || 60,
      price: formData.price || 0,
      available: formData.available !== undefined ? formData.available : true,
      popular: formData.popular !== undefined ? formData.popular : false,
      staffRequired: formData.staffRequired || [],
      requirements: [],
      images: formData.images || [],
      defaultEmployee: formData.defaultEmployee || null,
      defaultRoom: formData.defaultRoom || null,
      allowClientChoose: formData.allowClientChoose ?? true,
    }
    try {
      if (editingService) {
        await updateService({ variables: { id: editingService.id, input } })
      } else {
        await createService({ variables: { input } })
      }
      await refetchServices()
      setShowModal(false)
      setEditingService(null)
      resetForm()
    } catch (err) {
      console.error(err)
      alert("Failed to save service")
    }
  }

  // Filter services by active category and search term
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const inCategory = service.category === activeCategory
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase())
      return inCategory && matchesSearch
    })
  }, [services, activeCategory, searchTerm])

  if (sessionLoading) {
    return <div>{t('loading')}</div>
  }
  if (sessionError) {
    // Display any session error using generic translation if possible
    // If the error message matches known keys, use the translation; otherwise display as is
    const errorMessage = sessionError === "You are not associated with a salon business."
      ? t('notAssociatedWithSalon')
      : sessionError === "Failed to load session."
      ? t('failedToLoadSession')
      : sessionError
    return <div className="text-red-500">{errorMessage}</div>
  }
  if (servicesLoading) {
    return <div>{t('loadingServices')}</div>
  }
  if (servicesError) {
    return <div className="text-red-500">{t('errorLoadingServices')}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('servicesTitleHeading')}</h1>
          <p className="text-gray-600">{t('servicesSubtitle')}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('newServiceButton')}
        </button>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                activeCategory === cat.id ? "bg-pink-600 text-white border-pink-600" : "bg-gray-50 text-gray-700 border-gray-200"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchServices')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col">
            {/* Display the first service image if available */}
            {service.images && service.images.length > 0 && (
              <img
                src={service.images[0]}
                alt={service.name}
                className="h-32 w-full object-cover rounded-t-md mb-3"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                {service.popular && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    {t('popularLabel')}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600">{service.description || t('noDescription')}</p>
              <div className="mt-4 space-y-1 text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-pink-600" />
                  <span>{service.duration || 60} min</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-pink-600" />
                  <span>{formatCurrency(service.price, currency)}</span>
                </div>
                {service.staffRequired && service.staffRequired.length > 0 && (
                  <div className="flex items-center">
                    <Scissors className="h-4 w-4 mr-2 text-pink-600" />
                    <span>{service.staffRequired.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => handleEdit(service)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-1" /> {t('edit')}
              </button>
              <button
                onClick={() => handleDelete(service.id)}
                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" /> {t('delete')}
              </button>
            </div>
          </div>
        ))}
        {filteredServices.length === 0 && <p className="text-gray-500">{t('noServicesFound')}</p>}
      </div>

      {/* Modal for Create/Edit Service */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingService ? t('editService') : t('newService')}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameField')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('categoryField')}</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('descriptionField')}</label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('durationField')}</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration || 60}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{`${t('priceFieldLabel')} (${currencySymbol})`}</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.available !== undefined ? formData.available : true}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t('availableField')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.popular !== undefined ? formData.popular : false}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="mr-2"
                  />
                    <span className="text-sm text-gray-700">{t('popularField')}</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('staffRequired')}</label>
                <input
                  type="text"
                  name="staffRequired"
                  value={formData.staffRequired?.join(", ") || ""}
                  onChange={(e) => setFormData({ ...formData, staffRequired: e.target.value.split(/\s*,\s*/).filter((s) => s) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Default employee selection */}
              {staffData?.staff && staffData.staff.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('defaultEmployee')}</label>
                  <select
                    name="defaultEmployee"
                    value={formData.defaultEmployee || ""}
                    onChange={(e) => setFormData({ ...formData, defaultEmployee: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">{t('none')}</option>
                    {staffData.staff.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.role ? `– ${emp.role}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Default room selection */}
              {roomsData?.tables && roomsData.tables.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('defaultRoom')}</label>
                  <select
                    name="defaultRoom"
                    value={formData.defaultRoom || ""}
                    onChange={(e) => setFormData({ ...formData, defaultRoom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">{t('none')}</option>
                    {roomsData.tables.map((room: any) => (
                      <option key={room.id} value={room.id}>
                        {room.location || room.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Allow client to choose */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.allowClientChoose ?? true}
                  onChange={(e) => setFormData({ ...formData, allowClientChoose: e.target.checked })}
                  className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">{t('allowClientChooseStylistRoom')}</span>
              </div>

              {/* Images uploader */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('imagesField')}</label>
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {(formData.images as string[]).map((img) => (
                      <div key={img} className="relative">
                        <img
                          src={img}
                          alt="Service image"
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img)}
                          className="absolute top-1 right-1 bg-white bg-opacity-75 rounded-full p-1 hover:bg-opacity-100"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <ImageUpload onUpload={handleUpload} uploading={uploading} multiple />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mr-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  {t('cancelButton')}
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700"
                >
                  {editingService ? t('updateButton') : t('createButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}