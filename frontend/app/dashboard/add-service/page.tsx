"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { gql, useMutation } from "@apollo/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Building2, MapPin } from "lucide-react"

/**
 * Page component that allows an existing manager to add an additional service
 * (hotel, restaurant or salon) to their account.  The type of service
 * to create is specified via the `type` query parameter.  After creating
 * the new business entity a call to `appendUserService` associates it
 * with the currently logged in user without overwriting the primary
 * businessId/businessType.  Upon submission the user is redirected
 * to a pending approval page while an administrator reviews the new
 * service.
 */
export default function AddServicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Determine which type of business the user wants to add.  Fallback
  // to hotel if none provided though normally only restaurant or salon
  // will be selectable via the dashboard UI.
  const businessType = (searchParams.get("type") || "hotel").toLowerCase()

  // Logged in user id for calling appendUserService.  Loaded from the
  // session API on mount.  If the session cannot be retrieved the user
  // is redirected to login.
  const [userId, setUserId] = useState<string | null>(null)
  // Track loading state for the form submission.
  const [submitting, setSubmitting] = useState(false)
  // Form state capturing generic fields for all business types.  Additional
  // fields such as currency, timezone, taxRate, etc. are included
  // because restaurant and salon creation requires them.  The values
  // are strings and will be cast to numbers where appropriate on
  // submission.
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    // Restaurant and salon specific fields
    currency: "",
    timezone: "",
    taxRate: "",
    serviceFee: "",
    maxPartySize: "",
    reservationWindow: "",
    cancellationHours: "",
    specialties: "",
  })

  // GraphQL mutations for creating a hotel, restaurant or salon.  These
  // mutations correspond to existing schema definitions and return the
  // id of the newly created business.  Only the mutation matching
  // businessType will be executed when the user submits the form.
  const CREATE_HOTEL = gql`
    mutation CreateHotel($input: HotelInput!) {
      createHotel(input: $input) {
        id
      }
    }
  `
  const CREATE_RESTAURANT = gql`
    mutation CreateRestaurant($input: RestaurantInput!) {
      createRestaurant(input: $input) {
        id
      }
    }
  `
  const CREATE_SALON = gql`
    mutation CreateSalon($input: SalonInput!) {
      createSalon(input: $input) {
        id
      }
    }
  `
  // Mutation that appends a new service to the current user.  It
  // accepts a userId, businessId and businessType.  After execution
  // the user will have an updated services array on the backend but
  // the session is not automatically refreshed; the navigation will
  // pick up the new service after admin approval.
  const APPEND_USER_SERVICE = gql`
    mutation AppendUserService($input: AppendUserServiceInput!) {
      appendUserService(input: $input) {
        id
        services {
          businessId
          businessType
        }
      }
    }
  `

  const [createHotel] = useMutation(CREATE_HOTEL)
  const [createRestaurant] = useMutation(CREATE_RESTAURANT)
  const [createSalon] = useMutation(CREATE_SALON)
  const [appendUserService] = useMutation(APPEND_USER_SERVICE)

  // Fetch the current session to extract the user id.  If no session
  // exists the user is redirected to the login page.  This call
  // executes on mount only.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        if (data?.isLoggedIn && data.user?.id) {
          setUserId(data.user.id)
        } else {
          router.push("/login")
        }
      } catch (err) {
        console.error("Failed to fetch session", err)
        router.push("/login")
      }
    }
    fetchSession()
  }, [router])

  // Generic change handler for form inputs.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  /**
   * Submit handler that creates a new business of the specified type and
   * associates it with the current user via the appendUserService
   * mutation.  After successful completion the user is redirected to
   * the pending approval page.  Any errors encountered during the
   * process are surfaced via alerts.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSubmitting(true)
    try {
      let serviceId: string | null = null
      if (businessType === "hotel") {
        const input: any = {
          name: formState.name,
          description: formState.description || null,
          address: {
            street: formState.street || null,
            city: formState.city || null,
            state: formState.state || null,
            zipCode: formState.zipCode || null,
            country: formState.country || null,
          },
          contact: {
            phone: formState.phone || null,
            email: formState.email || null,
            website: formState.website || null,
          },
          settings: {},
          amenities: [],
          services: [],
          policies: [],
          images: [],
          openingPeriods: [],
        }
        const { data } = await createHotel({ variables: { input } })
        serviceId = data?.createHotel?.id
      } else if (businessType === "restaurant") {
        const input: any = {
          name: formState.name,
          description: formState.description || null,
          address: {
            street: formState.street || null,
            city: formState.city || null,
            state: formState.state || null,
            zipCode: formState.zipCode || null,
            country: formState.country || null,
          },
          contact: {
            phone: formState.phone || null,
            email: formState.email || null,
            website: formState.website || null,
          },
          settings: {
            currency: formState.currency || null,
            timezone: formState.timezone || null,
            taxRate: formState.taxRate ? Number.parseFloat(formState.taxRate) : null,
            serviceFee: formState.serviceFee ? Number.parseFloat(formState.serviceFee) : null,
            maxPartySize: formState.maxPartySize ? Number.parseInt(formState.maxPartySize, 10) : null,
            reservationWindow: formState.reservationWindow ? Number.parseInt(formState.reservationWindow, 10) : null,
            cancellationHours: formState.cancellationHours ? Number.parseInt(formState.cancellationHours, 10) : null,
          },
          businessHours: [],
          cuisine: [],
          priceRange: "$",
          features: [],
          policies: [],
          images: [],
        }
        const { data } = await createRestaurant({ variables: { input } })
        serviceId = data?.createRestaurant?.id
      } else if (businessType === "salon") {
        const input: any = {
          name: formState.name,
          description: formState.description || null,
          address: {
            street: formState.street || null,
            city: formState.city || null,
            state: formState.state || null,
            zipCode: formState.zipCode || null,
            country: formState.country || null,
          },
          contact: {
            phone: formState.phone || null,
            email: formState.email || null,
            website: formState.website || null,
          },
          settings: {
            currency: formState.currency || null,
            timezone: formState.timezone || null,
            taxRate: formState.taxRate ? Number.parseFloat(formState.taxRate) : null,
            serviceFee: formState.serviceFee ? Number.parseFloat(formState.serviceFee) : null,
            cancellationHours: formState.cancellationHours ? Number.parseInt(formState.cancellationHours, 10) : null,
          },
          businessHours: [],
          specialties: formState.specialties ? formState.specialties.split(",").map((s) => s.trim()) : [],
          policies: [],
          images: [],
        }
        const { data } = await createSalon({ variables: { input } })
        serviceId = data?.createSalon?.id
      }
      if (serviceId) {
        // Associate the new service with the current user without
        // overwriting their primary business association.
        // Associate the new service with the current user on the backend
        await appendUserService({
          variables: {
            input: {
              userId: userId,
              businessId: serviceId,
              businessType: businessType,
            },
          },
        })
        // Immediately push the newly created service into the session so
        // that the dashboard switcher displays its icon even before
        // approval.  We do not switch the active business here; this
        // endpoint only appends to the services array in the session.
        try {
          await fetch('/api/add-service-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessType: businessType.toLowerCase(), businessId: serviceId }),
          })
        } catch (err) {
          console.error('Failed to update session with new service', err)
        }
        // Redirect to pending approval page.  Once the admin approves
        // the new service the user can navigate between dashboards.
        router.push("/pending-approval")
      } else {
        alert("Failed to create business, please try again.")
      }
    } catch (err) {
      console.error("Failed to create business", err)
      alert("An error occurred while creating your business.")
    } finally {
      setSubmitting(false)
    }
  }

  // Determine colours for the UI based on the selected business type.  These
  // values mirror those used in the registration flow to maintain a
  // consistent look and feel across the application.
  const getBusinessColors = (type: string) => {
    switch (type) {
      case "hotel":
        return {
          primary: "#1e40af", // blue-800
          light: "#3b82f6", // blue-500
          gradient: "from-slate-50 via-blue-50 to-indigo-50",
          focus: "focus:border-blue-500 focus:ring-blue-500",
          button: "bg-blue-600 hover:bg-blue-700",
        }
      case "restaurant":
        return {
          primary: "#991b1b", // red-800
          light: "#dc2626", // red-600
          gradient: "from-slate-50 via-red-50 to-rose-50",
          focus: "focus:border-red-500 focus:ring-red-500",
          button: "bg-red-700 hover:bg-red-800",
        }
      case "salon":
        return {
          primary: "#9d174d", // pink-800
          light: "#e11d48", // pink-600
          gradient: "from-slate-50 via-pink-50 to-rose-50",
          focus: "focus:border-pink-500 focus:ring-pink-500",
          button: "bg-pink-700 hover:bg-pink-800",
        }
      default:
        return {
          primary: "#1e40af",
          light: "#3b82f6",
          gradient: "from-slate-50 via-blue-50 to-indigo-50",
          focus: "focus:border-blue-500 focus:ring-blue-500",
          button: "bg-blue-600 hover:bg-blue-700",
        }
    }
  }

  const colors = getBusinessColors(businessType)

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.gradient} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-2xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Add a {businessType.charAt(0).toUpperCase() + businessType.slice(1)}
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Provide some basic information about your {businessType} so we can create it in the system. A moderator will
            review your submission before you gain full access.
          </p>
        </div>
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl text-gray-900">Service Information</CardTitle>
            <CardDescription className="text-gray-600">
              Fill out the details below to add your {businessType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5" style={{ color: colors.primary }} />
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Service Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formState.name}
                      onChange={handleChange}
                      required
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder={`Enter your ${businessType} name`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      type="text"
                      value={formState.description}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder={`Brief description of your ${businessType}`}
                    />
                  </div>
                </div>
              </div>
              {/* Address Section */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                  <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                      Street Address
                    </Label>
                    <Input
                      id="street"
                      name="street"
                      type="text"
                      value={formState.street}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      value={formState.city}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                      State/Province
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      value={formState.state}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                      Zip/Postal Code
                    </Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      type="text"
                      value={formState.zipCode}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="Zip/Postal Code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      value={formState.country}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
              {/* Contact Section */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="text"
                      value={formState.phone}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Business Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formState.email}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="Business email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                      Website
                    </Label>
                    <Input
                      id="website"
                      name="website"
                      type="text"
                      value={formState.website}
                      onChange={handleChange}
                      className={`mt-1 border-gray-300 ${colors.focus}`}
                      placeholder="Website"
                    />
                  </div>
                </div>
              </div>
              {/* Additional fields for restaurant and salon */}
              {(businessType === "restaurant" || businessType === "salon") && (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                        Currency
                      </Label>
                        <Input
                          id="currency"
                          name="currency"
                          type="text"
                          value={formState.currency}
                          onChange={handleChange}
                          className={`mt-1 border-gray-300 ${colors.focus}`}
                          placeholder="e.g. USD"
                        />
                    </div>
                    <div>
                      <Label htmlFor="timezone" className="text-sm font-medium text-gray-700">
                        Timezone
                      </Label>
                      <Input
                        id="timezone"
                        name="timezone"
                        type="text"
                        value={formState.timezone}
                        onChange={handleChange}
                        className={`mt-1 border-gray-300 ${colors.focus}`}
                        placeholder="Timezone"
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxRate" className="text-sm font-medium text-gray-700">
                        Tax Rate
                      </Label>
                      <Input
                        id="taxRate"
                        name="taxRate"
                        type="text"
                        value={formState.taxRate}
                        onChange={handleChange}
                        className={`mt-1 border-gray-300 ${colors.focus}`}
                        placeholder="e.g. 15"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceFee" className="text-sm font-medium text-gray-700">
                        Service Fee
                      </Label>
                      <Input
                        id="serviceFee"
                        name="serviceFee"
                        type="text"
                        value={formState.serviceFee}
                        onChange={handleChange}
                        className={`mt-1 border-gray-300 ${colors.focus}`}
                        placeholder="e.g. 5"
                      />
                    </div>
                    {businessType === "restaurant" && (
                      <>
                        <div>
                          <Label htmlFor="maxPartySize" className="text-sm font-medium text-gray-700">
                            Max Party Size
                          </Label>
                          <Input
                            id="maxPartySize"
                            name="maxPartySize"
                            type="text"
                            value={formState.maxPartySize}
                            onChange={handleChange}
                            className={`mt-1 border-gray-300 ${colors.focus}`}
                            placeholder="Number of guests"
                          />
                        </div>
                        <div>
                          <Label htmlFor="reservationWindow" className="text-sm font-medium text-gray-700">
                            Reservation Window
                          </Label>
                          <Input
                            id="reservationWindow"
                            name="reservationWindow"
                            type="text"
                            value={formState.reservationWindow}
                            onChange={handleChange}
                            className={`mt-1 border-gray-300 ${colors.focus}`}
                            placeholder="Hours"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cancellationHours" className="text-sm font-medium text-gray-700">
                            Cancellation Hours
                          </Label>
                          <Input
                            id="cancellationHours"
                            name="cancellationHours"
                            type="text"
                            value={formState.cancellationHours}
                            onChange={handleChange}
                            className={`mt-1 border-gray-300 ${colors.focus}`}
                            placeholder="Hours"
                          />
                        </div>
                      </>
                    )}
                    {businessType === "salon" && (
                      <div className="md:col-span-2">
                        <Label htmlFor="specialties" className="text-sm font-medium text-gray-700">
                          Specialties (comma separated)
                        </Label>
                        <Input
                          id="specialties"
                          name="specialties"
                          type="text"
                          value={formState.specialties}
                          onChange={handleChange}
                          className={`mt-1 border-gray-300 ${colors.focus}`}
                          placeholder="e.g. Haircut, Spa, Massage"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="pt-6">
                <Button type="submit" disabled={submitting} className={colors.button}>
                  {submitting ? "Submitting..." : `Create ${businessType.charAt(0).toUpperCase() + businessType.slice(1)}`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}