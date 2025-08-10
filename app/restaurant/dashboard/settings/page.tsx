"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { gql, useQuery, useMutation } from "@apollo/client"
import { Save, Bell, CreditCard, Shield, Clock, UtensilsCrossed, Plus, Edit, Trash2, X } from "lucide-react"

// GraphQL definitions will be declared within the component

interface BusinessHours {
  id: string
  day: string
  isOpen: boolean
  openTime: string
  closeTime: string
}

interface PaymentMethod {
  id: string
  name: string
  enabled: boolean
  processingFee: number
}

interface Policy {
  id: string
  title: string
  description: string
  category: string
}

export default function RestaurantSettings() {
  const [activeTab, setActiveTab] = useState("general")
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Session state
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  // Local state for restaurant settings, business hours, payment methods and policies
  const [settings, setSettings] = useState({
    restaurantName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    currency: "",
    timezone: "",
    taxRate: "",
    serviceFee: "",
    maxPartySize: "",
    reservationWindow: "",
    cancellationHours: "",
    emailNotifications: true,
    smsNotifications: false,
    reservationConfirmations: true,
    reminderNotifications: true,
    autoConfirmReservations: false,
    allowWalkIns: true,
    dressCode: "smart-casual",
  })

  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([])
  // Payment methods are local only; they are not part of the Restaurant model
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: "1", name: "Credit Cards", enabled: true, processingFee: 2.9 },
    { id: "2", name: "Debit Cards", enabled: true, processingFee: 1.5 },
    { id: "3", name: "Cash", enabled: true, processingFee: 0 },
    { id: "4", name: "Digital Wallets", enabled: false, processingFee: 2.5 },
  ])
  const [policies, setPolicies] = useState<Policy[]>([])

  const [hoursForm, setHoursForm] = useState<Partial<BusinessHours>>({})
  const [paymentForm, setPaymentForm] = useState<Partial<PaymentMethod>>({})
  const [policyForm, setPolicyForm] = useState<Partial<Policy>>({})

  // Fetch session to obtain current restaurant ID
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          throw new Error("Failed to fetch session")
        }
        const sess = await res.json()
        setRestaurantId(sess.businessId)
      } catch (error) {
        setSessionError((error as Error).message)
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  // GraphQL query to fetch restaurant details
  const GET_RESTAURANT = gql`
    query GetRestaurant($id: ID!) {
      restaurant(id: $id) {
        id
        name
        contact {
          phone
          email
          website
        }
        settings {
          currency
          timezone
          taxRate
          serviceFee
          maxPartySize
          reservationWindow
          cancellationHours
        }
        businessHours {
          day
          isOpen
          openTime
          closeTime
        }
        policies {
          title
          description
          category
        }
        address {
          street
          city
          state
          zipCode
          country
        }
      }
    }
  `

  const UPDATE_RESTAURANT = gql`
    mutation UpdateRestaurant($id: ID!, $input: RestaurantInput!) {
      updateRestaurant(id: $id, input: $input) {
        id
        name
        contact {
          phone
          email
          website
        }
        settings {
          currency
          timezone
          taxRate
          serviceFee
          maxPartySize
          reservationWindow
          cancellationHours
        }
        businessHours {
          day
          isOpen
          openTime
          closeTime
        }
        policies {
          title
          description
          category
        }
      }
    }
  `

  // Query hook
  const {
    data,
    loading: restaurantLoading,
    error: restaurantError,
    refetch: refetchRestaurant,
  } = useQuery(GET_RESTAURANT, {
    variables: { id: restaurantId },
    skip: !restaurantId,
  })

  const [updateRestaurant] = useMutation(UPDATE_RESTAURANT, {
    onCompleted: () => {
      refetchRestaurant()
    },
  })

  // Populate local state when restaurant data is fetched
  useEffect(() => {
    if (data && data.restaurant) {
      const rest = data.restaurant
      setSettings((prev) => ({
        ...prev,
        restaurantName: rest.name || "",
        address: `${rest.address?.street || ""}, ${rest.address?.city || ""}, ${
          rest.address?.state || ""
        } ${rest.address?.zipCode || ""}`.trim(),
        phone: rest.contact?.phone || "",
        email: rest.contact?.email || "",
        website: rest.contact?.website || "",
        currency: rest.settings?.currency || "",
        timezone: rest.settings?.timezone || "",
        taxRate: rest.settings?.taxRate?.toString() || "",
        serviceFee: rest.settings?.serviceFee?.toString() || "",
        maxPartySize: rest.settings?.maxPartySize?.toString() || "",
        reservationWindow: rest.settings?.reservationWindow?.toString() || "",
        cancellationHours: rest.settings?.cancellationHours?.toString() || "",
      }))
      // Map business hours
      setBusinessHours(
        rest.businessHours?.map((bh: any, idx: number) => ({
          id: idx.toString(),
          day: bh.day,
          isOpen: bh.isOpen,
          openTime: bh.openTime || "",
          closeTime: bh.closeTime || "",
        })) || []
      )
      // Map policies
      setPolicies(
        rest.policies?.map((p: any, idx: number) => ({
          id: idx.toString(),
          title: p.title,
          description: p.description,
          category: p.category,
        })) || []
      )
    }
  }, [data])

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!restaurantId) return
    try {
      // Build the update input for the restaurant
      const input: any = {
        name: settings.restaurantName,
        contact: {
          phone: settings.phone || null,
          email: settings.email || null,
          website: settings.website || null,
        },
        settings: {
          currency: settings.currency || null,
          timezone: settings.timezone || null,
          taxRate: settings.taxRate ? parseFloat(settings.taxRate) : null,
          serviceFee: settings.serviceFee ? parseFloat(settings.serviceFee) : null,
          maxPartySize: settings.maxPartySize ? parseInt(settings.maxPartySize, 10) : null,
          reservationWindow: settings.reservationWindow ? parseInt(settings.reservationWindow, 10) : null,
          cancellationHours: settings.cancellationHours ? parseInt(settings.cancellationHours, 10) : null,
        },
        businessHours: businessHours.map(({ day, isOpen, openTime, closeTime }) => ({
          day,
          isOpen,
          openTime,
          closeTime,
        })),
        policies: policies.map(({ title, description, category }) => ({
          title,
          description,
          category,
        })),
      }
      await updateRestaurant({ variables: { id: restaurantId, input } })
      alert("Settings saved successfully!")
    } catch (error) {
      console.error(error)
      alert("Failed to save settings")
    }
  }

  // Business Hours CRUD
  const handleHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      setBusinessHours(businessHours.map((hour) => (hour.id === editingItem.id ? { ...hour, ...hoursForm } : hour)))
    } else {
      const newHour: BusinessHours = {
        id: Date.now().toString(),
        day: hoursForm.day || "",
        isOpen: hoursForm.isOpen || false,
        openTime: hoursForm.openTime || "",
        closeTime: hoursForm.closeTime || "",
      }
      setBusinessHours([...businessHours, newHour])
    }
    setShowHoursModal(false)
    setEditingItem(null)
    setHoursForm({})
  }

  const editHours = (hour: BusinessHours) => {
    setEditingItem(hour)
    setHoursForm(hour)
    setShowHoursModal(true)
  }

  const deleteHours = (id: string) => {
    if (confirm("Are you sure you want to delete this business hour?")) {
      setBusinessHours(businessHours.filter((hour) => hour.id !== id))
    }
  }

  // Payment Methods CRUD
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      setPaymentMethods(
        paymentMethods.map((method) => (method.id === editingItem.id ? { ...method, ...paymentForm } : method)),
      )
    } else {
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        name: paymentForm.name || "",
        enabled: paymentForm.enabled || false,
        processingFee: paymentForm.processingFee || 0,
      }
      setPaymentMethods([...paymentMethods, newMethod])
    }
    setShowPaymentModal(false)
    setEditingItem(null)
    setPaymentForm({})
  }

  const editPayment = (method: PaymentMethod) => {
    setEditingItem(method)
    setPaymentForm(method)
    setShowPaymentModal(true)
  }

  const deletePayment = (id: string) => {
    if (confirm("Are you sure you want to delete this payment method?")) {
      setPaymentMethods(paymentMethods.filter((method) => method.id !== id))
    }
  }

  // Policies CRUD
  const handlePolicySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      setPolicies(policies.map((policy) => (policy.id === editingItem.id ? { ...policy, ...policyForm } : policy)))
    } else {
      const newPolicy: Policy = {
        id: Date.now().toString(),
        title: policyForm.title || "",
        description: policyForm.description || "",
        category: policyForm.category || "",
      }
      setPolicies([...policies, newPolicy])
    }
    setShowPolicyModal(false)
    setEditingItem(null)
    setPolicyForm({})
  }

  const editPolicy = (policy: Policy) => {
    setEditingItem(policy)
    setPolicyForm(policy)
    setShowPolicyModal(true)
  }

  // Early return for loading or error states
  if (sessionLoading || restaurantLoading) {
    return <div className="p-6 text-gray-600">Loading settings...</div>
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>
  }
  if (restaurantError) {
    return <div className="p-6 text-red-600">Error loading restaurant settings</div>
  }

  const deletePolicy = (id: string) => {
    if (confirm("Are you sure you want to delete this policy?")) {
      setPolicies(policies.filter((policy) => policy.id !== id))
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Settings</h1>
          <p className="text-gray-600">Configure your restaurant preferences and policies</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      {/* Settings Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "general", label: "General", icon: UtensilsCrossed },
              { id: "hours", label: "Business Hours", icon: Clock },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "policies", label: "Policies", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">General Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                  <input
                    type="text"
                    value={settings.restaurantName}
                    onChange={(e) => handleInputChange("restaurantName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleInputChange("currency", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleInputChange("timezone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Operating Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Party Size</label>
                    <input
                      type="number"
                      value={settings.maxPartySize}
                      onChange={(e) => handleInputChange("maxPartySize", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reservation Window (days)</label>
                    <input
                      type="number"
                      value={settings.reservationWindow}
                      onChange={(e) => handleInputChange("reservationWindow", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Period (hours)</label>
                    <input
                      type="number"
                      value={settings.cancellationHours}
                      onChange={(e) => handleInputChange("cancellationHours", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dress Code</label>
                    <select
                      value={settings.dressCode}
                      onChange={(e) => handleInputChange("dressCode", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="casual">Casual</option>
                      <option value="smart-casual">Smart Casual</option>
                      <option value="business">Business</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Auto-confirm Reservations</h3>
                      <p className="text-sm text-gray-500">Automatically confirm new reservations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoConfirmReservations}
                        onChange={(e) => handleInputChange("autoConfirmReservations", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Allow Walk-ins</h3>
                      <p className="text-sm text-gray-500">Accept customers without reservations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allowWalkIns}
                        onChange={(e) => handleInputChange("allowWalkIns", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Hours */}
          {activeTab === "hours" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Business Hours</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setHoursForm({})
                    setShowHoursModal(true)
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hours
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {businessHours.map((hour) => (
                      <tr key={hour.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{hour.day}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              hour.isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {hour.isOpen ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : "Closed"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => editHours(hour)} className="text-red-600 hover:text-red-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => deleteHours(hour.id)} className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleInputChange("smsNotifications", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Reservation Confirmations</h3>
                    <p className="text-sm text-gray-500">Send confirmation emails for new reservations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reservationConfirmations}
                      onChange={(e) => handleInputChange("reservationConfirmations", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Reminder Notifications</h3>
                    <p className="text-sm text-gray-500">Send reminder notifications to guests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reminderNotifications}
                      onChange={(e) => handleInputChange("reminderNotifications", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setPaymentForm({})
                    setShowPaymentModal(true)
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Processing Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentMethods.map((method) => (
                      <tr key={method.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{method.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              method.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {method.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{method.processingFee}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => editPayment(method)} className="text-red-600 hover:text-red-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deletePayment(method.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Fees & Charges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.taxRate}
                      onChange={(e) => handleInputChange("taxRate", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Fee (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.serviceFee}
                      onChange={(e) => handleInputChange("serviceFee", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Policies Settings */}
          {activeTab === "policies" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Restaurant Policies</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setPolicyForm({})
                    setShowPolicyModal(true)
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Policy
                </button>
              </div>

              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{policy.title}</h3>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {policy.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{policy.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button onClick={() => editPolicy(policy)} className="text-red-600 hover:text-red-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => deletePolicy(policy.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Business Hours Modal */}
      {showHoursModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Business Hours" : "Add Business Hours"}
              </h2>
              <button onClick={() => setShowHoursModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleHoursSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  required
                  value={hoursForm.day || ""}
                  onChange={(e) => setHoursForm({ ...hoursForm, day: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={hoursForm.isOpen || false}
                  onChange={(e) => setHoursForm({ ...hoursForm, isOpen: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label className="text-sm font-medium text-gray-700">Open on this day</label>
              </div>
              {hoursForm.isOpen && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                    <input
                      type="time"
                      required
                      value={hoursForm.openTime || ""}
                      onChange={(e) => setHoursForm({ ...hoursForm, openTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                    <input
                      type="time"
                      required
                      value={hoursForm.closeTime || ""}
                      onChange={(e) => setHoursForm({ ...hoursForm, closeTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHoursModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  {editingItem ? "Update" : "Add"} Hours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Payment Method" : "Add Payment Method"}
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method Name</label>
                <input
                  type="text"
                  required
                  value={paymentForm.name || ""}
                  onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., PayPal, Apple Pay"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processing Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={paymentForm.processingFee || 0}
                  onChange={(e) => setPaymentForm({ ...paymentForm, processingFee: Number.parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={paymentForm.enabled || false}
                  onChange={(e) => setPaymentForm({ ...paymentForm, enabled: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label className="text-sm font-medium text-gray-700">Enable this payment method</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  {editingItem ? "Update" : "Add"} Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingItem ? "Edit Policy" : "Add Policy"}</h2>
              <button onClick={() => setShowPolicyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handlePolicySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Title</label>
                <input
                  type="text"
                  required
                  value={policyForm.title || ""}
                  onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Cancellation Policy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  value={policyForm.category || ""}
                  onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  <option value="Booking">Booking</option>
                  <option value="Payment">Payment</option>
                  <option value="General">General</option>
                  <option value="Safety">Safety</option>
                  <option value="Service">Service</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Description</label>
                <textarea
                  required
                  rows={4}
                  value={policyForm.description || ""}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Describe the policy in detail..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  {editingItem ? "Update" : "Add"} Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
