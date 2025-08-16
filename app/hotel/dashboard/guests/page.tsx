"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { gql, useQuery, useMutation } from "@apollo/client";

/**
 * Guest management page for hotel businesses.  This page allows the hotel
 * operator to view, create, edit and delete guest profiles.  It relies on
 * session data exposed via `/api/session` to determine the current
 * `businessId` and `businessType`.
 */

// GraphQL query to fetch guests belonging to a specific business
const GET_GUESTS = gql`
  query GetGuests($businessId: ID!, $businessType: String!) {
    guests(businessId: $businessId, businessType: $businessType) {
      id
      name
      email
      phone
      membershipLevel
      status
    }
  }
`;

// Mutation to create a new guest
const CREATE_GUEST = gql`
  mutation CreateGuest($input: GuestInput!) {
    createGuest(input: $input) {
      id
      name
      email
      phone
      membershipLevel
      status
    }
  }
`;

// Mutation to update an existing guest
const UPDATE_GUEST = gql`
  mutation UpdateGuest($id: ID!, $input: GuestInput!) {
    updateGuest(id: $id, input: $input) {
      id
      name
      email
      phone
      membershipLevel
      status
    }
  }
`;

// Mutation to delete a guest
const DELETE_GUEST = gql`
  mutation DeleteGuest($id: ID!) {
    deleteGuest(id: $id)
  }
`;

interface GuestFormState {
  id?: string;
  name: string;
  email: string;
  phone: string;
  membershipLevel: string;
  status: string;
}

export default function HotelGuestsPage() {
  // Translation hook
  const { t } = useTranslation();
  // Retrieve business context from the session API
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        if (!res.ok) {
          setSessionLoading(false);
          return;
        }
        const data = await res.json();
        // Compare businessType case-insensitively.  Session stores the
        // string in lowercase (e.g. "hotel").
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setBusinessId(data.businessId);
          setBusinessType(data.businessType);
        } else {
          setSessionError(t("notAssociatedWithHotel"));
        }
      } catch (err) {
        setSessionError(t("failedToLoadSession"));
      } finally {
        setSessionLoading(false);
      }
    }
    fetchSession();
  }, []);

  // Fetch guests for the current business
  const {
    data: guestsData,
    loading: guestsLoading,
    error: guestsError,
    refetch: refetchGuests,
  } = useQuery(GET_GUESTS, {
    variables: { businessId, businessType },
    skip: !businessId || !businessType,
  });

  // Mutations
  const [createGuest] = useMutation(CREATE_GUEST);
  const [updateGuest] = useMutation(UPDATE_GUEST);
  const [deleteGuest] = useMutation(DELETE_GUEST);

  // Local state for form
  const [formState, setFormState] = useState<GuestFormState>({
    name: "",
    email: "",
    phone: "",
    membershipLevel: "Regular",
    status: "active",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setFormState({
      name: "",
      email: "",
      phone: "",
      membershipLevel: "Regular",
      status: "active",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !businessType) return;
    const input: any = {
      businessId,
      businessType,
      name: formState.name,
      email: formState.email,
      phone: formState.phone,
      membershipLevel: formState.membershipLevel,
      status: formState.status,
    };
    try {
      if (editingId) {
        await updateGuest({ variables: { id: editingId, input } });
      } else {
        await createGuest({ variables: { input } });
      }
      resetForm();
      refetchGuests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (guest: any) => {
    setEditingId(guest.id);
    setFormState({
      id: guest.id,
      name: guest.name || "",
      email: guest.email || "",
      phone: guest.phone || "",
      membershipLevel: guest.membershipLevel || "Regular",
      status: guest.status || "active",
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("deleteGuestConfirm"))) {
      await deleteGuest({ variables: { id } });
      refetchGuests();
    }
  };

  // Render loading/error states
  if (sessionLoading || guestsLoading) return <p>{t("loading")}</p>;
  if (sessionError) return <p>{sessionError}</p>;
  if (guestsError) return <p>{t("errorOccurred")}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">{t("guestManagement")}</h1>

      {/* List of guests */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t("existingGuests")}</h2>
        {guestsData?.guests && guestsData.guests.length > 0 ? (
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-sm font-medium">{t("name")}</th>
                <th className="px-4 py-2 text-left text-sm font-medium">{t("email")}</th>
                <th className="px-4 py-2 text-left text-sm font-medium">{t("phone")}</th>
                <th className="px-4 py-2 text-left text-sm font-medium">{t("membership")}</th>
                <th className="px-4 py-2 text-left text-sm font-medium">{t("statusLabel")}</th>
                <th className="px-4 py-2 text-left text-sm font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {guestsData.guests.map((guest: any) => (
                <tr key={guest.id} className="border-t">
                  <td className="px-4 py-2">{guest.name}</td>
                  <td className="px-4 py-2">{guest.email}</td>
                  <td className="px-4 py-2">{guest.phone}</td>
                  <td className="px-4 py-2">{guest.membershipLevel}</td>
                  <td className="px-4 py-2 capitalize">{t(guest.status)}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
                      onClick={() => handleEdit(guest)}
                    >
                      {t("edit")}
                    </button>
                    <button
                      className="px-2 py-1 text-sm bg-red-500 text-white rounded"
                      onClick={() => handleDelete(guest.id)}
                    >
                      {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{t("noGuestsFound")}</p>
        )}
      </section>

      {/* Form for adding/editing a guest */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          {editingId ? t("editGuest") : t("addGuest")}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">{t("name")}</label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t("email")}</label>
            <input
              type="email"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t("phone")}</label>
            <input
              type="text"
              value={formState.phone}
              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t("membershipLevel")}</label>
            <input
              type="text"
              value={formState.membershipLevel}
              onChange={(e) => setFormState({ ...formState, membershipLevel: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">{t("statusLabel")}</label>
            <select
              value={formState.status}
              onChange={(e) => setFormState({ ...formState, status: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="active">{t("active")}</option>
              <option value="inactive">{t("inactive")}</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              {editingId ? t("updateGuest") : t("createGuest")}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded"
              >
                {t("cancelAction")}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}