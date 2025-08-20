"use client"

import { useState, useEffect } from "react"
import { Save, Bell, CreditCard, Shield, Globe, Building, Image as ImageIcon } from "lucide-react"

// Apollo Client hooks
import { gql, useQuery, useMutation } from "@apollo/client"

// Firebase image upload helper and UI component.  These helpers allow
// administrators to upload a profile image (logo) for their hotel.  The
// uploaded image is stored in Firebase Storage under the
// "business-logos" folder and the returned download URL is persisted
// via the GraphQL mutation.  The ImageUpload component provides a
// drag‑and‑drop file picker with preview.
import { uploadImage } from "@/app/lib/firebase"
import { ImageUpload } from "@/components/ui/ImageUpload"

// Translation hook
import useTranslation from "@/hooks/useTranslation"

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
      # Retrieve existing images so we can display the current logo and
      # persist it back if no new image is uploaded.
      images
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
  const { t } = useTranslation();
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
          setSessionError(t("notAssociatedWithHotel"));
        }
      } catch (err) {
        setSessionError(t("failedToLoadSession"))
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

  // Local state for the hotel profile image (logo).  When the
  // component mounts and the hotel data is fetched we set the
  // uploadedImage to the first image in the hotel.images array (if
  // present).  When uploading a new image we temporarily store the
  // download URL here until the save handler persists it.
  const [uploadedImage, setUploadedImage] = useState<string>("")
  const [imageUploading, setImageUploading] = useState(false)

  // Handler for uploading a new image.  Accepts a single file from
  // ImageUpload and uploads it to Firebase Storage under the
  // "business-logos" folder.  On success the returned download URL
  // replaces the current uploadedImage value.  A loading flag is
  // toggled during the upload to disable the upload button.
  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return
    setImageUploading(true)
    try {
      const url = await uploadImage(files[0], "business-logos")
      setUploadedImage(url)
    } catch (err) {
      console.error(err)
    } finally {
      setImageUploading(false)
    }
  }

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
      // Set the current logo if one exists.  We only consider the first
      // image in the array.
      if (h.images && h.images.length > 0) {
        setUploadedImage(h.images[0])
      }
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
    // If the user has uploaded a new logo, include it in the input.  The
    // images field expects an array of URLs.  We only support a single
    // image in the settings page, so we take the uploadedImage state.
    if (uploadedImage) {
      input.images = [uploadedImage]
    }
    try {
      await updateHotel({ variables: { id: hotelId, input } })
      await refetchHotel()
      alert(t("settingsSavedSuccess"))
    } catch (err) {
      console.error(err)
      alert(t("settingsSaveFailed"))
    }
  }

  // Display loading and error states
  if (sessionLoading || hotelLoading) {
    return <div className="p-6">{t("loading")}</div>
  }
  if (sessionError) {
    return <div className="p-6 text-red-600">{sessionError}</div>
  }
  if (hotelError) {
    return <div className="p-6 text-red-600">{t("failedLoadHotelData")}</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("hotelSettings")}</h1>
          <p className="text-gray-600">{t("configureHotelPreferences")}</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          {t("saveChanges")}
        </button>
      </div>

      {/* Settings Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "general", label: t("generalTab"), icon: Building },
              { id: "notifications", label: t("notificationsTab"), icon: Bell },
              { id: "payments", label: t("paymentsTab"), icon: CreditCard },
              { id: "policies", label: t("policiesTab"), icon: Shield },
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
              <h2 className="text-xl font-semibold text-gray-900">{t("generalInformation")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile image upload */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("profileImage")}</label>
                  {uploadedImage && (
                    <img src={uploadedImage} alt="Profile" className="h-20 w-20 rounded-full object-cover mb-2" />
                  )}
                  <ImageUpload onUpload={handleImageUpload} uploading={imageUploading} multiple={false} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("hotelName")}</label>
                  <input
                    type="text"
                    value={general.hotelName}
                    onChange={(e) => handleGeneralChange("hotelName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("phoneNumber")}</label>
                  <input
                    type="tel"
                    value={general.phone}
                    onChange={(e) => handleGeneralChange("phone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("addressLabel")}</label>
                  <input
                    type="text"
                    value={general.address}
                    onChange={(e) => handleGeneralChange("address", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("emailLabel")}</label>
                  <input
                    type="email"
                    value={general.email}
                    onChange={(e) => handleGeneralChange("email", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("websiteLabel")}</label>
                  <input
                    type="url"
                    value={general.website}
                    onChange={(e) => handleGeneralChange("website", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("checkInTimeLabel")}</label>
                  <input
                    type="time"
                    value={settingsState.checkInTime}
                    onChange={(e) => handleSettingsChange("checkInTime", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("checkOutTimeLabel")}</label>
                  <input
                    type="time"
                    value={settingsState.checkOutTime}
                    onChange={(e) => handleSettingsChange("checkOutTime", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("currencyLabelSetting")}</label>
                  <select
                    value={settingsState.currency}
                    onChange={(e) => handleSettingsChange("currency", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="MAD">MAD - Moroccan Dirham</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("timezoneLabel")}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("taxRatePercentage")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsState.taxRate}
                    onChange={(e) => handleSettingsChange("taxRate", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("serviceFeePercentage")}</label>
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
              <h2 className="text-xl font-semibold text-gray-900">{t("notificationPreferences")}</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{t("emailNotifications")}</h3>
                    <p className="text-sm text-gray-500">{t("emailNotificationsDesc")}</p>
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
                    <h3 className="font-medium text-gray-900">{t("smsNotifications")}</h3>
                    <p className="text-sm text-gray-500">{t("smsNotificationsDesc")}</p>
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
                    <h3 className="font-medium text-gray-900">{t("bookingConfirmationsSetting")}</h3>
                    <p className="text-sm text-gray-500">{t("bookingConfirmationsDesc")}</p>
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
                    <h3 className="font-medium text-gray-900">{t("paymentRemindersSetting")}</h3>
                    <p className="text-sm text-gray-500">{t("paymentRemindersDesc")}</p>
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
              <h2 className="text-xl font-semibold text-gray-900">{t("paymentMethods")}</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">{t("creditCards")}</h3>
                      <p className="text-sm text-gray-500">{t("creditCardsDesc")}</p>
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
                      <h3 className="font-medium text-gray-900">{t("debitCards")}</h3>
                      <p className="text-sm text-gray-500">{t("debitCardsDesc")}</p>
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
                      <h3 className="font-medium text-gray-900">{t("paypalLabel")}</h3>
                      <p className="text-sm text-gray-500">{t("paypalDesc")}</p>
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t("depositSettings")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{t("requireDeposit")}</h4>
                      <p className="text-sm text-gray-500">{t("requireDepositDesc")}</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("depositAmountLabel")}</label>
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
              <h2 className="text-xl font-semibold text-gray-900">{t("hotelPolicies")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("cancellationPeriodHours")}</label>
                  <input
                    type="number"
                    value={settingsState.cancellationHours}
                    onChange={(e) => handleSettingsChange("cancellationHours", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("maxGuestsPerRoomLabel")}</label>
                  <input
                    type="number"
                    value={settingsState.maxGuestsPerRoom}
                    onChange={(e) => handleSettingsChange("maxGuestsPerRoom", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("petPolicy")}</label>
                  <select
                    value={settingsState.petPolicy}
                    onChange={(e) => handleSettingsChange("petPolicy", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="allowed">{t("petsAllowed")}</option>
                    <option value="not-allowed">{t("petsNotAllowed")}</option>
                    <option value="restricted">{t("restrictedSmallPetsOnly")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("smokingPolicy")}</label>
                  <select
                    value={settingsState.smokingPolicy}
                    onChange={(e) => handleSettingsChange("smokingPolicy", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="no-smoking">{t("noSmoking")}</option>
                    <option value="designated-areas">{t("designatedAreasOnly")}</option>
                    <option value="smoking-rooms">{t("smokingRoomsAvailable")}</option>
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
