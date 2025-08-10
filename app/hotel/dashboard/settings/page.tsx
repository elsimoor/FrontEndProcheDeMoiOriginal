"use client"

import { useState, useEffect } from "react"
import { Save, Bell, CreditCard, Shield, Globe, Building } from "lucide-react"

// Apollo Client hooks
import { gql, useQuery, useMutation } from "@apollo/client"

/**
 * GraphQL query to fetch a single hotel by its identifier.  We request
 * basic identification, contact, address and settings information.  This
 * query is used to populate the settings form on initial load.
 */
const GET_HOTEL = gql`
  query GetHotel($id: ID!) {
    hotel(id: $id) {
      id
      name
      address {
        street
        city
        state
        zipCode
        country
      }
      contact {
        phone
        email
        website
      }
      settings {
        checkInTime
        checkOutTime
        currency
        timezone
        taxRate
        serviceFee
      }
    }
  }
`

/**
 * GraphQL mutation to update a hotel.  The input object can include nested
 * address, contact and settings fields.  We update only the fields
 * specified in the input.
 */
const UPDATE_HOTEL = gql`
  mutation UpdateHotel($id: ID!, $input: HotelInput!) {
    updateHotel(id: $id, input: $input) {
      id
    }
  }
`

export default function HotelSettings() {
  const [activeTab, setActiveTab] = useState("general")

  // Business identifier derived from the session.  See the options page for
  // details on how this state is initialised.
  const [hotelId, setHotelId] = useState<string | null>(null)
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
        // Compare businessType case‑insensitively to determine if the
        // session belongs to a hotel account.  Session stores the value in
        // lower case.
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setHotelId(data.businessId);
        } else {
          setSessionError("You are not associated with a hotel business.");
        }
      } catch (err) {
        setSessionError("Failed to load session.")
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  // Fetch the hotel details once we have a hotelId
  const {
    data: hotelData,
    loading: hotelLoading,
    error: hotelError,
    refetch: refetchHotel,
  } = useQuery(GET_HOTEL, {
    variables: { id: hotelId },
    skip: !hotelId,
  })

  // Prepare the update mutation
  const [updateHotel] = useMutation(UPDATE_HOTEL)

  // Local state for general information.  We keep the address as a single
  // string for user convenience.  When saving we will split this string
  // into a street field; other address fields are left blank.  If you
  // require full address editing you can extend this object with city,
  // state etc.
  const [general, setGeneral] = useState({
    hotelName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  })
  const [settingsState, setSettingsState] = useState({
    checkInTime: "",
    checkOutTime: "",
    currency: "",
    timezone: "",
    taxRate: "",
    serviceFee: "",
    // Additional fields not persisted to the backend can remain here
    emailNotifications: true,
    smsNotifications: false,
    bookingConfirmations: true,
    paymentReminders: true,
    acceptCreditCards: true,
    acceptDebitCards: true,
    acceptPayPal: false,
    requireDeposit: true,
    depositAmount: "",
    cancellationHours: "",
    maxGuestsPerRoom: "",
    petPolicy: "allowed",
    smokingPolicy: "no-smoking",
  })

  // Populate state when hotel data becomes available
  useEffect(() => {
    if (hotelData && hotelData.hotel) {
      const h = hotelData.hotel
      setGeneral({
        hotelName: h.name || "",
        address: h.address?.street || "",
        phone: h.contact?.phone || "",
        email: h.contact?.email || "",
        website: h.contact?.website || "",
      })
      setSettingsState((prev) => ({
        ...prev,
        checkInTime: h.settings?.checkInTime || "",
        checkOutTime: h.settings?.checkOutTime || "",
        currency: h.settings?.currency || "",
        timezone: h.settings?.timezone || "",
        taxRate: h.settings?.taxRate?.toString() || "",
        serviceFee: h.settings?.serviceFee?.toString() || "",
      }))
    }
  }, [hotelData])

  // Unified input change handler for general information
  const handleGeneralChange = (field: string, value: string) => {
    setGeneral((prev) => ({ ...prev, [field]: value }))
  }

  // Unified input change handler for settings
  const handleSettingsChange = (field: string, value: string | boolean) => {
    setSettingsState((prev: any) => ({ ...prev, [field]: value }))
  }

  // Save handler: persist changes via updateHotel mutation
  const handleSave = async () => {
    if (!hotelId) return
    const input: any = {
      name: general.hotelName,
      contact: {
        phone: general.phone,
        email: general.email,
        website: general.website,
      },
      address: {
        street: general.address,
      },
      settings: {
        checkInTime: settingsState.checkInTime,
        checkOutTime: settingsState.checkOutTime,
        currency: settingsState.currency,
        timezone: settingsState.timezone,
        taxRate: settingsState.taxRate !== "" ? parseFloat(settingsState.taxRate) : null,
        serviceFee: settingsState.serviceFee !== "" ? parseFloat(settingsState.serviceFee) : null,
      },
    }
    try {
      await updateHotel({ variables: { id: hotelId, input } })
      await refetchHotel()
      alert("Settings saved successfully!")
    } catch (err) {
      console.error(err)
      alert("Failed to save settings.")
    }
  }

  // Display loading and error states
  if (sessionLoading || hotelLoading) {
    return <div className="p-6">Loading...</div>
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>
  }
  if (hotelError) {
    return <div className="p-6 text-red-600">Failed to load hotel data.</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Settings</h1>
          <p className="text-gray-600">Configure your hotel preferences and policies</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
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
              { id: "general", label: "General", icon: Building },
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
                      ? "border-blue-500 text-blue-600"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name</label>
                  <input
                    type="text"
                    value={general.hotelName}
                    onChange={(e) => handleGeneralChange("hotelName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={general.phone}
                    onChange={(e) => handleGeneralChange("phone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={general.address}
                    onChange={(e) => handleGeneralChange("address", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={general.email}
                    onChange={(e) => handleGeneralChange("email", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={general.website}
                    onChange={(e) => handleGeneralChange("website", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Time</label>
                  <input
                    type="time"
                    value={settingsState.checkInTime}
                    onChange={(e) => handleSettingsChange("checkInTime", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Time</label>
                  <input
                    type="time"
                    value={settingsState.checkOutTime}
                    onChange={(e) => handleSettingsChange("checkOutTime", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={settingsState.currency}
                    onChange={(e) => handleSettingsChange("currency", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    value={settingsState.timezone}
                    onChange={(e) => handleSettingsChange("timezone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsState.taxRate}
                    onChange={(e) => handleSettingsChange("taxRate", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsState.serviceFee}
                    onChange={(e) => handleSettingsChange("serviceFee", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
                      checked={settingsState.emailNotifications}
                      onChange={(e) => handleSettingsChange("emailNotifications", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                      checked={settingsState.smsNotifications}
                      onChange={(e) => handleSettingsChange("smsNotifications", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Booking Confirmations</h3>
                    <p className="text-sm text-gray-500">Send confirmation emails for new bookings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsState.bookingConfirmations}
                      onChange={(e) => handleSettingsChange("bookingConfirmations", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Payment Reminders</h3>
                    <p className="text-sm text-gray-500">Send payment reminder notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsState.paymentReminders}
                      onChange={(e) => handleSettingsChange("paymentReminders", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">Credit Cards</h3>
                      <p className="text-sm text-gray-500">Accept Visa, MasterCard, American Express</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsState.acceptCreditCards}
                      onChange={(e) => handleSettingsChange("acceptCreditCards", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">Debit Cards</h3>
                      <p className="text-sm text-gray-500">Accept debit card payments</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsState.acceptDebitCards}
                      onChange={(e) => handleSettingsChange("acceptDebitCards", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">PayPal</h3>
                      <p className="text-sm text-gray-500">Accept PayPal payments</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsState.acceptPayPal}
                      onChange={(e) => handleSettingsChange("acceptPayPal", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Deposit Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Require Deposit</h4>
                      <p className="text-sm text-gray-500">Require deposit for bookings</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                      checked={settingsState.requireDeposit}
                        onChange={(e) => handleSettingsChange("requireDeposit", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount ($)</label>
                    <input
                      type="number"
                      value={settingsState.depositAmount}
                      onChange={(e) => handleSettingsChange("depositAmount", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!settingsState.requireDeposit}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Policies Settings */}
          {activeTab === "policies" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Hotel Policies</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Period (hours)</label>
                  <input
                    type="number"
                    value={settingsState.cancellationHours}
                    onChange={(e) => handleSettingsChange("cancellationHours", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests per Room</label>
                  <input
                    type="number"
                    value={settingsState.maxGuestsPerRoom}
                    onChange={(e) => handleSettingsChange("maxGuestsPerRoom", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pet Policy</label>
                  <select
                    value={settingsState.petPolicy}
                    onChange={(e) => handleSettingsChange("petPolicy", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="allowed">Pets Allowed</option>
                    <option value="not-allowed">Pets Not Allowed</option>
                    <option value="restricted">Restricted (Small pets only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Smoking Policy</label>
                  <select
                    value={settingsState.smokingPolicy}
                    onChange={(e) => handleSettingsChange("smokingPolicy", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="no-smoking">No Smoking</option>
                    <option value="designated-areas">Designated Areas Only</option>
                    <option value="smoking-rooms">Smoking Rooms Available</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
