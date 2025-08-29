"use client"

import { useState, useEffect } from "react"
import { gql, useQuery, useMutation } from "@apollo/client"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { uploadImage, deleteImage } from "@/app/lib/firebase"
// Toast helper to provide user feedback for success and error operations.  Using
// react-toastify here ensures consistent notifications across modules.
import { toast } from "react-toastify"

// Translation hook for localised text
import useTranslation from "@/hooks/useTranslation"

interface Table {
  id: string
  number: number
  capacity: number
  location: string
  status: string
  features: string[]
  /**
   * Array of image URLs associated with the room.  Used to display
   * photos of the room in the dashboard and public website.  Each
   * string is a Firebase storage URL.
   */
  images: string[]
}

/**
 * Salon room management.  Rooms are implemented using the same Table
 * model as restaurants.  Each room has a number (generated
 * sequentially), a capacity and a list of equipment stored in the
 * features array.  The location field is used to store the room
 * name, e.g. "Room 1".
 */
export default function SalonRooms() {
  // Access translation function
  const { t } = useTranslation()
  // state for session and rooms
  const [salonId, setSalonId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Table | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    capacity: number
    equipment: string
    images: string[]
  }>({
    name: "",
    capacity: 1,
    equipment: "",
    images: [],
  })

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

  // GraphQL operations
  const GET_TABLES = gql`
    query GetTables($restaurantId: ID!) {
      tables(restaurantId: $restaurantId) {
        id
        number
        capacity
        location
        status
        features
        images
      }
    }
  `
  const CREATE_TABLE = gql`
    mutation CreateTable($input: TableInput!) {
      createTable(input: $input) {
        id
      }
    }
  `
  const UPDATE_TABLE = gql`
    mutation UpdateTable($id: ID!, $input: TableInput!) {
      updateTable(id: $id, input: $input) {
        id
      }
    }
  `
  const DELETE_TABLE = gql`
    mutation DeleteTable($id: ID!) {
      deleteTable(id: $id)
    }
  `

  const { data, loading, error, refetch } = useQuery(GET_TABLES, {
    variables: { restaurantId: salonId },
    skip: !salonId,
  })
  const [createTable] = useMutation(CREATE_TABLE, {
    onCompleted: () => refetch(),
  })
  const [updateTable] = useMutation(UPDATE_TABLE, {
    onCompleted: () => refetch(),
  })
  const [deleteTable] = useMutation(DELETE_TABLE, {
    onCompleted: () => refetch(),
  })

  // Track image upload progress
  const [uploading, setUploading] = useState(false)

  /**
   * Upload selected image files to Firebase and append the resulting URLs
   * to the form state.  Files are stored in the `rooms` folder within
   * the Cloud Storage bucket to organise salon room photos separately.
   */
  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const url = await uploadImage(file, "rooms")
        urls.push(url)
      }
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...urls],
      }))
      // Show a success toast to indicate images were uploaded
      toast.success(t('imagesUploadedSuccessfully') || 'Images uploaded successfully')
    } catch (err) {
      console.error(err)
      // Notify the user when image upload fails
      toast.error(t('failedToUploadImages') || "Failed to upload images")
    } finally {
      setUploading(false)
    }
  }

  /**
   * Remove an image from both Firebase storage and the local form state.
   * Prompt the user for confirmation before deletion.
   */
  const handleDeleteImage = async (url: string) => {
    if (!confirm(t("removeImagePrompt"))) return
    try {
      await deleteImage(url)
      setFormData((prev) => ({
        ...prev,
        images: (prev.images || []).filter((img) => img !== url),
      }))
      // Show a success toast after image deletion
      toast.success(t('imageDeletedSuccessfully') || 'Image deleted successfully')
    } catch (err) {
      console.error(err)
      // Provide an error toast on failure
      toast.error(t('failedToDeleteImage') || "Failed to delete image")
    }
  }

  const rooms: Table[] = data?.tables ?? []

  const openModal = (room?: Table) => {
    if (room) {
      // editing existing room
      setEditingRoom(room)
      setFormData({
        name: room.location,
        capacity: room.capacity,
        equipment: room.features.join(", "),
        images: room.images || [],
      })
    } else {
      setEditingRoom(null)
      setFormData({ name: "", capacity: 1, equipment: "", images: [] })
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!salonId) return
    const features = formData.equipment
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    const input: any = {
      restaurantId: salonId,
      number: editingRoom ? editingRoom.number : rooms.length + 1,
      capacity: formData.capacity,
      location: formData.name,
      status: "available",
      features,
      images: formData.images || [],
    }
    try {
      if (editingRoom) {
        await updateTable({ variables: { id: editingRoom.id, input } })
        // Display a toast on successful update
        toast.success(t('roomUpdatedSuccessfully') || 'Room updated successfully')
      } else {
        await createTable({ variables: { input } })
        toast.success(t('roomCreatedSuccessfully') || 'Room created successfully')
      }
      setShowModal(false)
    } catch (err) {
      console.error(err)
      // Use an error toast for save failures
      toast.error(t('failedToSaveRoom') || "Failed to save room")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteRoomPrompt"))) return
    try {
      await deleteTable({ variables: { id } })
      // Success toast after deletion
      toast.success(t('roomDeletedSuccessfully') || 'Room deleted successfully')
    } catch (err) {
      console.error(err)
      // Error toast when deletion fails
      toast.error(t('failedToDeleteRoom') || "Failed to delete room")
    }
  }

  if (sessionLoading) return <div className="p-6 text-gray-600">{t("loadingRooms")}</div>
  if (sessionError) {
    // Show translated message when the user is not associated with a salon
    return (
      <div className="text-red-500">
        {sessionError.includes('not associated') ? t('notAssociatedWithSalon') : t('failedToLoadSession')}
      </div>
    )
  }
  if (loading) return <div className="p-6 text-gray-600">{t("loadingRooms")}</div>
  if (error) return <div className="text-red-500">{t("errorLoadingRooms")}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("roomManagementTitle")}</h1>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
        >
          <Plus className="h-5 w-5 mr-2" /> {t("addRoomButton")}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("roomName")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("capacityColumn")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("equipmentColumn")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("imagesColumn")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("actionsLabel")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {room.location || `${t("roomName")} ${room.number}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.capacity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {room.features.join(", ") || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    {room.images && room.images.length > 0 ? (
                      room.images.slice(0, 3).map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Room image ${index + 1}`}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ))
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-3">
                  <button
                    onClick={() => openModal(room)}
                    className="text-pink-600 hover:text-pink-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRoom ? t("editRoom") : t("addRoomModal")}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("roomName")}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("capacityColumn")}</label>
                <input
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("equipmentCommaSeparated")}</label>
                <input
                  type="text"
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              {/* Images uploader and preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("imagesColumn")}</label>
                {/* Preview existing images */}
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {formData.images.map((img) => (
                      <div key={img} className="relative">
                        <img
                          src={img}
                          alt="Room image"
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
                <ImageUpload onUpload={handleImageUpload} uploading={uploading} multiple />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                {t("cancelButton")}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                {t("saveButtonLabel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}