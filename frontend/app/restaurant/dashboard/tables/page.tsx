"use client"

import { useState, useEffect } from "react"
import { gql, useQuery, useMutation } from "@apollo/client"
import { Plus, Edit, Trash2, X } from "lucide-react"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { uploadImage } from "@/app/lib/firebase"
import useTranslation from "@/hooks/useTranslation";

interface Table {
  id: string
  number: number
  capacity: number
  status: string
  location: string
  images: string[]
}

const GET_TABLES = gql`
  query GetTables($restaurantId: ID!) {
    tables(restaurantId: $restaurantId) {
      id
      number
      capacity
      status
      location
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

export default function RestaurantTablesPage() {
  const { t } = useTranslation();
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<Partial<Table>>({
    number: 0,
    capacity: 0,
    status: "available",
    location: "Main Dining",
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
        if (data.businessType && data.businessType.toLowerCase() === "restaurant" && data.businessId) {
          setRestaurantId(data.businessId)
        } else {
          setSessionError('notAssociatedWithRestaurant')
        }
      } catch (err) {
        setSessionError('failedToLoadSession')
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  const { data, loading, error, refetch } = useQuery(GET_TABLES, {
    variables: { restaurantId },
    skip: !restaurantId,
  })

  const [createTable] = useMutation(CREATE_TABLE)
  const [updateTable] = useMutation(UPDATE_TABLE)
  const [deleteTable] = useMutation(DELETE_TABLE)

  const handleImageUpload = async (files: File[]) => {
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(uploadImage))
      setFormData({ ...formData, images: [...(formData.images || []), ...urls] })
    } catch (err) {
      console.error(err)
      alert(t('uploadImageFailed'))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId) return

    const input = {
      restaurantId,
      number: Number(formData.number),
      capacity: Number(formData.capacity),
      status: formData.status,
      location: formData.location,
      images: formData.images,
    }

    try {
      if (editingTable) {
        await updateTable({ variables: { id: editingTable.id, input } })
      } else {
        await createTable({ variables: { input } })
      }
      refetch()
      setShowModal(false)
      setEditingTable(null)
      setFormData({ number: 0, capacity: 0, status: "available", location: "Main Dining", images: [] })
    } catch (err) {
      console.error(err)
      alert(t('saveTableFailed'))
    }
  }

  const handleEdit = (table: Table) => {
    setEditingTable(table)
    setFormData({
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      location: table.location,
      images: table.images || [],
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteTableConfirm'))) return
    try {
      await deleteTable({ variables: { id } })
      refetch()
    } catch (err) {
      console.error(err)
      alert(t('deleteTableFailed'))
    }
  }

  if (sessionLoading || loading) return <p>{t('loading')}</p>
  if (sessionError) return <p className="text-red-600">{t(sessionError)}</p>
  if (error) return <p className="text-red-600">{t('errorLoadingTables')}</p>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('tablesManagementTitle')}</h1>
        <button
          onClick={() => {
            setEditingTable(null)
            setFormData({ number: 0, capacity: 0, status: "available", location: "Main Dining", images: [] })
            setShowModal(true)
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2 inline" />
          {t('addTableButton')}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2">{t('numberColumn')}</th>
              <th>{t('capacityColumn')}</th>
              <th>{t('statusColumnHeader')}</th>
              <th>{t('locationColumn')}</th>
              <th>{t('imagesColumn')}</th>
              <th>{t('actionsLabelTables')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.tables.map((table: Table) => (
              <tr key={table.id}>
                <td className="py-2">{table.number}</td>
                <td>{table.capacity}</td>
                <td>{(() => {
                  const statusKeyMap: Record<string, string> = {
                    available: 'availableStatus',
                    occupied: 'occupiedStatus',
                    reserved: 'reservedStatus',
                    cleaning: 'cleaningStatus',
                  }
                    return t(statusKeyMap[table.status] || table.status)
                })()}</td>
                <td>{table.location === 'Main Dining' ? t('mainDiningLocation') : table.location}</td>
                <td>
                  <div className="flex space-x-2">
                    {table.images.map((image, index) => (
                      <img key={index} src={image} alt={`Table ${table.number}`} className="w-10 h-10 object-cover rounded" />
                    ))}
                  </div>
                </td>
                <td>
                  <button onClick={() => handleEdit(table)} className="text-blue-600 hover:underline">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(table.id)} className="text-red-600 hover:underline ml-4">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4">{editingTable ? t('editTable') : t('addNewTable')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">{t('tableNumberField')}</label>
                <input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">{t('capacityField')}</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">{t('statusField')}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="available">{t('availableStatus')}</option>
                  <option value="occupied">{t('occupiedStatus')}</option>
                  <option value="reserved">{t('reservedStatus')}</option>
                  <option value="cleaning">{t('cleaningStatus')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">{t('locationField')}</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">{t('imagesField')}</label>
                <ImageUpload onUpload={handleImageUpload} uploading={uploading} multiple />
                <div className="mt-4 flex flex-wrap gap-4">
                  {formData.images?.map((image, index) => (
                    <div key={index} className="relative">
                      <img src={image} alt="Table image" className="w-24 h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, images: formData.images?.filter((_, i) => i !== index) })}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gray-200">
                  {t('cancelButton')}
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-red-600 text-white">
                  {editingTable ? t('updateTable') : t('createTable')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
