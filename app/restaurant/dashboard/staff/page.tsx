"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { gql, useQuery, useMutation } from "@apollo/client"
import { Search, Filter, Plus, Edit, Trash2, Phone, Mail, Calendar, Clock, User, X } from "lucide-react"

interface Availability {
  day: string
  startTime: string
  endTime: string
  available: boolean
}

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
  // Additional UI-only fields such as nextShift can be derived from availability
  nextShift?: string | null
}

export default function RestaurantStaff() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)

  // Session state to determine which business (restaurant) is active
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

  // GraphQL operations
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

  const {
    data,
    loading: staffLoading,
    error: staffError,
    refetch: refetchStaff,
  } = useQuery(GET_STAFF, {
    variables: { businessId, businessType },
    skip: !businessId || !businessType,
  })

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

  // Local form state
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

  // Derive staff list from GraphQL query
  const staff: StaffMember[] = data?.staff ?? []
  // Filter staff by search term, role and status
  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole =
        roleFilter === "all" || member.role.toLowerCase().includes(roleFilter.toLowerCase())
      const matchesStatus = statusFilter === "all" || member.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [staff, searchTerm, roleFilter, statusFilter])

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
      case "head chef":
        return "bg-purple-100 text-purple-800"
      case "sous chef":
        return "bg-blue-100 text-blue-800"
      case "server":
        return "bg-green-100 text-green-800"
      case "bartender":
        return "bg-orange-100 text-orange-800"
      case "kitchen assistant":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

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
      // TODO: display error message
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
    // Populate the form with the selected staff member's details
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
        // TODO: display error message
      }
    }
  }

  const openCreateModal = () => {
    setEditingStaff(null)
    resetForm()
    setShowModal(true)
  }

  const staffStats = {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    onLeave: staff.filter((s) => s.status === "on-leave").length,
    fullTime: staff.filter((s) => s.schedule === "Full-time").length,
  }

  // Early return for loading or error states
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
          <p className="text-gray-600">Manage your restaurant team and schedules</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
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
            <Calendar className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Full-time</p>
              <p className="text-2xl font-bold text-blue-600">{staffStats.fullTime}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-400" />
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
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="chef">Chef</option>
              <option value="server">Server</option>
              <option value="bartender">Bartender</option>
              <option value="kitchen">Kitchen</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={member.avatar || "/placeholder.svg"}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(member.role)}`}
                  >
                    {member.role}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}
                >
                  {member.status.replace("-", " ")}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {member.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {member.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Hired: {member.hireDate}
              </div>
              {member.nextShift && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Next shift: {member.nextShift}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Schedule</p>
                  <p className="font-medium text-gray-900">{member.schedule}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Rate</p>
                  <p className="font-medium text-gray-900">${member.hourlyRate}/hr</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button className="text-red-600 hover:text-red-700 text-sm font-medium">View Profile</button>
              <div className="flex space-x-2">
                <button onClick={() => handleEdit(member)} className="text-gray-400 hover:text-blue-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(member.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    required
                    value={formData.role || ""}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select Role</option>
                    <option value="Head Chef">Head Chef</option>
                    <option value="Sous Chef">Sous Chef</option>
                    <option value="Server">Server</option>
                    <option value="Bartender">Bartender</option>
                    <option value="Kitchen Assistant">Kitchen Assistant</option>
                    <option value="Host/Hostess">Host/Hostess</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                  <input
                    type="date"
                    required
                    value={formData.hireDate || ""}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                  <select
                    value={formData.schedule || "Full-time"}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    required
                    value={formData.hourlyRate || 15.0}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number.parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || "active"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {/* The next shift field has been removed. Scheduling is managed through availability. */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                  <input
                    type="url"
                    value={formData.avatar || ""}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
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
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  {editingStaff ? "Update" : "Add"} Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {staff
              .filter((s) => s.status === "active" && s.availability && s.availability.length > 0)
              .map((member) => {
                // Determine the next shift from the first availability entry
                const nextAvailability = member.availability?.[0]
                const nextShiftDisplay = nextAvailability
                  ? `${nextAvailability.day} ${nextAvailability.startTime}`
                  : null
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={member.avatar || "/placeholder.svg"}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{nextShiftDisplay ? nextAvailability?.startTime : "N/A"}</p>
                      <p className="text-sm text-gray-600">Start time</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
