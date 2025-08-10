"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { gql, useQuery, useMutation } from "@apollo/client"
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  X,
} from "lucide-react"

/**
 * Availability structure as returned by the backend for a staff member.  A staff
 * member can specify availability per day with start and end times and a
 * boolean indicating whether they are available.  This type mirrors the
 * backend `Availability` type.
 */
interface Availability {
  day: string
  startTime: string
  endTime: string
  available: boolean
}

/**
 * The StaffMember interface matches the GraphQL `Staff` type.  Additional
 * optional properties such as `nextShift` can be derived on the frontend for
 * display purposes only.
 */
interface StaffMember {
  id: string
  businessId: string
  businessType: string
  userId?: string | null
  name: string
  role: string
  email?: string | null
  phone?: string | null
  hireDate?: string | null
  schedule?: string | null
  hourlyRate?: number | null
  status: string
  specialties?: string[]
  availability?: Availability[]
  avatar?: string | null
  notes?: string | null
  nextShift?: string | null
}

export default function SalonStaff() {
  // Filters and modal state
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  // Session state: determine which business (salon) is active
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          throw new Error("Failed to fetch session")
        }
        const sess = await res.json()
        setBusinessId(sess.businessId)
        setBusinessType(sess.businessType)
      } catch (error) {
        setSessionError((error as Error).message)
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  // GraphQL operations for staff management
  const GET_STAFF = gql`
    query GetStaff($businessId: ID!, $businessType: String!) {
      staff(businessId: $businessId, businessType: $businessType) {
        id
        businessId
        businessType
        name
        role
        email
        phone
        hireDate
        schedule
        hourlyRate
        status
        avatar
        specialties
        availability {
          day
          startTime
          endTime
          available
        }
      }
    }
  `

  const CREATE_STAFF = gql`
    mutation CreateStaff($input: StaffInput!) {
      createStaff(input: $input) {
        id
        name
        role
        email
        phone
        hireDate
        schedule
        hourlyRate
        status
        avatar
        specialties
        availability {
          day
          startTime
          endTime
          available
        }
      }
    }
  `

  const UPDATE_STAFF = gql`
    mutation UpdateStaff($id: ID!, $input: StaffInput!) {
      updateStaff(id: $id, input: $input) {
        id
        name
        role
        email
        phone
        hireDate
        schedule
        hourlyRate
        status
        avatar
        specialties
        availability {
          day
          startTime
          endTime
          available
        }
      }
    }
  `

  const DELETE_STAFF = gql`
    mutation DeleteStaff($id: ID!) {
      deleteStaff(id: $id)
    }
  `

  // Query hook for fetching staff.  Skip if the session hasn't yet provided businessId/businessType.
  const {
    data,
    loading: staffLoading,
    error: staffError,
    refetch: refetchStaff,
  } = useQuery(GET_STAFF, {
    variables: { businessId, businessType },
    skip: !businessId || !businessType,
  })

  // Mutation hooks for CRUD operations.  Refetch staff list on completion.
  const [createStaff] = useMutation(CREATE_STAFF, {
    onCompleted: () => {
      refetchStaff()
    },
  })
  const [updateStaff] = useMutation(UPDATE_STAFF, {
    onCompleted: () => {
      refetchStaff()
    },
  })
  const [deleteStaff] = useMutation(DELETE_STAFF, {
    onCompleted: () => {
      refetchStaff()
    },
  })

  // Local form state used to capture new or edited staff details
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: "",
    role: "",
    email: "",
    phone: "",
    status: "active",
    hireDate: "",
    schedule: "Full-time",
    hourlyRate: 15.0,
    avatar: "",
    specialties: [],
    availability: [],
  })

  // Derived list of staff from GraphQL data
  const staff: StaffMember[] = data?.staff ?? []

  // Filter staff by search term, role, and status.  Use useMemo for performance.
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || member.role.toLowerCase().includes(roleFilter.toLowerCase())
      const matchesStatus = statusFilter === "all" || member.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [staff, searchTerm, roleFilter, statusFilter])

  // Helpers to map status and role to tailwind colours
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "on-leave":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "senior hair stylist":
        return "bg-purple-100 text-purple-800"
      case "hair colorist":
        return "bg-blue-100 text-blue-800"
      case "esthetician":
        return "bg-green-100 text-green-800"
      case "nail technician":
        return "bg-pink-100 text-pink-800"
      case "massage therapist":
        return "bg-orange-100 text-orange-800"
      case "barber":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Form submission for creating or updating a staff member
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId || !businessType) return
    try {
      if (editingStaff) {
        await updateStaff({
          variables: {
            id: editingStaff.id,
            input: {
              businessId,
              businessType,
              name: formData.name,
              role: formData.role,
              email: formData.email,
              phone: formData.phone,
              hireDate: formData.hireDate,
              schedule: formData.schedule,
              hourlyRate: formData.hourlyRate,
              status: formData.status,
              specialties: [],
              availability: [],
              avatar: formData.avatar,
              notes: null,
            },
          },
        })
      } else {
        await createStaff({
          variables: {
            input: {
              businessId,
              businessType,
              name: formData.name,
              role: formData.role,
              email: formData.email,
              phone: formData.phone,
              hireDate: formData.hireDate,
              schedule: formData.schedule,
              hourlyRate: formData.hourlyRate,
              status: formData.status,
              specialties: [],
              availability: [],
              avatar: formData.avatar,
              notes: null,
            },
          },
        })
      }
      setShowModal(false)
      setEditingStaff(null)
      resetForm()
    } catch (error) {
      console.error(error)
      // Optionally show an error toast
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      email: "",
      phone: "",
      status: "active",
      hireDate: "",
      schedule: "Full-time",
      hourlyRate: 15.0,
      avatar: "",
      specialties: [],
      availability: [],
    })
  }

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member)
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email || "",
      phone: member.phone || "",
      status: member.status,
      hireDate: member.hireDate || "",
      schedule: member.schedule || "Full-time",
      hourlyRate: member.hourlyRate || 0,
      avatar: member.avatar || "",
      specialties: member.specialties || [],
      availability: member.availability || [],
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        await deleteStaff({ variables: { id } })
      } catch (error) {
        console.error(error)
      }
    }
  }

  const openCreateModal = () => {
    setEditingStaff(null)
    resetForm()
    setShowModal(true)
  }

  // Compute some summary statistics for the staff list
  const staffStats = {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    onLeave: staff.filter((s) => s.status === "on-leave").length,
    fullTime: staff.filter((s) => s.schedule === "Full-time").length,
  }

  // Display loading or error messages early
  if (sessionLoading || staffLoading) {
    return <div className="p-6 text-gray-600">Loading staff...</div>
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>
  }
  if (staffError) {
    return <div className="p-6 text-red-600">Error loading staff</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage your salon team and schedules</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{staffStats.total}</p>
            </div>
            <User className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{staffStats.active}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-yellow-600">{staffStats.onLeave}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Full Time</p>
              <p className="text-2xl font-bold text-purple-600">{staffStats.fullTime}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            </div>
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
                placeholder="Search by name, role, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="senior">Senior</option>
              <option value="hair">Hair</option>
              <option value="color">Color</option>
              <option value="esthetician">Esthetician</option>
              <option value="nail">Nail</option>
              <option value="massage">Massage</option>
              <option value="barber">Barber</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {member.avatar ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={member.avatar} alt={member.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email || "N/A"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      {member.phone && (
                        <a href={`tel:${member.phone}`} className="flex items-center text-blue-600 hover:underline">
                          <Phone className="h-4 w-4 mr-1" />
                          {member.phone}
                        </a>
                      )}
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="flex items-center text-blue-600 hover:underline">
                          <Mail className="h-4 w-4 mr-1" />
                          {member.email}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.schedule || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(member)}
                      className="text-blue-600 hover:text-blue-900 mr-3 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-900 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
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
                        {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
                      </h3>
                      <div className="mt-2 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            required
                            value={formData.name || ""}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Role</label>
                          <input
                            type="text"
                            required
                            value={formData.role || ""}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                              type="email"
                              value={formData.email || ""}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input
                              type="tel"
                              value={formData.phone || ""}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                            <input
                              type="date"
                              value={formData.hireDate || ""}
                              onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Schedule</label>
                            <select
                              value={formData.schedule || "Full-time"}
                              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            >
                              <option value="Full-time">Full-time</option>
                              <option value="Part-time">Part-time</option>
                              <option value="Contract">Contract</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.hourlyRate ?? 0}
                              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                              value={formData.status || "active"}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            >
                              <option value="active">Active</option>
                              <option value="on-leave">On Leave</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
                          <input
                            type="text"
                            value={formData.avatar || ""}
                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
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
                    {editingStaff ? "Update" : "Create"}
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