"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/i18n"
import { gql, useQuery, useMutation } from "@apollo/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

/**
 * Page for managing custom room types.  Hoteliers can create new room
 * categories (e.g. "Deluxe", "Family Suite") that will appear in
 * the room creation form.  Existing types are listed and can be
 * removed.  Room types are scoped per hotel and require a valid
 * session to determine the current hotel identifier.
 */

// GraphQL query to load all room types for the current hotel
const GET_ROOM_TYPES = gql`
  query GetRoomTypes($hotelId: ID!) {
    roomTypes(hotelId: $hotelId) {
      id
      name
    }
  }
`

// Mutation to create a new room type
const CREATE_ROOM_TYPE = gql`
  mutation CreateRoomType($input: RoomTypeInput!) {
    createRoomType(input: $input) {
      id
      name
    }
  }
`

// Mutation to soft delete a room type
const DELETE_ROOM_TYPE = gql`
  mutation DeleteRoomType($id: ID!) {
    deleteRoomType(id: $id)
  }
`

export default function RoomTypesPage() {
  const { t } = useTranslation();
  // Determine which hotel the user manages by reading the server
  // session.  hotelId remains null until the session is resolved.
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
        if (data.businessType && data.businessType.toLowerCase() === "hotel" && data.businessId) {
          setHotelId(data.businessId)
        } else {
          setSessionError(t("notAssociatedWithHotel"))
        }
      } catch (err) {
        setSessionError(t("failedToLoadSession"))
      } finally {
        setSessionLoading(false)
      }
    }
    fetchSession()
  }, [])

  // Fetch existing room types once the hotelId is available
  const {
    data: roomTypesData,
    loading: roomTypesLoading,
    error: roomTypesError,
    refetch: refetchRoomTypes,
  } = useQuery(GET_ROOM_TYPES, {
    variables: { hotelId },
    skip: !hotelId,
  })

  // Prepare mutations
  const [createRoomType, { loading: creating }] = useMutation(CREATE_ROOM_TYPE)
  const [deleteRoomType] = useMutation(DELETE_ROOM_TYPE)

  // Local state for the new room type name
  const [newTypeName, setNewTypeName] = useState("")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hotelId || !newTypeName.trim()) return
    try {
      await createRoomType({ variables: { input: { hotelId, name: newTypeName.trim() } } })
      setNewTypeName("")
      refetchRoomTypes()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("deleteRoomTypeConfirm"))) {
      try {
        await deleteRoomType({ variables: { id } })
        refetchRoomTypes()
      } catch (err) {
        console.error(err)
      }
    }
  }

  if (sessionLoading || roomTypesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">{t("loading")}</div>
    )
  }
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{sessionError}</div>
    )
  }
  if (roomTypesError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{t("errorOccurred")}</div>
    )
  }

  const roomTypes = roomTypesData?.roomTypes || []

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">{t("roomTypesManagement")}</h1>
        <p className="text-center text-gray-600">{t("defineRoomCategories")}</p>

        {/* Existing room types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t("existingRoomTypes")}</CardTitle>
          </CardHeader>
          <CardContent>
            {roomTypes.length > 0 ? (
              <ul className="space-y-2">
                {roomTypes.map((rt: any) => (
                  <li key={rt.id} className="flex items-center justify-between border rounded-md p-3 hover:bg-gray-50">
                    <span className="text-gray-700">{rt.name}</span>
                    <button
                      onClick={() => handleDelete(rt.id)}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                      title="Delete room type"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">{t("noRoomTypes")}</p>
            )}
          </CardContent>
        </Card>

        {/* Add new room type */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t("addNewRoomType")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-start">
              <Input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder={t("placeholderRoomType")}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={creating || !newTypeName.trim()}>
                {creating ? t("creating") : t("addRoomType")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}