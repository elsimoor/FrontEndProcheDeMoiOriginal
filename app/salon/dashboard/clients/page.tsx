"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { gql, useQuery } from "@apollo/client"
import { Search, Filter, Phone, Mail, Calendar, MapPin, Plus, Edit, Trash2, X } from "lucide-react"

/**
 * Represents a derived client record aggregated from reservation data.  Because
 * the backend does not expose a standalone client/customer entity for the
 * salon module, we compute clients on the fly by grouping reservations by
 * the customer's email.  A client entry includes aggregated statistics such
 * as total visits, total amount spent, last visit date, favourite services
 * and preferred stylist.  Notes are local to the UI and not persisted.
 */
interface Client {
  id: string
  name: string
  email: string
  phone: string
  totalVisits: number
  totalSpent: number
  lastVisit: string
  favoriteServices: string[]
  preferredStylist: string
  membershipLevel: string
  status: string
  notes: string
}

export default function SalonClients() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientsData, setClientsData] = useState<Record<string, Client>>({})

  // Session state for salon context
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

  // Fetch reservations to compute client data
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
        serviceId {
          id
          name
          price
        }
        staffId {
          id
          name
        }
        paymentStatus
        createdAt
      }
    }
  `

  const { data: reservationsData, loading: reservationsLoading, error: reservationsError } = useQuery(GET_RESERVATIONS, {
    variables: { businessId: salonId, businessType },
    skip: !salonId || !businessType,
  })

  // Compute clients whenever reservations change
  useEffect(() => {
    if (!reservationsData?.reservations) return
    const aggregated: Record<string, Client> = {}
    reservationsData.reservations.forEach((res: any) => {
      const email = res.customerInfo.email
      if (!email) return
      if (!aggregated[email]) {
        aggregated[email] = {
          id: email,
          name: res.customerInfo.name,
          email: email,
          phone: res.customerInfo.phone,
          totalVisits: 0,
          totalSpent: 0,
          lastVisit: res.date,
          favoriteServices: [],
          preferredStylist: "",
          membershipLevel: "Regular",
          status: "active",
          notes: "",
        }
      }
      const client = aggregated[email]
      client.totalVisits += 1
      const price = res.serviceId?.price || 0
      // Only count paid or completed reservations as spent amount
      if (res.paymentStatus === "paid" || res.status === "completed") {
        client.totalSpent += price
      }
      // Track last visit date
      if (new Date(res.date) > new Date(client.lastVisit)) {
        client.lastVisit = res.date
      }
      // Accumulate service name counts for favourite services
      if (res.serviceId?.name) {
        client.favoriteServices.push(res.serviceId.name)
      }
      // Accumulate stylist counts
      if (res.staffId?.name) {
        client.preferredStylist = client.preferredStylist
          ? client.preferredStylist + "," + res.staffId.name
          : res.staffId.name
      }
    })
    // Post-process to compute favourites and membership levels
    Object.values(aggregated).forEach((client) => {
      // Determine favourite services by frequency
      const serviceCounts: Record<string, number> = {}
      client.favoriteServices.forEach((s) => {
        serviceCounts[s] = (serviceCounts[s] || 0) + 1
      })
      // Sort services by count desc and take top 3
      client.favoriteServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name)
      // Determine preferred stylist by frequency
      const stylistCounts: Record<string, number> = {}
      client.preferredStylist.split(",").forEach((s) => {
        if (!s) return
        stylistCounts[s] = (stylistCounts[s] || 0) + 1
      })
      const topStylist = Object.entries(stylistCounts).sort((a, b) => b[1] - a[1])[0]
      client.preferredStylist = topStylist ? topStylist[0] : ""
      // Determine membership level based on total visits
      if (client.totalVisits >= 20) {
        client.membershipLevel = "VIP"
      } else if (client.totalVisits >= 10) {
        client.membershipLevel = "Premium"
      } else {
        client.membershipLevel = "Regular"
      }
    })
    setClientsData(aggregated)
  }, [reservationsData])

  // Convert aggregated clients to array and apply filters
  const clients: Client[] = useMemo(() => {
    const list = Object.values(clientsData)
    return list.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || client.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [clientsData, searchTerm, statusFilter])

  const getMembershipColor = (level: string) => {
    switch (level) {
      case "VIP":
        return "bg-purple-100 text-purple-800"
      case "Premium":
        return "bg-yellow-100 text-yellow-800"
      case "Regular":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const resetForm = () => {
    // Reset editing form fields (notes only for now)
    if (editingClient) {
      const id = editingClient.id
      setClientsData((prev) => {
        const copy = { ...prev }
        copy[id].notes = editingClient.notes
        return copy
      })
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClient) {
      const id = editingClient.id
      setClientsData((prev) => {
        const copy = { ...prev }
        copy[id].notes = editingClient.notes
        return copy
      })
    }
    setShowModal(false)
    setEditingClient(null)
  }

  // Early return for loading or error states
  if (sessionLoading || reservationsLoading) {
    return <div className="p-6 text-gray-600">Loading clients...</div>
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>
  }
  if (reservationsError) {
    return <div className="p-6 text-red-600">Error loading reservations</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">View your salon clients and their history</p>
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
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {/* Additional filters could be added here */}
            <button className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent ($)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Favourite Services</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Stylist</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMembershipColor(client.membershipLevel)}`}>
                      {client.membershipLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.totalVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.totalSpent.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.lastVisit.slice(0, 10)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.favoriteServices.join(", ")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.preferredStylist || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </button>
                    {/* You can add delete logic if needed; for now, we don't delete aggregated clients */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Client Modal (Notes) */}
      {showModal && editingClient && (
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
                        Edit Client
                      </h3>
                      <div className="mt-2 space-y-4">
                        <p className="text-sm text-gray-600">Add or update notes for {editingClient.name}.</p>
                        <textarea
                          rows={4}
                          value={editingClient.notes}
                          onChange={(e) => {
                            const value = e.target.value
                            setEditingClient({ ...editingClient, notes: value })
                          }}
                          className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}