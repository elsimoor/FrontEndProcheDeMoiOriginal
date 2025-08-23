"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import useTranslation from "@/hooks/useTranslation"
// Currency helpers for formatting amounts according to the salon's chosen currency
import { formatCurrency, currencySymbols } from "@/lib/currency"
import { gql, useQuery, useMutation } from "@apollo/client"
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Phone,
  Mail,
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
} from "lucide-react"

/**
 * Reservation interface tailored for the salon module.  Each reservation includes
 * customer information, service and staff associations, date/time details,
 * duration, status and payment status, plus additional notes.  The
 * `serviceId` and `staffId` fields are objects returned from GraphQL (not
 * primitive IDs) to avoid Apollo warning about missing subfields.
 */
interface Reservation {
  id: string
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  date: string
  time?: string
  duration?: number | null
  serviceId?: {
    id: string
    name: string
    price: number
    duration: number | null
  } | null
  staffId?: {
    id: string
    name: string
    role: string
  } | null
  status: string
  paymentStatus?: string
  notes?: string
  specialRequests?: string
  createdAt: string
}

interface Service {
  id: string
  name: string
  price: number
  duration: number | null
}

interface StaffMember {
  id: string
  name: string
  role: string
}

export default function SalonBookings() {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("today")
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null)

  // Session state to derive salon context
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
        duration
        serviceId {
          id
          name
          price
          duration
        }
        staffId {
          id
          name
          role
        }
        status
        paymentStatus
        notes
        specialRequests
        createdAt
      }
    }
  `

  const GET_SERVICES = gql`
    query GetServices($businessId: ID!, $businessType: String!) {
      services(businessId: $businessId, businessType: $businessType) {
        id
        name
        price
        duration
      }
    }
  `

  const GET_STAFF = gql`
    query GetStaff($businessId: ID!, $businessType: String!) {
      staff(businessId: $businessId, businessType: $businessType) {
        id
        name
        role
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

  // Query to fetch the salon settings including the selected currency.  The
  // currency determines how we display prices and revenue throughout this
  // page.  Without a settings entry we default to USD.
  const GET_SALON_SETTINGS = gql`
    query GetSalonSettings($id: ID!) {
      salon(id: $id) {
        settings {
          currency
        }
      }
    }
  `

  // Query hooks
  const {
    data: reservationsData,
    loading: reservationsLoading,
    error: reservationsError,
    refetch: refetchReservations,
  } = useQuery(GET_RESERVATIONS, {
    variables: { businessId: salonId, businessType },
    skip: !salonId || !businessType,
  })

  const { data: servicesData, loading: servicesLoading, error: servicesError } = useQuery(GET_SERVICES, {
    variables: { businessId: salonId, businessType },
    skip: !salonId || !businessType,
  })

  const { data: staffData, loading: staffLoading, error: staffError } = useQuery(GET_STAFF, {
    variables: { businessId: salonId, businessType },
    skip: !salonId || !businessType,
  })

  // Fetch the salon settings to determine which currency to use for price
  // display.  We only run this query once a salonId has been set.  If
  // no settings are found, default to USD.
  const { data: salonSettingsData } = useQuery(GET_SALON_SETTINGS, {
    variables: { id: salonId },
    skip: !salonId,
  })
  const currency: string = salonSettingsData?.salon?.settings?.currency || 'USD'
  const currencySymbol: string = currencySymbols[currency] || '$'

  // Mutation hooks
  const [createReservation] = useMutation(CREATE_RESERVATION)
  const [updateReservation] = useMutation(UPDATE_RESERVATION)
  const [deleteReservation] = useMutation(DELETE_RESERVATION)

  // Local form state for create/edit
  const [formData, setFormData] = useState<{
    customerName: string
    email: string
    phone: string
    date: string
    time: string
    serviceId: string
    staffId: string
    duration: number | null
    price: number
    status: string
    paymentStatus: string
    notes: string
    specialRequests: string
  }>({
    customerName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    serviceId: "",
    staffId: "",
    duration: null,
    price: 0,
    status: "pending",
    paymentStatus: "pending",
    notes: "",
    specialRequests: "",
  })

  // Derived arrays of services and staff
  const services: Service[] = servicesData?.services || []
  const staffOptions: StaffMember[] = staffData?.staff || []

  // Compute filtered reservations based on search, status, date filters
  const filteredReservations: Reservation[] = useMemo(() => {
    const list: any[] = reservationsData?.reservations || []
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]
    return list.filter((reservation) => {
      // Search by customer name, email or ID
      const nameMatch = reservation.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const emailMatch = reservation.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const idMatch = reservation.id.toLowerCase().includes(searchTerm.toLowerCase())
      const serviceMatch = reservation.serviceId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const staffMatch = reservation.staffId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSearch = nameMatch || emailMatch || idMatch || serviceMatch || staffMatch
      // Status filter
      const matchesStatus = statusFilter === "all" || reservation.status === statusFilter
      // Date filter
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

  // Colour helpers for status and payment status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "in-progress":
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "refunded":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  // Handle service selection to auto-fill duration and price
  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId)
    if (service) {
      setFormData({
        ...formData,
        serviceId,
        duration: service.duration ?? null,
        price: service.price,
      })
    }
  }

  // Handle form submission for creating/updating a reservation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!salonId || !businessType) return
    try {
      if (editingReservation) {
        // update existing reservation
        await updateReservation({
          variables: {
            id: editingReservation.id,
            input: {
              businessId: salonId,
              businessType,
              customerInfo: {
                name: formData.customerName,
                email: formData.email,
                phone: formData.phone,
              },
              date: formData.date,
              time: formData.time,
              duration: formData.duration,
              serviceId: formData.serviceId,
              staffId: formData.staffId,
              status: formData.status,
              paymentStatus: formData.paymentStatus,
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
              businessId: salonId,
              businessType,
              customerInfo: {
                name: formData.customerName,
                email: formData.email,
                phone: formData.phone,
              },
              date: formData.date,
              time: formData.time,
              duration: formData.duration,
              serviceId: formData.serviceId,
              staffId: formData.staffId,
              status: formData.status,
              paymentStatus: formData.paymentStatus,
              notes: formData.notes,
              specialRequests: formData.specialRequests,
              source: "admin",
            },
          },
        })
      }
      // Refresh data and reset form
      await refetchReservations()
      setShowModal(false)
      setEditingReservation(null)
      resetForm()
    } catch (error) {
      console.error(error)
      // Optionally show error toast
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      serviceId: "",
      staffId: "",
      duration: null,
      price: 0,
      status: "pending",
      paymentStatus: "pending",
      notes: "",
      specialRequests: "",
    })
  }

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation)
    setFormData({
      customerName: reservation.customerInfo.name,
      email: reservation.customerInfo.email,
      phone: reservation.customerInfo.phone,
      date: reservation.date ? reservation.date.slice(0, 10) : "",
      time: reservation.time || "",
      serviceId: reservation.serviceId?.id || "",
      staffId: reservation.staffId?.id || "",
      duration: reservation.duration ?? reservation.serviceId?.duration ?? null,
      price: reservation.serviceId?.price || 0,
      status: reservation.status,
      paymentStatus: reservation.paymentStatus || "pending",
      notes: reservation.notes || "",
      specialRequests: reservation.specialRequests || "",
    })
    setShowModal(true)
  }

  const handleView = (reservation: Reservation) => {
    setViewingReservation(reservation)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    // Confirm deletion using a translated prompt
    if (confirm(t('deleteAppointmentConfirm'))) {
      try {
        await deleteReservation({ variables: { id } })
        await refetchReservations()
      } catch (error) {
        console.error(error)
      }
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const reservation = reservationsData?.reservations.find((r: Reservation) => r.id === id)
    if (!reservation) return
    try {
      await updateReservation({
        variables: {
          id,
          input: {
            status: newStatus,
          },
        },
      })
      await refetchReservations()
    } catch (error) {
      console.error(error)
    }
  }

  const handlePaymentStatusChange = async (id: string, newPaymentStatus: string) => {
    const reservation = reservationsData?.reservations.find((r: Reservation) => r.id === id)
    if (!reservation) return
    try {
      await updateReservation({
        variables: {
          id,
          input: {
            paymentStatus: newPaymentStatus,
          },
        },
      })
      await refetchReservations()
    } catch (error) {
      console.error(error)
    }
  }

  // Stats for summary cards
  const stats = useMemo(() => {
    const total = filteredReservations.length
    const confirmed = filteredReservations.filter((b) => b.status === "confirmed").length
    const inProgress = filteredReservations.filter((b) => b.status === "in-progress").length
    const completed = filteredReservations.filter((b) => b.status === "completed").length
    const revenue = filteredReservations.reduce((sum, b) => sum + (b.paymentStatus === "paid" ? (b.serviceId?.price || 0) : 0), 0)
    const pending = filteredReservations.filter((b) => b.paymentStatus === "pending").length
    return { total, confirmed, inProgress, completed, revenue, pending }
  }, [filteredReservations])

  // Early return for loading or error states
  if (sessionLoading || reservationsLoading || servicesLoading || staffLoading) {
    return <div className="p-6 text-gray-600">{t('loadingAppointments')}</div>
  }
  if (sessionError) {
    // Display translated session error messages
    return (
      <div className="p-6 text-red-600">
        {sessionError.toLowerCase().includes('not associated')
          ? t('notAssociatedWithSalon')
          : t('failedToLoadSession')}
      </div>
    )
  }
  if (reservationsError || servicesError || staffError) {
    return <div className="p-6 text-red-600">{t('errorLoadingData')}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('appointmentsTitle')}</h1>
          <p className="text-gray-600">{t('appointmentsSubtitle')}</p>
        </div>
        <button
          onClick={() => {
            setEditingReservation(null)
            resetForm()
            setShowModal(true)
          }}
          className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('newAppointment')}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-600">{stats.total}</p>
            <p className="text-sm text-gray-600">{t('totalLabel')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sm text-gray-600">{t('confirmed')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-sm text-gray-600">{t('inProgress')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
            <p className="text-sm text-gray-600">{t('completed')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue, currency)}</p>
            <p className="text-sm text-gray-600">{t('revenueShort')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">{t('pendingPaymentLabel')}</p>
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
                placeholder={t('searchByClientService')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">{t('allDates')}</option>
              <option value="today">{t('today')}</option>
              <option value="tomorrow">{t('tomorrow')}</option>
              <option value="week">{t('thisWeek')}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">{t('allStatus')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="confirmed">{t('confirmed')}</option>
              <option value="in-progress">{t('inProgress')}</option>
              <option value="completed">{t('completed')}</option>
              <option value="cancelled">{t('cancelled')}</option>
              <option value="no-show">{t('noShow')}</option>
            </select>
            <button className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 mr-2" />
              {t('moreFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('clientLabel')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('serviceLabel')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('stylist')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dateLabelColumn')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('timeLabel')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('statusLabelColumn')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('payment')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actionsLabel')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReservations.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium text-gray-900">{booking.customerInfo.name}</div>
                    <div className="text-gray-500 text-xs">{booking.customerInfo.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.serviceId?.name || t('na')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.staffId?.name || t('unassigned')}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.date ? booking.date.slice(0, 10) : t('na')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.time || t('na')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {t(booking.status as any)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus || "pending")}`}>
                        {t((booking.paymentStatus || 'pending') as any)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleView(booking)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" /> {t('view')}
                      </button>
                      <button
                        onClick={() => handleEdit(booking)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" /> {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> {t('delete')}
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        {editingReservation ? t('editAppointment') : t('addAppointment')}
                      </h3>
                      <div className="mt-2 space-y-4">
                        {/* Customer details */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">{t('clientName')}</label>
                          <input
                            type="text"
                            required
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('clientEmail')}</label>
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('clientPhone')}</label>
                            <input
                              type="tel"
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        {/* Service & staff selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('appointmentService')}</label>
                            <select
                              required
                              value={formData.serviceId}
                              onChange={(e) => handleServiceChange(e.target.value)}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            >
                              <option value="">{t('selectService')}</option>
                              {services.map((service) => (
                                <option key={service.id} value={service.id}>
                                  {service.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('appointmentStylist')}</label>
                            <select
                              value={formData.staffId}
                              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            >
                              <option value="">{t('unassigned')}</option>
                              {staffOptions.map((staff) => (
                                <option key={staff.id} value={staff.id}>
                                  {staff.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {/* Date & time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('appointmentDate')}</label>
                            <input
                              type="date"
                              required
                              value={formData.date}
                              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('appointmentTime')}</label>
                            <input
                              type="time"
                              required
                              value={formData.time}
                              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        {/* Duration & price (auto-filled) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('durationMinutes')}</label>
                            <input
                              type="number"
                              min="0"
                              step="15"
                              value={formData.duration ?? 0}
                              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{`${t('priceField')} (${currencySymbol})`}</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        {/* Status & payment status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('statusField')}</label>
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            >
                              <option value="pending">{t('pending')}</option>
                              <option value="confirmed">{t('confirmed')}</option>
                              <option value="in-progress">{t('inProgress')}</option>
                              <option value="completed">{t('completed')}</option>
                              <option value="cancelled">{t('cancelled')}</option>
                              <option value="no-show">{t('noShow')}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">{t('paymentStatusField')}</label>
                            <select
                              value={formData.paymentStatus}
                              onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            >
                              <option value="pending">{t('pending')}</option>
                              <option value="paid">{t('paid')}</option>
                              <option value="refunded">{t('refunded')}</option>
                            </select>
                          </div>
                        </div>
                        {/* Notes & special requests */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">{t('notesField')}</label>
                          <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">{t('specialRequestsField')}</label>
                          <textarea
                            rows={2}
                            value={formData.specialRequests}
                            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingReservation ? t('update') : t('create')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {t('cancelAction')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowViewModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {t('appointmentDetails')}
                    </h3>
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p><strong>{t('clientLabel')}:</strong> {viewingReservation.customerInfo.name}</p>
                      <p><strong>{t('clientEmail')}:</strong> {viewingReservation.customerInfo.email}</p>
                      <p><strong>{t('clientPhone')}:</strong> {viewingReservation.customerInfo.phone}</p>
                      <p><strong>{t('appointmentService')}:</strong> {viewingReservation.serviceId?.name || t('na')}</p>
                      <p><strong>{t('appointmentStylist')}:</strong> {viewingReservation.staffId?.name || t('unassigned')}</p>
                      <p><strong>{t('appointmentDate')}:</strong> {viewingReservation.date ? viewingReservation.date.slice(0, 10) : t('na')}</p>
                      <p><strong>{t('appointmentTime')}:</strong> {viewingReservation.time || t('na')}</p>
                      <p>
                        <strong>{t('durationMinutes')}:</strong> {viewingReservation.duration ?? viewingReservation.serviceId?.duration ?? t('na')}
                      </p>
                      <p><strong>{t('priceField')}:</strong> {formatCurrency(viewingReservation.serviceId?.price ?? 0, currency)}</p>
                      <p><strong>{t('statusField')}:</strong> {t(viewingReservation.status as any)}</p>
                      <p><strong>{t('paymentStatusField')}:</strong> {t((viewingReservation.paymentStatus || 'pending') as any)}</p>
                      {viewingReservation.notes && <p><strong>{t('notesField')}:</strong> {viewingReservation.notes}</p>}
                      {viewingReservation.specialRequests && <p><strong>{t('specialRequestsField')}:</strong> {viewingReservation.specialRequests}</p>}
                      <p><strong>{t('createdLabel')}:</strong> {new Date(viewingReservation.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {t('closeDialog')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}