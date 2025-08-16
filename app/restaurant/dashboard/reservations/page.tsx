"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { gql, useQuery, useMutation } from "@apollo/client"
import { Search, Filter, Calendar, Clock, Phone, Mail, Plus, Edit, Trash2, X, Users } from "lucide-react"

import useTranslation from "@/hooks/useTranslation";

interface Reservation {
  id: string
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  date: string
  time?: string
  partySize?: number
  // tableId returns a Table object in the GraphQL schema, so we model it as
  // an object with id/number/capacity.  It may be null if no table is assigned.
  tableId?: {
    id: string
    number?: number
    capacity?: number
  } | null
  status: string
  notes?: string
  specialRequests?: string
  createdAt: string
}

interface TableOption {
  id: string
  number: number
  capacity: number
}

export default function RestaurantReservations() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("today")
  const [showModal, setShowModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)

  // Session state to derive restaurant context
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
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
        if (data.businessType && data.businessType.toLowerCase() === "restaurant" && data.businessId) {
          setRestaurantId(data.businessId)
          setBusinessType(data.businessType.toLowerCase())
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

  // GraphQL operations
  const GET_RESERVATIONS = gql`
    query GetReservations($businessId: ID!, $businessType: String!) {
      reservations(businessId: $businessId, businessType: $businessType) {
        id
        customerInfo {
          name
          email
          phone
        }
        date
        time
        partySize
        tableId {
          id
          number
          capacity
        }
        status
        notes
        specialRequests
        createdAt
      }
    }
  `
  const GET_TABLES = gql`
    query GetTables($restaurantId: ID!) {
      tables(restaurantId: $restaurantId) {
        id
        number
        capacity
      }
    }
  `
  const CREATE_RESERVATION = gql`
    mutation CreateReservation($input: ReservationInput!) {
      createReservation(input: $input) {
        id
      }
    }
  `
  const UPDATE_RESERVATION = gql`
    mutation UpdateReservation($id: ID!, $input: ReservationInput!) {
      updateReservation(id: $id, input: $input) {
        id
      }
    }
  `
  const DELETE_RESERVATION = gql`
    mutation DeleteReservation($id: ID!) {
      deleteReservation(id: $id)
    }
  `

  const { data: reservationsData, loading: reservationsLoading, error: reservationsError, refetch: refetchReservations } = useQuery(
    GET_RESERVATIONS,
    {
      variables: { businessId: restaurantId, businessType },
      skip: !restaurantId || !businessType,
    },
  )

  const { data: tablesData, loading: tablesLoading, error: tablesError } = useQuery(GET_TABLES, {
    variables: { restaurantId },
    skip: !restaurantId,
  })

  const [createReservation] = useMutation(CREATE_RESERVATION)
  const [updateReservation] = useMutation(UPDATE_RESERVATION)
  const [deleteReservation] = useMutation(DELETE_RESERVATION)

  // Local form state for reservation creation/updating
  const [formData, setFormData] = useState<{
    customerName: string
    email: string
    phone: string
    date: string
    time: string
    partySize: number
    tableId: string
    status: string
    notes: string
    specialRequests: string
  }>({
    customerName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    partySize: 2,
    tableId: "",
    status: "pending",
    notes: "",
    specialRequests: "",
  })

  // Derive a filtered list of reservations from the GraphQL data.  We
  // perform client-side filtering based on the search term, status and
  // date filters.  Date comparisons use local timezone.
  const filteredReservations: Reservation[] = useMemo(() => {
    const list: any[] = reservationsData?.reservations || []
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    return list.filter((reservation) => {
      const nameMatch = reservation.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const emailMatch = reservation.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const idMatch = reservation.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSearch = nameMatch || emailMatch || idMatch
      const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
      let matchesDate = true
      if (dateFilter === "today") {
        matchesDate = reservation.date.slice(0, 10) === todayStr
      } else if (dateFilter === "tomorrow") {
        matchesDate = reservation.date.slice(0, 10) === tomorrowStr
      } else if (dateFilter === "week") {
        const resDate = new Date(reservation.date)
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 7)
        matchesDate = resDate >= startOfWeek && resDate < endOfWeek
      }
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [reservationsData, searchTerm, statusFilter, dateFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "seated":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "no-show":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId || !businessType) return
    try {
      if (editingReservation) {
        await updateReservation({
          variables: {
            id: editingReservation.id,
            input: {
              businessId: restaurantId,
              businessType,
              customerInfo: {
                name: formData.customerName,
                email: formData.email,
                phone: formData.phone,
              },
              date: new Date(formData.date).toISOString(),
              time: formData.time,
              partySize: formData.partySize,
              tableId: formData.tableId || null,
              status: formData.status,
              notes: formData.notes,
              specialRequests: formData.specialRequests,
              source: "admin",
            },
          },
        })
      } else {
        await createReservation({
          variables: {
            input: {
              businessId: restaurantId,
              businessType,
              customerInfo: {
                name: formData.customerName,
                email: formData.email,
                phone: formData.phone,
              },
              date: new Date(formData.date).toISOString(),
              time: formData.time,
              partySize: formData.partySize,
              tableId: formData.tableId || null,
              status: formData.status,
              notes: formData.notes,
              specialRequests: formData.specialRequests,
              source: "admin",
            },
          },
        })
      }
      await refetchReservations()
      setShowModal(false)
      setEditingReservation(null)
      resetForm()
    } catch (err) {
      console.error(err)
      alert(t('saveReservationFailed'))
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      partySize: 2,
      tableId: "",
      status: "pending",
      notes: "",
      specialRequests: "",
    })
  }

  const handleEdit = (reservation: any) => {
    setEditingReservation(reservation)
    setFormData({
      customerName: reservation.customerInfo?.name || "",
      email: reservation.customerInfo?.email || "",
      phone: reservation.customerInfo?.phone || "",
      date: reservation.date ? reservation.date.slice(0, 10) : "",
      time: reservation.time || "",
      partySize: reservation.partySize || 2,
      // tableId is an object in GraphQL results; use its id for the form field
      tableId: reservation.tableId?.id || "",
      status: reservation.status || "pending",
      notes: reservation.notes || "",
      specialRequests: reservation.specialRequests || "",
    })
    setShowModal(true)
  }

  const handleDeleteReservation = async (id: string) => {
    // Confirm deletion using translated message
    if (!confirm(t('deleteReservationConfirm'))) return
    try {
      await deleteReservation({ variables: { id } })
      await refetchReservations()
    } catch (err) {
      console.error(err)
      alert(t('deleteReservationFailed'))
    }
  }

  const openCreateModal = () => {
    setEditingReservation(null)
    resetForm()
    setShowModal(true)
  }

  return (
    // Handle loading and error states
    sessionLoading || reservationsLoading || tablesLoading ? (
      <p>{t('loading')}</p>
    ) : sessionError ? (
      <p>{t(sessionError)}</p>
    ) : reservationsError || tablesError ? (
      <p>{t('errorLoadingReservations')}</p>
    ) : (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('reservationsTitle')}</h1>
          <p className="text-gray-600">{t('reservationsSubtitle')}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('newReservation')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{filteredReservations.length}</p>
            <p className="text-sm text-gray-600">{t('totalReservationsCard')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {filteredReservations.filter((r) => r.status === "confirmed").length}
            </p>
            <p className="text-sm text-gray-600">{t('confirmedReservation')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {filteredReservations.filter((r) => r.status === "seated").length}
            </p>
            <p className="text-sm text-gray-600">{t('seatedReservation')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {filteredReservations.reduce((sum, r) => sum + (r.partySize || 0), 0)}
            </p>
            <p className="text-sm text-gray-600">{t('totalGuests')}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchReservationPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">{t('allDates')}</option>
              <option value="today">{t('todayDate')}</option>
              <option value="tomorrow">{t('tomorrowDate')}</option>
              <option value="week">{t('thisWeekDate')}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">{t('allStatusLabel')}</option>
              <option value="pending">{t('pendingReservation')}</option>
              <option value="confirmed">{t('confirmedReservation')}</option>
              <option value="seated">{t('seatedReservation')}</option>
              <option value="completed">{t('completedReservation')}</option>
              <option value="cancelled">{t('cancelledReservation')}</option>
              <option value="no-show">{t('noShowReservation')}</option>
            </select>
            <button className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 mr-2" />
              {t('moreFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reservationColumn')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('customerDetailsColumn')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dateTimeColumn')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('partyTableColumn')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('statusColumnHeader')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((reservation) => {
                // Look up table number by id for display.  tableId is an object with an id field.
                const tableNumber = tablesData?.tables?.find((t: any) => t.id === reservation.tableId?.id)?.number
                return (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{reservation.id}</div>
                        <div className="text-sm text-gray-500">
                          {t('createdAtLabel')} {reservation.createdAt?.slice(0, 10)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{reservation.customerInfo?.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {reservation.customerInfo?.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {reservation.customerInfo?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {reservation.date?.slice(0, 10)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {reservation.time || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {t('partyGuests', { count: reservation.partySize || 0 })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t('tableField')}: {tableNumber ?? reservation.tableId?.number ?? "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          reservation.status,
                        )}`}
                      >
                        {(() => {
                          const statusKeyMap: Record<string, string> = {
                            pending: 'pendingReservation',
                            confirmed: 'confirmedReservation',
                            seated: 'seatedReservation',
                            completed: 'completedReservation',
                            cancelled: 'cancelledReservation',
                            'no-show': 'noShowReservation',
                          }
                          const key = statusKeyMap[reservation.status] || reservation.status
                          return t(key)
                        })()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleEdit(reservation)} className="text-red-600 hover:text-red-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReservation(reservation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingReservation ? t('updateReservation') : t('createReservation')}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('customerNameField')}</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName || ""}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('emailField')}</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('phoneField')}</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('reservationDateField')}</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('reservationTimeField')}</label>
                  <input
                    type="time"
                    required
                    value={formData.time || ""}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('partySizeField')}</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={formData.partySize || 2}
                    onChange={(e) => setFormData({ ...formData, partySize: Number.parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('tableField')}</label>
                  <select
                    value={formData.tableId || ""}
                    onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">{t('noTableOption')}</option>
                    {tablesData?.tables?.map((table: any) => (
                      <option key={table.id} value={table.id}>
                        {t('tableOptionFormat', { number: table.number, capacity: table.capacity })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('reservationStatusField')}</label>
                  <select
                    value={formData.status || "pending"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="pending">{t('pendingReservation')}</option>
                    <option value="confirmed">{t('confirmedReservation')}</option>
                    <option value="seated">{t('seatedReservation')}</option>
                    <option value="completed">{t('completedReservation')}</option>
                    <option value="cancelled">{t('cancelledReservation')}</option>
                    <option value="no-show">{t('noShowReservation')}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('specialRequests')}</label>
                  <textarea
                    value={formData.specialRequests || ""}
                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('notesField')}</label>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t('cancelButton')}
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  {editingReservation ? t('updateReservation') : t('createReservation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    )
  )
}
