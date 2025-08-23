"use client"

import { useState, useEffect } from "react"
import useTranslation from "@/hooks/useTranslation"
import { Save, Bell, CreditCard, Shield, Image as ImageIcon } from "lucide-react"
import { gql, useQuery, useMutation } from "@apollo/client"
// Firebase image upload helper
import { uploadImage } from "@/app/lib/firebase"
import { ImageUpload } from "@/components/ui/ImageUpload"

/**
 * Settings page for salons.
 *
 * This page mirrors the settings interface found in the hotel and restaurant
 * dashboards.  It allows salon owners to manage their basic information,
 * notification preferences, payment options, policies and upload a profile
 * image using Firebase storage.  The data is loaded from and persisted to
 * the backend via GraphQL queries and mutations.
 */

// GraphQL query to fetch a single salon.  We request the minimal set of
// fields required to populate the settings form.  Images are included so
// that an existing logo can be displayed when editing.
const GET_SALON = gql`
  query GetSalon($id: ID!) {
    salon(id: $id) {
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
        cancellationHours
      }
      address {
        street
        city
        state
        zipCode
        country
      }
      images
    }
  }
`

// GraphQL mutation to update a salon.  We reuse the existing SalonInput
// which requires a name and optional address, contact, settings and
// images arrays.  Only the fields provided will be updated.
const UPDATE_SALON = gql`
  mutation UpdateSalon($id: ID!, $input: SalonInput!) {
    updateSalon(id: $id, input: $input) {
      id
    }
  }
`

export default function SalonSettings() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("general")

  // State for the current salon id retrieved from the session.  We
  // initialize as null until the session is fetched.
  const [salonId, setSalonId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  // Local state for general information such as name, address and
  // contact details.  Address is treated as a single line; additional
  // fields can be parsed out on the server if necessary.
  const [general, setGeneral] = useState({
    salonName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  })

  // Local state for various settings and preferences.  Numerical
  // values are stored as strings in the form inputs and converted
  // to numbers when saving.  Notification and payment toggles are
  // booleans.  You can extend this object to include additional
  // salon-specific settings such as specialties or working hours.
  const [settingsState, setSettingsState] = useState({
    currency: "",
    timezone: "",
    taxRate: "",
    serviceFee: "",
    cancellationHours: "",
    emailNotifications: true,
    smsNotifications: false,
    appointmentConfirmations: true,
    reminderNotifications: true,
    acceptCreditCards: true,
    acceptDebitCards: true,
    acceptPayPal: false,
    acceptCash: true,
    requireDeposit: false,
    depositAmount: "",
    maxClientsPerSlot: "",
  })

  // State for uploading and storing the profile image URL.  When the
  // user uploads a new image via the ImageUpload component the
  // uploadedImage is set to the returned download URL.  We include
  // uploading flags to disable the upload button while the upload is in
  // progress.
  const [uploadedImage, setUploadedImage] = useState<string>("")
  const [imageUploading, setImageUploading] = useState(false)

  // Load the session to determine the current salon id.  If the
  // businessType in the session is not "salon" we display an error.
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

  // Query to fetch the salon details once we know the salonId.  The
  // skip option prevents the query from executing until salonId is
  // defined.
  const {
    data: salonData,
    loading: salonLoading,
    error: salonError,
    refetch: refetchSalon,
  } = useQuery(GET_SALON, {
    variables: { id: salonId },
    skip: !salonId,
  })

  // Mutation hook to update the salon.  After completion we refetch
  // the salon to reflect any changes.
  const [updateSalon] = useMutation(UPDATE_SALON)

  // When salon data is loaded populate local state.  We only set
  // general and settings fields that are returned from the query.
  useEffect(() => {
    if (salonData && salonData.salon) {
      const s = salonData.salon
      setGeneral({
        salonName: s.name || "",
        address: s.address?.street || "",
        phone: s.contact?.phone || "",
        email: s.contact?.email || "",
        website: s.contact?.website || "",
      })
      setSettingsState((prev) => ({
        ...prev,
        currency: s.settings?.currency || "",
        timezone: s.settings?.timezone || "",
        taxRate: s.settings?.taxRate?.toString() || "",
        serviceFee: s.settings?.serviceFee?.toString() || "",
        cancellationHours: s.settings?.cancellationHours?.toString() || "",
      }))
      // Load existing image if available
      if (s.images && s.images.length > 0) {
        setUploadedImage(s.images[0])
      }
    }
  }, [salonData])

  // Unified change handler for general fields
  const handleGeneralChange = (field: string, value: string) => {
    setGeneral((prev) => ({ ...prev, [field]: value }))
  }

  // Unified change handler for settings
  const handleSettingsChange = (field: string, value: string | boolean) => {
    setSettingsState((prev: any) => ({ ...prev, [field]: value }))
  }

  // Handle uploading of a new profile image.  Only a single file is
  // accepted.  Images are stored in the "business-logos" folder to
  // separate them from other uploads.  Once uploaded the returned
  // download URL is stored in uploadedImage.
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

  // Save handler constructs the input object and invokes the
  // updateSalon mutation.  Only include fields that have values.
  const handleSave = async () => {
    if (!salonId) return
    const input: any = {
      name: general.salonName,
      contact: {
        phone: general.phone || null,
        email: general.email || null,
        website: general.website || null,
      },
      address: {
        street: general.address || null,
      },
      settings: {
        currency: settingsState.currency || null,
        timezone: settingsState.timezone || null,
        taxRate: settingsState.taxRate !== "" ? parseFloat(settingsState.taxRate) : null,
        serviceFee: settingsState.serviceFee !== "" ? parseFloat(settingsState.serviceFee) : null,
        cancellationHours:
          settingsState.cancellationHours !== "" ? parseInt(settingsState.cancellationHours, 10) : null,
      },
    }
    // Include the image if one has been uploaded
    if (uploadedImage) {
      input.images = [uploadedImage]
    }
    try {
      await updateSalon({ variables: { id: salonId, input } })
      await refetchSalon()
      // Show translated success message
      alert(t('settingsSavedSuccess'))
    } catch (err) {
      console.error(err)
      alert(t('settingsSaveFailed'))
    }
  }

  // Render loading or error states
  if (sessionLoading || salonLoading) {
    return <div className="p-6">{t('loading')}</div>
  }
  if (sessionError) {
    // Show translated error based on known session errors
    return (
      <div className="p-6 text-red-600">
        {sessionError.includes('not associated')
          ? t('notAssociatedWithSalon')
          : t('failedToLoadSession')}
      </div>
    )
  }
  if (salonError) {
    return <div className="p-6 text-red-600">{t('failedToLoadSalonData')}</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('salonSettings')}</h1>
          <p className="text-gray-600">{t('settingsSubtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          {t('saveChanges')}
        </button>
      </div>

      {/* Settings Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "general", label: t('generalTab'), icon: ImageIcon },
              { id: "notifications", label: t('notificationsTab'), icon: Bell },
              { id: "payments", label: t('paymentsTab'), icon: CreditCard },
              { id: "policies", label: t('policiesTab'), icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? "border-pink-500 text-pink-600"
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
              <h2 className="text-xl font-semibold text-gray-900">{t('generalInformation')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Image Upload */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('profileImage')}</label>
                  {uploadedImage && (
                    <img
                      src={uploadedImage}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover mb-2"
                    />
                  )}
                  <ImageUpload onUpload={handleImageUpload} uploading={imageUploading} multiple={false} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('salonName')}</label>
                  <input
                    type="text"
                    value={general.salonName}
                    onChange={(e) => handleGeneralChange("salonName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('phoneNumber')}</label>
                  <input
                    type="tel"
                    value={general.phone}
                    onChange={(e) => handleGeneralChange("phone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('addressField')}</label>
                  <input
                    type="text"
                    value={general.address}
                    onChange={(e) => handleGeneralChange("address", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailField')}</label>
                  <input
                    type="email"
                    value={general.email}
                    onChange={(e) => handleGeneralChange("email", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('websiteField')}</label>
                  <input
                    type="url"
                    value={general.website}
                    onChange={(e) => handleGeneralChange("website", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('currencyField')}</label>
                  <select
                    value={settingsState.currency}
                    onChange={(e) => handleSettingsChange("currency", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="MAD">MAD - Moroccan Dirham</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('timezoneField')}</label>
                  <select
                    value={settingsState.timezone}
                    onChange={(e) => handleSettingsChange("timezone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('taxRate')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsState.taxRate}
                    onChange={(e) => handleSettingsChange("taxRate", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('serviceFee')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsState.serviceFee}
                    onChange={(e) => handleSettingsChange("serviceFee", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('cancellationPeriod')}</label>
                  <input
                    type="number"
                    value={settingsState.cancellationHours}
                    onChange={(e) => handleSettingsChange("cancellationHours", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('notificationPreferences')}</h2>
              <div className="space-y-4">
                {[
                  {
                    title: t('emailNotifications'),
                    description: t('emailNotificationsDesc'),
                    field: 'emailNotifications',
                  },
                  {
                    title: t('smsNotifications'),
                    description: t('smsNotificationsDesc'),
                    field: 'smsNotifications',
                  },
                  {
                    title: t('appointmentConfirmations'),
                    description: t('appointmentConfirmationsDesc'),
                    field: 'appointmentConfirmations',
                  },
                  {
                    title: t('appointmentReminders'),
                    description: t('appointmentRemindersDesc'),
                    field: 'reminderNotifications',
                  },
                ].map((item) => (
                  <div
                    key={item.field}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settingsState as any)[item.field] as boolean}
                        onChange={(e) => handleSettingsChange(item.field, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('paymentMethods')}</h2>
              <div className="space-y-4">
                {[
                  {
                    title: t('creditCards'),
                    description: t('creditCardsDesc'),
                    field: 'acceptCreditCards',
                  },
                  {
                    title: t('debitCards'),
                    description: t('debitCardsDesc'),
                    field: 'acceptDebitCards',
                  },
                  {
                    title: t('paypal'),
                    description: t('paypalDesc'),
                    field: 'acceptPayPal',
                  },
                  {
                    title: t('cash'),
                    description: t('cash'),
                    field: 'acceptCash',
                  },
                ].map((item) => (
                  <div
                    key={item.field}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settingsState as any)[item.field] as boolean}
                        onChange={(e) => handleSettingsChange(item.field, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Deposit settings */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('depositSettings')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{t('requireDeposit')}</h4>
                      <p className="text-sm text-gray-500">{t('requireDepositDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsState.requireDeposit}
                        onChange={(e) => handleSettingsChange("requireDeposit", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('depositAmount')}</label>
                    <input
                      type="number"
                      value={settingsState.depositAmount}
                      onChange={(e) => handleSettingsChange("depositAmount", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
              <h2 className="text-xl font-semibold text-gray-900">{t('salonPolicies')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('cancellationPeriod')}</label>
                  <input
                    type="number"
                    value={settingsState.cancellationHours}
                    onChange={(e) => handleSettingsChange("cancellationHours", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('maxClientsPerSlot')}</label>
                  <input
                    type="number"
                    value={settingsState.maxClientsPerSlot}
                    onChange={(e) => handleSettingsChange("maxClientsPerSlot", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('petPolicy')}</label>
                  <select
                    value={(settingsState as any).petPolicy || "no-pets"}
                    onChange={(e) => handleSettingsChange("petPolicy", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="no-pets">{t('noPets')}</option>
                    <option value="allowed">{t('petsAllowed')}</option>
                    <option value="restricted">{t('restrictedPets')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('smokingPolicy')}</label>
                  <select
                    value={(settingsState as any).smokingPolicy || "no-smoking"}
                    onChange={(e) => handleSettingsChange("smokingPolicy", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="no-smoking">{t('noSmoking')}</option>
                    <option value="designated-areas">{t('designatedAreas')}</option>
                    <option value="smoking-rooms">{t('smokingRoomsAvailable')}</option>
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