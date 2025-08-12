"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { gql, useMutation } from "@apollo/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// GraphQL mutations reused from the admin pages.  These create a
// business entity (hotel, restaurant or salon) and return the new
// entity’s id.  After creation the user will be updated to link
// their account to the created business.
const CREATE_HOTEL = gql`
  mutation CreateHotel($input: HotelInput!) {
    createHotel(input: $input) {
      id
      name
    }
  }
`;

const CREATE_RESTAURANT = gql`
  mutation CreateRestaurant($input: RestaurantInput!) {
    createRestaurant(input: $input) {
      id
      name
    }
  }
`;

const CREATE_SALON = gql`
  mutation CreateSalon($input: SalonInput!) {
    createSalon(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      businessId
      businessType
    }
  }
`;

/**
 * Page component that collects business details from a newly
 * registered user.  The user arrives here after completing the
 * initial sign‑up form with a selected businessType (hotel,
 * restaurant or salon).  This component renders a minimal form
 * tailored to the selected business type, creates the corresponding
 * business via GraphQL and then associates the new business with
 * the current user via an updateUser mutation.  Upon success the
 * user is redirected to a pending approval page.
 */
export default function BusinessSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Determine which type of business the user chose during sign‑up.
  const businessType = (searchParams.get("businessType") || "hotel").toLowerCase();

  // The logged in user’s id is required to call updateUser.  It is
  // fetched from the session API endpoint once on mount.
  const [userId, setUserId] = useState<string | null>(null);
  // Track loading state while waiting for mutations and session fetch.
  const [submitting, setSubmitting] = useState(false);
  // Simple form state covering common fields for all business types.
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
  });

  // Prepare GraphQL mutations.
  const [createHotel] = useMutation(CREATE_HOTEL);
  const [createRestaurant] = useMutation(CREATE_RESTAURANT);
  const [createSalon] = useMutation(CREATE_SALON);
  const [updateUser] = useMutation(UPDATE_USER);

  // Fetch the current session to extract the user id.  If no user is
  // logged in redirect back to the login page.  We rely on the
  // session API because iron‑session stores data in an httpOnly
  // cookie which is not directly accessible on the client.
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data?.isLoggedIn && data.user?.id) {
          setUserId(data.user.id);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Failed to fetch session", err);
        router.push("/login");
      }
    };
    fetchSession();
  }, [router]);

  // Generic change handler for inputs.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Submit handler creates the appropriate business and links it to
  // the current user.  Each mutation returns an id which we then use
  // when calling updateUser.  On success the user sees a pending
  // approval message.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    try {
      let serviceId: string | null = null;
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
        };
        const { data } = await createHotel({ variables: { input } });
        serviceId = data?.createHotel?.id;
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
            taxRate: formState.taxRate ? parseFloat(formState.taxRate) : null,
            serviceFee: formState.serviceFee ? parseFloat(formState.serviceFee) : null,
            maxPartySize: formState.maxPartySize ? parseInt(formState.maxPartySize, 10) : null,
            reservationWindow: formState.reservationWindow ? parseInt(formState.reservationWindow, 10) : null,
            cancellationHours: formState.cancellationHours ? parseInt(formState.cancellationHours, 10) : null,
          },
          businessHours: [],
          cuisine: [],
          priceRange: "$",
          features: [],
          policies: [],
          images: [],
        };
        const { data } = await createRestaurant({ variables: { input } });
        serviceId = data?.createRestaurant?.id;
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
            taxRate: formState.taxRate ? parseFloat(formState.taxRate) : null,
            serviceFee: formState.serviceFee ? parseFloat(formState.serviceFee) : null,
            cancellationHours: formState.cancellationHours ? parseInt(formState.cancellationHours, 10) : null,
          },
          businessHours: [],
          specialties: formState.specialties
            ? formState.specialties.split(",").map((s) => s.trim())
            : [],
          policies: [],
          images: [],
        };
        const { data } = await createSalon({ variables: { input } });
        serviceId = data?.createSalon?.id;
      }
      if (serviceId) {
        await updateUser({
          variables: {
            id: userId,
            input: {
              businessId: serviceId,
              businessType: businessType,
            },
          },
        });
        // Redirect to a pending approval page so the user cannot
        // immediately access the dashboard.  Admins can later flip
        // isActive on the business to true once the details are
        // reviewed.
        router.push("/pending-approval");
      } else {
        // If no id was returned throw an error to the UI.
        alert("Failed to create business, please try again.");
      }
    } catch (err) {
      console.error("Failed to create business", err);
      alert("An error occurred while creating your business.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Set up your {businessType.charAt(0).toUpperCase() + businessType.slice(1)}
        </h1>
        <p className="mb-8 text-gray-600">
          Please provide some basic information about your {businessType} so we can create it in the system.  A
          moderator will review your submission before you gain full access.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formState.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              type="text"
              value={formState.description}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              name="street"
              type="text"
              value={formState.street}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" type="text" value={formState.city} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input id="state" name="state" type="text" value={formState.state} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="zipCode">Zip/Postal Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              type="text"
              value={formState.zipCode}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" type="text" value={formState.country} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="text" value={formState.phone} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="email">Business Email</Label>
            <Input id="email" name="email" type="email" value={formState.email} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="text" value={formState.website} onChange={handleChange} />
          </div>

          {/* Additional fields for restaurant and salon */}
          {(businessType === "restaurant" || businessType === "salon") && (
            <>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  name="currency"
                  type="text"
                  value={formState.currency}
                  onChange={handleChange}
                  placeholder="e.g. USD"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  name="timezone"
                  type="text"
                  value={formState.timezone}
                  onChange={handleChange}
                  placeholder="e.g. UTC"
                />
              </div>
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  value={formState.taxRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="serviceFee">Service Fee</Label>
                <Input
                  id="serviceFee"
                  name="serviceFee"
                  type="number"
                  value={formState.serviceFee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="cancellationHours">Cancellation Hours</Label>
                <Input
                  id="cancellationHours"
                  name="cancellationHours"
                  type="number"
                  value={formState.cancellationHours}
                  onChange={handleChange}
                  min="0"
                  step="1"
                />
              </div>
            </>
          )}
          {businessType === "restaurant" && (
            <>
              <div>
                <Label htmlFor="maxPartySize">Max Party Size</Label>
                <Input
                  id="maxPartySize"
                  name="maxPartySize"
                  type="number"
                  value={formState.maxPartySize}
                  onChange={handleChange}
                  min="1"
                  step="1"
                />
              </div>
              <div>
                <Label htmlFor="reservationWindow">Reservation Window (days)</Label>
                <Input
                  id="reservationWindow"
                  name="reservationWindow"
                  type="number"
                  value={formState.reservationWindow}
                  onChange={handleChange}
                  min="1"
                  step="1"
                />
              </div>
            </>
          )}
          {businessType === "salon" && (
            <div>
              <Label htmlFor="specialties">Specialties (comma separated)</Label>
              <Input
                id="specialties"
                name="specialties"
                type="text"
                value={formState.specialties}
                onChange={handleChange}
                placeholder="e.g. Haircut, Massage"
              />
            </div>
          )}
          <Button type="submit" disabled={submitting || !userId} className="w-full">
            {submitting ? "Submitting..." : "Submit Business"}
          </Button>
        </form>
      </div>
    </div>
  );
}